import express from "express";
import { createBlog, getBlog, getallBlogsCount, getSearchBlogsCount, searchBlogs, trendingBlog } from "../controllers/blogController.js";

// middleware
import { verifyJWT } from "../middleware/verifyJWT.js"

const router = express.Router();

router.post("/latestBlogs", getBlog)
router.post("/allBlogsCount", getallBlogsCount)
router.post("/searchBlogsCount", getSearchBlogsCount)
router.post("/create", verifyJWT, createBlog)
router.post("/searchBlogs", searchBlogs)
router.get("/trendingBlogs", trendingBlog)

export default router;