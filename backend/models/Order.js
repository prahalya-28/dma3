import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({ 
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ["Pending", "Accepted", "Shipped", "Delivered", "Cancelled"], default: "Pending" },
  paymentStatus: { type: String, enum: ["Pending", "Completed"], default: "Pending" },
}, { timestamps: true });

const Order = mongoose.model("Order", orderSchema);
export default Order;
