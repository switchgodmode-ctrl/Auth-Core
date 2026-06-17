import mongoose from "mongoose";

const RuntimeSessionSchema = mongoose.Schema({
  licenceId: {
    type: Number,
    required: true
  },
  ip: {
    type: String
  },
  hwid: {
    type: String
  },
  appVersion: {
    type: String
  },
  integrityHash: {
    type: String
  },
  country: {
    type: String,
    default: "Local Host"
  },
  countryCode: {
    type: String,
    default: "LH"
  },
  region: {
    type: String,
    default: "Local Network"
  },
  city: {
    type: String,
    default: "Home"
  },
  isp: {
    type: String,
    default: "Loopback"
  },
  latitude: {
    type: Number,
    default: 0
  },
  longitude: {
    type: Number,
    default: 0
  },
  sessionToken: {
    type: String,
    default: null
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const RuntimeSessionModule = mongoose.model("RuntimeSession", RuntimeSessionSchema);
export default RuntimeSessionModule;
