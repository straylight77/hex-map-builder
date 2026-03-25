import { useState, useCallback } from 'react';
import { DEFAULT_ROAD_STYLE, DEFAULT_RIVER_STYLE } from '../data/mapSchema.js';

/**
 * Manages all tool-selection state and the in-progress path being drawn
 * for the Road and River tools.
 *
 * Roads and rivers share identical interaction logic (click to extend,
 * double-click or Enter to commit, Escape to cancel). They differ only
 * in their default styles.
 */
export function useTools() {
  const [selectedTool, setSelectedTool] = useState('tile');
  const [selectedTile, setSelectedTile] = useState('plains');
  const [isErasing, setIsErasing] = useState(false);
  const [libraryColumns, setLibraryColumns] = useState(1);

  // ── Path drawing (Road / River) ───────────────────────────────────────────

  // The hex path being built while the user is clicking cells.
  const [activePath, setActivePath] = useState([]);
  const [isDrawingPath, setIsDrawingPath] = useState(false);

  // Per-session style overrides the user can change in the sidebar.
  // Stored here so they persist across path commits within one session.
  const [roadStyle, setRoadStyle] = useState({ ...DEFAULT_ROAD_STYLE });
  const [riverStyle, setRiverStyle] = useState({ ...DEFAULT_RIVER_STYLE });

  // Derive the active style based on which path tool is selected
  const activePathStyle =
    selectedTool === 'road' ? roadStyle :
    selectedTool === 'river' ? riverStyle :
    null;

  // ── Tool switching ────────────────────────────────────────────────────────

  const selectTool = useCallback((tool) => {
    // Cancel any in-progress path when switching tools
    setActivePath([]);
    setIsDrawingPath(false);
    setSelectedTool(tool);
    if (tool !== 'tile') setIsErasing(false);
  }, []);

  const selectTile = useCallback((tileId) => {
    setSelectedTile(tileId);
    setIsErasing(false);
  }, []);

  const toggleErase = useCallback(() => {
    setIsErasing(prev => !prev);
  }, []);

  // ── Path building ─────────────────────────────────────────────────────────

  /**
   * Add a hex to the in-progress path.
   * If the hex is the same as the last point, ignore (prevents duplicates on
   * slow double-clicks that fire two single-click events).
   */
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

  /**
   * Commit the current path and return it (so App can pass it to useMapData).
   * Resets in-progress state.
   * Returns null if the path is too short to commit.
   */
  const commitPath = useCallback(() => {
    if (activePath.length < 2) {
      cancelPath();
      return null;
    }
    const committed = [...activePath];
    setActivePath([]);
    setIsDrawingPath(false);
    return committed;
  }, [activePath]);

  /**
   * Discard the current in-progress path.
   */
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
    }));
  }, []);

  // ── Library column width ──────────────────────────────────────────────────

  const setColumns = useCallback((n) => {
    setLibraryColumns(Math.max(1, Math.min(3, n)));
  }, []);

  return {
    // Tool selection
    selectedTool,
    selectTool,
    selectedTile,
    selectTile,
    isErasing,
    toggleErase,
    libraryColumns,
    setColumns,
    // Path drawing
    activePath,
    isDrawingPath,
    extendPath,
    commitPath,
    cancelPath,
    // Styles
    roadStyle,
    riverStyle,
    activePathStyle,
    updateRoadStyle,
    updateRiverStyle,
  };
}
