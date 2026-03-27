import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import Card from "../components/ui/Card.jsx";

export default function Support() {
  const [status, setStatus] = useState({ msg: "", type: "" });
  function showStatus(msg, type = "info") {
    setStatus({ msg, type });
    setTimeout(() => setStatus({ msg: "", type: "" }), 4000);
  }

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div style={{ padding: "120px 0 80px", minHeight: "100vh" }}>
      {/* Toast Notification */}
      <AnimatePresence>
        {status.msg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: -20, x: "-50%" }}
            style={{ position: "fixed", top: "24px", left: "50%", zIndex: 1000, padding: "12px 24px", borderRadius: "100px", fontWeight: "600", fontSize: "0.85rem", background: status.type === "error" ? "var(--error, #ef4444)" : status.type === "success" ? "var(--success, #10b981)" : "var(--accent)", color: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}
          >
            {status.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rt-wrap" style={{ textAlign: "center", marginBottom: "64px", maxWidth: "700px" }}>
        <motion.h1 className="rt-h1" initial="hidden" animate="show" variants={fadeUp}>Contact Support</motion.h1>
        <motion.p className="rt-lead" style={{ margin: "0 auto" }} initial="hidden" animate="show" custom={1} variants={fadeUp}>
          Our global support engineers are available 24/7 to help you scale, debug, or upgrade your infrastructure.
        </motion.p>
      </div>

      <div className="rt-wrap" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "start", maxWidth: "1000px" }}>
        
        {/* Contact Form */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <Card title="Send us a message" subtitle="Fill out the form and our team will get back to you within 24 hours." glowing={true}>
            <form onSubmit={(e) => { e.preventDefault(); e.target.reset(); showStatus("Message sent successfully!", "success"); }} style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "24px" }}>
              <Input label="Full Name" placeholder="Jane Doe" required />
              <Input label="Work Email" type="email" placeholder="jane@company.com" required />
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text)" }}>Message</label>
                <textarea 
                  required
                  placeholder="How can we help you today?" 
                  style={{ width: "100%", padding: "14px", borderRadius: "8px", border: "1px solid var(--border)", background: "rgba(0,0,0,0.2)", color: "var(--text)", fontFamily: "var(--font-body)", resize: "vertical", minHeight: "120px", outline: "none" }}
                  onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                />
              </div>
              <Button type="submit" variant="primary" style={{ marginTop: "8px" }}>Send Message</Button>
            </form>
          </Card>
        </motion.div>

        {/* Contact Info */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.3 }} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div style={{ padding: "24px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px" }}>
            <h3 style={{ color: "#fff", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.2rem" }}>🏢</span> Sales Inquiry
            </h3>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: "1.6" }}>
              Looking for a custom plan, volume discount, or enterprise SLA? Our sales engineers are ready to assist.
            </p>
            <div style={{ marginTop: "16px", fontWeight: "600", color: "var(--accent)" }}>sales@nexus.cloud</div>
          </div>

          <div style={{ padding: "24px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px" }}>
            <h3 style={{ color: "#fff", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.2rem" }}>🚨</span> Technical Support
            </h3>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: "1.6" }}>
              Need help integrating the API or debugging an issue? Make sure to include your App ID in the email.
            </p>
            <div style={{ marginTop: "16px", fontWeight: "600", color: "var(--accent)" }}>support@nexus.cloud</div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
