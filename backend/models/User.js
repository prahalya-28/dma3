import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true }, // ✅ Add this line
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    mobile: { type: String },
    address: { type: String },
    role: {
      type: String,
      enum: ["customer", "farmer"],
      default: "customer", // Default is customer
    },
    farmerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FarmerProfile"
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
