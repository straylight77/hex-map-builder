// ---------------------------------------------------------------------------
// Feature library
//
// draw(ctx, color) — draws centered at (0,0) at natural/medium scale.
// Caller applies ctx.scale(sizeMultiplier) before invoking.
//
// Shape / status system:
//   Settlements    → circle family
//   Fortifications → square family
//   Landmarks      → diamond family
//
//   solid         = small / humble
//   open          = established
//   nested        = major (open outer + solid inner)
//   star inside   = exceptional
//   slash         = ruined
// ---------------------------------------------------------------------------

// ── Drawing helpers ──────────────────────────────────────────────────────────

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

// Diamond helper — draws a diamond (rotated square) centered at (0,0)
function diamond(ctx, r, fill, stroke, strokeW) {
  poly(ctx, [[0,-r],[r,0],[0,r],[-r,0]], fill, stroke, strokeW);
}

// 5-pointed star centered at (0,0)
function star(ctx, outerR, innerR, fill) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    pts.push([Math.cos(angle) * r, Math.sin(angle) * r]);
  }
  poly(ctx, pts, fill, null);
}

// Cross (diagonal lines from each corner through center)
function cross(ctx, r, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth   = 2.5;
  ctx.lineCap     = 'round';
  ctx.beginPath();
  ctx.moveTo(-r,  r);
  ctx.lineTo( r, -r);
  ctx.moveTo( r,  r);
  ctx.lineTo(-r, -r);
  ctx.stroke();
  ctx.lineCap = 'butt';
}

//  Diagonal slash (bottom-left to top-right, / direction)
function slash(ctx, r, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth   = 2.5;
  ctx.lineCap     = 'round';
  ctx.beginPath();
  ctx.moveTo(-r,  r);
  ctx.lineTo( r, -r);
  ctx.stroke();
  ctx.lineCap = 'butt';
}



// ── Category list ─────────────────────────────────────────────────────────────

export const FEATURE_CATEGORIES = [
  'Settlements',
  'Fortifications',
  'Landmarks',
  'Other',
];

export const FEATURE_SIZES = {
  small:  0.65,
  medium: 1.0,
  large:  1.45,
};

export const DEFAULT_FEATURE_COLOR    = '#000000';
export const DEFAULT_FEATURE_SIZE     = 'medium';
export const DEFAULT_FEATURE_ROTATION = 0;

// ── Size constants ────────────────────────────────────────────────────────────
// Tier 1 (small): r=13 for circles/diamonds, ±13 for squares
// Tier 2 (major): outer r=15 for circles/diamonds, ±15 for squares
//                 inner r=9 for circles/diamonds, ±9 for squares
// All three families use the same numbers so symbols read as equivalent weight.

