import { hexToPixel } from '../utils/hex.js';
import { HEX_SIZE } from '../utils/hex.js';

// ---------------------------------------------------------------------------
// Catmull-Rom spline
// ---------------------------------------------------------------------------

function catmullRomSegment(ctx, p0, p1, p2, p3, tension) {
  const t = tension;
  const cp1x = p1.x + (p2.x - p0.x) / 6 * t;
  const cp1y = p1.y + (p2.y - p0.y) / 6 * t;
  const cp2x = p2.x - (p3.x - p1.x) / 6 * t;
  const cp2y = p2.y - (p3.y - p1.y) / 6 * t;
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
}

function buildSplinePath(ctx, points, tension) {
  if (points.length < 2) return;
  const pts = [points[0], ...points, points[points.length - 1]];
  ctx.moveTo(pts[1].x, pts[1].y);
  for (let i = 1; i < pts.length - 2; i++) {
    catmullRomSegment(ctx, pts[i - 1], pts[i], pts[i + 1], pts[i + 2], tension);
  }
}

// ---------------------------------------------------------------------------
// Meander — midpoint displacement with pre-injected intermediate points
// ---------------------------------------------------------------------------

/**
 * Deterministic pseudo-random number in [-0.5, 0.5] seeded from two numbers.
 * Using the same seed for the same path always produces the same river shape.
 */
function seededRand(a, b) {
  let s = Math.round(a * 1000) * 1664525 + Math.round(b * 1000) * 1013904223;
  s = (s ^ (s >>> 16)) & 0xffffffff;
  s = (s * 2246822519) & 0xffffffff;
  s = (s ^ (s >>> 13)) & 0xffffffff;
  return ((s >>> 0) / 0xffffffff) - 0.5;
}

/**
 * Offset a point perpendicular to the direction AB by `amount` pixels.
 */
function perp(a, b, amount) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return {
    x: (a.x + b.x) / 2 + (-dy / len) * amount,
    y: (a.y + b.y) / 2 + ( dx / len) * amount,
  };
}

/**
 * Inject `count` evenly-spaced intermediate points between each pair of
 * pixel points.
 */
function injectIntermediatePoints(pts, count) {
  if (count <= 0) return pts;
  const result = [];
  for (let i = 0; i < pts.length - 1; i++) {
    result.push(pts[i]);
    const a = pts[i], b = pts[i + 1];
    for (let j = 1; j <= count; j++) {
      const t = j / (count + 1);
      result.push({
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
      });
    }
  }
  result.push(pts[pts.length - 1]);
  return result;
}

/**
 * Recursively apply midpoint displacement to an array of pixel points.
 */
function midpointDisplace(pts, amplitude, depth, level = 0) {
  if (depth === 0 || pts.length < 2) return pts;

  const result = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    result.push(a);

    const dx = b.x - a.x, dy = b.y - a.y;
    const segLen = Math.sqrt(dx * dx + dy * dy);

    const scale = amplitude * segLen * Math.pow(0.55, 3 - depth);
    const rand = seededRand(a.x + level * 1000, a.y + i * 317 + level * 500);
    const offset = rand * scale;

    result.push(perp(a, b, offset));
  }
  result.push(pts[pts.length - 1]);

  return midpointDisplace(result, amplitude, depth - 1, level + 1);
}

/**
 * Apply meander to a pixel point array.
 */
function applyMeander(pixels, meander) {
  if (!meander || pixels.length < 2) return pixels;

  const injected = injectIntermediatePoints(pixels, meander.points ?? 1);
  return midpointDisplace(injected, meander.amplitude ?? 0.70, meander.depth ?? 3);
}

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------

function parseHex(hex) {
  const h = hex.replace('#', '');
  if (h.length === 3) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    };
  }
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function darkenColor(hex, factor = 0.62) {
  try {
    const { r, g, b } = parseHex(hex);
    const d = (n) => Math.max(0, Math.round(n * factor)).toString(16).padStart(2, '0');
    return `#${d(r)}${d(g)}${d(b)}`;
  } catch {
    return hex;
  }
}

// ---------------------------------------------------------------------------
// Stroke helper
// ---------------------------------------------------------------------------

function strokePath(ctx, pixels, spline, tension, width, color, dash, cap = 'square') {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = cap;
  ctx.lineJoin = 'round';
  ctx.setLineDash(Array.isArray(dash) ? dash : []);

  ctx.beginPath();
  if (spline?.enabled && pixels.length > 2) {
    buildSplinePath(ctx, pixels, tension ?? 0.5);
  } else {
    ctx.moveTo(pixels[0].x, pixels[0].y);
    for (let i = 1; i < pixels.length; i++) ctx.lineTo(pixels[i].x, pixels[i].y);
  }
  ctx.stroke();
}

/**
 * Draw a committed road or river path.
 *
 * Rivers choose their rendering based on `style.algorithm`:
 *   'smooth'  — Catmull-Rom spline only, no meander
 *   'meander' — midpoint displacement + spline on top (default)
 *
 * Both passes (border + fill) share the same displaced points so they align exactly.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<{q:number, r:number}>} hexPath
 * @param {{ width, color, dash, spline, meander?, algorithm? }} style
 * @param {number} [hexSize]
 */
export function drawPath(ctx, hexPath, style, hexSize) {
  if (!hexPath || hexPath.length < 2) return;

  let pixels = hexPath.map(({ q, r }) => hexToPixel(q, r, hexSize));

  const isRiver = !!style.meander; // rivers always carry a meander object
  const algorithm = style.algorithm ?? 'meander';

  // Apply meander only when it's a river AND the algorithm is 'meander'
  if (isRiver && algorithm === 'meander') {
    pixels = applyMeander(pixels, style.meander);
  }

  // For smooth rivers, force spline on so they always curve nicely
  const spline = isRiver && algorithm === 'smooth'
    ? { enabled: true, tension: style.spline?.tension ?? 0.6 }
    : style.spline;

  const { color, width, dash } = style;
  const tension = spline?.tension ?? 0.5;

  ctx.save();

  if (isRiver) {
    // Border pass — darker colour, wider by 2px on each side
    strokePath(ctx, pixels, spline, tension, width + 4, darkenColor(color, 0.58), dash);
  }

  // Fill pass
  strokePath(ctx, pixels, spline, tension, width, color, dash);

  ctx.restore();
}

/**
 * Draw an in-progress (uncommitted) path preview.
 * Neither meander nor smoothing is applied — the user needs to see the clean
 * waypoint structure while still placing points.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<{q:number, r:number}>} hexPath
 * @param {{ width, color, spline }} style
 * @param {number} [hexSize]
 */
export function drawPathPreview(ctx, hexPath, style, hexSize) {
  if (!hexPath || hexPath.length < 1) return;
  const pixels = hexPath.map(({ q, r }) => hexToPixel(q, r, hexSize));

  ctx.save();
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.width;
  ctx.globalAlpha = 0.55;
  ctx.lineCap = 'square';
  ctx.lineJoin = 'round';
  ctx.setLineDash([12, 8]);

  ctx.beginPath();
  if (style.spline?.enabled && pixels.length > 2) {
    buildSplinePath(ctx, pixels, style.spline.tension ?? 0.5);
  } else {
    ctx.moveTo(pixels[0].x, pixels[0].y);
    for (let i = 1; i < pixels.length; i++) ctx.lineTo(pixels[i].x, pixels[i].y);
  }
  ctx.stroke();

  // Waypoint dots — show clean hex-center positions so user can see structure
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = style.color;
  const dotRadius = Math.max(style.width * 0.9, 4);
  pixels.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}
