import mongoose from "mongoose";

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error("❌ MONGO_URI is not defined in .env");
    }

    // Configure Mongoose
    mongoose.set('strictQuery', true);
    
    // Connect with retry logic
    const connectWithRetry = async (retries = 5) => {
      try {
        await mongoose.connect(mongoURI);
        console.log('✅ MongoDB Connected successfully');
      } catch (error) {
        if (retries === 0) throw error;
        console.log(`MongoDB connection attempt failed. Retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
        return connectWithRetry(retries - 1);
      }
    };

    await connectWithRetry();
    
    // Set up connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
    });

    // Handle process termination
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });

  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

export default connectDB;