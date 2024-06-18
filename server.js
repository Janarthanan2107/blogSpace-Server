import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import admin from "firebase-admin";
import serviceAccountKey from "./blog-space-user-firebase-adminsdk-nx8my-487b993063.json" assert { type: "json" };

// service
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const server = express();
const PORT = process.env.PORT || 5000;

server.use(express.json());
server.use(cors());

// fire base initial stage
admin.initializeApp({
    credential: admin.credential.cert(serviceAccountKey),
});

// db
connectDB();

// common route
server.use("/api", userRoutes);

server.listen(PORT, () => {
    console.log(`App listening on port -> ${PORT}`);
});
