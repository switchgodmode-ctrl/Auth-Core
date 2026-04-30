import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let isConnected = false;

export const connectDB = async () => {
  if (isConnected || (mongoose.connections.length > 0 && mongoose.connections[0].readyState === 1)) {
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = !!db.connections[0].readyState;
    console.log("DB Connected Serverlessly");
  } catch (err) {
    console.error("DB Connection Error:", err);
  }
};

// Auto-connect when this module is imported
connectDB();