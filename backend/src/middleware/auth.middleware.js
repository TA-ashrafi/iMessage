import { getAuth } from "@clerk/express";

export function protectRoute(req, res, next) {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized - Please login",
      });
    }

    req.user = {
      clerkId: userId,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    return res.status(401).json({
      message: "Unauthorized",
    });
  }
}