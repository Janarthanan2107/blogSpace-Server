import Blog from "../Schema/Blog.js";
import Comment from "../Schema/Comment.js";
import Notification from "../Schema/Notification.js";

const deleteCommentsFunc = (_id) => {
    Comment.findOneAndDelete({ _id })
        .then(comment => {
            if (comment.parent) {
                Comment.findOneAndUpdate({ _id: comment.parent }, { $pull: { children: _id } })
                    .then(data => {
                        console.log("Comment deleted from parent");
                    })
                    .catch(err => {
                        console.log(err);
                    })
            }

            Notification.findOneAndDelete({ comment: _id }).then(notification => {
                console.log("Comment notification deleted");
            })

            Notification.findOneAndUpdate({ reply: _id }, { $unset: { reply: 1 } }).then(notification => {
                console.log("reply notification deleted");
            })

            Blog.findOneAndUpdate({ _id: comment.blog_id }, { $pull: { comments: _id }, $inc: { "activity.total_comments": -1, "activity.total_parent_comments": comment.parent ? 0 : -1 } })
                .then(blog => {
                    if (comment.children.length) {
                        comment.children.map(replies => {
                            deleteCommentsFunc(replies)
                        })
                    }
                })

        })
        .catch(err => {
            console.log(err.message);
        })
}


// localhost:5000/api/blog/comment/add
export const addComment = async (req, res) => {
    let user_id = req.user;
    let { _id, comment, blog_author, replying_to, notification_id } = req.body;

    if (!comment.length) {
        return res.status(403).json({ error: "Write something to leave a comment" })
    }

    // create a comment doc
    let commentObj = {
        blog_id: _id,
        blog_author,
        comment,
        commented_by: user_id,
    }

    // console.log(commentObj, "comment Obj");

    if (replying_to) {
        commentObj.parent = replying_to;
        commentObj.isReply = true;
    }

    new Comment(commentObj).save().then(async commentFile => {

        let { _id: commentId, comment, commentedAt, children } = commentFile;

        // increment blog keys
        Blog.findOneAndUpdate({ _id }, {
            $push: { "comments": commentId },
            $inc: {
                "activity.total_comments": 1,
                "activity.total_parent_comments": replying_to ? 0 : 1
            }
        })
            .then(() => { console.log("New comment created"); })
            .catch(err => {
                return res.status(403).json({ error: err.message })
            })

        // creating notification for the user
        let notificationObj = {
            type: replying_to ? "reply" : "comment",
            blog: _id,
            notification_for: blog_author,
            user: user_id,
            comment: commentId
        }

        // console.log(notificationObj, "notificationObj")

        if (replying_to) {
            notificationObj.replied_on_comment = replying_to

            await Comment.findOneAndUpdate({ _id: replying_to }, { $push: { children: commentFile._id } })
                .then(replyingToCommentDoc => { notificationObj.notification_for = replyingToCommentDoc.commented_by })

            if (notification_id) {
                Notification.findOneAndUpdate({ _id: notification_id }, { reply: commentFile._id }).then(notification => {
                    console.log("Notification Updated");
                })
            }
        }

        new Notification(notificationObj).save().then(() => {
            console.log("New notification created");
        })

        return res.status(200).json({ comment, commentedAt, _id: commentId, user_id, children })
    })

};

// localhost:5000/api/blog/comment/getComment
export const getComments = async (req, res) => {
    let { blog_id, skip } = req.body;
    let maxLimit = 5

    Comment.find({ blog_id, isReply: false })
        .populate("commented_by", "personal_info.username personal_info.fullname personal_info.profile_img")
        .skip(skip)
        .limit(maxLimit)
        .sort({
            // negative value will give the latest data on date
            'commentedAt': -1
        })
        .then(comment => {
            // console.log(comment, "comment data");
            return res.status(200).json(comment)
        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })
};

// localhost:5000/api/blog/comment/getReplies
export const getReplies = async (req, res) => {
    let { _id, skip } = req.body;

    let maxLimit = 3

    Comment.findOne({ _id })
        .populate({
            path: "children",
            options: {
                limit: maxLimit,
                skip: skip,
                sort: { 'commentedAt': -1 }
            },
            populate: {
                path: 'commented_by',
                select: "personal_info.username personal_info.fullname personal_info.profile_img"
            },
            select: "-blog_id -updatedAt"
        })
        .select("children")
        .then(doc => {
            return res.status(200).json({ replies: doc.children })
        })
        .catch(err => {
            return res.status(500).json({ error: err.message })
        })
};

// localhost:5000/api/blog/comment/delete
export const deleteComment = async (req, res) => {
    let user_id = req.user;

    let { _id } = req.body;

    Comment.findOne({ _id })
        .then((comment) => {
            if (user_id == comment.commented_by || user_id == comment.blog_author) {
                deleteCommentsFunc(_id)

                return res.status(200).json({ status: "Done" })
            } else {
                return res.status(403).json({ error: "You can not delete this comment" })
            }
        })
}