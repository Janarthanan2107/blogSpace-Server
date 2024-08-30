import express from "express";
import { createBlog, getLatestBlog, getBlog, getallBlogsCount, getSearchBlogsCount, getSearchBlogsUsers, searchBlogs, trendingBlog, userWrittenBlogs, userWrittenBlogsCount, deleteUserWrittenBlog } from "../controllers/blogController.js";

// middleware
import { verifyJWT } from "../middleware/verifyJWT.js"

const router = express.Router();

router.post("/latestBlogs", getLatestBlog)
router.get("/trendingBlogs", trendingBlog)

router.post("/getBlogs", getBlog)
router.post("/allBlogsCount", getallBlogsCount)
router.post("/searchBlogsCount", getSearchBlogsCount)
router.post("/searchBlogUsers", getSearchBlogsUsers)
router.post("/create", verifyJWT, createBlog)
router.post("/searchBlogs", searchBlogs)
router.post("/userWrittenBlogs", verifyJWT, userWrittenBlogs)
router.post("/userWrittenBlogsCount", verifyJWT, userWrittenBlogsCount)
router.post("/deleteUserWrittenBlog", verifyJWT, deleteUserWrittenBlog)


export default router;