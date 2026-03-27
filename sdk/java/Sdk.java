import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Timer;
import java.util.TimerTask;

public class Sdk {
  public static String buildVerifyPayload(int appId, String appVersion, String appSecret, String licenceKey, String hwid, String integrityHash) {
    return "{\"appId\":" + appId + ",\"appVersion\":\"" + appVersion + "\",\"appSecret\":\"" + appSecret + "\",\"licenceKey\":\"" + licenceKey + "\",\"hwid\":\"" + hwid + "\",\"integrityHash\":\"" + (integrityHash != null && !integrityHash.isEmpty() ? integrityHash : "none") + "\"}";
  }

  public static String verify(String baseUrl, String json) throws Exception {
    HttpClient c = HttpClient.newHttpClient();
    HttpRequest r = HttpRequest.newBuilder(URI.create(baseUrl + "/runtime/validate"))
      .header("Content-Type", "application/json")
      .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
      .build();
    HttpResponse<String> resp = c.send(r, HttpResponse.BodyHandlers.ofString());
    return resp.body();
  }

  private static Timer heartbeatTimer;

  public static void startHeartbeat(String baseUrl, int appId, String licenceKey, long intervalMs) {
    if (heartbeatTimer != null) {
        heartbeatTimer.cancel();
    }
    heartbeatTimer = new Timer(true); // Daemon thread
    
    heartbeatTimer.scheduleAtFixedRate(new TimerTask() {
        @Override
        public void run() {
            try {
                String payload = "{\"appId\":" + appId + ",\"licenceKey\":\"" + licenceKey + "\"}";
                HttpClient c = HttpClient.newHttpClient();
                HttpRequest r = HttpRequest.newBuilder(URI.create(baseUrl + "/runtime/heartbeat"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                    .build();
                HttpResponse<String> resp = c.send(r, HttpResponse.BodyHandlers.ofString());
                String body = resp.body();
                
                // Simple string checking to avoid external JSON dependencies in standard SDK
                if (body.contains("\"status\":true") && body.contains("\"active\":false") && body.contains("\"currentStatus\":\"killed\"")) {
                    System.err.println("\n[SECURITY] Access revoked by server. Connection forcefully terminated by Administrator.");
                    System.exit(1);
                }
            } catch (Exception e) {
                // Ignore network errors
            }
        }
    }, intervalMs, intervalMs);
  }
}
