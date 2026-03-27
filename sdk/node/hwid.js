import { execSync } from "child_process";
import crypto from "crypto";

function run(cmd) {
  try { return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim(); } catch { return ""; }
}

function getSignals() {
  const sys = run(`powershell -NoProfile -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"`);
  const mb = run(`powershell -NoProfile -Command "(Get-CimInstance Win32_BaseBoard).SerialNumber"`);
  const disk = run(`powershell -NoProfile -Command "(Get-PhysicalDisk | Select-Object -First 1).SerialNumber"`);
  return {
    system_uuid: sys,
    motherboard_id: mb,
    disk_serial: disk
  };
}

function composite(signals) {
  const base = `${signals.system_uuid || ""}|${signals.motherboard_id || ""}`;
  return crypto.createHash("sha256").update(base).digest("hex");
}

export function getHwid() {
  const signals = getSignals();
  const hwid = composite(signals);
  return { hwid, signals };
}
export function buildVerifyPayload(appName, appSecret, licenceKey) {
  const { hwid, signals } = getHwid();
  return {
    appName,
    appSecret,
    licenceKey,
    hwid,
    system_uuid: signals.system_uuid,
    motherboard_id: signals.motherboard_id
  };
}
export function buildRuntimePayload(appId, appSecret, licenceKey, appVersion, integrityHash) {
  const { hwid, signals } = getHwid();
  return {
    appId,
    appSecret,
    licenceKey,
    hwid,
    appVersion,
    integrityHash,
    system_uuid: signals.system_uuid,
    motherboard_id: signals.motherboard_id
  };
}
