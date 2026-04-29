import json
import urllib.request
import threading
import time
import sys
import os
import ctypes

class AuthCoreSDK:
    def __init__(self, base_url, app_id, app_secret, app_version):
        self.base_url = base_url.rstrip('/')
        self.app_id = app_id
        self.app_secret = app_secret
        self.app_version = app_version
        self.license_key = None

    def get_hwid(self):
        # Basic HWID: Computer Name + Volume Serial
        import subprocess
        try:
            comp_name = os.environ.get('COMPUTERNAME', 'Unknown')
            # Get volume serial of C:
            vol_info = subprocess.check_output('vol c:', shell=True).decode()
            serial = vol_info.split()[-1].replace('-', '')
            return f"{comp_name}-{serial}"
        except:
            return "UNKNOWN-HWID"

    def _show_message(self, message, title="Admin Broadcast", icon=0x40):
        # 0x40 = MB_ICONINFORMATION, 0x10 = MB_ICONSTOP
        if sys.platform == "win32":
            threading.Thread(target=lambda: ctypes.windll.user32.MessageBoxA(0, message.encode('utf-8'), title.encode('utf-8'), icon)).start()
        else:
            print(f"\n[BROADCAST] {message}")

    def verify(self, license_key):
        self.license_key = license_key
        payload = {
            "appId": self.app_id,
            "appVersion": self.app_version,
            "appSecret": self.app_secret,
            "licenceKey": license_key,
            "hwid": self.get_hwid(),
            "integrityHash": "none"
        }
        
        try:
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(f"{self.base_url}/runtime/validate", data=data, headers={"Content-Type": "application/json"}, method="POST")
            with urllib.request.urlopen(req, timeout=10) as resp:
                res = json.loads(resp.read().decode("utf-8"))
                
                success = res.get("status") == "true" or res.get("allowed") is True
                custom_msg = res.get("customMessage")
                
                if success and custom_msg:
                    self._show_message(custom_msg)
                
                return {
                    "success": success,
                    "message": res.get("message", "Unknown Error"),
                    "data": res
                }
        except Exception as e:
            return {"success": False, "message": f"Network Error: {str(e)}"}

    def start_heartbeat(self, interval_ms=15000):
        if not self.license_key:
            return
        
        def loop():
            payload = json.dumps({"appId": self.app_id, "licenceKey": self.license_key}).encode("utf-8")
            while True:
                time.sleep(interval_ms / 1000.0)
                try:
                    req = urllib.request.Request(f"{self.base_url}/runtime/heartbeat", data=payload, headers={"Content-Type": "application/json"}, method="POST")
                    with urllib.request.urlopen(req, timeout=10) as resp:
                        data = json.loads(resp.read().decode("utf-8"))
                        
                        custom_msg = data.get("customMessage")
                        if custom_msg:
                            self._show_message(custom_msg)

                        if data.get("status") == "true" and data.get("currentStatus") == "killed":
                            self._show_message("Session terminated by administrator.", "Security Alert", 0x10)
                            time.sleep(1)
                            os._exit(1)
                except:
                    pass

        t = threading.Thread(target=loop, daemon=True)
        t.start()
        return t
