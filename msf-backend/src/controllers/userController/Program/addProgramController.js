import Unit from "../../../models/Unit.js";
import User from "../../../models/User.js";  
import { uploadFileToS3,deleteFileFromS3 } from "../../../config/awsS3Helper.js";

export const addProgramController = async (req, res) => {
  try {
    const { programName, description, date } = req.body;
    const userId = req.user.userId; 
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

    // 🔹 Upload all files to S3
    const imageUrls = [];
    for (const file of req.files) {
      const uploaded = await uploadFileToS3("programs/", file);
      imageUrls.push(uploaded.url);
    }

    const program = {
      name: programName,
      description,
      date,
      image: imageUrls,
      createdBy: user._id,
    };

    // 🔹 Calculate score
    const programPoints = 3; // for adding a program
    const photoPoints = imageUrls.length; // 1 per image
    const totalPoints = programPoints + photoPoints;

    // 🔹 push program into the user’s unit + update score
    const unit = await Unit.findById(user.unit);

    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    unit.programs.push(program);
    unit.totalScore = (unit.totalScore || 0) + totalPoints;

    await unit.save();

    await unit.populate("programs.createdBy", "name email");

    res.status(201).json({
      message: "Program uploaded successfully",
      program,
      totalPointsEarned: totalPoints,
      updatedTotalScore: unit.totalScore,
      unit,
    });
  } catch (error) {
    console.error("Error uploading program:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const addProgramToUnitController = async (req, res) => {
  try {
    // 1. Get data from request
    const { unitId } = req.params;
    const { name, description, date } = req.body;
    const createdByUserId = req.user.id;

    // 2. Validate inputs (this part remains the same)
    if (!name || !description || !date) {
      return res.status(400).json({ message: "Name, description, and date are required" });
    }
    if (!req.files || req.files.length < 1) {
      return res.status(400).json({ message: "At least 1 image is required" });
    }
    if (req.files.length > 10) {
      return res.status(400).json({ message: "Maximum 10 images allowed" });
    }

    // 3. Find the unit to ensure it exists (remains the same)
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
};


export const updateProgram = async (req, res) => {
  try {
    const { unitId, programId } = req.params;
    const { name, date, description } = req.body;

    // Parse image data from request body
    const existingImages = JSON.parse(req.body.existingImages || "[]");
    const imagesToDelete = JSON.parse(req.body.imagesToDelete || "[]");

    // Delete unwanted images from S3
    if (imagesToDelete.length > 0) {
      await Promise.all(imagesToDelete.map((key) => deleteFileFromS3(key)));
    }

    // Upload new images to S3 (if any)
    let newUploadedImages = [];
    if (req.files && req.files.length > 0) {
      const uploadResults = await Promise.all(
        req.files.map((file) => uploadFileToS3("programs/", file))
      );
      newUploadedImages = uploadResults.map((r) => r.url); // Only URL is saved in DB
    }

    // Normalize existing images (convert objects to URLs)
    const normalizedExisting = existingImages.map((img) =>
      typeof img === "string" ? img : img.url
    );

    // Combine existing + new images
    const finalImages = [...normalizedExisting, ...newUploadedImages].filter(Boolean);

    // Find the unit and update the specific program
    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    const program = unit.programs.id(programId);
    if (!program) {
      return res.status(404).json({ message: "Program not found" });
    }

    // Update program fields
    program.name = name;
    program.date = date;
    program.description = description;
    program.image = finalImages;

    // Save the updated unit
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
    const { unitId, programId } = req.params;

    // 1. Find the unit by its ID
    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    // 2. Find the specific program within the unit's `programs` array
    const program = unit.programs.id(programId);
    if (!program) {
      return res.status(404).json({ message: "Program not found in this unit" });
    }

    // 3. Delete associated images from S3, if they exist
    if (program.image && program.image.length > 0) {
      // Create a promise for each file deletion
      const deletePromises = program.image.map(imageUrl => {
        // IMPORTANT: Your deleteFileFromS3 function needs to be able to
        // extract the S3 object key from the full URL.
        // For example, from "https://<bucket>.s3.amazonaws.com/programs/image.jpg",
        // it should extract "programs/image.jpg".
        return deleteFileFromS3(imageUrl);
      });
      
      // Wait for all deletions to complete
      await Promise.all(deletePromises);
    }

    // 4. Remove the program sub-document from the unit's array
    // The .pull() method is Mongoose's way of removing an item from an array
    unit.programs.pull(programId);

    // 5. Save the parent unit document to persist the change
    await unit.save();

    res.status(200).json({ message: "Program deleted successfully" });

  } catch (error) {
    console.error("Error deleting program:", error);
    res.status(500).json({ message: "Server error while deleting program" });
  }
};