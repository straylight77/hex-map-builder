import { Eraser, ChevronLeft, ChevronRight, Check } from 'lucide-react';

/**
 * Shared sidebar panel for the Road and River tools.
 * Shows style controls (width, color, dash, spline settings)
 * and erase toggle.
 *
 * @param {{
 *   toolLabel: string,           e.g. "Road" or "River"
 *   style: object,               current style object
 *   onUpdateStyle: (updates) => void,
 *   isErasing: boolean,
 *   onToggleErase: () => void,
 *   isDrawingPath: boolean,
 *   activePath: Array,
 *   onCommit: () => void,
 *   onCancel: () => void,
 *   columns: number,
 *   onSetColumns: (n: number) => void,
 * }} props
 */
export function PathLibrary({
  toolLabel,
  style,
  onUpdateStyle,
  isErasing,
  onToggleErase,
  isDrawingPath,
  activePath,
  onCommit,
  onCancel,
  columns,
  onSetColumns,
}) {
  const panelWidth = columns * 128;
  const canCommit = activePath?.length >= 2;

  const handleTensionChange = (e) => {
    onUpdateStyle({ spline: { tension: parseFloat(e.target.value) } });
  };

  const handleSplineToggle = () => {
    onUpdateStyle({ spline: { enabled: !style.spline?.enabled } });
  };

  return (
    <div
      className="absolute right-0 top-0 bottom-0 z-10"
      style={{ width: Math.max(panelWidth, 200) }}
    >
      <div className="bg-white border-l border-gray-300 h-full flex flex-col">
        {/* Header */}
        <div className="p-2 border-b border-gray-300 flex justify-between items-center">
          <button
            onClick={onToggleErase}
            title={`Erase ${toolLabel}s`}
            className={`p-2 rounded ${
              isErasing ? 'bg-red-500 text-white' : 'hover:bg-gray-100'
            }`}
          >
            <Eraser size={18} />
          </button>

          <span className="text-sm font-medium text-gray-700">{toolLabel}</span>

          <div className="flex gap-1">
            <button
              onClick={() => onSetColumns(columns + 1)}
              disabled={columns >= 3}
              className={`p-2 rounded ${columns >= 3 ? 'text-gray-300' : 'hover:bg-gray-100'}`}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => onSetColumns(columns - 1)}
              disabled={columns <= 1}
              className={`p-2 rounded ${columns <= 1 ? 'text-gray-300' : 'hover:bg-gray-100'}`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Style controls */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">

          {/* Color */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
            <input
              type="color"
              value={style.color}
              onChange={e => onUpdateStyle({ color: e.target.value })}
              className="w-full h-8 cursor-pointer rounded border border-gray-300"
            />
          </div>

          {/* Width */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Width: {style.width}px
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={style.width}
              onChange={e => onUpdateStyle({ width: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Dash pattern */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Line style</label>
            <div className="flex flex-col gap-1">
              {[
                { label: 'Solid',  dash: []       },
                { label: 'Dashed', dash: [10, 5]  },
                { label: 'Dotted', dash: [2, 6]   },
              ].map(({ label, dash }) => {
                const active = JSON.stringify(style.dash) === JSON.stringify(dash);
                return (
                  <button
                    key={label}
                    onClick={() => onUpdateStyle({ dash })}
                    className={`text-xs px-2 py-1 rounded border text-left ${
                      active
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spline toggle */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Path smoothing</label>
            <button
              onClick={handleSplineToggle}
              className={`w-full text-xs px-2 py-1 rounded border ${
                style.spline?.enabled
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 text-gray-500 hover:border-gray-400'
              }`}
            >
              {style.spline?.enabled ? '✓ Smooth curve' : 'Straight lines'}
            </button>
          </div>

          {/* Tension slider — only visible when spline is on */}
          {style.spline?.enabled && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Tension: {style.spline.tension?.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={style.spline.tension ?? 0.5}
                onChange={handleTensionChange}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>Gentle</span>
                <span>Sharp</span>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-3 space-y-2">
            <p className="text-xs text-gray-500">
              {isDrawingPath
                ? `${activePath?.length ?? 0} point${activePath?.length !== 1 ? 's' : ''} — click cells to extend`
                : 'Click cells to start drawing'}
            </p>

            {isDrawingPath && (
              <>
                <button
                  onClick={onCommit}
                  disabled={!canCommit}
                  className={`w-full text-xs px-3 py-1.5 rounded ${
                    canCommit
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Finish path (Enter)
                </button>
                <button
                  onClick={onCancel}
                  className="w-full text-xs px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
                >
                  Cancel (Esc)
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
