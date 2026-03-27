import { NavLink, useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useState } from "react";
import { createOrder, verifyPayment, refreshToken } from "../api.js";
import LandingScene from "../three/LandingScene.jsx";
import "./Landing.css";

/* ─── Feature data ─────────────────────────────────────────── */
const features = [
  { icon: "🛡️", cls: "icon-purple", title: "Advanced Security", desc: "Protect your application with continuous integrity checks and fraud prevention." },
  { icon: "⚡", cls: "icon-cyan",   title: "Lightning Fast", desc: "Global edge network ensures sub-50ms latency for all API requests." },
  { icon: "📈", cls: "icon-amber",  title: "Real-time Analytics", desc: "Monitor usage, detect anomalies, and track core metrics from a single dashboard." },
];

const steps = [
  { num: "01", title: "Register & Create App", desc: "Sign up and configure your first application in the dashboard in minutes." },
  { num: "02", title: "Configure Policies",    desc: "Set up security rules, rate limits, and authentication constraints." },
  { num: "03", title: "Integrate the SDK",     desc: "Drop our lightweight SDK into your project with a single command." },
  { num: "04", title: "Monitor & Scale",       desc: "Scale to millions of requests confidently while monitoring via the dashboard." },
];

const testimonials = [
  { quote: "AuthCore completely transformed our security posture. Integration took less than a day.", author: "Sarah Jenkins", role: "CTO, TechNova" },
  { quote: "The analytics and fraud detection are unmatched. It feels like an unfair advantage.", author: "Marcus Thorne", role: "Lead Engineer, DeltaCore" },
  { quote: "We scaled to 1M+ MAU without a single hiccup. Best infrastructure investment we've made.", author: "Elena Rostova", role: "Founder, ScaleUp SaaS" }
];

const faqs = [
  { q: "How long does integration take?", a: "Most teams are up and running in less than an hour, thanks to our intuitive SDKs and drop-in components." },
  { q: "Is there a free tier?", a: "Yes, our Basic tier is completely free forever and accommodates up to 10,000 monthly requests." },
  { q: "What happens if I exceed my plan limits?", a: "We never hard-cap your traffic. If you exceed limits, we notify you and apply a standard overage rate." },
  { q: "Do you offer enterprise SLAs?", a: "Absolutely. Our Enterprise tier includes a 99.99% uptime SLA and dedicated support channels." }
];

