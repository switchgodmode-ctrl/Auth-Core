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
        private static string _sessionToken = null; // Issued by server on valid login

        public static async Task<string> Verify(string baseUrl, object payload)
        {
            var json = serializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            
            var response = await client.PostAsync(baseUrl + "/runtime/validate", content);
            var body = await response.Content.ReadAsStringAsync();

            // Capture session token — only a real server response includes this
            var dict = serializer.Deserialize<Dictionary<string, object>>(body);
            if (dict != null && dict.ContainsKey("sessionToken") && dict["sessionToken"] != null)
                _sessionToken = dict["sessionToken"].ToString();

            return body;
        }

        public static void StartHeartbeat(string baseUrl, int appId, string licenceKey, int intervalMs = 10000)
        {
            if (_heartbeatTimer != null)
                _heartbeatTimer.Dispose();

            _heartbeatTimer = new Timer(async _ =>
            {
                try
                {
                    var payload = new { appId = appId, licenceKey = licenceKey, sessionToken = _sessionToken };
                    var json = serializer.Serialize(payload);
                    var content = new StringContent(json, Encoding.UTF8, "application/json");

                    var response = await client.PostAsync(baseUrl + "/runtime/heartbeat", content);
                    var respStr = await response.Content.ReadAsStringAsync();

                    var dict = serializer.Deserialize<Dictionary<string, object>>(respStr);
                    
                    if (dict != null)
                    {
                        // Rotate token each beat
                        if (dict.ContainsKey("sessionToken") && dict["sessionToken"] != null)
                            _sessionToken = dict["sessionToken"].ToString();

                        bool active = dict.ContainsKey("active") && Convert.ToBoolean(dict["active"]);
                        string currentStatus = dict.ContainsKey("currentStatus") && dict["currentStatus"] != null ? dict["currentStatus"].ToString() : "";
                        string customMessage = dict.ContainsKey("customMessage") && dict["customMessage"] != null ? dict["customMessage"].ToString() : "";

                        if (!string.IsNullOrEmpty(customMessage))
                        {
                            System.Windows.Forms.MessageBox.Show(customMessage, "Admin Broadcast", System.Windows.Forms.MessageBoxButtons.OK, System.Windows.Forms.MessageBoxIcon.Information);
                        }

                        if (!active || currentStatus == "killed")
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
