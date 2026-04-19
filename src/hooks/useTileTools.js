import { useState, useCallback } from 'react';

/**
 * Manages all state and actions for the Tile tool.
 * Mode: 'draw' | 'select' | 'erase'
 */
export function useTileTools() {
  const [mode, setModeState]       = useState('draw');
  const [selectedTile, setSelectedTile] = useState('custom');
  const [customColor, setCustomColor]   = useState('#cccccc');
  const [selectedHex, setSelectedHex]   = useState(null);

  const setMode = useCallback((next) => {
    if (next !== 'select') setSelectedHex(null);
    setModeState(next);
  }, []);

  const selectHex     = useCallback((hex) => setSelectedHex(hex), []);
  const clearSelection = useCallback(() => setSelectedHex(null), []);

  const reset = useCallback(() => {
    setModeState('draw');
    setSelectedHex(null);
  }, []);

  return {
    mode,
    setMode,
    selectedTile,
    setSelectedTile,
    customColor,
    setCustomColor,
    selectedHex,
    selectHex,
    clearSelection,
    reset,
    // Derived
    isErasing: mode === 'erase',
  };
}
