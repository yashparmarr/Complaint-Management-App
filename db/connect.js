import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// MongoDB connection configuration
const DB_CONFIG = {
  uri: process.env.MONGODB_URI,
  options: {
    dbName: process.env.DB_NAME,
    retryWrites: true,
    w: "majority",
    appName: "ComMan",
    maxPoolSize: 10, // Maximum number of socket connections
    connectTimeoutMS: 5000, // Timeout after 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  },
};

// Connection events
mongoose.connection.on("connected", () => {
  console.log(`MongoDB connected to ${DB_CONFIG.options.dbName}`);
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("MongoDB connection closed due to app termination");
  process.exit(0);
});

/**
 * Connects to MongoDB with retry logic
 * @param {number} retries - Maximum connection attempts (default: 3)
 * @param {number} delay - Delay between retries in ms (default: 2000)
 */
export const connectDB = async (retries = 3, delay = 2000) => {
  try {
    await mongoose.connect(DB_CONFIG.uri, DB_CONFIG.options);
  } catch (error) {
    if (retries > 0) {
      console.warn(`Connection failed. Retrying (${retries} left)...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return connectDB(retries - 1, delay);
    }
    console.error("MongoDB connection failed after retries:", error);
    process.exit(1);
  }
};

export default mongoose;
