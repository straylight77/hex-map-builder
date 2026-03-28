// ---------------------------------------------------------------------------
// Feature library — 22 stamp icons placed at hex centers
//
// draw(ctx, color) — draws centered at (0,0) at natural/medium scale.
// Caller applies ctx.scale(sizeMultiplier) before invoking.
// ---------------------------------------------------------------------------

function circle(ctx, r, fill, stroke, strokeW) {
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  if (fill)   { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = strokeW ?? 2.5; ctx.stroke(); }
}

function rect(ctx, x, y, w, h, fill, stroke, strokeW) {
  if (fill)   { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = strokeW ?? 2.5; ctx.strokeRect(x, y, w, h); }
}

function poly(ctx, points, fill, stroke, strokeW) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  if (fill)   { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = strokeW ?? 2.5; ctx.lineJoin = 'round'; ctx.stroke(); }
}

export const FEATURE_CATEGORIES = [
  'Settlements',
  'Military / Fortifications',
  'Mystical / Ancient',
  'Other',
];

// medium=1.0 renders the symbol at natural coordinates designed for a 70px hex.
export const FEATURE_SIZES = {
  small:  0.65,
  medium: 1.0,
  large:  1.45,
};

export const DEFAULT_FEATURE_COLOR    = '#000000';
export const DEFAULT_FEATURE_SIZE     = 'medium';
export const DEFAULT_FEATURE_ROTATION = 0;

