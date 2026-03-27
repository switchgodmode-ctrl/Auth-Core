import { useState } from "react";
import { runtimeValidate } from "../api.js";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";

export default function Runtime() {
  const [resp, setResp] = useState(null);
  const [appId, setAppId] = useState("");
  const [appSecret, setAppSecret] = useState("");
  const [licenceKey, setLicenceKey] = useState("");
  const [hwid, setHwid] = useState("SIM-1234");
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [integrityHash, setIntegrityHash] = useState("hash");

  async function submit() {
    const payload = { appId: Number(appId), appSecret, licenceKey, hwid, appVersion, integrityHash };
    setResp({ loading: true });
    try {
      const r = await runtimeValidate(payload);
      setTimeout(() => setResp(r), 400);
    } catch (e) {
      setResp({ error: "Validation execution failed" });
    }
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", paddingBottom: "60px", paddingTop: "24px" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: "var(--text)", letterSpacing: "-0.03em" }}>Runtime Simulation</h1>
          <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginTop: "4px" }}>Isolate payload testing before deploying the client-side module.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "32px", alignItems: "start" }}>
        
        {/* Left Side: Payload Builder */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text)", marginBottom: "4px" }}>Configuration Payload</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Enter the credentials exactly as they would be compiled into the binary.</p>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--text)", marginBottom: "8px" }}>App ID</label>
                <input type="number" placeholder="e.g. 1" value={appId} onChange={e => setAppId(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", outline: "none", fontSize: "0.9rem", transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--text)", marginBottom: "8px" }}>App Secret</label>
                <input type="password" placeholder="sec_..." value={appSecret} onChange={e => setAppSecret(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", outline: "none", fontSize: "0.9rem", transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
              </div>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--text)", marginBottom: "8px" }}>Licence Key</label>
                <input placeholder="XXXX-XXXX-XXXX" value={licenceKey} onChange={e => setLicenceKey(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", outline: "none", fontSize: "0.9rem", transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--text)", marginBottom: "8px" }}>Hardware ID (HWID)</label>
                <input placeholder="SIM-XXXX" value={hwid} onChange={e => setHwid(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", outline: "none", fontSize: "0.9rem", transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
              </div>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--text)", marginBottom: "8px" }}>App Version</label>
                <input placeholder="1.0.0" value={appVersion} onChange={e => setAppVersion(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", outline: "none", fontSize: "0.9rem", transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "600", color: "var(--text)", marginBottom: "8px" }}>Integrity Hash</label>
                <input placeholder="hash" value={integrityHash} onChange={e => setIntegrityHash(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", outline: "none", fontSize: "0.9rem", transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor = "var(--accent)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
              </div>
            </div>

            <Button onClick={submit} variant="primary" style={{ width: "100%", justifyContent: "center", marginTop: "8px" }} disabled={!appId || !appSecret || !licenceKey || !hwid}>
              Execute Pipeline
            </Button>
          </div>
        </div>

        {/* Right Side: Network Output */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text)", marginBottom: "4px" }}>Verification Node</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Live stdout block capturing the edge validation response.</p>
          </div>

          <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", minHeight: "380px", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.3)" }}>
            
            {/* Terminal Top Bar */}
            <div style={{ background: "var(--surface2)", padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--error, #ef4444)" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--amber, #f59e0b)" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--success, #10b981)" }} />
              <span style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--muted)", marginLeft: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>POST /api/v1/runtime/validate</span>
            </div>

            {/* Terminal Content */}
            <div style={{ padding: "24px", flex: 1, color: "var(--text)", overflowX: "auto" }}>
              {resp ? (
                resp.loading ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--accent)", fontFamily: "monospace" }}>
                    <div className="spinner" style={{ width: 16, height: 16, border: "2px solid rgba(99,102,241,0.2)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                    Authenticating payload...
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    
                    {!resp.status && !resp.allowed && resp.message ? (
                      <div style={{ padding: "16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px", color: "var(--error, #ef4444)" }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', marginBottom: '8px' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                          Validation Rejected
                        </div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>{resp.message || resp.error || "Unknown validation error"}</div>
                      </div>
                    ) : (
                      <>
                        {/* Status Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: resp.allowed ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", display: "grid", placeItems: "center", color: resp.allowed ? "var(--success, #10b981)" : "var(--error, #ef4444)" }}>
                            {resp.allowed ? (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            ) : (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text)', letterSpacing: "-0.02em" }}>
                              {resp.allowed ? 'Execution Permitted' : 'Execution Denied'}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: "var(--muted)" }}>
                              The authentication node {resp.allowed ? "authorized" : "rejected"} this instance.
                            </div>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                          {/* Trust Score */}
                          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "16px", borderRadius: "12px" }}>
                            <div style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700", marginBottom: "8px" }}>Trust Score</div>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div style={{ fontSize: "2rem", fontWeight: "800", color: resp.trustScore > 50 ? "var(--success, #10b981)" : resp.trustScore > 20 ? "var(--amber, #f59e0b)" : "var(--error, #ef4444)" }}>
                                {resp.trustScore ?? 0}
                              </div>
                              <div style={{ flex: 1, height: "6px", background: "var(--surface2)", borderRadius: "3px", overflow: "hidden" }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: `${resp.trustScore ?? 0}%` }} transition={{ duration: 1, type: "spring" }} style={{ height: "100%", background: resp.trustScore > 50 ? "var(--success, #10b981)" : resp.trustScore > 20 ? "var(--amber, #f59e0b)" : "var(--error, #ef4444)", borderRadius: "3px" }} />
                              </div>
                            </div>
                          </div>

                          {/* Flags */}
                          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "16px", borderRadius: "12px" }}>
                            <div style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700", marginBottom: "8px" }}>Active Flags</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                              {resp.flags && resp.flags.length > 0 ? resp.flags.map(f => (
                                <span key={f} style={{ padding: "4px 8px", background: "rgba(245, 158, 11, 0.1)", color: "var(--amber, #f59e0b)", fontSize: "0.7rem", borderRadius: "6px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>{f}</span>
                              )) : (
                                <span style={{ color: "var(--muted)", fontSize: "0.8rem", fontStyle: "italic" }}>No active flags</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Entitlements */}
                        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "16px", borderRadius: "12px", fontFamily: "monospace", fontSize: "0.85rem" }}>
                          <div style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700", marginBottom: "8px", fontFamily: "var(--font-body)" }}>Entitlements Profile</div>
                          <div style={{ color: "var(--text)", opacity: 0.8, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                            {Object.keys(resp.featuresAllowed || {}).length === 0 ? "// No restricted feature locks mapped" : JSON.stringify(resp.featuresAllowed, null, 2)}
                          </div>
                        </div>

                        {/* Remote Payload */}
                        {resp.remotePayload && (
                          <div style={{ background: "#0f172a", border: "1px solid var(--accent)", padding: "16px", borderRadius: "12px", fontFamily: "monospace", fontSize: "0.85rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                              <div style={{ fontSize: "0.75rem", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "700", fontFamily: "var(--font-body)" }}>Remote Code Injection</div>
                              <div style={{ padding: "4px 8px", background: "rgba(99,102,241,0.2)", color: "var(--accent)", fontSize: "0.6rem", fontWeight: "700", textTransform: "uppercase", borderRadius: "100px", fontFamily: "var(--font-body)" }}>Secured</div>
                            </div>
                            <div style={{ color: "#a5b4fc", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                              {resp.remotePayload}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )
              ) : (
                <div style={{ color: "var(--muted)", fontStyle: "italic", display: "flex", flexDirection: "column", gap: "8px", fontFamily: "monospace" }}>
                  <div>$ Ready. Awaiting trigger execution.</div>
                  <div style={{ opacity: 0.5 }}>$ ...</div>
                </div>
              )}
            </div>

            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        </div>

      </div>
    </div>
  );
}
