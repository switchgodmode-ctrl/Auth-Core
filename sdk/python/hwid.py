import subprocess
import hashlib
import platform

def get_wmi_property(cmd):
    try:
        output = subprocess.check_output(cmd, shell=True).decode().strip()
        # Clean up output (wmic often adds headers and extra lines)
        lines = [line.strip() for line in output.split('\n') if line.strip()]
        if len(lines) > 1:
            return lines[1]
        return "unknown"
    except:
        return "unknown"

def get_hardware_signals():
    return {
        "cpuId": get_wmi_property("wmic cpu get processorid"),
        "motherboard": get_wmi_property("wmic baseboard get serialnumber"),
        "uuid": get_wmi_property("wmic csproduct get uuid"),
        "disk": get_wmi_property("wmic diskdrive get serialnumber")
    }

def get_hwid():
    signals = get_hardware_signals()
    base_str = f"{signals['uuid']}|{signals['motherboard']}|{signals['cpuId']}"
    return hashlib.sha256(base_str.encode()).hexdigest()
