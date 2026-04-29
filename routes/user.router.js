import express from 'express';
import * as UserControler from "../controller/user.controller.js";
import { requireAuth, requireAdmin } from "../utils/auth.js";
import { uploadAvatar } from "../middleware/upload.middleware.js";

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

// --- NEW ROUTES ---
router.patch("/update-profile", requireAuth, uploadAvatar.single('avatar'), UserControler.updateProfile);
router.post("/change-password", requireAuth, UserControler.changePassword);
router.get("/sessions", requireAuth, UserControler.getSessions);
router.post("/logout-device", requireAuth, UserControler.logoutDevice);
router.get("/admin/stats", requireAdmin, UserControler.getAdminStats);
router.get("/admin/users", requireAdmin, UserControler.getAllUsers);
router.patch("/admin/users/:id/sdk-access", requireAdmin, UserControler.toggleSdkAccess);
router.patch("/admin/users/:id/status", requireAdmin, UserControler.toggleUserStatus);
router.get("/download-invoice", requireAuth, UserControler.downloadInvoice);
export default router;
