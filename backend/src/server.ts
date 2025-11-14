import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import connectDB from "./config/database"; 
import userRoutes from "./routes/userRoutes";
import listingRoutes from "./routes/listingRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import chatRoutes from "./routes/chatRoutes";
import SocketService from "./services/socketService";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
(async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
})();
const httpServer = createServer(app);

// Initialize Socket.io service
const socketService = new SocketService(httpServer);

// ✅ Allow your frontend origin (localhost:3002)
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/chat", chatRoutes);
// Global error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  });

  // MongoDB Connection Error
  if (err.name === 'MongoError' || err.name === 'MongooseError') {
    return res.status(500).json({
      message: "Database error occurred",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }

  // Validation Error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: "Validation failed",
      errors: Object.values(err.errors).map((e: any) => e.message)
    });
  }

  // JWT Error
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: "Authentication failed",
      error: "Invalid or expired token"
    });
  }

  // Default Error
  res.status(err.status || 500).json({
    message: err.message || "Something went wrong!",
    error: process.env.NODE_ENV === 'development' ? err.stack : 'Internal server error'
  });
});

// Handle 404 routes
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
