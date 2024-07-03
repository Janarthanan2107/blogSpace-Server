import express from "express";
import { createBlog, getLatestBlog, getBlog, getallBlogsCount, getSearchBlogsCount, getSearchBlogsUsers, searchBlogs, trendingBlog } from "../controllers/blogController.js";

// middleware
import { verifyJWT } from "../middleware/verifyJWT.js"

const router = express.Router();

router.post("/latestBlogs", getLatestBlog)
router.post("/getBlogs", getBlog)
router.post("/allBlogsCount", getallBlogsCount)
router.post("/searchBlogsCount", getSearchBlogsCount)
router.post("/searchBlogUsers", getSearchBlogsUsers)
router.post("/create", verifyJWT, createBlog)
router.post("/searchBlogs", searchBlogs)

router.get("/trendingBlogs", trendingBlog)

export default router;