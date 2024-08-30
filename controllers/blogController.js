import { nanoid } from "nanoid";
import Blog from "../Schema/Blog.js";
import User from "../Schema/User.js";
import Notification from "../Schema/Notification.js";
import Comment from "../Schema/Comment.js";

// Helper function to format blog query
const formatBlogQuery = (tag, query, author, eliminate_blog) => {
    if (tag) {
        return { tags: tag, draft: false, blog_id: { $ne: eliminate_blog } };
    } else if (query) {
        return { draft: false, title: new RegExp(query, "i") };
    } else if (author) {
        return { author, draft: false };
    } else {
        return { draft: false };
    }
};

// Fetch paginated blogs
export const getLatestBlog = async (req, res) => {
    const { page } = req.body;
    const maxLimit = 5;
    try {
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

// get single blog
export const getBlog = async (req, res) => {
    let { blog_id, draft, mode } = req.body;
    let incrementVal = mode !== 'edit' ? 1 : 0;

    try {
        const blog = await Blog.findOneAndUpdate({ blog_id }, { $inc: { "activity.total_reads": incrementVal } })
            .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname")
            .select("title des content banner activity publishedAt blog_id tags");

        if (!blog) {
            return res.status(404).json({ error: "Blog not found" });
        }

        try {
            await User.findOneAndUpdate(
                { "personal_info.username": blog.author.personal_info.username },
                { $inc: { "account_info.total_reads": incrementVal } },
                { new: true }
            );

            if (blog.draft && !draft) {
                return res.status(500).json({ error: 'You cannot access the draft blogs' })
            }
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }

        return res.status(200).json({ blog });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// Create a new blog
export const createBlog = async (req, res) => {
    const authorID = req.user;
    const { title, banner, des, content, tags, draft, id } = req.body;
    const blog_id = id || `${title.replace(/[^a-zA-Z0-9]/g, ' ').replace(/\s+/g, '-').trim()}-${nanoid()}`;
    const formattedTags = tags?.map(tag => tag.toLowerCase());

    if (id) {
        try {
            // console.log(Blog, "Blog_ID");
            await Blog.findOneAndUpdate(
                { blog_id },
                { title, des, banner, content, tags: formattedTags, draft: draft ? draft : false }
            );
            return res.status(200).json({ id: blog_id });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    } else {
        const blogObject = {
            title,
            banner,
            des,
            content,
            tags: formattedTags,
            author: authorID,
            draft: Boolean(draft),
            blog_id
        };

        try {
            const blog = new Blog(blogObject);
            const savedBlog = await blog.save();

            const incrementVal = draft ? 0 : 1;
            await User.findByIdAndUpdate(
                authorID,
                {
                    $inc: { "account_info.total_posts": incrementVal },
                    $push: { blogs: savedBlog._id }
                },
                { new: true }
            );

            res.status(201).json({
                success: true,
                message: `Your blog was successfully created with the ID: ${savedBlog._id}`
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "An error occurred while creating the blog.",
                error: error.message
            });
        }
    }
};

// Fetch trending blogs
export const trendingBlog = async (req, res) => {
    const maxLimit = 5;
    try {
        const blogs = await Blog.find({ draft: false })
            .populate("author", "personal_info.profile_img personal_info.username personal_info.fullname -_id")
            .sort({ "activity.total_read": -1, "activity.total_likes": -1, "publishedAt": -1 })
            .select("blog_id title publishedAt -_id")
            .limit(maxLimit);

        res.status(200).json({ blogs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Search blogs based on tag, query, or author
export const searchBlogs = async (req, res) => {
    const { tag, query, author, page, limit, eliminate_blog } = req.body;
    const maxLimit = limit ? limit : 2;

    try {
        let findQuery = formatBlogQuery(tag, query, author, eliminate_blog);
        const blogs = await Blog.find(findQuery)
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

// Get the count of blogs matching the search criteria
export const getSearchBlogsCount = async (req, res) => {
    const { tag, author, query } = req.body;

    try {
        const findQuery = formatBlogQuery(tag, query, author);
        const count = await Blog.countDocuments(findQuery);
        res.status(200).json({ totalDocs: count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Search for users based on a query
export const getSearchBlogsUsers = async (req, res) => {
    const { query } = req.body;

    try {
        const users = await User.find({ "personal_info.username": new RegExp(query, "i") })
            .limit(50)
            .select("personal_info.fullname personal_info.username personal_info.profile_img -_id");

        res.status(200).json({ users });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get the total count of all blogs
export const getallBlogsCount = async (req, res) => {
    try {
        const count = await Blog.countDocuments({ draft: false });
        res.status(200).json({ totalDocs: count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get the all blogs with draft
export const userWrittenBlogs = async (req, res) => {
    let user_id = req.user;

    let { page, draft, query, deletedDocCount } = req.body;

    let maxLimit = 5;

    let skipDocs = (page - 1) * maxLimit;

    if (deletedDocCount) {
        skipDocs -= deletedDocCount;
    }

    Blog.find({ author: user_id, draft, title: new RegExp(query, 'i') })
        .skip(skipDocs)
        .limit(maxLimit)
        .sort({ publishedAt: -1 })
        .select("title banner publishedAt blog_id activity des draft -_id")
        .then(
            blogs => {
                return res.status(200).json({ blogs })
            })
        .catch(
            err => {
                return res.status(500).json({ error: err.message })
            }
        )
}

// Get the total count of all blogs with draft
export const userWrittenBlogsCount = async (req, res) => {
    let user_id = req.user;

    let { draft, query } = req.body;

    Blog.countDocuments({ author: user_id, draft, title: new RegExp(query, 'i') })
        .then(count => {
            return res.status(200).json({ totalDocs: count })
        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })
}

// delete the selected blog from dashboard
export const deleteUserWrittenBlog = async (req, res) => {
    let user_id = req.user;
    let { blog_id } = req.body;

    // console.log(blog_id, "blog_id");


    Blog.findOneAndDelete({ blog_id })
        .then((blog) => {
            Notification.deleteMany({ "blog": blog._id }).then(data => {
                console.log("Notification Deleted");
            })

            Comment.deleteMany({ "blog_id": blog._id }).then(data => {
                console.log("Comments Deleted");
            })

            User.findOneAndUpdate({ _id: user_id }, { $pull: { blog: blog._id }, $inc: { "account_info:total_posts": -1 } })
                .then(user => {
                    console.log("Blog Deleted");

                })

            return res.status(200).json({ message: "Blog Deleted Successful" })
        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })
}