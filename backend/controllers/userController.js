import crypto from "crypto"; // Add this import at the top
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import FarmerProfile from "../models/FarmerProfile.js";
import { sendOtpEmail, sendOrderStatusEmail, sendPasswordResetEmail } from "../utils/emailService.js";

// Register New User (Signup TC1-TC6, TC9)
export const registerUser = async (req, res) => {
  const { role, name, email, username, password, mobile, address } = req.body;

  // Validate required fields (TC9)
  if (!role || !name || !email || !username || !password || !mobile || !address) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Validate role (TC1)
  if (!["buyer", "farmer"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  // Check for existing email or username (TC4)
  if (await User.findOne({ email })) {
    return res.status(400).json({ message: "Email is already registered" });
  }
  if (await User.findOne({ username })) {
    return res.status(400).json({ message: "Username is already taken" });
  }

  // Validate username length (TC2)
  if (username.length > 10) {
    return res.status(400).json({ message: "Username must not exceed 10 characters" });
  }

  // Validate password (TC3)
  if (!/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(password)) {
    return res.status(400).json({ message: "Password must be alphanumeric and at least 8 characters" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      role,
      name,
      email,
      username,
      password: hashedPassword,
      mobile,
      address,
      isVerified: false
    });

    // Generate OTP for verification (TC6)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await user.save();

    // Send OTP via email
    const emailSent = await sendOtpEmail(email, otp);
    if (!emailSent) {
      return res.status(500).json({ message: "Failed to send verification email" });
    }

    res.status(201).json({
      message: "User registered successfully. Please check your email for verification OTP.",
      verified: false
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Login User (Login TC1-TC5, TC9)
export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" }); // TC2, TC4
    }

    // Check if account is deactivated (TC9)
    if (!user.isActive) {
      return res.status(403).json({ message: "Your account has been deactivated. Contact support for assistance." });
    }

    // Check if account is locked (TC5)
    if (user.lockedUntil && new Date() < user.lockedUntil) {
      return res.status(403).json({ message: "Account is locked. Try again later or reset your password." });
    }

    // Check if user is verified (Signup TC7)
    if (!user.isVerified) {
      return res.status(403).json({ message: "Please verify your email/phone before logging in" });
    }

    // Verify password (TC3)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      user.failedAttempts += 1;
      if (user.failedAttempts >= 3) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
      }
      await user.save();
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Reset failed attempts (TC1)
    user.failedAttempts = 0;
    user.lockedUntil = null;
    await user.save();

    res.json({
      token: generateToken(user._id),
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Verify User Email/Phone (Signup TC6, TC7)
export const verifyUser = async (req, res) => {
  const { identifier, otp } = req.body;

  try {
    const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
    if (!user || user.otp !== otp || !user.otpExpires || new Date() > user.otpExpires) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.otp = null;
    user.otpExpires = null;
    user.isVerified = true;
    await user.save();

    res.json({ message: "Verification successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Reset Password (Login TC6)
export const resetPassword = async (req, res) => {
  const { identifier } = req.body;

  try {
    const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    await user.save();
    console.log(`Simulated sending OTP ${otp} to ${identifier}`);

    res.json({ message: "OTP sent", otp: otp }); // Return OTP for testing
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Verify OTP and Update Password (Login TC6)
export const verifyOtp = async (req, res) => {
  const { identifier, otp, newPassword } = req.body;

  try {
    const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
    if (!user || user.otp !== otp || !user.otpExpires || new Date() > user.otpExpires) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (!/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(newPassword)) {
      return res.status(400).json({ message: "Password must be alphanumeric and at least 8 characters" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = null;
    user.otpExpires = null;
    user.failedAttempts = 0;
    user.lockedUntil = null;
    user.isVerified = true; // Assume verification completed
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Become a Farmer (Optional)
export const becomeFarmer = async (req, res) => {
  const { location, idProofUrl, accountHolder, accountNumber, ifsc, upi } = req.body;

  try {
    const user = await User.findById(req.user.id).populate('farmerProfile');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "farmer" || user.farmerProfile) {
      return res.status(400).json({ 
        message: "You are already registered as a farmer",
        role: "farmer"
      });
    }

    if (!location || !idProofUrl || !accountHolder || !accountNumber || !ifsc) {
      return res.status(400).json({ 
        message: "Please provide all required information for farmer registration"
      });
    }

    const farmerProfile = await FarmerProfile.create({
      user: user._id,
      location,
      idProofUrl,
      accountDetails: { accountHolder, accountNumber, ifsc, upi },
    });

    user.role = "farmer";
    user.farmerProfile = farmerProfile._id;
    await user.save();

    res.json({
      message: "Farmer registration successful",
      role: user.role,
      profileId: farmerProfile._id
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during farmer registration" });
  }
};

// Toggle Role (Optional)
export const toggleUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('farmerProfile');
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "buyer" && !user.farmerProfile) {
      return res.status(400).json({ 
        message: "You need to complete farmer registration first",
        requiresRegistration: true
      });
    }

    user.role = user.role === "buyer" ? "farmer" : "buyer";
    await user.save();

    // Use the imported generateToken utility
    const token = generateToken(user._id);

    res.json({ 
      message: `Role switched to ${user.role}`,
      role: user.role,
      farmerProfile: user.farmerProfile,
      token
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get Profile (Optional)
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").populate('farmerProfile');
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      mobile: user.mobile,
      address: user.address,
      username: user.username,
      bio: user.bio,
      farmerProfile: user.farmerProfile
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get Current User (Optional)
export const getMe = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  res.json(req.user);
};

// Request Password Reset Token
export const requestPasswordReset = async (req, res) => {
  const { emailOrUsername } = req.body;
  try {
    const user = await User.findOne({ $or: [{ email: emailOrUsername }, { username: emailOrUsername }] });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send the password reset email (REPLACE the console.log below)
    const emailSent = await sendPasswordResetEmail(user.email, token); // Call the new function
    if (!emailSent) {
        // If email sending fails, you might want to return an error or log it
        console.error('Failed to send password reset email for user:', user.email);
        // Decide if you want to return an error to the frontend here.
        // For now, we'll proceed and let the frontend show a general message.
    }


    // console.log(`Simulated sending reset token ${token} to ${emailOrUsername}`); // Remove or comment out this line
    res.json({ message: "Password reset email sent. Please check your inbox." }); // Update success message
  } catch (error) {
    console.error("Error in requestPasswordReset:", error);
    res.status(500).json({ message: "Server error while requesting password reset." }); // More specific error message
  }
};

// Reset Password with Token
export const resetPasswordWithToken = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }
    if (!/^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(newPassword)) {
      return res.status(400).json({ message: "Password must be alphanumeric and at least 8 characters" });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.failedAttempts = 0; // Clear lockout
    user.lockedUntil = null; // Clear lockout
    await user.save();
    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.username = req.body.username || user.username;
      user.mobile = req.body.mobile || user.mobile;
      user.address = req.body.address || user.address;
      // Add other fields you want to allow updating, e.g., bio, social media links
      if (req.body.bio !== undefined) user.bio = req.body.bio;
      if (req.body.facebook !== undefined) user.facebook = req.body.facebook;
      if (req.body.instagram !== undefined) user.instagram = req.body.instagram;
      if (req.body.twitter !== undefined) user.twitter = req.body.twitter;

      let farmerProfile = null; // Declare farmerProfile outside the if block

      // If the user is a farmer and farmer-specific fields are provided, update FarmerProfile
      if (user.role === 'farmer' && user.farmerProfile) {
        farmerProfile = await FarmerProfile.findById(user.farmerProfile); // Assign to the declared variable
        if (farmerProfile) {
          if (req.body.farmName !== undefined) farmerProfile.farmName = req.body.farmName;
          if (req.body.location !== undefined) farmerProfile.location = req.body.location;
          // Add other farmer profile fields here as needed
          await farmerProfile.save();
        }
      }

      // If updating password, hash it
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        username: updatedUser.username,
        role: updatedUser.role,
        mobile: updatedUser.mobile,
        address: updatedUser.address,
        bio: updatedUser.bio,
        facebook: updatedUser.facebook,
        instagram: updatedUser.instagram,
        twitter: updatedUser.twitter,
        token: generateToken(updatedUser._id), // Optionally issue a new token
        // Include updated farmer profile details in the response
        farmerProfile: farmerProfile ? { farmName: farmerProfile.farmName, location: farmerProfile.location } : undefined
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};