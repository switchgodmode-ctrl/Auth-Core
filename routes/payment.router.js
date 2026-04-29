import express from "express";
import { createOrder, verifyPayment, fetchMinePayments } from "../controller/payment.controller.js";
import { requireAuth } from "../utils/auth.js";
const router = express.Router();
router.post("/order", requireAuth, createOrder);
router.post("/verify", requireAuth, verifyPayment);
router.get("/fetch-mine", requireAuth, fetchMinePayments);
export default router;
