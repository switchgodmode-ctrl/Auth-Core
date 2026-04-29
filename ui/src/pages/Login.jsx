import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { login, API_BASE } from "../api.js";
import Card from "../components/ui/Card.jsx";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import "./Auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [clientId, setClientId] = useState("");
  const navigate = useNavigate();
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
    const resp = await login(email, password);
    if (resp.status) {
      localStorage.setItem("token", resp.token || "");
      localStorage.setItem("refreshToken", resp.refreshToken || "");
      localStorage.setItem("email", email);
      localStorage.setItem("role", resp.info?.role || "user");
      localStorage.setItem("user", JSON.stringify(resp.info || {}));
      navigate("/dashboard");
    } else {
      setError("Invalid credentials");
    }
  }
  async function loginWithGoogle() {
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
              localStorage.setItem("role", j.info?.role || "user");
              localStorage.setItem("user", JSON.stringify(j.info || {}));
              navigate("/dashboard");
            } else {
              setError(j.error || "Google login failed");
            }
          } catch {
            setError("Google login error");
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
            title="Welcome Back" 
            subtitle="Sign in to your AuthCore dashboard"
            glowing={true}
          >
            {error ? <div className="auth-error-msg">{error}</div> : null}

            <form onSubmit={onSubmit} className="auth-form-wrapper">
              <Input 
                label="Email or Username"
                placeholder="you@company.com" 
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
                Sign In
              </Button>
            </form>

            <div className="auth-divider">OR</div>

            <div className="auth-social-row">
              <button 
                type="button"
                className="auth-social-btn" 
                onClick={loginWithGoogle} 
                disabled={loadingGoogle} 
                aria-label="Login with Google"
              >
                Sign in with Google
              </button>
            </div>

            <div className="auth-footer">
              Don't have an account? <span className="auth-link" onClick={() => navigate("/register")}>Sign up</span>
              <div style={{ marginTop: '12px' }}>
                <span className="auth-link" onClick={() => navigate("/forgot-password")}>Forgot password?</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
