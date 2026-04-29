using System;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Collections.Generic;

namespace AuthCore.ConsoleExample
{
    class Program
    {
        private const string baseUrl = "https://auth-core-sz7p.vercel.app";
        private const int appId = 2;
        private const string appVersion = "1.0";
        private const string appSecret = "PxMzYyvs5zzA2f39MaXlMgJfGGY4qftQ";

        static void Main(string[] args)
        {
            MainAsync(args).GetAwaiter().GetResult();
        }

        static async Task MainAsync(string[] args)
        {
            // Force TLS 1.2 for modern secure connections to Vercel
            System.Net.ServicePointManager.SecurityProtocol = (System.Net.SecurityProtocolType)3072;

            Console.Title = "AuthCore Security Console";
            Console.Clear();
            
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine("========================================");
            Console.WriteLine("       AUTHCORE SECURITY CONSOLE        ");
            Console.WriteLine("========================================");
            Console.ResetColor();

            Console.Write("\n[>] Enter Licence Key: ");
            string licenseKey = Console.ReadLine();
            if (licenseKey != null) licenseKey = licenseKey.Trim();

            if (string.IsNullOrEmpty(licenseKey))
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("[!] Error: License key cannot be empty.");
                Console.ResetColor();
                return;
            }

            Console.WriteLine("[*] Authenticating with AuthCore Security Engine...");

            try
            {
                // 1. Generate HWID
                string hwid = Hwid.GetHwid();

                // 2. Build Payload
                var payload = new
                {
                    appId = appId,
                    appVersion = appVersion,
                    appSecret = appSecret,
                    licenceKey = licenseKey,
                    hwid = hwid,
                    integrityHash = "console-app-hash"
                };

                // 3. Verify
                string response = await Sdk.Verify(baseUrl, payload);

                var serializer = new JavaScriptSerializer();
                var dict = serializer.Deserialize<Dictionary<string, object>>(response);

                bool allowed = false;
                string message = "Unknown response from server";

                if (dict != null)
                {
                    if (dict.ContainsKey("allowed"))
                        allowed = Convert.ToBoolean(dict["allowed"]);

                    if (dict.ContainsKey("message"))
                        message = dict["message"] == null ? "" : dict["message"].ToString();
                    else if (dict.ContainsKey("error"))
                        message = dict["error"] == null ? "" : dict["error"].ToString();
                }

                if (allowed)
                {
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine("\n[+] Authentication Successful!");
                    Console.WriteLine(string.Format("[+] Welcome: {0}", message));
                    Console.ResetColor();

                    // Start Heartbeat
                    Sdk.StartHeartbeat(baseUrl, appId, licenseKey, 15000);

                    Console.WriteLine("\n[*] Protected Application is now running...");
                    Console.WriteLine("[*] Press ESC to logout and exit.");

                    while (true)
                    {
                        if (Console.KeyAvailable && Console.ReadKey(true).Key == ConsoleKey.Escape)
                        {
                            Console.WriteLine("\n[-] Logging out...");
                            break;
                        }
                        await Task.Delay(100);
                    }
                }
                else
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("\n[-] Access Denied.");
                    Console.WriteLine(string.Format("[-] Reason: {0}", message));
                    Console.ResetColor();
                }
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine(string.Format("\n[!] Fatal Error: {0}", ex.Message));
                Console.ResetColor();
            }

            Console.WriteLine("\n[#] Application Terminated.");
            await Task.Delay(1500);
        }
    }
}
