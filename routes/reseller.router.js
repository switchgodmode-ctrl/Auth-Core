import express from "express";
import { createReseller, addCredits, stats, createLicence, transferLicence } from "../controller/reseller.controller.js";

const router = express.Router();

router.post("/create", createReseller);
router.post("/add-credits", addCredits);
router.get("/stats", stats);
router.post("/create-licence", createLicence);
router.post("/transfer-licence", transferLicence);

export default router;
