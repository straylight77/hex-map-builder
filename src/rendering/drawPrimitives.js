import { HEX_SIZE } from '../utils/hex.js';
import { TERRAIN_MAP } from '../data/terrain.js';
import { FEATURE_MAP, FEATURE_SIZES, DEFAULT_FEATURE_COLOR } from '../data/features.js';

// ---------------------------------------------------------------------------
// Hex shape
// ---------------------------------------------------------------------------

export function drawHex(ctx, x, y, size, fillColor, stroke=true, strokeColor='#000', strokeWidth=1) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    const hx = x + size * Math.cos(angle);
    const hy = y + size * Math.sin(angle);
    if (i === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
  }
  ctx.closePath();
  if (fillColor) { ctx.fillStyle = fillColor; ctx.fill(); }
  if (stroke)    { ctx.strokeStyle = strokeColor; ctx.lineWidth = strokeWidth; ctx.stroke(); }
}

// ---------------------------------------------------------------------------
// Tile
// ---------------------------------------------------------------------------

export function drawTile(ctx, x, y, terrainId, size = HEX_SIZE, tileData = null) {
  const terrain = TERRAIN_MAP[terrainId];
  if (!terrain) return;

  // For custom tiles, use the per-hex stored color
  const fillColor = (terrain.isCustom && tileData?.customColor)
    ? tileData.customColor
    : terrain.color;

  drawHex(ctx, x, y, size, fillColor, false);

  if (terrain.drawPattern) {
    ctx.save();
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#000';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.4;
    terrain.drawPattern(ctx, x, y, size);
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Grid lines
// ---------------------------------------------------------------------------

export function drawGridHex(ctx, x, y, size, hasTile) {
  drawHex(ctx, x, y, size, null, true, hasTile ? '#333' : '#999', hasTile ? 1 : 0.5);
}

// ---------------------------------------------------------------------------
// Hover highlight
// ---------------------------------------------------------------------------

export function drawHoverHighlight(ctx, x, y, size, erasing) {
  drawHex(ctx, x, y, size, null, true, erasing ? '#ff6b6b' : '#60a5fa', 3);
}

// ---------------------------------------------------------------------------
// Tile preview (sidebar)
// ---------------------------------------------------------------------------

export function renderTilePreview(canvas, terrain, displaySize, customColor = null) {
  const fullSize = HEX_SIZE;
  const tempSize = fullSize * 3;
  const temp = document.createElement('canvas');
  temp.width = tempSize; temp.height = tempSize;
  const tCtx = temp.getContext('2d');
  tCtx.save();
  tCtx.translate(tempSize / 2, tempSize / 2);

  const fillColor = (terrain.isCustom && customColor) ? customColor : terrain.color;

  drawHex(tCtx, 0, 0, fullSize, fillColor, true, '#555', 2);
  if (terrain.drawPattern) {
    tCtx.strokeStyle = '#000'; tCtx.fillStyle = '#000';
    tCtx.lineWidth = 2; tCtx.globalAlpha = 0.4;
    terrain.drawPattern(tCtx, 0, 0, fullSize);
  }
  tCtx.restore();
  canvas.width = displaySize * 2; canvas.height = displaySize * 2;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(temp, 0, 0, tempSize, tempSize, 0, 0, canvas.width, canvas.height);
}

// ---------------------------------------------------------------------------
// Feature stamp
// ---------------------------------------------------------------------------

/**
 * Draw a feature icon centered at pixel position (x, y).
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {{ id, color, size, rotation }} featureData
 */
export function drawFeature(ctx, x, y, featureData) {
  const icon = FEATURE_MAP[featureData.id];
  if (!icon) return;

  const sizeMultiplier = FEATURE_SIZES[featureData.size ?? 'medium'] ?? 1.0;
  const color          = featureData.color ?? DEFAULT_FEATURE_COLOR;
  const rotationRad    = ((featureData.rotation ?? 0) * Math.PI) / 180;

  ctx.save();
  ctx.translate(x, y);
  if (rotationRad !== 0) ctx.rotate(rotationRad);
  ctx.scale(sizeMultiplier, sizeMultiplier);

  icon.draw(ctx, color);

  ctx.restore();
}
