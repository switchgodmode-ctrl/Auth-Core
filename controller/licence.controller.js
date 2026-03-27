
import "../module/connection.js";

import LicenceSchemaModule from "../module/licence.module.js";

import ApplicationSchemaModule from "../module/application.module.js";

import ResellerModule from "../module/reseller.module.js";

import UserSchemaModule from "../module/user.module.js";

export const save = async (req, res) => {
    try {

        const lastLicence = await LicenceSchemaModule.findOne().sort({ _id: -1 });

        const _id = lastLicence ? lastLicence._id + 1 : 1;

        const app = await ApplicationSchemaModule.findOne({ _id: Number(req.body.appId) });
        if (!app) return res.status(404).json({ status: false, error: "Application not found" });

        const owner = await UserSchemaModule.findOne({ _id: Number(app.ownerId) });
        if (!owner) return res.status(404).json({ status: false, error: "Owner not found" });

        const requesterId = Number(req.user?.id);
        if (!req.body.resellerId && requesterId && requesterId !== Number(app.ownerId)) {
            return res.status(403).json({ status: false, error: "Not authorized to create licences for this application" });
        }

        const count = await LicenceSchemaModule.countDocuments({ appId: Number(req.body.appId) });
        if (owner.plan === "Free" && count >= 10) {
            return res.status(403).json({ status: false, error: "Free plan licence limit reached" });
        }

        if (req.body.resellerId) {
            const reseller = await ResellerModule.findOne({ _id: Number(req.body.resellerId) });
            if (!reseller || reseller.credits <= 0) {
                return res.status(403).json({ status: false, error: "Insufficient reseller credits" });
            }
            reseller.credits -= 1;
            await reseller.save();
        }

        const licenceDetails = { ...req.body, _id, Status: "unbanned", features: req.body.features || {} };

        await LicenceSchemaModule.create(licenceDetails);
        res.status(200).json({ status: true });
    }
    catch (error) {

        res.status(400).json({ status: false, error: error.message });
    }
};

export const fetch = async (req, res) => {
    let condition_obj = req.query.condition_obj;

    if (condition_obj != undefined)
        condition_obj = JSON.parse(condition_obj);
    else
        condition_obj = {};

    const licenceList = await LicenceSchemaModule.find(condition_obj);

    if (licenceList.length > 0)
        res.status(200).json({ status: true, info: licenceList });
    else
        res.status(404).json({ status: false });
};

export const fetchMine = async (req, res) => {
    try {
        const ownerId = Number(req.user?.id);
        if (!ownerId) return res.status(401).json({ status: false });
        const apps = await ApplicationSchemaModule.find({ ownerId });
        const appIds = apps.map(a => a._id);
        const licences = await LicenceSchemaModule.find({ appId: { $in: appIds } });
        return res.status(200).json({ status: true, info: licences });
    } catch (error) {
        return res.status(500).json({ status: false, error: error.message });
    }
};

export const update = async (req, res) => {
    try {
        if (!req.body || typeof req.body.condition_obj !== "string" || typeof req.body.content_obj !== "string") {
            return res.status(400).json({ status: false, error: "condition_obj and content_obj required" });
        }
        let condition, content;
        try { condition = JSON.parse(req.body.condition_obj); } catch { return res.status(400).json({ status: false, error: "Invalid condition_obj" }); }
        try { content = JSON.parse(req.body.content_obj); } catch { return res.status(400).json({ status: false, error: "Invalid content_obj" }); }
        const licenceDetails = await LicenceSchemaModule.find(condition);

        if (licenceDetails.length > 0) {
            const result = await LicenceSchemaModule.updateMany(condition, { $set: content });

            if (result.modifiedCount > 0)
                res.status(200).json({ status: true, message: "Updated Successfully" });
            else
                res.status(400).json({ status: false });
        }
        else {
            res.status(404).json({ status: false, message: "Licence not found" });
        }
    }
    catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};

export const deleteLicence = async (req, res) => {
    try {
        if (!req.body || typeof req.body.condition_obj !== "string") {
            return res.status(400).json({ status: false, message: "condition_obj required" });
        }
        let condition;
        try { condition = JSON.parse(req.body.condition_obj); } catch { return res.status(400).json({ status: false, message: "Invalid condition_obj" }); }
        const result = await LicenceSchemaModule.deleteOne(condition);

        if (result.deletedCount > 0)
            res.status(200).json({ status: true });
        else
            res.status(404).json({ status: false, message: "Licence not found" });
    }
    catch (error) {
        res.status(500).json({ status: false });
    }
};

export const expiryCheck = async (req, res) => {
    try {
        const licences = await LicenceSchemaModule.find({
            activatedAt: { $exists: true },
            Status: { $ne: "ban" }
        });

        let expiredCount = 0;

        for (let licence of licences) {
            const expiryDate = new Date(licence.activatedAt);
            expiryDate.setDate(expiryDate.getDate() + licence.Day);

            if (new Date() > expiryDate) {
                await LicenceSchemaModule.updateOne(
                    { _id: licence._id },
                    { $set: { Status: "offline" } }
                );
                expiredCount++;
            }
        }

        res.status(200).json({
            status: true,
            message: "Licence expiry check completed",
            expiredLicences: expiredCount
        });

    } catch (error) {
        res.status(500).json({
            status: false,
            error: error.message
        });
    }
};

export const banUnbanLicence = async (req, res) => {
    try {
        const { licenceKey, appId, action } = req.body;

        if (!licenceKey || !appId || !action) {
            return res.status(400).json({
                status: false,
                message: "licenceKey, appId and action are required"
            });
        }

        if (!["ban", "unban", "kill"].includes(action)) {
            return res.status(400).json({
                status: false,
                message: "action must be ban, unban, or kill"
            });
        }
        const licence = await LicenceSchemaModule.findOne({
            key: licenceKey,
            appId: Number(appId)
        });

        if (!licence) {
            return res.status(404).json({
                status: false,
                message: "Licence not found for this application"
            });
        }
        if (action === "kill") {
            licence.Status = "killed";
            // A killed licence should also be permanently decoupled from HWID validation logic as a safety
            licence.forceDisable = true;
        } else {
            licence.Status = action === "ban" ? "ban" : "offline";
        }

        await licence.save();

        res.status(200).json({
            status: true,
            message: `Licence ${action} successfully`,
            licence: {
                key: licence.key,
                appId: licence.appId,
                status: licence.Status
            }
        });

    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        });
    }
};


export const resetHwid = async (req, res) => {
    try {
        const { licenceKey, appId } = req.body;
        if (!licenceKey || !appId) {
            return res.status(400).json({ status: false, message: "licenceKey and appId are required" });
        }
        const licence = await LicenceSchemaModule.findOne({ key: licenceKey, appId: Number(appId) });
        if (!licence) {
            return res.status(404).json({ status: false, message: "Licence not found for this application" });
        }
        licence.hwid = "";
        licence.hwidSignals = {};
        licence.activatedAt = null;
        licence.Status = "offline";
        await licence.save();
        res.status(200).json({ status: true, message: "HWID reset and licence set offline" });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};
