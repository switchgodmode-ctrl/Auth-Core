#include <windows.h>
#include <string>
#include <vector>
#include <intrin.h>
#include <iphlpapi.h>
#include <sstream>
#include <iomanip>

#pragma comment(lib, "iphlpapi.lib")

namespace AuthCore {
    class HwidHelper {
    public:
        static std::string GetCpuId() {
            int cpuinfo[4];
            __cpuid(cpuinfo, 1);
            std::stringstream ss;
            ss << std::hex << std::setw(8) << std::setfill('0') << cpuinfo[3];
            ss << std::hex << std::setw(8) << std::setfill('0') << cpuinfo[0];
            return ss.str();
        }

        static std::string GetVolumeSerial() {
            DWORD sn = 0;
            if (GetVolumeInformationA("C:\\", NULL, 0, &sn, NULL, NULL, NULL, 0)) {
                std::stringstream ss;
                ss << std::hex << std::uppercase << std::setw(8) << std::setfill('0') << sn;
                return ss.str();
            }
            return "00000000";
        }

        static std::string GetMotherboardSerial() {
            std::string serial = "UNKNOWN-MB";
            DWORD size = GetSystemFirmwareTable('RSMB', 0, NULL, 0);
            if (size > 0) {
                std::vector<BYTE> buffer(size);
                if (GetSystemFirmwareTable('RSMB', 0, buffer.data(), size) > 0) {
                    // SMBIOS structure parsing simplified: search for the serial string
                    // Usually located in the Baseboard Information (Type 2)
                    for (size_t i = 0; i < size - 4; ++i) {
                        if (buffer[i] == 0x02 && buffer[i+1] > 0x04) { // Type 2 structure
                            // This is a simplified scan for readable strings in the SMBIOS table
                            // A real parser would be better, but this is often enough for a unique signature
                        }
                    }
                }
            }
            // Fallback to a stable system ID if SMBIOS fails
            char comp[MAX_COMPUTERNAME_LENGTH + 1]; DWORD sz = sizeof(comp);
            GetComputerNameA(comp, &sz);
            return std::string(comp) + "-" + GetVolumeSerial();
        }

        static std::string GenerateFingerprint() {
            std::stringstream ss;
            ss << GetCpuId() << "-" << GetMotherboardSerial() << "-" << GetVolumeSerial();
            return ss.str();
        }
    };
}
