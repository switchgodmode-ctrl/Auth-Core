import "../module/connection.js";
import crypto from "crypto";
import PaymentModule from "../module/payment.module.js";
import UserSchemaModule from "../module/user.module.js";

async function getInstance() {
  try {
    const { default: Razorpay } = await import("razorpay");
    const key_id = process.env.RAZORPAY_KEY_ID || "";
    const key_secret = process.env.RAZORPAY_KEY_SECRET || "";
    
    if (!key_id || !key_secret) {
      throw new Error("Razorpay keys are missing from environment variables.");
    }

    // Handle different import styles for Razorpay
    const RazorpayConstructor = Razorpay || (await import("razorpay")).default;
    return new RazorpayConstructor({ key_id, key_secret });
  } catch (e) {
    throw new Error("Failed to initialize Razorpay: " + e.message);
  }
}

export const createOrder = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ status: false, error: "Unauthorized: User ID missing from token." });

    const { amount, currency, planTarget } = req.body;
    if (!amount) return res.status(400).json({ status: false, error: "Amount is required to create an order." });

    const user = await UserSchemaModule.findOne({ _id: Number(userId) });
    if (!user) return res.status(404).json({ status: false, error: "User profile not found in database." });

    let instance;
    try {
      instance = await getInstance();
    } catch (err) {
      return res.status(500).json({ status: false, error: err.message });
    }

    // Razorpay expects amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(Number(amount) * 100);

    let order;
    try {
      order = await instance.orders.create({
        amount: amountInPaise,
        currency: currency || "INR",
        receipt: `rcpt_${userId}_${Date.now()}`,
        notes: { userId: String(userId), planTarget: planTarget || "Premium" }
      });
    } catch (orderErr) {
      // LOG THE FULL ERROR FOR DEBUGGING (Visible in Vercel/Server logs)
      console.error("RAZORPAY_API_CRASH:", JSON.stringify(orderErr, null, 2));
      
      // SHOW A SAFE MESSAGE TO THE USER (Privacy first)
      return res.status(500).json({ 
        status: false, 
        error: "Unable to initialize payment. Please verify your payment credentials in the dashboard." 
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
      console.error("Database Save Error:", dbErr);
      // We still return the order to the client so they can pay, 
      // but we log the error. Ideally we'd want to handle this better.
      return res.status(500).json({ status: false, error: "Order created but failed to log in database: " + dbErr.message });
    }

    res.status(200).json({ status: true, order, keyId: instance.key_id });
  } catch (error) {
    console.error("General Payment Error:", error);
    res.status(500).json({ status: false, error: "Internal Server Error: " + error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const instance = await getInstance();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ status: false, error: "Missing required verification fields." });
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
      return res.status(400).json({ status: false, error: "Security signature mismatch. Payment rejected." });
    }

    const payment = await PaymentModule.findOne({ orderId: razorpay_order_id });
    if (!payment) return res.status(404).json({ status: false, error: "Payment record not found." });
    
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
    console.error("Verification Error:", error);
    res.status(500).json({ status: false, error: error.message });
  }
};

export const fetchMinePayments = async (req, res) => {
  try {
    const userId = req.user.id; 
    const payments = await PaymentModule.find({ userId: Number(userId) }).sort({ createdAt: -1 });
    res.status(200).json({ status: true, info: payments });
  } catch (error) {
    console.error("Fetch Payments Error:", error);
    res.status(500).json({ status: false, error: error.message });
  }
};
