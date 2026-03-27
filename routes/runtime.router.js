import express from "express";
import { validate, heartbeat } from "../controller/runtime.controller.js";

const router = express.Router();

router.post("/validate", validate);
router.post("/heartbeat", heartbeat);

export default router;
