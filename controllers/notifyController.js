import Blog from "../Schema/Blog.js";
import Notification from "../Schema/Notification.js"

// like call
export const likeBlog = async (req, res) => {
    const user_id = req.user;
    const { _id, isLikedByUser } = req.body;

    const incrementVal = !isLikedByUser ? 1 : -1;

    try {
        const blog = await Blog.findOneAndUpdate(
            { _id },
            { $inc: { "activity.total_likes": incrementVal } },
            { new: true }
        );

        if (!isLikedByUser) {
            const like = new Notification({
                type: 'like',
                blog: _id,
                notification_for: blog.author,
                user: user_id
            });
            await like.save();
        } else {
            await Notification.findOneAndDelete({ user: user_id, type: 'like', blog: _id });
        }

        res.status(200).json({ liked_by_user: !isLikedByUser });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// get the data who liked the blog
export const isLikedByUser = async (req, res) => {
    const user_id = req.user;
    const { _id } = req.body;

    try {
        const result = await Notification.exists({ user: user_id, type: "like", blog: _id });
        res.status(200).json({ result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
