import { useRef, useEffect, useState, useCallback } from 'react';
import { renderMap } from './rendering/renderer.js';
import { buildRenderState, buildExportRenderState } from './rendering/renderState.js';
import { useViewport } from './hooks/useViewport.js';
import { useMapData } from './hooks/useMapData.js';
import { useTools } from './hooks/useTools.js';
import { pixelToHex, hexKey, HEX_SIZE } from './utils/hex.js';
import { hitTestPaths, canvasEventToWorld } from './utils/hitTest.js';
import { Toolbar } from './components/Toolbar.jsx';
import { TileLibrary } from './components/TileLibrary.jsx';
import { PathLibrary } from './components/PathLibrary.jsx';
import { FeatureLibrary } from './components/FeatureLibrary.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import { MenuBar, ExpandDialog, StatusBar } from './components/UI.jsx';

export default function App() {
  const canvasRef      = useRef(null);
  const isPaintingRef  = useRef(false);
  const [showGrid, setShowGrid]               = useState(true);
  const [showExpandDialog, setShowExpandDialog] = useState(false);
  const [hoveredHex, setHoveredHex]           = useState(null);

  const viewport = useViewport();
  const mapData  = useMapData();
  const tools    = useTools();

  const { selectedTool, tile, feature, path, activePathStyle, activeToolIsErasing } = tools;

  const isPathTool    = selectedTool === 'road' || selectedTool === 'river';
  const isFeatureTool = selectedTool === 'feature';
  const isTileTool    = selectedTool === 'tile';

  // ── Helpers ────────────────────────────────────────────────────────────────

  const activePaths = useCallback(() => {
    if (selectedTool === 'road')  return mapData.mapDoc.roads;
    if (selectedTool === 'river') return mapData.mapDoc.rivers;
    return [];
  }, [selectedTool, mapData.mapDoc.roads, mapData.mapDoc.rivers]);

  const selectedPathStyle = useCallback(() => {
    if (!path.selectedPathId) return null;
    const all = [...mapData.mapDoc.roads, ...mapData.mapDoc.rivers];
    return all.find(p => p.id === path.selectedPathId)?.style ?? null;
  }, [path.selectedPathId, mapData.mapDoc.roads, mapData.mapDoc.rivers]);

  const canvasToWorld = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvasEventToWorld(e, canvas, viewport.viewport);
  }, [viewport.viewport]);

  const canvasToHex = useCallback((e) => {
    const world = canvasToWorld(e);
    if (!world) return null;
    return pixelToHex(world.x, world.y, HEX_SIZE);
  }, [canvasToWorld]);

  const selectedFeatureData = feature.selectedHex
    ? mapData.mapDoc.features.get(hexKey(feature.selectedHex.q, feature.selectedHex.r)) ?? null
    : null;

  const selectedTileHexData = tile.selectedHex
    ? mapData.mapDoc.tiles.get(hexKey(tile.selectedHex.q, tile.selectedHex.r)) ?? null
    : null;

  // ── Canvas render ──────────────────────────────────────────────────────────

  useEffect(() => {
    renderMap(canvasRef.current, buildRenderState({
      mapDoc:     mapData.mapDoc,
      viewport:   viewport.viewport,
      showGrid,
      hoveredHex,
      selectedTool,
      tile,
      feature,
      path,
      activePathStyle,
      activeToolIsErasing,
    }));
  }, [
    mapData.mapDoc,
    viewport.viewport,
    showGrid,
    hoveredHex,
    selectedTool,
    tile,
    feature,
    path,
    activePathStyle,
    activeToolIsErasing,
  ]);

  // ── Path commit ────────────────────────────────────────────────────────────

  const handleCommitPath = useCallback(() => {
    if (!path.isDrawing) return;
    const committed = path.commitPath();
    if (!committed) return;
    if (selectedTool === 'road')  mapData.commitRoad(committed, path.roadStyle);
    if (selectedTool === 'river') mapData.commitRiver(committed, path.riverStyle);
  }, [path, selectedTool, mapData]);

  const handleDeleteSelectedPath = useCallback(() => {
    if (!path.selectedPathId) return;
    const isRoad = mapData.mapDoc.roads.some(r => r.id === path.selectedPathId);
    if (isRoad) mapData.deleteRoad(path.selectedPathId);
    else        mapData.deleteRiver(path.selectedPathId);
    path.clearSelection();
  }, [path, mapData]);

  // ── Feature actions ────────────────────────────────────────────────────────

  const handleDeleteSelectedFeature = useCallback(() => {
    if (!feature.selectedHex) return;
    mapData.removeFeature(feature.selectedHex.q, feature.selectedHex.r);
    feature.clearSelection();
  }, [feature, mapData]);

  const handleSelectFeature = useCallback((id) => {
    feature.setSelectedId(id);
    if (feature.mode === 'select' && feature.selectedHex) {
      mapData.updateFeature(feature.selectedHex.q, feature.selectedHex.r, { id });
    }
  }, [feature, mapData]);

  const handleFeatureSetColor = useCallback((color) => {
    feature.setColor(color);
    if (feature.mode === 'select' && feature.selectedHex) {
      mapData.updateFeature(feature.selectedHex.q, feature.selectedHex.r, { color });
    }
  }, [feature, mapData]);

  const handleFeatureSetSize = useCallback((size) => {
    feature.setSize(size);
    if (feature.mode === 'select' && feature.selectedHex) {
      mapData.updateFeature(feature.selectedHex.q, feature.selectedHex.r, { size });
    }
  }, [feature, mapData]);

  const handleFeatureSetRotation = useCallback((rotation) => {
    feature.setRotation(rotation);
    if (feature.mode === 'select' && feature.selectedHex) {
      mapData.updateFeature(feature.selectedHex.q, feature.selectedHex.r, { rotation });
    }
  }, [feature, mapData]);

  // ── Tile select-mode actions ───────────────────────────────────────────────

  const handleSelectModeChangeTile = useCallback((tileId) => {
    tile.setSelectedTile(tileId);
    if (tile.selectedHex) {
      const extraData = tileId === 'custom' ? { customColor: tile.customColor } : {};
      mapData.placeTile(tile.selectedHex.q, tile.selectedHex.r, tileId, extraData);
    }
  }, [tile, mapData]);

  const handleSelectModeSetCustomColor = useCallback((color) => {
    tile.setCustomColor(color);
    if (tile.selectedHex && tile.mode === 'select' && selectedTileHexData?.type === 'custom') {
      mapData.placeTile(tile.selectedHex.q, tile.selectedHex.r, 'custom', { customColor: color });
    }
  }, [tile, mapData, selectedTileHexData]);

  const handleDeleteSelectedTile = useCallback(() => {
    if (!tile.selectedHex) return;
    mapData.eraseTile(tile.selectedHex.q, tile.selectedHex.r);
    tile.clearSelection();
  }, [tile, mapData]);

  // ── Path style update (select mode) ───────────────────────────────────────

  const handleUpdateSelectedPathStyle = useCallback((updates) => {
    if (!path.selectedPathId) return;
    const isRoad = mapData.mapDoc.roads.some(r => r.id === path.selectedPathId);
    if (isRoad) mapData.updateRoad(path.selectedPathId, updates);
    else        mapData.updateRiver(path.selectedPathId, updates);
  }, [path.selectedPathId, mapData]);

  // ── Keyboard ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Enter' && path.isDrawing) handleCommitPath();

      if (e.key === 'Escape') {
        path.cancelPath();
        path.clearSelection();
        feature.clearSelection();
        tile.clearSelection();
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (path.selectedPathId)    handleDeleteSelectedPath();
        else if (feature.selectedHex) handleDeleteSelectedFeature();
      }

      const shortcuts = { h: 'hand', t: 'tile', f: 'feature', r: 'road', w: 'river' };
      if (shortcuts[e.key.toLowerCase()]) tools.selectTool(shortcuts[e.key.toLowerCase()]);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tools, path, feature, tile, handleCommitPath, handleDeleteSelectedPath, handleDeleteSelectedFeature]); // eslint-disable-line

  // ── Mouse handlers ─────────────────────────────────────────────────────────

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0 && e.button !== 2) return;
    if (e.button === 2 && !isFeatureTool) return;

    if (selectedTool === 'hand') {
      viewport.startDrag(e.clientX, e.clientY);
      return;
    }

    // ── Tile tool ──
    if (isTileTool) {
      const hex = canvasToHex(e);
      if (!hex) return;
      if (tile.mode === 'draw') {
        isPaintingRef.current = true;
        const extraData = tile.selectedTile === 'custom' ? { customColor: tile.customColor } : {};
        mapData.placeTile(hex.q, hex.r, tile.selectedTile, extraData);
      } else if (tile.mode === 'erase') {
        isPaintingRef.current = true;
        mapData.eraseTile(hex.q, hex.r);
      } else if (tile.mode === 'select') {
        const hasTile = mapData.mapDoc.tiles.has(hexKey(hex.q, hex.r));
        tile.selectHex(hasTile ? hex : null);
      }
      return;
    }

    // ── Feature tool ──
    if (isFeatureTool) {
      const hex = canvasToHex(e);
      if (!hex) return;
      if (feature.mode === 'draw') {
        if (e.button === 2) mapData.removeFeature(hex.q, hex.r);
        else                mapData.placeFeature(hex.q, hex.r, feature.buildFeatureData());
      } else if (feature.mode === 'erase') {
        mapData.removeFeature(hex.q, hex.r);
      } else if (feature.mode === 'select') {
        const hasFeature = mapData.mapDoc.features.has(hexKey(hex.q, hex.r));
        feature.selectHex(hasFeature ? hex : null);
      }
      return;
    }

    // ── Path tools ──
    if (isPathTool) {
      if (path.mode === 'erase') {
        const world = canvasToWorld(e);
        if (!world) return;
        const hitId = hitTestPaths(world, activePaths());
        if (hitId) {
          if (selectedTool === 'road') mapData.deleteRoad(hitId);
          else                         mapData.deleteRiver(hitId);
        }
        return;
      }
      if (path.mode === 'draw') {
        const hex = canvasToHex(e);
        if (hex) path.extendPath(hex.q, hex.r);
      } else if (path.mode === 'select') {
        const world = canvasToWorld(e);
        if (!world) return;
        const hitId = hitTestPaths(world, activePaths());
        path.selectPath(hitId ?? null);
      }
    }
  }, [
    selectedTool, isTileTool, isFeatureTool, isPathTool,
    tile, feature, path,
    mapData, viewport,
    canvasToHex, canvasToWorld, activePaths,
  ]);

  const handleContextMenu = useCallback((e) => {
    if (isFeatureTool) e.preventDefault();
  }, [isFeatureTool]);

  const handleMouseMove = useCallback((e) => {
    if (viewport.isDragging) {
      viewport.continueDrag(e.clientX, e.clientY);
      return;
    }

    const hex = canvasToHex(e);
    if (hex) setHoveredHex(hex);

    // Tile drag-paint / drag-erase
    if (isPaintingRef.current && isTileTool && hex) {
      if (tile.mode === 'draw') {
        const extraData = tile.selectedTile === 'custom' ? { customColor: tile.customColor } : {};
        mapData.placeTile(hex.q, hex.r, tile.selectedTile, extraData);
      } else if (tile.mode === 'erase') {
        mapData.eraseTile(hex.q, hex.r);
      }
    }

    // Path hover for select / erase modes
    if (isPathTool && (path.mode === 'select' || path.mode === 'erase')) {
      const world = canvasToWorld(e);
      if (world) path.hoverPath(hitTestPaths(world, activePaths()) ?? null);
    }
  }, [viewport, tile, path, mapData, isPathTool, isTileTool, canvasToHex, canvasToWorld, activePaths]);

  const handleMouseUp    = useCallback(() => { isPaintingRef.current = false; viewport.endDrag(); }, [viewport]);
  const handleMouseLeave = useCallback(() => {
    isPaintingRef.current = false;
    viewport.endDrag();
    setHoveredHex(null);
    if (isPathTool) path.hoverPath(null);
  }, [viewport, isPathTool, path]);

  const handleDoubleClick = useCallback(() => {
    if (!isPathTool || path.mode !== 'draw') return;
    handleCommitPath();
  }, [isPathTool, path, handleCommitPath]);

  // Attach wheel listener as non-passive so preventDefault works on all browsers.
  // React's synthetic onWheel is passive by default, which blocks preventDefault
  // and allows trackpad scroll to move the page behind the canvas.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e) => viewport.handleWheel(e);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [viewport.handleWheel]);

  // ── Map ops ────────────────────────────────────────────────────────────────

  const handleNewMap = useCallback(() => {
    if (window.confirm('Clear the entire map? This cannot be undone.')) {
      mapData.clearMap();
      viewport.resetViewport();
    }
  }, [mapData, viewport]);

  const handleExportPNG = useCallback(() => {
    const { dimensions } = mapData.mapDoc;
    const HEX_W  = HEX_SIZE * Math.sqrt(3);
    const HEX_H  = HEX_SIZE * 2;
    const padding = 2;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width  = (dimensions.width  + padding) * HEX_W;
    exportCanvas.height = (dimensions.height + padding) * HEX_H * 0.75;

    renderMap(exportCanvas, buildExportRenderState(mapData.mapDoc, { x: 0, y: 0, scale: 1 }));

    exportCanvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href = url; a.download = `hexmap-${Date.now()}.png`; a.click();
      URL.revokeObjectURL(url);
    });
  }, [mapData.mapDoc]);

  // ── Cursor ─────────────────────────────────────────────────────────────────

  const cursorStyle =
    selectedTool === 'hand' || viewport.isDragging     ? 'grab'      :
    activeToolIsErasing                                 ? 'crosshair' :
    isPathTool && path.mode === 'select'                ? 'pointer'   :
    isPathTool && path.mode === 'erase'                 ? 'crosshair' :
    isFeatureTool && feature.mode === 'select'          ? 'pointer'   :
    isTileTool && tile.mode === 'select'                ? 'pointer'   :
    'crosshair';

  const displayZoomPercent = Math.round((viewport.viewport.scale / 0.5) * 100);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <MenuBar
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(v => !v)}
        onNewMap={handleNewMap}
        onSave={mapData.saveToFile}
        onLoad={(file) => mapData.loadFromFile(file, viewport.setViewport)}
        onExportPNG={handleExportPNG}
        onExpandMap={() => setShowExpandDialog(true)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <Toolbar
          selectedTool={selectedTool}
          onSelectTool={tools.selectTool}
          onZoomIn={() => viewport.zoomBy(0.05)}
          onZoomOut={() => viewport.zoomBy(-0.05)}
          onResetView={viewport.resetViewport}
        />

        <ErrorBoundary>
          <div className="absolute inset-0">
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              style={{ cursor: cursorStyle }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onDoubleClick={handleDoubleClick}
              onContextMenu={handleContextMenu}
            />
          </div>
        </ErrorBoundary>

        {/* ── Tile panel ── */}
        {isTileTool && (
          <TileLibrary
            tileToolMode={tile.mode}
            onSetTileMode={tile.setMode}
            selectedTile={tile.selectedTile}
            onSelectTile={handleSelectModeChangeTile}
            customTileColor={tile.customColor}
            onSetCustomTileColor={handleSelectModeSetCustomColor}
            selectedHex={tile.selectedHex}
            selectedHexTileId={selectedTileHexData?.type ?? null}
            selectedHexCustomColor={selectedTileHexData?.customColor ?? null}
            onDeleteSelected={handleDeleteSelectedTile}
          />
        )}

        {/* ── Feature panel ── */}
        {isFeatureTool && (
          <FeatureLibrary
            featureToolMode={feature.mode}
            onSetFeatureMode={feature.setMode}
            selectedFeatureId={feature.selectedId}
            onSelectFeature={handleSelectFeature}
            selectedFeatureHex={feature.selectedHex}
            selectedFeatureData={selectedFeatureData}
            onDeleteSelected={handleDeleteSelectedFeature}
            featureColor={feature.color}
            onSetColor={handleFeatureSetColor}
            featureSize={feature.size}
            onSetSize={handleFeatureSetSize}
            featureRotation={feature.rotation}
            onSetRotation={handleFeatureSetRotation}
          />
        )}

        {/* ── Road / River panel ── */}
        {isPathTool && (
          <PathLibrary
            toolLabel={selectedTool === 'road' ? 'Road' : 'River'}
            isRiver={selectedTool === 'river'}
            pathToolMode={path.mode}
            onSetPathMode={path.setMode}
            style={selectedTool === 'road' ? path.roadStyle : path.riverStyle}
            onUpdateStyle={selectedTool === 'road' ? path.updateRoadStyle : path.updateRiverStyle}
            isDrawingPath={path.isDrawing}
            activePath={path.activePath}
            onCommit={handleCommitPath}
            onCancel={path.cancelPath}
            selectedPathId={path.selectedPathId}
            selectedPathStyle={selectedPathStyle()}
            onUpdateSelectedStyle={handleUpdateSelectedPathStyle}
            onDeleteSelected={handleDeleteSelectedPath}
          />
        )}
      </div>

      <StatusBar
        dimensions={mapData.mapDoc.dimensions}
        scale={displayZoomPercent}
      />

      <ExpandDialog
        isOpen={showExpandDialog}
        onClose={() => setShowExpandDialog(false)}
        onApply={mapData.expandMap}
      />
    </div>
  );
}
