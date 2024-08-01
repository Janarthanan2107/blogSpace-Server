import express from "express";
import { signup, signin, googleAuth, changeAuth, getUserProfile, updateUserProfile, deleteUserProfile } from "../controllers/userController.js";
import { verifyJWT } from "../middleware/verifyJWT.js";

const router = express.Router();

// auth
router.post("/signup", signup);
router.post("/signin", signin);
router.post("/google-auth", googleAuth);

// get logged in user
router.post("/getUserProfile", getUserProfile);

// change password
router.post("/change-Auth", verifyJWT, changeAuth);

// update user profile
router.post("/updateUserProfile", verifyJWT, updateUserProfile);

// delete profile
router.delete("/deleteUserProfile", verifyJWT, deleteUserProfile);

export default router;
