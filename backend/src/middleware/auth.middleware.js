import { getAuth, clerkClient } from "@clerk/express";
import User from "../models/user.model.js";

export async function protectRoute(req, res, next) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized - Please login",
      });
    }

    // Find existing user in MongoDB
    let user = await User.findOne({ clerkId: userId });

    // If user doesn't exist, sync from Clerk
    if (!user) {
      const clerkUser = await clerkClient.users.getUser(userId);

      const email =
        clerkUser.emailAddresses?.find(
          (email) => email.id === clerkUser.primaryEmailAddressId,
        )?.emailAddress ||
        clerkUser.emailAddresses?.[0]?.emailAddress;

      if (!email) {
        return res.status(400).json({
          message: "User email not found in Clerk",
        });
      }

      const fullName =
        [clerkUser.firstName, clerkUser.lastName]
          .filter(Boolean)
          .join(" ") ||
        clerkUser.username ||
        "User";

      const profilePic = clerkUser.imageUrl || "";

      user = await User.create({
        clerkId: userId,
        email,
        fullName,
        profilePic,
      });

      console.log("New user synced to MongoDB:", user.email);
    }

    // Attach COMPLETE MongoDB user to request
    req.user = user;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    return res.status(401).json({
      message: "Unauthorized",
    });
  }
}