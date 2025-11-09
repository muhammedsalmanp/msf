import Unit from '../../models/Unit.js';
import Role from '../../models/Role.js';
import Program from '../../models/Program.js';
import User from '../../models/User.js';
import PanchayathJourney from '../../models/PanchayathJourney.js';
import bcrypt from 'bcrypt';
import { uploadFileToS3, deleteFileFromS3 } from '../../config/awsS3Helper.js';


 //============ unit Condroler =================
export const addUnit = async (req, res) => {
  try {
    const { name } = req.body;
    console.log(name);

    if (!name) return res.status(400).json({ message: 'Unit name is required' });

    const exists = await Unit.findOne({ name });
    if (exists) return res.status(409).json({ message: 'Unit already exists' });

    const unit = await Unit.create({ name });
    res.status(201).json(unit);
  } catch (err) {
    res.status(500).json({ message: 'Server error while adding unit' });
  }
};

export const getunits = async (req, res) => {
  try {
    const units = await Unit.find().select('name');

    if (!units.length) {
      return res.status(404).json({ message: 'No units found' });
    }
    res.json(units);
  } catch (err) {
    console.error('Error fetching units:', err);
    res.status(500).json({ message: 'Failed to fetch units' });
  }
};

//============  userController============

export const addAdminMember = async (req, res) => {
  try {
    // 1️⃣
    const { name, gender, username, unit } = req.body;

    // 2️⃣
    // Check if user already exists by username
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: "Username already taken" });
    }

    let roles = [];
    if (req.body.roles) {
      try {
        roles =
          typeof req.body.roles === "string"
            ? JSON.parse(req.body.roles)
            : req.body.roles;

        roles = roles.filter(
          (r) =>
            r.role &&
            r.scope &&
            ["unit", "main", "haritha"].includes(r.scope)
        );

        for (const r of roles) {
          const roleExists = await Role.findById(r.role);
          if (!roleExists) {
            return res
              .status(400)
              .json({ message: `Invalid role ID: ${r.role}` });
          }

          if (gender.toLowerCase() === "male" && r.scope === "haritha") {
            return res.status(400).json({
              message: `❌ Males cannot be assigned roles in Haritha Committee.`,
            });
          }

          // 3️⃣ Unique main committee roles
          if (
            r.scope === "main" &&
            ["President", "Secretary", "Treasurer"].includes(roleExists.title)
          ) {
            const existingRoleUser = await User.findOne({
              "roles.role": r.role,
              "roles.scope": "main",
              "gender": gender.toLowerCase(),
            });

            if (existingRoleUser) {
              return res.status(400).json({
                message: `❌ A user already holds the ${roleExists.title} role in Panchayat Committee.`,
              });
            }
          }

          if (r.scope !== "main") {
            const unitData = await Unit.findById(unit);
            if (!unitData) {
              return res.status(404).json({ message: "Unit not found" });
            }

            // Pick committee based on gender
            const committee =
              gender.toLowerCase() === "female"
                ? "harithaCommittee"
                : "msfCommittee";

            if (
              ["President", "Secretary", "Treasurer"].includes(roleExists.title)
            ) {
              const key = roleExists.title.toLowerCase();
              if (unitData[committee]?.[key]) {
                return res.status(400).json({
                  message: `❌ The role ${roleExists.title} is already assigned in the ${committee} of this unit.`,
                });
              }
            }
          }
        }
      } catch (err) {
        console.log("Role parsing error:", err);
        return res.status(400).json({ message: "Invalid roles format" });
      }
    }

    // 4️⃣ Create user's password based on username (e.g., "johndoe" -> "JOHN@msf")
    const firstFour = username.substring(0, 4).toUpperCase();
    const defaultPassword = `${firstFour}@msf`;
    const hashedPassword = await bcrypt.hash(defaultPassword, 10); // Hashing the default password

    // 5️⃣ Create user
    let profileImageUrl = "";
    if (req.file) {
      const { url } = await uploadFileToS3(`profile/`, req.file);
      profileImageUrl = url;
    } else {
      return res
        .status(400)
        .json({ message: "Profile image is required" });
    }

    // --- NEW: Generate a random dummy phone number ---
    const randomDigits = Math.floor(Math.random() * 10000000)
      .toString()
      .padStart(7, "0");
    const dummyPhone = `+91000${randomDigits}`;
    // -------------------------------------------------

    // 6️⃣ --- UPDATED: Added 'phone' field ---
    const user = await User.create({
      name,
      gender,
      username,
      phone: dummyPhone, 
      password: hashedPassword,
      profileImage: profileImageUrl,
      unit,
      roles,
      inChargeOfUnits: [],
      isVerified: true,
      addedByAdmin: true,
    });
    // -----------------------------------------

    // 7️⃣ Assign user into committee
    if (roles.length > 0) {
      const unitData = await Unit.findById(unit);

      // Choose correct committee
      const committee =
        gender.toLowerCase() === "female"
          ? "harithaCommittee"
          : "msfCommittee";

      for (const r of roles) {
        const roleExists = await Role.findById(r.role);

        if (["President", "Secretary", "Treasurer"].includes(roleExists.title)) {
          const key = roleExists.title.toLowerCase();
          unitData[committee][key] = user._id;
        }

        if (roleExists.title === "Vice President") {
          if (!unitData[committee].vicePresidents.includes(user._id)) {
            unitData[committee].vicePresidents.push(user._id);
          }
        }

        if (roleExists.title === "Joint Secretary") {
          if (!unitData[committee].jointSecretaries.includes(user._id)) {
            unitData[committee].jointSecretaries.push(user._id);
          }
        }
      }

      await unitData.save();
    }

    res.status(201).json(user);
  } catch (err) {
    console.error("❌ Error in addAdminMember:", err);
    res.status(500).json({ message: "Server error while adding member" });
  }
};

