// Generic parametric vehicle-class silhouettes — one shape per class, not per
// vehicle, per the base-tier visual layer described in
// 02-planning/technical-architecture-schema.md. Each class is an independently
// drawn, generic top-down outline (not traced or derived from any specific
// vehicle's design) with the same 7 hotspot zones the 3D explorer uses, so the
// same fastener data (via zoneId) drives this view for any vehicle that has no
// purchased/scanned 3D model.
//
// viewBox is 0 0 300 560, vehicle facing up (front at low y).
const SILHOUETTE_CLASSES = {
  sedan: {
    label: "Sedan / coupe",
    bodyPath: `
      M 110 40
      Q 150 20 190 40
      L 220 100
      Q 240 110 240 140
      L 240 420
      Q 240 470 220 490
      L 190 520
      Q 150 535 110 520
      L 80 490
      Q 60 470 60 420
      L 60 140
      Q 60 110 80 100
      Z`,
    windshieldPath: "M 95 115 L 205 115 L 190 165 L 110 165 Z",
    rearWindowPath: "M 100 395 L 200 395 L 188 445 L 112 445 Z",
    wheels: [
      { x: 30, y: 110, w: 28, h: 70, rx: 8 },
      { x: 242, y: 110, w: 28, h: 70, rx: 8 },
      { x: 30, y: 380, w: 28, h: 70, rx: 8 },
      { x: 242, y: 380, w: 28, h: 70, rx: 8 },
    ],
    zones: {
      engine:     { cx: 150, cy: 85 },
      frontLeft:  { cx: 75,  cy: 150 },
      frontRight: { cx: 225, cy: 150 },
      rearLeft:   { cx: 75,  cy: 410 },
      rearRight:  { cx: 225, cy: 410 },
      exhaust:    { cx: 150, cy: 505 },
      interior:   { cx: 150, cy: 280 },
    },
  },
};

// Other classes (SUV/crossover, pickup, hatchback) reuse this same approach —
// a distinct bodyPath/wheel layout with the same 7 zone keys — but aren't drawn
// yet. Falling back to "sedan" keeps every vehicle visually navigable in the
// meantime rather than blocking on a full silhouette set.
function getSilhouetteClass(vehicleClass) {
  return SILHOUETTE_CLASSES[vehicleClass] || SILHOUETTE_CLASSES.sedan;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { SILHOUETTE_CLASSES, getSilhouetteClass };
}
