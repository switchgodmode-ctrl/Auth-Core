import mongoose from "mongoose";

const PaymentSchema = mongoose.Schema({
  _id: {
    type: Number,
    required: true
  },
  userId: {
    type: Number,
    required: true
  },
  orderId: {
    type: String,
    required: true
  },
  paymentId: {
    type: String
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: "INR"
  },
  receipt: {
    type: String
  },
  status: {
    type: String,
    enum: ["created", "paid", "failed"],
    default: "created"
  },
  planTarget: {
    type: String,
    enum: ["Premium", "Reseller", "Free"],
    default: "Premium"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const PaymentModule = mongoose.model("Payment", PaymentSchema);
export default PaymentModule;
