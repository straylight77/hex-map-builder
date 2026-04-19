import { useState, useCallback } from 'react';
import { useTileTools }    from './useTileTools.js';
import { useFeatureTools } from './useFeatureTools.js';
import { usePathTools }    from './usePathTools.js';

/**
 * Thin coordinator hook.
 *
 * Owns only `selectedTool` and delegates all tool-specific state to the three
 * focused hooks: useTileTools, useFeatureTools, usePathTools.
 *
 * Consumers should prefer importing the per-tool hooks directly when a
 * component only cares about one tool.
 */
export function useTools() {
  const [selectedTool, setSelectedToolState] = useState('tile');

  const tile    = useTileTools();
  const feature = useFeatureTools();
  const path    = usePathTools();

  const selectTool = useCallback((tool) => {
    // Reset all sub-tools when switching
    tile.reset();
    feature.reset();
    path.reset();
    setSelectedToolState(tool);
  }, [tile, feature, path]);

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
    tile,
    feature,
    path,
    // Convenience pass-throughs consumed by App / renderer
    activePathStyle,
    activeToolIsErasing,
  };
}
