import mongoose from "mongoose";

const webhookSchema = mongoose.Schema({
    appId: { type: Number, required: true },
    url: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    events: { type: [String], default: ["ALL"] },
    createdAt: { type: Date, default: Date.now }
});

webhookSchema.index({ appId: 1 });

const WebhookSchemaModule = mongoose.model("WebhookConfig", webhookSchema);
export default WebhookSchemaModule;
