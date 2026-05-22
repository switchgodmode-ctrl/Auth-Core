import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchLicences, banUnbanLicence, updateLicenceDays, runExpiryCheck, resetHwid, setOffline, deleteLicence, sendLicenceMessage, fetchLicenceSessions } from "../api.js";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";

function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode === "LH" || countryCode === "UN") return "🌐";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map(char => 127397 + char.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch {
    return "🌐";
  }
}

export default function Licences() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState({ msg: "", type: "" });
  const [query, setQuery] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null);
  
  const [daysOpen, setDaysOpen] = useState(false);
  const [daysKey, setDaysKey] = useState("");
  const [daysAppId, setDaysAppId] = useState(0);
  const [daysValue, setDaysValue] = useState("");

  const [msgOpen, setMsgOpen] = useState(false);
  const [msgKey, setMsgKey] = useState("");
  const [msgAppId, setMsgAppId] = useState(0);
  const [msgValue, setMsgValue] = useState("");

  const [logsOpen, setLogsOpen] = useState(false);
  const [logsKey, setLogsKey] = useState("");
  const [logsId, setLogsId] = useState(0);
  const [sessionsList, setSessionsList] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const canSeeMsg = useMemo(() => {
    try {
      const role = (localStorage.getItem("role") || "").toLowerCase();
      if (role === "admin") return true;
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return !!u.msgAccess;
    } catch(e) {
      return false;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    const r = await fetchLicences();
    if (r.status) setItems(r.info || []);
  }

  async function openSessionsLog(lic) {
    setLogsKey(lic.key);
    setLogsId(lic._id);
    setSessionsList([]);
    setLoadingSessions(true);
    setLogsOpen(true);
    
    const r = await fetchLicenceSessions(lic._id);
    setLoadingSessions(false);
    if (r.status) {
      setSessionsList(r.info || []);
    } else {
      showStatus("Failed to load session logs", "error");
    }
  }

  function showStatus(msg, type = "info") {
    setStatus({ msg, type });
    setTimeout(() => setStatus({ msg: "", type: "" }), 4000);
  }

  async function action(name, fn, ...args) {
    showStatus(`Processing ${name}...`, "info");
    const r = await fn(...args);
    await refresh();
    showStatus(r.status ? `${name} successful` : `Failed to ${name.toLowerCase()}`, r.status ? "success" : "error");
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter(l => String(l.key).toLowerCase().includes(q) || String(l.appId).includes(q));
  }, [items, query]);

  function remainingPercent(lic) {
    if (!lic.activatedAt) return 0;
    const start = new Date(lic.activatedAt).getTime();
    const end = start + (Number(lic.Day || 0) * 86400000);
    const now = Date.now();
    const total = Math.max(1, end - start);
    const left = Math.max(0, end - now);
    return Math.round((left / total) * 100);
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
                <Button variant="danger" onClick={confirmDialog.onConfirm}>Confirm Deletion</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text)", letterSpacing: "-0.03em" }}>Licence Management</h1>
          <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginTop: "4px" }}>Monitor subscriptions, trust scores, and runtime connections.</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Button variant="ghost" onClick={refresh}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
            Sync State
          </Button>
          <Button variant="secondary" onClick={() => action("Expiry Check", runExpiryCheck)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Run Expiry Check
          </Button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "8px 16px", marginBottom: "24px" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "12px" }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input 
          placeholder="Filter by licence key, subset, or application ID..." 
          value={query} 
          onChange={e => setQuery(e.target.value)}
          style={{ flex: 1, background: "transparent", border: "none", color: "var(--text)", fontSize: "0.95rem", outline: "none", padding: "8px 0" }}
        />
        {query && <div style={{ fontSize: "0.8rem", color: "var(--muted)", background: "var(--surface2)", padding: "4px 8px", borderRadius: "6px" }}>{filtered.length} results</div>}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--border)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
        {/* Table Header */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 2fr", gap: "16px", padding: "16px 24px", background: "var(--surface2)", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
          <div>Key Identifier</div>
          <div>App Ref</div>
          <div>Trust Score</div>
          <div>Status</div>
          <div style={{ textAlign: "right" }}>Actions</div>
        </div>

        {filtered.map((lic, i) => (
          <div key={lic._id || i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 2fr", gap: "16px", padding: "16px 24px", background: "var(--surface)", alignItems: "center", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "var(--surface2)"} onMouseOut={e => e.currentTarget.style.background = "var(--surface)"}>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ fontFamily: "monospace", fontSize: "0.9rem", color: "var(--text)", fontWeight: "600" }}>{String(lic.key).slice(0, 20)}...</div>
              {lic.note && (
                <div style={{ fontSize: "0.75rem", color: "var(--accent)", fontStyle: "italic", opacity: 0.85, display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "0.85rem" }}>📝</span> {lic.note}
                </div>
              )}
              {lic.activatedAt ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "100%", maxWidth: "120px", height: "4px", background: "rgba(255,255,255,0.1)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${remainingPercent(lic)}%`, background: remainingPercent(lic) > 20 ? "var(--success, #10b981)" : "var(--error, #ef4444)", borderRadius: "2px" }} />
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{lic.Day}d total</span>
                </div>
              ) : (
                <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontStyle: "italic" }}>Inactive (Pending connection)</div>
              )}
            </div>

            <div style={{ fontSize: "0.9rem", color: "var(--text)", fontWeight: "500" }}>#{lic.appId}</div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
               {/* simple trust score visualizing */}
               <div style={{ fontSize: "0.9rem", fontWeight: "700", color: lic.trustScore < 50 ? "var(--error, #ef4444)" : "var(--text)" }}>{lic.trustScore || 0}</div>
            </div>

            <div>
              <style>{`
                @keyframes pulse-dot {
                  0% { transform: scale(0.9); opacity: 0.6; }
                  50% { transform: scale(1.2); opacity: 1; }
                  100% { transform: scale(0.9); opacity: 0.6; }
                }
              `}</style>
              {lic.isCurrentlyActive ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ padding: "4px 8px", background: "rgba(16,185,129,0.15)", color: "var(--success, #10b981)", fontSize: "0.65rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", borderRadius: "100px", width: "fit-content", display: "inline-flex", alignItems: "center" }}>
                    <span style={{ width: "6px", height: "6px", background: "#10b981", borderRadius: "50%", marginRight: "6px", display: "inline-block", animation: "pulse-dot 1.5s infinite" }} />
                    Currently Active (Online)
                  </span>
                  {lic.lastSessionCreated && (
                    <span style={{ fontSize: "0.65rem", color: "var(--muted)", fontStyle: "italic", marginLeft: "4px" }}>
                      Since: {new Date(lic.lastSessionCreated).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  )}
                </div>
              ) : lic.Status === 'ban' ? (
                <span style={{ padding: "4px 8px", background: "rgba(239,68,68,0.1)", color: "var(--error, #ef4444)", fontSize: "0.65rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", borderRadius: "100px" }}>Banned</span>
              ) : lic.Status === 'killed' ? (
                <span style={{ padding: "4px 8px", background: "rgba(255,0,0,0.15)", color: "#ff2222", fontSize: "0.65rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", borderRadius: "100px" }}>Killed</span>
              ) : lic.Status === 'online' ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span style={{ padding: "4px 8px", background: "rgba(245,158,11,0.1)", color: "#f59e0b", fontSize: "0.65rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", borderRadius: "100px", width: "fit-content" }}>
                    Currently Inactive (Offline)
                  </span>
                  {lic.lastSessionSeen && (
                    <span style={{ fontSize: "0.65rem", color: "var(--muted)", fontStyle: "italic", marginLeft: "4px" }}>
                      Last Active: {new Date(lic.lastSessionSeen).toLocaleDateString([], {month: 'short', day: 'numeric'})} {new Date(lic.lastSessionSeen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  )}
                </div>
              ) : (
                <span style={{ padding: "4px 8px", background: "rgba(107,114,128,0.1)", color: "var(--muted)", fontSize: "0.65rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", borderRadius: "100px" }}>Inactive (Offline)</span>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px", flexWrap: "wrap" }}>
              <button 
                onClick={() => openSessionsLog(lic)}
                style={{ cursor: "pointer", background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", padding: "4px 10px", fontSize: "0.75rem", borderRadius: "6px", fontWeight: "600", transition: "all 0.2s" }}
                onMouseOver={e => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.color = "#fff"; }} 
                onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--accent)"; }}
              >Logs</button>

              <button 
                onClick={() => { setDaysKey(lic.key); setDaysAppId(lic.appId); setDaysValue(""); setDaysOpen(true); }}
                style={{ cursor: "pointer", background: "transparent", border: "1px solid var(--border)", color: "var(--text)", padding: "4px 10px", fontSize: "0.75rem", borderRadius: "6px", fontWeight: "500", transition: "all 0.2s" }}
                onMouseOver={e => e.currentTarget.style.background = "var(--surface2)"} onMouseOut={e => e.currentTarget.style.background = "transparent"}
              >Days</button>

              {canSeeMsg && (
                <button 
                  onClick={() => { setMsgKey(lic.key); setMsgAppId(lic.appId); setMsgValue(lic.customMessage || ""); setMsgOpen(true); }}
                  style={{ cursor: "pointer", background: "transparent", border: "1px solid var(--border)", color: "var(--accent)", padding: "4px 10px", fontSize: "0.75rem", borderRadius: "6px", fontWeight: "500" }}
                >Msg</button>
              )}
              
              {lic.Status === "ban" ? (
                <button onClick={() => action("Unban", banUnbanLicence, lic.key, lic.appId, "unban")} style={{ cursor: "pointer", background: "transparent", border: "1px solid var(--border)", color: "var(--success, #10b981)", padding: "4px 10px", fontSize: "0.75rem", borderRadius: "6px", fontWeight: "500" }}>Unban</button>
              ) : (
                <button onClick={() => action("Ban", banUnbanLicence, lic.key, lic.appId, "ban")} style={{ cursor: "pointer", background: "transparent", border: "1px solid var(--border)", color: "var(--text)", padding: "4px 10px", fontSize: "0.75rem", borderRadius: "6px", fontWeight: "500" }}>Ban</button>
              )}
              
              <button onClick={() => action("Reset HWID", resetHwid, lic.key, lic.appId)} style={{ cursor: "pointer", background: "transparent", border: "1px solid var(--border)", color: "var(--text)", padding: "4px 10px", fontSize: "0.75rem", borderRadius: "6px", fontWeight: "500" }}>R-HWID</button>
              <button onClick={() => action("Remote Kill", banUnbanLicence, lic.key, lic.appId, "kill")} disabled={lic.Status === 'killed'} style={{ cursor: "pointer", background: lic.Status === 'killed' ? "transparent" : "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: lic.Status === 'killed' ? "var(--muted)" : "var(--error, #ef4444)", padding: "4px 10px", fontSize: "0.75rem", borderRadius: "6px", fontWeight: "600", opacity: lic.Status === 'killed' ? 0.5 : 1 }}>Kill Switch</button>
              <button 
                onClick={() => setConfirmDialog({
                  title: "Delete Licence Key",
                  message: "Are you sure you want to permanently delete this key? This action cannot be reversed.",
                  onConfirm: () => { setConfirmDialog(null); action("Delete", deleteLicence, lic.key, lic.appId); }
                })} 
                style={{ cursor: "pointer", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--error, #ef4444)", padding: "4px 10px", fontSize: "0.75rem", borderRadius: "6px", fontWeight: "600" }}
              >Del</button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "64px 24px", color: "var(--muted)", background: "var(--surface)" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginBottom: "16px" }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <p style={{ fontSize: "1rem", color: "var(--text)", marginBottom: "4px", fontWeight: "600" }}>No configurations found</p>
            <p style={{ fontSize: "0.85rem" }}>Generate a licence key in the Applications tab to see it here.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {daysOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setDaysOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.2 }} style={{ position: "relative", width: "100%", maxWidth: "400px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
              <div style={{ padding: "24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface2)" }}>
                <h2 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text)", margin: 0 }}>Update Allocation Limits</h2>
              </div>
              <div style={{ padding: "24px" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--text)", marginBottom: "8px" }}>New Total Days Allowed</label>
                <input type="number" min="1" autoFocus placeholder="e.g. 365" value={daysValue} onChange={e => setDaysValue(e.target.value)} style={{ width: "100%", padding: "12px", borderRadius: "8px", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", outline: "none", fontSize: "0.95rem" }} />
              </div>
              <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", background: "var(--surface2)", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <Button variant="ghost" onClick={() => setDaysOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={() => { 
                  if(Number(daysValue) > 0) {
                    action("Update Days", updateLicenceDays, daysKey, daysAppId, Number(daysValue));
                    setDaysOpen(false);
                  } else {
                    showStatus("Enter a valid number greater than 0", "error");
                  }
                }}>Confirm Modification</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {msgOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setMsgOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.2 }} style={{ position: "relative", width: "100%", maxWidth: "420px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
              <div style={{ padding: "24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface2)" }}>
                <h2 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text)", margin: 0 }}>Send Custom Message</h2>
              </div>
              <div style={{ padding: "24px" }}>
                <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "16px", lineHeight: 1.5 }}>This message will be displayed to the user currently using this licence key. Leave empty to clear.</p>
                <textarea 
                  placeholder="e.g. Please update your software version..." 
                  value={msgValue} 
                  onChange={e => setMsgValue(e.target.value)}
                  style={{ width: "100%", height: "100px", padding: "12px", borderRadius: "8px", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", resize: "none", outline: "none", fontSize: "0.95rem" }}
                />
              </div>
              <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", background: "var(--surface2)", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <Button variant="ghost" onClick={() => setMsgOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={() => { 
                  action("Send Message", sendLicenceMessage, msgKey, msgAppId, msgValue);
                  setMsgOpen(false);
                }}>Transmit Message</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {logsOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }} onClick={() => setLogsOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ duration: 0.2 }} style={{ position: "relative", width: "100%", maxWidth: "800px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.6)", display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface2)" }}>
                <div>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text)", margin: 0 }}>Runtime Connection Logs</h2>
                  <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: "4px 0 0 0", fontFamily: "monospace" }}>Key: {logsKey}</p>
                </div>
                <button onClick={() => setLogsOpen(false)} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "1.2rem" }}>&times;</button>
              </div>
              
              <div style={{ padding: "24px", maxHeight: "400px", overflowY: "auto" }}>
                {loadingSessions ? (
                  <div style={{ textAlign: "center", padding: "48px 0" }}>
                    <div style={{ display: "inline-block", width: "32px", height: "32px", border: "3px solid rgba(255,255,255,0.1)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "pulse-dot 1s linear infinite" }} />
                    <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginTop: "16px" }}>Loading secure session telemetry...</p>
                  </div>
                ) : sessionsList.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--muted)" }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginBottom: "12px" }}><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    <p style={{ fontSize: "0.95rem", color: "var(--text)", fontWeight: "600", marginBottom: "4px" }}>No connection history found</p>
                    <p style={{ fontSize: "0.8rem" }}>This license key has not been authorized or validated in any runtime client environment yet.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.3fr 0.6fr 1.5fr 1.3fr 1.3fr 0.8fr", gap: "8px", padding: "8px 12px", background: "var(--surface2)", fontSize: "0.7rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
                      <div>IP Address</div>
                      <div>Location (Geo)</div>
                      <div>App Ver</div>
                      <div>Hashed HWID</div>
                      <div>Connected (Online)</div>
                      <div>Last Active</div>
                      <div style={{ textAlign: "right" }}>Duration</div>
                    </div>
                    {sessionsList.map((session, index) => {
                      const start = new Date(session.createdAt);
                      const end = new Date(session.lastSeen);
                      const diffMs = Math.max(0, end - start);
                      const diffMins = Math.floor(diffMs / 60000);
                      const diffSecs = Math.floor((diffMs % 60000) / 1000);
                      const durationStr = diffMins === 0 ? `${diffSecs}s` : `${diffMins}m ${diffSecs}s`;
                      
                      return (
                        <div key={session._id || index} style={{ display: "grid", gridTemplateColumns: "1.1fr 1.3fr 0.6fr 1.5fr 1.3fr 1.3fr 0.8fr", gap: "8px", padding: "12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", alignItems: "center", fontSize: "0.8rem" }}>
                          <div style={{ fontFamily: "monospace", color: "var(--text)", fontWeight: "600" }}>{session.ip || "127.0.0.1"}</div>
                          
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                            <span style={{ fontSize: "1.1rem" }} title={session.country || "Local Host"}>{getFlagEmoji(session.countryCode)}</span>
                            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: "var(--text)", fontWeight: "500", fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.city || "Home"}, {session.country || "Local Network"}</span>
                                {session.latitude && session.longitude ? (
                                  <a 
                                    href={`https://www.google.com/maps?q=${session.latitude},${session.longitude}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    style={{ color: "var(--accent)", fontSize: "0.75rem", textDecoration: "none", display: "inline-flex", alignItems: "center", transition: "opacity 0.2s" }}
                                    onMouseOver={e => e.currentTarget.style.opacity = 0.7}
                                    onMouseOut={e => e.currentTarget.style.opacity = 1}
                                    title="View exact location on Google Maps"
                                  >
                                    🗺️
                                  </a>
                                ) : null}
                              </div>
                              <span style={{ color: "var(--muted)", fontSize: "0.6rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={session.isp}>{session.isp || "Loopback"}</span>
                            </div>
                          </div>

                          <div style={{ color: "var(--muted)" }}>v{session.appVersion || "1.0"}</div>
                          <div style={{ fontFamily: "monospace", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={session.hwid}>{session.hwid ? `${session.hwid.slice(0, 10)}...` : "N/A"}</div>
                          <div style={{ color: "var(--text)" }}>
                            {start.toLocaleDateString([], {month: 'short', day: 'numeric'})} {start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                          <div style={{ color: "var(--text)" }}>
                            {end.toLocaleDateString([], {month: 'short', day: 'numeric'})} {end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                          <div style={{ fontWeight: "700", color: "var(--accent)", textAlign: "right" }}>{durationStr}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", background: "var(--surface2)", display: "flex", justifyContent: "flex-end" }}>
                <Button variant="ghost" onClick={() => setLogsOpen(false)}>Close Logs</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
