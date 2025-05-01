import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User"
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Product"
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User"
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  pricePerUnit: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryMethod: {
    type: String,
    required: true,
    enum: ["pickup", "home"]
  },
  deliveryDetails: {
    pickupTime: String,
    address: String,
    phone: String
  },
  specialInstructions: String,
  status: {
    type: String,
    required: true,
    enum: ["pending", "accepted", "rejected", "completed", "cancelled"],
    default: "pending"
  }
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);
export default Order;
