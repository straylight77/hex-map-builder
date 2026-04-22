import { useState, useCallback, useEffect } from 'react';
import {
  createEmptyMap,
  createRoad,
  createRiver,
  serialiseMap,
  deserialiseMap,
} from '../data/mapSchema.js';
import { hexKey } from '../utils/hex.js';
import { mergeStyle } from '../utils/styleUtils.js';

const AUTOSAVE_KEY      = 'hexmap-autosave';
const AUTOSAVE_DELAY_MS = 1000;

/**
 * Check whether axial coordinate (q, r) is within the given bounds.
 * Uses offset column so the boundary is visually rectangular.
 *
 * @param {number} q
 * @param {number} r
 * @param {{ minR: number, maxR: number, minCol: number, maxCol: number }} bounds
 */
function isInBounds(q, r, bounds) {
  const col = q + Math.floor(r / 2);
  return r >= bounds.minR && r <= bounds.maxR &&
         col >= bounds.minCol && col <= bounds.maxCol;
}

export function useMapData() {
  const [mapDoc, setMapDoc] = useState(() => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) return deserialiseMap(JSON.parse(saved));
    } catch {}
    return createEmptyMap();
  });

  // ── Autosave ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(serialiseMap(mapDoc)));
      } catch {}
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [mapDoc]);

  // ── Tile operations ───────────────────────────────────────────────────────

  const placeTile = useCallback((q, r, tileType, extraData = {}) => {
    const key = hexKey(q, r);
    setMapDoc(prev => {
      if (!isInBounds(q, r, prev.bounds)) return prev;
      const tiles = new Map(prev.tiles);
      tiles.set(key, { type: tileType, ...extraData });
      return { ...prev, tiles };
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

  // ── Feature operations ────────────────────────────────────────────────────

  const placeFeature = useCallback((q, r, featureData) => {
    const key = hexKey(q, r);
    setMapDoc(prev => {
      const features = new Map(prev.features);
      features.set(key, { ...featureData });
      return { ...prev, features };
    });
  }, []);

  const removeFeature = useCallback((q, r) => {
    const key = hexKey(q, r);
    setMapDoc(prev => {
      const features = new Map(prev.features);
      features.delete(key);
      return { ...prev, features };
    });
  }, []);

  const updateFeature = useCallback((q, r, updates) => {
    const key = hexKey(q, r);
    setMapDoc(prev => {
      const existing = prev.features.get(key);
      if (!existing) return prev;
      const features = new Map(prev.features);
      features.set(key, { ...existing, ...updates });
      return { ...prev, features };
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

  const updateRoad = useCallback((id, changes) => {
    setMapDoc(prev => ({
      ...prev,
      roads: prev.roads.map(r =>
        r.id !== id ? r : { ...r, style: mergeStyle(r.style, changes) }
      ),
    }));
  }, []);

  const updateRiver = useCallback((id, changes) => {
    setMapDoc(prev => ({
      ...prev,
      rivers: prev.rivers.map(r =>
        r.id !== id ? r : { ...r, style: mergeStyle(r.style, changes) }
      ),
    }));
  }, []);

  // ── Map-level operations ──────────────────────────────────────────────────

  const clearMap = useCallback(() => setMapDoc(createEmptyMap()), []);

  /**
   * Resize the map by moving individual edges.
   *
   * Positive values expand outward; negative values contract inward.
   *   north (positive) → minR decreases (adds rows above)
   *   south (positive) → maxR increases (adds rows below)
   *   east  (positive) → maxCol increases (adds columns to the right)
   *   west  (positive) → minCol decreases (adds columns to the left)
   *
   * When contracting, all tiles / features / road & river waypoints are
   * checked against the new bounds. If any data would be lost the resize is
   * blocked and the user is alerted.
   *
   * @param {{ north: number, south: number, east: number, west: number }} deltas
   */
  const resizeMap = useCallback(({ north = 0, south = 0, east = 0, west = 0 }) => {
    setMapDoc(prev => {
      const newBounds = {
        minR:   prev.bounds.minR   - north,
        maxR:   prev.bounds.maxR   + south,
        minCol: prev.bounds.minCol - west,
        maxCol: prev.bounds.maxCol + east,
      };

      // Enforce minimum 1 row and 1 column
      if (newBounds.maxR   < newBounds.minR)   newBounds.maxR   = newBounds.minR;
      if (newBounds.maxCol < newBounds.minCol) newBounds.maxCol = newBounds.minCol;

      // Only run data-loss check when contracting in any direction
      const contracting = north < 0 || south < 0 || east < 0 || west < 0;

      if (contracting) {
        for (const [key] of prev.tiles) {
          const [q, r] = key.split(',').map(Number);
          if (!isInBounds(q, r, newBounds)) {
            alert(
              'Resize blocked: some tiles fall outside the new boundary. ' +
              'Delete them first, then resize.'
            );
            return prev;
          }
        }

        for (const [key] of prev.features) {
          const [q, r] = key.split(',').map(Number);
          if (!isInBounds(q, r, newBounds)) {
            alert(
              'Resize blocked: some features fall outside the new boundary. ' +
              'Delete them first, then resize.'
            );
            return prev;
          }
        }

        for (const road of prev.roads) {
          for (const { q, r } of road.path) {
            if (!isInBounds(q, r, newBounds)) {
              alert(
                'Resize blocked: one or more roads have waypoints outside the new boundary. ' +
                'Delete them first, then resize.'
              );
              return prev;
            }
          }
        }

        for (const river of prev.rivers) {
          for (const { q, r } of river.path) {
            if (!isInBounds(q, r, newBounds)) {
              alert(
                'Resize blocked: one or more rivers have waypoints outside the new boundary. ' +
                'Delete them first, then resize.'
              );
              return prev;
            }
          }
        }
      }

      return { ...prev, bounds: newBounds };
    });
  }, []);

  // Keep expandMap as an alias so App.jsx needs no changes
  const expandMap = resizeMap;

  // ── File I/O ──────────────────────────────────────────────────────────────

  const saveToFile = useCallback(() => {
    const data = serialiseMap(mapDoc);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
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
        if (raw.viewport && onViewportRestore) onViewportRestore(raw.viewport);
      } catch {
        alert('Failed to load map file.');
      }
    };
    reader.readAsText(file);
  }, []);

  return {
    mapDoc,
    placeTile, eraseTile,
    placeFeature, removeFeature, updateFeature,
    commitRoad, commitRiver, deleteRoad, deleteRiver, updateRoad, updateRiver,
    clearMap, expandMap, resizeMap,
    saveToFile, loadFromFile,
  };
}
