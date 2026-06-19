using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace AuthSdk {
  public static class Sdk {
    public static object BuildVerifyPayload(int appId, string appVersion, string appSecret, string licenceKey) {
      return new { 
        appId = appId, 
        appVersion = appVersion, 
        appSecret = appSecret, 
        licenceKey = licenceKey, 
        hwid = Hwid.GetHwid(), 
        signals = Hwid.GetHardwareSignals(),
        integrityHash = "none" 
      };
    }

    public static async Task<string> Verify(string baseUrl, object payload) {
      using var c = new HttpClient();
      var s = JsonSerializer.Serialize(payload);
      var resp = await c.PostAsync($"{baseUrl}/runtime/validate", new StringContent(s, Encoding.UTF8, "application/json"));
      var body = await resp.Content.ReadAsStringAsync();

      // Capture session token from verify response
      using var doc = JsonDocument.Parse(body);
      var root = doc.RootElement;
      if (root.TryGetProperty("sessionToken", out var tokenEl) && tokenEl.ValueKind == JsonValueKind.String)
          _sessionToken = tokenEl.GetString();

      return body;
    }

    private static Timer _heartbeatTimer;
    private static string _sessionToken = null; // Issued by server on valid login

    public static void StartHeartbeat(string baseUrl, int appId, string licenceKey, int intervalMs = 15000) {
      _heartbeatTimer?.Dispose();
      _heartbeatTimer = new Timer(async _ => {
        try {
          using var c = new HttpClient();
          var payload = new { 
            appId = appId, 
            licenceKey = licenceKey,
            hwid = Hwid.GetHwid(),
            sessionToken = _sessionToken  // null for crackers who bypassed login
          };
          var s = JsonSerializer.Serialize(payload);
          var resp = await c.PostAsync($"{baseUrl}/runtime/heartbeat", new StringContent(s, Encoding.UTF8, "application/json"));
          var respStr = await resp.Content.ReadAsStringAsync();
          
          using JsonDocument doc = JsonDocument.Parse(respStr);
          var root = doc.RootElement;

          // Rotate token each beat
          if (root.TryGetProperty("sessionToken", out var newToken) && newToken.ValueKind == JsonValueKind.String)
              _sessionToken = newToken.GetString();
          
          if (root.TryGetProperty("active", out var activeEl) && !activeEl.GetBoolean()) {
              Console.Error.WriteLine("\n[SECURITY] Access revoked by server. Connection forcefully terminated by Administrator.");
              Environment.Exit(1);
          }
        } catch {
          // Ignore network errors to prevent crashing offline clients
        }
      }, null, intervalMs, intervalMs);
    }
  }
}
