export const VEHICLES = {
  car: { name: "Машина", description: "Два колеса, подвеска и уверенный разгон." },
  monowheel: { name: "Моноколесо", description: "Одно колесо, электротяга и баланс райдера." }
};

export function readSetting(key, fallback = "") {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}

export function saveSetting(key, value) {
  try { localStorage.setItem(key, String(value)); } catch { /* Storage may be disabled. */ }
}

export function validVehicle(value) {
  return Object.hasOwn(VEHICLES, value) ? value : "car";
}

export function readBest(type) {
  const legacy = type === "car" ? readSetting("hillclimb-best", "0") : "0";
  const value = Number(readSetting(`hillclimb-best-${type}`, legacy));
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}
