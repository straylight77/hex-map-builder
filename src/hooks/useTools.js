import { useState, useCallback } from 'react';
import { useTileTools }    from './useTileTools.js';
import { useFeatureTools } from './useFeatureTools.js';
import { usePathTools }    from './usePathTools.js';

/**
 * Thin coordinator hook.
 *
 * Owns `selectedTool` and `activeMode` — the mode (draw/select/erase) is
 * shared across tools so switching tools preserves the user's current mode.
 *
 * Each sub-tool's reset() receives the current mode so it initialises to it
 * rather than always defaulting to 'draw'.
 */
export function useTools() {
  const [selectedTool, setSelectedToolState] = useState('tile');
  const [activeMode, setActiveMode]          = useState('draw');

  const tile    = useTileTools();
  const feature = useFeatureTools();
  const path    = usePathTools();

  // Intercept each sub-tool's setMode so activeMode stays in sync
  const tileSetMode = useCallback((mode) => {
    setActiveMode(mode);
    tile.setMode(mode);
  }, [tile]);

  const featureSetMode = useCallback((mode) => {
    setActiveMode(mode);
    feature.setMode(mode);
  }, [feature]);

  const pathSetMode = useCallback((mode) => {
    setActiveMode(mode);
    path.setMode(mode);
  }, [path]);

  const selectTool = useCallback((tool) => {
    // Clear selection state but carry the current mode into the new tool
    tile.reset(activeMode);
    feature.reset(activeMode);
    path.reset(activeMode);
    setSelectedToolState(tool);
  }, [tile, feature, path, activeMode]);

  // Convenience derived values used by the renderer and App
  const activePathStyle =
    selectedTool === 'road'  ? path.roadStyle  :
    selectedTool === 'river' ? path.riverStyle : null;

  const activeToolIsErasing =
    selectedTool === 'tile'    ? tile.isErasing    :
    selectedTool === 'feature' ? feature.isErasing :
    (selectedTool === 'road' || selectedTool === 'river') ? path.isErasing : false;

  return {
    selectedTool,
    selectTool,
    // Sub-tools with intercepted setMode
    tile:    { ...tile,    setMode: tileSetMode    },
    feature: { ...feature, setMode: featureSetMode },
    path:    { ...path,    setMode: pathSetMode    },
    // Convenience pass-throughs consumed by App / renderer
    activePathStyle,
    activeToolIsErasing,
  };
}
