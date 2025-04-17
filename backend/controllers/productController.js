import Product from '../models/Product.js';
export const createProduct = async (req, res) => {
    const { name, price, category, description, image, quantity } = req.body;
  
    if (!name || !price || !image || !quantity) {
      return res.status(400).json({ message: "Missing required fields" });
    }
  
    try {
      const newProduct = await Product.create({
        name,
        price,
        category,
        description,
        image,
        quantity,  // Store the quantity field
        farmer: req.user?.id || null  // Optional: from auth
      });
  
      res.status(201).json(newProduct);
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  };
  
  export const getAllProducts = async (req, res) => {
    const products = await Product.find();
    res.json(products);
  }
  