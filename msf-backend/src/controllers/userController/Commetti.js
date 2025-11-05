import User from "../../models/User.js";
import Unit from "../../models/Unit.js";
import Role from "../../models/Role.js";
import unitUsers from "../../models/unitUsers.js";
import { uploadFileToS3, deleteFileFromS3 } from "../../config/awsS3Helper.js"

export const getmsfCommitteeUsersByUnit = async (req, res) => {
  try {
    // 1. Get both committeeType and unitId from the request parameters
    const { unitId } = req.params;
    const committeeType = "msf";
    // 2. Find the role that matches the committeeType (e.g., 'Haritha' or 'MSF')
    // We use a case-insensitive regex to make it flexible
    const role = await Role.findOne({
      name: new RegExp('^' + committeeType + '$', 'i')
    }).lean();

    // If no role matches the committeeType, return an error
    if (!role) {
      return res.status(404).json({ message: `Committee type '${committeeType}' not found.` });
    }

    // 3. Find users who belong to the specific unit AND have the specific role
    const users = await User.find({
      unit: unitId,
      "roles.role": role._id // Filter by the role's ID
    })
      .populate("roles.role", "name")
      .select("name gender profileImage roles")
      .lean();

    if (!users || users.length === 0) {
      return res.status(404).json({
        message: `No users found for committee '${committeeType}' in this unit.`
      });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching committee users by unit:", error);
    res.status(500).json({ message: "Server error fetching users." });
  }
};

export const getharithaCommitteeUsersByUnit = async (req, res) => {
  try {
    // 1. Get both committeeType and unitId from the request parameters
    const { unitId } = req.params;
    const committeeType = "haritha"
    // 2. Find the role that matches the committeeType (e.g., 'Haritha' or 'MSF')
    // We use a case-insensitive regex to make it flexible
    const role = await Role.findOne({
      name: new RegExp('^' + committeeType + '$', 'i')
    }).lean();

    // If no role matches the committeeType, return an error
    if (!role) {
      return res.status(404).json({ message: `Committee type '${committeeType}' not found.` });
    }

    // 3. Find users who belong to the specific unit AND have the specific role
    const users = await User.find({
      unit: unitId,
      "roles.role": role._id // Filter by the role's ID
    })
      .populate("roles.role", "name")
      .select("name gender profileImage roles")
      .lean();

    if (!users || users.length === 0) {
      return res.status(404).json({
        message: `No users found for committee '${committeeType}' in this unit.`
      });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching committee users by unit:", error);
    res.status(500).json({ message: "Server error fetching users." });
  }
};

export const updateCommitteeAndUserRoles = async (req, res) => {
  try {
    const { unitId } = req.params;
    const { committeeType, updatedCommittee } = req.body;

    if (!committeeType || !["msf", "haritha"].includes(committeeType)) {
      return res.status(400).json({ message: "Invalid committee type" });
    }

    if (!updatedCommittee) {
      return res.status(400).json({ message: "No committee data provided" });
    }

    const unit = await Unit.findById(unitId);
    if (!unit) return res.status(404).json({ message: "Unit not found" });

    const rolesToUpdate = [
      { roleName: "president", userId: updatedCommittee.president },
      { roleName: "secretary", userId: updatedCommittee.secretary },
      { roleName: "treasurer", userId: updatedCommittee.treasurer },
    ];

    const multiRoles = [
      { roleName: "vicePresidents", userIds: updatedCommittee.vicePresidents || [] },
      { roleName: "jointSecretaries", userIds: updatedCommittee.jointSecretaries || [] },
    ];

    // ✅ 1. Update unit committee
    const updateField =
      committeeType === "haritha"
        ? { harithaCommittee: updatedCommittee }
        : { msfCommittee: updatedCommittee };

    await Unit.findByIdAndUpdate(unitId, { $set: updateField }, { new: true });

    // ✅ 2. Update User roles
    // Loop for single-role positions
    for (const r of rolesToUpdate) {
      if (!r.userId) continue;

      const user = await User.findById(r.userId);

      if (!user) continue;

      // Check if the user has a main role in this unit, skip if main
      const hasMainRole = user.roles.some((role) => role.scope === "main");
      if (hasMainRole) continue;

      // Add or update role in User.roles
      const existingUnitRoleIndex = user.roles.findIndex(
        (role) => role.scope === "unit" && role.role.toString() === r.userId
      );

      if (existingUnitRoleIndex === -1) {
        // Push new role
        user.roles.push({ role: r.userId, scope: "unit" });
      } else {
        // Already exists, do nothing or update if needed
      }

      await user.save();
    }

    // Loop for multi-role positions
    for (const group of multiRoles) {
      for (const uid of group.userIds) {
        const user = await User.findById(uid);
        if (!user) continue;
        const hasMainRole = user.roles.some((role) => role.scope === "main");
        if (hasMainRole) continue;

        // Check if already has this unit role
        const exists = user.roles.find(
          (role) => role.scope === "unit" && role.role.toString() === uid
        );

        if (!exists) {
          user.roles.push({ role: uid, scope: "unit" });
          await user.save();
        }
      }
    }

    const populatedUnit = await Unit.findById(unitId)
      .populate(`${committeeType}Committee.president`, "name profileImage gender")
      .populate(`${committeeType}Committee.secretary`, "name profileImage gender")
      .populate(`${committeeType}Committee.treasurer`, "name profileImage gender")
      .populate(`${committeeType}Committee.vicePresidents`, "name profileImage gender")
      .populate(`${committeeType}Committee.jointSecretaries`, "name profileImage gender");

    res.status(200).json({
      message: `${committeeType.toUpperCase()} committee updated successfully`,
      updatedUnit: populatedUnit,
    });
  } catch (err) {
    console.error("Error updating committee and user roles:", err);
    res.status(500).json({ message: "Server error updating committee" });
  }
};


export const getCommitteeUsersByUnit = async (req, res) => {
  try {
    const { unitId, committeeType } = req.params;
    console.log("Unit:", unitId, "Committee:", committeeType);

    if (!unitId || !committeeType) {
      return res.status(400).json({ message: "Missing unit ID or committee type." });
    }

    // Convert committeeType to lowercase for consistent matching
    const scopeToMatch = committeeType.toLowerCase();

    // Validate committeeType if necessary (optional, but good practice)
    if (scopeToMatch !== "msf" && scopeToMatch !== "haritha") {
      return res.status(400).json({ message: `Invalid committee type: ${committeeType}` });
    }

    // Build the query
    const query = {
      unit: unitId,
      // Use $elemMatch to find users where at least one role element matches the scope
      roles: { $elemMatch: { scope: scopeToMatch } },
    };

    const users = await unitUsers.find(query)
      .select("name gender profileImage roles") // Select desired fields
      .populate("roles.role", "title") // Populate the role title
      .lean(); // Use lean for performance if you don't need Mongoose documents

    // Filter the roles array in the result *after* fetching from DB
    // This ensures only the relevant role scope is sent back if a user has multiple roles
    const filteredUsers = users.map(user => {
      return {
        ...user,
        roles: user.roles.filter(roleEntry => roleEntry.scope === scopeToMatch)
      };
    });


    return res.status(200).json(filteredUsers);

  } catch (error) {
    console.error("Error fetching committee users:", error);
    res.status(500).json({ message: "Server error fetching users." });
  }
};

export const addUserToCommittee = async (req, res) => {
  try {
    const { name, gender = "male", role, unitId, committeeType } = req.body;

    if (!name || !role || !unitId || !committeeType) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    let roleDoc = await Role.findOne({ title: role });
    if (!roleDoc) {
      roleDoc = await Role.create({ title: role });
    }

    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found." });
    }

    const restrictedRoles = ["President", "Secretary", "Treasurer"];
    const committeeField =
      committeeType === "haritha" ? "harithaCommittee" : "msfCommittee";

    if (restrictedRoles.includes(role)) {
      const existingHolder = unit[committeeField][role.toLowerCase()];
      if (existingHolder) {
        return res.status(400).json({
          message: `A ${role} already exists in the ${committeeType} committee.`,
        });
      }
    }

    let profileImage = null;
    let profileImageKey = null;

    if (req.file) {
      const uploadResult = await uploadFileToS3("profiles/", req.file);
      profileImage = uploadResult.url;
      profileImageKey = uploadResult.key;
    }

    const newUser = await unitUsers.create({
      name,
      gender,
      profileImage,
      profileImageKey,
      unit: unitId,
      roles: {
        role: roleDoc._id,
        scope: committeeType,
      },
    });

    const roleKey = role.toLowerCase().replace(" ", "");
    switch (roleKey) {
      case "president":
      case "secretary":
      case "treasurer":
        unit[committeeField][roleKey] = newUser._id;
        break;
      case "vicepresident":
        unit[committeeField].vicePresidents.push(newUser._id);
        break;
      case "jointsecretary":
        unit[committeeField].jointSecretaries.push(newUser._id);
        break;
      default:
        break;
    }

    await unit.save();

    const populatedUser = await unitUsers.findById(newUser._id)
      .populate("roles.role", "title");


    res.status(201).json({
      message: "User added successfully.",
      user: populatedUser, 
    });

  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({
      message: "Server error while adding user.",
      error: error.message,
    });
  }
};

export const updateUserInCommittee = async (req, res) => {
  try {
    console.log("Received body:", req.body); // Keep this for debugging if needed
    const { userId } = req.params;
    const {
      name,
      gender, // Removed default here, rely on frontend or add validation
      role: newRole,
      unitId,
      committeeType,
    } = req.body;

    // Optional: Add explicit check for gender if needed
    if (!gender) {
      return res.status(400).json({ message: "Gender field is missing." });
    }

    if (!name || !newRole || !unitId || !committeeType) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // 1. Find the user to be updated
    const user = await unitUsers.findById(userId).populate("roles.role");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // 2. Handle Profile Image Update (Keep your existing S3 logic)
    let profileImage = user.profileImage;
    let profileImageKey = user.profileImageKey;

    if (req.file) {
      if (user.profileImageKey) {
        try {
          await deleteFileFromS3(user.profileImageKey);
        } catch (s3Error) {
          console.error("Failed to delete old S3 image, but proceeding:", s3Error);
        }
      }
      const uploadResult = await uploadFileToS3("profiles/", req.file);
      profileImage = uploadResult.url;
      profileImageKey = uploadResult.key;
    }

    // 3. Handle Role Update (Keep your existing role change logic)
    const oldRoleDoc = user.roles[0]?.role;
    const roleHasChanged = !oldRoleDoc || oldRoleDoc.title !== newRole;

    let newRoleDoc = await Role.findOne({ title: newRole });
    if (!newRoleDoc) {
      newRoleDoc = await Role.create({ title: newRole });
    }

    if (roleHasChanged) {
      const unit = await Unit.findById(unitId);
      if (!unit) {
        return res.status(404).json({ message: "Unit not found." });
      }
      const committeeField =
        committeeType === "haritha" ? "harithaCommittee" : "msfCommittee";
      const restrictedRoles = ["President", "Secretary", "Treasurer"];
      const newRoleKey = newRole.toLowerCase().replace(" ", "");

      if (restrictedRoles.includes(newRole)) {
        const existingHolder = unit[committeeField][newRole.toLowerCase()];
        if (existingHolder && existingHolder.toString() !== userId) {
          return res.status(400).json({
            message: `A ${newRole} already exists in the ${committeeType} committee.`,
          });
        }
      }

      if (oldRoleDoc) {
        const oldRoleKey = oldRoleDoc.title.toLowerCase().replace(" ", "");
        switch (oldRoleKey) {
          case "president":
          case "secretary":
          case "treasurer":
            if (unit[committeeField][oldRoleKey]?.toString() === userId) {
              unit[committeeField][oldRoleKey] = null;
            }
            break;
          case "vicepresident":
            unit[committeeField].vicePresidents.pull(userId);
            break;
          case "jointsecretary":
            unit[committeeField].jointSecretaries.pull(userId);
            break;
          default:
            break;
        }
      }

      switch (newRoleKey) {
        case "president":
        case "secretary":
        case "treasurer":
          unit[committeeField][newRoleKey] = userId;
          break;
        case "vicepresident":
          unit[committeeField].vicePresidents.push(userId);
          break;
        case "jointsecretary":
          unit[committeeField].jointSecretaries.push(userId);
          break;
        default:
          break;
      }
      await unit.save();
    }

    // 4. Update the User document itself
    user.name = name;
    user.gender = gender; // Assign the received gender
    user.profileImage = profileImage;
    user.profileImageKey = profileImageKey;
    user.roles = [{ role: newRoleDoc._id, scope: committeeType }];

    // ✅ --- START OF FIX ---
    // Save the 'user' document instance, not the model
    await user.save();

    // Fetch the user again *using the model* to populate correctly
    const populatedUser = await unitUsers.findById(userId) // Use userId here
      .populate("roles.role", "title");
    // ✅ --- END OF FIX ---

    res.status(200).json({ // Use 200 OK for update
      message: "User updated successfully.", // Correct message
      user: populatedUser, // <-- Send the correctly populated user
    });

  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      message: "Server error while updating user.",
      error: error.message,
    });
  }
};

