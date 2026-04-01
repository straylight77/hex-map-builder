import { Pencil, MousePointer2 } from 'lucide-react';
import { TERRAIN_TILES } from '../data/terrain.js';
import { TilePreview } from './TilePreview.jsx';

export const PANEL_WIDTH = 268;
const GRID_COLUMNS = 2;

// Custom tile first, then the rest in original order
const CUSTOM_TILE  = TERRAIN_TILES.find(t => t.isCustom);
const OTHER_TILES  = TERRAIN_TILES.filter(t => !t.isCustom);
export const ORDERED_TILES = CUSTOM_TILE ? [CUSTOM_TILE, ...OTHER_TILES] : [...TERRAIN_TILES];

/**
 * Right-hand panel for the Tile tool.
 *
 * Draw mode   — clicking a hex paints the selected tile.
 * Select mode — clicking a painted hex selects it; controls edit that hex's tile/color.
 * Erase       — removes the tile on click (independent of draw/select mode).
 */
export function TileLibrary({
  tileToolMode,
  onSetTileMode,
  selectedTile,
  onSelectTile,
  isErasing,
  onToggleErase,
  customTileColor,
  onSetCustomTileColor,
  selectedHex,
  selectedHexTileId,
  selectedHexCustomColor,
}) {
  const hasSelection = !!selectedHex && !!selectedHexTileId;

  // Which tile to highlight in the grid
  const activeTileId = (tileToolMode === 'select' && hasSelection)
    ? selectedHexTileId
    : selectedTile;

  // Which custom color to show / edit
  const activeCustomColor =
    (tileToolMode === 'select' && hasSelection && selectedHexTileId === 'custom')
      ? (selectedHexCustomColor ?? customTileColor)
      : customTileColor;

  return (
    <div className="absolute right-0 top-0 bottom-0 z-10" style={{ width: PANEL_WIDTH }}>
      <div className="bg-white border-l border-gray-300 h-full flex flex-col">

        {/* Header */}
        <div className="px-3 py-2 border-b border-gray-200 flex-shrink-0">
          <span className="text-sm font-semibold text-gray-700">Tiles</span>
        </div>

        {/* Draw / Select */}
        <div className="px-3 py-2 border-b border-gray-200 flex gap-2 flex-shrink-0">
          <button
            onClick={() => onSetTileMode('draw')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium border transition-colors ${
              tileToolMode === 'draw'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <Pencil size={13} /> Draw
          </button>
          <button
            onClick={() => onSetTileMode('select')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium border transition-colors ${
              tileToolMode === 'select'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <MousePointer2 size={13} /> Select
          </button>
        </div>

        {/* Erase */}
        <div className="px-3 py-2 border-b border-gray-200 flex-shrink-0">
          <button
            onClick={onToggleErase}
            className={`w-full py-1.5 rounded text-xs font-medium border-2 transition-colors ${
              isErasing
                ? 'bg-red-500 text-white border-red-500'
                : 'border-red-400 text-red-500 hover:bg-red-50'
            }`}
          >
            Erase Tiles
          </button>
        </div>

        {/* Custom color — always visible */}
        <div className="px-3 py-2 border-b border-gray-200 flex-shrink-0">
          <label className="block text-xs font-medium text-gray-600 mb-1">Custom tile color</label>
          <input
            type="color"
            value={activeCustomColor}
            onChange={e => onSetCustomTileColor(e.target.value)}
            className="w-full h-8 cursor-pointer rounded border border-gray-300"
          />
        </div>

        {/* Select-mode hint */}
        {tileToolMode === 'select' && (
          <div className="px-3 pt-2 flex-shrink-0">
            {hasSelection
              ? <p className="text-xs text-blue-600 font-medium">Hex selected — pick a new tile below</p>
              : <p className="text-xs text-gray-400">Click a painted hex to select it.</p>
            }
          </div>
        )}

        {/* Tile grid */}
        <div className="flex-1 overflow-y-auto p-2">
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))` }}
          >
            {ORDERED_TILES.map(terrain => (
              <button
                key={terrain.id}
                onClick={() => onSelectTile(terrain.id)}
                className={`flex flex-col items-center p-2 rounded border-2 transition-all ${
                  activeTileId === terrain.id && !isErasing
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <TilePreview
                  terrain={terrain}
                  size={50}
                  customColor={terrain.isCustom ? activeCustomColor : null}
                />
                <span className="text-xs mt-1 text-center leading-tight">
                  {terrain.name}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
