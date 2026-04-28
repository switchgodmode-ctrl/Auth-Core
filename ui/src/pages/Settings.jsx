import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { forgotPassword, updateProfile, changePassword, fetchSessions, logoutDevice } from "../api";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [username, setUsername] = useState("");
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
    const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (savedUser) {
      setUser(savedUser);
      setUsername(savedUser.username || "");
      setEmail(savedUser.email || "");
      if (savedUser.avatar) {
        setAvatarPreview(savedUser.avatar.startsWith('http') ? savedUser.avatar : `${import.meta.env.VITE_API_URL}${savedUser.avatar}`);
      }
    }
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const res = await fetchSessions();
      if (res.status) setSessions(res.sessions);
    } catch (err) { console.error(err); }
  };

  const handleLogoutDevice = async (sid) => {
    try {
      const res = await logoutDevice(sid);
      if (res.status) {
        showStatus("Device logged out", "success");
        loadSessions();
      }
    } catch (err) { showStatus("Failed to logout device", "error"); }
  };

  async function handleUpdateProfile(e) {
    if (e) e.preventDefault();
    const formData = new FormData();
    if (username) formData.append("username", username);
    if (fileInputRef.current?.files[0]) {
      formData.append("avatar", fileInputRef.current.files[0]);
    }

    try {
      const res = await updateProfile(formData);
      if (res.status) {
        localStorage.setItem("user", JSON.stringify(res.info));
        setUser(res.info);
        if (res.info.avatar) {
            setAvatarPreview(`${import.meta.env.VITE_API_URL}${res.info.avatar}`);
        }
        showStatus("Profile updated successfully", "success");
        window.dispatchEvent(new Event('avatar-updated'));
      } else {
        showStatus(res.error || "Update failed", "error");
      }
    } catch (err) {
      showStatus("Network error", "error");
    }
  }

  async function handleAvatarSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showStatus("Image must be less than 2MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
    handleUpdateProfile();
  }

  async function handleUpdatePassword(e) {
    e.preventDefault();
    try {
      const res = await changePassword({ oldPassword, newPassword });
      if (res.status) {
        showStatus("Password updated successfully", "success");
        setOldPassword("");
        setNewPassword("");
      } else {
        showStatus(res.message || "Failed to update password", "error");
      }
    } catch (err) {
      showStatus("Network error", "error");
    }
  }

  async function handleSendReset() {
    if (!email) return;
    const r = await forgotPassword(email);
    if (r?.status) setResetMsg("A password reset email has been sent to your address.");
    else setResetMsg(r?.error || "Failed to trigger reset.");
  }

  return (
    <div style={{ maxWidth: "800px", display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "50px" }}>
      <div className="db-page-head">
        <div>
          <h1 className="db-page-title">Profile Settings</h1>
          <p className="db-page-sub">Manage your account details, security and referral rewards.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
        {/* Account Profile */}
        <Card title="Account Profile" subtitle="Your primary authcore identification">
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), var(--accent2))", display: "grid", placeItems: "center", fontSize: "1.8rem", color: "#fff", fontWeight: "800", overflow: "hidden", border: "2px solid var(--border)" }}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                username?.[0]?.toUpperCase() || email?.[0]?.toUpperCase() || "A"
              )}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                 <input 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    onBlur={() => handleUpdateProfile()}
                    className="settings-username-input"
                    placeholder="Enter Username"
                    style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', outline: 'none' }}
                 />
              </div>
              <div style={{ color: "var(--muted)", marginTop: "4px" }}>{email || "admin@authcore.cloud"}</div>
              <div style={{ display: "inline-block", padding: "4px 8px", background: "rgba(99, 102, 241, 0.1)", color: "var(--accent)", fontSize: "0.7rem", fontWeight: "700", letterSpacing: "0.05em", borderRadius: "100px", marginTop: "8px", textTransform: "uppercase" }}>
                Active Plan: {user?.plan || 'Free'}
              </div>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <input type="file" ref={fileInputRef} accept="image/png, image/jpeg, image/jpg" style={{ display: "none" }} onChange={handleAvatarSelect} />
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>Change Avatar</Button>
            <Button variant="ghost" onClick={handleSendReset}>Send Password Reset Email</Button>
          </div>
          {resetMsg && <div style={{ marginTop: "16px", color: "var(--success)", fontSize: "0.85rem" }}>{resetMsg}</div>}
        </Card>

        {/* Referral System */}
        <Card title="Referral Program" subtitle="Invite friends and get rewards.">
            <div style={{ background: "var(--surface2)", padding: "20px", borderRadius: "12px", border: "1px dashed var(--border)" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "8px" }}>Your Referral Link</div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <code style={{ flex: 1, background: "var(--bg)", padding: "10px", borderRadius: "6px", color: "var(--accent)", fontSize: "0.9rem", minWidth: "200px", wordBreak: "break-all" }}>
                        {window.location.origin}/register?ref={user?.referralCode}
                    </code>
                    <Button variant="secondary" size="sm" onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/register?ref=${user?.referralCode}`);
                        showStatus("Link copied to clipboard!", "success");
                    }}>Copy</Button>
                </div>
                {user?.referredBy && (
                    <div style={{ marginTop: "15px", fontSize: "0.8rem", color: "var(--success)" }}>
                        ✓ You were referred by another user!
                    </div>
                )}
            </div>
        </Card>

        {/* Sessions & Security */}
        <Card title="Active Sessions" subtitle="Manage your active logins across different devices.">
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {sessions.length === 0 && <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Loading active sessions...</div>}
                {sessions.map((s, idx) => (
                    <div key={idx} style={{ background: "var(--surface2)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ color: "var(--accent)" }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                            </div>
                            <div>
                                <div style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--text)" }}>{s.device.split(')')[0].split('(')[1] || 'Unknown Browser'}</div>
                                <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>IP: {s.ip} • Last active: {new Date(s.lastActive).toLocaleString()}</div>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleLogoutDevice(s._id)}>Logout</Button>
                    </div>
                ))}
            </div>
        </Card>

        {/* Password Update */}
        <Card title="Change Password" subtitle="Keep your account credentials secure.">
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
              <div style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "4px" }}>Permanently delete your account and all data.</div>
            </div>
            <Button variant="danger" onClick={() => setConfirmDialog({
              title: "Delete Account",
              message: "Are you absolutely sure? This action is irreversible.",
              onConfirm: () => { setConfirmDialog(null); showStatus('Feature disabled in demo mode.', 'error'); }
            })}>Delete Account</Button>
          </div>
        </Card>
      </div>

      <AnimatePresence>
        {status.msg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: -20, x: "-50%" }}
            style={{ position: "fixed", top: "24px", left: "50%", zIndex: 1000, padding: "12px 24px", borderRadius: "100px", fontWeight: "600", fontSize: "0.85rem", background: status.type === "error" ? "#ef4444" : status.type === "success" ? "#10b981" : "#6366f1", color: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}
          >
            {status.msg}
          </motion.div>
        )}
      </AnimatePresence>

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
