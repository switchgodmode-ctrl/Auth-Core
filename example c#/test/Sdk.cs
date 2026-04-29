using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace AuthSdk
{
    public static class Sdk
    {
        // 🔹 VERIFY PAYLOAD
        public static object BuildVerifyPayload(int appId, string appVersion, string appSecret, string licenceKey, string hwid, string integrityHash = "none")
        {
            return new
            {
                appId = appId,
                appVersion = appVersion,
                appSecret = appSecret,
                licenceKey = licenceKey,
                hwid = hwid,
                integrityHash = integrityHash
            };
        }

        // 🔹 VERIFY API
        public static async Task<string> Verify(string baseUrl, object payload)
        {
            using (var c = new HttpClient())
            {
                var s = JsonSerializer.Serialize(payload);

                var resp = await c.PostAsync(
                    baseUrl + "/runtime/validate",
                    new StringContent(s, Encoding.UTF8, "application/json")
                );

                return await resp.Content.ReadAsStringAsync();
            }
        }

        // 🔹 HEARTBEAT TIMER (FIXED)
        private static System.Threading.Timer _heartbeatTimer;

        public static void StartHeartbeat(string baseUrl, int appId, string licenceKey, int intervalMs = 10000)
        {
            // Stop previous timer
            if (_heartbeatTimer != null)
            {
                _heartbeatTimer.Dispose();
            }

            _heartbeatTimer = new System.Threading.Timer(async _ =>
            {
                try
                {
                    using (var c = new HttpClient())
                    {
                        var payload = new { appId = appId, licenceKey = licenceKey };
                        var s = JsonSerializer.Serialize(payload);

                        var resp = await c.PostAsync(
                            baseUrl + "/runtime/heartbeat",
                            new StringContent(s, Encoding.UTF8, "application/json")
                        );

                        var respStr = await resp.Content.ReadAsStringAsync();

                        using (JsonDocument doc = JsonDocument.Parse(respStr))
                        {
                            var root = doc.RootElement;

                            if (root.TryGetProperty("status", out JsonElement statusEl) && statusEl.GetBoolean() &&
                                root.TryGetProperty("active", out JsonElement activeEl) && !activeEl.GetBoolean() &&
                                root.TryGetProperty("currentStatus", out JsonElement currentStatusEl) &&
                                currentStatusEl.GetString() == "killed")
                            {
                                ShowKillMessage();
                            }
                        }
                    }
                }
                catch
                {
                    // Ignore errors (network issues etc.)
                }

            }, null, intervalMs, intervalMs);
        }

        // 🔹 SAFE UI MESSAGE (NO CRASH)
        private static void ShowKillMessage()
        {
            try
            {
                if (Application.OpenForms.Count > 0)
                {
                    Form form = Application.OpenForms[0];

                    if (form.InvokeRequired)
                    {
                        form.Invoke((Action)(() =>
                        {
                            MessageBox.Show(
                                "Your connection has been forcefully revoked by the Administrator.",
                                "Security Breach - Key Terminated",
                                MessageBoxButtons.OK,
                                MessageBoxIcon.Error
                            );

                            Environment.Exit(1);
                        }));
                    }
                    else
                    {
                        MessageBox.Show(
                            "Your connection has been forcefully revoked by the Administrator.",
                            "Security Breach - Key Terminated",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Error
                        );

                        Environment.Exit(1);
                    }
                }
                else
                {
                    MessageBox.Show("Session terminated.");
                    Environment.Exit(1);
                }
            }
            catch
            {
                Environment.Exit(1);
            }
        }
    }
}