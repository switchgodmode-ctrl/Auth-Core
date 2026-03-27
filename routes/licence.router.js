import express from 'express';
import * as LincenceRouter from '../controller/licence.controller.js';
import { requireAuth } from "../utils/auth.js";
const router = express.Router();
router.post("/save", requireAuth, LincenceRouter.save);
router.get("/fetch", requireAuth, LincenceRouter.fetch);
router.get("/fetch-mine", requireAuth, LincenceRouter.fetchMine);
router.patch("/update", requireAuth, LincenceRouter.update);
router.delete("/delete", requireAuth, LincenceRouter.deleteLicence);
router.post("/expiry-check", requireAuth, LincenceRouter.expiryCheck);
router.post("/ban-unban", requireAuth, LincenceRouter.banUnbanLicence);
router.post("/reset-hwid", requireAuth, LincenceRouter.resetHwid);

export default router;
