import "../module/connection.js";

import ResellerModule from "../module/reseller.module.js";

import LicenceSchemaModule from "../module/licence.module.js";

import ApplicationSchemaModule from "../module/application.module.js";

export const createReseller = async (req, res) => {
  try {
    const last = await ResellerModule.findOne().sort({ _id: -1 });
    const _id = last ? last._id + 1 : 1;
    const reseller = await ResellerModule.create({ _id, userId: Number(req.body.userId), credits: Number(req.body.credits || 0) });
    res.status(200).json({ status: true, info: reseller });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};

export const addCredits = async (req, res) => {
  try {
    const { resellerId, credits } = req.body;
    const reseller = await ResellerModule.findOne({ _id: Number(resellerId) });
    if (!reseller) return res.status(404).json({ status: false, message: "Reseller not found" });
    reseller.credits += Number(credits || 0);
    await reseller.save();
    res.status(200).json({ status: true, credits: reseller.credits });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};

export const stats = async (req, res) => {
  try {
    const { resellerId } = req.query;
    const reseller = await ResellerModule.findOne({ _id: Number(resellerId) });
    if (!reseller) return res.status(404).json({ status: false });
    res.status(200).json({ status: true, info: reseller });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};

const rateMap = new Map(); 

export const createLicence = async (req, res) => {
  const { resellerId, appId, key, Day, features } = req.body;
  try {
    const reseller = await ResellerModule.findOne({ _id: Number(resellerId) });
    if (!reseller) return res.status(404).json({ status: false, message: "Reseller not found" });
    const app = await ApplicationSchemaModule.findOne({ _id: Number(appId) });
    if (!app) return res.status(404).json({ status: false, message: "Application not found" });
    // rate limit per minute
    const now = Date.now();
    const bucket = rateMap.get(resellerId) || { count: 0, windowStart: now };
    if (now - bucket.windowStart > 60_000) { bucket.count = 0; bucket.windowStart = now; }
    if (bucket.count >= reseller.rateLimitPerMinute) {
      reseller.trustImpact -= 1;
      await reseller.save();
      return res.status(429).json({ status: false, message: "Rate limit exceeded" });
    }
    bucket.count += 1;
    rateMap.set(resellerId, bucket);
    // credit check
    if (reseller.credits <= 0) return res.status(403).json({ status: false, message: "Insufficient credits" });
    reseller.credits -= 1;
    await reseller.save();
    // create licence
    const lastLicence = await LicenceSchemaModule.findOne().sort({ _id: -1 });
    const _id = lastLicence ? lastLicence._id + 1 : 1;
    try {
      await LicenceSchemaModule.create({
        _id,
        appId: Number(appId),
        key,
        Day: Number(Day),
        Status: "unbanned",
        features: features || {},
        resellerId: Number(resellerId)
      });
      reseller.issuedLicences += 1;
      reseller.commissionEarned += reseller.commissionPerLicence;
      reseller.trustImpact += 0.5;
      await reseller.save();
      return res.status(200).json({ status: true });
    } catch (err) {
  
      reseller.credits += 1;
      reseller.trustImpact -= 0.5;
      await reseller.save();
      return res.status(400).json({ status: false, error: err.message });
    }
  } catch (error) {
    return res.status(500).json({ status: false, error: error.message });
  }
};

export const transferLicence = async (req, res) => {
  try {
    const { licenceKey, fromResellerId, toResellerId } = req.body;
    const lic = await LicenceSchemaModule.findOne({ key: licenceKey, resellerId: Number(fromResellerId) });
    if (!lic) return res.status(404).json({ status: false, message: "Licence not found for source reseller" });
    const toReseller = await ResellerModule.findOne({ _id: Number(toResellerId) });
    if (!toReseller) return res.status(404).json({ status: false, message: "Target reseller not found" });
    lic.resellerId = Number(toResellerId);
    await lic.save();
    toReseller.issuedLicences += 1;
    await toReseller.save();
    const fromReseller = await ResellerModule.findOne({ _id: Number(fromResellerId) });
    if (fromReseller && fromReseller.issuedLicences > 0) {
      fromReseller.issuedLicences -= 1;
      await fromReseller.save();
    }
    res.status(200).json({ status: true });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};
