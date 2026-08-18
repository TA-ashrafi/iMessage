import User from "../models/user.model.js";

// Check currently authenticated user
export async function checkAuth(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    return res.status(200).json(req.user);
  } catch (error) {
    console.error("Check auth error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}

// Get all users
export async function getUsers(req, res) {
  try {
    const users = await User.find({})
      .select("-__v")
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Users fetched: ${users.length}`);

    return res.status(200).json(users);
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
}