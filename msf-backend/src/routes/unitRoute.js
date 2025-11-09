import express from 'express';
import { getUnitProfile } from '../controllers/CO/unitController.js';
import { addProgram, updateProgram, deleteProgram } from '../controllers/CO/programController.js';
import { getCommitteeUsers, addUserToCommittee, updateUserInCommittee, changeUserRoleInCommittee, deleteUserFromCommittee } from "../controllers/CO/committeeControllers.js";
import { updateUnitUsername, changeUnitPassword } from "../controllers/CO/unitController.js"
import { verifyAccessToken } from '../middleware/verification.js';
import upload from '../config/multerConfig.js';
const router = express.Router();

//==============Profile===================
router.get("/profile", verifyAccessToken, getUnitProfile);
router.put('/username', verifyAccessToken, updateUnitUsername);
router.put('/password', verifyAccessToken, changeUnitPassword);

//=============Program===================
router.put('/programs/:programId', verifyAccessToken, upload.array('images', 10), updateProgram);
router.post(`/programs`, verifyAccessToken, upload.array('images', 10), addProgram);
router.delete('/programs/:programId', verifyAccessToken, deleteProgram);

//=============Committe====================
router.get("/committee/:committeeType", verifyAccessToken, getCommitteeUsers);
router.post("/add", verifyAccessToken, upload.single("profileImage"), addUserToCommittee);
router.put("/update/:userId", verifyAccessToken, upload.single("profileImage"), updateUserInCommittee);
router.put("/change-role/:userId", verifyAccessToken, changeUserRoleInCommittee);
router.delete("/delete/:userId", verifyAccessToken, deleteUserFromCommittee);






export default router;