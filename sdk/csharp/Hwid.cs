using System;
using System.Security.Cryptography;
using System.Text;
using System.Management;
using System.Net.Http;
using System.Threading.Tasks;

namespace RuntimeTrust.SDK
{
    public static class Hwid
    {
        static string Get(string query, string prop)
        {
            try
            {
                using (var searcher = new ManagementObjectSearcher(query))
                {
                    foreach (var obj in searcher.Get())
                    {
                        return obj[prop]?.ToString() ?? "";
                    }
                }
            }
            catch { }
            return "";
        }

        public static (string hwid, string systemUuid, string motherboard) GetComposite()
        {
            var sys = Get("SELECT UUID FROM Win32_ComputerSystemProduct", "UUID");
            var mb = Get("SELECT SerialNumber FROM Win32_BaseBoard", "SerialNumber");
            var baseStr = $"{sys}|{mb}";
            using (var sha = SHA256.Create())
            {
                var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(baseStr));
                var hex = BitConverter.ToString(bytes).Replace("-", "").ToLowerInvariant();
                return (hex, sys, mb);
            }
        }
        public static string BuildVerifyPayload(string appName, string appSecret, string licenceKey)
        {
            var comp = GetComposite();
            var json = $"{{\"appName\":\"{appName}\",\"appSecret\":\"{appSecret}\",\"licenceKey\":\"{licenceKey}\",\"hwid\":\"{comp.hwid}\",\"system_uuid\":\"{comp.systemUuid}\",\"motherboard_id\":\"{comp.motherboard}\"}}";
            return json;
        }
        public static string BuildRuntimePayload(int appId, string appSecret, string licenceKey, string appVersion, string integrityHash)
        {
            var comp = GetComposite();
            var json = $"{{\"appId\":{appId},\"appSecret\":\"{appSecret}\",\"licenceKey\":\"{licenceKey}\",\"hwid\":\"{comp.hwid}\",\"appVersion\":\"{appVersion}\",\"integrityHash\":\"{integrityHash}\",\"system_uuid\":\"{comp.systemUuid}\",\"motherboard_id\":\"{comp.motherboard}\"}}";
            return json;
        }
    }
}
