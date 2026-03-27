import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Notifications() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(3);
  const ref = useRef(null);

  useEffect(() => {
    function clickOut(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", clickOut);
    return () => document.removeEventListener("mousedown", clickOut);
  }, []);

  const alerts = [
    { id: 1, type: "alert", text: "Suspicious login attempt blocked from JP.", time: "10 min ago" },
    { id: 2, type: "info", text: "New API Key generated for 'Production App'.", time: "2 hours ago" },
    { id: 3, type: "success", text: "Deployment successful. v2.1.0 is live.", time: "1 day ago" },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button 
        onClick={() => { setOpen(!open); setUnread(0); }}
        style={{
          background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", 
          width: 34, height: 34, borderRadius: "8px", cursor: "pointer", display: "grid", placeItems: "center",
          position: "relative"
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unread > 0 && (
          <div style={{ position: "absolute", top: -4, right: -4, width: 14, height: 14, borderRadius: "50%", background: "var(--danger)", border: "2px solid var(--bg)", fontSize: "0.55rem", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
            {unread}
          </div>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute", top: "calc(100% + 12px)", right: 0, width: "320px", 
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px",
              boxShadow: "0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)", zIndex: 100,
              overflow: "hidden"
            }}
          >
            <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: "600", fontSize: "0.95rem" }}>Notifications</div>
              <button style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "0.8rem", cursor: "pointer", fontWeight: "600" }}>Mark all as read</button>
            </div>
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {alerts.map((a, i) => (
                <div key={a.id} style={{ padding: "16px", borderBottom: i === alerts.length - 1 ? "none" : "1px solid var(--border)", display: "flex", gap: "12px", alignItems: "flex-start", transition: "background 0.2s", cursor: "pointer" }} onMouseOver={(e) => e.currentTarget.style.background = "var(--bg2)"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", marginTop: 6, flexShrink: 0, 
                    background: a.type === "alert" ? "var(--danger)" : a.type === "success" ? "var(--success)" : "var(--accent)" 
                  }} />
                  <div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text)", lineHeight: "1.4" }}>{a.text}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "4px" }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
