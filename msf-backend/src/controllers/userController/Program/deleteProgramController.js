// controllers/programController.js
import Unit from "../../../models/Unit.js";
import User from "../../../models/User.js";
import { deleteFileFromS3 } from "../../../config/awsS3Helper.js";

export const deleteProgramController = async (req, res) => {
  try {
    const { id } = req.params; // programId
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!user.unit) {
      return res.status(400).json({ message: "User has no assigned unit" });
    }

    const unit = await Unit.findById(user.unit);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    // 🔹 Find the program
    const programIndex = unit.programs.findIndex(
      (p) => p._id.toString() === id.toString()
    );
    if (programIndex === -1) {
      return res.status(404).json({ message: "Program not found" });
    }

    const program = unit.programs[programIndex];

    // 🔹 Delete all program images from S3
    if (program.image && program.image.length > 0) {
      for (const imgUrl of program.image) {
        try {
          // Extract S3 key from the URL
          const key = imgUrl.split(`.amazonaws.com/`)[1];
          if (key) {
            await deleteFileFromS3(key);
          }
        } catch (err) {
          console.error("Error deleting file from S3:", err.message);
        }
      }
    }

    // 🔹 Calculate points to deduct
    const programPoints = 3; // base points for a program
    const photoPoints = program.image?.length || 0;
    const totalPoints = programPoints + photoPoints;

    // 🔹 Remove program
    unit.programs.splice(programIndex, 1);

    // 🔹 Deduct points from unit’s total score (never below 0)
    unit.totalScore = Math.max(0, (unit.totalScore || 0) - totalPoints);

    await unit.save();

    res.json({
      message: "Program deleted successfully",
      deductedPoints: totalPoints,
      updatedTotalScore: unit.totalScore,
      unit,
    });
  } catch (error) {
    console.error("Error deleting program:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
