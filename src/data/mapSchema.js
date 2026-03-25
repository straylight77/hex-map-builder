// ---------------------------------------------------------------------------
// Map data schema
// ---------------------------------------------------------------------------
// This module owns the shape of the map document. All state that gets saved
// to disk or localStorage lives here. Rendering and UI code should import
// these factories rather than constructing objects inline.

/**
 * Default spline settings applied to new roads and rivers.
 * Users can override these per-path.
 *
 * tension: 0 = straight polyline segments, 1 = highly curved.
 *   Catmull-Rom uses this as the alpha parameter.
 * enabled: when false the path renders as a plain polyline regardless of tension.
 */
export const DEFAULT_SPLINE = {
  enabled: true,
  tension: 0.5,
};

export const DEFAULT_ROAD_STYLE = {
  width: 4,
  color: '#8B7355',
  dash: [],          // [] = solid, [8,4] = dashed, etc.
  spline: { ...DEFAULT_SPLINE },
};

export const DEFAULT_RIVER_STYLE = {
  width: 5,
  color: '#5B9BD5',
  dash: [],
  spline: { ...DEFAULT_SPLINE, tension: 0.6 },
};

/**
 * Create a fresh, empty map document.
 * @param {{ width?: number, height?: number }} [opts]
 * @returns {MapDocument}
 */
export function createEmptyMap({ width = 20, height = 20 } = {}) {
  return {
    version: '2.0',
    dimensions: { width, height },
    tiles: new Map(),       // Map<"q,r", { type: string }>
    features: new Map(),    // Map<"q,r", { type: string, rotation?: number }>
    roads: [],              // PathObject[]
    rivers: [],             // PathObject[]
  };
}

/**
 * Create a new road path object.
 * @param {Array<{q:number, r:number}>} hexPath
 * @param {Partial<typeof DEFAULT_ROAD_STYLE>} [styleOverrides]
 * @returns {PathObject}
 */
export function createRoad(hexPath, styleOverrides = {}) {
  return {
    id: crypto.randomUUID(),
    path: hexPath,
    style: { ...DEFAULT_ROAD_STYLE, ...styleOverrides },
  };
}

/**
 * Create a new river path object.
 * @param {Array<{q:number, r:number}>} hexPath
 * @param {Partial<typeof DEFAULT_RIVER_STYLE>} [styleOverrides]
 * @returns {PathObject}
 */
export function createRiver(hexPath, styleOverrides = {}) {
  return {
    id: crypto.randomUUID(),
    path: hexPath,
    style: { ...DEFAULT_RIVER_STYLE, ...styleOverrides },
  };
}

// ---------------------------------------------------------------------------
// Serialisation helpers
// ---------------------------------------------------------------------------
// Maps are not JSON-serialisable by default, so we convert to/from plain arrays.

/**
 * Serialise a MapDocument to a plain JSON-compatible object.
 * @param {MapDocument} doc
 * @returns {object}
 */
export function serialiseMap(doc) {
  return {
    version: doc.version,
    dimensions: doc.dimensions,
    tiles: Array.from(doc.tiles.entries()),
    features: Array.from(doc.features.entries()),
    roads: doc.roads,
    rivers: doc.rivers,
    metadata: {
      modified: Date.now(),
    },
  };
}

/**
 * Deserialise a plain object (from JSON.parse) into a MapDocument.
 * Handles both the old v1 format (tiles only) and the new v2 format.
 * @param {object} raw
 * @returns {MapDocument}
 */
export function deserialiseMap(raw) {
  // v1 compat: old saves stored tiles as a plain object, not an array of entries
  let tilesEntries;
  if (Array.isArray(raw.tiles)) {
    tilesEntries = raw.tiles;
  } else if (raw.tiles && typeof raw.tiles === 'object') {
    tilesEntries = Object.entries(raw.tiles);
  } else {
    tilesEntries = [];
  }

  return {
    version: '2.0',
    dimensions: raw.dimensions ?? { width: 20, height: 20 },
    tiles: new Map(tilesEntries),
    features: new Map(Array.isArray(raw.features) ? raw.features : []),
    roads: raw.roads ?? [],
    rivers: raw.rivers ?? [],
  };
}
