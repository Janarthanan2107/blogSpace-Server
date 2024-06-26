import express from "express";
import { createBlog, getBlog ,searchBlogs,trendingBlog} from "../controllers/blogController.js";

// middleware
import { verifyJWT } from "../middleware/verifyJWT.js"

const router = express.Router();

router.get("/latestBlogs", getBlog)
router.post("/create", verifyJWT, createBlog)
router.get("/trendingBlogs", trendingBlog)
router.post("/searchBlogs", searchBlogs)

export default router;