import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { createOrder, verifyPayment } from "../api.js";
import Button from "../components/ui/Button.jsx";
import "./Landing.css"; // Reuse landing styles for generic SaaS feel

export default function Pricing() {
  const navigate = useNavigate();
  
  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1 } }),
  };

  function getUserIdFromToken() {
    try {
      const token = localStorage.getItem("token") || "";
      const payload = token.split(".")[1];
      return JSON.parse(atob(payload)).id;
    } catch { return ""; }
  }

  function loadScript(src) {
    return new Promise((resolve) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });
  }

  async function startCheckout(amount, planName) {
    const email = localStorage.getItem("email") || "";
    const token = localStorage.getItem("token") || "";
    if (!email || !token) { navigate("/login"); return; }
    
    const userId = getUserIdFromToken();
    const order = await createOrder(Number(userId), amount);
    if (!order?.status) { alert(order?.error || "Failed to create order"); return; }
    
    const ok = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!ok) { alert("Failed to load Razorpay"); return; }
    
    new window.Razorpay({
      key: order.keyId, amount: order.order.amount, currency: order.order.currency,
      name: "NexusPlatform", description: `Upgrade to ${planName}`,
      order_id: order.order.id,
      handler: async (response) => {
        const r = await verifyPayment(response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature);
        if (r?.status) {
          navigate("/dashboard");
        } else { alert("Payment verification failed"); }
      },
      theme: { color: "#6366f1" }
    }).open();
  }

  return (
    <div style={{ padding: "120px 0 80px", minHeight: "100vh" }}>
      <div className="rt-wrap" style={{ textAlign: "center", marginBottom: "64px" }}>
        <motion.h1 className="rt-h1" initial="hidden" animate="show" variants={fadeUp}>Simple, transparent pricing</motion.h1>
        <motion.p className="rt-lead" style={{ margin: "0 auto" }} initial="hidden" animate="show" custom={1} variants={fadeUp}>
          No hidden fees. Scale your infrastructure without breaking the bank.
        </motion.p>
      </div>

      <div className="rt-wrap rt-pricing" style={{ marginBottom: "80px" }}>
        {/* Basic */}
        <motion.div className="rt-price-card" initial="hidden" animate="show" custom={2} variants={fadeUp}>
          <div className="rt-price-tier">Basic</div>
          <div className="rt-price-amount">Free</div>
          <div className="rt-price-cycle">Forever free for developers</div>
          <div className="rt-price-divider" />
          <ul className="rt-price-features">
            <li>10,000 API requests / month</li>
            <li>1 application token</li>
            <li>Basic analytics dashboard</li>
            <li>Community support</li>
          </ul>
          <NavLink to="/register" style={{ textDecoration: 'none' }}>
            <Button variant="ghost" className="w-full" style={{ marginTop: 'auto' }}>Start Free</Button>
          </NavLink>
        </motion.div>

        {/* Pro */}
        <motion.div className="rt-price-card featured" initial="hidden" animate="show" custom={3} variants={fadeUp}>
          <div className="rt-price-badge">Most Popular</div>
          <div className="rt-price-tier">Pro</div>
          <div className="rt-price-amount"><sup>₹</sup>1000</div>
          <div className="rt-price-cycle">per year · billed annually</div>
          <div className="rt-price-divider" />
          <ul className="rt-price-features">
            <li>Unlimited API requests</li>
            <li>Unlimited applications</li>
            <li>Custom edge security rules</li>
            <li>Advanced fraud analytics</li>
            <li>Priority email support</li>
          </ul>
          <Button variant="primary" className="w-full" onClick={() => startCheckout(1000, "Pro")} style={{ marginTop: 'auto' }}>Upgrade to Pro</Button>
        </motion.div>

        {/* Enterprise */}
        <motion.div className="rt-price-card" initial="hidden" animate="show" custom={4} variants={fadeUp}>
          <div className="rt-price-tier">Enterprise</div>
          <div className="rt-price-amount">Custom</div>
          <div className="rt-price-cycle">Contact sales for volume pricing</div>
          <div className="rt-price-divider" />
          <ul className="rt-price-features">
            <li>Everything in Pro</li>
            <li>99.99% Uptime SLA</li>
            <li>Dedicated API clusters</li>
            <li>SSO (SAML, OIDC)</li>
            <li>Dedicated account manager</li>
          </ul>
          <NavLink to="/support" style={{ textDecoration: 'none' }}>
            <Button variant="ghost" className="w-full" style={{ marginTop: 'auto' }}>Contact Sales</Button>
          </NavLink>
        </motion.div>
      </div>

      <div className="rt-wrap" style={{ maxWidth: "800px" }}>
        <h3 style={{ fontFamily: "var(--font-head)", fontSize: "1.8rem", textAlign: "center", marginBottom: "32px", color: "#fff" }}>Compute Add-ons</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          <div style={{ background: "var(--surface)", padding: "24px", borderRadius: "12px", border: "1px solid var(--border)" }}>
            <h4 style={{ color: "#fff", marginBottom: "8px" }}>Extra Bandwidth</h4>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "16px" }}>Add 1TB of edge bandwidth to your current plan.</p>
            <div style={{ fontWeight: "700", color: "var(--accent)", fontSize: "1.2rem", marginBottom: "16px" }}>₹500 / mo</div>
            <Button variant="secondary" size="sm">Add to Plan</Button>
          </div>
          <div style={{ background: "var(--surface)", padding: "24px", borderRadius: "12px", border: "1px solid var(--border)" }}>
            <h4 style={{ color: "#fff", marginBottom: "8px" }}>Extended Log Retention</h4>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "16px" }}>Keep detailed security logs for up to 1 year.</p>
            <div style={{ fontWeight: "700", color: "var(--accent)", fontSize: "1.2rem", marginBottom: "16px" }}>₹800 / mo</div>
            <Button variant="secondary" size="sm">Add to Plan</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
