import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";
import { getAuth } from "firebase-admin/auth";
import User from "../Schema/User.js";

const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;

const formateDataToSend = (user) => {
    const access_token = jwt.sign({ id: user._id }, process.env.SECRET_ACCESS_KEY);
    return {
        access_token,
        profile_img: user.personal_info.profile_img,
        username: user.personal_info.username,
        fullname: user.personal_info.fullname,
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
                personal_info: { fullname: name, email, profile_img: picture, username },
                google_auth: true
            });

            user = await user.save();
        }

        return res.status(200).json(formateDataToSend(user));
    } catch (err) {
        return res.status(500).json({ error: "Failed to authenticate with Google. Try with another Gmail address." });
    }
};
