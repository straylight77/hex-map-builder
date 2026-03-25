import { Eraser, ChevronLeft, ChevronRight } from 'lucide-react';
import { TERRAIN_TILES } from '../data/terrain.js';
import { TilePreview } from './TilePreview.jsx';

/**
 * Right-hand tile selection panel.
 *
 * @param {{
 *   selectedTile: string,
 *   onSelectTile: (id: string) => void,
 *   isErasing: boolean,
 *   onToggleErase: () => void,
 *   columns: number,
 *   onSetColumns: (n: number) => void,
 * }} props
 */
export function TileLibrary({
  selectedTile,
  onSelectTile,
  isErasing,
  onToggleErase,
  columns,
  onSetColumns,
}) {
  const panelWidth = columns * 128;

  return (
    <div
      className="absolute right-0 top-0 bottom-0 z-10"
      style={{ width: panelWidth }}
    >
      <div className="bg-white border-l border-gray-300 h-full flex flex-col">
        {/* Panel header */}
        <div className="p-2 border-b border-gray-300 flex justify-between items-center">
          <button
            onClick={onToggleErase}
            title="Erase Tiles"
            className={`p-2 rounded ${
              isErasing ? 'bg-red-500 text-white' : 'hover:bg-gray-100'
            }`}
          >
            <Eraser size={18} />
          </button>

          <div className="flex gap-1">
            <button
              onClick={() => onSetColumns(columns + 1)}
              disabled={columns >= 3}
              title="Expand library"
              className={`p-2 rounded ${
                columns >= 3 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'
              }`}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => onSetColumns(columns - 1)}
              disabled={columns <= 1}
              title="Collapse library"
              className={`p-2 rounded ${
                columns <= 1 ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'
              }`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Tile grid */}
        <div className="flex-1 overflow-y-auto p-2">
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {TERRAIN_TILES.map(terrain => (
              <button
                key={terrain.id}
                onClick={() => onSelectTile(terrain.id)}
                className={`flex flex-col items-center p-2 rounded border-2 transition-all ${
                  selectedTile === terrain.id && !isErasing
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <TilePreview terrain={terrain} size={50} />
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
