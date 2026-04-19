import { useState, useCallback } from 'react';
import {
  DEFAULT_FEATURE_COLOR,
  DEFAULT_FEATURE_SIZE,
  DEFAULT_FEATURE_ROTATION,
} from '../data/features.js';

/**
 * Manages all state and actions for the Feature tool.
 * Mode: 'draw' | 'select' | 'erase'
 */
export function useFeatureTools() {
  const [mode, setModeState]         = useState('draw');
  const [selectedId, setSelectedId]  = useState('village'); // valid default
  const [color, setColor]            = useState(DEFAULT_FEATURE_COLOR);
  const [size, setSize]              = useState(DEFAULT_FEATURE_SIZE);
  const [rotation, setRotation]      = useState(DEFAULT_FEATURE_ROTATION);
  const [selectedHex, setSelectedHex] = useState(null);

  const setMode = useCallback((next) => {
    if (next !== 'select') setSelectedHex(null);
    setModeState(next);
  }, []);

  const selectHex      = useCallback((hex) => setSelectedHex(hex), []);
  const clearSelection  = useCallback(() => setSelectedHex(null), []);

  const reset = useCallback((mode) => {
    if (mode) setModeState(mode);
    setSelectedHex(null);
  }, []);

  /** Build the feature data payload for placement. */
  const buildFeatureData = useCallback(() => ({
    id: selectedId,
    color,
    size,
    rotation,
  }), [selectedId, color, size, rotation]);

  return {
    mode,
    setMode,
    selectedId,
    setSelectedId,
    color,
    setColor,
    size,
    setSize,
    rotation,
    setRotation,
    selectedHex,
    selectHex,
    clearSelection,
    buildFeatureData,
    reset,
    // Derived
    isErasing: mode === 'erase',
  };
}
