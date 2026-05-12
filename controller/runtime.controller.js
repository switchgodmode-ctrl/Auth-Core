import crypto from "crypto";
import "../module/connection.js";

import LicenceSchemaModule from "../module/licence.module.js";
import ApplicationSchemaModule from "../module/application.module.js";
import RuntimeSessionModule from "../module/runtimeSession.module.js";
import WebhookSchemaModule from "../module/webhook.module.js";
import SystemBanModule from "../module/systemBan.module.js";

const lastCallMap = new Map(); 

// AES-256 Configuration
const ENCRYPTION_KEY = crypto.scryptSync(process.env.MASTER_ENCRYPTION_KEY || "auth-core-master-key-2026", "salt", 32);
const IV_LENGTH = 16;

const encrypt = (text) => {
    if (!text) return text;
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
};

const decrypt = (text) => {
    if (!text || typeof text !== "string" || !text.includes(":")) return text;
    try {
        const [ivHex, encryptedHex] = text.split(":");
        const iv = Buffer.from(ivHex, "hex");
        const encryptedText = Buffer.from(encryptedHex, "hex");
        const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (e) {
        return "[Decryption Error]";
    }
};

const hashSignal = (signal) => {
    if (!signal || typeof signal !== "string") return signal;
    return crypto.createHash("sha256").update(signal).digest("hex");
};

const dispatchWebhooks = async (appId, eventName, payload) => {
    try {
        const hooks = await WebhookSchemaModule.find({ appId: Number(appId), isActive: true, events: { $in: ["ALL", eventName] } });
        for (const hook of hooks) {
            fetch(hook.url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event: eventName, timestamp: new Date(), data: payload })
            }).catch(e => console.error(`Webhook error -> ${hook.url}:`, e.message));
        }
    } catch (e) {
        console.error("Webhook dispatch error:", e);
    }
};

export const validate = async (req, res) => {
  try {

    const { appId, licenceKey, hwid, signals, appVersion, integrityHash, appSecret } = req.body || {};
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress || "";
    const hashedHwid = hashSignal(hwid);

    // 1. GLOBAL BAN CHECK (BEFORE ANYTHING ELSE)
    const existingBan = await SystemBanModule.findOne({ hwid: hashedHwid });
    if (existingBan && existingBan.isPermanentlyBanned) {
        return res.status(403).json({ 
            status: false, 
            message: "System Access Denied: This hardware has been permanently restricted due to multiple unauthorized access attempts. Please contact support." 
        });
    }

    if (!appId || !licenceKey || !appSecret) {
      return res.status(400).json({ 
          status: false, 
          message: `Missing core fields. Received req.body: ${JSON.stringify(req.body)}` 
      });
    }

    const app = await ApplicationSchemaModule.findOne({ _id: Number(appId) });
    if (!app || app.appSecret !== appSecret) {
      return res.status(401).json({ status: false, message: "Invalid application or secret" });
    }

    const licence = await LicenceSchemaModule.findOne({ key: licenceKey, appId: Number(appId) });
    
    if (!licence) {
      // 2. TRACK FAILED ATTEMPT BY HWID
      let banRecord = await SystemBanModule.findOne({ hwid: hashedHwid });
      if (!banRecord) {
          const encryptedSignals = {};
          if (signals) {
              for (const k in signals) encryptedSignals[k] = encrypt(signals[k]);
          }
          banRecord = new SystemBanModule({
              hwid: hashedHwid,
              encryptedSignals,
              appId: Number(appId),
              ip,
              failedAttempts: 0
          });
      }
      
      banRecord.failedAttempts += 1;
      banRecord.lastAttemptKey = licenceKey;
      
      if (banRecord.failedAttempts >= 3) {
          banRecord.isPermanentlyBanned = true;
          banRecord.bannedAt = new Date();
          console.log(`[SECURITY] HWID ${hashedHwid} PERMANENTLY BANNED after 3 attempts.`);
      }
      
      await banRecord.save();

      return res.status(403).json({ 
          status: false, 
          message: "Licence not valid for this app",
          warning: banRecord.isPermanentlyBanned ? "System Banned" : `Attempt ${banRecord.failedAttempts}/3`
      });
    }

    if (licence.forceDisable || licence.Status === "ban") {
      return res.status(403).json({ status: false, message: "Licence disabled", flags: ["force_disable"] });
    }

    const now = Date.now();
    const last = lastCallMap.get(licenceKey) || 0;
    if (now - last < 3000) {

      licence.trustScore = Math.max(0, licence.trustScore - 2);
      await licence.save();
      return res.status(429).json({ status: false, message: "Too frequent validation", trustScore: licence.trustScore });
    }
    lastCallMap.set(licenceKey, now);

    // BIND HWID ON FIRST LOGIN (WITH SHA-256 HASHING)
    const hashedSignals = {};
    if (signals && typeof signals === "object") {
        for (const key in signals) {
            hashedSignals[key] = hashSignal(signals[key]);
        }
    }

    if (!licence.hwid) {
      licence.hwid = hashedHwid;
      licence.hwidSignals = hashedSignals;
      licence.activatedAt = new Date();
      licence.Status = "online";
      await licence.save();
      console.log(`[AUTH] Licence ${licenceKey} bound to Fingerprint: ${hashedHwid}`);
    }

    // CHECK HWID MATCH (STRICT MULTI-SIGNAL VALIDATION)
    let mismatchDetected = false;
    if (licence.hwid && licence.hwid !== hashedHwid) {
        mismatchDetected = true;
    }

    // Deep check every individual signal if they exist in DB
    if (licence.hwidSignals && typeof licence.hwidSignals === "object") {
        for (const key in licence.hwidSignals) {
            // If the signal exists in DB and doesn't match incoming hashed signal
            if (licence.hwidSignals[key] && licence.hwidSignals[key] !== hashedSignals[key]) {
                mismatchDetected = true;
                console.log(`[SECURITY] Signal mismatch on ${key} for ${licenceKey}`);
                break;
            }
        }
    }

    if (mismatchDetected) {
      licence.trustScore = Math.max(0, licence.trustScore - 10);
      if (licence.trustScore < 10 && licence.Status !== "ban") {
          licence.Status = "ban";
          dispatchWebhooks(appId, "LICENCE_BANNED", { licenceKey, reason: "Strict HWID/Signal mismatch", hwidAttempt: hashedHwid });
      }
      await licence.save();
      return res.status(403).json({ 
          status: false, 
          message: "Authorization Error: This license key is already registered to a different hardware profile. For security reasons, multi-system access is restricted. Please contact support if you believe this is an error.", 
          trustScore: licence.trustScore 
      });
    }

    if (licence.activatedAt) {
      const expiryDate = new Date(licence.activatedAt);
      expiryDate.setDate(expiryDate.getDate() + licence.Day);
      if (new Date() > expiryDate) {
        licence.Status = "offline";
        await licence.save();
        return res.status(403).json({ status: false, message: "Licence expired" });
      }
    }

    const prevSession = await RuntimeSessionModule.findOne({ licenceId: licence._id }).sort({ lastSeen: -1 });
    if (prevSession && prevSession.integrityHash && prevSession.integrityHash !== integrityHash) {
      licence.trustScore = Math.max(0, licence.trustScore - 5);
    } else {
      licence.trustScore = Math.min(100, licence.trustScore + 1);
    }

    const wasBanned = licence.Status === "ban";
    if (licence.trustScore < 10) {
      licence.Status = "ban";
      if (!wasBanned) dispatchWebhooks(appId, "LICENCE_BANNED", { licenceKey, reason: "Trust score depleted below threshold" });
    } else if (licence.trustScore < 30) {
      licence.Status = "offline";
    } else {
      licence.Status = "online";
    }
    await licence.save();

    await RuntimeSessionModule.create({
      licenceId: licence._id,
      ip,
      hwid: hashedHwid,
      appVersion,
      integrityHash,
      lastSeen: new Date()
    });

    const flags = [];
    if (licence.trustScore < 50) flags.push("warning");
    const allowed = licence.Status === "online";

    if (allowed) {
        dispatchWebhooks(appId, "SESSION_CONNECTED", { licenceKey, ip, hwid: hashedHwid, appVersion });
    }

    const responsePayload = {
      status: true,
      allowed,
      featuresAllowed: licence.features || {},
      trustScore: licence.trustScore,
      flags,
      customMessage: licence.customMessage || ""
    };

    if (allowed && app.remotePayload) {
        responsePayload.remotePayload = app.remotePayload;
    }

    return res.status(200).json(responsePayload);
  } catch (error) {

    res.status(500).json({ status: false, error: error.message });
  }
};

