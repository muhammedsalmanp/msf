import express from 'express';
import { Login,logoutUser,getUnits } from '../controllers/authController.js';
import { refresh } from '../controllers/refreshToken.js';

const router = express.Router();

router.post ('/login',Login);
router.post("/logout", logoutUser);
router.get("/units",getUnits)
router.post('/refresh',refresh);

export default router;