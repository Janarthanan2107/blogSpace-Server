import express from "express";
import { createBlog } from "../controllers/blogController.js";

// middleware
import { verifyJWT } from "../middleware/verifyJWT.js"

const router = express.Router();

router.post("/create", verifyJWT, createBlog)

export default router;