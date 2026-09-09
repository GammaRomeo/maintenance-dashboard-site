// Small library of generic tightening-order diagrams for the optional
// `tighteningPattern` field on fastener records (see data/fastener-data.js
// and 02-planning/technical-architecture-schema.md). These are general
// mechanical-practice patterns — a numbered crisscross/star diagram for a
// given bolt count and layout — not sourced from any specific vehicle's
// service manual. Plain script-tag-friendly JS, no build step, matching the
// rest of this project.

/** Evenly spaced points around a circle, for lug-style star patterns. */
function circlePoints(n) {
  const cx = 60, cy = 60, r = 42;
  const points = [];
  for (let i = 0; i < n; i++) {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    points.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
  }
  return points;
}

/** Evenly spaced points on a rows x cols grid, for flange/head-bolt layouts. */
function gridPoints(rows, cols) {
  const marginX = 18, marginY = 18, w = 120 - marginX * 2, h = 120 - marginY * 2;
  const points = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = cols === 1 ? 60 : marginX + (w * c) / (cols - 1);
      const y = rows === 1 ? 60 : marginY + (h * r) / (rows - 1);
      points.push({ x, y });
    }
  }
  return points;
}

const TORQUE_PATTERN_LAYOUTS = {
  "star-5": circlePoints(5),
  "inside-out-4": gridPoints(2, 2),
  "inside-out-6": gridPoints(2, 3),
  "inside-out-10": gridPoints(2, 5),
};

const TORQUE_PATTERN_LABELS = {
  "star-5": "5-point star tightening order",
  "inside-out-4": "4-point inside-out tightening order",
  "inside-out-6": "6-point inside-out tightening order",
  "inside-out-10": "10-point inside-out tightening order",
};

/**
 * Order in which each point (by index into the layout's point array) should
 * be tightened. Points are first ordered by angle around their centroid (their
 * position going around the perimeter), then interleaved with the point
 * roughly opposite it — the same "cross to the far side, then the next pair
 * over" logic used for star lug patterns and crisscross flange patterns,
 * generalized to any point count. Only used with even point counts or the
 * n=5 star case in this library, so no coprime-skip edge cases arise.
 */
function computeTighteningOrder(points) {
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length;
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length;
  const perimeter = points
    .map((p, i) => ({ i, angle: Math.atan2(p.y - cy, p.x - cx) }))
    .sort((a, b) => a.angle - b.angle)
    .map((e) => e.i);
  const n = perimeter.length;
  const order = [];
  if (n % 2 === 0) {
    for (let i = 0; i < n / 2; i++) {
      order.push(perimeter[i]);
      order.push(perimeter[i + n / 2]);
    }
  } else {
    const step = Math.floor(n / 2);
    let k = 0;
    for (let c = 0; c < n; c++) {
      order.push(perimeter[k % n]);
      k += step;
    }
  }
  return order;
}

/** Renders a small numbered-bolt-order SVG for a known tighteningPattern id, or '' if unknown. */
function renderTighteningPatternSVG(patternId) {
  const points = TORQUE_PATTERN_LAYOUTS[patternId];
  if (!points) return "";
  const order = computeTighteningOrder(points);
  const stepOf = new Array(points.length);
  order.forEach((pointIndex, step) => { stepOf[pointIndex] = step + 1; });
  const circles = points.map((p, i) => `
    <circle cx="${p.x}" cy="${p.y}" r="12" fill="#1e2126" stroke="#2dd4bf" stroke-width="1.5"></circle>
    <text x="${p.x}" y="${p.y}" text-anchor="middle" dominant-baseline="central" fill="#f5f5f0" font-size="12" font-weight="600">${stepOf[i]}</text>
  `).join("");
  return `<svg viewBox="0 0 120 120" width="88" height="88" xmlns="http://www.w3.org/2000/svg">${circles}</svg>`;
}

/**
 * Renders the optional torque-stage/pattern block for a fastener record.
 * Fully additive: fasteners without torqueStages/tighteningPattern/patternNote
 * render an empty string, so callers keep showing the plain torqueValue
 * string exactly as before for every other record.
 */
function renderTorquePatternDetail(fastener) {
  if (!fastener) return "";
  const parts = [];
  if (Array.isArray(fastener.torqueStages) && fastener.torqueStages.length) {
    const items = fastener.torqueStages.map((stage, i) => {
      const label = stage.type === "angle"
        ? `${stage.value}${stage.unit || "°"} turn`
        : `${stage.value} ${stage.unit || ""}`.trim();
      return `<li>${label}</li>`;
    }).join("");
    parts.push(`<ol class="torqueStageList">${items}</ol>`);
  }
  if (fastener.tighteningPattern) {
    const svg = renderTighteningPatternSVG(fastener.tighteningPattern);
    if (svg) {
      const label = TORQUE_PATTERN_LABELS[fastener.tighteningPattern] || fastener.tighteningPattern;
      parts.push(`<div class="torquePatternDiagram">${svg}<div class="torquePatternLabel">${label}<br><span>Shows the tightening order, not wheel design.</span></div></div>`);
    }
  }
  if (fastener.patternNote) {
    parts.push(`<div class="torquePatternNote">${fastener.patternNote}</div>`);
  }
  return parts.join("");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    TORQUE_PATTERN_LAYOUTS,
    TORQUE_PATTERN_LABELS,
    computeTighteningOrder,
    renderTighteningPatternSVG,
    renderTorquePatternDetail,
  };
}
