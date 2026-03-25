// Each terrain entry describes a tile type.
// The `draw` function is called with (ctx, x, y, size) and handles
// all pattern rendering for that terrain. This replaces the monolithic
// switch statement in drawPattern.
//
// Color is the fill color. Pattern functions receive a pre-clipped context
// centered on (x, y) with globalAlpha already set to 0.4 for pattern ink.
// Reset globalAlpha inside your function if you need full opacity for part of it.

const SCALE = 1.3;

function drawFarmland(ctx, x, y) {
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 2.5;

  const quadrants = [
    { cx: x - 15 * SCALE, cy: y - 15 * SCALE, rotation: 0 },
    { cx: x + 15 * SCALE, cy: y - 15 * SCALE, rotation: Math.PI / 2 },
    { cx: x - 15 * SCALE, cy: y + 15 * SCALE, rotation: Math.PI / 2 },
    { cx: x + 15 * SCALE, cy: y + 15 * SCALE, rotation: 0 },
  ];

  quadrants.forEach(({ cx, cy, rotation }) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-12 * SCALE, i * 6 * SCALE);
      ctx.lineTo(12 * SCALE, i * 6 * SCALE);
      ctx.stroke();
    }
    ctx.restore();
  });
}

function drawPeaks(ctx, x, y) {
  for (let i = 0; i < 3; i++) {
    const px = x - 26 * SCALE + i * 26 * SCALE;
    const py = y + 18 * SCALE;
    ctx.beginPath();
    ctx.moveTo(px - 10 * SCALE, py + 10 * SCALE);
    ctx.lineTo(px, py - 10 * SCALE);
    ctx.lineTo(px + 10 * SCALE, py + 10 * SCALE);
    ctx.stroke();
  }
  for (let i = 0; i < 2; i++) {
    const px = x - 13 * SCALE + i * 26 * SCALE;
    const py = y - 15 * SCALE;
    ctx.beginPath();
    ctx.moveTo(px - 10 * SCALE, py + 10 * SCALE);
    ctx.lineTo(px, py - 10 * SCALE);
    ctx.lineTo(px + 10 * SCALE, py + 10 * SCALE);
    ctx.stroke();
  }
}

function drawLargePeak(ctx, x, y) {
  ctx.beginPath();
  ctx.moveTo(x - 30 * SCALE, y + 25 * SCALE);
  ctx.lineTo(x, y - 25 * SCALE);
  ctx.lineTo(x + 30 * SCALE, y + 25 * SCALE);
  ctx.stroke();

  const savedAlpha = ctx.globalAlpha;
  ctx.beginPath();
  ctx.moveTo(x - 10 * SCALE, y - 10 * SCALE);
  ctx.lineTo(x, y - 25 * SCALE);
  ctx.lineTo(x + 10 * SCALE, y - 10 * SCALE);
  ctx.closePath();
  ctx.fillStyle = '#fff';
  ctx.globalAlpha = 0.6;
  ctx.fill();
  ctx.globalAlpha = savedAlpha;
}

function drawVolcano(ctx, x, y) {
  ctx.beginPath();
  ctx.moveTo(x - 28 * SCALE, y + 20 * SCALE);
  ctx.lineTo(x - 8 * SCALE, y - 20 * SCALE);
  ctx.lineTo(x + 8 * SCALE, y - 20 * SCALE);
  ctx.lineTo(x + 28 * SCALE, y + 20 * SCALE);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - 8 * SCALE, y - 20 * SCALE);
  ctx.lineTo(x - 5 * SCALE, y - 15 * SCALE);
  ctx.lineTo(x + 5 * SCALE, y - 15 * SCALE);
  ctx.lineTo(x + 8 * SCALE, y - 20 * SCALE);
  ctx.stroke();

  const savedAlpha = ctx.globalAlpha;
  ctx.fillStyle = '#ff4500';
  ctx.globalAlpha = 0.3;
  ctx.fillRect(x - 5 * SCALE, y - 20 * SCALE, 10 * SCALE, 5 * SCALE);
  ctx.globalAlpha = savedAlpha;
}

