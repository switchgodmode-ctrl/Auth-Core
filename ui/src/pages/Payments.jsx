import { useState, useEffect } from "react";
import { createOrder, verifyPayment, refreshToken, fetchPayments, API_BASE } from "../api.js";
import { motion } from "framer-motion";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";

export default function Payments() {
  const [status, setStatus] = useState("");
  const [billing, setBilling] = useState("monthly");
  const [customMonths, setCustomMonths] = useState(3);
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
    let amount = 0;
    if (billing === "monthly") amount = 699;
    else if (billing === "yearly") amount = 2000;
    else amount = customMonths * 500;

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
      name: "AuthCore",
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
      
      <div className="db-page-head">
        <div>
          <h1 className="db-page-title">Billing & Premium</h1>
          <p className="db-page-sub">Upgrade your account to unlock unlimited power and advanced constraints.</p>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <Card glowing>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ fontWeight: 700, fontSize: "1.3rem", color: "var(--text)" }}>Select Plan</div>
            <div style={{ display: "flex", background: "var(--bg)", padding: "4px", borderRadius: "100px", border: "1px solid var(--border)" }}>
              <button 
                style={{ 
                  background: billing === "monthly" ? "var(--surface)" : "transparent",
                  color: billing === "monthly" ? "var(--text)" : "var(--muted)",
                  border: billing === "monthly" ? "1px solid var(--border)" : "1px solid transparent",
                  padding: "6px 16px", borderRadius: "100px", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer"
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
                  padding: "6px 16px", borderRadius: "100px", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer"
                }}
                onClick={() => setBilling("yearly")}
              >
                Yearly
              </button>
              <button 
                style={{ 
                  background: billing === "custom" ? "var(--surface)" : "transparent",
                  color: billing === "custom" ? "var(--text)" : "var(--muted)",
                  border: billing === "custom" ? "1px solid var(--border)" : "1px solid transparent",
                  padding: "6px 16px", borderRadius: "100px", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer"
                }}
                onClick={() => setBilling("custom")}
              >
                Custom
              </button>
            </div>
          </div>

          {status && (
            <div style={{ marginBottom: "24px", padding: "12px 16px", borderRadius: "8px", background: "rgba(99, 102, 241, 0.1)", color: "var(--accent)", border: "1px solid rgba(99, 102, 241, 0.2)", fontSize: "0.9rem", fontWeight: "600" }}>
              {status}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px", alignItems: "start" }}>
            <div style={{ background: "var(--surface2)", padding: "32px", borderRadius: "16px", border: "1px solid var(--accent)", position: "relative" }}>
              <div style={{ position: "absolute", top: -12, right: 24, background: "var(--accent)", color: "#fff", padding: "4px 12px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase" }}>Recommended</div>
              <div style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "8px", color: "var(--text)" }}>
                ₹{billing === "monthly" ? "699" : billing === "yearly" ? "2000" : (customMonths * 500)}
              </div>
              <div style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "24px" }}>
                {billing === "monthly" ? "per month" : billing === "yearly" ? "per year" : `For ${customMonths} Months`}
              </div>

              {billing === "custom" && (
                <div style={{ marginBottom: "24px" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--muted)", display: "block", marginBottom: "12px" }}>SELECT DURATION: {customMonths} MONTHS</label>
                  <input 
                    type="range" min="1" max="60" value={customMonths} 
                    onChange={(e) => setCustomMonths(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "var(--accent)" }}
                  />
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
                <div style={{ color: "var(--text)", fontSize: "0.95rem" }}>✓ Unlimited applications</div>
                <div style={{ color: "var(--text)", fontSize: "0.95rem" }}>✓ Unlimited license issuance</div>
                <div style={{ color: "var(--text)", fontSize: "0.95rem" }}>✓ Priority 24/7 Support</div>
              </div>

              <Button onClick={submit} variant="primary" style={{ width: "100%", height: "54px" }}>
                Activate {billing === "custom" ? "Custom" : "Pro"} Plan
              </Button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ fontSize: "1.2rem", color: "var(--text)", fontWeight: "700" }}>Free vs Pro</h3>
              <div style={{ padding: "20px", background: "var(--bg)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                    <span style={{ color: "var(--muted)" }}>Apps / Keys</span>
                    <span style={{ color: "var(--text)" }}>Unlimited (Pro)</span>
                 </div>
                 <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--muted)" }}>Support</span>
                    <span style={{ color: "var(--text)" }}>Priority (Pro)</span>
                 </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

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
                    <td><span className={`pill ${p.status === 'paid' ? 'pill-green' : 'pill-amber'}`}>{p.status}</span></td>
                    <td>
                      {p.status === 'paid' ? (
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadInvoice(p._id)}>Download PDF</Button>
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
