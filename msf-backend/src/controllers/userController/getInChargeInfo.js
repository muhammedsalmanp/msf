import User from "../../models/User.js";
import Unit from "../../models/Unit.js";

export const getInChargeInfo = async (req, res) => {
  try {
      console.log("get in gharg unit");
      
     const userId = req.user.id; 
    const user = await User.findById(userId)
      .populate("inChargeOfUnits", "name inCharges")
      .populate("unit", "name inCharges");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
      console.log(user);
      

    if (user.inChargeOfUnits && user.inChargeOfUnits.length > 0) {
      const inChargeUnits = await Unit.find({
        _id: { $in: user.inChargeOfUnits },
      }).populate({
        path: "inCharges",
        select: "name profileImage roles unit",
        populate: [
          { path: "roles.role", select: "roleTitle" },
          { path: "unit", select: "name" },
        ],
      });

      return res.json({
        type: "inChargeUnits",
        message: "User is in charge of these units",
        data: inChargeUnits,
      });
    }

    if (user.unit) {
      const unit = await Unit.findById(user.unit)
        .populate({
          path: "inCharges",
          select: "name profileImage roles unit",
          populate: [
            { path: "roles.role", select: "roleTitle" },
            { path: "unit", select: "name" },
          ],
        })
        .select("name inCharges");

      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }

      return res.json({
        type: "unitInCharges",
        message: "User is not an in-charge; showing their unit's in-charges",
        data: unit,
      });
    }

    console.log(res);
    
    return res.json({
      type: "noUnit",
      message: "User has no unit assigned",
      data: [],
    });
  } catch (error) {
    console.error("Error fetching incharge info:", error);
    res.status(500).json({ message: "Server error" });
  }
};
