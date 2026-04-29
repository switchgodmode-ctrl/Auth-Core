import "../module/connection.js";
import crypto from "crypto";
import Razorpay from "razorpay";
import PaymentModule from "../module/payment.module.js";
import UserSchemaModule from "../module/user.module.js";

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || "";
  const key_secret = process.env.RAZORPAY_KEY_SECRET || "";
  
  if (!key_id || !key_secret) {
    console.error("CRITICAL: Razorpay keys missing in environment.");
    return null;
  }

  return new Razorpay({ key_id, key_secret });
};

export const createOrder = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: false, error: "Session expired. Please log in again." });
    }

    const { amount, currency, planTarget } = req.body;
    if (!amount) {
      return res.status(400).json({ status: false, error: "Invalid plan selection." });
    }

    const user = await UserSchemaModule.findOne({ _id: Number(userId) });
    if (!user) {
      return res.status(404).json({ status: false, error: "User profile not found." });
    }

    const instance = getRazorpayInstance();
    if (!instance) {
      return res.status(500).json({ status: false, error: "Payment gateway configuration error. Contact support." });
    }

    // Convert to paise (1 INR = 100 paise)
    const amountInPaise = Math.round(Number(amount) * 100);

    let order;
    try {
      order = await instance.orders.create({
        amount: amountInPaise,
        currency: currency || "INR",
        receipt: `rcpt_${userId}_${Date.now()}`,
        notes: { 
          userId: String(userId), 
          planTarget: planTarget || "Premium",
          email: user.email 
        }
      });
    } catch (orderErr) {
      console.error("RAZORPAY_ORDER_API_ERROR:", orderErr);
      return res.status(500).json({ 
        status: false, 
        error: "Razorpay service unavailable. Please try again later." 
      });
    }

    try {
      const last = await PaymentModule.findOne().sort({ _id: -1 });
      const nextId = last ? last._id + 1 : 1;

      await PaymentModule.create({
        _id: nextId,
        userId: Number(userId),
        orderId: order.id,
        amount: amountInPaise,
        currency: currency || "INR",
        receipt: order.receipt,
        status: "created",
        planTarget: planTarget || "Premium"
      });
    } catch (dbErr) {
      console.error("PAYMENT_DB_LOG_ERROR:", dbErr);
      // We still return the order so the user can pay
    }

    res.status(200).json({ status: true, order, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error("FATAL_PAYMENT_CONTROLLER_ERROR:", error);
    res.status(500).json({ status: false, error: "Internal payment processing error." });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const instance = getRazorpayInstance();
    if (!instance) return res.status(500).json({ status: false, error: "Config error." });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ status: false, error: "Incomplete payment data." });
    }

    const key_secret = process.env.RAZORPAY_KEY_SECRET || "";
    const expected = crypto.createHmac("sha256", key_secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (expected !== razorpay_signature) {
      const p = await PaymentModule.findOne({ orderId: razorpay_order_id });
      if (p) {
        p.status = "failed";
        p.paymentId = razorpay_payment_id;
        await p.save();
      }
      return res.status(400).json({ status: false, error: "Security validation failed." });
    }

    const payment = await PaymentModule.findOne({ orderId: razorpay_order_id });
    if (!payment) return res.status(404).json({ status: false, error: "Transaction not found." });
    
    payment.status = "paid";
    payment.paymentId = razorpay_payment_id;
    await payment.save();
 
    const user = await UserSchemaModule.findOne({ _id: Number(payment.userId) });
    if (user) {
      user.plan = payment.planTarget || "Premium";
      await user.save();
    }
    res.status(200).json({ status: true });
  } catch (error) {
    console.error("PAYMENT_VERIFICATION_FATAL:", error);
    res.status(500).json({ status: false, error: "Verification system error." });
  }
};

export const fetchMinePayments = async (req, res) => {
  try {
    const userId = req.user.id; 
    const payments = await PaymentModule.find({ userId: Number(userId) }).sort({ createdAt: -1 });
    res.status(200).json({ status: true, info: payments });
  } catch (error) {
    console.error("FETCH_PAYMENTS_ERROR:", error);
    res.status(500).json({ status: false, error: "Could not retrieve history." });
  }
};
