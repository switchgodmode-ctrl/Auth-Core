using System;
using System.Security.Cryptography;
using System.Text;
using System.Management;

namespace AuthCore.ConsoleExample
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
                        return val == null ? "" : val.ToString();
                    }
                }
            }
            catch { }
            return "unknown";
        }

        public static string GetHwid()
        {
            var sys = GetWmiProperty("SELECT UUID FROM Win32_ComputerSystemProduct", "UUID");
            var mb = GetWmiProperty("SELECT SerialNumber FROM Win32_BaseBoard", "SerialNumber");
            var baseStr = sys + "|" + mb;
            
            using (var sha = SHA256.Create())
            {
                var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(baseStr));
                return BitConverter.ToString(bytes).Replace("-", "").ToLowerInvariant();
            }
        }
    }
}
