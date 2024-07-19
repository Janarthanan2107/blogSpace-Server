import express from "express";
import { addComment, deleteComment, getComments, getReplies } from "../controllers/commentController.js";

// middleware
import { verifyJWT } from "../middleware/verifyJWT.js"

const router = express.Router();

router.post("/add", verifyJWT, addComment)
router.post("/getComments", getComments)
router.post("/getReplies", getReplies)
router.post("/delete", verifyJWT, deleteComment)


export default router;