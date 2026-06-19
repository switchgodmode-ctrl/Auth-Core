import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("MONGO_URI environment variable is missing");
}

// Global cached connection state for serverless (Vercel) environment
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export default async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable mongoose buffering to fail fast if connection fails
      serverSelectionTimeoutMS: 5000, // Fail fast (5 seconds) instead of waiting 30 seconds
    };

    console.log("Connecting to MongoDB...");
    cached.promise = mongoose.connect(MONGO_URI, opts).then((mongooseInstance) => {
      console.log("MongoDB connected successfully");
      return mongooseInstance;
    }).catch(err => {
      console.error("MongoDB connection error:", err);
      cached.promise = null; // Clear cached promise on error so next request tries again
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // Clear promise to allow retries
    throw e;
  }

  return cached.conn;
}

// Auto-run connection on module load for backward compatibility with side-effect imports
connectDB().catch(err => console.error("Initial connection setup failed:", err.message));