export const heartbeat = async (req, res) => {
    try {
        const { licenceKey, appId } = req.body;
        if (!licenceKey || !appId) return res.status(400).json({ status: false, message: "Missing required fields" });

        const licence = await LicenceSchemaModule.findOne({ key: licenceKey, appId: Number(appId) });
        
        if (!licence) return res.status(404).json({ status: false, message: "Licence not found" });

        if (licence.Status === "killed" || licence.Status === "ban" || licence.forceDisable) {
            return res.status(200).json({ status: true, active: false, currentStatus: licence.Status || "killed" });
        }

        return res.status(200).json({ 
            status: true, 
            active: true, 
            currentStatus: licence.Status,
            customMessage: licence.customMessage || ""
        });
    } catch (e) {
        return res.status(500).json({ status: false, error: e.message });
    }
};

export const getBannedSystems = async (req, res) => {
    try {
        const bans = await SystemBanModule.find().sort({ updatedAt: -1 });
        
        // Decrypt details for Admin visibility
        const decryptedBans = bans.map(ban => {
            const b = ban.toObject();
            if (b.encryptedSignals) {
                b.decryptedSignals = {};
                for (const k in b.encryptedSignals) {
                    b.decryptedSignals[k] = decrypt(b.encryptedSignals[k]);
                }
            }
            return b;
        });

        return res.status(200).json({ status: true, data: decryptedBans });
    } catch (e) {
        return res.status(500).json({ status: false, error: e.message });
    }
};

export const unbanSystem = async (req, res) => {
    try {
        const { hwid } = req.body;
        if (!hwid) return res.status(400).json({ status: false, message: "HWID required" });

        await SystemBanModule.deleteOne({ hwid });
        return res.status(200).json({ status: true, message: "System ban revoked successfully" });
    } catch (e) {
        return res.status(500).json({ status: false, error: e.message });
    }
};
