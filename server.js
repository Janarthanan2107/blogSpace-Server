import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import admin from "firebase-admin";
import serviceAccountKey from "./blog-space-user-firebase-adminsdk-nx8my-487b993063.json" assert { type: "json" };

// service
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import blogRoutes from "./routes/blogRoutes.js"
import notifyRoutes from "./routes/notificationRoute.js"
import commentRoutes from "./routes/commentRoutes.js"

dotenv.config();

const server = express();
const PORT = process.env.PORT || 5000;

server.use(express.urlencoded({ extended: false }))
server.use(express.json({ limit: '50mb' }));
server.use(cors());

// fire base initial stage
admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey),
});

// db
connectDB();

// common route
server.use("/api", userRoutes);
server.use("/api/blog", blogRoutes);
server.use("/api/blog/notify", notifyRoutes);
server.use("/api/blog/comment", commentRoutes);

server.listen(PORT, () => {
    console.log(`App listening on port -> ${PORT}`);
});
