import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    mobile: { type: String, required: true },
    address: { type: String, required: true },
    role: {
      type: String,
      enum: ["buyer", "farmer"],
      default: "buyer",
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    failedAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    otp: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    farmerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FarmerProfile"
    },
    // Account security fields
    failedLoginAttempts: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
    lockUntil: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    profilePicture: { type: String },
    bio: { type: String },
    facebook: { type: String },
    instagram: { type: String },
    twitter: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);