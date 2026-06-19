#pragma once
#include <string>
#include <map>
#include <memory>

namespace AuthCore {

    struct AuthResponse {
        bool success;
        std::string message;
        std::string customMessage;
        std::string sessionToken; // Issued by server on valid login — required for heartbeat
    };

    class Sdk {
    public:
        static std::string GetHwid();
        static std::map<std::string, std::string> GetHardwareSignals();
        static AuthResponse Verify(const std::string& baseUrl, int appId, const std::string& appSecret, const std::string& licenceKey, const std::string& appVersion);
        static void StartHeartbeat(const std::string& baseUrl, int appId, const std::string& licenceKey, std::shared_ptr<std::string> sessionToken, int intervalMs = 15000);
    };

}
