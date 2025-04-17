import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import { createServer } from "http";
import { Server } from "socket.io";

// Import Routes
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

// Load environment variables
dotenv.config();

// Initialize app and server
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Connect to MongoDB
connectDB();

// Middleware

app.use(cors({
  origin: ["http://127.0.0.1:5501", "http://localhost:5501"], // Frontend origins
  methods: ["GET", "POST","PUT","DELETE","OPTIONS"],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));  // Adjust size as needed
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
 // For JSON body parsing
app.use(morgan("dev")); // Logging
app.use(helmet());      // Security headers

// Rate Limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // max requests per window per IP
});
app.use("/api", limiter);

// Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/chat", chatRoutes);

// Test POST route for user registration
app.post("/api/users/register", (req, res) => {
  console.log("User Data:", req.body);
  res.json({ message: "User registered successfully!" });
});

// Test GET routes
app.get("/", (req, res) => {
  res.send("API is running...");
});

app.get("/api/users", (req, res) => {
  res.json({ message: "Users route is working!" });
});

// WebSocket Logic
io.on("connection", (socket) => {
  console.log(`🔥 New client connected: ${socket.id}`);

  socket.on("sendMessage", (data) => {
    console.log("📩 Message received:", data);
    io.emit("receiveMessage", data);
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected");
  });
});

// Error Handler Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("👋 Shutting down server...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});
