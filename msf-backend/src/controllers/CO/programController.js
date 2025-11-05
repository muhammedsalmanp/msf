import Unit from '../../models/Unit.js';
import Role from '../../models/Role.js';
import Program from '../../models/Program.js';
import User from '../../models/User.js';
import bcrypt from 'bcrypt';
import { uploadFileToS3, deleteFileFromS3 } from '../../config/awsS3Helper.js';

const getGradeAndClassification = (score) => {
  if (score >= 100) {
    return { grade: 'A', classification: 'Excellent' };
  } else if (score >= 75) {
    return { grade: 'B', classification: 'Good' };
  } else if (score >= 50) {
    return { grade: 'C', classification: 'Average' };
  } else if (score >= 25) {
    return { grade: 'D', classification: 'Average' }; 
  } else {
    return { grade: 'F', classification: 'Average' }; 
  }
};

export const updateAllUnitRanks = async () => {
  try {
    console.log('Starting background rank update...');

    const sortedUnits = await Unit.find({}, '_id totalScore rank grade classification')
      .sort({ totalScore: -1 })
      .lean(); 

    const operations = []; 

    sortedUnits.forEach((unit, index) => {
      const newRank = index + 1;
      const { grade, classification } = getGradeAndClassification(unit.totalScore);

      if (
        unit.rank !== newRank ||
        unit.grade !== grade ||
        unit.classification !== classification
      ) {
        operations.push({
          updateOne: {
            filter: { _id: unit._id },
            update: {
              $set: {
                rank: newRank,
                grade: grade,
                classification: classification,
              },
            },
          },
        });
      }
    });

    if (operations.length > 0) {
      console.log(`Updating ${operations.length} units...`);
      await Unit.bulkWrite(operations);
      console.log('Background rank update complete.');
    } else {
      console.log('No rank updates were necessary.');
    }
  } catch (error) {
    console.error('Error during background rank update:', error);
  }
};


