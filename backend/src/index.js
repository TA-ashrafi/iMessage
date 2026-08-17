import dns from "node:dns";

dns.setServers([
    "1.1.1.1",
    "8.8.8.8",
]);

import express from "express";
import cors from "cors";
import "dotenv/config";
import { clerkMiddelware }from '@clerk/express';
import User from "./models/user.model.js";
import { connectDB } from "./lib/db.js";
import { ok } from "node:assert";

const app = express();

const PORT = process.env.PORT;
const FRONTEND_URL = process.env.FRONTEND_URL;

app.use(express.json());
app.use(cors({origin:FRONTEND_URL, credentials:true}));
app.use(clerkMiddelware());

app.get("/health" , (req, res) => {
    res.status(200).json({ok: true});
});



app.use(express.json());

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server is UP and running on PORT: ${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();