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
  // Outer circle r=20 (≈25% larger than the old r=15).
  // r=20 comfortably contains the castle square (half-diagonal = 14√2 ≈ 19.8).

  // Hamlet: bare solid dot
  { id: 'waypoint', name: 'Hamlet', category: 'Settlements',
    draw(ctx, color) { circle(ctx, 9, color, null); } },

  // Village: circle + large dot inside
  { id: 'hamlet', name: 'Village', category: 'Settlements',
    draw(ctx, color) {
      circle(ctx, 20, null, color, 2.5);
      circle(ctx, 9, color, null);
    } },

  // Town: circle + filled square inside (was Town)
  { id: 'town', name: 'Town', category: 'Settlements',
    draw(ctx, color) {
      circle(ctx, 20, null, color, 2.5);
      rect(ctx, -9, -9, 18, 18, color, null);
    } },

  // City: circle + filled star inside
  { id: 'city', name: 'City', category: 'Settlements',
    draw(ctx, color) {
      circle(ctx, 20, null, color, 2.5);
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        const r = i % 2 === 0 ? 14 : 6;
        pts.push([Math.cos(angle) * r, Math.sin(angle) * r]);
      }
      poly(ctx, pts, color, null);
    } },

  // Homestead: circle + house inside, ~20% smaller house
  { id: 'homestead', name: 'Homestead', category: 'Settlements',
    draw(ctx, color) {
      circle(ctx, 20, null, color, 2.5);
      ctx.fillStyle = color;
      ctx.fillRect(-7, -1, 14, 10);
      poly(ctx, [[-10, -1], [0, -11], [10, -1]], color, null);
    } },

  // Ruined Settlement: three solid dots arranged in a triangle
  { id: 'ruined-settlement', name: 'Ruined Settlement', category: 'Settlements',
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
        circle(ctx, 5, color, null);
        ctx.restore();
      });
    } },

  // ── MILITARY / FORTIFICATIONS ────────────────────────────────────────────────

  { id: 'castle', name: 'Square (solid)', category: 'Military / Fortifications',
    draw(ctx, color) { rect(ctx, -14, -14, 28, 28, color, null); } },

  { id: 'ruined-castle', name: 'Square (outline)', category: 'Military / Fortifications',
    draw(ctx, color) { rect(ctx, -14, -14, 28, 28, null, color, 2.5); } },

  { id: 'fort', name: 'Fort', category: 'Military / Fortifications',
    draw(ctx, color) { poly(ctx, [[0,-18],[18,0],[0,18],[-18,0]], color, null); } },

  { id: 'ruined-fort', name: 'Ruined Fort', category: 'Military / Fortifications',
    draw(ctx, color) { poly(ctx, [[0,-18],[18,0],[0,18],[-18,0]], null, color, 2.5); } },

  { id: 'tower', name: 'Tower', category: 'Military / Fortifications',
    draw(ctx, color) {
      // Cap with 2 rampart cutouts (one central gap, two merlons).
      // Cap spans x:-11..11, y:-19..-7. Gap 8px wide centered, 5px deep.
      const capTop = -19, capBot = -7, capL = -11, capR = 11;
      const cutY = capTop + 5; // y=-14
      const gL = -4, gR = 4;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(capL, capBot);
      ctx.lineTo(capL, capTop);
      ctx.lineTo(gL,   capTop);
      ctx.lineTo(gL,   cutY);
      ctx.lineTo(gR,   cutY);
      ctx.lineTo(gR,   capTop);
      ctx.lineTo(capR, capTop);
      ctx.lineTo(capR, capBot);
      ctx.closePath();
      ctx.fill();
      rect(ctx, -6, -7, 12, 26, color, null);
    } },

  { id: 'broken-tower', name: 'Broken Tower', category: 'Military / Fortifications',
    draw(ctx, color) {
      ctx.strokeStyle = color;
      ctx.fillStyle   = color;
      ctx.lineWidth   = 2;
      ctx.lineJoin    = 'round';
      ctx.lineCap     = 'round';

      // Shaft — outline only (no fill), same dimensions as Tower
      ctx.strokeRect(-6, -7, 12, 26);

      // Broken cap — left merlon intact, right side jagged/crumbling.
      // Outline only. Path traces the crenellated-then-irregular top.
      ctx.beginPath();
      ctx.moveTo(-6,  -7);   // bottom-left of cap (joins shaft top-left)
      ctx.lineTo(-11, -7);   // step out to cap left edge
      ctx.lineTo(-11, -19);  // left merlon — full height
      ctx.lineTo(-4,  -19);  // left merlon top
      ctx.lineTo(-4,  -14);  // drop into gap
      ctx.lineTo(-1,  -14);  // gap bottom — then right side is broken
      ctx.lineTo( 2,  -17);  // jagged up
      ctx.lineTo( 5,  -13);  // jagged down
      ctx.lineTo( 8,  -18);  // jagged up
      ctx.lineTo(11,  -15);  // broken right edge top
      ctx.lineTo(11,   -7);  // right edge down to cap bottom
      ctx.closePath();
      ctx.stroke();

      // Fallen cap fragment — larger tilted block beside the shaft
      ctx.save();
      ctx.translate(15, 10);
      ctx.rotate(28 * Math.PI / 180);
      ctx.fillRect(-7, -4, 14, 7);
      ctx.restore();

      // Rubble at base — three larger spread solid rotated blocks
      ctx.save();
      ctx.translate(-13, 16);
      ctx.rotate(-18 * Math.PI / 180);
      ctx.fillRect(-6, -3.5, 12, 7);
      ctx.restore();

      ctx.save();
      ctx.translate(4, 20);
      ctx.rotate(12 * Math.PI / 180);
      ctx.fillRect(-5, -3, 10, 6);
      ctx.restore();

      ctx.save();
      ctx.translate(14, 18);
      ctx.rotate(-8 * Math.PI / 180);
      ctx.fillRect(-4, -2.5, 8, 5);
      ctx.restore();
    } },

  { id: 'ruins', name: 'Ruins', category: 'Military / Fortifications',
    draw(ctx, color) {
      ctx.strokeStyle = color;
      ctx.fillStyle   = color;
      ctx.lineWidth   = 2;
      ctx.lineJoin    = 'round';
      ctx.lineCap     = 'round';

      // Left wall — tall, ragged top
      ctx.beginPath();
      ctx.moveTo(-15,  14);
      ctx.lineTo(-15, -16);
      ctx.lineTo(-12, -19);
      ctx.lineTo( -9, -15);
      ctx.lineTo( -6, -18);
      ctx.lineTo( -6,  -7);
      ctx.stroke();

      // Bottom sill
      ctx.beginPath();
      ctx.moveTo(-15, 14);
      ctx.lineTo( 14, 14);
      ctx.stroke();

      // Right wall — shorter, independently ragged top
      ctx.beginPath();
      ctx.moveTo(14,  14);
      ctx.lineTo(14,  -5);
      ctx.lineTo(11,  -9);
      ctx.lineTo( 8,  -5);
      ctx.lineTo( 6, -11);
      ctx.lineTo( 3,  -8);
      ctx.stroke();

      // Dashed interior floor hint
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(-6, 7);
      ctx.lineTo( 8, 7);
      ctx.stroke();
      ctx.setLineDash([]);

      // Rubble — four larger spread solid rotated blocks
      ctx.save();
      ctx.translate(-9, 18);
      ctx.rotate(10 * Math.PI / 180);
      ctx.fillRect(-6, -3.5, 12, 7);
      ctx.restore();

      ctx.save();
      ctx.translate(5, 19);
      ctx.rotate(-14 * Math.PI / 180);
      ctx.fillRect(-5, -3, 10, 6);
      ctx.restore();

      ctx.save();
      ctx.translate(14, 17);
      ctx.rotate(8 * Math.PI / 180);
      ctx.fillRect(-4, -3, 8, 6);
      ctx.restore();

      ctx.save();
      ctx.translate(0, 10);
      ctx.rotate(-6 * Math.PI / 180);
      ctx.fillRect(-4, -2.5, 8, 5);
      ctx.restore();
    } },

  // Castle: wide rect, merlons at outer edges + center, tall arched entrance.
  // Layout: left merlon -18..-10, gap -10..-4, center merlon -4..4,
  //         gap 4..10, right merlon 10..18. Merlons rise 8px above body.
  // Entrance: square base x:-4..4 y:4..14 + semicircle r=4 at y=4 (evenodd).
  { id: 'new-castle', name: 'Castle', category: 'Military / Fortifications',
    draw(ctx, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      // Crenellated profile — merlons flush with outer walls + one center merlon
      ctx.moveTo(-18,  14);  // bottom-left
      ctx.lineTo(-18, -18);  // up left merlon outer edge (flush with wall)
      ctx.lineTo(-10, -18);  // left merlon top
      ctx.lineTo(-10, -10);  // drop to body top (gap)
      ctx.lineTo( -4, -10);  // across gap
      ctx.lineTo( -4, -18);  // up center merlon
      ctx.lineTo(  4, -18);  // center merlon top
      ctx.lineTo(  4, -10);  // drop to body top (gap)
      ctx.lineTo( 10, -10);  // across gap
      ctx.lineTo( 10, -18);  // up right merlon
      ctx.lineTo( 18, -18);  // right merlon top (flush with wall)
      ctx.lineTo( 18,  14);  // down right wall
      ctx.closePath();
      // Entrance hole: square base + semicircle arch on top (counter-clockwise)
      // Square: x -4..4, y 4..14
      ctx.moveTo( 4, 14);
      ctx.lineTo( 4,  4);
      ctx.arc(0, 4, 4, 0, Math.PI, true); // semicircle top of entrance
      ctx.lineTo(-4, 14);
      ctx.closePath();
      ctx.fill('evenodd');
    } },

  // Ruined Castle: inverted ramparts, outline-only, bold diagonal crack,
  // broken right wall, taller entrance, rubble at base.
  { id: 'new-ruined-castle', name: 'Ruined Castle', category: 'Military / Fortifications',
    draw(ctx, color) {
      ctx.strokeStyle = color;
      ctx.fillStyle   = color;
      ctx.lineWidth   = 2;
      ctx.lineJoin    = 'round';
      ctx.lineCap     = 'round';

      // Left wall + left merlon — intact
      ctx.beginPath();
      ctx.moveTo(-18,  14);
      ctx.lineTo(-18, -18);  // flush left merlon
      ctx.lineTo(-10, -18);
      ctx.lineTo(-10, -10);  // drop to body
      ctx.lineTo( -4, -10);
      ctx.lineTo( -4, -18);  // center merlon
      ctx.lineTo(  4, -18);
      ctx.lineTo(  4, -10);  // drop to body
      ctx.lineTo( 10, -10);
      ctx.stroke();

      // Right merlon + right wall — crumbled: merlon top jagged, wall broken
      ctx.beginPath();
      ctx.moveTo(10, -10);
      ctx.lineTo(10, -18);   // up into right merlon
      ctx.lineTo(14, -18);   // partial top
      ctx.lineTo(16, -14);   // jagged break mid-merlon
      ctx.lineTo(19, -16);
      ctx.lineTo(18, -10);   // down to body level
      ctx.lineTo(18,  2);    // right wall — stops well short of bottom
      ctx.stroke();

      // Bold diagonal crack: top-right to bottom-left across the body
      // from (14, -10) slicing down to (-14, 14)
      ctx.beginPath();
      ctx.moveTo( 14, -10);
      ctx.lineTo(  8,  -2);  // jagged step
      ctx.lineTo( 12,   2);
      ctx.lineTo( -2,  14);  // arrives near bottom-left
      ctx.stroke();

      // Bottom — left portion only (right side crumbled)
      ctx.beginPath();
      ctx.moveTo(-18, 14);
      ctx.lineTo( -2, 14);
      ctx.stroke();

      // Entrance: square base + arch outline (taller, matches castle)
      ctx.beginPath();
      ctx.moveTo(-4, 14);
      ctx.lineTo(-4,  4);
      ctx.arc(0, 4, 4, Math.PI, 0);
      ctx.lineTo( 4, 14);
      ctx.stroke();

      // Rubble — three spread blocks
      ctx.save();
      ctx.translate(-8, 18);
      ctx.rotate(10 * Math.PI / 180);
      ctx.fillRect(-6, -3.5, 12, 7);
      ctx.restore();

      ctx.save();
      ctx.translate(6, 20);
      ctx.rotate(-14 * Math.PI / 180);
      ctx.fillRect(-5, -3, 10, 6);
      ctx.restore();

      ctx.save();
      ctx.translate(17, 16);
      ctx.rotate(8 * Math.PI / 180);
      ctx.fillRect(-5, -3, 9, 6);
      ctx.restore();
    } },

  // ── MYSTICAL / ANCIENT ───────────────────────────────────────────────────────

  { id: 'obelisk', name: 'Obelisk', category: 'Mystical / Ancient',
    draw(ctx, color) {
      rect(ctx, -6, -8, 12, 24, color, null);
      poly(ctx, [[-6,-8],[6,-8],[0,-24]], color, null);
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

  // Bridge: two parallel horizontal bars with angled legs at each end.
  { id: 'bridge', name: 'Bridge', category: 'Other',
    draw(ctx, color) {
      ctx.strokeStyle = color;
      ctx.lineWidth   = 3.5;
      ctx.lineJoin    = 'miter';
      ctx.lineCap     = 'square';
      ctx.setLineDash([]);

      const barY1 = -6, barY2 = 6;
      const barX1 = -11, barX2 = 11;
      const ld = 9 * 0.707; // 45° leg offset ≈6.4

      ctx.beginPath();
      ctx.moveTo(barX1 - ld, barY1 - ld);
      ctx.lineTo(barX1, barY1);
      ctx.lineTo(barX2, barY1);
      ctx.lineTo(barX2 + ld, barY1 - ld);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(barX1 - ld, barY2 + ld);
      ctx.lineTo(barX1, barY2);
      ctx.lineTo(barX2, barY2);
      ctx.lineTo(barX2 + ld, barY2 + ld);
      ctx.stroke();

      ctx.lineCap = 'butt';
    } },

  // Ford: shallow river crossing — two straight parallel dashed lines.
  { id: 'ford', name: 'Ford', category: 'Other',
    draw(ctx, color) {
      ctx.strokeStyle = color;
      ctx.lineWidth   = 3.5;
      ctx.lineCap     = 'round';
      ctx.setLineDash([3, 5]);

      ctx.beginPath();
      ctx.moveTo(-14, -6);
      ctx.lineTo( 14, -6);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-14,  6);
      ctx.lineTo( 14,  6);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.lineCap = 'butt';
    } },

  // Lair: bear paw print — large palm pad + 4 toe pads in arc above
  { id: 'lair', name: 'Lair', category: 'Other',
    draw(ctx, color) {
      // Palm pad — large circle, slightly below center so toes have room
      ctx.save(); ctx.translate(0, 6);
      circle(ctx, 9, color, null);
      ctx.restore();
      // Four toe pads arranged in an arc above the palm
      // Arc center at (0, 6), toe centers at radius 14, spread ±55° from top
      const palmCy = 6;
      const arcR = 14;
      const angles = [-55, -18, 18, 55].map(d => (d - 90) * Math.PI / 180);
      angles.forEach(angle => {
        ctx.save();
        ctx.translate(Math.cos(angle) * arcR, palmCy + Math.sin(angle) * arcR);
        circle(ctx, 4.5, color, null);
        ctx.restore();
      });
    } },

  // Dungeon: portcullis — Cave outline (arch + rect) stroked only, transparent inside,
  // with vertical and horizontal bars drawn as a gate/portcullis grid.
  { id: 'dungeon', name: 'Dungeon', category: 'Other',
    draw(ctx, color) {
      // Dimensions matching Cave: arch radius 11 centered at y=-2, body rect x:-11..11, y:-2..14
      const archCy = -2;
      const archR  = 11;
      const bodyL  = -11, bodyR = 11;
      const bodyT  = archCy, bodyB = 14;

      ctx.strokeStyle = color;
      ctx.lineWidth   = 2;

      // Outer outline — arch top + rectangle sides + bottom
      ctx.beginPath();
      ctx.arc(0, archCy, archR, Math.PI, 0); // semicircle top (left → right)
      ctx.lineTo(bodyR, bodyB);               // right side down
      ctx.lineTo(bodyL, bodyB);               // bottom
      ctx.lineTo(bodyL, archCy);              // left side up to arch start
      ctx.stroke();

      // Clip all bar drawing inside the arch+rect shape
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, archCy, archR, Math.PI, 0);
      ctx.lineTo(bodyR, bodyB);
      ctx.lineTo(bodyL, bodyB);
      ctx.lineTo(bodyL, archCy);
      ctx.closePath();
      ctx.clip();

      // Vertical bars — 3 bars evenly spaced inside the width
      const vBarXs = [-6, 0, 6];
      vBarXs.forEach(x => {
        ctx.beginPath();
        ctx.moveTo(x, archCy - archR); // start above arch center so bars reach top
        ctx.lineTo(x, bodyB);
        ctx.stroke();
      });

      // Horizontal bars — 3 rails evenly spaced in the body height
      const totalH = bodyB - archCy; // ~16px
      [0.28, 0.56, 0.84].forEach(t => {
        const y = archCy + totalH * t;
        ctx.beginPath();
        ctx.moveTo(bodyL, y);
        ctx.lineTo(bodyR, y);
        ctx.stroke();
      });

      ctx.restore(); // end clip
    } },
];

export const FEATURE_MAP = Object.fromEntries(FEATURE_ICONS.map(f => [f.id, f]));

export const FEATURES_BY_CATEGORY = FEATURE_CATEGORIES.map(cat => ({
  category: cat,
  features: FEATURE_ICONS.filter(f => f.category === cat),
}));
