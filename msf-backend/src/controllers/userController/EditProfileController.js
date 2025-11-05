import User from "../../models/User.js";
import Unit from "../../models/Unit.js";
import bcrypt from "bcrypt";
import { uploadFileToS3, deleteFileFromS3 } from "../../config/awsS3Helper.js";


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
      .populate("inChargeOfUnits", "name")
      .select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      profile: {
        id: user._id,
        name: user.name,
        username: user.username, // 👈 Send username
        gender: user.gender,
        phone: user.phone,
        profileImage: user.profileImage,
        unit: user.unit,
        roles: user.roles.map((r) => ({
          id: r._id,
          scope: r.scope,
          roleId: r.role?._id,
          roleTitle: r.role?.title
        })),
        inChargeOfUnits: user.inChargeOfUnits,
        isVerified: user.isVerified,
        addedByAdmin: user.addedByAdmin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("🔥 Error fetching profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// 👈 UPDATED EditProfileController
