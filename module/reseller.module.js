import mongoose from "mongoose";

const ResellerSchema = mongoose.Schema({
  _id: {
    type: Number,
    required: true
  },
  userId: {
    type: Number,
    required: true
  },
  credits: {
    type: Number,
    default: 0
  },
  issuedLicences: {
    type: Number,
    default: 0
  },
  commissionEarned: {
    type: Number,
    default: 0
  },
  commissionPerLicence: {
    type: Number,
    default: 0
  },
  rateLimitPerMinute: {
    type: Number,
    default: 30
  },
  trustImpact: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ResellerModule = mongoose.model("Reseller", ResellerSchema);
export default ResellerModule;