export const FEATURE_ICONS = [

  // ── SETTLEMENTS ─────────────────────────────────────────────────────────────

  { id: 'waypoint', name: 'Waypoint', category: 'Settlements',
    draw(ctx, color) { circle(ctx, 5, color, null); } },

  { id: 'hamlet', name: 'Hamlet', category: 'Settlements',
    draw(ctx, color) {
      circle(ctx, 15, null, color, 2.5);
      circle(ctx, 5, color, null);
    } },

  { id: 'village', name: 'Village', category: 'Settlements',
    draw(ctx, color) {
      circle(ctx, 15, null, color, 2.5);
      const r = 8;
      poly(ctx, [[0, -r], [r * 0.866, r * 0.5], [-r * 0.866, r * 0.5]], color, null);
    } },

  { id: 'town', name: 'Town', category: 'Settlements',
    draw(ctx, color) {
      circle(ctx, 15, null, color, 2.5);
      rect(ctx, -7, -7, 14, 14, color, null);
    } },

  { id: 'city', name: 'City', category: 'Settlements',
    draw(ctx, color) {
      circle(ctx, 15, null, color, 2.5);
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        const r = i % 2 === 0 ? 9 : 4;
        pts.push([Math.cos(angle) * r, Math.sin(angle) * r]);
      }
      poly(ctx, pts, color, null);
    } },

  { id: 'homestead', name: 'Homestead', category: 'Settlements',
    draw(ctx, color) {
      circle(ctx, 15, null, color, 2.5);
      ctx.fillStyle = color;
      ctx.fillRect(-7, -1, 14, 9);
      poly(ctx, [[-9, -1], [0, -10], [9, -1]], color, null);
      ctx.clearRect(-2.5, 3, 5, 6);
    } },

  { id: 'ruined-settlement', name: 'Ruined Settlement', category: 'Settlements',
    draw(ctx, color) { circle(ctx, 15, null, color, 2.5); } },

  // ── MILITARY / FORTIFICATIONS ────────────────────────────────────────────────

  { id: 'castle', name: 'Castle', category: 'Military / Fortifications',
    draw(ctx, color) { rect(ctx, -14, -14, 28, 28, color, null); } },

  { id: 'ruined-castle', name: 'Ruined Castle', category: 'Military / Fortifications',
    draw(ctx, color) { rect(ctx, -14, -14, 28, 28, null, color, 2.5); } },

  { id: 'fort', name: 'Fort', category: 'Military / Fortifications',
    draw(ctx, color) { poly(ctx, [[0,-18],[18,0],[0,18],[-18,0]], color, null); } },

  { id: 'ruined-fort', name: 'Ruined Fort', category: 'Military / Fortifications',
    draw(ctx, color) { poly(ctx, [[0,-18],[18,0],[0,18],[-18,0]], null, color, 2.5); } },

  { id: 'tower', name: 'Tower', category: 'Military / Fortifications',
    draw(ctx, color) {
      rect(ctx, -11, -19, 22, 12, color, null);
      rect(ctx, -6,  -7,  12, 26, color, null);
    } },

  // ── MYSTICAL / ANCIENT ───────────────────────────────────────────────────────

  { id: 'obelisk', name: 'Obelisk', category: 'Mystical / Ancient',
    draw(ctx, color) {
      rect(ctx, -6, -8, 12, 24, color, null);
      poly(ctx, [[-6,-8],[6,-8],[0,-24]], color, null);
    } },

  { id: 'temple', name: 'Temple', category: 'Mystical / Ancient',
    draw(ctx, color) {
      circle(ctx, 15, null, color, 2.5);
      ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.lineCap = 'square';
      ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(0, 11);   ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-8, -3); ctx.lineTo(8, -3);  ctx.stroke();
      ctx.lineCap = 'butt';
    } },

  { id: 'stone-circle', name: 'Stone Circle', category: 'Mystical / Ancient',
    draw(ctx, color) {
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        ctx.save();
        ctx.translate(Math.cos(angle) * 17, Math.sin(angle) * 17);
        circle(ctx, 4, color, null);
        ctx.restore();
      }
    } },

  { id: 'pyramid', name: 'Pyramid', category: 'Mystical / Ancient',
    draw(ctx, color) { poly(ctx, [[0,-17],[17,12],[-17,12]], color, null); } },

  { id: 'ancient-ruins', name: 'Ancient Ruins', category: 'Mystical / Ancient',
    draw(ctx, color) { poly(ctx, [[0,-17],[17,12],[-17,12]], null, color, 2.5); } },

  // ── OTHER ────────────────────────────────────────────────────────────────────

  { id: 'mine', name: 'Mine', category: 'Other',
    draw(ctx, color) {
      ctx.strokeStyle = color; ctx.lineWidth = 3.5; ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.moveTo(-13,-13); ctx.lineTo(13,13);  ctx.stroke();
      ctx.beginPath(); ctx.moveTo(13,-13);  ctx.lineTo(-13,13); ctx.stroke();
      poly(ctx, [[-18,-18],[-8.4,-16.2],[-16.2,-8.4]], color, null);
      ctx.save();
      ctx.translate(13,-13); ctx.rotate(-Math.PI/4);
      rect(ctx, -4.5,-4.5, 9,9, color, null);
      ctx.restore();
    } },

  { id: 'cave', name: 'Cave', category: 'Other',
    draw(ctx, color) {
      // solid square body + semicircle arch on top — no cutout
      ctx.fillStyle = color;
      ctx.fillRect(-11, -2, 22, 16);
      ctx.beginPath();
      ctx.arc(0, -2, 11, Math.PI, 0);
      ctx.fill();
    } },

  { id: 'poi', name: 'Point of Interest', category: 'Other',
    draw(ctx, color) {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        pts.push([Math.cos(angle) * (i%2===0?20:8), Math.sin(angle) * (i%2===0?20:8)]);
      }
      poly(ctx, pts, color, null);
    } },

  { id: 'ruined-poi', name: 'Ruined POI', category: 'Other',
    draw(ctx, color) {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        pts.push([Math.cos(angle) * (i%2===0?20:8), Math.sin(angle) * (i%2===0?20:8)]);
      }
      poly(ctx, pts, null, color, 2);
    } },
];

export const FEATURE_MAP = Object.fromEntries(FEATURE_ICONS.map(f => [f.id, f]));

export const FEATURES_BY_CATEGORY = FEATURE_CATEGORIES.map(cat => ({
  category: cat,
  features: FEATURE_ICONS.filter(f => f.category === cat),
}));
