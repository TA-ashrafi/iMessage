import dns from "dns";
import "dotenv/config";
import mongoose from "mongoose";

import { connectDB } from "../lib/db.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";



dns.setServers([
  "1.1.1.1",
  "8.8.8.8",
]);

async function resetDatabase() {
  try {
    await connectDB();

    console.log("Connected to MongoDB...");
    console.log("Starting database reset...");

    const messagesResult = await Message.deleteMany({});
    const usersResult = await User.deleteMany({});

    console.log("\n========== DATABASE RESET ==========");
    console.log(`Messages deleted: ${messagesResult.deletedCount}`);
    console.log(`Users deleted: ${usersResult.deletedCount}`);
    console.log("====================================");
    console.log("Database is completely clean.");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Database reset failed:", error);

    try {
      await mongoose.connection.close();
    } catch {}

    process.exit(1);
  }
}

resetDatabase();