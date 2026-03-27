export function buildVerifyPayload(appId, appVersion, appSecret, licenceKey, hwid, integrityHash) {
  return { appId, appVersion, appSecret, licenceKey, hwid, integrityHash };
}

export async function verify(baseUrl, payload) {
  const r = await fetch(`${baseUrl}/runtime/validate`, { 
    method: "POST", 
    headers: { "Content-Type": "application/json" }, 
    body: JSON.stringify(payload) 
  });
  return r.json();
}

let heartbeatInterval = null;

export function startHeartbeat(baseUrl, appId, licenceKey, intervalMs = 10000) {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  
  // Background daemon polling
  heartbeatInterval = setInterval(async () => {
    try {
      const r = await fetch(`${baseUrl}/runtime/heartbeat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId, licenceKey })
      });
      const data = await r.json();
      
      // If administrative kill switch activated
      if (data.status && data.active === false && data.currentStatus === "killed") {
        console.error("\n[SECURITY] Access revoked by server. Connection forcefully terminated by Administrator.");
        process.exit(1);
      }
    } catch (e) {
      // Ignore network ping errors to prevent accidental crashing if offline
    }
  }, intervalMs);
}
