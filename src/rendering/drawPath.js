import { hexToPixel } from '../utils/hex.js';

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
// Public API
// ---------------------------------------------------------------------------

/**
 * Draw a committed road or river path.
 * Square line caps give a clean, map-like termination at endpoints.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<{q:number, r:number}>} hexPath
 * @param {{ width:number, color:string, dash:number[], spline:{enabled:boolean, tension:number} }} style
 * @param {number} [hexSize]
 */
export function drawPath(ctx, hexPath, style, hexSize) {
  if (!hexPath || hexPath.length < 2) return;
  const pixels = hexPath.map(({ q, r }) => hexToPixel(q, r, hexSize));

  ctx.save();
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.width;
  ctx.lineCap = 'square';
  ctx.lineJoin = 'round';
  ctx.setLineDash(style.dash ?? []);

  ctx.beginPath();
  if (style.spline?.enabled && hexPath.length > 2) {
    buildSplinePath(ctx, pixels, style.spline.tension ?? 0.5);
  } else {
    ctx.moveTo(pixels[0].x, pixels[0].y);
    for (let i = 1; i < pixels.length; i++) ctx.lineTo(pixels[i].x, pixels[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw an in-progress (uncommitted) path preview.
 * Semi-transparent dashed overlay with node dots at each waypoint.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<{q:number, r:number}>} hexPath
 * @param {{ width:number, color:string, spline:{enabled:boolean, tension:number} }} style
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
  if (style.spline?.enabled && hexPath.length > 2) {
    buildSplinePath(ctx, pixels, style.spline.tension ?? 0.5);
  } else {
    ctx.moveTo(pixels[0].x, pixels[0].y);
    for (let i = 1; i < pixels.length; i++) ctx.lineTo(pixels[i].x, pixels[i].y);
  }
  ctx.stroke();

  // Waypoint dots
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
