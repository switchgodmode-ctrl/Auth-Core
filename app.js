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

 const app = express();
 app.use(bodyParser.json());
 app.use(bodyParser.urlencoded({extended:true}));
 app.use((req, res, next) => {
   const origin = req.headers.origin;
   
   // In production, we allow the requesting origin if it exists, otherwise fallback to *
   res.header("Access-Control-Allow-Origin", origin || "*");
   res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
   res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
   res.header("Access-Control-Allow-Credentials", "true");
   
   if (req.method === "OPTIONS") return res.sendStatus(200);
   next();
 });
 app.use("/user",UserRouter);
 app.use("/application",ApplicationRouter);
 app.use("/licence",LicenceRouter);
 app.use("/auth", AuthRouter);
 app.use("/runtime", RuntimeRouter);
 app.use("/reseller", ResellerRouter);
 app.use("/payment", PaymentRouter);
 app.use("/webhook", WebhookRouter);
app.get("/",(req,res)=>{
    res.send("Backend is live");
});
 const PORT = process.env.PORT || 3001;
 app.listen(PORT, () => console.log("Server invoked at port " + PORT));
