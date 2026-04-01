import { hexToPixel, hexKey } from '../utils/hex.js';
import { HEX_SIZE } from '../utils/hex.js';
import { drawTile, drawGridHex, drawHoverHighlight, drawHex, drawFeature } from './drawPrimitives.js';
import { drawPath, drawPathPreview } from './drawPath.js';
import { WATER_TILE_IDS } from '../data/terrain.js';

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

function drawPathHighlight(ctx, pathObj, haloColor, haloAlpha = 0.55) {
  const haloStyle = { ...pathObj.style, color: haloColor, width: pathObj.style.width + 6, dash: [] };
  ctx.save();
  ctx.globalAlpha = haloAlpha;
  drawPath(ctx, pathObj.path, haloStyle);
  ctx.restore();
  drawPath(ctx, pathObj.path, pathObj.style);
}

function isInBounds(q, r, dimensions) {
  const halfW = dimensions.width / 2;
  const halfH = dimensions.height / 2;
  return q >= -halfW && q < halfW && r >= -halfH && r < halfH;
}

function drawSelectionRing(ctx, x, y, color = '#3b82f6', width = 3) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    const hx = x + HEX_SIZE * Math.cos(angle);
    const hy = y + HEX_SIZE * Math.sin(angle);
    if (i === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

/**
 * Render order (back to front):
 *   0.  Grey fill for out-of-bounds hexes
 *   1.  Tile fills + patterns
 *   2.  Committed rivers
 *   3.  Committed roads
 *   4.  Water tiles redrawn
 *   5.  Grid lines
 *   6.  In-progress path preview
 *   7.  Features
 *   8.  Selected feature hex highlight
 *   9.  Selected tile hex highlight
 *   10. Hex hover highlight
 *   11. Path hover / selection highlights
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
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.translate(W / 2 + state.viewport.x, H / 2 + state.viewport.y);
  ctx.scale(state.viewport.scale, state.viewport.scale);

  const { minQ, maxQ, minR, maxR } = visibleRange(W, H, state.viewport);

  // ── 0. Out-of-bounds grey fill ────────────────────────────────────────────
  for (let r = minR; r <= maxR; r++) {
    for (let q = minQ; q <= maxQ; q++) {
      if (isInBounds(q, r, state.dimensions)) continue;
      const { x, y } = hexToPixel(q, r);
      drawHex(ctx, x, y, HEX_SIZE, '#b0b0b0', false);
    }
  }

  // ── 1. Tile fills ─────────────────────────────────────────────────────────
  for (let r = minR; r <= maxR; r++) {
    for (let q = minQ; q <= maxQ; q++) {
      if (!isInBounds(q, r, state.dimensions)) continue;
      const { x, y } = hexToPixel(q, r);
      const tile = state.tiles.get(hexKey(q, r));
      if (tile) drawTile(ctx, x, y, tile.type, HEX_SIZE, tile);
      else       drawHex(ctx, x, y, HEX_SIZE, '#ffffff', false);
    }
  }

  // ── 2. Rivers ─────────────────────────────────────────────────────────────
  state.rivers?.forEach(river => {
    if (river.id === state.hoveredPathId || river.id === state.selectedPathId) return;
    drawPath(ctx, river.path, river.style);
  });

  // ── 3. Roads ──────────────────────────────────────────────────────────────
  state.roads?.forEach(road => {
    if (road.id === state.hoveredPathId || road.id === state.selectedPathId) return;
    drawPath(ctx, road.path, road.style);
  });

  // ── 4. Water tiles redrawn ────────────────────────────────────────────────
  for (let r = minR; r <= maxR; r++) {
    for (let q = minQ; q <= maxQ; q++) {
      if (!isInBounds(q, r, state.dimensions)) continue;
      const tile = state.tiles.get(hexKey(q, r));
      if (tile && WATER_TILE_IDS.has(tile.type)) {
        const { x, y } = hexToPixel(q, r);
        drawTile(ctx, x, y, tile.type, HEX_SIZE, tile);
      }
    }
  }

  // ── 5. Grid lines ─────────────────────────────────────────────────────────
  if (state.showGrid) {
    for (let r = minR; r <= maxR; r++) {
      for (let q = minQ; q <= maxQ; q++) {
        const { x, y } = hexToPixel(q, r);
        const inBounds = isInBounds(q, r, state.dimensions);
        if (inBounds) {
          drawGridHex(ctx, x, y, HEX_SIZE, state.tiles.has(hexKey(q, r)));
        } else {
          drawHex(ctx, x, y, HEX_SIZE, null, true, '#888', 0.4);
        }
      }
    }
  }

  // ── 6. Path preview ───────────────────────────────────────────────────────
  if (state.activePath?.length > 0 && state.activePathStyle) {
    drawPathPreview(ctx, state.activePath, state.activePathStyle);
  }

  // ── 7. Features ───────────────────────────────────────────────────────────
  for (let r = minR; r <= maxR; r++) {
    for (let q = minQ; q <= maxQ; q++) {
      const feature = state.features?.get(hexKey(q, r));
      if (!feature) continue;
      const { x, y } = hexToPixel(q, r);
      drawFeature(ctx, x, y, feature);
    }
  }

  // ── 8. Selected feature hex highlight ─────────────────────────────────────
  if (state.selectedFeatureHex && state.selectedTool === 'feature' && state.featureToolMode === 'select') {
    const { x, y } = hexToPixel(state.selectedFeatureHex.q, state.selectedFeatureHex.r);
    drawSelectionRing(ctx, x, y, '#3b82f6', 3);
  }

  // ── 9. Selected tile hex highlight ────────────────────────────────────────
  if (state.selectedTileHex && state.selectedTool === 'tile' && state.tileToolMode === 'select') {
    const { x, y } = hexToPixel(state.selectedTileHex.q, state.selectedTileHex.r);
    drawSelectionRing(ctx, x, y, '#3b82f6', 3);
  }

  // ── 10. Hex hover highlight ───────────────────────────────────────────────
  const isPathTool = state.selectedTool === 'road' || state.selectedTool === 'river';
  const showHexHover =
    state.hoveredHex &&
    (!isPathTool || state.pathToolMode === 'draw') &&
    (state.selectedTool !== 'feature' || state.featureToolMode === 'draw' ||
     state.features?.has(hexKey(state.hoveredHex.q, state.hoveredHex.r))) &&
    ['tile', 'feature', 'road', 'river'].includes(state.selectedTool) &&
    isInBounds(state.hoveredHex.q, state.hoveredHex.r, state.dimensions);

  if (showHexHover) {
    const { x, y } = hexToPixel(state.hoveredHex.q, state.hoveredHex.r);
    drawHoverHighlight(ctx, x, y, HEX_SIZE, state.isErasing);
  }

  // ── 11. Path highlights ───────────────────────────────────────────────────
  if (state.pathToolMode === 'select' && state.hoveredPathId &&
      state.hoveredPathId !== state.selectedPathId) {
    const allPaths = [...(state.roads ?? []), ...(state.rivers ?? [])];
    const hovered = allPaths.find(p => p.id === state.hoveredPathId);
    if (hovered) drawPathHighlight(ctx, hovered, '#ef4444', 0.6);
  }

  if (state.selectedPathId) {
    const allPaths = [...(state.roads ?? []), ...(state.rivers ?? [])];
    const selected = allPaths.find(p => p.id === state.selectedPathId);
    if (selected) drawPathHighlight(ctx, selected, '#3b82f6', 0.7);
  }

  ctx.restore();
}