/* ─── Component ────────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate();
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const springCfg = { stiffness: 60, damping: 20 };
  const smx = useSpring(mx, springCfg);
  const smy = useSpring(my, springCfg);
  const tx2 = useTransform(smx, [0, 1], [20, -20]);
  const ty1 = useTransform(smy, [0, 1], [-24, 24]);

  const [openFaq, setOpenFaq] = useState(null);

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
      return JSON.parse(atob(payload)).id;
    } catch { return ""; }
  }

  async function startCheckout() {
    const email = localStorage.getItem("email") || "";
    const token = localStorage.getItem("token") || "";
    if (!email || !token) { navigate("/login"); return; }
    const userId = getUserIdFromToken();
    const order = await createOrder(Number(userId), 1000);
    if (!order?.status) { alert(order?.error || "Failed to create order"); return; }
    const ok = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!ok) { alert("Failed to load Razorpay"); return; }
    new window.Razorpay({
      key: order.keyId, amount: order.order.amount, currency: order.order.currency,
      name: "AuthCore", description: "Upgrade to Pro",
      order_id: order.order.id,
      handler: async (response) => {
        const r = await verifyPayment(response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature);
        if (r?.status) {
          const rt = localStorage.getItem("refreshToken") || "";
          if (email && rt) {
            const rr = await refreshToken(email, rt);
            if (rr?.status && rr.token) localStorage.setItem("token", rr.token);
          }
          navigate("/dashboard");
        } else { alert("Payment verification failed"); }
      },
      theme: { color: "#6366f1" }
    }).open();
  }

  const fadeUp = {
    hidden: { opacity: 0, y: 28 },
    show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.1, ease: [0.25, 0.1, 0.25, 1] } }),
  };

  return (
    <>
      <div className="rt-noise" aria-hidden="true" />

      {/* ── Hero ── */}
      <section
        className="rt-hero"
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          mx.set((e.clientX - r.left) / r.width);
          my.set((e.clientY - r.top) / r.height);
        }}
      >
        <div className="rt-hero-grid-lines" aria-hidden="true" />
        <div className="rt-wrap rt-hero-inner">
          {/* Left */}
          <div>
            <motion.div
              className="rt-eyebrow"
              initial="hidden" animate="show" custom={0} variants={fadeUp}
            >
              Enterprise Infrastructure & Security
            </motion.div>

            <motion.h1
              className="rt-h1"
              initial="hidden" animate="show" custom={1} variants={fadeUp}
            >
              Scale with Confidence.<br />
              <em>Build without Limits.</em>
            </motion.h1>

            <motion.p
              className="rt-hero-sub"
              initial="hidden" animate="show" custom={2} variants={fadeUp}
            >
              The complete toolkit for modern SaaS companies. Security, analytics, and infrastructure unified in a single developer-first platform.
            </motion.p>

            <motion.div
              className="rt-hero-ctas"
              initial="hidden" animate="show" custom={3} variants={fadeUp}
            >
              <NavLink className="btn-primary" to="/register">
                Start for Free →
              </NavLink>
              <a className="btn-ghost" onClick={startCheckout} style={{ cursor: "pointer" }}>
                Try Pro — ₹1000/yr
              </a>
            </motion.div>

            <motion.div
              className="rt-hero-stats"
              initial="hidden" animate="show" custom={4} variants={fadeUp}
            >
              {[
                { val: "1B+", label: "Requests per day" },
                { val: "99.99%", label: "Uptime SLA" },
                { val: "<20ms", label: "Global Latency" },
              ].map(s => (
                <div key={s.label}>
                  <div className="rt-stat-val">{s.val}</div>
                  <div className="rt-stat-label">{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right – 3D visual */}
          <motion.div
            className="rt-hero-visual"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ x: tx2, y: ty1 }}
          >
            <div className="rt-visual-ring r3" />
            <div className="rt-visual-ring r2" />
            <div className="rt-visual-ring r1" />
            <div className="rt-three-wrap"><LandingScene /></div>
          </motion.div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="rt-section">
        <div className="rt-wrap">
          <motion.div
            className="rt-section-label"
            initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}
          >
            Core capabilities
          </motion.div>
          <motion.h2
            className="rt-h2"
            initial="hidden" whileInView="show" custom={1} viewport={{ once: true }} variants={fadeUp}
          >
            Everything you need to ship<br />production-ready features.
          </motion.h2>
          <motion.p
            className="rt-lead"
            initial="hidden" whileInView="show" custom={2} viewport={{ once: true }} variants={fadeUp}
          >
            Security, authentication, and core business logic — all unified in a single platform, eliminating the need to stitch together multiple vendors.
          </motion.p>

          <div className="rt-features">
            {features.map((f, i) => (
              <motion.div
                key={f.title} className="rt-feature"
                initial="hidden" whileInView="show" custom={i * 0.5} viewport={{ once: true }} variants={fadeUp}
              >
                <div className={`rt-feature-icon ${f.cls}`}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="rt-section" style={{ background: "linear-gradient(180deg, transparent, rgba(99,102,241,0.04) 50%, transparent)" }}>
        <div className="rt-wrap">
          <motion.div className="rt-section-label" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            Workflow
          </motion.div>
          <motion.h2 className="rt-h2" initial="hidden" whileInView="show" custom={1} viewport={{ once: true }} variants={fadeUp}>
            Up and running in minutes.
          </motion.h2>
          <motion.p className="rt-lead" initial="hidden" whileInView="show" custom={2} viewport={{ once: true }} variants={fadeUp}>
            Integrate our lightweight API into your existing stack with zero friction.
          </motion.p>

          <div className="rt-steps">
            {steps.map((s, i) => (
              <motion.div
                key={s.num} className="rt-step"
                initial="hidden" whileInView="show" custom={i * 0.5} viewport={{ once: true }} variants={fadeUp}
              >
                <div className="rt-step-num">{s.num}</div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="rt-section pricing-bg" id="pricing">
        <div className="rt-wrap">
          <motion.div className="rt-section-label" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            Pricing
          </motion.div>
          <motion.h2 className="rt-h2" initial="hidden" whileInView="show" custom={1} viewport={{ once: true }} variants={fadeUp}>
            Simple, transparent pricing.
          </motion.h2>
          <motion.p className="rt-lead" initial="hidden" whileInView="show" custom={2} viewport={{ once: true }} variants={fadeUp}>
            Start free and scale as you grow. No hidden fees, no per-seat nonsense.
          </motion.p>

          <div className="rt-pricing">
            {/* Free */}
            <motion.div className="rt-price-card" initial="hidden" whileInView="show" custom={0} viewport={{ once: true }} variants={fadeUp}>
              <div className="rt-price-tier">Basic</div>
              <div className="rt-price-amount">Free</div>
              <div className="rt-price-cycle">Forever free</div>
              <div className="rt-price-divider" />
              <ul className="rt-price-features">
                <li>10,000 requests / month</li>
                <li>Core API access</li>
                <li>Community support</li>
                <li>1 application</li>
              </ul>
              <NavLink className="btn-ghost" to="/register" style={{ textAlign: "center", justifyContent: "center" }}>
                Get started free
              </NavLink>
            </motion.div>

            {/* Pro */}
            <motion.div className="rt-price-card featured" initial="hidden" whileInView="show" custom={1} viewport={{ once: true }} variants={fadeUp}>
              <div className="rt-price-badge">Most popular</div>
              <div className="rt-price-tier">Pro</div>
              <div className="rt-price-amount"><sup>₹</sup>1000</div>
              <div className="rt-price-cycle">per year · billed annually</div>
              <div className="rt-price-divider" />
              <ul className="rt-price-features">
                <li>Unlimited requests</li>
                <li>Unlimited applications</li>
                <li>Advanced analytics</li>
                <li>Custom edge rules</li>
                <li>Priority email support</li>
              </ul>
              <a className="btn-primary" onClick={startCheckout} style={{ cursor: "pointer", justifyContent: "center" }}>
                Upgrade to Pro →
              </a>
            </motion.div>

            {/* Enterprise */}
            <motion.div className="rt-price-card" initial="hidden" whileInView="show" custom={2} viewport={{ once: true }} variants={fadeUp}>
              <div className="rt-price-tier">Enterprise</div>
              <div className="rt-price-amount">Custom</div>
              <div className="rt-price-cycle">Contact us for pricing</div>
              <div className="rt-price-divider" />
              <ul className="rt-price-features">
                <li>Everything in Pro</li>
                <li>99.99% Uptime SLA</li>
                <li>Dedicated infrastructure</li>
                <li>SSO & Audit logs</li>
                <li>Dedicated success manager</li>
              </ul>
              <NavLink className="btn-ghost" to="/support" style={{ textAlign: "center", justifyContent: "center" }}>
                Contact Sales
              </NavLink>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="rt-section" style={{ background: "var(--bg2)" }}>
        <div className="rt-wrap">
          <motion.div className="rt-section-label" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
            Customer Success
          </motion.div>
          <motion.h2 className="rt-h2" initial="hidden" whileInView="show" custom={1} viewport={{ once: true }} variants={fadeUp}>
            Trusted by the best teams.
          </motion.h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginTop: "40px" }}>
            {testimonials.map((t, i) => (
              <motion.div key={i} style={{ background: "var(--surface)", padding: "32px", borderRadius: "16px", border: "1px solid var(--border)" }}
                initial="hidden" whileInView="show" custom={i * 0.2} viewport={{ once: true }} variants={fadeUp}
              >
                <div style={{ color: "var(--gold)", marginBottom: "16px", letterSpacing: "2px" }}>★★★★★</div>
                <p style={{ fontSize: "1.05rem", lineHeight: "1.6", color: "var(--text)", marginBottom: "24px", fontStyle: "italic" }}>"{t.quote}"</p>
                <div>
                  <div style={{ fontWeight: "600", color: "#fff" }}>{t.author}</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="rt-section">
        <div className="rt-wrap" style={{ maxWidth: "800px" }}>
          <motion.h2 className="rt-h2" style={{ textAlign: "center", marginBottom: "48px" }} initial="hidden" whileInView="show" custom={1} viewport={{ once: true }} variants={fadeUp}>
            Frequently Asked Questions
          </motion.h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {faqs.map((faq, i) => (
              <motion.div key={i} style={{ border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", background: "var(--surface)" }}
                initial="hidden" whileInView="show" custom={i * 0.1} viewport={{ once: true }} variants={fadeUp}
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: "100%", padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "transparent", border: "none", color: "#fff", cursor: "pointer", textAlign: "left", fontSize: "1.05rem", fontWeight: "600", fontFamily: "var(--font-head)" }}
                >
                  {faq.q}
                  <span style={{ fontSize: "1.2rem", color: "var(--accent)" }}>{openFaq === i ? "−" : "+"}</span>
                </button>
                {openFaq === i && (
                  <div style={{ padding: "0 24px 24px", color: "var(--muted)", lineHeight: "1.6", fontSize: "0.95rem" }}>
                    {faq.a}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Strip ── */}
      <motion.div
        className="rt-cta-strip"
        initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ marginTop: "40px" }}
      >
        <div>
          <h2>Ready to scale your infrastructure?</h2>
          <p>Join developers who trust AuthCore to build and scale production-grade software.</p>
        </div>
        <div className="rt-cta-actions">
          <NavLink className="btn-primary" to="/register">Start for free →</NavLink>
          <NavLink className="btn-ghost" to="/support">Contact Sales</NavLink>
        </div>
      </motion.div>

      {/* ── Footer ── */}
      <footer>
        <div className="rt-wrap rt-footer">
          <div className="rt-footer-logo">AuthCore</div>
          <div className="rt-footer-copy">© {new Date().getFullYear()} AuthCore Inc. All rights reserved.</div>
        </div>
      </footer>
    </>
  );
}