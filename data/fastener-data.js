// Shared data layer — the single source every navigation surface (list/search
// navigator, 3D hotspot explorer, future diagram/photo views) reads from.
// Plain script-tag-friendly JS, no build step, matching the rest of this project.

/**
 * Groups a flat fastener-record array into System -> subAssembly -> [records],
 * for the Vehicle -> System -> sub-assembly -> fastener navigator hierarchy.
 */
function groupFastenersBySystem(fasteners) {
  const bySystem = {};
  for (const f of fasteners) {
    if (!bySystem[f.system]) bySystem[f.system] = {};
    if (!bySystem[f.system][f.subAssembly]) bySystem[f.system][f.subAssembly] = [];
    bySystem[f.system][f.subAssembly].push(f);
  }
  return bySystem;
}

/** Groups a flat fastener-record array by zoneId, for the 3D hotspot view. */
function groupFastenersByZone(fasteners) {
  const byZone = {};
  for (const f of fasteners) {
    if (!byZone[f.zoneId]) byZone[f.zoneId] = [];
    byZone[f.zoneId].push(f);
  }
  return byZone;
}

const SOURCE_TIERS = ["official", "community", "tuner", "self-reported"];

function filterByTiers(fasteners, tiers) {
  if (!tiers || !tiers.length) return fasteners;
  const allowed = new Set(tiers);
  return fasteners.filter((f) => allowed.has(f.sourceTier));
}

/**
 * Vehicle-level (not per-fastener) trust status, shown wherever a vehicle's
 * spec data is viewed so a starter/scaffolded profile reads as clearly
 * unverified even before a tester opens any individual fastener. Every
 * vehicle in this app mixes at least some community/tuner-tier data (see
 * per-fastener sourceTier badges), so this never claims a vehicle overall is
 * "verified" — only whether it still has open research questions (starter)
 * or not (community). Neither tone implies official/factory verification.
 */
function vehicleTrustBadge(vehicle) {
  if (!vehicle) return null;
  const hasOpenQuestions = Array.isArray(vehicle.researchQuestions) && vehicle.researchQuestions.length > 0;
  return hasOpenQuestions
    ? { tone: "starter", label: "Starter profile — community-sourced, unverified. Confirm every spec before service." }
    : { tone: "community", label: "Community-sourced data — not officially verified. Confirm every spec before service." };
}

/**
 * Loads a vehicle dataset JSON file (shape written by scripts/migrate-audi-data.py:
 * { vehicle, zones, fasteners }). Works over http(s) — not file://, since fetch()
 * of local JSON is blocked by browsers under the file: protocol. The 3D explorer's
 * single-file build inlines this data directly instead of fetching it, for that reason.
 */
async function loadVehicleData(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load vehicle data: ${res.status} ${url}`);
  return res.json();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { groupFastenersBySystem, groupFastenersByZone, filterByTiers, loadVehicleData, SOURCE_TIERS, vehicleTrustBadge };
}
