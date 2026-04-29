using System;
using System.Net.Http;
using System.Text;
using System.Web.Script.Serialization;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace AuthCore.ConsoleExample
{
    public static class Sdk
    {
        private static readonly HttpClient client = new HttpClient();
        private static Timer _heartbeatTimer;
        private static readonly JavaScriptSerializer serializer = new JavaScriptSerializer();

        public static async Task<string> Verify(string baseUrl, object payload)
        {
            var json = serializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            
            var response = await client.PostAsync(baseUrl + "/runtime/validate", content);
            return await response.Content.ReadAsStringAsync();
        }

        public static void StartHeartbeat(string baseUrl, int appId, string licenceKey, int intervalMs = 10000)
        {
            if (_heartbeatTimer != null)
                _heartbeatTimer.Dispose();

            _heartbeatTimer = new Timer(async _ =>
            {
                try
                {
                    var payload = new { appId = appId, licenceKey = licenceKey };
                    var json = serializer.Serialize(payload);
                    var content = new StringContent(json, Encoding.UTF8, "application/json");

                    var response = await client.PostAsync(baseUrl + "/runtime/heartbeat", content);
                    var respStr = await response.Content.ReadAsStringAsync();

                    var dict = serializer.Deserialize<Dictionary<string, object>>(respStr);
                    
                    if (dict != null)
                    {
                        bool status = dict.ContainsKey("status") && Convert.ToBoolean(dict["status"]);
                        bool active = dict.ContainsKey("active") && Convert.ToBoolean(dict["active"]);
                        string currentStatus = dict.ContainsKey("currentStatus") && dict["currentStatus"] != null ? dict["currentStatus"].ToString() : "";
                        string customMessage = dict.ContainsKey("customMessage") && dict["customMessage"] != null ? dict["customMessage"].ToString() : "";

                        if (!string.IsNullOrEmpty(customMessage))
                        {
                            Console.ForegroundColor = ConsoleColor.Yellow;
                            Console.WriteLine(string.Format("\n[ADMIN MESSAGE] {0}", customMessage));
                            Console.ResetColor();
                        }

                        if (status && !active && currentStatus == "killed")
                        {
                            Console.Clear();
                            Console.ForegroundColor = ConsoleColor.Red;
                            Console.WriteLine("\n[SECURITY] Session terminated by administrator.");
                            Console.ResetColor();
                            Environment.Exit(1);
                        }
                    }
                }
                catch { /* Silent network fail */ }
            }, null, intervalMs, intervalMs);
        }
    }
}
