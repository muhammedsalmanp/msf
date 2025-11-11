import Unit from '../../models/Unit.js';
import Role from '../../models/Role.js';
import User from '../../models/User.js';
import unitUsers from '../../models/unitUsers.js'
import unitUsers from '../../models/unitUsers.js';
import { uploadFileToS3, deleteFileFromS3 } from '../../config/awsS3Helper.js';


export const getMainCommittee = async (req, res) => {
  try {
    const users = await User.find({
      gender: 'male',
      roles: { $elemMatch: { scope: 'main' } }
    })
      .populate('roles.role', 'title')
      .populate('unit', 'name')
      .select('name gender profileImage roles unit');

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching main committee:', error);
    res.status(500).json({ message: 'Failed to fetch main committee' });
  }
};

export const getHarithaCommittee = async (req, res) => {
  try {
    const users = await User.find({
      gender: 'female',
      roles: { $elemMatch: { scope: 'main' } }
    })
      .populate('roles.role', 'title')
      .populate('unit', 'name')
      .select('name gender profileImage roles unit');

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching Haritha committee:', error);
    res.status(500).json({ message: 'Failed to fetch Haritha committee' });
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

    const updateField =
      committeeType === "haritha"
        ? { harithaCommittee: updatedCommittee }
        : { msfCommittee: updatedCommittee };

    await Unit.findByIdAndUpdate(unitId, { $set: updateField }, { new: true });

   
    for (const r of rolesToUpdate) {
      if (!r.userId) continue;

      const user = await User.findById(r.userId);

      if (!user) continue;

     const hasMainRole = user.roles.some((role) => role.scope === "main");
      if (hasMainRole) continue;

      const existingUnitRoleIndex = user.roles.findIndex(
        (role) => role.scope === "unit" && role.role.toString() === r.userId
      );

      if (existingUnitRoleIndex === -1) {

        user.roles.push({ role: r.userId, scope: "unit" });
      } else {

      }

      await user.save();
    }

    for (const group of multiRoles) {
      for (const uid of group.userIds) {
        const user = await User.findById(uid);
        if (!user) continue;
        const hasMainRole = user.roles.some((role) => role.scope === "main");
        if (hasMainRole) continue;

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


//==============incharg Controllers====================


export const getmsfCommitteeUsersByUnit = async (req, res) => {
  try {
    const { unitId } = req.params;
    const committeeType = "msf";
    const role = await Role.findOne({
      name: new RegExp('^' + committeeType + '$', 'i')
    }).lean();
    if (!role) {
      return res.status(404).json({ message: `Committee type '${committeeType}' not found.` });
    }

    const users = await User.find({
      unit: unitId,
      "roles.role": role._id
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

    const { unitId } = req.params;
    const committeeType = "haritha"
    const role = await Role.findOne({
      name: new RegExp('^' + committeeType + '$', 'i')
    }).lean();
    if (!role) {
      return res.status(404).json({ message: `Committee type '${committeeType}' not found.` });
    }

    const users = await User.find({
      unit: unitId,
      "roles.role": role._id
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

export const getCommitteeUsersByUnit = async (req, res) => {
  try {
    const { unitId, committeeType } = req.params;

    if (!unitId || !committeeType) {
      return res.status(400).json({ message: "Missing unit ID or committee type." });
    }

    const scopeToMatch = committeeType.toLowerCase();

    if (scopeToMatch !== "msf" && scopeToMatch !== "haritha") {
      return res.status(400).json({ message: `Invalid committee type: ${committeeType}` });
    }

    const query = {
      unit: unitId,
      roles: { $elemMatch: { scope: scopeToMatch } },
    };

    const users = await unitUsers.find(query)
      .select("name gender profileImage roles")
      .populate("roles.role", "title")
      .lean();

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


//===============add, edit, Delete committee=============

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
    console.log("Received body:", req.body);
    const { userId } = req.params;
    const {
      name,
      gender,
      role: newRole,
      unitId,
      committeeType,
    } = req.body;

    if (!gender) {
      return res.status(400).json({ message: "Gender field is missing." });
    }

    if (!name || !newRole || !unitId || !committeeType) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const user = await unitUsers.findById(userId).populate("roles.role");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

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

    user.name = name;
    user.gender = gender;
    user.profileImage = profileImage;
    user.profileImageKey = profileImageKey;
    user.roles = [{ role: newRoleDoc._id, scope: committeeType }];

    await user.save();

    const populatedUser = await unitUsers.findById(userId)
      .populate("roles.role", "title");


    res.status(200).json({
      message: "User updated successfully.",
      user: populatedUser,
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

    const oldRoleDoc = user.roles[0]?.role;
    const oldRole = oldRoleDoc ? oldRoleDoc.title : null;

    if (oldRole === newRole) {
      return res.status(200).json({ message: "Role is already set.", user });
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

    user.roles = [{ role: newRoleDoc._id, scope: committeeType }];
    await user.save();

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
     
    const user = await unitUsers.findById(userId).populate("roles.role");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const {
      unit: unitId,
      profileImageKey,
      roles,
    } = user;

    if (profileImageKey) {
      try {
        await deleteFileFromS3(profileImageKey);
      } catch (s3Error) {
        console.error("Failed to delete S3 image, but proceeding with user deletion:", s3Error);
      }
    }

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
              break;
          }
          await unit.save();
        }
      }
    }

    await unitUsers.findByIdAndDelete(userId);

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


//==============Unit Controllers====================

export const getCommitteeUsers = async (req, res) => {

    try {
        
        console.log("testring the erroroor ",req.params,req.user);
        
        const { committeeType } = req.params;
        const unitId = req.user.id;

        console.log("Unit:", unitId, "Committee:", committeeType);

        if (!unitId || !committeeType) {
            return res.status(400).json({ message: "Missing unit ID or committee type." });
        }

        const scopeToMatch = committeeType.toLowerCase();

        if (scopeToMatch !== "msf" && scopeToMatch !== "haritha") {
            return res.status(400).json({ message: `Invalid committee type: ${committeeType}` });
        }

        const query = {
            unit: unitId,
            roles: { $elemMatch: { scope: scopeToMatch } },
        };

        const users = await unitUsers.find(query)
            .select("name gender profileImage roles")
            .populate("roles.role", "title")
            .lean();

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