import { useState, useCallback } from 'react';
import { DEFAULT_ROAD_STYLE, DEFAULT_RIVER_STYLE } from '../data/mapSchema.js';
import {
  DEFAULT_FEATURE_COLOR,
  DEFAULT_FEATURE_SIZE,
  DEFAULT_FEATURE_ROTATION,
} from '../data/features.js';

export function useTools() {
  const [selectedTool, setSelectedTool] = useState('tile');
  const [selectedTile, setSelectedTile] = useState('plains');
  const [isErasing, setIsErasing] = useState(false);
  const [libraryColumns, setLibraryColumns] = useState(2);

  // ── Feature tool state ────────────────────────────────────────────────────
  const [selectedFeatureId, setSelectedFeatureId] = useState('hamlet');
  const [featureColor, setFeatureColor] = useState(DEFAULT_FEATURE_COLOR);
  const [featureSize, setFeatureSize] = useState(DEFAULT_FEATURE_SIZE);
  const [featureRotation, setFeatureRotation] = useState(DEFAULT_FEATURE_ROTATION);
  // Draw / Select mode — mirrors pathToolMode pattern exactly
  const [featureToolMode, setFeatureToolModeState] = useState('draw'); // 'draw' | 'select'
  const [selectedFeatureHex, setSelectedFeatureHex] = useState(null);  // {q, r} | null

  // ── Path tool state ───────────────────────────────────────────────────────
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

  // ── Tool switching ────────────────────────────────────────────────────────

  const selectTool = useCallback((tool) => {
    setActivePath([]);
    setIsDrawingPath(false);
    setSelectedPathId(null);
    setHoveredPathId(null);
    setSelectedFeatureHex(null);
    setSelectedTool(tool);
    setPathToolModeState('draw');
    setFeatureToolModeState('draw');
    if (tool !== 'tile') setIsErasing(false);
  }, []);

  const selectTile = useCallback((tileId) => {
    setSelectedTile(tileId);
    setIsErasing(false);
  }, []);

  const toggleErase = useCallback(() => setIsErasing(prev => !prev), []);

  // ── Feature tool actions ──────────────────────────────────────────────────

  const selectFeature = useCallback((id) => setSelectedFeatureId(id), []);
  const setFeatureColorValue    = useCallback((c) => setFeatureColor(c), []);
  const setFeatureSizeValue     = useCallback((s) => setFeatureSize(s), []);
  const setFeatureRotationValue = useCallback((r) => setFeatureRotation(r), []);

  const setFeatureMode = useCallback((mode) => {
    if (mode === 'draw') setSelectedFeatureHex(null);
    setFeatureToolModeState(mode);
  }, []);

  const selectFeatureHex = useCallback((hex) => {
    setSelectedFeatureHex(hex); // {q, r} or null
  }, []);

  const clearFeatureSelection = useCallback(() => {
    setSelectedFeatureHex(null);
  }, []);

  const buildFeatureData = useCallback(() => ({
    id:       selectedFeatureId,
    color:    featureColor,
    size:     featureSize,
    rotation: featureRotation,
  }), [selectedFeatureId, featureColor, featureSize, featureRotation]);

  // ── Path tool mode ────────────────────────────────────────────────────────

  const setPathMode = useCallback((mode) => {
    if (mode === 'select') { setActivePath([]); setIsDrawingPath(false); setHoveredPathId(null); }
    if (mode === 'draw')   { setHoveredPathId(null); setSelectedPathId(null); }
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

  const setColumns = useCallback((n) => {
    setLibraryColumns(Math.max(1, Math.min(4, n)));
  }, []);

  return {
    // tool
    selectedTool, selectTool,
    // tile
    selectedTile, selectTile, isErasing, toggleErase,
    // feature
    selectedFeatureId, selectFeature,
    featureColor, setFeatureColor: setFeatureColorValue,
    featureSize,  setFeatureSize:  setFeatureSizeValue,
    featureRotation, setFeatureRotation: setFeatureRotationValue,
    featureToolMode, setFeatureMode,
    selectedFeatureHex, selectFeatureHex, clearFeatureSelection,
    buildFeatureData,
    // path
    pathToolMode, setPathMode,
    selectedPathId, selectPath, clearPathSelection,
    hoveredPathId, hoverPath,
    activePath, isDrawingPath, extendPath, commitPath, cancelPath,
    roadStyle, riverStyle, activePathStyle, updateRoadStyle, updateRiverStyle,
    // shared
    libraryColumns, setColumns,
  };
}
