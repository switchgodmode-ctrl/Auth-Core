import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { register, API_BASE } from "../api.js";
import Card from "../components/ui/Card.jsx";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import "./Auth.css";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState("Free");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [verifyLink, setVerifyLink] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [clientId, setClientId] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setReferredBy(ref);
  }, []);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    fetch(`${API_BASE}/user/google-client`).then(r => r.json()).then(j => {
      if (j.status) setClientId(j.clientId || "");
    }).catch(() => {});
    return () => { document.body.removeChild(script); };
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    const resp = await register(username, email, password, plan, referredBy);
    if (resp.status) {
      setMessage("Registration successful. Please verify your email.");
      if (resp.verifyLink) setVerifyLink(resp.verifyLink);
    } else {
      setError(resp.error || "Registration failed");
    }
  }

  async function signupWithGoogle() {
    try {
      setLoadingGoogle(true);
      if (!clientId) {
        setError("Google client id not configured");
        setLoadingGoogle(false);
        return;
      }
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            const idToken = response.credential;
            const r = await fetch(`${API_BASE}/user/google-login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idToken })
            });
            const j = await r.json();
            if (j.status) {
              localStorage.setItem("token", j.token || "");
              localStorage.setItem("refreshToken", j.refreshToken || "");
              localStorage.setItem("email", j.info?.email || "");
              navigate("/dashboard");
            } else {
              setError(j.error || "Google signup failed");
            }
          } catch {
            setError("Google signup error");
          } finally {
            setLoadingGoogle(false);
          }
        }
      });
      window.google.accounts.id.prompt();
    } catch {
      setError("Google client unavailable");
      setLoadingGoogle(false);
    }
  }

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-container">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card 
            title="Create an Account" 
            subtitle="Join developers who trust NexusPlatform to protect their software."
            glowing={true}
          >
            {error ? <div className="auth-error-msg">{error}</div> : null}
            {message ? <div className="auth-success-msg">{message}</div> : null}

            <form onSubmit={onSubmit} className="auth-form-wrapper">
              <Input 
                label="Full Name"
                placeholder="John Doe" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required
              />
              <Input 
                label="Email Address"
                placeholder="you@company.com" 
                type="email"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required
              />
              <Input 
                label="Password"
                placeholder="••••••••" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required
              />
              
              <Button type="submit" className="auth-submit-btn" fullWidth variant="primary" size="lg">
                Sign Up
              </Button>
            </form>

            <div className="auth-divider">OR</div>

            <div className="auth-social-row">
              <button 
                type="button"
                className="auth-social-btn" 
                onClick={signupWithGoogle} 
                disabled={loadingGoogle} 
                aria-label="Sign up with Google"
              >
                Continue with Google
              </button>
            </div>

            <div className="auth-footer">
              Already have an account? <span className="auth-link" onClick={() => navigate("/login")}>Sign in</span>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
