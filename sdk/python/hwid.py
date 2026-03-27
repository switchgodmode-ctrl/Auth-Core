import subprocess
import hashlib

def run(cmd):
    try:
        return subprocess.check_output(cmd, shell=True).decode().strip()
    except:
        return ""

def get_signals():
    sys = run('powershell -NoProfile -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"')
    mb = run('powershell -NoProfile -Command "(Get-CimInstance Win32_BaseBoard).SerialNumber"')
    disk = run('powershell -NoProfile -Command "(Get-PhysicalDisk | Select-Object -First 1).SerialNumber"')
    return {
        "system_uuid": sys,
        "motherboard_id": mb,
        "disk_serial": disk
    }

def composite(signals):
    base = f"{signals.get('system_uuid','')}|{signals.get('motherboard_id','')}"
    return hashlib.sha256(base.encode()).hexdigest()

def get_hwid():
    signals = get_signals()
    hwid = composite(signals)
    return hwid, signals
def build_verify_payload(app_name, app_secret, licence_key):
    hwid, signals = get_hwid()
    return {
        "appName": app_name,
        "appSecret": app_secret,
        "licenceKey": licence_key,
        "hwid": hwid,
        "system_uuid": signals.get("system_uuid"),
        "motherboard_id": signals.get("motherboard_id")
    }
def build_runtime_payload(app_id, app_secret, licence_key, app_version, integrity_hash):
    hwid, signals = get_hwid()
    return {
        "appId": app_id,
        "appSecret": app_secret,
        "licenceKey": licence_key,
        "hwid": hwid,
        "appVersion": app_version,
        "integrityHash": integrity_hash,
        "system_uuid": signals.get("system_uuid"),
        "motherboard_id": signals.get("motherboard_id")
    }
