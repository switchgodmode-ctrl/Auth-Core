import crypto from "crypto";
import "../module/connection.js";

import LicenceSchemaModule from "../module/licence.module.js";
import ApplicationSchemaModule from "../module/application.module.js";
import RuntimeSessionModule from "../module/runtimeSession.module.js";
import WebhookSchemaModule from "../module/webhook.module.js";
import SystemBanModule from "../module/systemBan.module.js";
import { resolveGeoIP } from "../utils/geoip.js";

const lastCallMap = new Map(); 

// AES-256 Configuration
const ENCRYPTION_KEY = crypto.scryptSync(process.env.MASTER_ENCRYPTION_KEY, "salt", 32);
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

    // Strict version validation check
    if (app.version && app.version !== appVersion) {
      return res.status(403).json({
          status: false,
          message: `Update Required: A new version (${app.version}) is available. You are running version ${appVersion || "unknown"}. Please update to continue.`
      });
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

    const geo = await resolveGeoIP(ip);

    // Option 1: Automated Fraud Detection & Impossible Travel / Sharing Checks
    const lastSession = await RuntimeSessionModule.findOne({ licenceId: licence._id }).sort({ lastSeen: -1 });
    let fraudDetected = false;
    let fraudReason = "";

    if (lastSession) {
      // 1. HWID Sharing Check: If HWID changed and the last seen session was within 5 minutes (300,000ms)
      if (lastSession.hwid && lastSession.hwid !== hashedHwid) {
        const timeDiffMs = new Date() - new Date(lastSession.lastSeen);
        if (timeDiffMs < 300000) {
          fraudDetected = true;
          fraudReason = "License shared: Simultaneous execution from multiple hardware environments detected.";
        }
      }

      // 2. Impossible Travel Check: If client coordinates changed between checking-in sessions
      if (!fraudDetected && lastSession.latitude && lastSession.longitude && geo.latitude && geo.longitude) {
        const lat1 = lastSession.latitude;
        const lon1 = lastSession.longitude;
        const lat2 = geo.latitude;
        const lon2 = geo.longitude;

        // Haversine distance
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distanceKm = R * c;

        const timeDiffHours = (new Date() - new Date(lastSession.lastSeen)) / 3600000;
        if (timeDiffHours > 0 && distanceKm > 100) {
          const travelSpeedKmh = distanceKm / timeDiffHours;
          if (travelSpeedKmh > 800) {
            fraudDetected = true;
            fraudReason = `Suspicious geolocation jump: Relocated ${Math.round(distanceKm)}km at a physically impossible travel speed (${Math.round(travelSpeedKmh)} km/h).`;
          }
        }
      }
    }

    if (fraudDetected) {
      licence.trustScore = 0;
      licence.Status = "ban";
      licence.customMessage = fraudReason;
      await licence.save();

      try {
        dispatchWebhooks(appId, "LICENCE_BANNED", { 
          licenceKey, 
          reason: fraudReason, 
          ip, 
          hwid: hashedHwid 
        });
      } catch (wErr) {
        console.error("Webhook dispatch failed:", wErr);
      }

      return res.status(403).json({
        status: false,
        allowed: false,
        message: fraudReason
      });
    }

    await RuntimeSessionModule.create({
      licenceId: licence._id,
      ip,
      hwid: hashedHwid,
      appVersion,
      integrityHash,
      country: geo.country,
      countryCode: geo.countryCode,
      region: geo.region,
      city: geo.city,
      isp: geo.isp,
      latitude: geo.latitude || 0,
      longitude: geo.longitude || 0,
      lastSeen: new Date()
    });

    const flags = [];
    if (licence.trustScore < 50) flags.push("warning");
    const allowed = licence.Status === "online";

    if (allowed) {
        dispatchWebhooks(appId, "SESSION_CONNECTED", { licenceKey, ip, hwid: hashedHwid, appVersion });
    }

    // ── SESSION TOKEN GENERATION ─────────────────────────────────────────────
    // Generate a cryptographically random session token when login is allowed.
    // Store only the SHA-256 hash in the DB — raw token goes to client.
    // A cracker who patches the login check locally never calls verify() with
    // a real key, so they never receive a valid token → heartbeat kills them.
    let sessionToken = null;
    if (allowed) {
        sessionToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(sessionToken).digest("hex");

        // Attach token hash to the RuntimeSession record we just created above
        const latestSession = await RuntimeSessionModule.findOne(
            { licenceId: licence._id }
        ).sort({ lastSeen: -1 });

        if (latestSession) {
            latestSession.sessionToken = tokenHash;
            await latestSession.save();
        }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const responsePayload = {
      status: true,
      allowed,
      sessionToken: sessionToken || null,
      featuresAllowed: licence.features || {},
      trustScore: licence.trustScore,
      flags,
      customMessage: licence.customMessage || ""
    };

    if (allowed && app.remotePayload) {
        // Option 3: Dynamic Variable Payloads & Geo-Fencing
        try {
            const config = JSON.parse(app.remotePayload);
            if (config.geofence) {
                // Geo-Fencing Payload Rule: Deliver specific sub-payload based on country code
                const countryCode = geo.countryCode?.toUpperCase();
                responsePayload.remotePayload = config.geofence[countryCode] || config.geofence["default"] || app.remotePayload;
            } else if (config.rotator) {
                // Dynamic Rotation Rule: Deliver a randomized sub-payload containing dynamic verification tokens
                if (Array.isArray(config.rotator) && config.rotator.length > 0) {
                    const randomIndex = Math.floor(Math.random() * config.rotator.length);
                    const selected = config.rotator[randomIndex];
                    
                    const stamp = Date.now();
                    const hashSignature = crypto.createHash("sha256").update(selected + stamp).digest("hex");
                    
                    responsePayload.remotePayload = JSON.stringify({
                        payload: selected,
                        timestamp: stamp,
                        signature: hashSignature
                    });
                } else {
                    responsePayload.remotePayload = app.remotePayload;
                }
            } else {
                responsePayload.remotePayload = app.remotePayload;
            }
        } catch {
            responsePayload.remotePayload = app.remotePayload;
        }
    }

    return res.status(200).json(responsePayload);
  } catch (error) {

    res.status(500).json({ status: false, error: error.message });
  }
};

