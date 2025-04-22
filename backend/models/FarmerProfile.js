// backend/models/FarmerProfile.js
import mongoose from "mongoose";

const farmerProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  location: String,
  idProofUrl: String, // Store file URL or base64 string
  accountDetails: {
    accountHolder: String,
    accountNumber: String,
    ifsc: String,
    upi: String
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  earnings: {
    type: Number,
    default: 0
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product"
  }]
}, { timestamps: true });

export default mongoose.model("FarmerProfile", farmerProfileSchema);
