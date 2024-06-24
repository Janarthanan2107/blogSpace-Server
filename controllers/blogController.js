import { nanoid } from "nanoid";
import Blog from "../Schema/Blog.js";
import User from "../Schema/User.js";

export const createBlog = async (req, res) => {

    const authorID = req.user

    // Destructure
    let { title, banner, des, content, tags, draft } = req.body;

    let blog_id = title.replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, '-').trim() + '-' + nanoid();

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
