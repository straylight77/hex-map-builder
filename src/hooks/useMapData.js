import { useState, useCallback, useEffect } from 'react';
import {
  createEmptyMap,
  createRoad,
  createRiver,
  serialiseMap,
  deserialiseMap,
} from '../data/mapSchema.js';
import { hexKey } from '../utils/hex.js';

const AUTOSAVE_KEY = 'hexmap-autosave';
const AUTOSAVE_DELAY_MS = 1000;

/**
 * Owns all map document state: tiles, features, roads, rivers, dimensions.
 *
 * Handles:
 *  - Placing and erasing tiles
 *  - Committing completed roads and rivers
 *  - Auto-expanding dimensions when tiles are placed near the boundary
 *  - Autosave to localStorage (debounced)
 *  - Save to / load from JSON file
 *  - Export to PNG (requires a canvas ref from the caller)
 */
export function useMapData(onViewportLoad) {
  const [mapDoc, setMapDoc] = useState(() => {
    // Attempt to restore from autosave on first mount
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        return deserialiseMap(JSON.parse(saved));
      }
    } catch {
      // Corrupt autosave — start fresh
    }
    return createEmptyMap();
  });

  // ── Autosave ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(serialiseMap(mapDoc)));
      } catch {
        // Storage quota exceeded or unavailable — silently ignore
      }
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [mapDoc]);

  // ── Tile operations ───────────────────────────────────────────────────────

  const placeTile = useCallback((q, r, tileType) => {
    const key = hexKey(q, r);
    setMapDoc(prev => {
      const tiles = new Map(prev.tiles);
      tiles.set(key, { type: tileType });

      // Auto-expand if placing near boundary
      const { width, height } = prev.dimensions;
      const halfW = width / 2;
      const halfH = height / 2;
      const dimensions =
        Math.abs(q) >= halfW - 1 || Math.abs(r) >= halfH - 1
          ? { width: width + 5, height: height + 5 }
          : prev.dimensions;

      return { ...prev, tiles, dimensions };
    });
  }, []);

  const eraseTile = useCallback((q, r) => {
    const key = hexKey(q, r);
    setMapDoc(prev => {
      const tiles = new Map(prev.tiles);
      tiles.delete(key);
      return { ...prev, tiles };
    });
  }, []);

  // ── Road / river operations ───────────────────────────────────────────────

  const commitRoad = useCallback((hexPath, styleOverrides = {}) => {
    if (!hexPath || hexPath.length < 2) return;
    const road = createRoad(hexPath, styleOverrides);
    setMapDoc(prev => ({ ...prev, roads: [...prev.roads, road] }));
  }, []);

  const commitRiver = useCallback((hexPath, styleOverrides = {}) => {
    if (!hexPath || hexPath.length < 2) return;
    const river = createRiver(hexPath, styleOverrides);
    setMapDoc(prev => ({ ...prev, rivers: [...prev.rivers, river] }));
  }, []);

  const deleteRoad = useCallback((id) => {
    setMapDoc(prev => ({ ...prev, roads: prev.roads.filter(r => r.id !== id) }));
  }, []);

  const deleteRiver = useCallback((id) => {
    setMapDoc(prev => ({ ...prev, rivers: prev.rivers.filter(r => r.id !== id) }));
  }, []);

  // ── Map-level operations ──────────────────────────────────────────────────

  const clearMap = useCallback(() => {
    setMapDoc(createEmptyMap());
  }, []);

  const expandMap = useCallback(({ north = 0, south = 0, east = 0, west = 0 }) => {
    setMapDoc(prev => ({
      ...prev,
      dimensions: {
        width: prev.dimensions.width + east + west,
        height: prev.dimensions.height + north + south,
      },
    }));
  }, []);

  // ── File I/O ──────────────────────────────────────────────────────────────

  const saveToFile = useCallback(() => {
    const data = serialiseMap(mapDoc);
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hexmap-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [mapDoc]);

  const loadFromFile = useCallback((file, onViewportRestore) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target.result);
        const doc = deserialiseMap(raw);
        setMapDoc(doc);
        // If the save included viewport data, restore it
        if (raw.viewport && onViewportRestore) {
          onViewportRestore(raw.viewport);
        }
      } catch {
        alert('Failed to load map file — the file may be corrupt or in an unrecognised format.');
      }
    };
    reader.readAsText(file);
  }, []);

  return {
    mapDoc,
    // Tile ops
    placeTile,
    eraseTile,
    // Road/river ops
    commitRoad,
    commitRiver,
    deleteRoad,
    deleteRiver,
    // Map ops
    clearMap,
    expandMap,
    saveToFile,
    loadFromFile,
  };
}
