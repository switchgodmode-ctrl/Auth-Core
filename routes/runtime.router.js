import express from "express";
import { validate, heartbeat, getBannedSystems, unbanSystem } from "../controller/runtime.controller.js";

const router = express.Router();

router.post("/validate", validate);
router.post("/heartbeat", heartbeat);

// Admin endpoints for Banned Systems
router.get("/banned-systems", getBannedSystems);
router.post("/unban-system", unbanSystem);

export default router;