export const addProgramToUnit = async (req, res) => {
  try {
    const { unitId } = req.params;
    const { name, description, date } = req.body;
    const createdByUserId = req.user.id;

    if (!name || !description || !date) {
      return res.status(400).json({ message: 'Name, description, and date are required' });
    }
    if (!req.files || req.files.length < 1) {
      return res.status(400).json({ message: 'At least 1 image is required' });
    }
    if (req.files.length > 10) {
      return res.status(400).json({ message: 'Maximum 10 images allowed' });
    }

    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    const imageUrls = [];
    for (const file of req.files) {
      const uploaded = await uploadFileToS3('programs/', file);
      imageUrls.push(uploaded.url);
    }

    const newProgramData = {
      name,
      description,
      date,
      image: imageUrls,
      createdBy: createdByUserId,
    };

    const programPoints = 3;
    const photoPoints = imageUrls.length;
    const totalPoints = programPoints + photoPoints;

    unit.programs.push(newProgramData);
    unit.totalScore = (unit.totalScore || 0) + totalPoints;
    

    await unit.save();

    const createdProgram = unit.programs[unit.programs.length - 1];

    res.status(201).json({
      message: 'Program added to unit successfully. Ranks are updating.',
      program: createdProgram,
      updatedTotalScore: unit.totalScore,
    });


    updateAllUnitRanks().catch((err) => {
      console.error('Failed to trigger background rank update:', err);
    });

  } catch (error) {
    console.error('Error adding program to unit:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }

}

export const updateProgramToUnit = async (req, res) => {
  try {
    const { unitId, programId } = req.params;
    const { name, date, description } = req.body;

    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    const program = unit.programs.id(programId);
    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }

    const oldImageCount = program.image.length;


    const existingImages = JSON.parse(req.body.existingImages || "[]");
    const imagesToDelete = JSON.parse(req.body.imagesToDelete || "[]");

    if (imagesToDelete.length > 0) {
      await Promise.all(imagesToDelete.map((keyOrUrl) => deleteFileFromS3(keyOrUrl)));
    }

    let newUploadedImages = [];
    if (req.files && req.files.length > 0) {
      const uploadResults = await Promise.all(
        req.files.map((file) => uploadFileToS3("programs/", file))
      );
      newUploadedImages = uploadResults.map((r) => r.url);
    }

    const normalizedExisting = existingImages.map((img) =>
      typeof img === "string" ? img : img.url
    );

    const finalImages = [...normalizedExisting, ...newUploadedImages].filter(Boolean);

    const newImageCount = finalImages.length;

    const scoreDifference = newImageCount - oldImageCount;

    program.name = name;
    program.date = date;
    program.description = description;
    program.image = finalImages;

    unit.totalScore = (unit.totalScore || 0) + scoreDifference;

    await unit.save();

    res.status(200).json({
      message: "Program updated successfully",
      program,
      updatedTotalScore: unit.totalScore, 
    });

    updateAllUnitRanks().catch((err) => {
      console.error('Failed to trigger background rank update:', err);
    });
    
  } catch (error) {
    console.error("Error updating program:", error);
    res.status(500).json({ message: "Server error while updating program" });
  }
};

export const deleteProgramfromUnit = async (req, res) => {
  try {
    const { unitId, programId } = req.params;

    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    const program = unit.programs.id(programId);
    if (!program) {
      return res.status(404).json({ message: "Program not found in this unit" });
    }

    const programPoints = 3; 
    const photoPoints = program.image ? program.image.length : 0; 
    const totalPointsToSubtract = programPoints + photoPoints;

    if (program.image && program.image.length > 0) {
      const deletePromises = program.image.map(imageUrl => {
        return deleteFileFromS3(imageUrl);
      });
      await Promise.all(deletePromises);
    }

    unit.programs.pull(programId); 
    unit.totalScore = (unit.totalScore || 0) - totalPointsToSubtract;

    if (unit.totalScore < 0) {
      unit.totalScore = 0;
    }

    await unit.save();

    res.status(200).json({ 
      message: "Program deleted successfully",
      updatedTotalScore: unit.totalScore 
    });

    updateAllUnitRanks().catch((err) => {
      console.error('Failed to trigger background rank update:', err);
    });

  } catch (error) {
    console.error("Error deleting program:", error);
    res.status(500).json({ message: "Server error while deleting program" });
  }
};


export const getProgram = async (req, res) => {
  try {
    const userId = req.user.id; 
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!user.unit) {
      return res.status(400).json({ message: "User has no assigned unit" });
    }

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

export const addProgram = async (req, res) => {
  try {
    const { programName, description, date } = req.body;
    const userId = req.user.id; 
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!user.unit) {
      return res.status(400).json({ message: "User has no assigned unit" });
    }

    if (!programName || !description || !date) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!req.files || req.files.length < 1) {
      return res.status(400).json({ message: "At least 1 image is required" });
    }
    if (req.files.length > 10) {
      return res.status(400).json({ message: "Maximum 10 images allowed" });
    }

    const unit = await Unit.findById(user.unit);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    const imageUrls = [];
    for (const file of req.files) {
      const uploaded = await uploadFileToS3("programs/", file);
      imageUrls.push(uploaded.url);
    }

    const newProgramData = {
      name: programName,
      description,
      date,
      image: imageUrls,
      createdBy: user._id,
    };

    const programPoints = 3; 
    const photoPoints = imageUrls.length;
    const totalPoints = programPoints + photoPoints;

    unit.programs.push(newProgramData);
    unit.totalScore = (unit.totalScore || 0) + totalPoints;

    await unit.save();
    
    const createdProgram = unit.programs[unit.programs.length - 1];

    res.status(201).json({
      message: "Program added successfully. Ranks are updating.",
      program: createdProgram, 
      totalPointsEarned: totalPoints,
      updatedTotalScore: unit.totalScore,
    });
    updateAllUnitRanks().catch((err) => {
      console.error('Failed to trigger background rank update:', err);
    });

  } catch (error) {
    console.error("Error uploading program:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

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

    const programPoints = 3;
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


