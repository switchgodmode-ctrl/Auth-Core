import json
import urllib.request
import threading
import time
import sys
import os

def build_verify_payload(app_id, app_version, app_secret, license_key, hwid, integrity_hash=None):
    return {
        "appId": app_id, 
        "appVersion": app_version, 
        "appSecret": app_secret, 
        "licenceKey": license_key, 
        "hwid": hwid,
        "integrityHash": integrity_hash
    }

def verify(base_url, payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(f"{base_url}/runtime/validate", data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

def _heartbeat_loop(base_url, app_id, license_key, interval_ms):
    interval_s = interval_ms / 1000.0
    payload = json.dumps({"appId": app_id, "licenceKey": license_key}).encode("utf-8")
    
    while True:
        time.sleep(interval_s)
        try:
            req = urllib.request.Request(f"{base_url}/runtime/heartbeat", data=payload, headers={"Content-Type": "application/json"}, method="POST")
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                
                if data.get("status") and data.get("active") is False and data.get("currentStatus") == "killed":
                    print("\n[SECURITY] Access revoked by server. Connection forcefully terminated by Administrator.", file=sys.stderr)
                    # Use os._exit to aggressively unhinge all threads in memory and shutdown the C interpreter immediately
                    os._exit(1)
        except Exception:
            pass # Ignore standard network failures, client continues functioning offline unless explicitly killed

def start_heartbeat(base_url, app_id, license_key, interval_ms=10000):
    t = threading.Thread(target=_heartbeat_loop, args=(base_url, app_id, license_key, interval_ms), daemon=True)
    t.start()
    return t