export const changeUserRoleInCommittee = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newRole, unitId, committeeType } = req.body;

    if (!newRole || !unitId || !committeeType) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    // 1. Find user, unit, and new role doc
    const user = await unitUsers.findById(userId).populate("roles.role");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found." });
    }

    let newRoleDoc = await Role.findOne({ title: newRole });
    if (!newRoleDoc) {
      newRoleDoc = await Role.create({ title: newRole });
    }

    // 2. Get old role and check if change is needed
    const oldRoleDoc = user.roles[0]?.role;
    const oldRole = oldRoleDoc ? oldRoleDoc.title : null;

    if (oldRole === newRole) {
      return res.status(200).json({ message: "Role is already set.", user });
    }

    // 3. Check for restrictions on NEW role
    const committeeField =
      committeeType === "haritha" ? "harithaCommittee" : "msfCommittee";
    const restrictedRoles = ["President", "Secretary", "Treasurer"];
    const newRoleKey = newRole.toLowerCase().replace(" ", "");

    if (restrictedRoles.includes(newRole)) {
      const existingHolder = unit[committeeField][newRole.toLowerCase()];
      if (existingHolder && existingHolder.toString() !== userId) {
        return res.status(400).json({
          message: `A ${newRole} already exists in the ${committeeType} committee.`,
        });
      }
    }

    // 4. Remove user from OLD role in Unit schema
    if (oldRole) {
      const oldRoleKey = oldRole.toLowerCase().replace(" ", "");
      switch (oldRoleKey) {
        case "president":
        case "secretary":
        case "treasurer":
          if (unit[committeeField][oldRoleKey]?.toString() === userId) {
            unit[committeeField][oldRoleKey] = null;
          }
          break;
        case "vicepresident":
          unit[committeeField].vicePresidents.pull(userId);
          break;
        case "jointsecretary":
          unit[committeeField].jointSecretaries.pull(userId);
          break;
        default:
          break;
      }
    }

    // 5. Add user to NEW role in Unit schema
    switch (newRoleKey) {
      case "president":
      case "secretary":
      case "treasurer":
        unit[committeeField][newRoleKey] = userId;
        break;
      case "vicepresident":
        unit[committeeField].vicePresidents.push(userId);
        break;
      case "jointsecretary":
        unit[committeeField].jointSecretaries.push(userId);
        break;
      default:
        break;
    }

    await unit.save();

    // 6. Update the User document
    user.roles = [{ role: newRoleDoc._id, scope: committeeType }];
    await user.save();

    // 7. Populate the new role for the response
    const updatedUser = await unitUsers.findById(userId).populate("roles.role");

    res.status(200).json({
      message: "User role updated successfully.",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Error changing user role:", error);
    res.status(500).json({
      message: "Server error while changing user role.",
      error: error.message,
    });
  }
};


