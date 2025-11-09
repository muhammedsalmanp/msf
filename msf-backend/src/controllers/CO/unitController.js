import Unit from '../../models/Unit.js';
import Role from '../../models/Role.js';
import Program from '../../models/Program.js';
import User from '../../models/User.js';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt'



export const getUnits = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 9;
    const skip = (page - 1) * limit;

    const units = await Unit.find()
      .sort({ rank: 1 })
      .skip(skip)
      .limit(limit)
      .select('name rank grade totalScore classification');
    const totalUnits = await Unit.countDocuments();
    const totalPages = Math.ceil(totalUnits / limit);

    if (!units.length && page === 1) {
      return res.status(404).json({ message: 'No units found' });
    }

    res.status(200).json({
      units,
      currentPage: page,
      totalPages,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUnitDetails = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid unit ID' });
  }

  try {
    const unit = await Unit.findById(id)
      .select('name grade rank totalScore programs');

    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }
    res.status(200).json(unit);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUnitCommittee = async (req, res) => {
  const { id, type } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid unit ID' });
  }

  const committeePath = type === 'msf' ? 'msfCommittee' : 'harithaCommittee';
  const populatePaths = [
    `${committeePath}.president`,
    `${committeePath}.secretary`,
    `${committeePath}.treasurer`,
    `${committeePath}.vicePresidents`,
    `${committeePath}.jointSecretaries`
  ];

  try {
    const unit = await Unit.findById(id)
      .select(committeePath)
      .populate(populatePaths);

    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    res.status(200).json(unit[committeePath]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


//=================Unit User===================

export const getUnitProfile = async (req, res) => {
  try {
    const unitId = req.user.id;
    console.log("trying to get unit profile", unitId);

    const unit = await Unit.findById(unitId)
      .select('-password -adminDefaultPassword')
      .populate('msfCommittee.president', 'name role profileImage')
      .populate('msfCommittee.secretary', 'name role profileImage')
      .populate('msfCommittee.treasurer', 'name role profileImage')
      .populate('msfCommittee.vicePresidents', 'name role profileImage')
      .populate('msfCommittee.jointSecretaries', 'name role profileImage')
      .populate('harithaCommittee.president', 'name role profileImage')
      .populate('harithaCommittee.secretary', 'name role profileImage')
      .populate('harithaCommittee.treasurer', 'name role profileImage')
      .populate('harithaCommittee.vicePresidents', 'name role profileImage')
      .populate('harithaCommittee.jointSecretaries', 'name role profileImage');

    if (!unit) {
      return res.status(404).json({ message: "Unit profile not found." });
    }
    if (unit.programs && unit.programs.length > 0) {
      unit.programs.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    res.status(200).json(unit);

  } catch (error) {
    console.error("Error fetching unit profile:", error);
    res.status(500).json({ message: "Server error fetching profile.", error: error.message });
  }
};

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
    const { oldPassword, password } = req.body;
    console.log(oldPassword, password);

    if (!oldPassword || !password) {
      return res.status(400).json({ message: "Old and new passwords are required." });
    }

    const unit = await Unit.findById(req.user.userId);
    if (!unit) {
      return res.status(404).json({ message: "Unit not found." });
    }

    const isMatch = await bcrypt.compare(oldPassword, unit.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect old password." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    unit.password = hashedPassword;
    await unit.save();

    res.status(200).json({ message: "Password changed successfully." });

  } catch (error) {
    handleError(res, error, "Failed to change password.");
  }
};
