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

// receive new notification
export const getNewNotification = async (req, res) => {
    const user_id = req.user;

    Notification.exists({ notification_for: user_id, seen: false, user: { $ne: user_id } })
        .then((result) => {
            if (result) {
                return res.status(200).json({ new_notification_available: true });
            } else {
                return res.status(200).json({ new_notification_available: false });
            }
        }).catch((err) => {
            console.log(err.message);
            return res.status(500).json({ error: err.message });
        })
}

export const getNotification = async (req, res) => {
    let user_id = req.user;
    let { page, filter, deletedDocCount } = req.body

    let limit = 10;
    let skip = (page - 1) * limit
    let query = { notification_for: user_id, user: { $ne: user_id } }
    // console.log(query, "findQuery");

    if (filter !== 'all') {
        query.type = filter;
    }

    if (deletedDocCount) {
        skip -= deletedDocCount
    }

    Notification.find(query)
        .skip(skip)
        .limit(limit)
        .populate("blog", "title blog_id")
        .populate("user", "personal_info.fullname personal_info.username personal_info.profile_img")
        .populate("comment", "comment")
        .populate("replied_on_comment", "comment")
        .populate("reply", "comment")
        .sort({ createdAt: -1 })
        .select("createdAt type seen reply")
        .then(notification => {
            // console.log(notification, "notification");

            return res.status(200).json({ notification })
        }).catch(error => {
            console.log(error);

            return res.status(403).json({ "error": error.message })
        });
}

export const getAllNotificationCount = (req, res) => {
    let user_id = req.user;
    let { filter } = req.body

    let query = { notification_for: user_id, user: { $ne: user_id } }

    if (filter !== 'all') {
        query.type = filter;
    }

    Notification.countDocuments(query)
        .then(count => {
            return res.status(200).json({ "totalDocs": count })
        })
        .catch(error => {
            return res.status(403).json({ "error": error.message })
        })
}