export const FEATURE_ICONS = [

  // ═══════════════════════════════════════════════════════════════════════════
  // SETTLEMENTS — circle family
  // ═══════════════════════════════════════════════════════════════════════════

  // Homestead: solid house silhouette (walls + roof, no cutouts)
  { id: 'homestead', name: 'Homestead', category: 'Settlements',
    draw(ctx, color) {
      poly(ctx, [[-11,-2],[0,-16],[11,-2]], color, null);   // roof
      rect(ctx, -11, -2, 22, 16, color, null);              // walls
    } },

  // Thorp: open circle only
  { id: 'thorp', name: 'Thorp', category: 'Settlements',
    draw(ctx, color) {
      circle(ctx, 12, color, null);
    } },

  // Village: solid circle
  { id: 'village', name: 'Village', category: 'Settlements',
    draw(ctx, color) {
      circle(ctx, 18, null, color, 2.5);
    } },

  // Town: outer open circle + inner solid circle (r=9)
  { id: 'town', name: 'Town', category: 'Settlements',
    draw(ctx, color) {
      circle(ctx, 20, null, color, 2.5);
      circle(ctx, 12, color, null);
    } },

  // City: outer open circle + inner star
  { id: 'city', name: 'City', category: 'Settlements',
    draw(ctx, color) {
      circle(ctx, 24, null, color, 2.5);
      star(ctx, 22, 10, color);
    } },

  // Ruined Settlement: open circle + slash
  { id: 'ruined-settlement', name: 'Ruined Settlement', category: 'Settlements',
    draw(ctx, color) {
      circle(ctx, 18, null, color, 2.5);
      slash(ctx, 12, color);
    } },

  // ═══════════════════════════════════════════════════════════════════════════
  // FORTIFICATIONS — square family
  // ═══════════════════════════════════════════════════════════════════════════

  // Keep: solid square
  { id: 'keep', name: 'Keep', category: 'Fortifications',
    draw(ctx, color) {
      rect(ctx, -13, -13, 26, 26, color, null);
    } },

  // Fort: open square
  { id: 'fort', name: 'Fort', category: 'Fortifications',
    draw(ctx, color) {
      rect(ctx, -18, -18, 38, 38, null, color, 2.5);
    } },

  // Castle: outer open square + inner solid square
  { id: 'castle', name: 'Castle', category: 'Fortifications',
    draw(ctx, color) {
      rect(ctx, -20, -20, 40, 40, null, color, 2.5);
      rect(ctx, -13,  -13,  26, 26, color, null);
    } },

  // Citadel: outer open square + inner star
  { id: 'citadel', name: 'Citadel', category: 'Fortifications',
    draw(ctx, color) {
      rect(ctx, -24, -24, 48, 48, null, color, 2.5);
      star(ctx, 22, 10, color);
    } },

  // Ruined Fortification: open square + slash
  { id: 'ruined-fortification', name: 'Ruined Fortification', category: 'Fortifications',
    draw(ctx, color) {
      rect(ctx, -18, -18, 38, 38, null, color, 2.5);
      slash(ctx, 18, color);
    } },

  // ═══════════════════════════════════════════════════════════════════════════
  // LANDMARKS — diamond family
  // ═══════════════════════════════════════════════════════════════════════════

  // Shrine: open diamond
  { id: 'shrine', name: 'Shrine', category: 'Landmarks',
    draw(ctx, color) {
      diamond(ctx, 16, color, null);
    } },

  // Tower: solid diamond
  { id: 'tower', name: 'Tower', category: 'Landmarks',
    draw(ctx, color) {
      diamond(ctx, 22, null, color, 2.5);
    } },

  // Abbey: outer open diamond + inner solid diamond
  { id: 'abbey', name: 'Abbey', category: 'Landmarks',
    draw(ctx, color) {
      diamond(ctx, 24, null, color, 2.5);
      diamond(ctx, 16, color, null);
    } },

  // Cathedral: outer open diamond (r=18) + inner star
  { id: 'cathedral', name: 'Cathedral', category: 'Landmarks',
    draw(ctx, color) {
      diamond(ctx, 28, null, color, 2.5);
      star(ctx, 18, 8, color);
    } },

  // Ruins: open diamond + cross
  { id: 'ruins', name: 'Ruins', category: 'Landmarks',
    draw(ctx, color) {
      diamond(ctx, 22, null, color, 2.5);
      slash(ctx, 10, color);
    } },

  // ═══════════════════════════════════════════════════════════════════════════
  // OTHER
  // ═══════════════════════════════════════════════════════════════════════════

  // Bridge: two bracket shapes (OSR bridge symbol)
  { id: 'bridge', name: 'Bridge', category: 'Other',
    draw(ctx, color) {
      ctx.strokeStyle = color; ctx.lineWidth = 3.5;
      ctx.lineJoin = 'miter'; ctx.lineCap = 'square';
      ctx.setLineDash([]);
      const ld = 9 * 0.707;
      ctx.beginPath();
      ctx.moveTo(-11 - ld, -6 - ld); ctx.lineTo(-11, -6);
      ctx.lineTo(11, -6); ctx.lineTo(11 + ld, -6 - ld);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-11 - ld, 6 + ld); ctx.lineTo(-11, 6);
      ctx.lineTo(11, 6); ctx.lineTo(11 + ld, 6 + ld);
      ctx.stroke();
      ctx.lineCap = 'butt';
    } },

  // Ford: two parallel dashed lines
  { id: 'ford', name: 'Ford', category: 'Other',
    draw(ctx, color) {
      ctx.strokeStyle = color; ctx.lineWidth = 3.5;
      ctx.lineCap = 'round'; ctx.setLineDash([3, 5]);
      ctx.beginPath(); ctx.moveTo(-14, -6); ctx.lineTo(14, -6); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-14,  6); ctx.lineTo(14,  6); ctx.stroke();
      ctx.setLineDash([]); ctx.lineCap = 'butt';
    } },

  // Mine: crossed pickaxe and hammer (X with tool heads)
  { id: 'mine', name: 'Mine', category: 'Other',
    draw(ctx, color) {
      ctx.strokeStyle = color; ctx.lineWidth = 3.5; ctx.lineCap = 'butt';
      ctx.beginPath(); ctx.moveTo(-13,-13); ctx.lineTo(13,13);  ctx.stroke();
      ctx.beginPath(); ctx.moveTo(13,-13);  ctx.lineTo(-13,13); ctx.stroke();
      // pickaxe triangle on upper-left arm
      poly(ctx, [[-18,-18],[-8.4,-16.2],[-16.2,-8.4]], color, null);
      // hammer square on upper-right arm
      ctx.save();
      ctx.translate(13,-13); ctx.rotate(-Math.PI/4);
      rect(ctx, -4.5,-4.5, 9, 9, color, null);
      ctx.restore();
    } },

  // Lair: bear paw (palm pad + 4 toe pads)
  { id: 'lair', name: 'Lair', category: 'Other',
    draw(ctx, color) {
      ctx.save(); ctx.translate(0, 6);
      circle(ctx, 9, color, null);
      ctx.restore();
      const palmCy = 6, arcR = 14;
      [-55, -18, 18, 55].map(d => (d - 90) * Math.PI / 180).forEach(angle => {
        ctx.save();
        ctx.translate(Math.cos(angle) * arcR, palmCy + Math.sin(angle) * arcR);
        circle(ctx, 4.5, color, null);
        ctx.restore();
      });
    } },

  // Cave: solid arch (semicircle + rect, no cutout)
  { id: 'cave', name: 'Cave', category: 'Other',
    draw(ctx, color) {
      ctx.fillStyle = color;
      ctx.fillRect(-11, -2, 22, 16);
      ctx.beginPath();
      ctx.arc(0, -2, 11, Math.PI, 0);
      ctx.fill();
    } },

  // Dungeon: portcullis (arch outline + bars)
  { id: 'dungeon', name: 'Dungeon', category: 'Other',
    draw(ctx, color) {
      const archCy = -2, archR = 11;
      const bodyL = -11, bodyR = 11, bodyB = 14;
      ctx.strokeStyle = color;
      ctx.lineWidth   = 2;
      // Outer outline
      ctx.beginPath();
      ctx.arc(0, archCy, archR, Math.PI, 0);
      ctx.lineTo(bodyR, bodyB);
      ctx.lineTo(bodyL, bodyB);
      ctx.lineTo(bodyL, archCy);
      ctx.stroke();
      // Bars clipped inside shape
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, archCy, archR, Math.PI, 0);
      ctx.lineTo(bodyR, bodyB);
      ctx.lineTo(bodyL, bodyB);
      ctx.lineTo(bodyL, archCy);
      ctx.closePath();
      ctx.clip();
      [-6, 0, 6].forEach(x => {
        ctx.beginPath(); ctx.moveTo(x, archCy - archR); ctx.lineTo(x, bodyB); ctx.stroke();
      });
      const totalH = bodyB - archCy;
      [0.28, 0.56, 0.84].forEach(t => {
        const y = archCy + totalH * t;
        ctx.beginPath(); ctx.moveTo(bodyL, y); ctx.lineTo(bodyR, y); ctx.stroke();
      });
      ctx.restore();
    } },

  // Barrows: ancient burial grounds (three solid dots arranged in a triangle)
  { id: 'barrows', name: 'Barrows', category: 'Other',
    draw(ctx, color) {
      // Triangle of dots: one top-center, two bottom
      const r = 13; // radius of the arrangement triangle
      const positions = [
        [0,           -r],           // top
        [-r * 0.866,  r * 0.5],      // bottom-left
        [ r * 0.866,  r * 0.5],      // bottom-right
      ];
      positions.forEach(([x, y]) => {
        ctx.save();
        ctx.translate(x, y);
        circle(ctx, 6, color, null);
        ctx.restore();
      });
      ctx.lineCap = 'butt';
     } },

  // Obelisk: shaft + pyramidion
  { id: 'obelisk', name: 'Obelisk', category: 'Other',
    draw(ctx, color) {
      rect(ctx, -6, -8, 12, 24, color, null);
      poly(ctx, [[-6,-8],[6,-8],[0,-24]], color, null);
    } },

  // Stone Circle: ring of 6 dots
  { id: 'stone-circle', name: 'Stone Circle', category: 'Other',
    draw(ctx, color) {
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        ctx.save();
        ctx.translate(Math.cos(angle) * 17, Math.sin(angle) * 17);
        circle(ctx, 4, color, null);
        ctx.restore();
      }
    } },

  // Point of Interest: solid 5-pointed star
  { id: 'poi', name: 'Point of Interest', category: 'Other',
    draw(ctx, color) {
      star(ctx, 20, 8, color);
    } },


];

export const FEATURE_MAP = Object.fromEntries(FEATURE_ICONS.map(f => [f.id, f]));

export const FEATURES_BY_CATEGORY = FEATURE_CATEGORIES.map(cat => ({
  category: cat,
  features: FEATURE_ICONS.filter(f => f.category === cat),
}));
