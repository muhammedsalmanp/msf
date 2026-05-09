import Unit from "../../models/Unit.js";
import User from "../../models/User.js";  
import { uploadFileToS3,deleteFileFromS3 } from "../../config/awsS3Helper.js";


export const addProgramToUnitController = async (req, res) => {
  try {
 
    const { name, description, date } = req.body;
    const unitId = req.user.id;
    const createdByUserId= unitId;
    
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

    // 4. Upload images to S3 (remains the same)
    const imageUrls = [];
    for (const file of req.files) {
      const uploaded = await uploadFileToS3("programs/", file);
      imageUrls.push(uploaded.url);
    }

    // 5. Create a new program OBJECT (not a document)
    const newProgramData = {
      name,
      description,
      date,
      image: imageUrls,
      createdBy: createdByUserId,
    };

    // 6. Calculate points
    const programPoints = 3;
    const photoPoints = imageUrls.length;
    const totalPoints = programPoints + photoPoints;

    // 7. Push the new program object into the unit's programs array and update score
    unit.programs.push(newProgramData); // 👈 Pushing the object directly
    unit.totalScore = (unit.totalScore || 0) + totalPoints;

    // 8. Save the updated unit document
    await unit.save();
    
    // 9. Get the newly added program from the unit for the response
    // Mongoose automatically adds an _id to the subdocument
    const createdProgram = unit.programs[unit.programs.length - 1];

    // 10. Send a success response
    res.status(201).json({
      message: "Program added to unit successfully",
      program: createdProgram, // Send the newly created subdocument back
      updatedTotalScore: unit.totalScore,
    });

  } catch (error) {
    console.error("Error adding program to unit:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

export const updateProgram = async (req, res) => {
  try {
    const { programId } = req.params;
    const { name, date, description } = req.body;
    const unitId = req.user.id;

    const existingImages = JSON.parse(req.body.existingImages || "[]");
    const imagesToDelete = JSON.parse(req.body.imagesToDelete || "[]");

    if (imagesToDelete.length > 0) {
      await Promise.all(imagesToDelete.map((key) => deleteFileFromS3(key)));
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

    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    const program = unit.programs.id(programId);
    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }

    program.name = name;
    program.date = date;
    program.description = description;
    program.image = finalImages;

    await unit.save();

    res.status(200).json({
      message: "Program updated successfully",
      program,
    });
  } catch (error) {
    console.error("Error updating program:", error);
    res.status(500).json({ message: "Server error while updating program" });
  }
};

export const deleteProgram = async (req, res) => {
  try {
    const { programId } = req.params;
    const unitId = req.user.id;

    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    const program = unit.programs.id(programId);
    if (!program) {
      return res.status(404).json({ message: "Program not found in this unit" });
    }

    if (program.image && program.image.length > 0) {

      const deletePromises = program.image.map(imageUrl => {
        return deleteFileFromS3(imageUrl);

      });

      await Promise.all(deletePromises);
    }

    unit.programs.pull(programId);

    await unit.save();

    res.status(200).json({ message: "Program deleted successfully" });

  } catch (error) {
    console.error("Error deleting program:", error);
    res.status(500).json({ message: "Server error while deleting program" });
  }
};