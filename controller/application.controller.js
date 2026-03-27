import "../module/connection.js";

import ApplicationSchemaModule from "../module/application.module.js";

import rs from "randomstring";

import UserSchemaModule from "../module/user.module.js";

export const save = async (req, res) => {
    try {

        const lastApp = await ApplicationSchemaModule.findOne().sort({ _id: -1 });

        const _id = lastApp ? lastApp._id + 1 : 1;

        const ownerId = Number(req.user?.id);

        const owner = await UserSchemaModule.findOne({ _id: ownerId });

        if (!owner) return res.status(404).json({ status: false, error: "Owner not found" });

        if (owner.plan === "Free") {

            const count = await ApplicationSchemaModule.countDocuments({ ownerId });

            if (count >= 1) return res.status(403).json({ status: false, error: "Free plan allows max 1 application" });
        }

        const lastOwnerApp = await ApplicationSchemaModule.findOne({ ownerId }).sort({ ownerSeq: -1 });

        const ownerSeq = lastOwnerApp ? Number(lastOwnerApp.ownerSeq || 0) + 1 : 1;

        const appDetails = { ...req.body, ownerId, _id, ownerSeq, appSecret: rs.generate(32), createdAt: Date() };

        await ApplicationSchemaModule.create(appDetails);

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

    const appList = await ApplicationSchemaModule.find(condition_obj);

    if (appList.length != 0)
        res.status(200).json({ "status": true, "info": appList });
    else
        res.status(404).json({ "status": false });
};

export const fetchMine = async (req, res) => {
    try {

        const ownerId = Number(req.user?.id);

        if (!ownerId) return res.status(401).json({ status: false });

        const apps = await ApplicationSchemaModule.find({ ownerId });

        return res.status(200).json({ status: true, info: apps });
    } catch (error) {

        return res.status(500).json({ status: false, error: error.message });
    }
};

export const deleteApplication = async (req, res) => {
    try {

        if (!req.body || typeof req.body.condition_obj !== "string") {
            return res.status(400).json({ "status": false, "message": "condition_obj required" });
        }

        let condition;
        try { condition = JSON.parse(req.body.condition_obj); } catch { return res.status(400).json({ "status": false, "message": "Invalid condition_obj" }); }

        let appDetails = await ApplicationSchemaModule.findOne(condition);

        if (appDetails) {

            let app = await ApplicationSchemaModule.deleteOne(condition);

            if (app)
                res.status(200).json({ "status": true });
            else
                res.status(404).json({ "status": false });
        }
        else {
            res.status(404).json({ "message": "application not found" });
        }
    }
    catch (error) {

        res.status(500).json({ "status": false });
    }
};

export const update = async (req, res) => {
    try {

        if (!req.body || typeof req.body.condition_obj !== "string" || typeof req.body.content_obj !== "string") {
            return res.status(400).json({ status: false, Message: "condition_obj and content_obj required" });
        }

        let condition, content;
        try { condition = JSON.parse(req.body.condition_obj); } catch { return res.status(400).json({ status: false, Message: "Invalid condition_obj" }); }
        try { content = JSON.parse(req.body.content_obj); } catch { return res.status(400).json({ status: false, Message: "Invalid content_obj" }); }

        let appDetails = await ApplicationSchemaModule.find(condition);

        if (appDetails.length > 0) {

            let app = await ApplicationSchemaModule.updateMany(condition, { $set: content });

            if (app)
                res.status(200).json({ "status": true, "Message": "Update Successfully..." });
            else
                res.status(404).json({ "Message": "application not found" });
        }
        else {
            res.status(400).json({ "status": false, "Message": "applicationDetails not found" });
        }
    }
    catch (error) {

        res.status(500).json({ "status": false });
    }
};

export const updatePayload = async (req, res) => {
    try {
        const { appId, remotePayload } = req.body;
        if (!appId) return res.status(400).json({ status: false, error: "appId required" });

        const ownerId = Number(req.user?.id);
        const app = await ApplicationSchemaModule.findOneAndUpdate(
            { _id: Number(appId), ownerId },
            { $set: { remotePayload: remotePayload || "" } },
            { new: true }
        );

        if (!app) return res.status(404).json({ status: false, error: "Application not found or unauthorized" });

        res.status(200).json({ status: true });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};

export const resetSecret = async (req, res) => {
    try {
        const { appId } = req.body;
        if (!appId) return res.status(400).json({ status: false, error: "appId required" });

        const ownerId = Number(req.user?.id);
        const app = await ApplicationSchemaModule.findOne({ _id: Number(appId), ownerId });

        if (!app) return res.status(404).json({ status: false, error: "Application not found or unauthorized" });

        const newSecret = rs.generate(32);
        await ApplicationSchemaModule.updateOne({ _id: Number(appId) }, { $set: { appSecret: newSecret } });

        res.status(200).json({ status: true });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};
