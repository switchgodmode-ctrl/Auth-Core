import express from 'express';
import * as UserControler from "../controller/user.controller.js";
import { requireAuth } from "../utils/auth.js";
const router = express.Router();
router.post("/save",UserControler.save);
router.post("/login",UserControler.login);
router.post("/google-login", UserControler.googleLogin);
router.post("/refresh",UserControler.refresh);
router.get("/fetch",UserControler.fetch);
router.delete("/delete",UserControler.deleteUser);
router.patch("/update",UserControler.update)
router.get("/verify",UserControler.verify);
router.post("/resend-verify",UserControler.resendVerify);
router.get("/google-client", UserControler.googleClient);
router.post("/forgot-password", UserControler.forgotPassword);
router.post("/reset-password", UserControler.resetPassword);
router.post("/logout", requireAuth, UserControler.logout);
router.post("/mail-test", UserControler.mailTest);
export default router;
