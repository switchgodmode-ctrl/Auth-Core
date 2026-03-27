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