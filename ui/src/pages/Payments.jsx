import { useState, useEffect } from "react";
import { createOrder, verifyPayment, refreshToken, fetchPayments, API_BASE } from "../api.js";
import { motion } from "framer-motion";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";

export default function Payments() {
  const [status, setStatus] = useState("");
  const [billing, setBilling] = useState("monthly");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const res = await fetchPayments();
    if (res.status) setHistory(res.info);
  };

  const handleDownloadInvoice = (paymentId) => {
    const token = localStorage.getItem("token");
    window.open(`${API_BASE}/user/download-invoice?paymentId=${paymentId}&token=${token}`, '_blank');
  };

  function loadScript(src) {
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });
  }

  function getUserIdFromToken() {
    try {
      const token = localStorage.getItem("token") || "";
      const payload = token.split(".")[1];
      const json = JSON.parse(atob(payload));
      return json.id;
    } catch {
      return "";
    }
  }

  async function submit() {
    setStatus("Creating order...");
    const uid = String(getUserIdFromToken() || "");
    // price update from here 
    const amount = billing === "monthly" ? 5 : 50;
    const r = await createOrder(Number(uid), amount);
    if (!r?.status) {
      setStatus(r.error || "Failed to create order");
      return;
    }
    setStatus("Order created. Opening checkout...");
    const ok = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!ok) {
      setStatus("Failed to load Razorpay checkout");
      return;
    }
    const options = {
      key: r.keyId,
      amount: r.order.amount,
      currency: r.order.currency,
      name: "NexusPlatform",
      description: "Upgrade to Premium",
      order_id: r.order.id,
      handler: async function (response) {
        try {
          setStatus("Verifying payment...");
          const j = await verifyPayment(response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature);
          if (j.status) {
            setStatus("Welcome to Premium! Your plan is active.");
            const email = localStorage.getItem("email") || "";
            const rt = localStorage.getItem("refreshToken") || "";
            if (email && rt) {
              const rr = await refreshToken(email, rt);
              if (rr.status && rr.token) {
                localStorage.setItem("token", rr.token);
              }
            }
          } else {
            setStatus("Verification failed");
          }
        } catch (err) {
          setStatus("Verification error");
        }
      },
      prefill: {},
      theme: { color: "#6366f1" }
    };
    const rp = new window.Razorpay(options);
    rp.open();
  }

  return (
    <div style={{ maxWidth: "1200px", display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "40px" }}>
      
      {/* Header */}
      <div className="db-page-head">
        <div>
          <h1 className="db-page-title">Billing & Premium</h1>
          <p className="db-page-sub">Upgrade your account to unlock unlimited power and advanced constraints.</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <Card glow>
          {/* Header & Toggle */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ fontWeight: 700, fontSize: "1.3rem", color: "var(--text)" }}>Select Plan</div>
            <div style={{ display: "flex", background: "var(--bg)", padding: "4px", borderRadius: "100px", border: "1px solid var(--border)" }}>
              <button 
                style={{ 
                  background: billing === "monthly" ? "var(--surface)" : "transparent",
                  color: billing === "monthly" ? "var(--text)" : "var(--muted)",
                  border: billing === "monthly" ? "1px solid var(--border)" : "1px solid transparent",
                  boxShadow: billing === "monthly" ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
                  padding: "6px 16px", borderRadius: "100px", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer", transition: "all 0.2s"
                }}
                onClick={() => setBilling("monthly")}
              >
                Monthly
              </button>
              <button 
                style={{ 
                  background: billing === "yearly" ? "var(--surface)" : "transparent",
                  color: billing === "yearly" ? "var(--text)" : "var(--muted)",
                  border: billing === "yearly" ? "1px solid var(--border)" : "1px solid transparent",
                  boxShadow: billing === "yearly" ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
                  padding: "6px 16px", borderRadius: "100px", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer", transition: "all 0.2s",
                  display: "flex", alignItems: "center", gap: "6px"
                }}
                onClick={() => setBilling("yearly")}
              >
                Yearly 
                <span style={{ color: "var(--success, #10b981)", fontSize: "0.7rem", background: "rgba(16,185,129,0.1)", padding: "2px 6px", borderRadius: "100px" }}>Save 20%</span>
              </button>
            </div>
          </div>
          
          {status && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ marginBottom: "24px" }}>
              <div style={{ padding: "12px 16px", borderRadius: "8px", background: "rgba(99, 102, 241, 0.1)", color: "var(--accent)", border: "1px solid rgba(99, 102, 241, 0.2)", fontSize: "0.9rem", fontWeight: "600" }}>
                {status}
              </div>
            </motion.div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "32px", alignItems: "start" }}>
            
            {/* Upgrade Card */}
            <div style={{ background: "var(--surface2)", padding: "32px", borderRadius: "16px", border: "1px solid var(--accent)", position: "relative" }}>
              <div style={{ position: "absolute", top: -12, right: 24, background: "var(--accent)", color: "#fff", padding: "4px 12px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", boxShadow: "0 4px 12px rgba(99,102,241,0.4)" }}>Recommended</div>
              
              <div style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "24px", color: "var(--text)", display: "flex", alignItems: "baseline", gap: "8px" }}>
                {billing === "monthly" ? "₹5" : "₹50"} 
                <span style={{ fontSize: "1rem", color: "var(--muted)", fontWeight: "500" }}>/{billing}</span>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px", fontSize: "0.95rem", color: "var(--text)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ background: "rgba(16,185,129,0.1)", color: "var(--success, #10b981)", width: 24, height: 24, borderRadius: "50%", display: "grid", placeItems: "center" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                  Unlimited applications & modules
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ background: "rgba(16,185,129,0.1)", color: "var(--success, #10b981)", width: 24, height: 24, borderRadius: "50%", display: "grid", placeItems: "center" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                  Unlimited licence issuance
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ background: "rgba(16,185,129,0.1)", color: "var(--success, #10b981)", width: 24, height: 24, borderRadius: "50%", display: "grid", placeItems: "center" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                  Advanced runtime trust engine rules
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ background: "rgba(16,185,129,0.1)", color: "var(--success, #10b981)", width: 24, height: 24, borderRadius: "50%", display: "grid", placeItems: "center" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
                  Enterprise tier priority support
                </div>
              </div>
              <Button onClick={submit} variant="primary" style={{ width: "100%", justifyContent: "center", padding: "14px" }}>Select Pro Plan</Button>
            </div>

            {/* Feature Comparison */}
            <div>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "20px", color: "var(--text)", fontWeight: "700" }}>Free vs Premium</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ padding: "16px", background: "var(--surface2)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>System Limits</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.95rem" }}>
                    <span style={{ color: "var(--text)" }}>Free: <strong style={{ color: "var(--amber, #f59e0b)" }}>1 app, 10 licences</strong></span>
                    <span style={{ color: "var(--text)" }}>Pro: <strong style={{ color: "var(--success, #10b981)" }}>Unlimited</strong></span>
                  </div>
                </div>

                <div style={{ padding: "16px", background: "var(--surface2)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>Validation Engine</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.95rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--muted)" }}>Free</span> <span>Basic Checks</span></div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--accent)" }}>Pro</span> <span style={{ fontWeight: "700", color: "var(--text)" }}>Advanced Threat Intel</span></div>
                  </div>
                </div>

                <div style={{ padding: "16px", background: "var(--surface2)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700" }}>Support Level</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.95rem" }}>
                    <span style={{ color: "var(--text)" }}>Free: <span style={{ color: "var(--muted)" }}>Community</span></span>
                    <span style={{ color: "var(--text)" }}>Pro: <strong style={{ color: "var(--success, #10b981)" }}>Priority SLA</strong></span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </Card>
      </motion.div>

      {/* Transaction History */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card title="Transaction History" subtitle="View and download your past billing invoices.">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Invoice</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>No transactions found.</td></tr>
                )}
                {history.map((p, idx) => (
                  <tr key={idx}>
                    <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td>₹{p.amount / 100}</td>
                    <td>
                      <span className={`pill ${p.status === 'paid' ? 'pill-green' : 'pill-amber'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      {p.status === 'paid' ? (
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadInvoice(p._id)}>
                          Download PDF
                        </Button>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
