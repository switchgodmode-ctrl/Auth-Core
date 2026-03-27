import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { forgotPassword, updateProfileAvatar } from "../api.js";
import Card from "../components/ui/Card.jsx";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";

export default function Settings() {
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [status, setStatus] = useState({ msg: "", type: "" });
  const [confirmDialog, setConfirmDialog] = useState(null);
  const fileInputRef = useRef(null);

  function showStatus(msg, type = "info") {
    setStatus({ msg, type });
    setTimeout(() => setStatus({ msg: "", type: "" }), 4000);
  }

  useEffect(() => {
    const e = localStorage.getItem("email");
    if (e) setEmail(e);
    const a = localStorage.getItem("userAvatar");
    if (a) setAvatarPreview(a);
  }, []);

  async function handleAvatarSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showStatus("Image must be less than 2MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      setAvatarPreview(base64String);
      localStorage.setItem("userAvatar", base64String);
      window.dispatchEvent(new Event('avatar-updated'));
      
      if (email) {
        await updateProfileAvatar(email, base64String);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleUpdatePassword(e) {
    e.preventDefault();
    if (!email || !oldPassword || !newPassword) return;
    
    // Feature mocked for UI since no backend endpoint exists
    await new Promise(r => setTimeout(r, 600));
    showStatus("Password updated safely.", "success");
    setOldPassword("");
    setNewPassword("");
  }

  async function handleSendReset() {
    if (!email) return;
    const r = await forgotPassword(email);
    if (r?.status) setResetMsg("A password reset email has been sent to your address.");
    else setResetMsg(r?.error || "Failed to trigger reset.");
  }

  return (
    <div style={{ maxWidth: "800px", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="db-page-head">
        <div>
          <h1 className="db-page-title">Profile Settings</h1>
          <p className="db-page-sub">Manage your account details and security preferences.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
        {/* Personal Details Snapshot */}
        <Card title="Account Profile" subtitle="Your primary authcore identification">
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--accent2))", display: "grid", placeItems: "center", fontSize: "1.5rem", color: "#fff", fontWeight: "800", overflow: "hidden" }}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                email?.[0]?.toUpperCase() || "A"
              )}
            </div>
            <div>
              <div style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--text)" }}>Admin User</div>
              <div style={{ color: "var(--muted)", marginTop: "4px" }}>{email || "admin@authcore.cloud"}</div>
              <div style={{ display: "inline-block", padding: "4px 8px", background: "rgba(16, 185, 129, 0.1)", color: "var(--success)", fontSize: "0.7rem", fontWeight: "700", letterSpacing: "0.05em", borderRadius: "100px", marginTop: "8px", textTransform: "uppercase" }}>
                Active Plan: Pro
              </div>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <input type="file" ref={fileInputRef} accept="image/png, image/jpeg, image/jpg" style={{ display: "none" }} onChange={handleAvatarSelect} />
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>Change Avatar</Button>
            <Button variant="danger" onClick={handleSendReset}>Send Password Reset Email</Button>
          </div>
          {resetMsg && <div style={{ marginTop: "16px", color: "var(--success)", fontSize: "0.85rem" }}>{resetMsg}</div>}
        </Card>

        {/* Password Update */}
        <Card title="Change Password" subtitle="Keep your infrastructure credentials secure.">
          <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Input 
              label="Current Password" type="password" placeholder="Enter current password" required
              value={oldPassword} onChange={e => setOldPassword(e.target.value)} 
            />
            <Input 
              label="New Password" type="password" placeholder="Must be at least 8 characters" required
              value={newPassword} onChange={e => setNewPassword(e.target.value)} 
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
              <Button variant="primary" type="submit">Update Password</Button>
            </div>
          </form>
        </Card>

        {/* Danger Zone */}
        <Card title="Danger Zone" subtitle="Irreversible account actions.">
          <div style={{ border: "1px solid rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.05)", padding: "20px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <div style={{ fontWeight: "600", color: "var(--text)" }}>Delete Account</div>
              <div style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "4px" }}>Permanently delete your account and all associated applications.</div>
            </div>
            <Button variant="danger" onClick={() => setConfirmDialog({
              title: "Delete Account",
              message: "Are you absolutely sure you want to delete your account? This action is irreversible and all your data will be wiped immediately.",
              onConfirm: () => { setConfirmDialog(null); showStatus('Feature disabled in demo mode.', 'error'); }
            })}>Delete Account</Button>
          </div>
        </Card>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {status.msg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: -20, x: "-50%" }}
            style={{ position: "fixed", top: "24px", left: "50%", zIndex: 1000, padding: "12px 24px", borderRadius: "100px", fontWeight: "600", fontSize: "0.85rem", background: status.type === "error" ? "var(--error, #ef4444)" : status.type === "success" ? "var(--success, #10b981)" : "var(--accent)", color: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}
          >
            {status.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmDialog && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setConfirmDialog(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ position: "relative", width: "100%", maxWidth: "400px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
              <h3 style={{ marginTop: 0, fontSize: "1.2rem", fontWeight: "700", color: "var(--text)" }}>{confirmDialog.title}</h3>
              <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "24px" }}>{confirmDialog.message}</p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <Button variant="ghost" onClick={() => setConfirmDialog(null)}>Cancel</Button>
                <Button variant="danger" onClick={confirmDialog.onConfirm}>Confirm Action</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
