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
  const [isCapacitor, setIsCapacitor] = useState(false);
  const navigate = useNavigate();

  // Check URL hash/search for id_token from Google Redirect
  useEffect(() => {
    const isCap = window.Capacitor !== undefined || 
                  window.location.hostname === "localhost" || 
                  window.location.hostname === "127.0.0.1";
    setIsCapacitor(isCap);

    const hash = window.location.hash || window.location.search;
    if (hash && (hash.includes("id_token=") || hash.includes("credential="))) {
      let idToken = "";
      if (hash.includes("id_token=")) {
        const params = new URLSearchParams(hash.startsWith("#") ? hash.substring(1) : hash);
        idToken = params.get("id_token") || "";
      } else if (hash.includes("credential=")) {
        const params = new URLSearchParams(hash.startsWith("#") ? hash.substring(1) : hash);
        idToken = params.get("credential") || "";
      }
      if (idToken) {
        window.history.replaceState(null, "", window.location.pathname);
        handleGoogleLoginWithToken(idToken);
      }
    }
  }, [clientId]);

  const handleGoogleLoginWithToken = async (idToken) => {
    try {
      setLoadingGoogle(true);
      setError("");
      const r = await fetch(`${API_BASE}/user/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });
      const j = await r.json();
      if (j.status && j.token) {
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
  };

  const initializeGoogleButton = () => {
    const g = window.google;
    if (g && g.accounts && g.accounts.id && clientId) {
      try {
        g.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (response.credential) {
              handleGoogleLoginWithToken(response.credential);
            }
          },
        });
        const container = document.getElementById("google-login-btn-container");
        if (container) {
          container.innerHTML = ""; // Clear fallback
          g.accounts.id.renderButton(container, {
            theme: "outline",
            size: "large",
            width: container.clientWidth || 320,
          });
        }
      } catch (e) {
        console.error("Google init error:", e);
      }
    }
  };

  const handleCustomGoogleLogin = () => {
    if (!clientId) {
      setError("Retrieving secure Google credentials... Please wait.");
      return;
    }
    const redirectUri = window.location.origin + window.location.pathname;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=id_token&scope=openid%20profile%20email&nonce=authcorenonce_${Date.now()}`;
    window.location.href = googleAuthUrl;
  };

  useEffect(() => {
    // Silently retrieve the client ID from backend
    fetch(`${API_BASE}/user/google-client`)
      .then((r) => r.json())
      .then((j) => {
        if (j.status) setClientId(j.clientId || "");
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (clientId && !isCapacitor) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeGoogleButton();
      };
      document.body.appendChild(script);

      const interval = setInterval(() => {
        if (window.google) {
          initializeGoogleButton();
          clearInterval(interval);
        }
      }, 500);

      return () => {
        clearInterval(interval);
        try {
          document.body.removeChild(script);
        } catch (e) {}
      };
    }
  }, [clientId, isCapacitor]);

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

            <div className="auth-social-row" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              {isCapacitor ? (
                <button 
                  type="button"
                  className="auth-social-btn" 
                  onClick={handleCustomGoogleLogin} 
                  disabled={loadingGoogle} 
                  aria-label="Login with Google"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
                    <path fill="#EA4335" d="M12 5.04c1.7 0 3.2.6 4.4 1.8l3.3-3.3C17.7 1.6 15 1 12 1 7.2 1 3.2 3.7 1.3 7.8l3.9 3C6.1 7.7 8.8 5.04 12 5.04z" />
                    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.7z" />
                    <path fill="#FBBC05" d="M5.2 14.8c-.3-.8-.4-1.7-.4-2.8s.1-2 .4-2.8l-3.9-3C.5 7.8 0 9.8 0 12s.5 4.2 1.3 5.8l3.9-3z" />
                    <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-2.9l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.9-2.7-6.8-5.8l-3.9 3c1.9 4.1 5.9 6.8 10.8 6.8z" />
                  </svg>
                  {loadingGoogle ? "Authenticating..." : "Sign in with Google"}
                </button>
              ) : (
                <div id="google-login-btn-container" style={{ width: '100%', minHeight: '44px', display: 'flex', justifyContent: 'center' }}></div>
              )}
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
