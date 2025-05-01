  import User from "../models/User.js";
  import bcrypt from "bcryptjs";
  import generateToken from "../utils/generateToken.js";
  import FarmerProfile from "../models/FarmerProfile.js";

  // ✅ Register New User
  export const registerUser = async (req, res) => {
    const { name, email, username, password, mobile, address } = req.body;

    try {
      const userExists = await User.findOne({ email });
      if (userExists)
        return res.status(400).json({ message: "User already exists" });

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        name,
        email,
        username,
        password: hashedPassword,
        mobile,
        address,
        role: "customer", // default role
      });

      if (user) {
        res.status(201).json({
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          mobile: user.mobile,
          address: user.address,
          role: user.role,
          token: generateToken(user._id),
        });
      } else {
        res.status(400).json({ message: "Invalid user data" });
      }
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  };

  // ✅ Login User
  export const loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
      const user = await User.findOne({
        $or: [{ email: username }, { username }],
      });

      if (!user)
        return res.status(400).json({ message: "Invalid username or password" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({ message: "Invalid username or password" });

      res.json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        address: user.address,
        role: user.role,
        token: generateToken(user._id),
      });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  };

  // ✅ Become a Farmer (Seller Registration)
  export const becomeFarmer = async (req, res) => {
    const {
      location,
      idProofUrl,
      accountHolder,
      accountNumber,
      ifsc,
      upi,
    } = req.body;

    try {
      const userToUpdate = await User.findById(req.user.id).populate('farmerProfile');
      
      if (!userToUpdate) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user is already a farmer or has a farmer profile
      if (userToUpdate.role === "farmer") {
        return res.status(400).json({ 
          message: "You are already registered as a farmer. Use the 'Switch to Seller View' button to access your dashboard.",
          role: "farmer"
        });
      }

      // Check if user already has a farmer profile
      if (userToUpdate.farmerProfile) {
        return res.status(400).json({ 
          message: "You already have a farmer profile. Use the 'Switch to Seller View' button to access your dashboard.",
          role: "farmer",
          farmerProfile: userToUpdate.farmerProfile
        });
      }

      // Validate required fields
      if (!location || !idProofUrl || !accountHolder || !accountNumber || !ifsc) {
        return res.status(400).json({ 
          message: "Please provide all required information for farmer registration"
        });
      }

      const farmerProfile = await FarmerProfile.create({
        user: userToUpdate._id,
        location,
        idProofUrl,
        accountDetails: {
          accountHolder,
          accountNumber,
          ifsc,
          upi,
        },
      });

      // Update user role and save
      userToUpdate.role = "farmer";
      userToUpdate.farmerProfile = farmerProfile._id;
      
      // Save the updated user
      const updatedUser = await userToUpdate.save();
      console.log("Updated user role:", updatedUser.role);

      res.json({
        message: "Farmer registration successful! You can now switch to seller view.",
        role: updatedUser.role,
        profileId: farmerProfile._id
      });

    } catch (error) {
      console.error("Farmer registration error:", error);
      res.status(500).json({ message: "Server error during farmer registration" });
    }
  };

  // ✅ Toggle Role (customer <-> farmer)
  export const toggleUserRole = async (req, res) => {
    try {
      const user = await User.findById(req.user.id).populate('farmerProfile');
      if (!user) return res.status(404).json({ message: "User not found" });

      // If switching to farmer role, check if user has a farmer profile
      if (user.role === "customer") {
        if (!user.farmerProfile) {
          return res.status(400).json({ 
            message: "You need to complete farmer registration first",
            requiresRegistration: true
          });
        }
      }

      // Toggle the role
      user.role = user.role === "customer" ? "farmer" : "customer";
      await user.save();

      console.log(`User ${user.email} role switched to: ${user.role}`);

      res.json({ 
        message: `Role switched to ${user.role}`,
        role: user.role,
        farmerProfile: user.farmerProfile
      });
    } catch (err) {
      console.error("Toggle role error:", err);
      res.status(500).json({ message: "Server error" });
    }
  };

  // ✅ Get Profile
  export const getUserProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select("-password");
      if (!user) return res.status(404).json({ message: "User not found" });
      
      console.log("User role in profile:", user.role);
      
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mobile: user.mobile,
        address: user.address,
        username: user.username,
        farmerProfile: user.farmerProfile
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };

  export const getMe = (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  }
