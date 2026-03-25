import { HEX_SIZE } from '../utils/hex.js';
import { TERRAIN_MAP } from '../data/terrain.js';

// ---------------------------------------------------------------------------
// Hex shape
// ---------------------------------------------------------------------------

/**
 * Draw a single hexagon shape (fill and/or stroke).
 * The calling code is responsible for setting up the transform so that
 * (x, y) is the hex center in canvas coordinates.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x  center x
 * @param {number} y  center y
 * @param {number} size  circumradius
 * @param {string|null} fillColor  null = no fill
 * @param {boolean} stroke
 * @param {string} strokeColor
 * @param {number} strokeWidth
 */
export function drawHex(
  ctx,
  x,
  y,
  size,
  fillColor,
  stroke = true,
  strokeColor = '#000',
  strokeWidth = 1,
) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    const hx = x + size * Math.cos(angle);
    const hy = y + size * Math.sin(angle);
    if (i === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  }
  ctx.closePath();

  if (fillColor) {
    ctx.fillStyle = fillColor;
    ctx.fill();
  }

  if (stroke) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
}

// ---------------------------------------------------------------------------
// Tile (fill + pattern overlay)
// ---------------------------------------------------------------------------

/**
 * Draw a terrain tile at the given pixel center.
 * Renders the base color fill, then the terrain's pattern overlay if any.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {string} terrainId
 * @param {number} [size=HEX_SIZE]
 */
export function drawTile(ctx, x, y, terrainId, size = HEX_SIZE) {
  const terrain = TERRAIN_MAP[terrainId];
  if (!terrain) return;

  // Base fill
  drawHex(ctx, x, y, size, terrain.color, false);

  // Pattern overlay
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

/**
 * Draw just the border of a hex (no fill). Used for grid rendering.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} size
 * @param {boolean} hasTile  affects line darkness
 */
export function drawGridHex(ctx, x, y, size, hasTile) {
  drawHex(
    ctx,
    x,
    y,
    size,
    null,
    true,
    hasTile ? '#333' : '#999',
    hasTile ? 1 : 0.5,
  );
}

// ---------------------------------------------------------------------------
// Hover highlight
// ---------------------------------------------------------------------------

/**
 * Draw the hover highlight ring over a hex.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} size
 * @param {boolean} erasing  true = red highlight, false = blue
 */
export function drawHoverHighlight(ctx, x, y, size, erasing) {
  drawHex(ctx, x, y, size, null, true, erasing ? '#ff6b6b' : '#60a5fa', 3);
}

// ---------------------------------------------------------------------------
// Tile preview (for the library sidebar)
// ---------------------------------------------------------------------------

/**
 * Render a terrain tile preview onto a small canvas element.
 * Called from the TilePreview component.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {{ id: string, color: string, drawPattern: function|null }} terrain
 * @param {number} displaySize  logical display size in CSS pixels
 */
export function renderTilePreview(canvas, terrain, displaySize) {
  const fullSize = HEX_SIZE;
  const tempSize = fullSize * 3;

  // Draw at full resolution off-screen first
  const temp = document.createElement('canvas');
  temp.width = tempSize;
  temp.height = tempSize;
  const tCtx = temp.getContext('2d');

  tCtx.save();
  tCtx.translate(tempSize / 2, tempSize / 2);
  drawHex(tCtx, 0, 0, fullSize, terrain.color, true, '#555', 2);

  if (terrain.drawPattern) {
    tCtx.strokeStyle = '#000';
    tCtx.fillStyle = '#000';
    tCtx.lineWidth = 2;
    tCtx.globalAlpha = 0.4;
    terrain.drawPattern(tCtx, 0, 0, fullSize);
  }
  tCtx.restore();

  // Scale down to display canvas
  canvas.width = displaySize * 2;
  canvas.height = displaySize * 2;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(temp, 0, 0, tempSize, tempSize, 0, 0, canvas.width, canvas.height);
}
