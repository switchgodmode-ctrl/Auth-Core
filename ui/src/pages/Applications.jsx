import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchApplications, createApplication, createLicenceKey, updateApplicationVersion, resetApplicationSecret, deleteApplication, updateApplicationPayload } from "../api.js";
import Button from "../components/ui/Button.jsx";

export default function Applications() {
  const [apps, setApps] = useState([]);
  const [query, setQuery] = useState("");
  
  // Modal States
  const [isAppModalOpen, setAppModalOpen] = useState(false);
  const [isKeyModalOpen, setKeyModalOpen] = useState(false);
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [status, setStatus] = useState({ msg: "", type: "" });
  const [activeMenu, setActiveMenu] = useState(null);

  // Form States
  const [appName, setAppName] = useState("");
  const [description, setDescription] = useState("");
  const [licKey, setLicKey] = useState("");
  const [licDays, setLicDays] = useState("365");
  const [selectedAppId, setSelectedAppId] = useState("");

  // Version form state
  const [versionAppId, setVersionAppId] = useState(null);
  const [versionValue, setVersionValue] = useState("");

  const [payloadModalOpen, setPayloadModalOpen] = useState(false);
  const [payloadAppId, setPayloadAppId] = useState(null);
  const [payloadValue, setPayloadValue] = useState("");

  async function refresh() {
    const r = await fetchApplications();
    if (r.status) setApps(r.info || []);
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return apps.filter(a => a.appName?.toLowerCase().includes(q) || String(a._id).includes(q));
  }, [apps, query]);

  function showStatus(msg, type = "info") {
    setStatus({ msg, type });
    setTimeout(() => setStatus({ msg: "", type: "" }), 4000);
  }

  function copySecret(secret) {
    if (!secret) return;
    navigator.clipboard.writeText(secret);
    showStatus("App Secret copied to clipboard!", "success");
    setActiveMenu(null);
  }

  async function createApp() {
    const name = appName.trim();
    const desc = description.trim();
    if (!name || !desc) {
      showStatus("Please fill all required fields", "error");
      return;
    }
    const r = await createApplication(name, desc);
    if (r.status) {
      showStatus("Application created successfully", "success");
      setAppName("");
      setDescription("");
      setAppModalOpen(false);
      await refresh();
    } else {
      showStatus(r.error || "Failed to create application", "error");
    }
  }

  async function createKey() {
    if (!selectedAppId) {
      showStatus("Select a target application", "error");
      return;
    }
    const r = await createLicenceKey(licKey.trim(), Number(licDays), Number(selectedAppId), {});
    if (r.status) {
      showStatus(`Licence issued to App ID ${selectedAppId}`, "success");
      setLicKey("");
      setKeyModalOpen(false);
      await refresh();
    } else {
      showStatus(r.error || "Failed to issue licence", "error");
    }
  }

  async function handleUpdateVersion() {
    if (!versionValue.trim()) return;
    const r = await updateApplicationVersion(versionAppId, versionValue.trim());
    if (r.status) {
      showStatus("Version updated successfully", "success");
      setVersionModalOpen(false);
      await refresh();
    } else {
      showStatus(r.error || "Failed to update version", "error");
    }
  }

  async function handleUpdatePayload() {
    const r = await updateApplicationPayload(payloadAppId, payloadValue);
    if (r.status) {
      showStatus("Remote Payload injected successfully", "success");
      setPayloadModalOpen(false);
      await refresh();
    } else {
      showStatus(r.error || "Failed to inject payload", "error");
    }
  }

  const [confirmDialog, setConfirmDialog] = useState(null);

  async function performResetSecret(id) {
    const r = await resetApplicationSecret(id);
    if (r.status) {
      showStatus("App Secret has been successfully reset. Please deploy the new secret.", "success");
      await refresh();
    } else {
      showStatus(r.error || "Failed to reset App Secret", "error");
    }
  }

  function handleResetSecret(id) {
    setActiveMenu(null);
    setConfirmDialog({
      title: "Reset Application Secret",
      message: "WARNING: Are you sure you want to completely reset the App Secret? All existing client endpoints using the old secret will fail verification immediately.",
      onConfirm: () => { setConfirmDialog(null); performResetSecret(id); }
    });
  }

  async function performDeleteApp(id) {
    const r = await deleteApplication(id);
    if (r.status) {
      showStatus("Application successfully deleted.", "success");
      await refresh();
    } else {
      showStatus(r.message || r.error || "Failed to delete application", "error");
    }
  }

  function handleDeleteApp(id) {
    setActiveMenu(null);
    setConfirmDialog({
      title: "Delete Application Environment",
      message: "Are you absolutely sure you want to permanently delete this Application? All corresponding client-side verification attempts will immediately start rejecting for this ID.",
      onConfirm: () => { setConfirmDialog(null); performDeleteApp(id); }
    });
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", paddingBottom: "60px", paddingTop: "24px" }}>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {status.msg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: "-50%" }} 
            animate={{ opacity: 1, y: 0, x: "-50%" }} 
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            style={{
              position: "fixed", top: "24px", left: "50%", zIndex: 1000,
              padding: "12px 24px", borderRadius: "100px", fontWeight: "600", fontSize: "0.85rem",
              background: status.type === "error" ? "var(--error, #ef4444)" : status.type === "success" ? "var(--success, #10b981)" : "var(--accent)",
              color: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
            }}
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
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} style={{ position: "relative", width: "100%", maxWidth: "420px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
              <h3 style={{ marginTop: 0, fontSize: "1.2rem", fontWeight: "700", color: "var(--text)" }}>{confirmDialog.title}</h3>
              <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "24px" }}>{confirmDialog.message}</p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <Button variant="ghost" onClick={() => setConfirmDialog(null)}>Cancel</Button>
                <Button variant="danger" onClick={confirmDialog.onConfirm}>Confirm Reset</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text)", letterSpacing: "-0.03em" }}>Applications</h1>
          <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginTop: "4px" }}>Manage environments and generate licence policies.</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Button variant="secondary" onClick={() => setKeyModalOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
            Issue Key
          </Button>
          <Button variant="primary" onClick={() => setAppModalOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            New Application
          </Button>
        </div>
      </div>

      {/* Unified Search & Filters Bar */}
      <div style={{ display: "flex", alignItems: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "8px 16px", marginBottom: "24px" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "12px" }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input 
          placeholder="Search by application name or UUID..." 
          value={query} 
          onChange={e => setQuery(e.target.value)}
          style={{ flex: 1, background: "transparent", border: "none", color: "var(--text)", fontSize: "0.95rem", outline: "none", padding: "8px 0" }}
        />
        {query && (
          <div style={{ fontSize: "0.8rem", color: "var(--muted)", background: "var(--surface2)", padding: "4px 8px", borderRadius: "6px" }}>
            {filtered.length} results
          </div>
        )}
      </div>

      {/* Directory List / Table equivalent */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filtered.map((app, i) => (
          <motion.div 
            key={app._id} 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.03 }}
            style={{ 
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", 
              padding: "20px 24px", display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap",
              transition: "border-color 0.2s, background 0.2s"
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--surface2)"; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--surface)"; }}
          >
            {/* App Icon placeholder */}
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", display: "grid", placeItems: "center", color: "var(--accent)", flexShrink: 0 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
            </div>
            
            {/* Metadata */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{app.appName}</h3>
                <span style={{ padding: "2px 8px", background: "rgba(16,185,129,0.1)", color: "var(--success, #10b981)", fontSize: "0.65rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", borderRadius: "100px" }}>
                  {app.status || "Active"}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--muted)", fontFamily: "monospace", marginLeft: "auto" }}>ID: {app._id}</span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--muted)", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{app.description}</p>
            </div>

            {/* Quick Actions Dropdown Menu */}
            <div style={{ position: "relative" }}>
              <button 
                onClick={() => setActiveMenu(activeMenu === app._id ? null : app._id)}
                style={{ background: activeMenu === app._id ? "var(--bg)" : "transparent", border: "none", color: activeMenu === app._id ? "var(--text)" : "var(--muted)", cursor: "pointer", padding: "8px", borderRadius: "8px", transition: "all 0.2s" }} 
                onMouseOver={e => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.background = "var(--bg)"; }} 
                onMouseOut={e => { if(activeMenu !== app._id) { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; } }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
              </button>

              <AnimatePresence>
                {activeMenu === app._id && (
                  <>
                    {/* Invisible Overlay for click-away */}
                    <div style={{ position: "fixed", inset: 0, zIndex: 90 }} onClick={() => setActiveMenu(null)} />
                    
                    {/* The Menu UI */}
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: -10 }} 
                      animate={{ opacity: 1, scale: 1, y: 0 }} 
                      exit={{ opacity: 0, scale: 0.95, y: -10 }} 
                      transition={{ duration: 0.15 }}
                      style={{ position: "absolute", right: 0, top: "100%", marginTop: "8px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "10px", width: "190px", zIndex: 100, overflow: "hidden", boxShadow: "0 12px 32px rgba(0,0,0,0.4)" }}
                    >
                      <button onClick={() => copySecret(app.appSecret)} style={{ width: "100%", padding: "10px 16px", background: "transparent", border: "none", textAlign: "left", color: "var(--text)", fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "var(--bg)"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                        Copy App Secret
                      </button>
                      <button onClick={() => { setActiveMenu(null); setVersionAppId(app._id); setVersionValue(app.version || "1.0.0"); setVersionModalOpen(true); }} style={{ width: "100%", padding: "10px 16px", background: "transparent", border: "none", textAlign: "left", color: "var(--text)", fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "var(--bg)"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6"></path><path d="M21 13a9 9 0 1 1-3-7.7L21 8"></path></svg>
                        Update Version
                      </button>
                      <button onClick={() => { setActiveMenu(null); setPayloadAppId(app._id); setPayloadValue(app.remotePayload || ""); setPayloadModalOpen(true); }} style={{ width: "100%", padding: "10px 16px", background: "transparent", border: "none", textAlign: "left", color: "var(--text)", fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "var(--bg)"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
                        Edit Payload
                      </button>
                      <div style={{ height: "1px", background: "var(--border)", margin: "4px 0" }} />
                      <button onClick={() => handleResetSecret(app._id)} style={{ width: "100%", padding: "10px 16px", background: "transparent", border: "none", textAlign: "left", color: "var(--error, #ef4444)", fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3zM12 8v4l3 3"></path></svg>
                        Reset Secret
                      </button>
                      <button onClick={() => handleDeleteApp(app._id)} style={{ width: "100%", padding: "10px 16px", background: "transparent", border: "none", textAlign: "left", color: "var(--error, #ef4444)", fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        Delete App
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "64px 24px", color: "var(--muted)", background: "var(--surface)", borderRadius: "12px", border: "1px dashed var(--border)" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginBottom: "16px" }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
            <p style={{ fontSize: "1rem", color: "var(--text)", marginBottom: "8px", fontWeight: "600" }}>No applications found</p>
            <p style={{ fontSize: "0.85rem" }}>Get started by registering a new application environment.</p>
            <Button variant="primary" style={{ marginTop: "24px" }} onClick={() => setAppModalOpen(true)}>Create Application</Button>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* 1. Create App Modal */}
      <AnimatePresence>
        {isAppModalOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setAppModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.2 }} style={{ position: "relative", width: "100%", maxWidth: "450px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
              <div style={{ padding: "24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface2)" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text)", margin: 0 }}>Register Platform</h2>
                <button onClick={() => setAppModalOpen(false)} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", padding: "4px" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
              </div>
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--text)", marginBottom: "8px" }}>Project Name <span style={{ color: "var(--error, #ef4444)" }}>*</span></label>
                  <input autoFocus placeholder="e.g. Acme Backend Services" value={appName} onChange={e => setAppName(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", outline: "none", fontSize: "0.9rem", transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--text)", marginBottom: "8px" }}>Internal Description <span style={{ color: "var(--error, #ef4444)" }}>*</span></label>
                  <textarea placeholder="Briefly describe what this app is used for..." rows="3" value={description} onChange={e => setDescription(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", outline: "none", fontSize: "0.9rem", resize: "none", transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
                </div>
              </div>
              <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", background: "var(--surface2)", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <Button variant="ghost" onClick={() => setAppModalOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={createApp} disabled={!appName.trim() || !description.trim()}>Deploy Environment</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Issue Key Modal */}
      <AnimatePresence>
        {isKeyModalOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setKeyModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.2 }} style={{ position: "relative", width: "100%", maxWidth: "450px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
              <div style={{ padding: "24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface2)" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text)", margin: 0 }}>Issue Runtime Key</h2>
                <button onClick={() => setKeyModalOpen(false)} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", padding: "4px" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
              </div>
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--text)", marginBottom: "8px" }}>Target Application <span style={{ color: "var(--error, #ef4444)" }}>*</span></label>
                  <select 
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", outline: "none", fontSize: "0.9rem", appearance: "none", cursor: "pointer" }}
                    value={selectedAppId} onChange={e => setSelectedAppId(e.target.value)}
                  >
                    <option value="" disabled>Select an Application...</option>
                    {apps.map(app => <option key={app._id} value={app._id}>{app.appName} (ID: {app._id})</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--text)", marginBottom: "8px" }}>Custom Seed / Token (Optional)</label>
                  <input placeholder="Leave blank to auto-generate" value={licKey} onChange={e => setLicKey(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", outline: "none", fontSize: "0.9rem", transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--text)", marginBottom: "8px" }}>Time-to-Live (Days) <span style={{ color: "var(--error, #ef4444)" }}>*</span></label>
                  <input type="number" min="1" value={licDays} onChange={e => setLicDays(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", outline: "none", fontSize: "0.9rem", transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
                </div>
              </div>
              <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", background: "var(--surface2)", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <Button variant="ghost" onClick={() => setKeyModalOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={createKey} disabled={!selectedAppId}>Generate Licence</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Update Version Modal */}
      <AnimatePresence>
        {versionModalOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setVersionModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.2 }} style={{ position: "relative", width: "100%", maxWidth: "400px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
              <div style={{ padding: "24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface2)" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text)", margin: 0 }}>Update Base Version</h2>
                <button onClick={() => setVersionModalOpen(false)} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", padding: "4px" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
              </div>
              <div style={{ padding: "24px" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--text)", marginBottom: "8px" }}>New Version Tag <span style={{ color: "var(--error, #ef4444)" }}>*</span></label>
                <input autoFocus placeholder="e.g. 2.1.0" value={versionValue} onChange={e => setVersionValue(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", outline: "none", fontSize: "0.9rem", transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
              </div>
              <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", background: "var(--surface2)", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <Button variant="ghost" onClick={() => setVersionModalOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleUpdateVersion} disabled={!versionValue.trim()}>Apply Update</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Manage Remote Payload Modal */}
      <AnimatePresence>
        {payloadModalOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setPayloadModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.2 }} style={{ position: "relative", width: "100%", maxWidth: "600px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
              <div style={{ padding: "24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface2)" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text)", margin: 0 }}>Configure Remote Payload</h2>
                <button onClick={() => setPayloadModalOpen(false)} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", padding: "4px" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
              </div>
              <div style={{ padding: "24px" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--text)", marginBottom: "8px" }}>Encrypted String / Core JS Payload</label>
                <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: "16px" }}>This payload is exclusively delivered to the client environment <strong>only</strong> if the Runtime Node returns <span style={{ fontFamily: "monospace", color: "var(--success)" }}>allowed: true</span>.</p>
                <textarea autoFocus placeholder="// Inject conditional execution code or secrets here...\nreturn { premium_flag: true };" value={payloadValue} onChange={e => setPayloadValue(e.target.value)} rows="8" style={{ width: "100%", padding: "16px", borderRadius: "8px", background: "#0f172a", border: "1px solid var(--border)", color: "#a5b4fc", outline: "none", fontSize: "0.85rem", fontFamily: "monospace", resize: "none", transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} spellCheck="false" />
              </div>
              <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", background: "var(--surface2)", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <Button variant="ghost" onClick={() => setPayloadModalOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleUpdatePayload}>Secure Deploy</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
