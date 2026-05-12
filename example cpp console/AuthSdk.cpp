#include "AuthSdk.hpp"
#include <windows.h>
#include <winhttp.h>
#include <thread>
#include <chrono>
#include <iostream>
#include <sstream>
#include <vector>
#include <intrin.h>
#include <iphlpapi.h>

#pragma comment(lib, "winhttp.lib")
#pragma comment(lib, "user32.lib")
#pragma comment(lib, "iphlpapi.lib")

namespace AuthCore {

    static std::wstring to_w(const std::string& s) {
        if (s.empty()) return L"";
        int n = MultiByteToWideChar(CP_UTF8, 0, s.c_str(), (int)s.size(), NULL, 0);
        std::wstring w(n, 0);
        MultiByteToWideChar(CP_UTF8, 0, s.c_str(), (int)s.size(), &w[0], n);
        return w;
    }

    static std::string extract_json_value(const std::string& json, const std::string& key) {
        std::string search = "\"" + key + "\":";
        size_t pos = json.find(search);
        if (pos == std::string::npos) return "";
        pos += search.length();
        while (pos < json.length() && (json[pos] == ' ' || json[pos] == ':')) pos++;
        
        if (json[pos] == '"') {
            pos++;
            size_t end = json.find('"', pos);
            if (end == std::string::npos) return "";
            return json.substr(pos, end - pos);
        } else {
            size_t end = json.find_first_of(",}", pos);
            if (end == std::string::npos) return "";
            return json.substr(pos, end - pos);
        }
    }

    static bool http_post(const std::string& url, const std::string& body, std::string& resp) {
        std::wstring wurl = to_w(url);
        URL_COMPONENTS uc{}; uc.dwStructSize = sizeof(uc);
        uc.dwHostNameLength = (DWORD)-1; uc.dwUrlPathLength = (DWORD)-1; uc.dwExtraInfoLength = (DWORD)-1;
        if (!WinHttpCrackUrl(wurl.c_str(), 0, 0, &uc)) return false;

        HINTERNET ses = WinHttpOpen(L"AuthCore/1.2", WINHTTP_ACCESS_TYPE_AUTOMATIC_PROXY, NULL, NULL, 0);
        if (!ses) return false;

        std::wstring host(uc.lpszHostName, uc.dwHostNameLength);
        HINTERNET con = WinHttpConnect(ses, host.c_str(), uc.nPort, 0);
        if (!con) { WinHttpCloseHandle(ses); return false; }

        std::wstring path(uc.lpszUrlPath, uc.dwUrlPathLength);
        if (uc.dwExtraInfoLength > 0) path += std::wstring(uc.lpszExtraInfo, uc.dwExtraInfoLength);

        HINTERNET req = WinHttpOpenRequest(con, L"POST", path.c_str(), NULL, WINHTTP_NO_REFERER, WINHTTP_DEFAULT_ACCEPT_TYPES, (uc.nScheme == INTERNET_SCHEME_HTTPS) ? WINHTTP_FLAG_SECURE : 0);
        if (!req) { WinHttpCloseHandle(con); WinHttpCloseHandle(ses); return false; }

        std::wstring hdr = L"Content-Type: application/json\r\n";
        WinHttpSendRequest(req, hdr.c_str(), (DWORD)-1L, (LPVOID)body.data(), (DWORD)body.size(), (DWORD)body.size(), 0);
        WinHttpReceiveResponse(req, NULL);

        DWORD avail = 0; resp = "";
        while (WinHttpQueryDataAvailable(req, &avail) && avail > 0) {
            std::vector<char> buffer(avail);
            DWORD read = 0;
            WinHttpReadData(req, &buffer[0], avail, &read);
            resp.append(buffer.data(), read);
        }

        WinHttpCloseHandle(req); WinHttpCloseHandle(con); WinHttpCloseHandle(ses);
        return !resp.empty();
    }

