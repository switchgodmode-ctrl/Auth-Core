#include <iostream>
#include <string>
#include <array>
#include <cstdio>
#include <memory>
#include <openssl/sha.h>

std::string run(const std::string& cmd) {
    std::array<char, 256> buffer;
    std::string result;
    std::unique_ptr<FILE, decltype(&pclose)> pipe(popen(cmd.c_str(), "r"), pclose);
    if (!pipe) return "";
    while (fgets(buffer.data(), buffer.size(), pipe.get()) != nullptr) {
        result += buffer.data();
    }
    if (!result.empty() && result.back() == '\n') result.pop_back();
    return result;
}

std::string sha256(const std::string& s) {
    unsigned char hash[SHA256_DIGEST_LENGTH];
    SHA256((const unsigned char*)s.c_str(), s.size(), hash);
    std::string hex;
    static const char* digits = "0123456789abcdef";
    for (int i = 0; i < SHA256_DIGEST_LENGTH; ++i) {
        hex.push_back(digits[(hash[i] >> 4) & 0xF]);
        hex.push_back(digits[hash[i] & 0xF]);
    }
    return hex;
}
std::string buildVerifyPayload(const std::string& appName, const std::string& appSecret, const std::string& licenceKey) {
    std::string sys = run("powershell -NoProfile -Command \"(Get-CimInstance Win32_ComputerSystemProduct).UUID\"");
    std::string mb = run("powershell -NoProfile -Command \"(Get-CimInstance Win32_BaseBoard).SerialNumber\"");
    std::string hwid = sha256(sys + std::string("|") + mb);
    std::string json = std::string("{\"appName\":\"") + appName + "\",\"appSecret\":\"" + appSecret + "\",\"licenceKey\":\"" + licenceKey + "\",\"hwid\":\"" + hwid + "\",\"system_uuid\":\"" + sys + "\",\"motherboard_id\":\"" + mb + "\"}";
    return json;
}
std::string buildRuntimePayload(int appId, const std::string& appSecret, const std::string& licenceKey, const std::string& appVersion, const std::string& integrityHash) {
    std::string sys = run("powershell -NoProfile -Command \"(Get-CimInstance Win32_ComputerSystemProduct).UUID\"");
    std::string mb = run("powershell -NoProfile -Command \"(Get-CimInstance Win32_BaseBoard).SerialNumber\"");
    std::string hwid = sha256(sys + std::string("|") + mb);
    char appIdStr[32];
    snprintf(appIdStr, sizeof(appIdStr), "%d", appId);
    std::string json = std::string("{\"appId\":") + appIdStr + ",\"appSecret\":\"" + appSecret + "\",\"licenceKey\":\"" + licenceKey + "\",\"hwid\":\"" + hwid + "\",\"appVersion\":\"" + appVersion + "\",\"integrityHash\":\"" + integrityHash + "\",\"system_uuid\":\"" + sys + "\",\"motherboard_id\":\"" + mb + "\"}";
    return json;
}

int main() {
    std::string sys = run("powershell -NoProfile -Command \"(Get-CimInstance Win32_ComputerSystemProduct).UUID\"");
    std::string mb = run("powershell -NoProfile -Command \"(Get-CimInstance Win32_BaseBoard).SerialNumber\"");
    std::string base = sys + std::string(\"|\") + mb;
    std::string hwid = sha256(base);
    std::cout << hwid << std::endl;
    return 0;
}
