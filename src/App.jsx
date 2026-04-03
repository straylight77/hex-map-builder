import { useRef, useEffect, useState, useCallback } from 'react';
import { renderMap } from './rendering/renderer.js';
import { useViewport } from './hooks/useViewport.js';
import { useMapData } from './hooks/useMapData.js';
import { useTools } from './hooks/useTools.js';
import { pixelToHex, hexKey, HEX_SIZE } from './utils/hex.js';
import { hitTestPaths, canvasEventToWorld } from './utils/hitTest.js';
import { Toolbar } from './components/Toolbar.jsx';
import { TileLibrary } from './components/TileLibrary.jsx';
import { PathLibrary } from './components/PathLibrary.jsx';
import { FeatureLibrary } from './components/FeatureLibrary.jsx';
import { MenuBar, ExpandDialog, StatusBar } from './components/UI.jsx';

export default function App() {
  const canvasRef = useRef(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showExpandDialog, setShowExpandDialog] = useState(false);
  const [hoveredHex, setHoveredHex] = useState(null);
  const isPaintingRef = useRef(false);

  const viewport = useViewport();
  const mapData  = useMapData();
  const tools    = useTools();

  const isPathTool    = tools.selectedTool === 'road' || tools.selectedTool === 'river';
  const isFeatureTool = tools.selectedTool === 'feature';
  const isTileTool    = tools.selectedTool === 'tile';

  // ── Helpers ────────────────────────────────────────────────────────────────

  const activePaths = useCallback(() => {
    if (tools.selectedTool === 'road')  return mapData.mapDoc.roads;
    if (tools.selectedTool === 'river') return mapData.mapDoc.rivers;
    return [];
  }, [tools.selectedTool, mapData.mapDoc.roads, mapData.mapDoc.rivers]);

  const selectedPathStyle = useCallback(() => {
    if (!tools.selectedPathId) return null;
    const all = [...mapData.mapDoc.roads, ...mapData.mapDoc.rivers];
    return all.find(p => p.id === tools.selectedPathId)?.style ?? null;
  }, [tools.selectedPathId, mapData.mapDoc.roads, mapData.mapDoc.rivers]);

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

  const selectedFeatureData = tools.selectedFeatureHex
    ? mapData.mapDoc.features.get(hexKey(tools.selectedFeatureHex.q, tools.selectedFeatureHex.r)) ?? null
    : null;

  const selectedTileHexData = tools.selectedTileHex
    ? mapData.mapDoc.tiles.get(hexKey(tools.selectedTileHex.q, tools.selectedTileHex.r)) ?? null
    : null;

  // ── Canvas render ──────────────────────────────────────────────────────────

  useEffect(() => {
    renderMap(canvasRef.current, {
      tiles:              mapData.mapDoc.tiles,
      features:           mapData.mapDoc.features,
      roads:              mapData.mapDoc.roads,
      rivers:             mapData.mapDoc.rivers,
      dimensions:         mapData.mapDoc.dimensions,
      viewport:           viewport.viewport,
      showGrid,
      hoveredHex,
      selectedTool:       tools.selectedTool,
      isErasing:          tools.activeToolIsErasing,
      activePath:         tools.activePath,
      activePathStyle:    tools.activePathStyle,
      pathToolMode:       tools.pathToolMode,
      hoveredPathId:      tools.hoveredPathId,
      selectedPathId:     tools.selectedPathId,
      featureToolMode:    tools.featureToolMode,
      selectedFeatureHex: tools.selectedFeatureHex,
      tileToolMode:       tools.tileToolMode,
      selectedTileHex:    tools.selectedTileHex,
    });
  }, [
    mapData.mapDoc,
    viewport.viewport,
    showGrid,
    hoveredHex,
    tools.selectedTool,
    tools.activeToolIsErasing,
    tools.activePath,
    tools.activePathStyle,
    tools.pathToolMode,
    tools.hoveredPathId,
    tools.selectedPathId,
    tools.featureToolMode,
    tools.selectedFeatureHex,
    tools.tileToolMode,
    tools.selectedTileHex,
  ]);

  // ── Path commit ────────────────────────────────────────────────────────────

  const handleCommitPath = useCallback(() => {
    if (!tools.isDrawingPath) return;
    const path = tools.commitPath();
    if (!path) return;
    if (tools.selectedTool === 'road')  mapData.commitRoad(path, tools.roadStyle);
    if (tools.selectedTool === 'river') mapData.commitRiver(path, tools.riverStyle);
  }, [tools, mapData]);

  const handleDeleteSelectedPath = useCallback(() => {
    if (!tools.selectedPathId) return;
    const isRoad = mapData.mapDoc.roads.some(r => r.id === tools.selectedPathId);
    if (isRoad) mapData.deleteRoad(tools.selectedPathId);
    else        mapData.deleteRiver(tools.selectedPathId);
    tools.clearPathSelection();
  }, [tools, mapData]);

  // ── Feature delete ─────────────────────────────────────────────────────────

  const handleDeleteSelectedFeature = useCallback(() => {
    if (!tools.selectedFeatureHex) return;
    mapData.removeFeature(tools.selectedFeatureHex.q, tools.selectedFeatureHex.r);
    tools.clearFeatureSelection();
  }, [tools, mapData]);

  // ── Feature style update (select mode) ────────────────────────────────────

  const handleFeatureSetColor = useCallback((color) => {
    if (tools.featureToolMode === 'select' && tools.selectedFeatureHex) {
      mapData.updateFeature(tools.selectedFeatureHex.q, tools.selectedFeatureHex.r, { color });
    }
    tools.setFeatureColor(color);
  }, [tools, mapData]);

  const handleFeatureSetSize = useCallback((size) => {
    if (tools.featureToolMode === 'select' && tools.selectedFeatureHex) {
      mapData.updateFeature(tools.selectedFeatureHex.q, tools.selectedFeatureHex.r, { size });
    }
    tools.setFeatureSize(size);
  }, [tools, mapData]);

  const handleFeatureSetRotation = useCallback((rotation) => {
    if (tools.featureToolMode === 'select' && tools.selectedFeatureHex) {
      mapData.updateFeature(tools.selectedFeatureHex.q, tools.selectedFeatureHex.r, { rotation });
    }
    tools.setFeatureRotation(rotation);
  }, [tools, mapData]);

  // ── Tile select mode ───────────────────────────────────────────────────────

  const handleSelectModeChangeTile = useCallback((tileId) => {
    tools.selectTile(tileId);
    if (tools.selectedTileHex) {
      const extraData = tileId === 'custom' ? { customColor: tools.customTileColor } : {};
      mapData.placeTile(tools.selectedTileHex.q, tools.selectedTileHex.r, tileId, extraData);
    }
  }, [tools, mapData]);

  const handleSelectModeSetCustomColor = useCallback((color) => {
    tools.setCustomTileColor(color);
    if (tools.selectedTileHex && tools.tileToolMode === 'select' && selectedTileHexData?.type === 'custom') {
      mapData.placeTile(tools.selectedTileHex.q, tools.selectedTileHex.r, 'custom', { customColor: color });
    }
  }, [tools, mapData, selectedTileHexData]);

  // ── Keyboard ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Enter' && tools.isDrawingPath) handleCommitPath();

      if (e.key === 'Escape') {
        tools.cancelPath();
        tools.clearPathSelection();
        tools.clearFeatureSelection();
        tools.clearTileSelection();
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (tools.selectedPathId) handleDeleteSelectedPath();
        else if (tools.selectedFeatureHex) handleDeleteSelectedFeature();
      }

      const shortcuts = { h: 'hand', t: 'tile', f: 'feature', r: 'road', w: 'river' };
      if (shortcuts[e.key.toLowerCase()]) tools.selectTool(shortcuts[e.key.toLowerCase()]);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tools, handleCommitPath, handleDeleteSelectedPath, handleDeleteSelectedFeature]); // eslint-disable-line

  // ── Mouse handlers ─────────────────────────────────────────────────────────

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0 && e.button !== 2) return;
    if (e.button === 2 && !isFeatureTool) return;

    if (tools.selectedTool === 'hand') {
      viewport.startDrag(e.clientX, e.clientY);
      return;
    }

    // ── Tile tool ──
    if (isTileTool) {
      const hex = canvasToHex(e);
      if (!hex) return;

      if (tools.tileToolMode === 'draw') {
        isPaintingRef.current = true;
        const extraData = tools.selectedTile === 'custom'
          ? { customColor: tools.customTileColor }
          : {};
        mapData.placeTile(hex.q, hex.r, tools.selectedTile, extraData);
      } else if (tools.tileToolMode === 'erase') {
        isPaintingRef.current = true;
        mapData.eraseTile(hex.q, hex.r);
      } else if (tools.tileToolMode === 'select') {
        const hasTile = mapData.mapDoc.tiles.has(hexKey(hex.q, hex.r));
        tools.selectTileHex(hasTile ? hex : null);
      }
      return;
    }

    // ── Feature tool ──
    if (isFeatureTool) {
      const hex = canvasToHex(e);
      if (!hex) return;

      if (tools.isFeatureErasing) {
        mapData.removeFeature(hex.q, hex.r);
        return;
      }

      if (tools.featureToolMode === 'draw') {
        if (e.button === 2) {
          mapData.removeFeature(hex.q, hex.r);
        } else {
          mapData.placeFeature(hex.q, hex.r, tools.buildFeatureData());
        }
      } else if (tools.featureToolMode === 'select') {
        const hasFeature = mapData.mapDoc.features.has(hexKey(hex.q, hex.r));
        tools.selectFeatureHex(hasFeature ? hex : null);
      }
      return;
    }

    // ── Path tools ──
    if (isPathTool) {
      const isErasing = tools.pathToolMode === 'erase';

      if (isErasing) {
        const world = canvasToWorld(e);
        if (!world) return;
        const hitId = hitTestPaths(world, activePaths());
        if (hitId) {
          if (tools.selectedTool === 'road') mapData.deleteRoad(hitId);
          else                               mapData.deleteRiver(hitId);
        }
        return;
      }

      if (tools.pathToolMode === 'draw') {
        const hex = canvasToHex(e);
        if (hex) tools.extendPath(hex.q, hex.r);
      } else if (tools.pathToolMode === 'select') {
        const world = canvasToWorld(e);
        if (!world) return;
        const hitId = hitTestPaths(world, activePaths());
        tools.selectPath(hitId ?? null);
      }
    }
  }, [tools, mapData, viewport, isPathTool, isFeatureTool, isTileTool, canvasToHex, canvasToWorld, activePaths]);

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

    // Tile painting/erasing (drag in draw or erase mode)
    if (isPaintingRef.current && isTileTool && hex) {
      if (tools.tileToolMode === 'draw') {
        const extraData = tools.selectedTile === 'custom'
          ? { customColor: tools.customTileColor }
          : {};
        mapData.placeTile(hex.q, hex.r, tools.selectedTile, extraData);
      } else if (tools.tileToolMode === 'erase') {
        mapData.eraseTile(hex.q, hex.r);
      }
    }

    // Path hover for select and erase modes
    if (isPathTool && (tools.pathToolMode === 'select' || tools.pathToolMode === 'erase')) {
      const world = canvasToWorld(e);
      if (world) {
        const hitId = hitTestPaths(world, activePaths());
        tools.hoverPath(hitId ?? null);
      }
    }
  }, [viewport, tools, mapData, isPathTool, isTileTool, canvasToHex, canvasToWorld, activePaths]);

  const handleMouseUp = useCallback(() => {
    isPaintingRef.current = false;
    viewport.endDrag();
  }, [viewport]);

  const handleMouseLeave = useCallback(() => {
    isPaintingRef.current = false;
    viewport.endDrag();
    setHoveredHex(null);
    if (isPathTool) tools.hoverPath(null);
  }, [viewport, isPathTool, tools]);

  const handleDoubleClick = useCallback(() => {
    if (!isPathTool || tools.pathToolMode !== 'draw') return;
    handleCommitPath();
  }, [isPathTool, tools, handleCommitPath]);

  const handleWheel = useCallback((e) => viewport.handleWheel(e), [viewport]);

  // ── Map ops ────────────────────────────────────────────────────────────────

  const handleNewMap = useCallback(() => {
    if (window.confirm('Clear the entire map? This cannot be undone.')) {
      mapData.clearMap();
      viewport.resetViewport();
    }
  }, [mapData, viewport]);

  const handleExportPNG = useCallback(() => {
    const { tiles, features, roads, rivers, dimensions } = mapData.mapDoc;
    const HEX_W = HEX_SIZE * Math.sqrt(3);
    const HEX_H = HEX_SIZE * 2;
    const padding = 2;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width  = (dimensions.width  + padding) * HEX_W;
    exportCanvas.height = (dimensions.height + padding) * HEX_H * 0.75;
    renderMap(exportCanvas, {
      tiles, features, roads, rivers, dimensions,
      viewport: { x: 0, y: 0, scale: 1 },
      showGrid: true, hoveredHex: null,
      selectedTool: 'tile', isErasing: false,
      activePath: [], activePathStyle: null,
      pathToolMode: 'draw', hoveredPathId: null, selectedPathId: null,
      featureToolMode: 'draw', selectedFeatureHex: null,
      tileToolMode: 'draw', selectedTileHex: null,
    });
    exportCanvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `hexmap-${Date.now()}.png`; a.click();
      URL.revokeObjectURL(url);
    });
  }, [mapData.mapDoc]);

  const handleUpdateSelectedPathStyle = useCallback((updates) => {
    if (!tools.selectedPathId) return;
    const isRoad = mapData.mapDoc.roads.some(r => r.id === tools.selectedPathId);
    if (isRoad) mapData.updateRoad(tools.selectedPathId, updates);
    else        mapData.updateRiver(tools.selectedPathId, updates);
  }, [tools.selectedPathId, mapData]);

  const handleDeleteSelectedTile = useCallback(() => {
    if (!tools.selectedTileHex) return;
    mapData.eraseTile(tools.selectedTileHex.q, tools.selectedTileHex.r);
    tools.clearTileSelection();
  }, [tools, mapData]);

  // ── Cursor ─────────────────────────────────────────────────────────────────

  const cursorStyle =
    tools.selectedTool === 'hand' || viewport.isDragging  ? 'grab'      :
    tools.activeToolIsErasing                              ? 'crosshair' :
    isPathTool && tools.pathToolMode === 'select'          ? 'pointer'   :
    isPathTool && tools.pathToolMode === 'erase'           ? 'crosshair' :
    isFeatureTool && tools.featureToolMode === 'select'    ? 'pointer'   :
    isTileTool && tools.tileToolMode === 'select'          ? 'pointer'   :
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
          selectedTool={tools.selectedTool}
          onSelectTool={tools.selectTool}
          onZoomIn={() => viewport.zoomBy(0.05)}
          onZoomOut={() => viewport.zoomBy(-0.05)}
          onResetView={viewport.resetViewport}
        />

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
            onWheel={handleWheel}
            onContextMenu={handleContextMenu}
          />
        </div>

        {/* ── Tile panel ── */}
        {isTileTool && (
          <TileLibrary
            tileToolMode={tools.tileToolMode}
            onSetTileMode={tools.setTileMode}
            selectedTile={tools.selectedTile}
            onSelectTile={handleSelectModeChangeTile}
            isErasing={tools.isTileErasing}
            onToggleErase={tools.toggleErase}
            customTileColor={tools.customTileColor}
            onSetCustomTileColor={handleSelectModeSetCustomColor}
            selectedHex={tools.selectedTileHex}
            selectedHexTileId={selectedTileHexData?.type ?? null}
            selectedHexCustomColor={selectedTileHexData?.customColor ?? null}
            onDeleteSelected={handleDeleteSelectedTile}
          />
        )}

        {/* ── Feature panel ── */}
        {isFeatureTool && (
          <FeatureLibrary
            featureToolMode={tools.featureToolMode}
            onSetFeatureMode={tools.setFeatureMode}
            selectedFeatureId={tools.selectedFeatureId}
            onSelectFeature={tools.selectFeature}
            selectedFeatureHex={tools.selectedFeatureHex}
            selectedFeatureData={selectedFeatureData}
            onDeleteSelected={handleDeleteSelectedFeature}
            featureColor={tools.featureColor}
            onSetColor={handleFeatureSetColor}
            featureSize={tools.featureSize}
            onSetSize={handleFeatureSetSize}
            featureRotation={tools.featureRotation}
            onSetRotation={handleFeatureSetRotation}
            isErasing={tools.isFeatureErasing}
            onToggleErase={tools.toggleFeatureErase}
          />
        )}

        {/* ── Road / River panel ── */}
        {isPathTool && (
          <PathLibrary
            toolLabel={tools.selectedTool === 'road' ? 'Road' : 'River'}
            isRiver={tools.selectedTool === 'river'}
            pathToolMode={tools.pathToolMode}
            onSetPathMode={tools.setPathMode}
            style={tools.selectedTool === 'road' ? tools.roadStyle : tools.riverStyle}
            onUpdateStyle={tools.selectedTool === 'road' ? tools.updateRoadStyle : tools.updateRiverStyle}
            isDrawingPath={tools.isDrawingPath}
            activePath={tools.activePath}
            onCommit={handleCommitPath}
            onCancel={tools.cancelPath}
            selectedPathId={tools.selectedPathId}
            selectedPathStyle={selectedPathStyle()}
            onUpdateSelectedStyle={handleUpdateSelectedPathStyle}
            onDeleteSelected={handleDeleteSelectedPath}
            isErasing={tools.selectedTool === 'road' ? tools.isRoadErasing : tools.isRiverErasing}
            onToggleErase={tools.selectedTool === 'road' ? tools.toggleRoadErase : tools.toggleRiverErase}
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
