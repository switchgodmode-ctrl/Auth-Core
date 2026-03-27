#pragma once
#include <string>
#include <thread>
#include <chrono>
#include <iostream>
#include <cstdlib>

// Note: In C++, HTTP requests and JSON parsing usually require external libraries (e.g., cpr, nlohmann/json).
// For the sake of this SDK architecture stub, we provide the structural boilerplate for process killers.

namespace authsdk {
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

  // User must link to their preferred HTTP client library
  extern std::string verify(const std::string& base_url, const std::string& json_payload);
  extern std::string fetch_heartbeat(const std::string& base_url, int app_id, const std::string& licence_key);

  inline void start_heartbeat_thread(const std::string& base_url, int app_id, const std::string& licence_key, int interval_ms = 10000) {
      std::thread([base_url, app_id, licence_key, interval_ms]() {
          while (true) {
              std::this_thread::sleep_for(std::chrono::milliseconds(interval_ms));
              try {
                  std::string resp = fetch_heartbeat(base_url, app_id, licence_key);
                  
                  // Naive substring checking structure
                  if (resp.find("\"status\":true") != std::string::npos && 
                      resp.find("\"active\":false") != std::string::npos && 
                      resp.find("\"currentStatus\":\"killed\"") != std::string::npos) {
                      
                      std::cerr << "\n[SECURITY] Access revoked by server. Connection forcefully terminated by Administrator." << std::endl;
                      std::exit(1);
                  }
              } catch (...) {
                  // Ignore Exceptions
              }
          }
      }).detach();
  }
}
