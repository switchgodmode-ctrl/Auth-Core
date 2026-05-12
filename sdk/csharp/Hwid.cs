using System;
using System.Security.Cryptography;
using System.Text;
using System.Management;
using System.Collections.Generic;

namespace AuthSdk
{
    public static class Hwid
    {
        private static string GetWmiProperty(string query, string prop)
        {
            try
            {
                using (var searcher = new ManagementObjectSearcher(query))
                {
                    foreach (var obj in searcher.Get())
                    {
                        var val = obj[prop];
                        return val == null ? "" : val.ToString().Trim();
                    }
                }
            }
            catch { }
            return "unknown";
        }

        public static Dictionary<string, string> GetHardwareSignals()
        {
            return new Dictionary<string, string>
            {
                { "cpuId", GetWmiProperty("SELECT ProcessorId FROM Win32_Processor", "ProcessorId") },
                { "motherboard", GetWmiProperty("SELECT SerialNumber FROM Win32_BaseBoard", "SerialNumber") },
                { "uuid", GetWmiProperty("SELECT UUID FROM Win32_ComputerSystemProduct", "UUID") },
                { "disk", GetWmiProperty("SELECT SerialNumber FROM Win32_PhysicalMedia", "SerialNumber") }
            };
        }

        public static string GetHwid()
        {
            var signals = GetHardwareSignals();
            var baseStr = signals["uuid"] + "|" + signals["motherboard"] + "|" + signals["cpuId"];
            
            using (var sha = SHA256.Create())
            {
                var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(baseStr));
                return BitConverter.ToString(bytes).Replace("-", "").ToLowerInvariant();
            }
        }
    }
}
