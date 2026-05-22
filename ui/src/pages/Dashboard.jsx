import { useEffect, useMemo, useState } from "react";
import { fetchLicences, fetchApplications } from "../api.js";
import { motion, useMotionValue, animate } from "framer-motion";
import "./dashboard.css";

/* ─── CountUp ─────────────────────────────────────────────── */
function CountUp({ to, suffix = "" }) {
  const v = useMotionValue(0);
  const [n, setN] = useState(0);
  useEffect(() => {
    const controls = animate(v, to, { duration: 1, ease: "easeOut" });
    const unsub = v.on("change", latest => setN(Math.round(latest)));
    return () => { unsub(); controls.stop(); };
  }, [to]);
  return <span>{n}{suffix}</span>;
}

/* ─── Sparkline ───────────────────────────────────────────── */
function Sparkline({ data, color, height = 160 }) {
  if (!data.length) return null;
  const W = 600, H = height;
  const max = Math.max(...data.map(([, c]) => c), 1);
  const pts = data.map(([, c], i) => {
    const x = (i / Math.max(1, data.length - 1)) * W;
    const y = H - (c / max) * (H - 20);
    return [x, y];
  });
  const line = pts.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `0,${H} ` + line + ` ${W},${H}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="db-line-svg" preserveAspectRatio="none" style={{ height }}>
      <defs>
        <linearGradient id={`grad-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.45" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#grad-${color.replace("#","")})`} />
      <polyline points={line} className="db-line-path" stroke={color} />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill={color} opacity="0.85" />
      ))}
    </svg>
  );
}

