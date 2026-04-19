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
  spline: { ...DEFAULT_SPLINE },
  // Roads do not meander
};

export const DEFAULT_RIVER_STYLE = {
  width: 5,
  color: '#ADE1F9',   // matches RIVER_SWATCHES[0] (shallow water) in SwatchColorPicker.jsx
  dash: [],
  algorithm: 'meander', // 'smooth' | 'meander'
  spline: { ...DEFAULT_SPLINE, tension: 0.6 },
  meander: { ...DEFAULT_MEANDER },
};

/**
 * Create a fresh, empty map document.
 */
export function createEmptyMap({ width = 20, height = 20 } = {}) {
  return {
    version: '2.0',
    dimensions: { width, height },
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
    dimensions: doc.dimensions,
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

  // Migrate rivers that lack a meander field (saved before this feature)
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
    dimensions: raw.dimensions ?? { width: 20, height: 20 },
    tiles: new Map(tilesEntries),
    features: new Map(Array.isArray(raw.features) ? raw.features : []),
    roads: raw.roads ?? [],
    rivers,
  };
}
