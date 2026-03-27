import express from "express";
import { createWebhook, listWebhooks, deleteWebhook } from "../controller/webhook.controller.js";
import { requireAuth } from "../utils/auth.js";

const router = express.Router();

router.post("/create", requireAuth, createWebhook);
router.get("/list", requireAuth, listWebhooks);
router.delete("/delete", requireAuth, deleteWebhook);

export default router;
