import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true , min:0},
  quantity: { type: Number, required: true, min:1 },
  category: { type: String },
  images: [String], // Array of image URLs
  location: { type: String }, // Farm location
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default mongoose.model("Product", productSchema);