export const getAllMembers = async (req, res) => {
  try {
    const users = await User.find()
      .populate('roles.role', 'title')
      .populate('inChargeOfUnits', 'name')
      .select('-password');

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching members:', error);
    res.status(500).json({ message: 'Failed to fetch members' });
  }
};

export const getAllMSFTeamMembers = async (req, res) => {
  try {
    const users = await User.find({
      gender: "male",
      roles: { $elemMatch: { scope: 'main' } }
    })
      .populate('roles.role', 'title')
      .populate('inChargeOfUnits', 'name')
      .populate('unit', 'name')
      .select('name gender username phone profileImage roles inChargeOfUnits homeUnit isVerified');

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching main team members:', error);
    res.status(500).json({ message: 'Failed to fetch main team members' });
  }
};

export const getAllTeam = async (req,res)=>{
   try {
    const users = await User.find({
      roles: { $elemMatch: { scope: 'main' } }
    })
      .populate('roles.role', 'title')
      .populate('unit', 'name')
      .select('name gender profileImage roles unit');
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching main team members:', error);
    res.status(500).json({ message: 'Failed to fetch main team members' });
  }
}

export const getAllHrithaTeamMembers = async (req, res) => {
  try {
    const users = await User.find({
      gender: "female",
      roles: { $elemMatch: { scope: 'main' } }
    })
      .populate('roles.role', 'title')
      .populate('inChargeOfUnits', 'name')
      .populate('unit', 'name')
      .select('name gender username profileImage roles inChargeOfUnits homeUnit isVerified');

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching haritha team members:', error);
    res.status(500).json({ message: 'Failed to fetch haritha team members' });
  }
};


//=================journeyController==========

export const getJourney = async (req, res) => {
  try {
    const journey = await PanchayathJourney.find(); // Find all journeys
    if (!journey.length) {
      return res.status(404).json({ message: "No journey found" });
    }

    // Map journeys to return only required details
    const simplifiedJourneys = journey.map((journeyItem) => {
      return {
        _id: journeyItem._id,
        title: journeyItem.title,
        description: journeyItem.description,
        date: journeyItem.date,
        images: journeyItem.images.length > 0 ? [journeyItem.images[0]] : [], // Only return the first image if available
      };
    });

    res.json(simplifiedJourneys);
  } catch (error) {
    console.log("Error fetching journey:", error);
    res.status(500).json({ message: 'Failed to fetch journey' });
  }
};

export const getJourneyById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);

    // Validate the ObjectId format
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ message: 'Invalid journey ID' });
    }

    const journey = await PanchayathJourney.findById(id); // Find journey by ID
    if (!journey) {
      return res.status(404).json({ message: "Journey not found" });
    }

    // Return the journey details (including all images in the array)
    res.json({
      title: journey.title,
      description: journey.description,
      date: journey.date,
      images: journey.images || [], // Return images array (if available)
    });
  } catch (error) {
    console.error("Error fetching journey:", error);
    res.status(500).json({ message: 'Failed to fetch journey' });
  }
};

export const addJourney = async (req, res) => {
  try {
    const { name, description, date } = req.body;
    const imageUrls = [];

    // Loop through each uploaded file and upload it to S3
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const { url } = await uploadFileToS3('journeys/', file); // Upload to S3 and get the URL
      imageUrls.push(url); // Store the URL in an array
    }

    // Create a new journey entry
    const newJourney = new PanchayathJourney({
      title: name,
      description,
      date,
      images: imageUrls, // Save all the image URLs to the database
    });

    await newJourney.save();
    res.status(201).json({ message: 'Journey added successfully' });
  } catch (error) {
    console.error("Error adding journey:", error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteJourney = async (req, res) => {
  try {
    const { id } = req.params;

    const journey = await PanchayathJourney.findById(id);
    if (!journey) {
      return res.status(404).json({ message: 'Journey not found' });
    }

    // Delete images from S3
    for (const imageUrl of journey.images) {
      const imageKey = imageUrl.split('.amazonaws.com/').pop();
      await deleteFileFromS3(imageKey);
    }

    // Delete the journey from MongoDB
    await PanchayathJourney.findByIdAndDelete(id);

    // Send success response
    res.status(200).json({ message: 'Journey and images deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete journey and images' });
  }
};



//================roleController==================

export const addRole = async (req, res) => {
  try {
    const { title } = req.body;
    console.log(title);

    if (!title) return res.status(400).json({ message: 'Role title is required' });

    const exists = await Role.findOne({ title });
    if (exists) return res.status(409).json({ message: 'Role already exists' });

    const role = await Role.create({ title });
    res.status(201).json(role);
  } catch (err) {
    res.status(500).json({ message: 'Server error while adding role' });
  }
};

export const getRole = async (req, res) => {
  try {
    const roles = await Role.find().select('title'); // Only return 'title' and '_id'
    if (!roles.length) {
      return res.status(404).json({ message: 'No roles found' });
    }
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Failed to fetch roles' });
  }
};


//================programController==================

export const addProgram = async (req, res) => {
  try {
    const { title } = req.body;
    console.log(title);

    if (!title) return res.status(400).json({ message: 'Program title is required' });

    const exists = await Program.findOne({ title });
    if (exists) return res.status(409).json({ message: 'Program already exists' });

    const program = await Program.create({ title });
    res.status(201).json(program);
  } catch (err) {
    res.status(500).json({ message: 'Server error while adding program' });
  }
};


