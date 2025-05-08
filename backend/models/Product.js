import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  category: String,
  description: String,
  image: String,
  quantity: {type: Number, required: true},
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);
export default Product;
