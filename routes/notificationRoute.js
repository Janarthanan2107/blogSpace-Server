import express from "express";
import { likeBlog, isLikedByUser, getNewNotification, getNotification, getAllNotificationCount } from "../controllers/notifyController.js";

// middleware
import { verifyJWT } from "../middleware/verifyJWT.js"

const router = express.Router();

router.post("/like", verifyJWT, likeBlog)
router.post("/isLikedByUser", verifyJWT, isLikedByUser)
router.get("/new-notification", verifyJWT, getNewNotification)
router.post("/get-notifications", verifyJWT, getNotification)
router.post("/get-All-notificationsCount", verifyJWT, getAllNotificationCount)


export default router;