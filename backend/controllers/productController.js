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
    try {
      // Only return products with quantity > 0
      const products = await Product.find({ quantity: { $gt: 0 } })
        .populate('farmer', 'name location')
        .sort('-createdAt');
      res.json(products);
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
  
  export const getMyProducts = async (req, res) => {
    try {
      const products = await Product.find({ farmer: req.user._id });
      res.json(products);
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
  
  export const updateProduct = async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      // Only allow the farmer who owns the product to edit
      if (product.farmer.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to edit this product" });
      }
      const { name, price, category, description, image, quantity } = req.body;
      product.name = name || product.name;
      product.price = price || product.price;
      product.category = category || product.category;
      product.description = description || product.description;
      product.image = image || product.image;
      product.quantity = quantity || product.quantity;
      await product.save();
      res.json(product);
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
  
  // @desc    Get a single product by ID
  // @route   GET /api/products/:id
  // @access  Public
  export const getProductById = async (req, res) => {
    try {
      const product = await Product.findById(req.params.id)
        .populate('farmer', 'name _id location profilePicture');
  
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      res.json({
        _id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        quantity: product.quantity,
        image: product.image,
        farmer: product.farmer,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      });
    } catch (error) {
      console.error('Error in getProductById:', error);
      res.status(500).json({ message: 'Server error while fetching product' });
    }
  };
  