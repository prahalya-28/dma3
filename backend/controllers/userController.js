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

  // ✅ Become a Farmer (Seller Registration) - SUGGESTED CHANGE
export const becomeFarmer = async (req, res) => {
  const {
    location,
    idProofUrl, // Image/PDF or cloud URL
    accountHolder,
    accountNumber,
    ifsc,
    upi,
  } = req.body;

  try {
    // --- SUGGESTED CHANGE: Re-fetch the user explicitly here ---
    const userToUpdate = await User.findById(req.user.id);
    // --- END SUGGESTED CHANGE ---

    // --- Use the newly fetched 'userToUpdate' object for checks ---
    if (!userToUpdate) {
       return res.status(404).json({ message: "User not found" });
    }

    if (userToUpdate.role === "farmer") {
      return res
        .status(400)
        .json({ message: "You are already registered as a farmer" });
    }
    // --- End checks using 'userToUpdate' ---

    const farmerProfile = await FarmerProfile.create({
      user: userToUpdate._id, // Use ID from the freshly fetched user
      location,
      idProofUrl,
      accountDetails: {
        accountHolder,
        accountNumber,
        ifsc,
        upi,
      },
    });

    // --- SUGGESTED CHANGE: Modify and save the 'userToUpdate' object ---
    userToUpdate.role = "farmer";
    userToUpdate.farmerProfile = farmerProfile._id;

    // Optional: Add logging to see the object state just before saving
    console.log('Attempting to save user object:', JSON.stringify(userToUpdate, null, 2));

    await userToUpdate.save(); // Save the freshly fetched and modified object
    // --- END SUGGESTED CHANGE ---

    res.json({
      message: "Farmer registration successful",
      role: userToUpdate.role, // Use role from the saved object
      profileId: farmerProfile._id,
    });

  } catch (error) {
    console.error("Farmer registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

  // ✅ Toggle Role (customer <-> farmer)
  export const toggleUserRole = async (req, res) => {
    const { userId } = req.body;

    try {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      user.role = user.role === "customer" ? "farmer" : "customer";
      await user.save();

      res.json({ message: `Role switched to ${user.role}` });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  };

  // ✅ Get Profile
  export const getUserProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select("-password");
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  };