/* ─── Dashboard ────────────────────────────────────────────── */
export default function Dashboard() {
  const [licences, setLicences] = useState([]);
  const [apps, setApps]         = useState([]);
  const [selectedMapLic, setSelectedMapLic] = useState(null);

  const activeSessions = useMemo(() => {
    return licences.filter(l => l.isCurrentlyActive && l.lastSessionLat && l.lastSessionLon);
  }, [licences]);

  const incidents = useMemo(() => {
    return licences.filter(l => l.Status === "ban" && l.trustScore === 0 && l.customMessage);
  }, [licences]);

  const geoStats = useMemo(() => {
    const counts = {};
    const flagMap = {
      US: "🇺🇸", IN: "🇮🇳", DE: "🇩🇪", JP: "🇯🇵", GB: "🇬🇧", FR: "🇫🇷", CA: "🇨🇦",
      AU: "🇦🇺", BR: "🇧🇷", RU: "🇺🇦", CN: "🇨🇳", SG: "🇸🇬", ZA: "🇿🇦", NL: "🇳🇱"
    };
    licences.forEach(l => {
      if (l.lastSessionCountryCode && l.lastSessionCountry) {
        const code = l.lastSessionCountryCode.toUpperCase();
        if (!counts[code]) {
          counts[code] = { 
            country: l.lastSessionCountry, 
            flag: flagMap[code] || "🏳️", 
            count: 0 
          };
        }
        counts[code].count += 1;
      }
    });
    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [licences]);

  const cities = [
    { name: "New York", lat: 40.7128, lon: -74.0060 },
    { name: "London", lat: 51.5074, lon: -0.1278 },
    { name: "Frankfurt", lat: 50.1109, lon: 8.6821 },
    { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
    { name: "Mumbai", lat: 19.0760, lon: 72.8777 },
    { name: "Sydney", lat: -33.8688, lon: 151.2093 },
    { name: "Sao Paulo", lat: -23.5505, lon: -46.6333 },
    { name: "Singapore", lat: 1.3521, lon: 103.8198 },
    { name: "Silicon Valley", lat: 37.7749, lon: -122.4194 }
  ];

  useEffect(() => {
    (async () => {
      const [l, a] = await Promise.all([fetchLicences(), fetchApplications()]);
      if (l.status) setLicences(l.info || []);
      if (a.status) setApps(a.info || []);
    })();
  }, []);

  const online = licences.filter(l => l.Status === "online").length;
  const banned = licences.filter(l => l.Status === "ban").length;

  const months = useMemo(() => {
    const m = new Map();
    apps.forEach(a => {
      const d = new Date(a.createdAt || a.created_at || Date.now());
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      m.set(key, (m.get(key) || 0) + 1);
    });
    return Array.from(m.entries()).sort();
  }, [apps]);

  const activations = useMemo(() => {
    const m = new Map();
    licences.forEach(l => {
      if (!l.activatedAt) return;
      const d = new Date(l.activatedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      m.set(key, (m.get(key) || 0) + 1);
    });
    return Array.from(m.entries()).sort();
  }, [licences]);

  const recentLicences = licences.slice(0, 5);

  const stats = [
    { label: "Total Applications", value: apps.length,     icon: "⬡", cls: "s-purple", icls: "si-purple", sub: "Registered apps" },
    { label: "Total Licences",     value: licences.length, icon: "🔑", cls: "s-cyan",   icls: "si-cyan",   sub: "All issued keys" },
    { label: "Online Now",         value: online,          icon: "✓", cls: "s-green",  icls: "si-green",  sub: <><span className="tag-up">↑ Active</span> sessions</> },
    { label: "Banned",             value: banned,          icon: "⊘", cls: "s-red",    icls: "si-red",    sub: <><span className="tag-down">Revoked</span> licences</> },
  ];

  const wfSteps = [
    { dot: "wf-done",   icon: "✓", title: "Application Created", desc: "Register your app and obtain the App ID." },
    { dot: "wf-done",   icon: "✓", title: "Licences Issued",      desc: "Generate keys with HWID binding and expiry." },
    { dot: "wf-active", icon: "▶", title: "Runtime Validation",   desc: "Continuous trust-score checks in production." },
    { dot: "wf-idle",   icon: "○", title: "Payments & Premium",   desc: "Upgrade to unlock unlimited keys and apps." },
  ];

  const fadeUp = {
    hidden: { opacity: 0, y: 18 },
    show: (i = 0) => ({
      opacity: 1, y: 0,
      transition: { duration: 0.45, delay: i * 0.07, ease: [0.25, 0.1, 0.25, 1] },
    }),
  };

  const barData = (activations.length
    ? activations
    : Array.from({ length: 6 }, (_, i) => [`M${i + 1}`, 0])
  ).slice(-6);
  const barMax = Math.max(1, ...barData.map(([, c]) => c));

  function getLicenceStatus(l) {
    if (l.Status === "ban")    return <span className="pill pill-red">Banned</span>;
    if (l.Status === "online") return <span className="pill pill-green">Online</span>;
    return <span className="pill pill-amber">Offline</span>;
  }

  return (
    <div className="db-content">

      {/* ── Page heading ── */}
      <div className="db-page-head">
        <div>
          <h1 className="db-page-title">Dashboard</h1>
          <p className="db-page-sub">Live snapshot of your environment</p>
        </div>
        <div className="db-topbar-right">
          <div className="db-status-pill">All systems operational</div>
          <button className="db-icon-btn" title="Notifications">🔔</button>
          <button className="db-icon-btn" title="Refresh" onClick={() => window.location.reload()}>↺</button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="db-stats">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            className={`db-stat ${s.cls}`}
            initial="hidden" animate="show" custom={i} variants={fadeUp}
          >
            <div className="db-stat-header">
              <span className="db-stat-label">{s.label}</span>
              <div className={`db-stat-icon ${s.icls}`}>{s.icon}</div>
            </div>
            <div className="db-stat-value"><CountUp to={s.value} /></div>
            <div className="db-stat-sub">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* ── Live Security Map & Traffic Panel ── */}
      <motion.div 
        className="db-panel map-panel animate-fade-in" 
        initial="hidden" 
        animate="show" 
        custom={3} 
        variants={fadeUp}
        style={{ 
          display: "grid", 
          gridTemplateColumns: "1.8fr 1fr", 
          gap: "24px", 
          marginTop: "24px", 
          minHeight: "400px", 
          background: "var(--surface)", 
          border: "1px solid var(--border)", 
          borderRadius: "16px", 
          padding: "24px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
          overflow: "hidden"
        }}
      >
        {/* Left column: SVG Interactive Network Map */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="live-dot" style={{ width: 8, height: 8, background: "#10b981", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 10px #10b981" }} /> Live Telemetry Session Map
            </h3>
            <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: "4px 0 0 0" }}>Interactive global mesh. Active user sessions are plotted live.</p>
          </div>
          
          <div style={{ position: "relative", flex: 1, background: "rgba(0,0,0,0.2)", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden", minHeight: "280px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* World Grid SVG */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.1 }}>
              <defs>
                <pattern id="grid-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="var(--text)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-pattern)" />
            </svg>
            
            <svg viewBox="0 0 1000 500" style={{ width: "100%", height: "100%", zIndex: 1 }}>
              {/* Draw cyber mesh connections */}
              {cities.map((city, idx) => 
                cities.slice(idx + 1).map((target, tIdx) => {
                  const x1 = ((city.lon + 180) / 360) * 1000;
                  const y1 = ((90 - city.lat) / 180) * 500;
                  const x2 = ((target.lon + 180) / 360) * 1000;
                  const y2 = ((90 - target.lat) / 180) * 500;
                  if ((idx + tIdx) % 3 === 0) {
                    return (
                      <line 
                        key={`${idx}-${tIdx}`}
                        x1={x1} y1={y1} x2={x2} y2={y2} 
                        stroke="var(--accent)" 
                        strokeWidth="0.5" 
                        strokeDasharray="4,8"
                        opacity="0.15"
                      />
                    );
                  }
                  return null;
                })
              )}
              
              {/* Draw major anchor cities */}
              {cities.map((city, idx) => {
                const x = ((city.lon + 180) / 360) * 1000;
                const y = ((90 - city.lat) / 180) * 500;
                return (
                  <g key={idx}>
                    <circle cx={x} cy={y} r="3" fill="var(--muted)" opacity="0.3" />
                    <text x={x + 6} y={y + 3} fill="var(--muted)" fontSize="8" fontFamily="monospace" opacity="0.4">{city.name}</text>
                  </g>
                );
              })}

              {/* Plot active licences */}
              {activeSessions.map((lic, idx) => {
                const lat = lic.lastSessionLat || 0;
                const lon = lic.lastSessionLon || 0;
                const x = ((lon + 180) / 360) * 1000;
                const y = ((90 - lat) / 180) * 500;
                const isCompromised = lic.trustScore === 0 || lic.Status === "ban";
                
                return (
                  <g key={idx} style={{ cursor: "pointer" }} onClick={() => setSelectedMapLic(lic)}>
                    <circle cx={x} cy={y} r="16" fill={isCompromised ? "rgba(239,68,68,0.15)" : "rgba(16,185,129,0.15)"} />
                    <circle cx={x} cy={y} r="6" fill={isCompromised ? "var(--error, #ef4444)" : "var(--success, #10b981)"} />
                    <circle cx={x} cy={y} r="2" fill="#fff" />
                    <circle cx={x} cy={y} r="6" fill="none" stroke={isCompromised ? "var(--error, #ef4444)" : "var(--success, #10b981)"} strokeWidth="1">
                      <animate attributeName="r" values="6;20;6" dur="3s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8;0;0.8" dur="3s" repeatCount="indefinite" />
                    </circle>
                  </g>
                );
              })}
            </svg>

            {/* Selected Key Details Overlay */}
            {selectedMapLic && (
              <div style={{ position: "absolute", bottom: "12px", left: "12px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px", width: "calc(100% - 24px)", maxWidth: "300px", zIndex: 10, fontSize: "0.8rem", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontWeight: "700", fontFamily: "monospace", color: "var(--accent)" }}>{String(selectedMapLic.key).slice(0, 14)}...</span>
                  <button onClick={() => setSelectedMapLic(null)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: "0.85rem" }}>✕</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", color: "var(--text)" }}>
                  <div>📍 <strong>Location:</strong> {selectedMapLic.lastSessionCity}, {selectedMapLic.lastSessionCountry}</div>
                  <div>📡 <strong>ISP:</strong> {selectedMapLic.lastSessionIsp}</div>
                  <div>💻 <strong>HWID:</strong> {selectedMapLic.hwid ? "Bound" : "Not Bound"}</div>
                  <div>🛡️ <strong>Score:</strong> <span style={{ color: selectedMapLic.trustScore < 50 ? "var(--error, #ef4444)" : "var(--success, #10b981)", fontWeight: "700" }}>{selectedMapLic.trustScore}</span></div>
                </div>
              </div>
            )}
            
            {activeSessions.length === 0 && (
              <div style={{ position: "absolute", color: "var(--muted)", fontSize: "0.85rem", fontStyle: "italic", textAlign: "center" }}>
                📡 Waiting for incoming telemetry signals...<br/>
                <span style={{ fontSize: "0.75rem", opacity: 0.6 }}>(Try executing a client heartbeat check-in)</span>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Threat Logs & Geo Statistics */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", borderLeft: "1px solid var(--border)", paddingLeft: "24px" }}>
          <div>
            <h4 style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--text)", margin: 0 }}>Active Threats & Incidents</h4>
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: "2px 0 0 0" }}>Real-time impossible travel & sharing anomalies.</p>
          </div>
          
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", maxHeight: "200px", overflowY: "auto" }}>
            {incidents.length > 0 ? (
              incidents.map((inc, i) => (
                <div key={i} style={{ padding: "10px 12px", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", fontSize: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <span style={{ color: "var(--error, #ef4444)", fontWeight: "700" }}>⚠️ INCIDENT RESOLVED</span>
                    <span style={{ fontSize: "0.65rem", color: "var(--muted)" }}>Just now</span>
                  </div>
                  <div style={{ color: "var(--text)", fontFamily: "monospace", fontSize: "0.7rem", marginBottom: "4px" }}>Key: {String(inc.key).slice(0, 14)}...</div>
                  <div style={{ color: "var(--muted)", lineHeight: 1.4 }}>{inc.customMessage}</div>
                </div>
              ))
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed var(--border)", borderRadius: "8px", padding: "20px", textAlign: "center", color: "var(--muted)", fontSize: "0.75rem" }}>
                <div>
                  <div style={{ fontSize: "1.2rem", marginBottom: "4px" }}>🛡️</div>
                  No active threat vectors detected. Infrastructure secure.
                </div>
              </div>
            )}
          </div>

          <div>
            <h4 style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text)", marginBottom: "8px" }}>Top Global Markets</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {geoStats.slice(0, 3).map((stat, idx) => (
                <div key={idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "3px" }}>
                    <span style={{ fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span>{stat.flag}</span> {stat.country}
                    </span>
                    <span style={{ color: "var(--muted)" }}>{stat.count} ({Math.round((stat.count / licences.length) * 100)}%)</span>
                  </div>
                  <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(stat.count / licences.length) * 100}%`, background: "var(--accent)", borderRadius: "2px" }} />
                  </div>
                </div>
              ))}
              {geoStats.length === 0 && <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontStyle: "italic" }}>No location data indexed yet.</div>}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Charts ── */}
      <div className="db-charts">

        {/* Line chart */}
        <motion.div className="db-chart-card" initial="hidden" animate="show" custom={4} variants={fadeUp}>
          <div className="db-chart-header">
            <div>
              <div className="db-chart-title">Applications Created</div>
              <div className="db-chart-sub">Monthly registration trend</div>
            </div>
            <span className="db-chart-badge">By month</span>
          </div>
          <Sparkline
            data={months.length ? months : [[0,0],[1,2],[2,1],[3,3],[4,2],[5,4]]}
            color="#6366f1"
            height={160}
          />
          <div className="db-x-labels">
            {(months.length ? months : [[0,"Jan"],[1,"Feb"],[2,"Mar"],[3,"Apr"],[4,"May"],[5,"Jun"]])
              .map(([k], i) => (
                <span key={i} className="db-x-label">{String(k).split("-")[1] || k}</span>
              ))}
          </div>
        </motion.div>

        {/* Bar chart */}
        <motion.div className="db-chart-card" initial="hidden" animate="show" custom={5} variants={fadeUp}>
          <div className="db-chart-header">
            <div>
              <div className="db-chart-title">Activations</div>
              <div className="db-chart-sub">Last 6 months</div>
            </div>
            <span className="db-chart-badge">By month</span>
          </div>
          <div className="db-bars">
            {barData.map(([k, c], i) => (
              <div key={i} className="db-bar-wrap">
                <motion.div
                  className="db-bar"
                  style={{ height: `${(c / barMax) * 100}%` }}
                  initial={{ scaleY: 0, originY: 1 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: 0.4 + i * 0.06, duration: 0.5, ease: "easeOut" }}
                  title={`${c} activations`}
                />
                <span className="db-bar-label">{String(k).split("-")[1] || k}</span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* ── Bottom row ── */}
      <div className="db-bottom">

        {/* Workflow */}
        <motion.div className="db-panel" initial="hidden" animate="show" custom={6} variants={fadeUp}>
          <div className="db-panel-title">
            Workflow
            <span className="db-see-all">View all →</span>
          </div>
          <div className="db-workflow">
            {wfSteps.map((s, i) => (
              <div key={i} className="db-wf-step">
                <div className={`db-wf-dot ${s.dot}`}>{s.icon}</div>
                <div className="db-wf-info">
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent licences */}
        <motion.div className="db-panel" initial="hidden" animate="show" custom={7} variants={fadeUp}>
          <div className="db-panel-title">
            Recent Licences
            <span className="db-see-all">View all →</span>
          </div>
          {recentLicences.length ? (
            <table className="db-table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Status</th>
                  <th>HWID</th>
                </tr>
              </thead>
              <tbody>
                {recentLicences.map((l, i) => (
                  <tr key={i}>
                    <td>{String(l.key || l.Key || "—").slice(0, 16)}…</td>
                    <td>{getLicenceStatus(l)}</td>
                    <td>{l.hwid ? "Bound" : <span style={{ color: "var(--dim)" }}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="db-empty">
              No licences yet. Create your first application to get started.
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}