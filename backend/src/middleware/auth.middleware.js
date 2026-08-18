import { getAuth, clerkClient } from "@clerk/express";
import User from "../models/user.model.js";

export async function protectRoute(req, res, next) {
  try {
    const authState = req.auth || (typeof getAuth === "function" ? getAuth(req) : null);
    const userId = authState?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized - Please login",
      });
    }

    let user = await User.findOne({ clerkId: userId });

    if (!user) {
      // Sync user from Clerk if not already in MongoDB
      let email = "";
      let fullName = "";
      let profilePic = "";

      try {
        if (process.env.CLERK_SECRET_KEY && clerkClient?.users) {
          const clerkUser = await clerkClient.users.getUser(userId);
          if (clerkUser) {
            email =
              clerkUser.emailAddresses?.find(
                (e) => e.id === clerkUser.primaryEmailAddressId
              )?.emailAddress ?? clerkUser.emailAddresses?.[0]?.emailAddress ?? "";

            fullName =
              [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
              clerkUser.username ||
              (email ? email.split("@")[0] : "");

            profilePic = clerkUser.imageUrl || "";
          }
        }
      } catch (clerkErr) {
        console.error("Error fetching user from Clerk in protectRoute:", clerkErr.message);
      }

      if (!fullName) {
        fullName = `User_${userId.slice(-6)}`;
      }
      if (!email) {
        email = `${userId}@clerk.user`;
      }

      try {
        user = await User.findOneAndUpdate(
          { clerkId: userId },
          { clerkId: userId, email, fullName, profilePic },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
      } catch (dbErr) {
        console.error("Error upserting user in protectRoute:", dbErr.message);
      }
    }

    if (!user) {
      return res.status(401).json({
        message: "User profile not found",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    return res.status(401).json({
      message: "Unauthorized",
    });
  }
}