export const heartbeat = async (req, res) => {
    try {
        const { licenceKey, appId, sessionToken } = req.body;
        if (!licenceKey || !appId) return res.status(400).json({ status: false, message: "Missing required fields" });

        const licence = await LicenceSchemaModule.findOne({ key: licenceKey, appId: Number(appId) });
        
        if (!licence) return res.status(404).json({ status: false, message: "Licence not found" });

        if (licence.Status === "killed" || licence.Status === "ban" || licence.forceDisable) {
            return res.status(200).json({ status: true, active: false, currentStatus: licence.Status || "killed" });
        }

        const app = await ApplicationSchemaModule.findOne({ _id: Number(appId) });
        if (!app) {
            return res.status(404).json({ status: false, message: "Application not found" });
        }

        // ── SESSION TOKEN VALIDATION ──────────────────────────────────────────
        const session = await RuntimeSessionModule.findOne({ licenceId: licence._id }).sort({ lastSeen: -1 });

        // Check if the application version has changed since the session was validated
        if (session && session.appVersion && app.version && session.appVersion !== app.version) {
            console.log(`[SECURITY] Outdated client version detected during heartbeat for key: ${licenceKey} (Client: ${session.appVersion}, Server: ${app.version})`);
            return res.status(200).json({ 
                status: true, 
                active: false, 
                currentStatus: "killed", 
                customMessage: `Update required. The application version has changed to ${app.version}.`
            });
        }

        if (session && session.sessionToken) {
            // This session was created with a token — must be validated
            if (!sessionToken) {
                // Client sent no token → cracker bypass detected → kill
                console.log(`[SECURITY] Heartbeat with no token for ${licenceKey} — possible bypass attempt.`);
                licence.trustScore = Math.max(0, licence.trustScore - 20);
                await licence.save();
                return res.status(200).json({
                    status: true,
                    active: false,
                    currentStatus: "killed"
                });
            }

            const incomingHash = crypto.createHash("sha256").update(sessionToken).digest("hex");
            if (incomingHash !== session.sessionToken) {
                // Token hash mismatch → forged or replayed token → kill
                console.log(`[SECURITY] Token mismatch for ${licenceKey} — session killed.`);
                licence.trustScore = Math.max(0, licence.trustScore - 20);
                await licence.save();
                return res.status(200).json({
                    status: true,
                    active: false,
                    currentStatus: "killed"
                });
            }

            // ✅ Token is valid — rotate it (rolling token, harder to replay)
            const newRawToken = crypto.randomBytes(32).toString("hex");
            session.sessionToken = crypto.createHash("sha256").update(newRawToken).digest("hex");
            session.lastSeen = new Date();
            await session.save();

            // Reward good behaviour
            licence.trustScore = Math.min(100, licence.trustScore + 1);
            await licence.save();

            return res.status(200).json({
                status: true,
                active: true,
                currentStatus: licence.Status,
                sessionToken: newRawToken,        // rotated token for next beat
                customMessage: licence.customMessage || ""
            });
        }
        // ─────────────────────────────────────────────────────────────────────

        // Legacy session (no token stored) — keep alive normally
        if (session) {
            session.lastSeen = new Date();
            await session.save();
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
