import { Pencil, MousePointer2, Eraser } from 'lucide-react';
import { TERRAIN_TILES } from '../data/terrain.js';
import { TilePreview } from './TilePreview.jsx';

export const PANEL_WIDTH = 268;
const GRID_COLUMNS = 2;

const CUSTOM_TILE  = TERRAIN_TILES.find(t => t.isCustom);
const OTHER_TILES  = TERRAIN_TILES.filter(t => !t.isCustom);
export const ORDERED_TILES = CUSTOM_TILE ? [CUSTOM_TILE, ...OTHER_TILES] : [...TERRAIN_TILES];

const MODES = [
  { id: 'draw',   icon: <Pencil size={14} />,        label: 'Draw'   },
  { id: 'select', icon: <MousePointer2 size={14} />,  label: 'Select' },
  { id: 'erase',  icon: <Eraser size={14} />,         label: 'Erase'  },
];

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

  const activeTileId = (tileToolMode === 'select' && hasSelection)
    ? selectedHexTileId
    : selectedTile;

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

        {/* Draw / Select / Erase — unified mode row */}
        <div className="px-3 py-2 border-b border-gray-200 flex gap-1.5 flex-shrink-0">
          {MODES.map(({ id, icon, label }) => {
            const isActive = tileToolMode === id;
            const isEraseBtn = id === 'erase';
            return (
              <button
                key={id}
                onClick={() => onSetTileMode(id)}
                title={label}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded text-xs font-medium border transition-colors ${
                  isActive
                    ? isEraseBtn
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-blue-500 text-white border-blue-500'
                    : isEraseBtn
                      ? 'border-red-300 text-red-500 hover:border-red-400 hover:bg-red-50'
                      : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                {icon}
                <span style={{ fontSize: '10px' }}>{label}</span>
              </button>
            );
          })}
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

        {/* Erase mode hint */}
        {tileToolMode === 'erase' && (
          <div className="px-3 pt-2 flex-shrink-0">
            <p className="text-xs text-red-500">Click a hex to erase its tile.</p>
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
                  activeTileId === terrain.id && tileToolMode !== 'erase'
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
