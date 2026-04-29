package com.authcore;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import javax.swing.JOptionPane;

public class Sdk {
    private final String baseUrl;
    private final int appId;
    private final String appSecret;
    private final String appVersion;
    private String licenseKey;

    public Sdk(String baseUrl, int appId, String appSecret, String appVersion) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.appId = appId;
        this.appSecret = appSecret;
        this.appVersion = appVersion;
    }

    public static String getHwid() {
        try {
            String compName = System.getenv("COMPUTERNAME");
            if (compName == null) compName = "Unknown";
            
            Process process = Runtime.getRuntime().exec("wmic diskdrive get serialnumber");
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;
            StringBuilder serial = new StringBuilder();
            while ((line = reader.readLine()) != null) {
                if (!line.trim().isEmpty() && !line.contains("SerialNumber")) {
                    serial.append(line.trim());
                    break;
                }
            }
            return compName + "-" + (serial.length() > 0 ? serial.toString() : "0000");
        } catch (Exception e) {
            return "UNKNOWN-HWID";
        }
    }

    private void showMessage(String message, String title, int type) {
        new Thread(() -> JOptionPane.showMessageDialog(null, message, title, type)).start();
    }

    private String post(String endpoint, String json) throws Exception {
        URL url = new URL(baseUrl + endpoint);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);

        try (OutputStream os = conn.getOutputStream()) {
            byte[] input = json.getBytes(StandardCharsets.UTF_8);
            os.write(input, 0, input.length);
        }

        try (BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
            StringBuilder response = new StringBuilder();
            String responseLine;
            while ((responseLine = br.readLine()) != null) {
                response.append(responseLine.trim());
            }
            return response.toString();
        }
    }

    private String extractJson(String json, String key) {
        String search = "\"" + key + "\":";
        int start = json.indexOf(search);
        if (start == -1) return null;
        start += search.length();
        while (json.charAt(start) == ' ' || json.charAt(start) == ':') start++;
        
        if (json.charAt(start) == '"') {
            start++;
            int end = json.indexOf("\"", start);
            return json.substring(start, end);
        } else {
            int end = json.indexOf(",", start);
            if (end == -1) end = json.indexOf("}", start);
            return json.substring(start, end).trim();
        }
    }

    public static class AuthResponse {
        public boolean success;
        public String message;
        public String rawJson;
    }

    public AuthResponse verify(String licenseKey) {
        this.licenseKey = licenseKey;
        AuthResponse res = new AuthResponse();
        try {
            String payload = String.format("{\"appId\":%d,\"appVersion\":\"%s\",\"appSecret\":\"%s\",\"licenceKey\":\"%s\",\"hwid\":\"%s\",\"integrityHash\":\"none\"}", 
                appId, appVersion, appSecret, licenseKey, getHwid());
            
            String response = post("/runtime/validate", payload);
            res.rawJson = response;
            res.success = "true".equals(extractJson(response, "status")) || "true".equals(extractJson(response, "allowed"));
            res.message = extractJson(response, "message");

            String customMsg = extractJson(response, "customMessage");
            if (res.success && customMsg != null && !customMsg.isEmpty()) {
                showMessage(customMsg, "Admin Broadcast", JOptionPane.INFORMATION_MESSAGE);
            }
        } catch (Exception e) {
            res.success = false;
            res.message = "Network Error: " + e.getMessage();
        }
        return res;
    }

    public void startHeartbeat(int intervalMs) {
        ScheduledExecutorService executor = Executors.newSingleThreadScheduledExecutor();
        executor.scheduleAtFixedRate(() -> {
            try {
                String payload = String.format("{\"appId\":%d,\"licenceKey\":\"%s\"}", appId, licenseKey);
                String response = post("/runtime/heartbeat", payload);
                
                String customMsg = extractJson(response, "customMessage");
                if (customMsg != null && !customMsg.isEmpty()) {
                    showMessage(customMsg, "Admin Broadcast", JOptionPane.INFORMATION_MESSAGE);
                }

                if ("true".equals(extractJson(response, "status")) && "killed".equals(extractJson(response, "currentStatus"))) {
                    showMessage("Session terminated by administrator.", "Security Alert", JOptionPane.ERROR_MESSAGE);
                    Thread.sleep(2000);
                    System.exit(0);
                }
            } catch (Exception ignored) {}
        }, intervalMs, intervalMs, TimeUnit.MILLISECONDS);
    }
}
