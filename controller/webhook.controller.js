import WebhookSchemaModule from "../module/webhook.module.js";
import ApplicationSchemaModule from "../module/application.module.js";

export const createWebhook = async (req, res) => {
    try {
        const { appId, url, events } = req.body;
        if (!appId || !url) return res.status(400).json({ status: false, message: "Missing appId or url" });

        const app = await ApplicationSchemaModule.findOne({ _id: Number(appId), ownerId: req.user.id });
        if (!app) return res.status(404).json({ status: false, message: "Application not found or unauthorized" });

        const webhook = await WebhookSchemaModule.create({ appId: Number(appId), url, events: events || ["ALL"] });
        res.status(201).json({ status: true, info: webhook });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};

export const listWebhooks = async (req, res) => {
    try {
        const { appId } = req.query;
        if (!appId) return res.status(400).json({ status: false, message: "Missing appId" });

        const app = await ApplicationSchemaModule.findOne({ _id: Number(appId), ownerId: req.user.id });
        if (!app) return res.status(404).json({ status: false, message: "Application not found or unauthorized" });

        const webhooks = await WebhookSchemaModule.find({ appId: Number(appId) }).sort({ _id: -1 });
        res.status(200).json({ status: true, info: webhooks });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};

export const deleteWebhook = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) return res.status(400).json({ status: false, message: "Missing webhook ID" });
        await WebhookSchemaModule.findByIdAndDelete(id);
        res.status(200).json({ status: true });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
};
