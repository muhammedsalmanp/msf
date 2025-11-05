import Unit from "../../models/Unit.js";

export const getUnitProfile = async (req, res) => {
  try {
    const unitId = req.user.id;
   console.log( "trying to get unit profile",unitId);
   
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



