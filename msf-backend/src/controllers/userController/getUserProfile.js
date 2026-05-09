import User from "../../models/User.js";

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
        inChargeOfUnits: user.inChargeOfUnits,
      },
    });
  } catch (error) {
    console.error("🔥 Error fetching profile:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

