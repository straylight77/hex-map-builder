import { useEffect, useRef } from 'react';
import { renderTilePreview } from '../rendering/drawPrimitives.js';

/**
 * Renders a single terrain tile as a small hex preview image.
 *
 * @param {{ terrain: object, size: number, customColor?: string }} props
 *   terrain     — a TERRAIN_TILES entry ({ id, name, color, drawPattern })
 *   size        — logical display size in CSS pixels (canvas renders at 2×)
 *   customColor — override color for custom tiles
 */
export function TilePreview({ terrain, size = 50, customColor = null }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current) {
      renderTilePreview(canvasRef.current, terrain, size, customColor);
    }
  }, [terrain, size, customColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size * 2, height: size * 2 }}
      className="block"
    />
  );
}
