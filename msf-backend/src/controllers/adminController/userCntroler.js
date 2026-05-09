import User from "../../models/User.js";
import Unit from "../../models/Unit.js";
import Role from "../../models/Role.js";
import bcrypt from 'bcrypt';
import { deleteFileFromS3 } from '../../config/awsS3Helper.js';

export const getMemberDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate('roles.role');

    if (!user) {
      return res.status(404).json({ message: "Member not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("❌ Error in getMemberDetails:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateAdminMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, gender, username, unit } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 1️⃣ Check if username is being changed and if it's taken
    if (username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(409).json({ message: "Username already taken" });
      }
    }

    // 2️⃣ --- COMPLEX: We must remove old roles from the Unit model ---
    // This is to prevent conflicts (e.g., if user changes from President to Secretary)
    const oldUnit = await Unit.findById(user.unit);
    if (oldUnit) {
      const oldCommittee = user.gender === "female" ? "harithaCommittee" : "msfCommittee";

      for (const r of user.roles) {
        const roleData = await Role.findById(r.role);
        if (roleData) {
          const title = roleData.title;
          if (["President", "Secretary", "Treasurer"].includes(title)) {
            const key = title.toLowerCase();
            if (oldUnit[oldCommittee][key]?.equals(user._id)) {
              oldUnit[oldCommittee][key] = null;
            }
          }
          if (title === "Vice President") {
            oldUnit[oldCommittee].vicePresidents.pull(user._id);
          }
          if (title === "Joint Secretary") {
            oldUnit[oldCommittee].jointSecretaries.pull(user._id);
          }
        }
      }
      await oldUnit.save();
    }

    // 3️⃣ Parse and validate new roles
    let newRoles = [];
    if (req.body.roles) {
      newRoles = JSON.parse(req.body.roles);
      // ... (Add your validation logic from addAdminMember here if needed) ...
    }

    // 4️⃣ Handle new image upload
    let profileImageUrl = user.profileImage;
    let profileImageKey = user.profileImageKey;

    if (req.file) {
      // Delete old image from S3 if it exists
      if (user.profileImageKey) {
        await deleteFileFromS3(user.profileImageKey);
      }

      // Upload new one
      const { url, key } = await uploadFileToS3(`profile/`, req.file);
      profileImageUrl = url;
      profileImageKey = key;
    }

    // 5️⃣ Update user document
    user.name = name;
    user.gender = gender;
    user.username = username;
    user.unit = unit;
    user.roles = newRoles;
    user.profileImage = profileImageUrl;
    user.profileImageKey = profileImageKey;
    // Note: We are NOT changing the password here.

    await user.save();

    // 6️⃣ --- Add new roles to the Unit model ---
    const newUnit = await Unit.findById(unit);
    if (newUnit) {
      const newCommittee = gender.toLowerCase() === "female" ? "harithaCommittee" : "msfCommittee";

      for (const r of newRoles) {
        const roleData = await Role.findById(r.role);
        if (roleData) {
          const title = roleData.title;
          if (["President", "Secretary", "Treasurer"].includes(title)) {
            newUnit[newCommittee][title.toLowerCase()] = user._id;
          }
          if (title === "Vice President") {
            newUnit[newCommittee].vicePresidents.push(user._id);
          }
          if (title === "Joint Secretary") {
            newUnit[newCommittee].jointSecretaries.push(user._id);
          }
        }
      }
      await newUnit.save();
    }

    res.status(200).json(user);

  } catch (err) {
    console.error("❌ Error in updateAdminMember:", err);
    res.status(500).json({ message: "Server error while updating member" });
  }
};

export const changeUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.findByIdAndUpdate(id, {
      password: hashedPassword,
    });

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("❌ Error in changeUserPassword:", err);
    res.status(500).json({ message: "Server error" });
  }
};


// export const deleteUser = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // 1. Find user to get their details
//     const user = await User.findById(id);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // 2. Delete profile image from S3
//     if (user.profileImageKey) {
//       try {
//         await deleteFileFromS3(user.profileImageKey);
//       } catch (s3Err) {
//         console.warn(`Failed to delete S3 asset ${user.profileImageKey}:`, s3Err);
//         // We still proceed with DB deletion even if S3 delete fails
//       }
//     }

//     // 3. Remove user from any Unit committees
//     if (user.unit) {
//       const unitData = await Unit.findById(user.unit);
//       if (unitData) {
//         const committee =
//           user.gender === "female" ? "harithaCommittee" : "msfCommittee";

//         for (const r of user.roles) {
//           const roleExists = await Role.findById(r.role);
//           if (!roleExists) continue;

//           // Remove from main positions
//           if (["President", "Secretary", "Treasurer"].includes(roleExists.title)) {
//             const key = roleExists.title.toLowerCase();
//             if (unitData[committee]?.[key]?.equals(user._id)) {
//               unitData[committee][key] = null;
//             }
//           }
//           // Remove from array positions
//           if (roleExists.title === "Vice President") {
//             unitData[committee].vicePresidents.pull(user._id);
//           }
//           if (roleExists.title === "Joint Secretary") {
//             unitData[committee].jointSecretaries.pull(user._id);
//           }
//         }
//         await unitData.save();
//       }
//     }

//     // 4. Delete the user from User collection
//     await User.findByIdAndDelete(id);

//     res.status(200).json({ message: "User deleted successfully" });
//   } catch (err) {
//     console.error("❌ Error in deleteUser:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// };


export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find user to get their details
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Delete profile image from S3
    if (user.profileImageKey) {
      try {
        await deleteFileFromS3(user.profileImageKey);
      } catch (s3Err) {
        console.warn(`Failed to delete S3 asset ${user.profileImageKey}:`, s3Err);
        // We still proceed with DB deletion even if S3 delete fails
      }
    }

    // 3. Remove user from any Unit committees
    if (user.unit) {
      const unitData = await Unit.findById(user.unit);
      if (unitData) {
        const committee =
          user.gender === "female" ? "harithaCommittee" : "msfCommittee";

        for (const r of user.roles) {
          const roleExists = await Role.findById(r.role);
          if (!roleExists) continue;

          // Remove from main positions
          if (["President", "Secretary", "Treasurer"].includes(roleExists.title)) {
            const key = roleExists.title.toLowerCase();
            if (unitData[committee]?.[key]?.equals(user._id)) {
              unitData[committee][key] = null;
            }
          }
          // Remove from array positions
          if (roleExists.title === "Vice President") {
            unitData[committee].vicePresidents.pull(user._id);
          }
          if (roleExists.title === "Joint Secretary") {
            unitData[committee].jointSecretaries.pull(user._id);
          }
        }
        await unitData.save();
      }
    }

    // --- NEW LOGIC ADDED ---
    // 3.5. Remove user from any "In-Charge" assignments across all units
    try {
      await Unit.updateMany(
        { inCharges: id }, // Find all units where this user is in the inCharges array
        { $pull: { inCharges: id } } // Remove this userId from the array
      );
    } catch (inChargeError) {
      console.warn(
        `Failed to remove user ${id} from in-charge assignments, but proceeding with deletion:`,
        inChargeError
      );
      // Log error but don't block the main user deletion
    }
    // --- END OF NEW LOGIC ---

    // 4. Delete the user from User collection
    await User.findByIdAndDelete(id);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("❌ Error in deleteUser:", err);
    res.status(500).json({ message: "Server error" });
  }
};
