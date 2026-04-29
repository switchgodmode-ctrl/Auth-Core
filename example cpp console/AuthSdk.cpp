#include "AuthSdk.hpp"
#include <windows.h>
#include <winhttp.h>
#include <thread>
#include <chrono>
#include <iostream>
#include <sstream>

#pragma comment(lib, "winhttp.lib")
#pragma comment(lib, "user32.lib")

namespace AuthCore {

    static std::wstring to_w(const std::string& s) {
        if (s.empty()) return L"";
        int n = MultiByteToWideChar(CP_UTF8, 0, s.c_str(), (int)s.size(), NULL, 0);
        std::wstring w(n, 0);
        MultiByteToWideChar(CP_UTF8, 0, s.c_str(), (int)s.size(), &w[0], n);
        return w;
    }

    static std::string from_w(const std::wstring& w) {
        if (w.empty()) return "";
        int n = WideCharToMultiByte(CP_UTF8, 0, w.c_str(), (int)w.size(), NULL, 0, NULL, NULL);
        std::string s(n, 0);
        WideCharToMultiByte(CP_UTF8, 0, w.c_str(), (int)w.size(), &s[0], n, NULL, NULL);
        return s;
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

        HINTERNET ses = WinHttpOpen(L"AuthCore/1.1", WINHTTP_ACCESS_TYPE_AUTOMATIC_PROXY, NULL, NULL, 0);
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
            std::string buffer(avail, 0);
            DWORD read = 0;
            WinHttpReadData(req, &buffer[0], avail, &read);
            resp += buffer;
        }

        WinHttpCloseHandle(req); WinHttpCloseHandle(con); WinHttpCloseHandle(ses);
        return !resp.empty();
    }

    std::string Sdk::GetHwid() {
        char comp[MAX_COMPUTERNAME_LENGTH + 1]; DWORD sz = sizeof(comp);
        GetComputerNameA(comp, &sz);
        DWORD sn = 0; GetVolumeInformationA("C:\\", NULL, 0, &sn, NULL, NULL, NULL, 0);
        char buf[64]; sprintf(buf, "%08X", sn);
        return std::string(comp) + "-" + buf;
    }

    AuthResponse Sdk::Verify(const std::string& baseUrl, int appId, const std::string& appSecret, const std::string& licenceKey, const std::string& appVersion) {
        std::string payload = "{\"appId\":" + std::to_string(appId) + 
                             ",\"appSecret\":\"" + appSecret + 
                             "\",\"licenceKey\":\"" + licenceKey + 
                             "\",\"hwid\":\"" + GetHwid() + 
                             "\",\"appVersion\":\"" + appVersion + 
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
                std::string payload = "{\"appId\":" + std::to_string(appId) + ",\"licenceKey\":\"" + licenceKey + "\"}";
                std::string resp;
                if (http_post(baseUrl + "/runtime/heartbeat", payload, resp)) {
                    std::string status = extract_json_value(resp, "status");
                    std::string currentStatus = extract_json_value(resp, "currentStatus");
                    std::string customMessage = extract_json_value(resp, "customMessage");

                    if (!customMessage.empty()) {
                        MessageBoxA(NULL, customMessage.c_str(), "Admin Broadcast", MB_OK | MB_ICONINFORMATION);
                    }

                    if (status == "true" && currentStatus == "killed") {
                        MessageBoxA(NULL, "Session terminated by administrator.", "Security Alert", MB_OK | MB_ICONSTOP);
                        std::exit(0);
                    }
                }
            }
        }).detach();
    }

}
