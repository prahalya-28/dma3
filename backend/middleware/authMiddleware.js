import jwt from "jsonwebtoken";
import User from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

const protect = async (req, res, next) => {
  let token;

  console.log('authMiddleware: Checking request for path:', req.path); // Debug log

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
    console.log('authMiddleware: Token found in headers.'); // Debug log
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('authMiddleware: Token verified.'); // Debug log
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user || !req.user.isActive) {
        console.log('authMiddleware: User not found or not active.'); // Debug log
        return res.status(401).json({ message: "Not authorized, user deactivated or not found" });
      }
      console.log('authMiddleware: User authenticated.'); // Debug log
      next();
    } catch (error) {
      console.error('authMiddleware: Token verification failed:', error.message); // Debug log
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    console.log('authMiddleware: No token found in headers.'); // Debug log
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

export { protect };