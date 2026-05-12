import mongoose from "mongoose";

const systemBanSchema = new mongoose.Schema({
    hwid: { type: String, required: true, unique: true }, // Encrypted or Hashed HWID
    encryptedSignals: { type: Object, default: {} }, // AES-256 Encrypted signals
    failedAttempts: { type: Number, default: 0 },
    lastAttemptKey: { type: String }, // The last (wrong) key they tried
    isPermanentlyBanned: { type: Boolean, default: false },
    appId: { type: Number, required: true },
    bannedAt: { type: Date },
    ip: { type: String }
}, { timestamps: true });

export default mongoose.models.SystemBan || mongoose.model("SystemBan", systemBanSchema);
