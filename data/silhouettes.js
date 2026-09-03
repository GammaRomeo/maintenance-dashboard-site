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
    // Outline traced as a front-half half-width profile (nose to waist), then
    // mirrored front-to-rear (about y=269.5) and left-to-right (about x=150) so
    // the body is a blunt, rounded-bumper shape with a distinct fender flare at
    // each wheel and a tucked-in waist along the cabin/doors — reads as a car in
    // top-down view rather than a plain capsule. Independently drawn, not traced
    // from any specific vehicle's design (see RESUME-HERE.md legal note on this).
    bodyPath: `
      M 150.0 34.0 Q 174.0 34.0 180.0 40.0 Q 186.0 46.0 191.0 53.0
      Q 196.0 60.0 199.5 68.0 Q 203.0 76.0 205.5 85.5 Q 208.0 95.0 218.0 101.5
      Q 228.0 108.0 233.0 113.0 Q 238.0 118.0 235.0 123.0 Q 232.0 128.0 222.0 134.0
      Q 212.0 140.0 204.0 146.0 Q 196.0 152.0 193.0 157.0 Q 190.0 162.0 189.0 171.0
      Q 188.0 180.0 188.0 269.5 Q 188.0 359.0 189.0 368.0 Q 190.0 377.0 193.0 382.0
      Q 196.0 387.0 204.0 393.0 Q 212.0 399.0 222.0 405.0 Q 232.0 411.0 235.0 416.0
      Q 238.0 421.0 233.0 426.0 Q 228.0 431.0 218.0 437.5 Q 208.0 444.0 205.5 453.5
      Q 203.0 463.0 199.5 471.0 Q 196.0 479.0 191.0 486.0 Q 186.0 493.0 180.0 499.0
      Q 174.0 505.0 150.0 505.0 Q 126.0 505.0 120.0 499.0 Q 114.0 493.0 109.0 486.0
      Q 104.0 479.0 100.5 471.0 Q 97.0 463.0 94.5 453.5 Q 92.0 444.0 82.0 437.5
      Q 72.0 431.0 67.0 426.0 Q 62.0 421.0 65.0 416.0 Q 68.0 411.0 78.0 405.0
      Q 88.0 399.0 96.0 393.0 Q 104.0 387.0 107.0 382.0 Q 110.0 377.0 111.0 368.0
      Q 112.0 359.0 112.0 269.5 Q 112.0 180.0 111.0 171.0 Q 110.0 162.0 107.0 157.0
      Q 104.0 152.0 96.0 146.0 Q 88.0 140.0 78.0 134.0 Q 68.0 128.0 65.0 123.0
      Q 62.0 118.0 67.0 113.0 Q 72.0 108.0 82.0 101.5 Q 92.0 95.0 94.5 85.5
      Q 97.0 76.0 100.5 68.0 Q 104.0 60.0 109.0 53.0 Q 114.0 46.0 120.0 40.0
      Q 126.0 34.0 150.0 34.0
      Z`,
    windshieldPath: "M 122 186 L 178 186 L 170 226 L 130 226 Z",
    rearWindowPath: "M 130 313 L 170 313 L 178 353 L 122 353 Z",
    wheels: [
      { x: 52, y: 86, w: 36, h: 66, rx: 9 },
      { x: 212, y: 86, w: 36, h: 66, rx: 9 },
      { x: 52, y: 387, w: 36, h: 66, rx: 9 },
      { x: 212, y: 387, w: 36, h: 66, rx: 9 },
    ],
    zones: {
      engine:     { cx: 150, cy: 75 },
      frontLeft:  { cx: 70,  cy: 119 },
      frontRight: { cx: 230, cy: 119 },
      rearLeft:   { cx: 70,  cy: 420 },
      rearRight:  { cx: 230, cy: 420 },
      exhaust:    { cx: 150, cy: 475 },
      interior:   { cx: 150, cy: 270 },
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
