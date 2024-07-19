import express from "express";
import { likeBlog, isLikedByUser } from "../controllers/notifyController.js";

// middleware
import { verifyJWT } from "../middleware/verifyJWT.js"

const router = express.Router();

router.post("/like", verifyJWT, likeBlog)
router.post("/isLikedByUser", verifyJWT, isLikedByUser)


export default router;