export const deleteUserFromCommittee = async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Find the user to get their details before deleting
    const user = await unitUsers.findById(userId).populate("roles.role");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const {
      unit: unitId,
      profileImageKey,
      roles,
    } = user;

    // 2. Delete profile image from S3 if it exists
    if (profileImageKey) {
      try {
        await deleteFileFromS3(profileImageKey);
      } catch (s3Error) {
        console.error("Failed to delete S3 image, but proceeding with user deletion:", s3Error);
        // Log error but don't block deletion
      }
    }

    // 3. Remove user from their role in the Unit schema
    if (roles && roles.length > 0 && unitId) {
      const roleDoc = roles[0].role;
      const committeeType = roles[0].scope;

      if (roleDoc && committeeType) {
        const unit = await Unit.findById(unitId);
        if (unit) {
          const committeeField =
            committeeType === "haritha" ? "harithaCommittee" : "msfCommittee";
          const roleKey = roleDoc.title.toLowerCase().replace(" ", "");

          switch (roleKey) {
            case "president":
            case "secretary":
            case "treasurer":
              if (unit[committeeField][roleKey]?.toString() === userId) {
                unit[committeeField][roleKey] = null;
              }
              break;
            case "vicepresident":
              unit[committeeField].vicePresidents.pull(userId);
              break;
            case "jointsecretary":
              unit[committeeField].jointSecretaries.pull(userId);
              break;
            default:
              break; // Role was "Member" or similar, no change in Unit needed
          }
          await unit.save();
        }
      }
    }

    // 4. Delete the user from the database
    await unitUsers.findByIdAndDelete(userId);

    // 5. Send success response
    res.status(200).json({
      message: "User deleted successfully.",
      userId: userId,
    });

  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      message: "Server error while deleting user.",
      error: error.message,
    });
  }
};

