import { useState, useRef, useCallback } from 'react';

const MIN_SCALE = 0.1;
const MAX_SCALE = 4;

const DEFAULT_VIEWPORT = { x: 0, y: 0, scale: 0.5 };

const clampScale = (s) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, s));

/**
 * Manages the canvas viewport: pan position and zoom scale.
 *
 * dragStart is stored in a ref rather than state — it's an ephemeral
 * interaction anchor that should never trigger a re-render on its own.
 */
export function useViewport(initialViewport = DEFAULT_VIEWPORT) {
  const [viewport, setViewport]   = useState(initialViewport);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const setViewportDirect = useCallback((vp) => setViewport(vp), []);

  const resetViewport = useCallback(() => setViewport(DEFAULT_VIEWPORT), []);

  const zoomBy = useCallback((delta) => {
    setViewport(prev => ({ ...prev, scale: clampScale(prev.scale + delta) }));
  }, []);

  const zoomTo = useCallback((scale) => {
    setViewport(prev => ({ ...prev, scale: clampScale(scale) }));
  }, []);

  const startDrag = useCallback((clientX, clientY) => {
    setIsDragging(true);
    // Capture the anchor synchronously — no setter side-effect needed
    setViewport(vp => {
      dragStartRef.current = { x: clientX - vp.x, y: clientY - vp.y };
      return vp;
    });
  }, []);

  const continueDrag = useCallback((clientX, clientY) => {
    if (!isDragging) return;
    setViewport(prev => ({
      ...prev,
      x: clientX - dragStartRef.current.x,
      y: clientY - dragStartRef.current.y,
    }));
  }, [isDragging]);

  const endDrag = useCallback(() => setIsDragging(false), []);

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
