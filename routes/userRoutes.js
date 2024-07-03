import express from "express";
import { signup, signin, googleAuth, getUserProfile } from "../controllers/userController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/google-auth", googleAuth);

router.post("/getUserProfile", getUserProfile);

export default router;
