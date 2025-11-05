import express from 'express';
import { verifyAccessToken } from '../middleware/verification.js';
import upload from '../config/multerConfig.js';

import { getUnitProfile } from '../controllers/unitCondroler/UnitCondroler.js';
import { addProgramToUnitController,updateProgram,deleteProgram } from '../controllers/unitCondroler/ProgramCondroler.js';
import {updateUnitUsername,changeUnitPassword} from "../controllers/unitCondroler/setingscondroler.js"

import { addUserToCommittee, updateUserInCommittee, changeUserRoleInCommittee, deleteUserFromCommittee } from "../controllers/userController/Commetti.js";
import { getCommitteeUsersByUnit  } from '../controllers/unitCondroler/profilecondroler.js';



const router = express.Router();

router.get("/profile",verifyAccessToken,getUnitProfile);

router.get("/committee/:committeeType",verifyAccessToken, getCommitteeUsersByUnit);

router.put('/programs/:programId',verifyAccessToken, upload.array('images', 10), updateProgram);
router.post(`/programs`,verifyAccessToken, upload.array('images', 10), addProgramToUnitController);
router.delete('/programs/:programId',verifyAccessToken, deleteProgram);

router.post("/add",verifyAccessToken, upload.single("profileImage"), addUserToCommittee);
router.put("/update/:userId",verifyAccessToken, upload.single("profileImage"), updateUserInCommittee);
router.put("/change-role/:userId",verifyAccessToken, changeUserRoleInCommittee);
router.delete("/delete/:userId",verifyAccessToken, deleteUserFromCommittee);

router.put('/username',verifyAccessToken,updateUnitUsername);
router.put('/password',verifyAccessToken,changeUnitPassword);




export default router;