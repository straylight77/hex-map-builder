import { useEffect, useRef } from 'react';
import { renderTilePreview } from '../rendering/drawPrimitives.js';

/**
 * Renders a single terrain tile as a small hex preview image.
 *
 * @param {{ terrain: object, size: number }} props
 *   terrain — a TERRAIN_TILES entry ({ id, name, color, drawPattern })
 *   size    — logical display size in CSS pixels (canvas renders at 2×)
 */
export function TilePreview({ terrain, size = 50 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      renderTilePreview(canvasRef.current, terrain, size);
    }
  }, [terrain, size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size * 2, height: size * 2 }}
      className="block"
    />
  );
}
