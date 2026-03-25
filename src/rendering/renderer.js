import { hexToPixel, hexKey } from '../utils/hex.js';
import { HEX_SIZE } from '../utils/hex.js';
import { drawTile, drawGridHex, drawHoverHighlight, drawHex } from './drawPrimitives.js';
import { drawPath, drawPathPreview } from './drawPath.js';

// ---------------------------------------------------------------------------
// Visible hex range calculation
// ---------------------------------------------------------------------------

/**
 * Return the q/r bounds that are potentially visible given the current
 * viewport and canvas size.  We add a generous buffer so hexes near the
 * edge are never clipped.
 *
 * @param {number} canvasW
 * @param {number} canvasH
 * @param {{ x:number, y:number, scale:number }} viewport
 * @param {number} [buffer=3]
 * @returns {{ minQ:number, maxQ:number, minR:number, maxR:number }}
 */
function visibleRange(canvasW, canvasH, viewport, buffer = 3) {
  // Map canvas corners to world space
  const toWorld = (cx, cy) => ({
    x: (cx - canvasW / 2 - viewport.x) / viewport.scale,
    y: (cy - canvasH / 2 - viewport.y) / viewport.scale,
  });

  const corners = [
    toWorld(0, 0),
    toWorld(canvasW, 0),
    toWorld(0, canvasH),
    toWorld(canvasW, canvasH),
  ];

  // Rough bounds in hex space — we over-estimate deliberately
  const hexRadius = HEX_SIZE * 2;
  const xs = corners.map(c => c.x);
  const ys = corners.map(c => c.y);
  const minX = Math.min(...xs) - hexRadius;
  const maxX = Math.max(...xs) + hexRadius;
  const minY = Math.min(...ys) - hexRadius;
  const maxY = Math.max(...ys) + hexRadius;

  // Convert to approximate q/r range with buffer
  const minQ = Math.floor(minX / (HEX_SIZE * Math.sqrt(3))) - buffer;
  const maxQ = Math.ceil(maxX / (HEX_SIZE * Math.sqrt(3))) + buffer;
  const minR = Math.floor(minY / (HEX_SIZE * 1.5)) - buffer;
  const maxR = Math.ceil(maxY / (HEX_SIZE * 1.5)) + buffer;

  return { minQ, maxQ, minR, maxR };
}

// ---------------------------------------------------------------------------
// Main render function
// ---------------------------------------------------------------------------

/**
 * Full canvas redraw. Called from the useEffect in App whenever any
 * rendering-relevant state changes.
 *
 * Render order (back to front):
 *   1. Tile fills + patterns
 *   2. Grid lines (above tile fills so borders are always visible)
 *   3. Committed roads
 *   4. Committed rivers
 *   5. In-progress path preview (road or river being drawn)
 *   6. Features  (placeholder for now)
 *   7. Hover highlight (always topmost)
 *
 * @param {HTMLCanvasElement} canvas
 * @param {object} state
 * @param {Map<string,{type:string}>} state.tiles
 * @param {Map<string,{type:string}>} state.features
 * @param {Array} state.roads
 * @param {Array} state.rivers
 * @param {{ width:number, height:number }} state.dimensions
 * @param {{ x:number, y:number, scale:number }} state.viewport
 * @param {boolean} state.showGrid
 * @param {{ q:number, r:number }|null} state.hoveredHex
 * @param {string} state.selectedTool
 * @param {boolean} state.isErasing
 * @param {Array<{q:number,r:number}>} state.activePath  in-progress road/river
 * @param {object|null} state.activePathStyle  style for the in-progress path
 */
export function renderMap(canvas, state) {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Sync canvas pixel size to its CSS size (handles HiDPI via CSS, not devicePixelRatio)
  const rect = canvas.getBoundingClientRect();
  if (canvas.width !== rect.width || canvas.height !== rect.height) {
    canvas.width = rect.width;
    canvas.height = rect.height;
  }

  const { width: W, height: H } = canvas;

  ctx.clearRect(0, 0, W, H);
  ctx.save();

  // Apply viewport transform: origin at canvas center, then pan + scale
  ctx.translate(W / 2 + state.viewport.x, H / 2 + state.viewport.y);
  ctx.scale(state.viewport.scale, state.viewport.scale);

  const { minQ, maxQ, minR, maxR } = visibleRange(W, H, state.viewport);

  // ── Layer 1: Tile fills + patterns ────────────────────────────────────────
  for (let r = minR; r <= maxR; r++) {
    for (let q = minQ; q <= maxQ; q++) {
      const { x, y } = hexToPixel(q, r);
      const key = hexKey(q, r);
      const tile = state.tiles.get(key);

      if (tile) {
        drawTile(ctx, x, y, tile.type);
      } else {
        drawHex(ctx, x, y, HEX_SIZE, '#ffffff', false);
      }
    }
  }

  // ── Layer 2: Grid lines ───────────────────────────────────────────────────
  if (state.showGrid) {
    for (let r = minR; r <= maxR; r++) {
      for (let q = minQ; q <= maxQ; q++) {
        const { x, y } = hexToPixel(q, r);
        const hasTile = state.tiles.has(hexKey(q, r));
        drawGridHex(ctx, x, y, HEX_SIZE, hasTile);
      }
    }
  }

  // ── Layer 3: Committed roads ──────────────────────────────────────────────
  state.roads?.forEach(road => {
    drawPath(ctx, road.path, road.style);
  });

  // ── Layer 4: Committed rivers ─────────────────────────────────────────────
  state.rivers?.forEach(river => {
    drawPath(ctx, river.path, river.style);
  });

  // ── Layer 5: In-progress path preview ────────────────────────────────────
  if (state.activePath?.length > 0 && state.activePathStyle) {
    drawPathPreview(ctx, state.activePath, state.activePathStyle);
  }

  // ── Layer 6: Features ─────────────────────────────────────────────────────
  // Placeholder — drawFeature calls go here once the Feature tool is built.
  // state.features?.forEach((feature, key) => {
  //   const { q, r } = parseHexKey(key);
  //   const { x, y } = hexToPixel(q, r);
  //   drawFeature(ctx, x, y, feature);
  // });

  // ── Layer 7: Hover highlight ──────────────────────────────────────────────
  const toolsWithHover = ['tile', 'feature', 'road', 'river'];
  if (state.hoveredHex && toolsWithHover.includes(state.selectedTool)) {
    const { x, y } = hexToPixel(state.hoveredHex.q, state.hoveredHex.r);
    drawHoverHighlight(ctx, x, y, HEX_SIZE, state.isErasing);
  }

  ctx.restore();
}
