import { useState, useCallback } from 'react';

const MIN_SCALE = 0.2;
const MAX_SCALE = 4;

const DEFAULT_VIEWPORT = { x: 0, y: 0, scale: 1 };

/**
 * Manages the canvas viewport: pan position and zoom scale.
 *
 * Returns viewport state and all event handlers needed for pan/zoom.
 * The canvas component calls these handlers from its mouse/wheel events.
 */
export function useViewport(initialViewport = DEFAULT_VIEWPORT) {
  const [viewport, setViewport] = useState(initialViewport);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const clampScale = (s) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, s));

  // ── Direct setters ────────────────────────────────────────────────────────

  const setViewportDirect = useCallback((vp) => {
    setViewport(vp);
  }, []);

  const resetViewport = useCallback(() => {
    setViewport(DEFAULT_VIEWPORT);
  }, []);

  const zoomBy = useCallback((delta) => {
    setViewport(prev => ({ ...prev, scale: clampScale(prev.scale + delta) }));
  }, []);

  const zoomTo = useCallback((scale) => {
    setViewport(prev => ({ ...prev, scale: clampScale(scale) }));
  }, []);

  // ── Mouse event handlers ──────────────────────────────────────────────────

  /**
   * Call from the canvas onMouseDown when the hand tool is active
   * or when the user holds Space.
   */
  const startDrag = useCallback((clientX, clientY) => {
    setIsDragging(true);
    setDragStart(prev => ({ x: clientX - prev.x, y: clientY - prev.y }));
    // Re-anchor dragStart relative to current viewport
    setViewport(vp => {
      setDragStart({ x: clientX - vp.x, y: clientY - vp.y });
      return vp;
    });
  }, []);

  const continueDrag = useCallback((clientX, clientY) => {
    if (!isDragging) return;
    setViewport(prev => ({
      ...prev,
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    }));
  }, [isDragging, dragStart]);

  const endDrag = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * Wheel handler — Ctrl/Cmd + scroll = zoom, plain scroll = pan.
   */
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      setViewport(prev => ({ ...prev, scale: clampScale(prev.scale * factor) }));
    } else {
      setViewport(prev => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  }, []);

  return {
    viewport,
    setViewport: setViewportDirect,
    resetViewport,
    zoomBy,
    zoomTo,
    isDragging,
    startDrag,
    continueDrag,
    endDrag,
    handleWheel,
  };
}
