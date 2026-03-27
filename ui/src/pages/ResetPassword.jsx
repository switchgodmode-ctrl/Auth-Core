import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { resetPassword } from "../api.js";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../components/ui/Card.jsx";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import "./Auth.css";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    setEmail(p.get("email") || "");
    setToken(p.get("token") || "");
  }, [location.search]);
  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!email || !token) {
      setError("Invalid reset link");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    const r = await resetPassword(email, token, password);
    if (r.status) {
      setMessage("Password reset successful. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } else {
      setError(r.message || "Reset failed");
    }
  }
  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card 
            title="Create new password" 
            subtitle="Please enter your new password below"
            glowing={true}
          >
            {error ? <div className="auth-error-msg">{error}</div> : null}
            {message ? <div className="auth-success-msg">{message}</div> : null}

            <form onSubmit={onSubmit} className="auth-form-wrapper">
              <Input 
                label="Email Box"
                placeholder="Email validation" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required
                disabled
              />
              <Input 
                label="New Password"
                placeholder="••••••••" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required
              />
              <Input 
                label="Confirm Password"
                placeholder="••••••••" 
                type="password" 
                value={confirm} 
                onChange={e => setConfirm(e.target.value)} 
                required
              />
              
              <Button type="submit" className="auth-submit-btn" fullWidth variant="primary" size="lg">
                Reset Password
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
