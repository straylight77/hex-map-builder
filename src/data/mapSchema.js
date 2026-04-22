// ---------------------------------------------------------------------------
// Map data schema
// Note: default colors here must stay in sync with the first entry in each
// swatch array in SwatchColorPicker.jsx (ROAD_SWATCHES, RIVER_SWATCHES,
// TILE_SWATCHES). If you change a swatch order, update the color here too.
// ---------------------------------------------------------------------------

export const DEFAULT_SPLINE = {
  enabled: true,
  tension: 0.5,
};

export const DEFAULT_MEANDER = {
  enabled: true,
  amplitude: 0.70,   // deviation as fraction of segment length
  depth: 3,          // fractal recursion levels (1-5)
  points: 1,         // extra points injected per waypoint segment before displacement
};

export const DEFAULT_ROAD_STYLE = {
  width: 4,
  color: '#c4a882',   // matches ROAD_SWATCHES[0] in SwatchColorPicker.jsx
  dash: [],
  algorithm: 'smooth', // 'none' | 'smooth'
  spline: { ...DEFAULT_SPLINE },
};

export const DEFAULT_RIVER_STYLE = {
  width: 5,
  color: '#ADE1F9',   // matches RIVER_SWATCHES[0] (shallow water) in SwatchColorPicker.jsx
  dash: [],
  algorithm: 'meander', // 'none' | 'smooth' | 'meander'
  spline: { ...DEFAULT_SPLINE, tension: 0.6 },
  meander: { ...DEFAULT_MEANDER },
};

/**
 * The map boundary is defined by four explicit edge values in offset/axial space:
 *
 *   minR, maxR   — first and last row (axial r coordinate)
 *   minCol, maxCol — first and last column, where col = q + Math.floor(r / 2)
 *
 * This allows asymmetric resizing: adding rows to the north only changes minR,
 * leaving all other edges and all existing hex coordinates unchanged.
 *
 * A hex (q, r) is inside the map when:
 *   minR <= r <= maxR  AND  minCol <= col <= maxCol
 */

/**
 * Create a fresh, empty map document.
 * Default size is 20 columns × 20 rows, centered on (0,0).
 */
export function createEmptyMap({ cols = 20, rows = 20 } = {}) {
  const halfC = Math.floor(cols / 2);
  const halfR = Math.floor(rows / 2);
  return {
    version: '2.0',
    bounds: {
      minR:   -halfR,
      maxR:    halfR,
      minCol: -halfC,
      maxCol:  halfC,
    },
    tiles: new Map(),
    features: new Map(),
    roads: [],
    rivers: [],
  };
}

export function createRoad(hexPath, styleOverrides = {}) {
  return {
    id: crypto.randomUUID(),
    path: hexPath,
    style: { ...DEFAULT_ROAD_STYLE, ...styleOverrides },
  };
}

export function createRiver(hexPath, styleOverrides = {}) {
  return {
    id: crypto.randomUUID(),
    path: hexPath,
    style: {
      ...DEFAULT_RIVER_STYLE,
      ...styleOverrides,
      meander: { ...DEFAULT_MEANDER, ...(styleOverrides.meander ?? {}) },
    },
  };
}

// ---------------------------------------------------------------------------
// Serialisation helpers
// ---------------------------------------------------------------------------

export function serialiseMap(doc) {
  return {
    version: doc.version,
    bounds: doc.bounds,
    tiles: Array.from(doc.tiles.entries()),
    features: Array.from(doc.features.entries()),
    roads: doc.roads,
    rivers: doc.rivers,
    metadata: { modified: Date.now() },
  };
}

export function deserialiseMap(raw) {
  let tilesEntries;
  if (Array.isArray(raw.tiles)) {
    tilesEntries = raw.tiles;
  } else if (raw.tiles && typeof raw.tiles === 'object') {
    tilesEntries = Object.entries(raw.tiles);
  } else {
    tilesEntries = [];
  }

  // ── Bounds migration ──────────────────────────────────────────────────────
  // Old saves stored `dimensions: { width, height }` with the map centered on
  // (0,0). Convert to the new asymmetric bounds format transparently.
  let bounds;
  if (raw.bounds) {
    bounds = raw.bounds;
  } else {
    const w = raw.dimensions?.width  ?? 20;
    const h = raw.dimensions?.height ?? 20;
    const halfC = Math.floor(w / 2);
    const halfR = Math.floor(h / 2);
    bounds = { minR: -halfR, maxR: halfR, minCol: -halfC, maxCol: halfC };
  }

  // Migrate roads — add algorithm if missing (saved before this feature)
  const roads = (raw.roads ?? []).map(r => ({
    ...r,
    style: {
      ...DEFAULT_ROAD_STYLE,
      ...r.style,
      algorithm: r.style?.algorithm ?? 'smooth',
    },
  }));

  // Migrate rivers — add algorithm if missing, ensure meander present
  const rivers = (raw.rivers ?? []).map(r => ({
    ...r,
    style: {
      ...DEFAULT_RIVER_STYLE,
      ...r.style,
      algorithm: r.style?.algorithm ?? 'meander',
      meander: { ...DEFAULT_MEANDER, ...(r.style?.meander ?? {}) },
    },
  }));

  return {
    version: '2.0',
    bounds,
    tiles: new Map(tilesEntries),
    features: new Map(Array.isArray(raw.features) ? raw.features : []),
    roads,
    rivers,
  };
}
