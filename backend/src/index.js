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

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL;

// Production Docker:
// /app/public
//
// Local development:
// backend/public (if it exists)
const publicDir = fs.existsSync(path.join(process.cwd(), "public"))
  ? path.join(process.cwd(), "public")
  : path.join(process.cwd(), "backend", "public");

// ----------------------------------------
// Clerk Webhook
// IMPORTANT: keep raw body for webhook
// ----------------------------------------
app.use(
  "/api/webhooks/clerk",
  express.raw({ type: "application/json" }),
  clerkWebhook
);

// ----------------------------------------
// General middleware
// ----------------------------------------
app.use(express.json());

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

app.use(clerkMiddleware());

// ----------------------------------------
// Health check
// ----------------------------------------
app.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
  });
});

// ----------------------------------------
// API routes
// ----------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// ----------------------------------------
// Production frontend
// ----------------------------------------
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));

  // Express 5 compatible SPA fallback
  app.get("/{*splat}", (req, res, next) => {
    res.sendFile(
      path.join(publicDir, "index.html"),
      (err) => {
        if (err) {
          next(err);
        }
      }
    );
  });
}

// ----------------------------------------
// Start server
// ----------------------------------------
server.listen(PORT, async () => {
  console.log(`Server is up and running on PORT: ${PORT}`);

  try {
    await connectDB();
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }

  if (process.env.NODE_ENV === "production") {
    job.start();
    console.log("Production cron job started");
  }
});