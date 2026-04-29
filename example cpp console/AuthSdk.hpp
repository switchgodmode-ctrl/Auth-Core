#pragma once
#include <string>
#include <vector>

namespace AuthCore {

    struct AuthResponse {
        bool success;
        std::string message;
        std::string customMessage;
    };

    class Sdk {
    public:
        static AuthResponse Verify(const std::string& baseUrl, int appId, const std::string& appSecret, const std::string& licenceKey, const std::string& appVersion);
        static void StartHeartbeat(const std::string& baseUrl, int appId, const std::string& licenceKey, int intervalMs = 15000);
        static std::string GetHwid();
    };

}
