import Unit from "../../../models/Unit.js";
import User from "../../../models/User.js";

export const getUserProgramsController = async (req, res) => {
  try {
    const userId = req.user.userId; // from middleware
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!user.unit) {
      return res.status(400).json({ message: "User has no assigned unit" });
    }

    // 🔹 Find the user's unit and filter programs created by this user
    const unit = await Unit.findById(user.unit).populate("programs.createdBy", "name email");

    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    const userPrograms = unit.programs.filter(
      (program) => program.createdBy._id.toString() === userId.toString()
    );

    res.status(200).json({
      message: "User programs fetched successfully",
      count: userPrograms.length,
      programs: userPrograms,
    });
  } catch (error) {
    console.error("Error fetching user programs:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
