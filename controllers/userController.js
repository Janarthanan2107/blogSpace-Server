import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import { getAuth } from "firebase-admin/auth";

import User from "../Schema/User.js";
import Blog from "../Schema/Blog.js";
import Comment from "../Schema/Comment.js";
import Notification from "../Schema/Notification.js"

const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

const formateDataToSend = (user) => {
    const access_token = jwt.sign({ id: user._id }, process.env.SECRET_ACCESS_KEY);
    return {
        access_token,
        profile_img: user.personal_info.profile_img,
        username: user.personal_info.username,
        fullname: user.personal_info.fullname,
        googleAuth: user.google_auth
    };
};

const generateUserName = async (email) => {
    let username = email.split("@")[0];
    const isUsernameNotUnique = await User.exists({ "personal_info.username": username });
    if (isUsernameNotUnique) username += nanoid().substring(0, 5);
    return username;
};

export const signup = async (req, res) => {
    const { fullname, email, password } = req.body;

    if (fullname.length < 3) return res.status(403).json({ error: "Full name must be at least 3 letters long" });
    if (!email.length) return res.status(403).json({ error: "Enter email" });
    if (!emailRegex.test(email)) return res.status(403).json({ error: "Enter a valid email address" });
    if (!passwordRegex.test(password)) return res.status(403).json({ error: "Password should be 6 to 20 characters long with a numeric, 1 uppercase, and 1 lowercase letter" });

    try {
        const hashed_password = await bcrypt.hash(password, 10);
        const username = await generateUserName(email);
        const user = new User({
            personal_info: { fullname, email, password: hashed_password, username },
        });
        await user.save();
        return res.status(200).json(formateDataToSend(user));
    } catch (err) {
        if (err.code == 11000) return res.status(500).json({ error: "Email already exists!" });
        return res.status(500).json({ error: err.message });
    }
};

export const signin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ "personal_info.email": email });
        if (!user) return res.status(403).json({ error: "Email not found" });

        if (user.isDeleted) return res.status(403).json({ error: "Account has been deleted" });

        const result = await bcrypt.compare(password, user.personal_info.password);
        if (!result) return res.status(403).json({ error: "Incorrect Password" });

        return res.status(200).json(formateDataToSend(user));
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};


export const googleAuth = async (req, res) => {
    const { access_token } = req.body;

    try {
        const decodedUser = await getAuth().verifyIdToken(access_token);
        let { email, name, picture } = decodedUser;

        picture = picture?.replace("s96-c", "s384-c");

        let user = await User.findOne({ "personal_info.email": email })
            .select("personal_info.fullname personal_info.username personal_info.profile_img google_auth");

        if (user) {
            if (!user.google_auth) {
                return res.status(403).json({ error: "This email was signed up without Google. Please log in with password to access the account." });
            }
        } else {
            const username = await generateUserName(email);
            user = new User({
                personal_info: { fullname: name, email, username },
                google_auth: true
            });

            user = await user.save();
        }

        return res.status(200).json(formateDataToSend(user));
    } catch (err) {
        return res.status(500).json({ error: "Failed to authenticate with Google. Try with another Gmail address." });
    }
};

// change password
export const changeAuth = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user;

    if (!currentPassword || !newPassword) {
        return res.status(403).json({ error: "Fill all the inputs" });
    }

    if (!passwordRegex.test(newPassword)) {
        return res.status(403).json({ error: "Password should be 6 to 20 characters long with a numeric, 1 uppercase, and 1 lowercase letter" });
    }

    try {
        // Fetch user from database
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Check if user is a Google user
        if (user.google_auth) {
            return res.status(403).json({ error: "Google-authenticated users cannot change password" });
        }

        // Check if current password is correct
        const isPasswordMatch = await bcrypt.compare(currentPassword, user.personal_info.password);
        if (!isPasswordMatch) {
            return res.status(403).json({ error: "Current password is incorrect" });
        }

        // Hash new password and update
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.personal_info.password = hashedNewPassword;
        await user.save();

        return res.status(200).json({ message: "Password updated successfully" });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// get a logged in user
export const getUserProfile = async (req, res) => {
    let { username } = req.body;

    User.findOne({ "personal_info.username": username })
        .select("-personal_info.password -google_auth -updatedAt -blogs")
        .then(user => {
            return res.status(200).json(user)
        })
        .catch(err => {
            console.log(err);
            return res.status(500).json(err.message);
        })
}

// update user
export const updateUserProfile = async (req, res) => {
    const userId = req.user;
    const { personal_info, social_links } = req.body;

    try {
        // Fetch user from database
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Update user details
        if (personal_info) {

            let { username, bio, profile_img } = personal_info;

            user.personal_info.username = username;
            user.personal_info.bio = bio;
            user.personal_info.profile_img = profile_img;
        }

        if (social_links) {
            user.social_links = {
                ...user.social_links,
                ...social_links
            };
        }

        await user.save();

        return res.status(200).json({ message: "Profile updated successfully", user });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// delete user
export const deleteUserProfile = async (req, res) => {
    const userId = req.user;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Set isDeleted flag to true
        user.isDeleted = true;
        await user.save();

        return res.status(200).json({ message: "User profile marked as deleted" });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
};


