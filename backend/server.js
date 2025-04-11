import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import { createServer } from "http"; // Import HTTP module
import { Server } from "socket.io";  // Import Socket.IO
//import { loginUser } from "../controllers/userController.js";

// Import Routes
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";











dotenv.config(); // Load environment variables

const app = express();
const server = createServer(app); // Create HTTP server
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
//const router = express.Router();

// Connect to database
connectDB();

// Middleware
app.use(express.json());  // Body parser
app.use(cors({
    origin: "*", // Change this to your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));  
//import cors from "cors";
app.use(cors());
        // Enable CORS
app.use(morgan("dev"));   // Logging
app.use(helmet());        // Basic security headers

// Rate Limiting (prevents excessive API calls)
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100, // Limit each IP to 100 requests per window
});
app.use("/api", limiter);

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/chat", chatRoutes);

// WebSocket Logic
io.on("connection", (socket) => {
    console.log(`🔥 New client connected: ${socket.id}`);

    socket.on("sendMessage", (data) => {
        console.log("📩 Message received:", data);
        io.emit("receiveMessage", data); // Send message to all clients
    });

    socket.on("disconnect", () => {
        console.log("❌ Client disconnected");
    });
});

app.post("/api/users/register", (req, res) => {
    console.log("User Data:", req.body);
    res.json({ message: "User registered successfully!" });
});


// Basic route
app.get("/", (req, res) => {
    res.send("API is running...");
});
app.get("/api/users", (req, res) => {
    res.json({ message: "Users route is working!" });
  });
  

// Error Handling Middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful Shutdown (Handles crashes)
process.on("SIGTERM", () => {
    console.log("👋 Shutting down server...");
    server.close(() => {
        console.log("Server closed.");
        process.exit(0);
    });
});
//router.post("/login", loginUser);
//export default router;
