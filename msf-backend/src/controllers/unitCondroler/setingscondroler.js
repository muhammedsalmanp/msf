import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Unit from '../../models/Unit.js';


export const updateUnitUsername = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: "Username is required." });
    }

    const existingUnit = await Unit.findOne({ username });
    if (existingUnit && existingUnit._id.toString() !== req.params.unitId) {
       return res.status(409).json({ message: "Username is already in use." });
    }

    const unit = await Unit.findByIdAndUpdate(
      req.user.userId,
      { username },
      { new: true, runValidators: true }
    );

    if (!unit) {
      return res.status(404).json({ message: "Unit not found." });
    }

    res.status(200).json({ message: "Unit username updated successfully.", unit });

  } catch (error) {
    handleError(res, error, "Failed to update unit username.");
  }
};

export const changeUnitPassword = async (req, res) => {
  try {
    // 1. Get both old and new passwords from the request body
    const { oldPassword, password } = req.body;
    console.log(oldPassword,password);
    
    // 2. Validate input
    if (!oldPassword || !password) {
      return res.status(400).json({ message: "Old and new passwords are required." });
    }

    // 3. Find the unit by ID
    const unit = await Unit.findById(req.user.userId);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found." });
    }

    // 4. Compare the provided oldPassword with the one in the database
    const isMatch = await bcrypt.compare(oldPassword, unit.password);

    // 5. If they don't match, send an error
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect old password." });
    }

    // 6. If they DO match, hash the NEW password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 7. Update the unit's password in the database
    unit.password = hashedPassword;
    await unit.save(); // Use save() to trigger any middleware

    res.status(200).json({ message: "Password changed successfully." });

  } catch (error) {
    handleError(res, error, "Failed to change password.");
  }
};
