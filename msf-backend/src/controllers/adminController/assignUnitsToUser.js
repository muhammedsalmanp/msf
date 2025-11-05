import User from "../../models/User.js";
import Unit from "../../models/Unit.js";

/**
 * Assign one or more Units to a User as In-Charge
 * POST /api/admin/members/:userId/assign-units
 */
// export const assignUnitsToUser = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { units } = req.body; 

//     if (!units || !Array.isArray(units) || units.length === 0) {
//       return res.status(400).json({ message: "No units provided." });
//     }

//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ message: "User not found." });

//     // 1️⃣ Update User: Add unique units
//     user.inChargeOfUnits = Array.from(new Set([...user.inChargeOfUnits, ...units]));
//     await user.save();

//     // 2️⃣ Update each Unit: Add user as inCharge if not already
//     await Promise.all(
//       units.map(async (unitId) => {
//         const unit = await Unit.findById(unitId);
//         if (!unit) return;

//         if (!unit.inCharges.includes(userId)) {
//           unit.inCharges.push(userId);
//           await unit.save();
//         }
//       })
//     );

//     res.status(200).json({
//       message: "In-Charge assigned successfully.",
//       user: await User.findById(userId).populate("inChargeOfUnits", "name"),
//     });
//   } catch (error) {
//     console.error("Error assigning in-charge:", error);
//     res.status(500).json({ message: "Server error while assigning in-charge." });
//   }
// };

// export const updateUserUnitAssignments = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     // This is the *new* complete list of unit IDs from the frontend
//     const { units: newUnitIds } = req.body;

//     // Validate the new list
//     if (!newUnitIds || !Array.isArray(newUnitIds)) {
//       return res
//         .status(400)
//         .json({ message: "Invalid data: 'units' must be an array." });
//     }

//     const user = await User.findById(userId);
//     if (!user) return res.status(404).json({ message: "User not found." });

//     // 1. Get the user's *current* list of in-charge units
//     // .map(String) is important to compare with strings from req.body
//   //onst oldUnitIds = user.inChargeOfUnits.map((id) => id.toString());

//     // 2. Calculate the differences
//     const unitsToAdd = newUnitIds.filter((id) => !oldUnitIds.includes(id));
//     const unitsToRemove = oldUnitIds.filter((id) => !newUnitIds.includes(id));

//     // 3. Process Removals: Remove userId from any units he is no longer in charge of
//     if (unitsToRemove.length > 0) {
//       await Unit.updateMany(
//         { _id: { $in: unitsToRemove } },
//         { $pull: { inCharges: userId } }
//       );
//     }

//     // 4. Process Additions: Add userId to any new units
//     if (unitsToAdd.length > 0) {
//       await Unit.updateMany(
//         { _id: { $in: unitsToAdd } },
//         { $addToSet: { inCharges: userId } } // $addToSet prevents duplicates
//       );
//     }

//     // 5. Update the User document with the new, complete list
//     user.inChargeOfUnits = newUnitIds;
//     await user.save();

//     // 6. Send the updated user back
//     const updatedUser = await User.findById(userId).populate(
//       "inChargeOfUnits",
//       "name"
//     );

//     res.status(200).json({
//       message: "In-Charge units updated successfully.",
//       user: updatedUser,
//     });
//   } catch (error) {
//     console.error("Error updating in-charge units:", error);
//     res
//       .status(500)
//       .json({ message: "Server error while updating in-charge units." });
//   }
// };
export const updateUserUnitAssignments = async (req, res) => {
  try {
    const { userId } = req.params;
    // This is the *new* complete list of unit IDs from the frontend
    const { units: newUnitIds } = req.body;
    console.log(newUnitIds , userId);
    
    // Validate the new list
    if (!newUnitIds || !Array.isArray(newUnitIds)) {
      return res
        .status(400)
        .json({ message: "Invalid data: 'units' must be an array." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });
     
    console.log(user);
    
    // 1. Get the user's *current* list of in-charge units
    //
    // --- FIX APPLIED HERE ---
    // Added .filter(id => id != null) to safely remove any 'null' or 'undefined'
    // values from the array *before* calling .toString() on them.
    // This prevents the "Cannot read properties of null (reading 'toString')" error.
    //
    const oldUnitIds = user.inChargeOfUnits
      .filter((id) => id != null) // This is the fix
      .map((id) => id.toString());

    // 2. Calculate the differences
    const unitsToAdd = newUnitIds.filter((id) => !oldUnitIds.includes(id));
    const unitsToRemove = oldUnitIds.filter((id) => !newUnitIds.includes(id));

    // 3. Process Removals: Remove userId from any units he is no longer in charge of
    if (unitsToRemove.length > 0) {
      await Unit.updateMany(
        { _id: { $in: unitsToRemove } },
        { $pull: { inCharges: userId } }
      );
    }

    // 4. Process Additions: Add userId to any new units
    if (unitsToAdd.length > 0) {
      await Unit.updateMany(
        { _id: { $in: unitsToAdd } },
        { $addToSet: { inCharges: userId } } // $addToSet prevents duplicates
      );
    }

    // 5. Update the User document with the new, complete list
    // (Ensure the user's list is also clean of potential nulls)
    user.inChargeOfUnits = newUnitIds;
    await user.save();

    // 6. Send the updated user back
    const updatedUser = await User.findById(userId).populate(
      "inChargeOfUnits",
      "name"
    );
    console.log(updatedUser);
    
    res.status(200).json({
      message: "In-Charge units updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating in-charge units:", error);
    res
      .status(500)
      .json({ message: "Server error while updating in-charge units." });
  }
};