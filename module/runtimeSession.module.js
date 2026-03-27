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
