import dotenv from "dotenv";
// Load environment variables
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server } from "socket.io";

// Import DB Connection
import connectDB from "./config/db.js";

// Import Routes
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import paymentRoutes from './routes/paymentRoutes.js';

// Connect to MongoDB
connectDB();

// Initialize app and server
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://prahalya-28.github.io/dma3/",
    
  },
});

// Middleware
app.use(cors({
  origin: "https://prahalya-28.github.io",
  origin: "https://prahalya-28.github.io/dma3/", // Allow all origins for development
   // Allow all origins for development
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan("dev"));
app.use(helmet());

// Test endpoint
app.get("/test", (req, res) => {
  res.json({ message: "Server is running!" });
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/chat", chatRoutes);
app.use('/api/payments', paymentRoutes);

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

// Start Server
const PORT = process.env.PORT || 5000||10000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Test endpoint: https://dma-qhwn.onrender.com:${PORT}/test`);
});

// Graceful Shutdown
process.on("SIGTERM", () => {
  console.log("👋 Shutting down server...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});
