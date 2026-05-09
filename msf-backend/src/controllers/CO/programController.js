import Unit from '../../models/Unit.js';
import Role from '../../models/Role.js';
import Program from '../../models/Program.js';
import User from '../../models/User.js';
import bcrypt from 'bcrypt';
import { uploadFileToS3, deleteFileFromS3,getSignedFileUrl } from '../../config/awsS3Helper.js';

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

//==============incharg Controllers====================

export const addProgramToUnit = async (req, res) => {
  try {
    const { unitId } = req.params;
    const { name, description, date } = req.body;
    const createdByUserId = req.user.id;

    if (!name || !description || !date) {
      return res.status(400).json({ message: "Name, description, and date are required" });
    }

    if (!req.files || req.files.length < 1) {
      return res.status(400).json({ message: "At least 1 image is required" });
    }

    if (req.files.length > 10) {
      return res.status(400).json({ message: "Maximum 10 images allowed" });
    }

    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    const imageUrls = [];
    const imageKeys = [];

    for (const file of req.files) {
      const uploaded = await uploadFileToS3("programs/", file);
      imageUrls.push(uploaded.url);
      imageKeys.push(uploaded.key);
    }

    const newProgramData = {
      name,
      description,
      date,
      imageUrls,
      imageKeys,
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
      message: "Program added to unit successfully. Ranks are updating.",
      program: createdProgram,
      updatedTotalScore: unit.totalScore,
    });

    updateAllUnitRanks().catch(console.error);
  } catch (error) {
    console.error("Error adding program to unit:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const updateProgramToUnit = async (req, res) => {
  try {
    const { unitId, programId } = req.params;
    const { name, date, description } = req.body;

    const unit = await Unit.findById(unitId);
    if (!unit) return res.status(404).json({ message: "Unit not found" });

    const program = unit.programs.id(programId);
    if (!program) return res.status(404).json({ message: "Program not found" });

    const oldImageCount = program.imageUrls?.length || 0;

    // From frontend
    const existingImages = JSON.parse(req.body.existingImages || "[]");
    const imagesToDelete = JSON.parse(req.body.imagesToDelete || "[]"); 
    // 🔥 imagesToDelete should be keys array

    // 1) Delete selected images from S3
    if (imagesToDelete.length > 0) {
      await Promise.all(imagesToDelete.map((key) => deleteFileFromS3(key)));
    }

    // 2) Keep existing images (remove deleted ones)
    const remainingImages = existingImages.filter(
      (img) => !imagesToDelete.includes(img.key)
    );

    const remainingUrls = remainingImages.map((img) => img.url);
    const remainingKeys = remainingImages.map((img) => img.key);

    // 3) Upload new images
    let newUrls = [];
    let newKeys = [];

    if (req.files && req.files.length > 0) {
      const uploadResults = await Promise.all(
        req.files.map((file) => uploadFileToS3("programs/", file))
      );

      newUrls = uploadResults.map((r) => r.url);
      newKeys = uploadResults.map((r) => r.key);
    }

    // 4) Final arrays
    const finalUrls = [...remainingUrls, ...newUrls].filter(Boolean);
    const finalKeys = [...remainingKeys, ...newKeys].filter(Boolean);

    const newImageCount = finalUrls.length;
    const scoreDifference = newImageCount - oldImageCount;

    // 5) Update program fields
    program.name = name;
    program.date = date;
    program.description = description;
    program.imageUrls = finalUrls;
    program.imageKeys = finalKeys;

    unit.totalScore = (unit.totalScore || 0) + scoreDifference;

    await unit.save();

    res.status(200).json({
      message: "Program updated successfully",
      program,
      updatedTotalScore: unit.totalScore,
    });

    updateAllUnitRanks().catch(console.error);
  } catch (error) {
    console.error("Error updating program:", error);
    res.status(500).json({ message: "Server error while updating program" });
  }
};


export const deleteProgramfromUnit = async (req, res) => {
  try {
    const { unitId, programId } = req.params;

    const unit = await Unit.findById(unitId);
    if (!unit) return res.status(404).json({ message: "Unit not found" });

    const program = unit.programs.id(programId);
    if (!program) {
      return res.status(404).json({ message: "Program not found in this unit" });
    }

    const programPoints = 3;
    const photoPoints = program.imageUrls?.length || 0;
    const totalPointsToSubtract = programPoints + photoPoints;

    // ✅ delete from S3 using KEYS
    if (program.imageKeys && program.imageKeys.length > 0) {
      await Promise.all(program.imageKeys.map((key) => deleteFileFromS3(key)));
    }

    unit.programs.pull(programId);
    unit.totalScore = Math.max(0, (unit.totalScore || 0) - totalPointsToSubtract);

    await unit.save();

    res.status(200).json({
      message: "Program deleted successfully",
      updatedTotalScore: unit.totalScore,
    });

    updateAllUnitRanks().catch(console.error);
  } catch (error) {
    console.error("Error deleting program:", error);
    res.status(500).json({ message: "Server error while deleting program" });
  }
};


export const getProgram = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) return res.status(401).json({ message: "Unauthorized" });
    if (!user.unit) return res.status(400).json({ message: "User has no assigned unit" });

    const unit = await Unit.findById(user.unit).populate("programs.createdBy", "name email");

    if (!unit) return res.status(404).json({ message: "Unit not found" });

    const userPrograms = unit.programs.filter(
      (program) => program.createdBy?._id?.toString() === userId.toString()
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


//==============Unit Controllers====================

// export const addProgram = async (req, res) => {
//   try {
//     const { name: programName, description, date } = req.body;
//     const unitId = req.user.id;

//     if (!programName || !description || !date) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     if (!req.files || req.files.length < 1) {
//       return res.status(400).json({ message: "At least 1 image is required" });
//     }

//     if (req.files.length > 10) {
//       return res.status(400).json({ message: "Maximum 10 images allowed" });
//     }

//     const unit = await Unit.findById(unitId);
//     if (!unit) {
//       return res.status(404).json({ message: "Unit not found" });
//     }

//     const imageUrls = [];
//     const imageKeys = [];

//     for (const file of req.files) {
//       const uploaded = await uploadFileToS3("programs/", file);
//       imageUrls.push(uploaded.url);
//       imageKeys.push(uploaded.key);
//     }

//     const newProgramData = {
//       name: programName,
//       description,
//       date,
//       imageUrls,
//       imageKeys,
//       createdBy: unit._id,
//     };

//     const programPoints = 3;
//     const photoPoints = imageKeys.length;
//     const totalPoints = programPoints + photoPoints;

//     unit.programs.push(newProgramData);
//     unit.totalScore = (unit.totalScore || 0) + totalPoints;

//     await unit.save();

//     const createdProgram = unit.programs[unit.programs.length - 1];

//     // ✅ SIGNED URLS for frontend
//     const signedUrls = await Promise.all(
//       (createdProgram.imageKeys || []).map((key) => getSignedFileUrl(key))
//     );

//     res.status(201).json({
//       message: "Program added successfully. Ranks are updating.",
//       program: {
//         ...createdProgram.toObject(),
//         imageUrls: signedUrls, // ✅ frontend use this
//         imageKeys: createdProgram.imageKeys, // ✅ keep keys for edit/delete
//       },
//       totalPointsEarned: totalPoints,
//       updatedTotalScore: unit.totalScore,
//     });

//     updateAllUnitRanks().catch(console.error);
//   } catch (error) {
//     console.error("Error uploading program:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

export const addProgram = async (req, res) => {
  try {

    const {
      name: programName,
      description,
      date
    } = req.body;

    const unitId = req.user.id;

    // Validation
    if (!programName || !description || !date) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    if (!req.files || req.files.length < 1) {
      return res.status(400).json({
        message: "At least 1 image is required"
      });
    }

    if (req.files.length > 10) {
      return res.status(400).json({
        message: "Maximum 10 images allowed"
      });
    }

    // Find unit
    const unit = await Unit.findById(unitId);

    if (!unit) {
      return res.status(404).json({
        message: "Unit not found"
      });
    }

    // Upload Images
    const imageUrls = [];
    const imageKeys = [];

    for (const file of req.files) {

      const uploaded = await uploadFileToS3(
        "programs/",
        file
      );

      imageUrls.push(uploaded.url);
      imageKeys.push(uploaded.key);
    }

    // =========================
    // PROGRAM SCORE LOGIC
    // =========================

    let totalPoints = 2; // default custom program

    const existingProgram = await Program.findOne({
      title: {
        $regex: new RegExp(`^${programName}$`, "i")
      }
    });

    if (existingProgram) {

      switch (
        existingProgram.conductedBy?.toLowerCase()
      ) {

        case "state":
          totalPoints = 5;
          break;

        case "district":
          totalPoints = 5;
          break;

        case "constituency":
          totalPoints = 4;
          break;

        case "panchayat":
          totalPoints = 3;
          break;

        default:
          totalPoints = 2;
      }
    }

    // =========================
    // CREATE PROGRAM
    // =========================

    const newProgramData = {
      name: programName,
      description,
      date,
      imageUrls,
      imageKeys,
      createdBy: unit._id,
      points: totalPoints, // optional save
    };

    unit.programs.push(newProgramData);

    // Add score
    unit.totalScore =
      (unit.totalScore || 0) + totalPoints;

    await unit.save();

    const createdProgram =
      unit.programs[unit.programs.length - 1];

    // Signed URLs
    const signedUrls = await Promise.all(
      (createdProgram.imageKeys || []).map(
        (key) => getSignedFileUrl(key)
      )
    );

    res.status(201).json({
      message:
        "Program added successfully. Ranks are updating.",

      program: {
        ...createdProgram.toObject(),

        imageUrls: signedUrls,
        imageKeys: createdProgram.imageKeys,
      },

      totalPointsEarned: totalPoints,

      updatedTotalScore: unit.totalScore,
    });

    // Update ranks in background
    updateAllUnitRanks().catch(console.error);

  } catch (error) {

    console.error(
      "Error uploading program:",
      error
    );

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// export const updateProgram = async (req, res) => {
//   try {
//     const { programId } = req.params;
//     const { name, date, description } = req.body;
//     const unitId = req.user.id;

//     const unit = await Unit.findById(unitId);
//     if (!unit) return res.status(404).json({ message: "Unit not found" });

//     const program = unit.programs.id(programId);
//     if (!program) return res.status(404).json({ message: "Program not found" });

//     const oldImageCount = program.imageUrls?.length || 0;

//     const existingImages = JSON.parse(req.body.existingImages || "[]");
//     const imagesToDelete = JSON.parse(req.body.imagesToDelete || "[]");

//     // 1) Delete selected images from S3
//     if (imagesToDelete.length > 0) {
//       await Promise.all(imagesToDelete.map((key) => deleteFileFromS3(key)));
//     }

//     // 2) Remove deleted images from existing list
//     const remainingImages = existingImages.filter(
//       (img) => !imagesToDelete.includes(img.key)
//     );

//     const remainingUrls = remainingImages.map((img) => img.url);
//     const remainingKeys = remainingImages.map((img) => img.key);

//     // 3) Upload new images
//     let newUrls = [];
//     let newKeys = [];

//     if (req.files && req.files.length > 0) {
//       const uploadResults = await Promise.all(
//         req.files.map((file) => uploadFileToS3("programs/", file))
//       );

//       newUrls = uploadResults.map((r) => r.url);
//       newKeys = uploadResults.map((r) => r.key);
//     }

//     // 4) Final arrays
//     const finalUrls = [...remainingUrls, ...newUrls].filter(Boolean);
//     const finalKeys = [...remainingKeys, ...newKeys].filter(Boolean);

//     const newImageCount = finalUrls.length;
//     const scoreDifference = newImageCount - oldImageCount;

//     // 5) Update program
//     program.name = name;
//     program.date = date;
//     program.description = description;
//     program.imageUrls = finalUrls;
//     program.imageKeys = finalKeys;

//     // update score
//     unit.totalScore = (unit.totalScore || 0) + scoreDifference;

//     await unit.save();

//   const signedUrls = await Promise.all(
//   (program.imageKeys || []).map((key) => getSignedFileUrl(key))
// );

// res.status(200).json({
//   message: "Program updated successfully",
//   program: {
//     ...program.toObject(),
//     imageUrls: signedUrls,       // ✅ frontend should use this
//     imageKeys: program.imageKeys // ✅ keep keys for edit/delete
//   },
//   updatedTotalScore: unit.totalScore,
// });

//     updateAllUnitRanks().catch(console.error);
//   } catch (error) {
//     console.error("Error updating program:", error);
//     res.status(500).json({ message: "Server error while updating program" });
//   }
// };

const calculateProgramPoints = async (programName) => {

  let points = 2; // default custom program

  const existingProgram = await Program.findOne({
    title: {
      $regex: new RegExp(`^${programName}$`, "i")
    }
  });

  if (existingProgram) {

    switch (
      existingProgram.conductedBy?.toLowerCase()
    ) {

      case "state":
        points = 5;
        break;

      case "district":
        points = 5;
        break;

      case "constituency":
        points = 4;
        break;

      case "panchayat":
        points = 3;
        break;

      default:
        points = 2;
    }
  }

  return points;
};

export const updateProgram = async (req, res) => {
  try {

    const { programId } = req.params;

    const {
      name,
      date,
      description
    } = req.body;

    const unitId = req.user.id;

    const unit = await Unit.findById(unitId);

    if (!unit) {
      return res.status(404).json({
        message: "Unit not found"
      });
    }

    const program = unit.programs.id(programId);

    if (!program) {
      return res.status(404).json({
        message: "Program not found"
      });
    }

    // =========================
    // OLD POINTS
    // =========================

    const oldPoints =
      await calculateProgramPoints(
        program.name
      );

    // =========================
    // IMAGE HANDLING
    // =========================

    const existingImages = JSON.parse(
      req.body.existingImages || "[]"
    );

    const imagesToDelete = JSON.parse(
      req.body.imagesToDelete || "[]"
    );

    // delete selected images
    if (imagesToDelete.length > 0) {

      await Promise.all(
        imagesToDelete.map((key) =>
          deleteFileFromS3(key)
        )
      );
    }

    // remaining images
    const remainingImages = existingImages.filter(
      (img) => !imagesToDelete.includes(img.key)
    );

    const remainingUrls =
      remainingImages.map((img) => img.url);

    const remainingKeys =
      remainingImages.map((img) => img.key);

    // upload new images
    let newUrls = [];
    let newKeys = [];

    if (req.files && req.files.length > 0) {

      const uploadResults = await Promise.all(
        req.files.map((file) =>
          uploadFileToS3("programs/", file)
        )
      );

      newUrls = uploadResults.map((r) => r.url);
      newKeys = uploadResults.map((r) => r.key);
    }

    // final images
    const finalUrls = [
      ...remainingUrls,
      ...newUrls,
    ].filter(Boolean);

    const finalKeys = [
      ...remainingKeys,
      ...newKeys,
    ].filter(Boolean);

    // =========================
    // NEW POINTS
    // =========================

    const newPoints =
      await calculateProgramPoints(name);

    // =========================
    // UPDATE PROGRAM
    // =========================

    program.name = name;
    program.date = date;
    program.description = description;

    program.imageUrls = finalUrls;
    program.imageKeys = finalKeys;

    // =========================
    // UPDATE SCORE
    // =========================

    unit.totalScore =
      (unit.totalScore || 0)
      - oldPoints
      + newPoints;

    await unit.save();

    // signed URLs
    const signedUrls = await Promise.all(
      (program.imageKeys || []).map((key) =>
        getSignedFileUrl(key)
      )
    );

    res.status(200).json({
      message: "Program updated successfully",

      program: {
        ...program.toObject(),

        imageUrls: signedUrls,
        imageKeys: program.imageKeys
      },

      updatedTotalScore: unit.totalScore,
    });

    updateAllUnitRanks().catch(console.error);

  } catch (error) {

    console.error(
      "Error updating program:",
      error
    );

    res.status(500).json({
      message:
        "Server error while updating program"
    });
  }
};

export const deleteProgram = async (req, res) => {
  try {

    const { id } = req.params;

    const unitId = req.user.id;

    const unit = await Unit.findById(unitId);

    if (!unit) {
      return res.status(404).json({
        message:
          "Unit not found or unauthorized"
      });
    }

    const programIndex =
      unit.programs.findIndex(
        (p) =>
          p._id.toString() === id.toString()
      );

    if (programIndex === -1) {
      return res.status(404).json({
        message: "Program not found"
      });
    }

    const program =
      unit.programs[programIndex];

    // =========================
    // DELETE IMAGES FROM S3
    // =========================

    if (
      program.imageKeys &&
      program.imageKeys.length > 0
    ) {

      await Promise.all(
        program.imageKeys.map((key) =>
          deleteFileFromS3(key)
        )
      );
    }

    // =========================
    // PROGRAM POINTS
    // =========================

    const totalPoints =
      await calculateProgramPoints(
        program.name
      );

    // remove program
    unit.programs.splice(programIndex, 1);

    // update score
    unit.totalScore = Math.max(
      0,
      (unit.totalScore || 0)
      - totalPoints
    );

    await unit.save();

    res.json({
      message:
        "Program deleted successfully",

      deductedPoints: totalPoints,

      updatedTotalScore:
        unit.totalScore,
    });

    updateAllUnitRanks().catch(console.error);

  } catch (error) {

    console.error(
      "Error deleting program:",
      error
    );

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


// export const deleteProgram = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const unitId = req.user.id;

//     const unit = await Unit.findById(unitId);
//     if (!unit) {
//       return res.status(404).json({ message: "Unit not found or unauthorized" });
//     }

//     const programIndex = unit.programs.findIndex(
//       (p) => p._id.toString() === id.toString()
//     );

//     if (programIndex === -1) {
//       return res.status(404).json({ message: "Program not found" });
//     }

//     const program = unit.programs[programIndex];

//     // ✅ Delete from S3 using KEYS
//     if (program.imageKeys && program.imageKeys.length > 0) {
//       await Promise.all(program.imageKeys.map((key) => deleteFileFromS3(key)));
//     }

//     const programPoints = 3;
//     const photoPoints = program.imageUrls?.length || 0;
//     const totalPoints = programPoints + photoPoints;

//     // Remove program
//     unit.programs.splice(programIndex, 1);

//     // Update score safely
//     unit.totalScore = Math.max(0, (unit.totalScore || 0) - totalPoints);

//     await unit.save();

//     res.json({
//       message: "Program deleted successfully",
//       deductedPoints: totalPoints,
//       updatedTotalScore: unit.totalScore,
//     });

//     updateAllUnitRanks().catch(console.error);
//   } catch (error) {
//     console.error("Error deleting program:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };



export const getProgramList = async (req, res) => {
  try {

    const unitId = req.user.id;

    // Find current unit
    const unit = await Unit.findById(unitId);

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: "Unit not found"
      });
    }

    // Get already added program names
    const addedProgramNames =
      unit.programs.map((p) =>
        p.name.toLowerCase()
      );

    // Get programs NOT already added
    const programs = await Program.find({
      title: {
        $nin: addedProgramNames
      }
    })
      .select("title conductedBy")
      .sort({ title: 1 });

    res.status(200).json({
      success: true,
      programs,
    });

  } catch (error) {

    console.error(
      "Error fetching program list:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to fetch program list",
    });
  }
};