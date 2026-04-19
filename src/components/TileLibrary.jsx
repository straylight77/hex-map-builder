import { useState } from 'react';
import { Pencil, MousePointer2, Eraser, LayoutList, LayoutGrid } from 'lucide-react';
import { ORDERED_TILES } from '../data/terrain.js';
import { TilePreview } from './TilePreview.jsx';
import { SwatchColorPicker, TILE_SWATCHES } from './SwatchColorPicker.jsx';

export const PANEL_WIDTH = 268;

const MODES = [
  { id: 'draw',   icon: <Pencil size={14} />,        label: 'Draw'   },
  { id: 'select', icon: <MousePointer2 size={14} />,  label: 'Select' },
  { id: 'erase',  icon: <Eraser size={14} />,         label: 'Erase'  },
];

function modeHint(tileToolMode, hasSelection) {
  if (tileToolMode === 'draw')   return 'Click or drag to paint tiles.';
  if (tileToolMode === 'erase')  return 'Click or drag to erase tiles.';
  if (tileToolMode === 'select') return hasSelection
    ? 'Hex selected — pick a new tile below.'
    : 'Click a painted hex to select it.';
  return null;
}

function TileItem({ terrain, isActive, customColor, onClick, view }) {
  const previewSize = view === 'list' ? 18 : 36;

  if (view === 'list') {
    return (
      <button
        onClick={onClick}
        className={`w-full flex items-center gap-2 px-2 py-1 rounded border transition-all text-left ${
          isActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-transparent hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <div className="flex-shrink-0">
          <TilePreview
            terrain={terrain}
            size={previewSize}
            customColor={terrain.isCustom ? customColor : null}
          />
        </div>
        <span className="text-xs text-gray-700 leading-tight">{terrain.name}</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center p-2 rounded border-2 transition-all ${
        isActive
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <TilePreview
        terrain={terrain}
        size={previewSize}
        customColor={terrain.isCustom ? customColor : null}
      />
      <span className="text-xs mt-1 text-center leading-tight">{terrain.name}</span>
    </button>
  );
}

export function TileLibrary({
  tileToolMode,
  onSetTileMode,
  selectedTile,
  onSelectTile,
  customTileColor,
  onSetCustomTileColor,
  selectedHex,
  selectedHexTileId,
  selectedHexCustomColor,
  onDeleteSelected,
}) {
  const [view, setView] = useState('list');

  const hasSelection = !!selectedHex && !!selectedHexTileId;

  const activeTileId = (tileToolMode === 'select' && hasSelection)
    ? selectedHexTileId
    : selectedTile;

  const activeCustomColor =
    (tileToolMode === 'select' && hasSelection && selectedHexTileId === 'custom')
      ? (selectedHexCustomColor ?? customTileColor)
      : customTileColor;

  const hint = modeHint(tileToolMode, hasSelection);
  const showPicker = tileToolMode === 'draw' || (tileToolMode === 'select' && hasSelection);

  return (
    <div className="absolute right-0 top-0 bottom-0 z-10" style={{ width: PANEL_WIDTH }}>
      <div className="bg-white border-l border-gray-300 h-full flex flex-col">

        {/* Header */}
        <div className="px-3 py-2 border-b border-gray-200 flex-shrink-0">
          <span className="text-sm font-semibold text-gray-700">Tiles</span>
        </div>

        {/* Draw / Select / Erase */}
        <div className="px-3 pt-2 flex gap-1.5 flex-shrink-0">
          {MODES.map(({ id, icon, label }) => {
            const isActive   = tileToolMode === id;
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

        {/* One-liner hint */}
        {hint && (
          <p className={`px-3 pt-1.5 pb-2 text-xs border-b border-gray-200 ${
            tileToolMode === 'erase' ? 'text-red-500' : 'text-gray-500'
          }`}>
            {hint}
          </p>
        )}

        {/* Custom color */}
        {showPicker && (
          <div className="px-3 py-2 border-b border-gray-200 flex-shrink-0">
            <SwatchColorPicker
              swatches={TILE_SWATCHES}
              value={activeCustomColor}
              onChange={color => { onSetCustomTileColor(color); onSelectTile('custom'); }}
              label="Custom tile color"
            />
          </div>
        )}

        {/* Select mode: delete button */}
        {tileToolMode === 'select' && (
          <div className="px-3 py-2 border-b border-gray-200 flex-shrink-0">
            <button
              onClick={onDeleteSelected}
              disabled={!hasSelection}
              className={`w-full py-1.5 rounded text-xs font-medium border-2 transition-colors ${
                hasSelection
                  ? 'bg-red-500 text-white border-red-500 hover:bg-red-600'
                  : 'border-gray-200 text-gray-300 cursor-not-allowed'
              }`}
            >
              Delete Tile
            </button>
          </div>
        )}

        {/* View toggle + tile picker */}
        {showPicker && (
          <>
            {/* View toggle bar — sits directly above the list/grid */}
            <div className="px-3 py-1.5 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <span className="text-xs font-medium text-gray-500">Tiles</span>
              <div className="flex gap-0.5">
                <button
                  onClick={() => setView('list')}
                  title="List view"
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${
                    view === 'list'
                      ? 'bg-blue-100 text-blue-600 font-medium'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <LayoutList size={13} />
                  <span>List</span>
                </button>
                <button
                  onClick={() => setView('card')}
                  title="Card view"
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${
                    view === 'card'
                      ? 'bg-blue-100 text-blue-600 font-medium'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <LayoutGrid size={13} />
                  <span>Grid</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {view === 'list' ? (
                <div className="p-2 space-y-0.5">
                  {ORDERED_TILES.map(terrain => (
                    <TileItem
                      key={terrain.id}
                      terrain={terrain}
                      isActive={activeTileId === terrain.id}
                      customColor={activeCustomColor}
                      onClick={() => onSelectTile(terrain.id)}
                      view="list"
                    />
                  ))}
                </div>
              ) : (
                <div className="p-2 grid grid-cols-2 gap-2">
                  {ORDERED_TILES.map(terrain => (
                    <TileItem
                      key={terrain.id}
                      terrain={terrain}
                      isActive={activeTileId === terrain.id}
                      customColor={activeCustomColor}
                      onClick={() => onSelectTile(terrain.id)}
                      view="card"
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {tileToolMode === 'erase' && <div className="flex-1" />}
      </div>
    </div>
  );
}
