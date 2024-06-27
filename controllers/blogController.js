import { nanoid } from "nanoid";
import Blog from "../Schema/Blog.js";
import User from "../Schema/User.js";

export const getBlog = async (req, res) => {
    try {
        let { page } = req.body;
        const maxLimit = 5;

        const blogs = await Blog.find({ draft: false })
            .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
            .sort({ publishedAt: -1 })
            .select("blog_id title des banner activity tags publishedAt -_id")
            .skip((page - 1) * maxLimit)
            .limit(maxLimit);

        res.status(200).json({ blogs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const createBlog = async (req, res) => {

    const authorID = req.user

    // Destructure
    let { title, banner, des, content, tags, draft } = req.body;

    let blog_id = title.replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, '-').trim() + '-' + nanoid();

    tags = tags.map(tag => tag.toLowerCase());

    const blogObject = {
        title,
        banner,
        des,
        content,
        tags,
        author: authorID,
        blog_id
    }

    try {
        // Create and save the new blog
        const blog = new Blog(blogObject);
        // console.log(blog, ":blog")
        const savedBlog = await blog.save();
        // console.log(savedBlog, ":savedBlog");

        const incrementVal = draft ? 0 : 1;
        const updatedUser = await User.findOneAndUpdate(
            { _id: authorID },
            {
                $inc: { "account_info.total_posts": incrementVal },
                $push: { "blogs": savedBlog._id }
            },
            { new: true } // Return the updated document
        );

        console.log(updatedUser, ":updatedUser");

        // Return a successful response
        return res.status(201).json({
            success: true,
            message: `Your blog successfully created with the ID: ${savedBlog._id}`
        });
    } catch (error) {
        console.log(error);

        // Return an error response
        return res.status(500).json({
            success: false,
            message: "An error occurred while creating the blog.",
            error: error.message
        });
    }
};

export const trendingBlog = async (req, res) => {
    try {
        const maxLimit = 5;

        const blogs = await Blog.find({ draft: false })
            .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
            .sort({ "activity.total_read": -1, "activity.total_likes": -1, "publishedAt": -1 })
            .select("blog_id title publishedAt -_id")
            .limit(maxLimit);

        res.status(200).json({ blogs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export const searchBlogs = async (req, res) => {
    let { tag, page } = req.body;

    let findQuery = { tags: tag, draft: false };

    let maxLimit = 2;
    try {
        const blogs = await Blog.find(findQuery)
            .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
            .sort({ publishedAt: -1 })
            .select("blog_id title des banner activity tags publishedAt -_id")
            .skip((page - 1) * maxLimit)
            .limit(maxLimit);

        res.status(200).json({ blogs });
    } catch (error) {
        res.status(500).json({ error: err.message });
    }
}

export const getSearchBlogsCount = async (req, res) => {
    let { tag } = req.body;

    let findQuery = { tags: tag, draft: false };

    try {
        Blog.countDocuments(findQuery)
            .then(count => {
                return res.status(200).json({ totalDocs: count });
            })
            .catch(err => {
                return res.status(500).json({ error: err.message });
            })
    } catch (error) {
        console.error("Error counting blog documents:", err.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const getallBlogsCount = async (req, res) => {
    try {
        const count = await Blog.countDocuments({ draft: false });
        return res.status(200).json({ totalDocs: count });
    } catch (err) {
        console.error("Error counting blog documents:", err.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
