import { hexToPixel } from './hex.js';
import { HEX_SIZE } from './hex.js';

// ---------------------------------------------------------------------------
// Point-to-segment distance
// ---------------------------------------------------------------------------

/**
 * Shortest distance from point P to the line segment AB.
 * @param {{ x:number, y:number }} p
 * @param {{ x:number, y:number }} a
 * @param {{ x:number, y:number }} b
 * @returns {number}
 */
function pointToSegmentDistance(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    // Segment is a point
    const ex = p.x - a.x;
    const ey = p.y - a.y;
    return Math.sqrt(ex * ex + ey * ey);
  }

  // Project p onto the segment, clamped to [0, 1]
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  const nearX = a.x + t * dx;
  const nearY = a.y + t * dy;
  const ex = p.x - nearX;
  const ey = p.y - nearY;
  return Math.sqrt(ex * ex + ey * ey);
}

// ---------------------------------------------------------------------------
// Path hit testing
// ---------------------------------------------------------------------------

/**
 * Convert a path's hex coords to pixel centers.
 * @param {Array<{q:number, r:number}>} hexPath
 * @returns {Array<{x:number, y:number}>}
 */
function pathToPixels(hexPath) {
  return hexPath.map(({ q, r }) => hexToPixel(q, r, HEX_SIZE));
}

/**
 * Minimum distance from a pixel point to any segment of a path.
 * @param {{ x:number, y:number }} point  world-space pixel coords
 * @param {Array<{q:number, r:number}>} hexPath
 * @returns {number}
 */
function distanceToPath(point, hexPath) {
  const pixels = pathToPixels(hexPath);
  let minDist = Infinity;

  for (let i = 0; i < pixels.length - 1; i++) {
    const d = pointToSegmentDistance(point, pixels[i], pixels[i + 1]);
    if (d < minDist) minDist = d;
  }

  return minDist;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Find the id of the road or river closest to the given world-space point,
 * within the given tolerance (in pixels).
 *
 * Tests only the array(s) passed in — pass roads, rivers, or both depending
 * on which tool is active.
 *
 * @param {{ x:number, y:number }} worldPoint
 * @param {Array<{id:string, path:Array<{q,r}>}>} paths
 * @param {number} [tolerance=8]   hit radius in world-space pixels
 * @returns {string|null}          id of the hit path, or null
 */
export function hitTestPaths(worldPoint, paths, tolerance = 8) {
  let bestId = null;
  let bestDist = tolerance;

  for (const pathObj of paths) {
    if (!pathObj.path || pathObj.path.length < 2) continue;
    const d = distanceToPath(worldPoint, pathObj.path);
    if (d < bestDist) {
      bestDist = d;
      bestId = pathObj.id;
    }
  }

  return bestId;
}

/**
 * Convert a canvas mouse event position to world-space coordinates,
 * accounting for the current viewport transform.
 *
 * @param {MouseEvent} e
 * @param {HTMLCanvasElement} canvas
 * @param {{ x:number, y:number, scale:number }} viewport
 * @returns {{ x:number, y:number }}
 */
export function canvasEventToWorld(e, canvas, viewport) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left - canvas.width / 2 - viewport.x) / viewport.scale,
    y: (e.clientY - rect.top - canvas.height / 2 - viewport.y) / viewport.scale,
  };
}
