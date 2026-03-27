import express from 'express';
import dotenv from "dotenv";
dotenv.config();
import fs from 'fs';
import path from 'path';
const envPath = path.resolve('./env');
if (fs.existsSync(envPath)) {
  const data = fs.readFileSync(envPath, 'utf-8');
  for (const line of data.split(/\r?\n/)) {
    const m = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
    if (m) {
      const k = m[1];
      let v = m[2];
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!process.env[k]) process.env[k] = v;
    }
  }
}
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
   const allowedOrigins = [
       "http://localhost:5173", 
       process.env.FRONTEND_URL
   ].filter(Boolean);
   const origin = req.headers.origin;
   if (allowedOrigins.includes(origin)) {
       res.header("Access-Control-Allow-Origin", origin);
   } else {
       res.header("Access-Control-Allow-Origin", "*");
   }
   res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
   res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
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
