/**
 * renderState.js
 *
 * Defines the contract between App and the renderer.
 * `buildRenderState` is the single place that assembles the renderer's
 * input object, eliminating the divergence between live-render and PNG-export
 * call sites.
 */

/**
 * Build a complete render state for the live canvas.
 *
 * @param {object} p
 * @param {object} p.mapDoc         — from useMapData
 * @param {object} p.viewport       — { x, y, scale }
 * @param {boolean} p.showGrid
 * @param {object|null} p.hoveredHex
 * @param {string} p.selectedTool
 * @param {object} p.tile           — useTileTools instance
 * @param {object} p.feature        — useFeatureTools instance
 * @param {object} p.path           — usePathTools instance
 * @param {object|null} p.activePathStyle
 * @param {boolean} p.activeToolIsErasing
 * @returns {RenderState}
 */
export function buildRenderState({
  mapDoc,
  viewport,
  showGrid,
  hoveredHex,
  selectedTool,
  tile,
  feature,
  path,
  activePathStyle,
  activeToolIsErasing,
}) {
  return {
    // Map data
    tiles:      mapDoc.tiles,
    features:   mapDoc.features,
    roads:      mapDoc.roads,
    rivers:     mapDoc.rivers,
    dimensions: mapDoc.dimensions,

    // Viewport
    viewport,
    showGrid,
    hoveredHex,

    // Tool identity
    selectedTool,
    isErasing: activeToolIsErasing,

    // Path tool
    activePath:      path.activePath,
    activePathStyle,
    pathToolMode:    path.mode,
    hoveredPathId:   path.hoveredPathId,
    selectedPathId:  path.selectedPathId,

    // Feature tool
    featureToolMode:    feature.mode,
    selectedFeatureHex: feature.selectedHex,

    // Tile tool
    tileToolMode:    tile.mode,
    selectedTileHex: tile.selectedHex,
  };
}

/**
 * Build a render state for PNG export.
 * Strips all interaction state; uses a neutral viewport so the full map is
 * rendered from origin.
 *
 * @param {object} mapDoc
 * @param {{ x:number, y:number, scale:number }} viewport
 * @returns {RenderState}
 */
export function buildExportRenderState(mapDoc, viewport) {
  return {
    tiles:      mapDoc.tiles,
    features:   mapDoc.features,
    roads:      mapDoc.roads,
    rivers:     mapDoc.rivers,
    dimensions: mapDoc.dimensions,

    viewport,
    showGrid:   true,
    hoveredHex: null,

    selectedTool: 'tile',
    isErasing:    false,

    activePath:      [],
    activePathStyle: null,
    pathToolMode:    'draw',
    hoveredPathId:   null,
    selectedPathId:  null,

    featureToolMode:    'draw',
    selectedFeatureHex: null,

    tileToolMode:    'draw',
    selectedTileHex: null,
  };
}