function drawWavy(ctx, x, y) {
  for (let i = 0; i < 2; i++) {
    const py = y - 13 * SCALE + i * 26 * SCALE;
    ctx.beginPath();
    ctx.moveTo(x - 33 * SCALE, py);
    ctx.quadraticCurveTo(x - 20 * SCALE, py - 7 * SCALE, x - 7 * SCALE, py);
    ctx.quadraticCurveTo(x + 7 * SCALE, py + 7 * SCALE, x + 20 * SCALE, py);
    ctx.quadraticCurveTo(x + 33 * SCALE, py - 7 * SCALE, x + 40 * SCALE, py);
    ctx.stroke();
  }
}

function drawTrees(ctx, x, y) {
  const positions = [
    [-25, -10], [-8, -18], [8, -10], [25, -2],
    [-17, 8], [0, 3], [17, 8],
    [-8, 20], [8, 20],
  ];
  const treeSize = 5;
  positions.forEach(([px, py]) => {
    ctx.beginPath();
    ctx.moveTo(x + px * SCALE - treeSize * SCALE, y + py * SCALE + 8 * SCALE);
    ctx.lineTo(x + px * SCALE, y + py * SCALE - 8 * SCALE);
    ctx.lineTo(x + px * SCALE + treeSize * SCALE, y + py * SCALE + 8 * SCALE);
    ctx.closePath();
    ctx.fill();
  });
}

function drawDenseTrees(ctx, x, y) {
  const positions = [
    [-28, -15], [-14, -20], [0, -24], [14, -20], [28, -15],
    [-21, -5], [-7, -8], [7, -8], [21, -5],
    [-14, 5], [0, 2], [14, 5],
    [-21, 15], [-7, 18], [7, 18], [21, 15],
    [-14, 25], [0, 28], [14, 25],
  ];
  const treeSize = 5;
  positions.forEach(([px, py]) => {
    ctx.beginPath();
    ctx.moveTo(x + px * SCALE - treeSize * SCALE, y + py * SCALE + 8 * SCALE);
    ctx.lineTo(x + px * SCALE, y + py * SCALE - 8 * SCALE);
    ctx.lineTo(x + px * SCALE + treeSize * SCALE, y + py * SCALE + 8 * SCALE);
    ctx.closePath();
    ctx.fill();
  });
}

function drawWaves(ctx, x, y) {
  for (let i = 0; i < 3; i++) {
    const py = y - 20 * SCALE + i * 20 * SCALE;
    ctx.beginPath();
    ctx.moveTo(x - 30 * SCALE, py);
    for (let j = 0; j < 3; j++) {
      const cx = x - 30 * SCALE + j * 20 * SCALE;
      ctx.quadraticCurveTo(cx + 7 * SCALE, py - 5 * SCALE, cx + 10 * SCALE, py);
      ctx.quadraticCurveTo(cx + 13 * SCALE, py + 5 * SCALE, cx + 20 * SCALE, py);
    }
    ctx.stroke();
  }
}

function drawShallowWaves(ctx, x, y) {
  for (let i = 0; i < 2; i++) {
    const py = y - 13 * SCALE + i * 26 * SCALE;
    ctx.beginPath();
    ctx.moveTo(x - 33 * SCALE, py);
    for (let j = 0; j < 3; j++) {
      const cx = x - 33 * SCALE + j * 22 * SCALE;
      ctx.quadraticCurveTo(cx + 7 * SCALE, py - 4 * SCALE, cx + 11 * SCALE, py);
      ctx.quadraticCurveTo(cx + 15 * SCALE, py + 4 * SCALE, cx + 22 * SCALE, py);
    }
    ctx.stroke();
  }
}