    std::map<std::string, std::string> Sdk::GetHardwareSignals() {
        std::map<std::string, std::string> signals;

        // 1. CPU ID
        int cpuinfo[4];
        __cpuid(cpuinfo, 1);
        char cpuBuf[64];
        sprintf(cpuBuf, "%08X%08X", cpuinfo[3], cpuinfo[0]);
        signals["cpuId"] = cpuBuf;

        // 2. Volume Serial
        DWORD sn = 0;
        GetVolumeInformationA("C:\\", NULL, 0, &sn, NULL, NULL, NULL, 0);
        char snBuf[64];
        sprintf(snBuf, "%08X", sn);
        signals["disk"] = snBuf;

        // 3. Computer Name
        char comp[MAX_COMPUTERNAME_LENGTH + 1];
        DWORD sz = sizeof(comp);
        GetComputerNameA(comp, &sz);
        signals["pcName"] = comp;

        // 4. MAC Address
        IP_ADAPTER_INFO adapterInfo[16];
        DWORD dwBufLen = sizeof(adapterInfo);
        if (GetAdaptersInfo(adapterInfo, &dwBufLen) == ERROR_SUCCESS) {
            char macBuf[32];
            sprintf(macBuf, "%02X-%02X-%02X-%02X-%02X-%02X",
                adapterInfo[0].Address[0], adapterInfo[0].Address[1],
                adapterInfo[0].Address[2], adapterInfo[0].Address[3],
                adapterInfo[0].Address[4], adapterInfo[0].Address[5]);
            signals["mac"] = macBuf;
        }

        return signals;
    }

    std::string Sdk::GetHwid() {
        auto signals = GetHardwareSignals();
        // Create a unique fingerprint by combining signals
        return signals["pcName"] + "-" + signals["disk"] + "-" + signals["cpuId"];
    }

    AuthResponse Sdk::Verify(const std::string& baseUrl, int appId, const std::string& appSecret, const std::string& licenceKey, const std::string& appVersion) {
        auto signals = GetHardwareSignals();
        std::string signalsJson = "{";
        for (auto const& [key, val] : signals) {
            signalsJson += "\"" + key + "\":\"" + val + "\",";
        }
        if (signalsJson.length() > 1) signalsJson.pop_back();
        signalsJson += "}";

        std::string payload = "{\"appId\":" + std::to_string(appId) + 
                             ",\"appSecret\":\"" + appSecret + 
                             "\",\"licenceKey\":\"" + licenceKey + 
                             "\",\"hwid\":\"" + GetHwid() + 
                             "\",\"signals\":" + signalsJson +
                             ",\"appVersion\":\"" + appVersion + 
                             "\",\"integrityHash\":\"none\"}";

        std::string resp;
        if (!http_post(baseUrl + "/runtime/validate", payload, resp)) return {false, "Network Error", ""};

        AuthResponse ar;
        ar.success = (extract_json_value(resp, "status") == "true" || extract_json_value(resp, "allowed") == "true");
        ar.message = extract_json_value(resp, "message");
        ar.customMessage = extract_json_value(resp, "customMessage");

        if (ar.success && !ar.customMessage.empty()) {
            MessageBoxA(NULL, ar.customMessage.c_str(), "Admin Broadcast", MB_OK | MB_ICONINFORMATION);
        }

        return ar;
    }

    void Sdk::StartHeartbeat(const std::string& baseUrl, int appId, const std::string& licenceKey, int intervalMs) {
        std::thread([=]() {
            while (true) {
                std::this_thread::sleep_for(std::chrono::milliseconds(intervalMs));
                std::string payload = "{\"appId\":" + std::to_string(appId) + 
                                     ",\"licenceKey\":\"" + licenceKey + 
                                     "\",\"hwid\":\"" + GetHwid() + "\"}";
                std::string resp;
                if (http_post(baseUrl + "/runtime/heartbeat", payload, resp)) {
                    std::string status = extract_json_value(resp, "status");
                    std::string currentStatus = extract_json_value(resp, "currentStatus");
                    if (status == "true" && currentStatus == "killed") {
                        MessageBoxA(NULL, "Session terminated by administrator.", "Security Alert", MB_OK | MB_ICONSTOP);
                        std::exit(0);
                    }
                }
            }
        }).detach();
    }

}
