from sdk import AuthCoreSDK
import time
import os

def main():
    # Style
    os.system('title AuthCore Python Security Console')
    os.system('color 0B')

    print("========================================")
    print("      AUTHCORE PYTHON SECURITY SDK      ")
    print("========================================")

    base_url = "https://auth-core-sz7p.vercel.app"
    app_id = 2
    app_secret = "PxMzYyvs5zzA2f39MaXlMgJfGGY4qftQ"
    app_version = "1.0"

    sdk = AuthCoreSDK(base_url, appId, appSecret, appVersion)

    license_key = input("\n[>] Enter Licence Key: ")
    if not license_key:
        print("[!] Key required.")
        return

    print("[*] Authenticating...")
    res = sdk.verify(license_key)

    if res["success"]:
        print(f"\n[+] Access Granted! Welcome, {res['message']}")
        sdk.start_heartbeat(15000)
        
        print("\n[*] Application is running.")
        print("[*] Admin broadcasts will appear in a MessageBox.")
        print("[*] Press Ctrl+C to exit.")
        
        while True:
            time.sleep(1)
    else:
        print(f"\n[-] Access Denied: {res['message']}")
        time.sleep(3)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[!] Exiting...")
