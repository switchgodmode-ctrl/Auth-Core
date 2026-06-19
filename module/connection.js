import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Disable buffering globally immediately upon module load (applies to all schemas compiled after this)
mongoose.set('bufferCommands', false);

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
  // If readyState is 1 (connected), we are good to reuse
  if (mongoose.connection.readyState === 1) {
    cached.conn = mongoose;
    return cached.conn;
  }

  // If readyState is 2 (connecting), await the existing promise
  if (mongoose.connection.readyState === 2 && cached.promise) {
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (e) {
      cached.promise = null;
      throw e;
    }
  }

  // If disconnected or disconnecting, clear cache and establish a fresh connection
  cached.conn = null;
  cached.promise = null;

  const opts = {
    bufferCommands: false, // Disable mongoose buffering to fail fast if connection fails
    serverSelectionTimeoutMS: 5000, // Fail fast (5 seconds) instead of waiting 30 seconds
  };

  // Configure mongoose global settings to disable command buffering
  mongoose.set('bufferCommands', false);

  if (!cached.promise) {
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