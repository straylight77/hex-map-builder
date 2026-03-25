import { hexToPixel } from '../utils/hex.js';

// ---------------------------------------------------------------------------
// Catmull-Rom spline helpers
// ---------------------------------------------------------------------------

/**
 * Add a single Catmull-Rom segment to the current canvas path.
 * The segment goes from p1 to p2, using p0 and p3 as the flanking
 * control points. `tension` (0–1) controls curvature.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x:number, y:number }} p0
 * @param {{ x:number, y:number }} p1
 * @param {{ x:number, y:number }} p2
 * @param {{ x:number, y:number }} p3
 * @param {number} tension  0 = no curvature, 1 = maximum curvature
 */
function catmullRomSegment(ctx, p0, p1, p2, p3, tension) {
  // Convert Catmull-Rom to cubic Bézier control points
  const t = tension;
  const cp1x = p1.x + (p2.x - p0.x) / 6 * t;
  const cp1y = p1.y + (p2.y - p0.y) / 6 * t;
  const cp2x = p2.x - (p3.x - p1.x) / 6 * t;
  const cp2y = p2.y - (p3.y - p1.y) / 6 * t;
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
}

/**
 * Build a smooth Catmull-Rom path through a list of pixel points.
 * Duplicates the first and last points to ensure the curve reaches the
 * endpoints.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ x:number, y:number }[]} points  at least 2 points
 * @param {number} tension
 */
function buildSplinePath(ctx, points, tension) {
  if (points.length < 2) return;

  // Phantom endpoints so the curve starts and ends at the actual endpoints
  const pts = [points[0], ...points, points[points.length - 1]];

  ctx.moveTo(pts[1].x, pts[1].y);
  for (let i = 1; i < pts.length - 2; i++) {
    catmullRomSegment(ctx, pts[i - 1], pts[i], pts[i + 1], pts[i + 2], tension);
  }
}

// ---------------------------------------------------------------------------
// Public path rendering
// ---------------------------------------------------------------------------

/**
 * Draw a road or river path on the canvas.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<{q:number, r:number}>} hexPath  ordered hex coordinates
 * @param {{ width:number, color:string, dash:number[], spline:{ enabled:boolean, tension:number } }} style
 * @param {number} [hexSize]  passed through to hexToPixel; uses default if omitted
 */
export function drawPath(ctx, hexPath, style, hexSize) {
  if (!hexPath || hexPath.length < 2) return;

  const pixels = hexPath.map(({ q, r }) => hexToPixel(q, r, hexSize));

  ctx.save();
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash(style.dash ?? []);

  ctx.beginPath();

  if (style.spline?.enabled && hexPath.length > 2) {
    buildSplinePath(ctx, pixels, style.spline.tension ?? 0.5);
  } else {
    // Plain polyline
    ctx.moveTo(pixels[0].x, pixels[0].y);
    for (let i = 1; i < pixels.length; i++) {
      ctx.lineTo(pixels[i].x, pixels[i].y);
    }
  }

  ctx.stroke();
  ctx.restore();
}

/**
 * Draw an in-progress (preview) path — same shape but visually distinct:
 * semi-transparent, dashed overlay so the user knows it's uncommitted.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array<{q:number, r:number}>} hexPath
 * @param {{ width:number, color:string, spline:{ enabled:boolean, tension:number } }} style
 * @param {number} [hexSize]
 */
export function drawPathPreview(ctx, hexPath, style, hexSize) {
  if (!hexPath || hexPath.length < 1) return;

  const pixels = hexPath.map(({ q, r }) => hexToPixel(q, r, hexSize));

  ctx.save();
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.width;
  ctx.globalAlpha = 0.55;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([10, 6]);

  ctx.beginPath();

  if (style.spline?.enabled && hexPath.length > 2) {
    buildSplinePath(ctx, pixels, style.spline.tension ?? 0.5);
  } else {
    ctx.moveTo(pixels[0].x, pixels[0].y);
    for (let i = 1; i < pixels.length; i++) {
      ctx.lineTo(pixels[i].x, pixels[i].y);
    }
  }

  ctx.stroke();

  // Draw a small dot at each committed point so the user can see the nodes
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = style.color;
  pixels.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, style.width * 0.9, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}
