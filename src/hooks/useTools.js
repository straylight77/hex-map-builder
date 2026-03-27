import { useState, useCallback } from 'react';
import { DEFAULT_ROAD_STYLE, DEFAULT_RIVER_STYLE } from '../data/mapSchema.js';

/**
 * Manages all tool-selection state and the in-progress path being drawn
 * for the Road and River tools.
 *
 * Path tools have two explicit modes:
 *   'draw'   — clicking canvas cells extends / commits a new path
 *   'select' — clicking near a committed path selects it for editing/deletion
 *
 * Default mode when switching to road/river: 'draw'.
 */
export function useTools() {
  const [selectedTool, setSelectedTool] = useState('tile');
  const [selectedTile, setSelectedTile] = useState('plains');
  const [isErasing, setIsErasing] = useState(false);
  const [libraryColumns, setLibraryColumns] = useState(1);

  // ── Path tool mode ────────────────────────────────────────────────────────
  const [pathToolMode, setPathToolModeState] = useState('draw'); // 'draw' | 'select'
  const [selectedPathId, setSelectedPathId] = useState(null);
  const [hoveredPathId, setHoveredPathId] = useState(null);

  // ── In-progress drawing path ──────────────────────────────────────────────
  const [activePath, setActivePath] = useState([]);
  const [isDrawingPath, setIsDrawingPath] = useState(false);

  // ── Per-session style (persists across commits within a session) ──────────
  const [roadStyle, setRoadStyle] = useState({ ...DEFAULT_ROAD_STYLE });
  const [riverStyle, setRiverStyle] = useState({ ...DEFAULT_RIVER_STYLE });

  const activePathStyle =
    selectedTool === 'road' ? roadStyle :
    selectedTool === 'river' ? riverStyle :
    null;

  // ── Tool switching ────────────────────────────────────────────────────────

  const selectTool = useCallback((tool) => {
    setActivePath([]);
    setIsDrawingPath(false);
    setSelectedPathId(null);
    setHoveredPathId(null);
    setSelectedTool(tool);
    setPathToolModeState('draw');
    if (tool !== 'tile') setIsErasing(false);
  }, []);

  const selectTile = useCallback((tileId) => {
    setSelectedTile(tileId);
    setIsErasing(false);
  }, []);

  const toggleErase = useCallback(() => {
    setIsErasing(prev => !prev);
  }, []);

  // ── Path tool mode switching ──────────────────────────────────────────────

  const setPathMode = useCallback((mode) => {
    if (mode === 'select') {
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

  const selectPath = useCallback((id) => {
    setSelectedPathId(id);
  }, []);

  const clearPathSelection = useCallback(() => {
    setSelectedPathId(null);
  }, []);

  const hoverPath = useCallback((id) => {
    setHoveredPathId(id);
  }, []);

  // ── In-progress path building ─────────────────────────────────────────────

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
    if (activePath.length < 2) {
      setActivePath([]);
      setIsDrawingPath(false);
      return null;
    }
    const committed = [...activePath];
    setActivePath([]);
    setIsDrawingPath(false);
    return committed;
  }, [activePath]);

  const cancelPath = useCallback(() => {
    setActivePath([]);
    setIsDrawingPath(false);
  }, []);

  // ── Style setters ─────────────────────────────────────────────────────────

  const updateRoadStyle = useCallback((updates) => {
    setRoadStyle(prev => ({
      ...prev,
      ...updates,
      spline: updates.spline
        ? { ...prev.spline, ...updates.spline }
        : prev.spline,
    }));
  }, []);

  const updateRiverStyle = useCallback((updates) => {
    setRiverStyle(prev => ({
      ...prev,
      ...updates,
      spline: updates.spline
        ? { ...prev.spline, ...updates.spline }
        : prev.spline,
      meander: updates.meander
        ? { ...prev.meander, ...updates.meander }
        : prev.meander,
    }));
  }, []);

  const setColumns = useCallback((n) => {
    setLibraryColumns(Math.max(1, Math.min(3, n)));
  }, []);

  return {
    selectedTool,
    selectTool,
    selectedTile,
    selectTile,
    isErasing,
    toggleErase,
    libraryColumns,
    setColumns,
    pathToolMode,
    setPathMode,
    selectedPathId,
    selectPath,
    clearPathSelection,
    hoveredPathId,
    hoverPath,
    activePath,
    isDrawingPath,
    extendPath,
    commitPath,
    cancelPath,
    roadStyle,
    riverStyle,
    activePathStyle,
    updateRoadStyle,
    updateRiverStyle,
  };
}
