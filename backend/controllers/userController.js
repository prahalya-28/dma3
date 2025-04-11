import User from "../models/User.js"; // Import User model
import bcrypt from "bcryptjs"; // For password hashing
import generateToken from "../utils/generateToken.js";

export const registerUser = async (req, res) => {
  const { name, email, password, mobile, address } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: "User already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashedPassword, mobile, address });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      address: user.address,
      role: user.role || "customer",
      token: generateToken(user._id), // Use function instead of writing JWT logic here
    });
  } else {
    res.status(400).json({ message: "Invalid user data" });
  }
};



export const becomeFarmer = async (req, res) => {
  const { userId, governmentId, bankDetails } = req.body;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.role = "farmer";
  user.farmerDetails = { governmentId, bankDetails };
  
  await user.save();
  res.json({ message: "You are now a farmer!" });
};

export const toggleUserRole = async (req, res) => {
  const { userId } = req.body;

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  user.role = user.role === "customer" ? "farmer" : "customer";
  await user.save();

  res.json({ message: `Role switched to ${user.role}` });
};

export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password"); // Exclude password
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
