import Unit from '../../models/Unit.js';
import Role from '../../models/Role.js';
import Program from '../../models/Program.js';
import User from '../../models/User.js';
import bcrypt from 'bcrypt';
import { uploadFileToS3, deleteFileFromS3 } from '../../config/awsS3Helper.js';


export const getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(400).json({ message: "User not authenticated" });
    }

    const userId = req.user.id;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findById(userId)
      .populate("unit", "name")
      .populate("roles.role", "title")
      .select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }


    res.status(200).json({
      success: true,
      profile: {
        id: user._id,
        name: user.name,
        profileImage: user.profileImage,
        inChargeOfUnits: user.inChargeOfUnits,
        username:user.username,
        unit:user.unit,
        gender:user.gender,
      },
    });
  } catch (error) {
    console.error("🔥 Error fetching profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const EditProfileController = async (req, res) => {

  try {
    const { name, gender, username, unit } = req.body;
    const userId = req.user.id;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    let user;
    try {
      user = await User.findById(userId).populate("unit");
    } catch (findError) {
      ;
      return res.status(500).json({ message: "Database error finding user" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (username) {
      if (user.username !== username) {
        const existingUser = await User.findOne({ username, _id: { $ne: userId } });
        if (existingUser) {
          return res.status(400).json({ message: "Username already taken" });
        }
        user.username = username;
      }
    }

    if (req.file) {

      if (user.profileImageKey) {
        try {
          await deleteFileFromS3(user.profileImageKey);
        } catch (deleteError) {
          console.warn("Failed to delete old image from S3:", deleteError.message);
        }
      }
      try {
        const uploadResult = await uploadFileToS3("profiles/", req.file); 
        user.profileImage = uploadResult.url;
        user.profileImageKey = uploadResult.key;
      } catch (uploadError) {
        return res.status(500).json({ message: "Failed to upload profile image" });
      }
    }

    if (name && user.name !== name) {
      user.name = name;
    }

    if (gender && user.gender !== gender) {
      user.gender = gender;
    }

    const oldUnitId = user.unit?._id ? String(user.unit._id) : null;
    const newUnitId = unit ? String(unit) : null;

    if (newUnitId && oldUnitId !== newUnitId) {

      if (oldUnitId) {
        try {
          const oldUnit = await Unit.findById(oldUnitId);
          if (oldUnit) {
            ["president", "secretary", "treasurer"].forEach((role) => {
              if (String(oldUnit.msfCommittee[role]) === String(user._id)) oldUnit.msfCommittee[role] = null;
              if (String(oldUnit.harithaCommittee[role]) === String(user._id)) oldUnit.harithaCommittee[role] = null;
            });
            oldUnit.msfCommittee.vicePresidents = oldUnit.msfCommittee.vicePresidents.filter(id => String(id) !== String(user._id));
            await oldUnit.save();
          }
        } catch (unitError) {
          console.error("Error removing roles from old unit:", unitError.message);
        }
      }

      user.roles = user.roles.filter((r) => r.scope !== "unit");

      user.unit = newUnitId;

    } else if (newUnitId === null && oldUnitId !== null) {
      user.unit = null;
      user.roles = user.roles.filter((r) => r.scope !== "unit");
    }

    try {
      await user.save();
    } catch (saveError) {
      console.error("ERROR: Failed to save user:", saveError.message);
      return res.status(500).json({ message: "Failed to save user changes" });
    }

    const updatedUser = await User.findById(userId)
      .populate("unit", "name")
      .populate("roles.role", "title");
    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        username: updatedUser.username,
        gender: updatedUser.gender,
        profileImage: updatedUser.profileImage,
        unit: updatedUser.unit,
        roles: updatedUser.roles.map((r) => ({
          id: r._id,
          scope: r.scope,
          roleId: r.role?._id,
          roleTitle: r.role?.title
        })),
      },
    });
  } catch (error) {
    console.error("UNEXPECTED ERROR in EditProfileController:", error.message);
    res.status(500).json({
      message: "Failed to update profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const changePasswordController = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findById(userId).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.password) {
      return res.status(400).json({ message: "Password not set. Please contact admin." });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect old password" });
    }

    if (newPassword === oldPassword) {
      return res.status(400).json({ message: "New password must be different from the old one" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });

  } catch (error) {
    console.error("UNEXPECTED ERROR in changePasswordController:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

