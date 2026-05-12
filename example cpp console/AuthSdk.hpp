#pragma once
#include <string>
#include <map>

namespace AuthCore {

    struct AuthResponse {
        bool success;
        std::string message;
        std::string customMessage;
    };

    class Sdk {
    public:
        static std::string GetHwid();
        static std::map<std::string, std::string> GetHardwareSignals();
        static AuthResponse Verify(const std::string& baseUrl, int appId, const std::string& appSecret, const std::string& licenceKey, const std::string& appVersion);
        static void StartHeartbeat(const std::string& baseUrl, int appId, const std::string& licenceKey, int intervalMs = 15000);
    };

}
