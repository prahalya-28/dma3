import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    mobile: { type: String },
    address: { type: String },
    role: {
      type: String,
      enum: ["customer", "farmer"],
      default: "customer", // Default is customer
    },
    farmerDetails: {
      governmentId: { type: String },
      bankDetails: {
        accountHolder: String,
        accountNumber: String,
        ifsc: String,
        upi: String,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
