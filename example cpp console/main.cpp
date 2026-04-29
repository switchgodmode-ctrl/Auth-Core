#include "AuthSdk.hpp"
#include <iostream>
#include <windows.h>

int main() {
    // Styling the console
    system("title AuthCore C++ Security Console");
    system("color 0B");

    std::cout << "========================================" << std::endl;
    std::cout << "       AUTHCORE C++ SECURITY SDK        " << std::endl;
    std::cout << "========================================" << std::endl;

    std::string licenseKey;
    std::cout << "\n[>] Enter Licence Key: ";
    std::getline(std::cin, licenseKey);

    if (licenseKey.empty()) {
        std::cout << "[!] Error: License key cannot be empty." << std::endl;
        Sleep(2000);
        return 1;
    }

    std::cout << "[*] Authenticating..." << std::endl;

    const std::string baseUrl = "https://auth-core-sz7p.vercel.app";
    const int appId = 2;
    const std::string appSecret = "PxMzYyvs5zzA2f39MaXlMgJfGGY4qftQ";
    const std::string appVersion = "1.0";

    auto response = AuthCore::Sdk::Verify(baseUrl, appId, appSecret, licenseKey, appVersion);

    if (response.success) {
        std::cout << "\n[+] Authentication Successful!" << std::endl;
        std::cout << "[+] Welcome: " << response.message << std::endl;

        // Start Heartbeat in background
        AuthCore::Sdk::StartHeartbeat(baseUrl, appId, licenseKey, 15000);

        std::cout << "\n[*] Application is now running..." << std::endl;
        std::cout << "[*] Any admin messages will pop up in a MessageBox." << std::endl;
        std::cout << "[*] Press Ctrl+C to exit." << std::endl;

        // Keep main thread alive
        while (true) {
            Sleep(1000);
        }
    } else {
        std::cout << "\n[-] Access Denied." << std::endl;
        std::cout << "[-] Reason: " << response.message << std::endl;
        Sleep(3000);
    }

    return 0;
}
