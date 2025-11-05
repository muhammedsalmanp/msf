import Unit from '../../models/Unit.js';
import User from '../../models/User.js';


export const getMainCommittee = async (req, res) => {
  try {
    const users = await User.find({
      gender: 'male',
      roles: { $elemMatch: { scope: 'main' } }
    })
    .populate('roles.role', 'title')
    .populate('unit', 'name')
    .select('name gender profileImage roles unit');

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching main committee:', error);
    res.status(500).json({ message: 'Failed to fetch main committee' });
  }
};

export const getHarithaCommittee = async (req, res) => {
  try {
    const users = await User.find({
      gender: 'female',
      roles: { $elemMatch: { scope: 'main' } } 
    })
    .populate('roles.role', 'title')
    .populate('unit', 'name')
    .select('name gender profileImage roles unit');

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching Haritha committee:', error);
    res.status(500).json({ message: 'Failed to fetch Haritha committee' });
  }
};