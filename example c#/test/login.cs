using AuthSdk;
using RuntimeTrust.SDK;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace test
{
    public partial class login : Form
    {
        // 🔹 CONFIG
        private const string baseUrl = "https://auth-core-bk.vercel.app";
        private const int appId = 2;
        private const string appVersion = "1.0";
        private const string appSecret = "JrMFkKIRTwCQHk8pe0stCkbFHpIXl0Tt";

        public login()
        {
            InitializeComponent();
        }

        private void login_Load(object sender, EventArgs e)
        {
        }

        private void licence_key_TextChanged(object sender, EventArgs e)
        {
        }

        // 🔥 LOGIN BUTTON
        private async void login_button_Click(object sender, EventArgs e)
        {
            login_button.Enabled = false;

            try
            {
                string licenseKey = licence_key.Text.Trim();

                if (string.IsNullOrEmpty(licenseKey))
                {
                    MessageBox.Show("Please enter licence key");
                    login_button.Enabled = true;
                    return;
                }

                // 1. Generate local Hardware ID locking credentials
                var comp = Hwid.GetComposite();

                // 2. Build the exact payload schema our backend Runtime expects
                var payload = Sdk.BuildVerifyPayload(
                    appId,
                    appVersion,
                    appSecret,
                    licenseKey,
                    comp.hwid,
                    "dev-hash-override"
                );

                // 3. Fire request to POST /runtime/validate
                string response = await Sdk.Verify(baseUrl, payload);

                using (var doc = JsonDocument.Parse(response))
                {
                    var root = doc.RootElement;

                    bool allowed = false;
                    string message = "Unknown response from server";

                    // Parse Authentication Node's new schema design
                    if (root.TryGetProperty("allowed", out JsonElement allowedElement))
                    {
                        allowed = allowedElement.GetBoolean();
                    }

                    if (root.TryGetProperty("message", out JsonElement messageElement) && messageElement.ValueKind == JsonValueKind.String)
                    {
                        message = messageElement.GetString();
                    }
                    else if (root.TryGetProperty("error", out JsonElement errorElement) && errorElement.ValueKind == JsonValueKind.String)
                    {
                        message = errorElement.GetString();
                    }

                    if (allowed)
                    {
                        MessageBox.Show("Login Successful ✅\nSession Authenticated & Secured. Remote Policies active.", "Authentication", MessageBoxButtons.OK, MessageBoxIcon.Information);

                        // 🔥 START THE BACKGROUND HEARTBEAT POLLING FOR KILL SWITCH
                        Sdk.StartHeartbeat(baseUrl, appId, licenseKey, 10000);

                        main mainForm = new main();
                        mainForm.Show();
                        this.Hide();
                    }
                    else
                    {
                        MessageBox.Show($"Server Rejected Auth.\n\nRaw Response:\n{response}", "Access Denied", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show("Authentication Exception:\n" + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }

            login_button.Enabled = true;
        }

    }
}
