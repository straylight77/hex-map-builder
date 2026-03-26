import { hexToPixel, hexKey } from '../utils/hex.js';
import { HEX_SIZE } from '../utils/hex.js';
import { drawTile, drawGridHex, drawHoverHighlight, drawHex } from './drawPrimitives.js';
import { drawPath, drawPathPreview } from './drawPath.js';

// ---------------------------------------------------------------------------
// Visible hex range
// ---------------------------------------------------------------------------

function visibleRange(canvasW, canvasH, viewport, buffer = 3) {
  const toWorld = (cx, cy) => ({
    x: (cx - canvasW / 2 - viewport.x) / viewport.scale,
    y: (cy - canvasH / 2 - viewport.y) / viewport.scale,
  });
  const corners = [
    toWorld(0, 0), toWorld(canvasW, 0),
    toWorld(0, canvasH), toWorld(canvasW, canvasH),
  ];
  const xs = corners.map(c => c.x);
  const ys = corners.map(c => c.y);
  return {
    minQ: Math.floor(Math.min(...xs) / (HEX_SIZE * Math.sqrt(3))) - buffer,
    maxQ: Math.ceil(Math.max(...xs)  / (HEX_SIZE * Math.sqrt(3))) + buffer,
    minR: Math.floor(Math.min(...ys) / (HEX_SIZE * 1.5)) - buffer,
    maxR: Math.ceil(Math.max(...ys)  / (HEX_SIZE * 1.5)) + buffer,
  };
}

// ---------------------------------------------------------------------------
// Path highlight helpers
// ---------------------------------------------------------------------------

/**
 * Draw a path with a coloured halo behind it to indicate hover or selection.
 * The halo is drawn first (wider, semi-transparent), then the normal path on top.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ path, style }} pathObj
 * @param {string} haloColor   e.g. '#ef4444' for hover-red, '#3b82f6' for select-blue
 * @param {number} haloAlpha
 */
function drawPathHighlight(ctx, pathObj, haloColor, haloAlpha = 0.55) {
  // Halo — wider, coloured
  const haloStyle = {
    ...pathObj.style,
    color: haloColor,
    width: pathObj.style.width + 6,
    dash: [],
  };
  ctx.save();
  ctx.globalAlpha = haloAlpha;
  drawPath(ctx, pathObj.path, haloStyle);
  ctx.restore();

  // Normal path on top
  drawPath(ctx, pathObj.path, pathObj.style);
}

// ---------------------------------------------------------------------------
// Main render entry point
// ---------------------------------------------------------------------------

/**
 * Full canvas redraw.
 *
 * Render order (back to front):
 *   1.  Tile fills + patterns
 *   2.  Grid lines
 *   3.  Committed rivers          ← rivers below roads
 *   4.  Committed roads           ← roads above rivers
 *   5.  In-progress path preview
 *   6.  Features  (stub)
 *   7.  Hover highlight (hex cell, draw mode only)
 *   8.  Path hover highlight      (select mode — red halo)
 *   9.  Path selection highlight  (select mode — blue halo)
 *
 * @param {HTMLCanvasElement} canvas
 * @param {{
 *   tiles: Map<string,{type:string}>,
 *   features: Map<string,{type:string,rotation?:number}>,
 *   roads: Array<{id:string, path:Array<{q,r}>, style:object}>,
 *   rivers: Array<{id:string, path:Array<{q,r}>, style:object}>,
 *   dimensions: {width:number, height:number},
 *   viewport: {x:number, y:number, scale:number},
 *   showGrid: boolean,
 *   hoveredHex: {q:number,r:number}|null,
 *   selectedTool: string,
 *   isErasing: boolean,
 *   activePath: Array<{q:number,r:number}>,
 *   activePathStyle: object|null,
 *   pathToolMode: 'draw'|'select',
 *   hoveredPathId: string|null,
 *   selectedPathId: string|null,
 * }} state
 */
export function renderMap(canvas, state) {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  if (canvas.width !== rect.width || canvas.height !== rect.height) {
    canvas.width = rect.width;
    canvas.height = rect.height;
  }

  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2 + state.viewport.x, H / 2 + state.viewport.y);
  ctx.scale(state.viewport.scale, state.viewport.scale);

  const { minQ, maxQ, minR, maxR } = visibleRange(W, H, state.viewport);

  // ── 1. Tile fills + patterns ──────────────────────────────────────────────
  for (let r = minR; r <= maxR; r++) {
    for (let q = minQ; q <= maxQ; q++) {
      const { x, y } = hexToPixel(q, r);
      const tile = state.tiles.get(hexKey(q, r));
      if (tile) {
        drawTile(ctx, x, y, tile.type);
      } else {
        drawHex(ctx, x, y, HEX_SIZE, '#ffffff', false);
      }
    }
  }

  // ── 2. Grid lines ─────────────────────────────────────────────────────────
  if (state.showGrid) {
    for (let r = minR; r <= maxR; r++) {
      for (let q = minQ; q <= maxQ; q++) {
        const { x, y } = hexToPixel(q, r);
        drawGridHex(ctx, x, y, HEX_SIZE, state.tiles.has(hexKey(q, r)));
      }
    }
  }

  // ── 3. Committed rivers (below roads) ────────────────────────────────────
  state.rivers?.forEach(river => {
    // Skip hovered/selected — drawn later with highlights
    if (river.id === state.hoveredPathId || river.id === state.selectedPathId) return;
    drawPath(ctx, river.path, river.style);
  });

  // ── 4. Committed roads (above rivers) ────────────────────────────────────
  state.roads?.forEach(road => {
    if (road.id === state.hoveredPathId || road.id === state.selectedPathId) return;
    drawPath(ctx, road.path, road.style);
  });

  // ── 5. In-progress path preview ───────────────────────────────────────────
  if (state.activePath?.length > 0 && state.activePathStyle) {
    drawPathPreview(ctx, state.activePath, state.activePathStyle);
  }

  // ── 6. Features (stub) ────────────────────────────────────────────────────
  // state.features?.forEach(...)

  // ── 7. Hex hover highlight (draw mode only) ───────────────────────────────
  const isPathTool = state.selectedTool === 'road' || state.selectedTool === 'river';
  const showHexHover =
    state.hoveredHex &&
    (!isPathTool || state.pathToolMode === 'draw') &&
    ['tile', 'feature', 'road', 'river'].includes(state.selectedTool);

  if (showHexHover) {
    const { x, y } = hexToPixel(state.hoveredHex.q, state.hoveredHex.r);
    drawHoverHighlight(ctx, x, y, HEX_SIZE, state.isErasing);
  }

  // ── 8. Hovered path highlight (select mode — red) ────────────────────────
  if (state.pathToolMode === 'select' && state.hoveredPathId) {
    // Don't double-draw if it's also the selected path
    if (state.hoveredPathId !== state.selectedPathId) {
      const allPaths = [...(state.roads ?? []), ...(state.rivers ?? [])];
      const hovered = allPaths.find(p => p.id === state.hoveredPathId);
      if (hovered) drawPathHighlight(ctx, hovered, '#ef4444', 0.6);
    }
  }

  // ── 9. Selected path highlight (select mode — blue) ──────────────────────
  if (state.selectedPathId) {
    const allPaths = [...(state.roads ?? []), ...(state.rivers ?? [])];
    const selected = allPaths.find(p => p.id === state.selectedPathId);
    if (selected) drawPathHighlight(ctx, selected, '#3b82f6', 0.7);
  }

  ctx.restore();
}
