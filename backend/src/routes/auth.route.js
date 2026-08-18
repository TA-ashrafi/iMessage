import express from "express";

import {
  checkAuth,
  getUsers,
} from "../controllers/auth.controller.js";

import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// Check logged-in user
router.get("/check", protectRoute, checkAuth);

// Get all users
router.get("/users", protectRoute, getUsers);

export default router;