function drawRoughWaves(ctx, x, y) {
  ctx.strokeStyle = '#87CEEB';
  for (let i = 0; i < 4; i++) {
    const py = y - 20 * SCALE + i * 13 * SCALE;
    ctx.beginPath();
    ctx.moveTo(x - 33 * SCALE, py);
    for (let j = 0; j < 5; j++) {
      const cx = x - 33 * SCALE + j * 13 * SCALE;
      ctx.quadraticCurveTo(cx + 3 * SCALE, py - 6 * SCALE, cx + 7 * SCALE, py);
      ctx.quadraticCurveTo(cx + 10 * SCALE, py + 6 * SCALE, cx + 13 * SCALE, py);
    }
    ctx.stroke();
  }
}

function drawDots(ctx, x, y) {
  const dotPos = [
    [-20, -20], [0, -13], [20, -20],
    [-27, 0], [-7, 7], [13, 0], [27, 7],
    [-13, 20], [7, 24],
  ];
  dotPos.forEach(([px, py]) => {
    ctx.beginPath();
    ctx.arc(x + px * SCALE, y + py * SCALE, 2 * SCALE, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawReeds(ctx, x, y) {
  const reedPos = [-20, -7, 7, 20];
  reedPos.forEach(px => {
    ctx.beginPath();
    ctx.moveTo(x + px * SCALE, y + 20 * SCALE);
    ctx.lineTo(x + px * SCALE, y - 20 * SCALE);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + px * SCALE, y - 13 * SCALE);
    ctx.lineTo(x + px * SCALE - 4 * SCALE, y - 7 * SCALE);
    ctx.stroke();
  });
}

// ---------------------------------------------------------------------------
// Terrain tile definitions
// ---------------------------------------------------------------------------
// `drawPattern` receives (ctx, x, y, size) where ctx already has globalAlpha=0.4
// and strokeStyle/fillStyle set to a sensible ink color.
// Return nothing; just draw.
// Set pattern: null for solid fills with no pattern overlay.

export const TERRAIN_TILES = [
  {
    id: 'plains',
    name: 'Plains',
    color: '#B4F157',
    drawPattern: null,
  },
  {
    id: 'farmland',
    name: 'Farmland',
    color: '#B4F157',
    drawPattern: drawFarmland,
  },
  {
    id: 'forest',
    name: 'Forest',
    color: '#4CAF50',
    drawPattern: drawTrees,
  },
  {
    id: 'dense-forest',
    name: 'Dense Forest',
    color: '#2E7D32',
    drawPattern: drawDenseTrees,
  },
  {
    id: 'hills',
    name: 'Hills',
    color: '#E8D4B8',
    drawPattern: drawWavy,
  },
  {
    id: 'mountain-range',
    name: 'Mountain Range',
    color: '#B09877',
    drawPattern: drawPeaks,
  },
  {
    id: 'large-mountain',
    name: 'Large Mountain',
    color: '#8B7768',
    drawPattern: drawLargePeak,
  },
  {
    id: 'volcano',
    name: 'Volcano',
    color: '#B36B2E',
    drawPattern: drawVolcano,
  },
  {
    id: 'water',
    name: 'Water',
    color: '#73A9D7',
    drawPattern: drawWaves,
  },
  {
    id: 'shallow-water',
    name: 'Shallow Water',
    color: '#ADE1F9',
    drawPattern: drawShallowWaves,
  },
  {
    id: 'deep-water',
    name: 'Deep Water',
    color: '#4A6B8C',
    drawPattern: drawRoughWaves,
  },
  {
    id: 'desert',
    name: 'Desert/Beach',
    color: '#F9EDBB',
    drawPattern: drawDots,
  },
  {
    id: 'swamp',
    name: 'Swamp',
    color: '#A8B5A0',
    drawPattern: drawReeds,
  },
];

// Lookup by id for O(1) access during rendering
export const TERRAIN_MAP = Object.fromEntries(
  TERRAIN_TILES.map(t => [t.id, t])
);
