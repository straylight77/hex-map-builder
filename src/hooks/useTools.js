import { useState, useCallback } from 'react';
import { DEFAULT_ROAD_STYLE, DEFAULT_RIVER_STYLE } from '../data/mapSchema.js';
import {
  DEFAULT_FEATURE_COLOR,
  DEFAULT_FEATURE_SIZE,
  DEFAULT_FEATURE_ROTATION,
} from '../data/features.js';

export function useTools() {
  const [selectedTool, setSelectedTool] = useState('tile');
  const [selectedTile, setSelectedTile] = useState('custom');
  const [customTileColor, setCustomTileColor] = useState('#cccccc');
  const [libraryColumns, setLibraryColumns] = useState(2);

  // ── Tile tool — mode: 'draw' | 'select' | 'erase' ────────────────────────
  const [tileToolMode, setTileToolModeState] = useState('draw');
  const [selectedTileHex, setSelectedTileHex] = useState(null);

  // ── Feature tool — mode: 'draw' | 'select' | 'erase' ─────────────────────
  const [selectedFeatureId, setSelectedFeatureId] = useState('hamlet');
  const [featureColor, setFeatureColor] = useState(DEFAULT_FEATURE_COLOR);
  const [featureSize, setFeatureSize] = useState(DEFAULT_FEATURE_SIZE);
  const [featureRotation, setFeatureRotation] = useState(DEFAULT_FEATURE_ROTATION);
  const [featureToolMode, setFeatureToolModeState] = useState('draw');
  const [selectedFeatureHex, setSelectedFeatureHex] = useState(null);

  // ── Path tool — mode: 'draw' | 'select' | 'erase' ────────────────────────
  const [pathToolMode, setPathToolModeState] = useState('draw');
  const [selectedPathId, setSelectedPathId] = useState(null);
  const [hoveredPathId, setHoveredPathId] = useState(null);
  const [activePath, setActivePath] = useState([]);
  const [isDrawingPath, setIsDrawingPath] = useState(false);
  const [roadStyle, setRoadStyle] = useState({ ...DEFAULT_ROAD_STYLE });
  const [riverStyle, setRiverStyle] = useState({ ...DEFAULT_RIVER_STYLE });

  const activePathStyle =
    selectedTool === 'road'  ? roadStyle  :
    selectedTool === 'river' ? riverStyle : null;

  // Derived erase booleans
  const isTileErasing    = tileToolMode === 'erase';
  const isFeatureErasing = featureToolMode === 'erase';
  const isRoadErasing    = selectedTool === 'road'  && pathToolMode === 'erase';
  const isRiverErasing   = selectedTool === 'river' && pathToolMode === 'erase';

  // ── Tool switching ────────────────────────────────────────────────────────

  const selectTool = useCallback((tool) => {
    setActivePath([]);
    setIsDrawingPath(false);
    setSelectedPathId(null);
    setHoveredPathId(null);
    setSelectedFeatureHex(null);
    setSelectedTileHex(null);
    setSelectedTool(tool);
    setPathToolModeState('draw');
    setFeatureToolModeState('draw');
    setTileToolModeState('draw');
  }, []);

  // ── Tile tool actions ─────────────────────────────────────────────────────

  const selectTile = useCallback((tileId) => {
    setSelectedTile(tileId);
    setTileToolModeState('draw');
  }, []);

  // Legacy compat
  const isErasing = isTileErasing;
  const toggleErase = useCallback(() =>
    setTileToolModeState(prev => prev === 'erase' ? 'draw' : 'erase'), []);

  const setTileMode = useCallback((mode) => {
    if (mode !== 'select') setSelectedTileHex(null);
    setTileToolModeState(mode);
  }, []);

  const selectTileHex = useCallback((hex) => setSelectedTileHex(hex), []);
  const clearTileSelection = useCallback(() => setSelectedTileHex(null), []);

  // ── Feature tool actions ──────────────────────────────────────────────────

  const selectFeature = useCallback((id) => setSelectedFeatureId(id), []);
  const setFeatureColorValue    = useCallback((c) => setFeatureColor(c), []);
  const setFeatureSizeValue     = useCallback((s) => setFeatureSize(s), []);
  const setFeatureRotationValue = useCallback((r) => setFeatureRotation(r), []);

  const setFeatureMode = useCallback((mode) => {
    if (mode !== 'select') setSelectedFeatureHex(null);
    setFeatureToolModeState(mode);
  }, []);

  const selectFeatureHex = useCallback((hex) => setSelectedFeatureHex(hex), []);
  const clearFeatureSelection = useCallback(() => setSelectedFeatureHex(null), []);

  const buildFeatureData = useCallback(() => ({
    id:       selectedFeatureId,
    color:    featureColor,
    size:     featureSize,
    rotation: featureRotation,
  }), [selectedFeatureId, featureColor, featureSize, featureRotation]);

  const toggleFeatureErase = useCallback(() => {
    setFeatureToolModeState(prev => prev === 'erase' ? 'draw' : 'erase');
    setSelectedFeatureHex(null);
  }, []);

  // ── Path tool mode ────────────────────────────────────────────────────────

  const setPathMode = useCallback((mode) => {
    if (mode === 'select' || mode === 'erase') {
      setActivePath([]);
      setIsDrawingPath(false);
      setHoveredPathId(null);
    }
    if (mode === 'draw') {
      setHoveredPathId(null);
      setSelectedPathId(null);
    }
    setPathToolModeState(mode);
  }, []);

  const selectPath         = useCallback((id) => setSelectedPathId(id), []);
  const clearPathSelection = useCallback(() => setSelectedPathId(null), []);
  const hoverPath          = useCallback((id) => setHoveredPathId(id), []);

  const extendPath = useCallback((q, r) => {
    setActivePath(prev => {
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        if (last.q === q && last.r === r) return prev;
      }
      setIsDrawingPath(true);
      return [...prev, { q, r }];
    });
  }, []);

  const commitPath = useCallback(() => {
    if (activePath.length < 2) { setActivePath([]); setIsDrawingPath(false); return null; }
    const committed = [...activePath];
    setActivePath([]);
    setIsDrawingPath(false);
    return committed;
  }, [activePath]);

  const cancelPath = useCallback(() => { setActivePath([]); setIsDrawingPath(false); }, []);

  const updateRoadStyle = useCallback((updates) => {
    setRoadStyle(prev => ({
      ...prev, ...updates,
      spline: updates.spline ? { ...prev.spline, ...updates.spline } : prev.spline,
    }));
  }, []);

  const updateRiverStyle = useCallback((updates) => {
    setRiverStyle(prev => ({
      ...prev, ...updates,
      spline:  updates.spline  ? { ...prev.spline,  ...updates.spline  } : prev.spline,
      meander: updates.meander ? { ...prev.meander, ...updates.meander } : prev.meander,
    }));
  }, []);

  const toggleRoadErase  = useCallback(() =>
    setPathToolModeState(prev => prev === 'erase' ? 'draw' : 'erase'), []);
  const toggleRiverErase = useCallback(() =>
    setPathToolModeState(prev => prev === 'erase' ? 'draw' : 'erase'), []);

  const setColumns = useCallback((n) => {
    setLibraryColumns(Math.max(1, Math.min(4, n)));
  }, []);

  const activeToolIsErasing =
    selectedTool === 'tile'    ? isTileErasing    :
    selectedTool === 'feature' ? isFeatureErasing :
    selectedTool === 'road'    ? isRoadErasing    :
    selectedTool === 'river'   ? isRiverErasing   : false;

  return {
    selectedTool, selectTool,
    selectedTile, selectTile,
    isErasing, toggleErase,
    isTileErasing, toggleErase,
    tileToolMode, setTileMode,
    selectedTileHex, selectTileHex, clearTileSelection,
    customTileColor, setCustomTileColor,
    selectedFeatureId, selectFeature,
    featureColor, setFeatureColor: setFeatureColorValue,
    featureSize,  setFeatureSize:  setFeatureSizeValue,
    featureRotation, setFeatureRotation: setFeatureRotationValue,
    featureToolMode, setFeatureMode,
    selectedFeatureHex, selectFeatureHex, clearFeatureSelection,
    isFeatureErasing, toggleFeatureErase,
    buildFeatureData,
    pathToolMode, setPathMode,
    selectedPathId, selectPath, clearPathSelection,
    hoveredPathId, hoverPath,
    activePath, isDrawingPath, extendPath, commitPath, cancelPath,
    roadStyle, riverStyle, activePathStyle, updateRoadStyle, updateRiverStyle,
    isRoadErasing, toggleRoadErase,
    isRiverErasing, toggleRiverErase,
    activeToolIsErasing,
    libraryColumns, setColumns,
  };
}
