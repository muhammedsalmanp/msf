import express from 'express';
import { getSlides } from '../controllers/CO/slideController.js';
import { getMainCommittee, getHarithaCommittee } from '../controllers/CO/committeecontrollers.js';
import { getJourney } from '../controllers/CO/journeyController.js';
import { getUnits, getUnitDetails, getUnitCommittee } from '../controllers/CO/unitController.js';
import { getUserProfile, EditProfileController, changePasswordController } from '../controllers/CO/userController.js';
import { addProgramToUnit, updateProgramToUnit, deleteProgramfromUnit } from '../controllers/CO/programController.js'
import { addProgram, getProgram, deleteProgram } from '../controllers/CO/programController.js'
import {
    getCommitteeUsersByUnit,
    deleteUserFromCommittee,
    updateCommitteeAndUserRoles,
    addUserToCommittee,
    updateUserInCommittee,
    changeUserRoleInCommittee,
} from '../controllers/CO/committeecontrollers.js';
import { getInChargeInfo } from '../controllers/userController/getInChargeInfo.js';
import { verifyAccessToken } from '../middleware/verification.js';
import upload from '../config/multerConfig.js';
import cacheMiddleware from '../middleware/cacheMiddleware.js';


const router = express.Router();


//===========Public===============
router.get('/slides', cacheMiddleware(300), getSlides);
router.get('/main-committee', cacheMiddleware(3600), getMainCommittee);
router.get('/haritha-committee', cacheMiddleware(3600), getHarithaCommittee);
router.get('/journey', cacheMiddleware(3600), getJourney);
router.get('/units', cacheMiddleware(3600), getUnits);
router.get('/unit-details/:id', cacheMiddleware(3600), getUnitDetails);
router.get('/unit-committee/:id/:type', cacheMiddleware(3600), getUnitCommittee);


//=============Profile============
router.get("/profile", verifyAccessToken, getUserProfile);
router.post("/profile", verifyAccessToken, upload.single("profileImage"), EditProfileController);
router.put("/change-password", verifyAccessToken, changePasswordController);
router.get("/incharge-info", verifyAccessToken, getInChargeInfo);


//=============incharg============

//=============incharg-Committee============
router.get("/committee/:committeeType/unit/:unitId", verifyAccessToken, getCommitteeUsersByUnit);
router.put("/units/:committeeType/committee", verifyAccessToken, updateCommitteeAndUserRoles);
router.post("/add", verifyAccessToken, upload.single("profileImage"), addUserToCommittee);
router.put("/update/:userId", verifyAccessToken, upload.single("profileImage"), updateUserInCommittee);
router.put("/change-role/:userId", verifyAccessToken, changeUserRoleInCommittee);
router.delete("/delete/:userId", verifyAccessToken, deleteUserFromCommittee);

//=============incharg-prgram============
router.post(`/units/:unitId/programs`, verifyAccessToken, upload.array('images', 10), addProgramToUnit);
router.put('/units/:unitId/programs/:programId', verifyAccessToken, upload.array('images', 10), updateProgramToUnit);
router.delete('/units/:unitId/programs/:programId', verifyAccessToken, deleteProgramfromUnit);

//==============Unit Handils=======================
router.post("/program/add", verifyAccessToken, upload.array("photos", 10), addProgram);
router.delete("/programs/:id", verifyAccessToken, deleteProgram);
router.get("/programs", verifyAccessToken, getProgram);




export default router;
