import { useState } from "react";
import { motion } from "framer-motion";
import { forgotPassword } from "../api.js";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card.jsx";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import "./Auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    const r = await forgotPassword(email);
    if (r.status) {
      setMessage("If the email exists, a reset link was sent.");
    } else {
      setError(r.message || "Request failed");
    }
  }
  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card 
            title="Reset your password" 
            subtitle="Enter your email to receive a reset link"
            glowing={true}
          >
            {error ? <div className="auth-error-msg">{error}</div> : null}
            {message ? <div className="auth-success-msg">{message}</div> : null}

            <form onSubmit={onSubmit} className="auth-form-wrapper">
              <Input 
                label="Email Address"
                placeholder="you@company.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required
              />
              
              <Button type="submit" className="auth-submit-btn" fullWidth variant="primary" size="lg">
                Send Reset Link
              </Button>
            </form>

            <div className="auth-footer">
              <span className="auth-link" onClick={() => navigate("/login")}>← Back to Login</span>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
