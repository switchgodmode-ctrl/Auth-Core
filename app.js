import express from 'express';
import dotenv from "dotenv";
dotenv.config();
import fs from 'fs';
import path from 'path';
// Environment variables are loaded via dotenv and Vercel's native env support
import bodyParser from 'body-parser';
import UserRouter from "./routes/user.router.js"
import ApplicationRouter from './routes/application.router.js';
import LicenceRouter from './routes/licence.router.js';
import AuthRouter from "./routes/auth.router.js";
import RuntimeRouter from "./routes/runtime.router.js";
import ResellerRouter from "./routes/reseller.router.js";
import PaymentRouter from "./routes/payment.router.js";
import WebhookRouter from "./routes/webhook.router.js";

import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';

const app = express();
app.set('trust proxy', 1);

// 1. MUST BE FIRST: CORS HEADERS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.header("Access-Control-Allow-Origin", origin || "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS, PUT");
  res.header("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// 2. GLOBAL SECURITY HEADERS
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 3. AUTH RATE LIMITING
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, 
	max: 20, 
	message: { status: false, error: "Too many attempts, please try again after 15 minutes" },
	standardHeaders: true,
	legacyHeaders: false,
});

app.use("/user/save", authLimiter);
app.use("/user/login", authLimiter);
app.use("/user/google-login", authLimiter);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
 app.use("/user",UserRouter);
 app.use("/application",ApplicationRouter);
 app.use("/licence",LicenceRouter);
 app.use("/auth", AuthRouter);
 app.use("/runtime", RuntimeRouter);
 app.use("/reseller", ResellerRouter);
 app.use("/payment", PaymentRouter);
 app.use("/webhook", WebhookRouter);
app.get("/",(req,res)=>{
    res.send("Backend is live - v2");
});
 const PORT = process.env.PORT || 3001;
 app.listen(PORT, () => console.log("Server invoked at port " + PORT));
