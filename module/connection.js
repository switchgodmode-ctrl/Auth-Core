import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

//console.log("URI:", process.env.MONGO_URI); // debug

mongoose.connect(process.env.MONGO_URI)
.then(()=> console.log("DB Connected"))
.catch(err => console.log(err));