#pragma once
#include <string>
#include <thread>
#include <chrono>
#include <iostream>
#include <cstdlib>
#include <memory>
#include <mutex>

// Note: In C++, HTTP requests and JSON parsing usually require external libraries (e.g., cpr, nlohmann/json).
// For the sake of this SDK architecture stub, we provide the structural boilerplate for process killers.

namespace authsdk {

  // ── Naive JSON string extractor (no dependencies) ──────────────────────────
  // Extracts the string value of a field from a compact JSON response.
  inline std::string extract_json_string(const std::string& json, const std::string& key) {
      std::string search = "\"" + key + "\":\"";
      auto pos = json.find(search);
      if (pos == std::string::npos) return "";
      pos += search.size();
      auto end = json.find("\"", pos);
      if (end == std::string::npos) return "";
      return json.substr(pos, end - pos);
  }

  // ── Payload builders ───────────────────────────────────────────────────────
  inline std::string build_verify_payload(int app_id, const std::string& app_version, const std::string& app_secret, const std::string& licence_key, const std::string& hwid, const std::string& integrity_hash = "none") {
    std::string json = "{";
    json += "\"appId\":" + std::to_string(app_id) + ",";
    json += "\"appVersion\":\"" + app_version + "\",";
    json += "\"appSecret\":\"" + app_secret + "\",";
    json += "\"licenceKey\":\"" + licence_key + "\",";
    json += "\"hwid\":\"" + hwid + "\",";
    json += "\"integrityHash\":\"" + integrity_hash + "\"";
    json += "}";
    return json;
  }

  // Build heartbeat payload — always includes session token.
  // session_token will be an empty string for crackers who bypassed login locally.
  inline std::string build_heartbeat_payload(int app_id, const std::string& licence_key, const std::string& session_token) {
    std::string json = "{";
    json += "\"appId\":" + std::to_string(app_id) + ",";
    json += "\"licenceKey\":\"" + licence_key + "\",";
    json += "\"sessionToken\":\"" + session_token + "\"";
    json += "}";
    return json;
  }

  // ── Extern declarations — user must implement with preferred HTTP client ───
  // verify()          -> POST /runtime/validate,  returns raw JSON response string
  // fetch_heartbeat() -> POST /runtime/heartbeat with payload, returns raw JSON
  extern std::string verify(const std::string& base_url, const std::string& json_payload);
  extern std::string fetch_heartbeat(const std::string& base_url, const std::string& json_payload);

  // ── Session token helper ──────────────────────────────────────────────────
  // Call this after verify() to extract and store the session token.
  // Store the returned shared_ptr and pass it to start_heartbeat_thread().
  inline std::shared_ptr<std::string> capture_session_token(const std::string& verify_response) {
      auto token = std::make_shared<std::string>(extract_json_string(verify_response, "sessionToken"));
      return token;
  }

  // ── Heartbeat thread ──────────────────────────────────────────────────────
  // session_token: shared_ptr from capture_session_token() — updated each beat.
  // A cracker who patches login never calls verify() -> token stays empty -> killed.
  inline void start_heartbeat_thread(
      const std::string& base_url,
      int app_id,
      const std::string& licence_key,
      std::shared_ptr<std::string> session_token,
      int interval_ms = 10000
  ) {
      std::thread([base_url, app_id, licence_key, session_token, interval_ms]() {
          while (true) {
              std::this_thread::sleep_for(std::chrono::milliseconds(interval_ms));
              try {
                  std::string current_token = *session_token;
                  std::string payload = build_heartbeat_payload(app_id, licence_key, current_token);
                  std::string resp = fetch_heartbeat(base_url, payload);

                  // Rotate session token — server issues a new one each beat
                  std::string new_token = extract_json_string(resp, "sessionToken");
                  if (!new_token.empty()) {
                      *session_token = new_token;
                  }

                  // Kill if active=false or currentStatus=killed.
                  // A cracker with no token -> server returns active:false immediately.
                  if (resp.find("\"active\":false") != std::string::npos ||
                      resp.find("\"currentStatus\":\"killed\"") != std::string::npos) {

                      std::cerr << "\n[SECURITY] Access revoked by server. Connection forcefully terminated by Administrator." << std::endl;
                      std::exit(1);
                  }
              } catch (...) {
                  // Ignore network exceptions
              }
          }
      }).detach();
  }

} // namespace authsdk
