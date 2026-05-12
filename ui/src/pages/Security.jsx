import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchBannedSystems, unbanSystem } from "../api.js";
import Button from "../components/ui/Button.jsx";

export default function Security() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState({ msg: "", type: "" });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    const r = await fetchBannedSystems();
    if (r.status) {
        setItems(r.data || []);
    }
    setLoading(false);
  }

  function showStatus(msg, type = "info") {
    setStatus({ msg, type });
    setTimeout(() => setStatus({ msg: "", type: "" }), 4000);
  }

  async function handleUnban(hwid) {
    showStatus("Revoking system ban...", "info");
    const r = await unbanSystem(hwid);
    if (r.status) {
        showStatus("System ban revoked successfully", "success");
        refresh();
    } else {
        showStatus("Failed to revoke system ban", "error");
    }
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter(item => 
        String(item.hwid).toLowerCase().includes(q) || 
        String(item.lastAttemptKey).toLowerCase().includes(q) ||
        (item.decryptedSignals && Object.values(item.decryptedSignals).some(v => String(v).toLowerCase().includes(q)))
    );
  }, [items, query]);

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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text)", letterSpacing: "-0.03em" }}>Security Center</h1>
          <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginTop: "4px" }}>Manage permanent hardware bans and review unauthorized access attempts.</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Button variant="ghost" onClick={refresh} disabled={loading}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
            Refresh Intel
          </Button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "8px 16px", marginBottom: "24px" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "12px" }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input 
          placeholder="Filter by HWID, Key, or hardware details..." 
          value={query} 
          onChange={e => setQuery(e.target.value)}
          style={{ flex: 1, background: "transparent", border: "none", color: "var(--text)", fontSize: "0.95rem", outline: "none", padding: "8px 0" }}
        />
        {query && <div style={{ fontSize: "0.8rem", color: "var(--muted)", background: "var(--surface2)", padding: "4px 8px", borderRadius: "6px" }}>{filtered.length} results</div>}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--border)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
        {/* Table Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 2.5fr 1fr", gap: "16px", padding: "16px 24px", background: "var(--surface2)", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--muted)" }}>
          <div>Hardware ID (Hashed)</div>
          <div>Last Attempt Key</div>
          <div>Decrypted Forensic Details</div>
          <div style={{ textAlign: "right" }}>Protection</div>
        </div>

        {filtered.map((item, i) => (
          <div key={item._id || i} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 2.5fr 1fr", gap: "16px", padding: "20px 24px", background: "var(--surface)", alignItems: "flex-start", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "var(--surface2)"} onMouseOut={e => e.currentTarget.style.background = "var(--surface)"}>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <div style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text)", wordBreak: "break-all" }}>{item.hwid}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>First logged: {new Date(item.createdAt).toLocaleString()}</div>
              {item.isPermanentlyBanned && (
                  <span style={{ width: "fit-content", marginTop: "4px", padding: "2px 8px", background: "rgba(239,68,68,0.1)", color: "#ef4444", fontSize: "0.6rem", fontWeight: "800", borderRadius: "4px", textTransform: "uppercase" }}>Permanently Banned</span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--text)", fontWeight: "600", fontFamily: "monospace" }}>{item.lastAttemptKey || "N/A"}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--muted)" }}>Failed: {item.failedAttempts} times</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {item.decryptedSignals ? Object.entries(item.decryptedSignals).map(([key, val]) => (
                    <div key={key} style={{ background: "var(--surface3)", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                        <div style={{ fontSize: "0.6rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: "700" }}>{key}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text)", fontWeight: "500", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis" }} title={val}>{val || "---"}</div>
                    </div>
                )) : (
                    <div style={{ color: "var(--muted)", fontSize: "0.8rem", fontStyle: "italic" }}>No forensic data available.</div>
                )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button variant="danger" size="sm" onClick={() => handleUnban(item.hwid)} style={{ padding: "8px 16px", fontWeight: "700", fontSize: "0.75rem" }}>
                Revoke Ban
              </Button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "64px 24px", color: "var(--muted)", background: "var(--surface)" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5, marginBottom: "16px" }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            <p style={{ fontSize: "1rem", color: "var(--text)", marginBottom: "4px", fontWeight: "600" }}>No restricted systems found</p>
            <p style={{ fontSize: "0.85rem" }}>Banned systems will automatically appear here after 3 failed login attempts.</p>
          </div>
        )}
        
        {loading && (
          <div style={{ textAlign: "center", padding: "64px 24px", color: "var(--muted)", background: "var(--surface)" }}>
             <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
             <p>Decrypting hardware forensic data...</p>
          </div>
        )}
      </div>

    </div>
  );
}
