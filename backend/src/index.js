import dns from "dns";
import express from "express";
import cors from "cors";
import "dotenv/config";
import fs from "fs";
import path from "path";

import { clerkMiddleware } from "@clerk/express";

import { connectDB } from "./lib/db.js";
import job from "./lib/cron.js";
import clerkWebhook from "./webhooks/clerk.webhook.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";

import { app, server } from "./lib/socket.js";

dns.setServers([
  "1.1.1.1",
  "8.8.8.8",
]);




const PORT = process.env.PORT || 3001;

const FRONTEND_URL = process.env.FRONTEND_URL;

const publicDir = path.join(process.cwd(), "public");

// -------------------------
// CORS
// -------------------------

const allowedOrigins = FRONTEND_URL
  ? [
      FRONTEND_URL,
      "http://localhost:5173",
      "http://localhost:3000",
    ]
  : true;

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// -------------------------
// Clerk Webhook
// IMPORTANT: raw body
// -------------------------

app.use(
  "/api/webhooks/clerk",
  express.raw({ type: "application/json" }),
  clerkWebhook
);

// -------------------------
// Body Parser
// -------------------------

app.use(express.json());

// -------------------------
// Clerk Middleware
// -------------------------

app.use(clerkMiddleware());

// -------------------------
// Health Check
// -------------------------

app.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    message: "iMessage backend is running",
  });
});

// -------------------------
// API Routes
// -------------------------

app.use("/api/auth", authRoutes);

app.use("/api/messages", messageRoutes);

// -------------------------
// Frontend Static Files
// -------------------------

if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));

  // Express 5 compatible catch-all
  app.use((req, res, next) => {
    if (
      req.method === "GET" &&
      !req.path.startsWith("/api/")
    ) {
      return res.sendFile(
        path.join(publicDir, "index.html"),
        (err) => {
          if (err) next(err);
        }
      );
    }

    next();
  });
}

// -------------------------
// Start Server
// -------------------------

server.listen(PORT, async () => {
  console.log(`Server is up and running on PORT: ${PORT}`);

  try {
    await connectDB();
  } catch (error) {
    console.error("Database connection failed:", error);
  }

  if (process.env.NODE_ENV === "production") {
    job.start();
  }
});