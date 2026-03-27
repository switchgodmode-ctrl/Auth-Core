import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchApplications, fetchWebhooks, createWebhook, deleteWebhook } from "../api.js";
import Button from "../components/ui/Button.jsx";

export default function Webhooks() {
  const [apps, setApps] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState("");
  const [webhooks, setWebhooks] = useState([]);
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState({ msg: "", type: "" });
  const [loading, setLoading] = useState(false);

  function showStatus(msg, type = "info") {
    setStatus({ msg, type });
    setTimeout(() => setStatus({ msg: "", type: "" }), 4000);
  }

  async function loadInitial() {
    const r = await fetchApplications();
    if (r.status && r.info.length > 0) {
      setApps(r.info);
      setSelectedAppId(r.info[0]._id);
    }
  }

  async function loadHooks(appId) {
    setLoading(true);
    const r = await fetchWebhooks(appId);
    if (r.status) setWebhooks(r.info || []);
    setLoading(false);
  }

  useEffect(() => { loadInitial(); }, []);

  useEffect(() => {
    if (selectedAppId) loadHooks(selectedAppId);
    else setWebhooks([]);
  }, [selectedAppId]);

  async function handleCreate() {
    if (!selectedAppId || !url.trim()) return;
    const r = await createWebhook(selectedAppId, url.trim(), ["ALL"]);
    if (r.status) {
      showStatus("Webhook successfully registered", "success");
      setUrl("");
      loadHooks(selectedAppId);
    } else {
      showStatus(r.error || "Failed to create webhook", "error");
    }
  }

  async function handleDelete(id) {
    const r = await deleteWebhook(id);
    if (r.status) {
      showStatus("Webhook deleted", "success");
      loadHooks(selectedAppId);
    } else {
      showStatus(r.error || "Failed to delete webhook", "error");
    }
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "60px", paddingTop: "24px" }}>
      <AnimatePresence>
        {status.msg && (
          <motion.div initial={{ opacity: 0, y: -20, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: -20, x: "-50%" }} style={{ position: "fixed", top: "24px", left: "50%", zIndex: 1000, padding: "12px 24px", borderRadius: "100px", fontWeight: "600", fontSize: "0.85rem", background: status.type === "error" ? "var(--error)" : "var(--success)", color: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
            {status.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text)", letterSpacing: "-0.03em" }}>Event Webhooks</h1>
        <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginTop: "4px" }}>Configure asynchronous POST endpoints for critical application events.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}>
        
        {/* Create Form */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", color: "var(--text)" }}>Register Endpoint</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: "16px", alignItems: "end" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--text)", marginBottom: "8px" }}>Target Application</label>
              <select value={selectedAppId} onChange={e => setSelectedAppId(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", outline: "none", fontSize: "0.9rem" }}>
                {apps.map(app => <option key={app._id} value={app._id}>{app.appName}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--text)", marginBottom: "8px" }}>Payload URL</label>
              <input placeholder="https://api.yourdomain.com/hooks/nexus" value={url} onChange={e => setUrl(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", outline: "none", fontSize: "0.9rem" }} />
            </div>
            <Button variant="primary" onClick={handleCreate} disabled={!selectedAppId || !url.trim()} style={{ height: "43px" }}>Add Webhook</Button>
          </div>
        </div>

        {/* List View */}
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "16px", color: "var(--text)" }}>Active Subscriptions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>Loading endpoints...</div>
            ) : webhooks.length > 0 ? (
              webhooks.map(wh => (
                <div key={wh._id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: wh.isActive ? "var(--success)" : "var(--muted)" }} />
                    <div style={{ fontFamily: "monospace", fontSize: "0.9rem", color: "var(--text)" }}>{wh.url}</div>
                    <div style={{ fontSize: "0.75rem", background: "var(--surface2)", padding: "4px 8px", borderRadius: "6px", color: "var(--muted)" }}>Events: {wh.events.join(", ")}</div>
                  </div>
                  <button onClick={() => handleDelete(wh._id)} style={{ background: "rgba(239, 68, 68, 0.1)", border: "none", color: "var(--error)", padding: "8px 12px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: "600", cursor: "pointer", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background="rgba(239, 68, 68, 0.2)"} onMouseOut={e => e.currentTarget.style.background="rgba(239, 68, 68, 0.1)"}>
                    Revoke
                  </button>
                </div>
              ))
            ) : (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)", background: "var(--surface)", borderRadius: "12px", border: "1px dashed var(--border)" }}>
                No active webhooks found for this application.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
