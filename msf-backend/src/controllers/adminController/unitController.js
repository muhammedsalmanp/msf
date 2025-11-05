import Unit from '../../models/Unit.js';
import Role from '../../models/Role.js';
import Program from '../../models/Program.js';
import User from '../../models/User.js';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';


export const addUnit = async (req, res) => {
  try {
    const { name, panchayat } = req.body;
    console.log('Unit Name:', name);

    // Ensure the name is provided
    if (!name) return res.status(400).json({ message: 'Unit name is required' });

    // Check if the unit already exists
    const exists = await Unit.findOne({ name });
    if (exists) return res.status(409).json({ message: 'Unit already exists' });

    // Create a new unit with default values
    const unit = await Unit.create({
      name,
      panchayat,
      msfCommittee: {
        president: null,
        secretary: null,
        treasurer: null,
        vicePresidents: [],
        jointSecretaries: [],
      },
      harithaCommittee: {
        president: null,
        secretary: null,
        treasurer: null,
        vicePresidents: [],
        jointSecretaries: [],
      },
      inCharges: [],
      programs: [],
      totalScore: 0,
      averageScore: 0,
      grade: 'F',
      classification: 'Average',
      rank: 0,
    });

    // Return the created unit
    res.status(201).json(unit);
  } catch (err) {
    console.error('❌ Error while adding unit:', err);
    res.status(500).json({ message: 'Server error while adding unit' });
  }
};

export const getUnits = async (req, res) => {
  try {
    const topUnits = await Unit.find()
      .sort({ rank: 1 })
      .select('name rank grade totalScore classification');
    
    if (!topUnits.length) {
      return res.status(404).json({ message: 'No units found' });
    }
    res.status(200).json(topUnits); 
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUnitDetail = async (req, res) => {
    const { id } = req.params; 
  console.log(id);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid unit ID' });
  } 
  try {
    const unit = await Unit.findById(id)
      .populate('msfCommittee.president msfCommittee.secretary msfCommittee.treasurer msfCommittee.vicePresidents msfCommittee.jointSecretaries')
      .populate('harithaCommittee.president harithaCommittee.secretary harithaCommittee.treasurer harithaCommittee.vicePresidents harithaCommittee.jointSecretaries')
      .populate('inCharges');

    
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found' });
    }
 console.log(unit);
 
    res.status(200).json(unit);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUnitName = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Name is required." });
    }

    const unit = await Unit.findByIdAndUpdate(
      req.params.unitId,
      { name },
      { new: true, runValidators: true }
    );

    if (!unit) {
      return res.status(404).json({ message: "Unit not found." });
    }

    res.status(200).json({ message: "Unit name updated successfully.", unit });

  } catch (error) {
    handleError(res, error, "Failed to update unit name.");
  }
};

export const updateUnitUsername = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ message: "Username is required." });
    }

    // Check if username is already taken
    const existingUnit = await Unit.findOne({ username });
    if (existingUnit && existingUnit._id.toString() !== req.params.unitId) {
       return res.status(409).json({ message: "Username is already in use." });
    }

    const unit = await Unit.findByIdAndUpdate(
      req.params.unitId,
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
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "Password is required." });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const unit = await Unit.findByIdAndUpdate(
      req.params.unitId,
      { password: hashedPassword },
      { new: true }
    );

    if (!unit) {
      return res.status(404).json({ message: "Unit not found." });
    }

    res.status(200).json({ message: "Password changed successfully." });

  } catch (error) {
    handleError(res, error, "Failed to change password.");
  }
};

export const setAdminDefaults = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Default username and password are required." });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const unit = await Unit.findByIdAndUpdate(
      req.params.unitId,
      {
        adminDefaultUsername: username,
        adminDefaultPassword: hashedPassword 
      },
      { new: true }
    );

    if (!unit) {
      return res.status(404).json({ message: "Unit not found." });
    }

    res.status(200).json({ message: "Admin default credentials set." });

  } catch (error) {
    handleError(res, error, "Failed to set default credentials.");
  }
};


export const resetToDefaults = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.unitId);

    if (!unit) {
      return res.status(404).json({ message: "Unit not found." });
    }

    if (!unit.adminDefaultUsername || !unit.adminDefaultPassword) {
      return res.status(400).json({ message: "No default credentials have been set for this unit." });
    }
    

    unit.username = unit.adminDefaultUsername;
    unit.password = unit.adminDefaultPassword;

    await unit.save();

    res.status(200).json({ message: "Unit credentials have been reset to default." });

  } catch (error) {
    handleError(res, error, "Failed to reset credentials.");
  }
};