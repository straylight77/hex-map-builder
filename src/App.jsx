import { useRef, useEffect, useState, useCallback } from 'react';
import { renderMap } from './rendering/renderer.js';
import { useViewport } from './hooks/useViewport.js';
import { useMapData } from './hooks/useMapData.js';
import { useTools } from './hooks/useTools.js';
import { pixelToHex } from './utils/hex.js';
import { HEX_SIZE } from './utils/hex.js';
import { Toolbar } from './components/Toolbar.jsx';
import { TileLibrary } from './components/TileLibrary.jsx';
import { PathLibrary } from './components/PathLibrary.jsx';
import { MenuBar, ExpandDialog, StatusBar } from './components/UI.jsx';

export default function App() {
  const canvasRef = useRef(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showExpandDialog, setShowExpandDialog] = useState(false);
  const [hoveredHex, setHoveredHex] = useState(null);
  // Track whether the mouse button is held for paint-drag on tile tool
  const isPaintingRef = useRef(false);

  const viewport = useViewport();
  const mapData = useMapData();
  const tools = useTools();

  // ── Canvas render ──────────────────────────────────────────────────────────
  // Runs whenever any piece of rendering state changes.

  useEffect(() => {
    renderMap(canvasRef.current, {
      tiles: mapData.mapDoc.tiles,
      features: mapData.mapDoc.features,
      roads: mapData.mapDoc.roads,
      rivers: mapData.mapDoc.rivers,
      dimensions: mapData.mapDoc.dimensions,
      viewport: viewport.viewport,
      showGrid,
      hoveredHex,
      selectedTool: tools.selectedTool,
      isErasing: tools.isErasing,
      activePath: tools.activePath,
      activePathStyle: tools.activePathStyle,
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
  ]);

  // ── Canvas resize observer ─────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => {
      // Force a re-render on resize by triggering the renderMap effect
      // The renderer itself handles the canvas size sync
      renderMap(canvas, {
        tiles: mapData.mapDoc.tiles,
        features: mapData.mapDoc.features,
        roads: mapData.mapDoc.roads,
        rivers: mapData.mapDoc.rivers,
        dimensions: mapData.mapDoc.dimensions,
        viewport: viewport.viewport,
        showGrid,
        hoveredHex,
        selectedTool: tools.selectedTool,
        isErasing: tools.isErasing,
        activePath: tools.activePath,
        activePathStyle: tools.activePathStyle,
      });
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;

      if (e.key === 'Enter') {
        if (tools.isDrawingPath) {
          const path = tools.commitPath();
          if (path) {
            if (tools.selectedTool === 'road') mapData.commitRoad(path, tools.roadStyle);
            if (tools.selectedTool === 'river') mapData.commitRiver(path, tools.riverStyle);
          }
        }
      }

      if (e.key === 'Escape') {
        tools.cancelPath();
      }

      // Tool shortcuts
      const shortcuts = { h: 'hand', t: 'tile', f: 'feature', r: 'road', w: 'river' };
      if (shortcuts[e.key.toLowerCase()]) {
        tools.selectTool(shortcuts[e.key.toLowerCase()]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tools, mapData]);

  // ── Mouse position → hex ───────────────────────────────────────────────────

  const canvasEventToHex = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const worldX = (e.clientX - rect.left - canvas.width / 2 - viewport.viewport.x) / viewport.viewport.scale;
    const worldY = (e.clientY - rect.top - canvas.height / 2 - viewport.viewport.y) / viewport.viewport.scale;
    return pixelToHex(worldX, worldY, HEX_SIZE);
  }, [viewport.viewport]);

  // ── Canvas event handlers ──────────────────────────────────────────────────

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;

    const isPanMode = tools.selectedTool === 'hand';
    if (isPanMode) {
      viewport.startDrag(e.clientX, e.clientY);
      return;
    }

    const hex = canvasEventToHex(e);
    if (!hex) return;

    if (tools.selectedTool === 'tile') {
      isPaintingRef.current = true;
      if (tools.isErasing) {
        mapData.eraseTile(hex.q, hex.r);
      } else {
        mapData.placeTile(hex.q, hex.r, tools.selectedTile);
      }
    }

    if (tools.selectedTool === 'road' || tools.selectedTool === 'river') {
      tools.extendPath(hex.q, hex.r);
    }
  }, [tools, mapData, viewport, canvasEventToHex]);

  const handleMouseMove = useCallback((e) => {
    if (viewport.isDragging) {
      viewport.continueDrag(e.clientX, e.clientY);
      return;
    }

    const hex = canvasEventToHex(e);
    if (hex) setHoveredHex(hex);

    // Paint-drag for tile tool
    if (isPaintingRef.current && tools.selectedTool === 'tile' && hex) {
      if (tools.isErasing) {
        mapData.eraseTile(hex.q, hex.r);
      } else {
        mapData.placeTile(hex.q, hex.r, tools.selectedTile);
      }
    }
  }, [viewport, tools, mapData, canvasEventToHex]);

  const handleMouseUp = useCallback((e) => {
    isPaintingRef.current = false;
    viewport.endDrag();
  }, [viewport]);

  const handleMouseLeave = useCallback(() => {
    isPaintingRef.current = false;
    viewport.endDrag();
    setHoveredHex(null);
  }, [viewport]);

  const handleDoubleClick = useCallback((e) => {
    if (tools.selectedTool !== 'road' && tools.selectedTool !== 'river') return;
    const path = tools.commitPath();
    if (path) {
      if (tools.selectedTool === 'road') mapData.commitRoad(path, tools.roadStyle);
      if (tools.selectedTool === 'river') mapData.commitRiver(path, tools.riverStyle);
    }
  }, [tools, mapData]);

  const handleWheel = useCallback((e) => {
    viewport.handleWheel(e);
  }, [viewport]);

  // ── New map guard ──────────────────────────────────────────────────────────

  const handleNewMap = useCallback(() => {
    if (window.confirm('Clear the entire map? This cannot be undone.')) {
      mapData.clearMap();
      viewport.resetViewport();
    }
  }, [mapData, viewport]);

  // ── Export PNG ─────────────────────────────────────────────────────────────

  const handleExportPNG = useCallback(() => {
    const { tiles, dimensions } = mapData.mapDoc;
    const { HEX_WIDTH, HEX_HEIGHT } = { HEX_WIDTH: HEX_SIZE * Math.sqrt(3), HEX_HEIGHT: HEX_SIZE * 2 };
    const padding = 2;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = (dimensions.width + padding) * HEX_WIDTH;
    exportCanvas.height = (dimensions.height + padding) * HEX_HEIGHT * 0.75;

    renderMap(exportCanvas, {
      tiles,
      features: mapData.mapDoc.features,
      roads: mapData.mapDoc.roads,
      rivers: mapData.mapDoc.rivers,
      dimensions,
      viewport: {
        x: 0,
        y: 0,
        scale: 1,
      },
      showGrid: true,
      hoveredHex: null,
      selectedTool: 'tile',
      isErasing: false,
      activePath: [],
      activePathStyle: null,
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

  // ── Cursor style ───────────────────────────────────────────────────────────

  const cursorStyle =
    tools.selectedTool === 'hand' || viewport.isDragging ? 'grab' : 'crosshair';

  // ── Sidebar ────────────────────────────────────────────────────────────────

  const showTileLibrary = tools.selectedTool === 'tile';
  const showPathLibrary = tools.selectedTool === 'road' || tools.selectedTool === 'river';

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

        {/* Canvas */}
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

        {/* Right sidebar */}
        {showTileLibrary && (
          <TileLibrary
            selectedTile={tools.selectedTile}
            onSelectTile={tools.selectTile}
            isErasing={tools.isErasing}
            onToggleErase={tools.toggleErase}
            columns={tools.libraryColumns}
            onSetColumns={tools.setColumns}
          />
        )}

        {showPathLibrary && (
          <PathLibrary
            toolLabel={tools.selectedTool === 'road' ? 'Road' : 'River'}
            style={tools.selectedTool === 'road' ? tools.roadStyle : tools.riverStyle}
            onUpdateStyle={
              tools.selectedTool === 'road'
                ? tools.updateRoadStyle
                : tools.updateRiverStyle
            }
            isErasing={tools.isErasing}
            onToggleErase={tools.toggleErase}
            isDrawingPath={tools.isDrawingPath}
            activePath={tools.activePath}
            onCommit={() => {
              const path = tools.commitPath();
              if (path) {
                if (tools.selectedTool === 'road') mapData.commitRoad(path, tools.roadStyle);
                else mapData.commitRiver(path, tools.riverStyle);
              }
            }}
            onCancel={tools.cancelPath}
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
