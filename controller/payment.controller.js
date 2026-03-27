import "../module/connection.js";

import crypto from "crypto";

import PaymentModule from "../module/payment.module.js";

import UserSchemaModule from "../module/user.module.js";

async function getInstance() {
  const { default: Razorpay } = await import("razorpay");
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_KEY_SECRET || ""
  });
}

export const createOrder = async (req, res) => {
  try {

    const { userId, amount, currency, receipt, planTarget } = req.body;
 
    const user = await UserSchemaModule.findOne({ _id: Number(userId) });
    if (!user) return res.status(404).json({ status: false, message: "User not found" });

    const instance = await getInstance();

    if (!instance.key_id || !instance.key_secret) return res.status(500).json({ status: false, message: "Payment keys not configured" });

    const order = await instance.orders.create({
      amount: Number(amount),
      currency: currency || "INR",
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: { userId: String(userId), planTarget: planTarget || "Premium" }
    });

    const last = await PaymentModule.findOne().sort({ _id: -1 });
    const _id = last ? last._id + 1 : 1;

    await PaymentModule.create({
      _id,
      userId: Number(userId),
      orderId: order.id,
      amount: Number(amount),
      currency: currency || "INR",
      receipt: order.receipt,
      status: "created",
      planTarget: planTarget || "Premium"
    });

    res.status(200).json({ status: true, order, keyId: instance.key_id });
  } catch (error) {

    res.status(500).json({ status: false, error: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {

    const instance = await getInstance();
 
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ status: false, message: "Missing payment fields" });
    }

    const expected = crypto.createHmac("sha256", instance.key_secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (expected !== razorpay_signature) {

      const p = await PaymentModule.findOne({ orderId: razorpay_order_id });
      if (p) {
        p.status = "failed";
        p.paymentId = razorpay_payment_id;
        await p.save();
      }
      return res.status(400).json({ status: false, message: "Invalid signature" });
    }

    const payment = await PaymentModule.findOne({ orderId: razorpay_order_id });
    if (!payment) return res.status(404).json({ status: false, message: "Payment not found" });
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
    res.status(500).json({ status: false, error: error.message });
  }
};
