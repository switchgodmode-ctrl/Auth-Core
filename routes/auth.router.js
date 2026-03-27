import express from "express";
import { verifyLicence, offlineLicence  } from "../controller/auth.controller.js";
import { expiryCheck } from "../controller/licence.controller.js";

const router = express.Router();

router.post("/verify", verifyLicence);
router.post("/offline", offlineLicence);
router.post("/expiry-check", expiryCheck);

export default router;
