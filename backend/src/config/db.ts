import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    // Prefer MONGO_URI from environment (supports local or Atlas). If not set, fall back to a safe localhost URI.
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/aibookify';

    // Attempt connection (use default driver options)
    const conn = await mongoose.connect(mongoURI);

    // Set up connection error handlers
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully');
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    if (err instanceof Error) {
      console.error(`❌ MongoDB Connection Error: ${err.message}`);
    } else {
      console.error("❌ Unknown MongoDB connection error:", err);
    }
    process.exit(1);
  }
};

export default connectDB;
