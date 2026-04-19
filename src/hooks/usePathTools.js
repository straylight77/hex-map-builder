import { useState, useCallback } from 'react';
import { DEFAULT_ROAD_STYLE, DEFAULT_RIVER_STYLE } from '../data/mapSchema.js';
import { mergeStyle } from '../utils/styleUtils.js';

/**
 * Manages all state and actions for Road and River path tools.
 * Mode: 'draw' | 'select' | 'erase'
 */
export function usePathTools() {
  const [mode, setModeState]       = useState('draw');
  const [selectedPathId, setSelectedPathId] = useState(null);
  const [hoveredPathId, setHoveredPathId]   = useState(null);
  const [activePath, setActivePath]         = useState([]);
  const [isDrawing, setIsDrawing]           = useState(false);
  const [roadStyle, setRoadStyle]   = useState({ ...DEFAULT_ROAD_STYLE });
  const [riverStyle, setRiverStyle] = useState({ ...DEFAULT_RIVER_STYLE });

  const setMode = useCallback((next) => {
    if (next === 'select' || next === 'erase') {
      setActivePath([]);
      setIsDrawing(false);
      setHoveredPathId(null);
    }
    if (next === 'draw') {
      setHoveredPathId(null);
      setSelectedPathId(null);
    }
    setModeState(next);
  }, []);

  const extendPath = useCallback((q, r) => {
    setActivePath(prev => {
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        if (last.q === q && last.r === r) return prev;
      }
      setIsDrawing(true);
      return [...prev, { q, r }];
    });
  }, []);

  const commitPath = useCallback(() => {
    if (activePath.length < 2) {
      setActivePath([]);
      setIsDrawing(false);
      return null;
    }
    const committed = [...activePath];
    setActivePath([]);
    setIsDrawing(false);
    return committed;
  }, [activePath]);

  const cancelPath = useCallback(() => {
    setActivePath([]);
    setIsDrawing(false);
  }, []);

  const selectPath      = useCallback((id) => setSelectedPathId(id), []);
  const clearSelection  = useCallback(() => setSelectedPathId(null), []);
  const hoverPath       = useCallback((id) => setHoveredPathId(id), []);

  const updateRoadStyle = useCallback((updates) => {
    setRoadStyle(prev => mergeStyle(prev, updates));
  }, []);

  const updateRiverStyle = useCallback((updates) => {
    setRiverStyle(prev => mergeStyle(prev, updates));
  }, []);

  const reset = useCallback((mode) => {
    setActivePath([]);
    setIsDrawing(false);
    setSelectedPathId(null);
    setHoveredPathId(null);
    if (mode) setModeState(mode);
  }, []);

  return {
    mode,
    setMode,
    selectedPathId,
    selectPath,
    clearSelection,
    hoveredPathId,
    hoverPath,
    activePath,
    isDrawing,
    extendPath,
    commitPath,
    cancelPath,
    roadStyle,
    riverStyle,
    updateRoadStyle,
    updateRiverStyle,
    reset,
    // Derived
    isErasing: mode === 'erase',
    canCommit: activePath.length >= 2,
  };
}
