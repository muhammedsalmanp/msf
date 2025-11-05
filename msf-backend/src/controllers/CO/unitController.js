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