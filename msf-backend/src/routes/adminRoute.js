import express from "express";
const router = express.Router();

import upload from '../config/multerConfig.js';

import { uploadSlide, getSlides, deleteSlide } from "../controllers/CO/slideController.js";
import { getJourneys, addJourney, deleteJourney, getJourneyById } from "../controllers/CO/journeyController.js"

import { addRole, addProgram, getRole, getAllMSFTeamMembers, getAllHrithaTeamMembers, addAdminMember } from '../controllers/adminController/adminController.js';
///////import { getJourney, addJourney, deleteJourney, getJourneyById } from "../controllers/adminController/adminController.js";
import { getUnitDetail, getUnits, addUnit } from "../controllers/adminController/unitController.js";
import { updateUserUnitAssignments } from "../controllers/adminController/assignUnitsToUser.js";

import { getMemberDetails, updateAdminMember, changeUserPassword, deleteUser } from "../controllers/adminController/userCntroler.js";

import { addProgramToUnitController, updateProgram, deleteProgram } from "../controllers/userController/Program/addProgramController.js";
import { addUserToCommittee, updateUserInCommittee, changeUserRoleInCommittee, deleteUserFromCommittee, getCommitteeUsersByUnit } from "../controllers/userController/Commetti.js";


import {
  updateUnitName,
  updateUnitUsername,
  changeUnitPassword,
  setAdminDefaults,
  resetToDefaults
} from '../controllers/adminController/unitController.js';


//=============Slide==================
router.get('/slide', getSlides);
router.post('/slide/upload', upload.single('image'), uploadSlide);
router.delete('/slide/:id', deleteSlide);

//=============Unit==================
router.post('/add-units', addUnit);
router.get('/getUnits', getUnits);
router.get('/units', getUnits);
router.get('/units/:id', getUnitDetail);

router.put('/units/:unitId/name', updateUnitName);
router.put('/units/:unitId/username', updateUnitUsername);
router.put('/units/:unitId/password', changeUnitPassword);
router.put('/units/:unitId/default-credentials', setAdminDefaults);
router.post('/units/:unitId/reset-credentials', resetToDefaults);


//=============Role==================
router.post('/add-roles', addRole);
router.get('/getRole', getRole);

//=============Program==================
router.post('/add-programs', addProgram);
router.put('/units/:unitId/programs/:programId', upload.array('images', 10), updateProgram);
router.post(`/units/:unitId/programs`, upload.array('images', 10), addProgramToUnitController);
router.delete('/units/:unitId/programs/:programId', deleteProgram);

//=============journey==================
router.post('/journey', upload.array('journeyImages', 10), addJourney);
router.get('/journey', getJourneys);
router.get('/journey/:id', getJourneyById);
router.delete('/journey/:id', deleteJourney);


//=============unit-committeeType==================
router.get("/committee/:committeeType/unit/:unitId", getCommitteeUsersByUnit);
router.post("/add", upload.single("profileImage"), addUserToCommittee);
router.put("/update/:userId", upload.single("profileImage"), updateUserInCommittee);
router.put("/change-role/:userId", changeUserRoleInCommittee);
router.delete("/delete/:userId", deleteUserFromCommittee);

//=============Main-committeeType==================
router.post('/members', upload.single('profileImage'), addAdminMember);
router.get('/members', getAllMSFTeamMembers);
router.get('/hritha-members', getAllHrithaTeamMembers);
router.put("/members/:userId/assign-units", updateUserUnitAssignments);
router.get('/members/:id', getMemberDetails);
router.put('/members/:id', upload.single('profileImage'), updateAdminMember);
router.patch('/members/:id/password', changeUserPassword);
router.delete('/members/:id', deleteUser);






export default router;