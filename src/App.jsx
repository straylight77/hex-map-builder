import { useRef, useEffect, useState, useCallback } from 'react';
import { renderMap } from './rendering/renderer.js';
import { useViewport } from './hooks/useViewport.js';
import { useMapData } from './hooks/useMapData.js';
import { useTools } from './hooks/useTools.js';
import { pixelToHex, hexToPixel, HEX_SIZE } from './utils/hex.js';
import { hitTestPaths, canvasEventToWorld } from './utils/hitTest.js';
import { Toolbar } from './components/Toolbar.jsx';
import { TileLibrary } from './components/TileLibrary.jsx';
import { PathLibrary } from './components/PathLibrary.jsx';
import { MenuBar, ExpandDialog, StatusBar } from './components/UI.jsx';

export default function App() {
  const canvasRef = useRef(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showExpandDialog, setShowExpandDialog] = useState(false);
  const [hoveredHex, setHoveredHex] = useState(null);
  const isPaintingRef = useRef(false);

  const viewport = useViewport();
  const mapData = useMapData();
  const tools = useTools();

  // ── Derived flags ─────────────────────────────────────────────────────────

  const isPathTool = tools.selectedTool === 'road' || tools.selectedTool === 'river';

  // ── Helpers ───────────────────────────────────────────────────────────────

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

  // ── Canvas render ──────────────────────────────────────────────────────────

  useEffect(() => {
    renderMap(canvasRef.current, {
      tiles:           mapData.mapDoc.tiles,
      features:        mapData.mapDoc.features,
      roads:           mapData.mapDoc.roads,
      rivers:          mapData.mapDoc.rivers,
      dimensions:      mapData.mapDoc.dimensions,
      viewport:        viewport.viewport,
      showGrid,
      hoveredHex,
      selectedTool:    tools.selectedTool,
      isErasing:       tools.isErasing,
      activePath:      tools.activePath,
      activePathStyle: tools.activePathStyle,
      pathToolMode:    tools.pathToolMode,
      hoveredPathId:   tools.hoveredPathId,
      selectedPathId:  tools.selectedPathId,
    });
  }, [
    mapData.mapDoc,
    viewport.viewport,
    showGrid,
    hoveredHex,
    tools.selectedTool,
    tools.isErasing,
    tools.activePath,
    tools.activePathStyle,
    tools.pathToolMode,
    tools.hoveredPathId,
    tools.selectedPathId,
  ]);

  // ── Path commit ────────────────────────────────────────────────────────────

  const handleCommitPath = useCallback(() => {
    if (!tools.isDrawingPath) return;
    const path = tools.commitPath();
    if (!path) return;
    if (tools.selectedTool === 'road')  mapData.commitRoad(path, tools.roadStyle);
    if (tools.selectedTool === 'river') mapData.commitRiver(path, tools.riverStyle);
  }, [tools, mapData]);

  // ── Delete selected path ───────────────────────────────────────────────────

  const handleDeleteSelected = useCallback(() => {
    if (!tools.selectedPathId) return;
    const isRoad = mapData.mapDoc.roads.some(r => r.id === tools.selectedPathId);
    if (isRoad) mapData.deleteRoad(tools.selectedPathId);
    else        mapData.deleteRiver(tools.selectedPathId);
    tools.clearPathSelection();
  }, [tools, mapData]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;

      if (e.key === 'Enter' && tools.isDrawingPath) handleCommitPath();

      if (e.key === 'Escape') {
        tools.cancelPath();
        tools.clearPathSelection();
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && tools.selectedPathId) {
        handleDeleteSelected();
      }

      const shortcuts = { h: 'hand', t: 'tile', f: 'feature', r: 'road', w: 'river' };
      if (shortcuts[e.key.toLowerCase()]) tools.selectTool(shortcuts[e.key.toLowerCase()]);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tools, mapData, handleCommitPath, handleDeleteSelected]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mouse handlers ─────────────────────────────────────────────────────────

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;

    if (tools.selectedTool === 'hand') {
      viewport.startDrag(e.clientX, e.clientY);
      return;
    }

    if (tools.selectedTool === 'tile') {
      const hex = canvasToHex(e);
      if (!hex) return;
      isPaintingRef.current = true;
      if (tools.isErasing) mapData.eraseTile(hex.q, hex.r);
      else                 mapData.placeTile(hex.q, hex.r, tools.selectedTile);
      return;
    }

    if (isPathTool) {
      if (tools.pathToolMode === 'draw') {
        const hex = canvasToHex(e);
        if (hex) tools.extendPath(hex.q, hex.r);
      } else {
        const world = canvasToWorld(e);
        if (!world) return;
        const hitId = hitTestPaths(world, activePaths());
        tools.selectPath(hitId ?? null);
      }
    }
  }, [tools, mapData, viewport, isPathTool, canvasToHex, canvasToWorld, activePaths]);

  const handleMouseMove = useCallback((e) => {
    if (viewport.isDragging) {
      viewport.continueDrag(e.clientX, e.clientY);
      return;
    }

    const hex = canvasToHex(e);
    if (hex) setHoveredHex(hex);

    // Tile paint drag
    if (isPaintingRef.current && tools.selectedTool === 'tile' && hex) {
      if (tools.isErasing) mapData.eraseTile(hex.q, hex.r);
      else                 mapData.placeTile(hex.q, hex.r, tools.selectedTile);
    }

    // Path hover (select mode)
    if (isPathTool && tools.pathToolMode === 'select') {
      const world = canvasToWorld(e);
      if (world) {
        const hitId = hitTestPaths(world, activePaths());
        tools.hoverPath(hitId ?? null);
      }
    }
  }, [viewport, tools, mapData, isPathTool, canvasToHex, canvasToWorld, activePaths]);

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

  const handleWheel = useCallback((e) => {
    viewport.handleWheel(e);
  }, [viewport]);

  // ── New map ────────────────────────────────────────────────────────────────

  const handleNewMap = useCallback(() => {
    if (window.confirm('Clear the entire map? This cannot be undone.')) {
      mapData.clearMap();
      viewport.resetViewport();
    }
  }, [mapData, viewport]);

  // ── Export PNG ─────────────────────────────────────────────────────────────

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
      showGrid: true,
      hoveredHex: null,
      selectedTool: 'tile',
      isErasing: false,
      activePath: [],
      activePathStyle: null,
      pathToolMode: 'draw',
      hoveredPathId: null,
      selectedPathId: null,
    });

    exportCanvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hexmap-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }, [mapData.mapDoc]);

  // ── Update selected committed path style ───────────────────────────────────

  const handleUpdateSelectedStyle = useCallback((updates) => {
    if (!tools.selectedPathId) return;
    const isRoad = mapData.mapDoc.roads.some(r => r.id === tools.selectedPathId);
    if (isRoad) mapData.updateRoad(tools.selectedPathId, updates);
    else        mapData.updateRiver(tools.selectedPathId, updates);
  }, [tools.selectedPathId, mapData]);

  // ── Cursor ─────────────────────────────────────────────────────────────────

  const cursorStyle =
    tools.selectedTool === 'hand' || viewport.isDragging ? 'grab' :
    isPathTool && tools.pathToolMode === 'select'        ? 'pointer' :
    'crosshair';

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
          onZoomIn={() => viewport.zoomBy(0.1)}
          onZoomOut={() => viewport.zoomBy(-0.1)}
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
          />
        </div>

        {tools.selectedTool === 'tile' && (
          <TileLibrary
            selectedTile={tools.selectedTile}
            onSelectTile={tools.selectTile}
            isErasing={tools.isErasing}
            onToggleErase={tools.toggleErase}
            columns={tools.libraryColumns}
            onSetColumns={tools.setColumns}
          />
        )}

        {isPathTool && (
          <PathLibrary
            toolLabel={tools.selectedTool === 'road' ? 'Road' : 'River'}
            isRiver={tools.selectedTool === 'river'}
            pathToolMode={tools.pathToolMode}
            onSetPathMode={tools.setPathMode}
            style={tools.selectedTool === 'road' ? tools.roadStyle : tools.riverStyle}
            onUpdateStyle={
              tools.selectedTool === 'road' ? tools.updateRoadStyle : tools.updateRiverStyle
            }
            isDrawingPath={tools.isDrawingPath}
            activePath={tools.activePath}
            onCommit={handleCommitPath}
            onCancel={tools.cancelPath}
            selectedPathId={tools.selectedPathId}
            selectedPathStyle={selectedPathStyle()}
            onUpdateSelectedStyle={handleUpdateSelectedStyle}
            onDeleteSelected={handleDeleteSelected}
            columns={tools.libraryColumns}
            onSetColumns={tools.setColumns}
          />
        )}
      </div>

      <StatusBar
        dimensions={mapData.mapDoc.dimensions}
        scale={viewport.viewport.scale}
      />

      <ExpandDialog
        isOpen={showExpandDialog}
        onClose={() => setShowExpandDialog(false)}
        onApply={mapData.expandMap}
      />
    </div>
  );
}
