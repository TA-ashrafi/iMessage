import dns from "node:dns";

dns.setServers([
    "1.1.1.1",
    "8.8.8.8",
]);

import express from "express";
import cors from "cors";
import "dotenv/config";
import { clerkMiddleware } from "@clerk/express";
import fs from "fs";
import path from "path";

import { connectDB } from "./lib/db.js";
import job from "./cron.js";

const app = express();

const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL;
const publicDir = path.join(process.cwd(), "public");

app.use(
    cors({
        origin: FRONTEND_URL,
        credentials: true,
    })
);

app.use(express.json());

// HEALTH CHECK — Clerk se pehle
app.get("/health", (req, res) => {
    console.log("Health endpoint called");

    res.status(200).json({
        ok: true,
    });
});

app.use(clerkMiddleware());

if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));

    app.get("/{*any}", (req, res) => {
        res.sendFile(path.join(publicDir, "index.html"));
    });
}

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server is UP and running on PORT: ${PORT}`);

            if (process.env.NODE_ENV === "production") {
                job.start();
                console.log("Cron job started");
            }
        });
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();