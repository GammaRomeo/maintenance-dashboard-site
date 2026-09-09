// Generic parametric vehicle-class silhouettes — one shape per class, not per
// vehicle, per the base-tier visual layer described in
// 02-planning/technical-architecture-schema.md. Each class has the same 7
// hotspot zones the 3D explorer uses, so the same fastener data (via zoneId)
// drives this view for any vehicle that has no purchased/scanned 3D model.
//
// Each class defines its own `viewBox` (see getSilhouetteViewBox()) rather
// than assuming a fixed box, so real source-art proportions (see sedan below)
// don't have to be distorted to fit one shared box.
const SILHOUETTE_CLASSES = {
  sedan: {
    label: "Sedan / coupe",
    // Body outline and wheel rects are NOT invented/hand-drawn — they're the
    // body-outline path and four wheel rects (coordinates unchanged) from a
    // public-domain top-view car clip-art SVG sourced from Openclipart
    // (http://openclipart.org/), dedicated to the public domain under
    // http://creativecommons.org/licenses/publicdomain/ (permits reproduction,
    // distribution, and derivative works — see the source file's embedded
    // RDF/Dublin Core metadata). All color/gradient/chrome/trim detail from
    // the source was stripped for a flat, de-badged, generic silhouette not
    // representing any specific make or model. See "Generic silhouette asset
    // provenance" in 02-planning/technical-architecture-schema.md and the
    // standalone copy at app/img/generic-sedan-topview.svg. Glass paths are
    // simplified monochrome derivatives of the source's hood/cabin/trunk panel
    // paths, kept to make the vehicle read as a boxier top-down sedan rather
    // than a plain oval/capsule.
    viewBox: "0 0 358.85 789.36",
    bodyPath: "m178.73 782.98c-113.07 2.362-130.4-17.92-147.11-21.261-16.705-38.776-19.877-365.73-9.855-392.46 7.493-60.54-4.936-70.565-8.687-143.53-7.14-85.213 9.815-37.829-4.439-124.48 21.658-90.216-19.136-92.053 168.52-100.63 172.21 2.401 147.96 10.415 169.61 100.63-14.254 86.652 2.701 39.268-4.439 124.48-3.751 72.961-16.18 82.986-8.687 143.53 10.022 26.727 6.85 353.68-9.855 392.46-26.153 15.153-95.459 21.261-145.07 21.261z",
    windshieldPath: "M 55 255 C 95 238 135 230 180 230 C 225 230 265 240 315 258 L 294 360 C 188 334 172 334 64 360 Z",
    rearWindowPath: "M 81 536 C 145 547 216 546 279 534 C 290 590 298 680 298 695 C 281 718 185 726 178 726 C 176 726 78 718 60 702 C 61 690 70 590 81 536 Z",
    wheels: [
      { x: 8.6333, y: 101.12, w: 27.775, h: 78.696, rx: 8.5849 },
      { x: 318.79, y: 98.038, w: 27.775, h: 78.696, rx: 8.5849 },
      { x: 16.287, y: 623.04, w: 27.775, h: 78.696, rx: 8.5849 },
      { x: 311.29, y: 613.04, w: 27.775, h: 78.696, rx: 8.5849 },
    ],
    zones: {
      engine:     { cx: 179, cy: 55 },
      frontLeft:  { cx: 22,  cy: 140 },
      frontRight: { cx: 332, cy: 137 },
      rearLeft:   { cx: 30,  cy: 662 },
      rearRight:  { cx: 325, cy: 652 },
      exhaust:    { cx: 179, cy: 745 },
      interior:   { cx: 179, cy: 390 },
    },
  },
};

/** The SVG viewBox a silhouette class's path/rect/zone coordinates were authored against. */
function getSilhouetteViewBox(vehicleClass) {
  return getSilhouetteClass(vehicleClass).viewBox || "0 0 300 560";
}

// Other classes (SUV/crossover, pickup, hatchback) reuse this same approach —
// a distinct bodyPath/wheel layout with the same 7 zone keys — but aren't drawn
// yet. Falling back to "sedan" keeps every vehicle visually navigable in the
// meantime rather than blocking on a full silhouette set.
function getSilhouetteClass(vehicleClass) {
  return SILHOUETTE_CLASSES[vehicleClass] || SILHOUETTE_CLASSES.sedan;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { SILHOUETTE_CLASSES, getSilhouetteClass, getSilhouetteViewBox };
}
