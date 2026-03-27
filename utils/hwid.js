import crypto from "crypto";

export function compositeHwid(signals = {}) {
  const system = signals.system_uuid || "";
  const motherboard = signals.motherboard_id || "";
  const raw = `${system}|${motherboard}`;
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return hash;
}
