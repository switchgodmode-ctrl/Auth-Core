import "../module/connection.js";

import LicenceSchemaModule from "../module/licence.module.js";

import ApplicationSchemaModule from "../module/application.module.js";

import RuntimeSessionModule from "../module/runtimeSession.module.js";
import WebhookSchemaModule from "../module/webhook.module.js";

const lastCallMap = new Map(); 

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

    const { appId, licenceKey, hwid, appVersion, integrityHash, appSecret } = req.body || {};
    
    // Loosen strict payload validation - allow missing version or hashes for generic C# tests
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
      return res.status(403).json({ status: false, message: "Licence not valid for this app" });
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

    if (licence.hwid && licence.hwid !== hwid) {
      licence.trustScore = Math.max(0, licence.trustScore - 10);
      if (licence.trustScore < 10 && licence.Status !== "ban") {
          licence.Status = "ban";
          dispatchWebhooks(appId, "LICENCE_BANNED", { licenceKey, reason: "HWID mismatch threshold breached", hwidAttempt: hwid });
      }
      await licence.save();
      return res.status(403).json({ status: false, message: "HWID mismatch", trustScore: licence.trustScore });
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

    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress || "";

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
      hwid,
      appVersion,
      integrityHash,
      lastSeen: new Date()
    });

    const flags = [];
    if (licence.trustScore < 50) flags.push("warning");
    const allowed = licence.Status === "online";

    if (allowed) {
        dispatchWebhooks(appId, "SESSION_CONNECTED", { licenceKey, ip, hwid, appVersion });
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
