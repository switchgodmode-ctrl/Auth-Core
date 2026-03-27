export function lighten(hex, amt = 0.35) {
  try {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    const lr = Math.min(255, Math.round(r + (255 - r) * amt));
    const lg = Math.min(255, Math.round(g + (255 - g) * amt));
    const lb = Math.min(255, Math.round(b + (255 - b) * amt));
    const toHex = (v) => v.toString(16).padStart(2, "0");
    return `#${toHex(lr)}${toHex(lg)}${toHex(lb)}`;
  } catch { return hex; }
}

function toRgbString(hex) {
  try {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `${r} ${g} ${b}`;
  } catch { return "255 0 76"; }
}

export function applyBrand(color) {
  const secondary = lighten(color, 0.35);
  const root = document.documentElement;
  root.style.setProperty("--brand", color);
  root.style.setProperty("--brand2", secondary);
  root.style.setProperty("--brand-rgb", toRgbString(color));
  root.style.setProperty("--brand2-rgb", toRgbString(secondary));
}

export function initBrandFromStorage() {
  const saved = localStorage.getItem("themeBrand") || "";
  if (saved) applyBrand(saved);
}

export function saveBrand(color) {
  localStorage.setItem("themeBrand", color);
}
