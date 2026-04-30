import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
})
.then(()=> console.log("DB Connected"))
.catch(err => console.log("DB Connection Error:", err));