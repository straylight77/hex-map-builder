import { Pencil, MousePointer2, Eraser } from 'lucide-react';
import { SwatchColorPicker, ROAD_SWATCHES, RIVER_SWATCHES } from './SwatchColorPicker.jsx';

const PANEL_WIDTH = 268;

const DASH_OPTIONS = [
  { label: 'Solid',  dash: []        },
  { label: 'Dashed', dash: [16, 10]  },
  { label: 'Dotted', dash: [3, 12]   },
];

const MODES = [
  { id: 'draw',   icon: <Pencil size={14} />,        label: 'Draw'   },
  { id: 'select', icon: <MousePointer2 size={14} />,  label: 'Select' },
  { id: 'erase',  icon: <Eraser size={14} />,         label: 'Erase'  },
];

export function PathLibrary({
  toolLabel,
  isRiver,
  pathToolMode,
  onSetPathMode,
  style,
  onUpdateStyle,
  isDrawingPath,
  activePath,
  onCommit,
  onCancel,
  selectedPathId,
  selectedPathStyle,
  onUpdateSelectedStyle,
  onDeleteSelected,
  isErasing,
  onToggleErase,
}) {
  const canCommit = activePath?.length >= 2;
  const hasSelection = !!selectedPathId;

  const editStyle   = pathToolMode === 'select' && hasSelection ? selectedPathStyle : style;
  const editUpdater = pathToolMode === 'select' && hasSelection ? onUpdateSelectedStyle : onUpdateStyle;

  const meander = editStyle?.meander;
  const showMeanderControls = isRiver && (pathToolMode === 'draw' || (pathToolMode === 'select' && hasSelection));

  // Use river or road swatches depending on tool type
  const swatches = isRiver ? RIVER_SWATCHES : ROAD_SWATCHES;

  return (
    <div className="absolute right-0 top-0 bottom-0 z-10" style={{ width: PANEL_WIDTH }}>
      <div className="bg-white border-l border-gray-300 h-full flex flex-col">

        {/* Header */}
        <div className="px-3 py-2 border-b border-gray-200 flex-shrink-0">
          <span className="text-sm font-semibold text-gray-700">{toolLabel}s</span>
        </div>

        {/* Draw / Select / Erase */}
        <div className="px-3 py-2 border-b border-gray-200 flex gap-1.5 flex-shrink-0">
          {MODES.map(({ id, icon, label }) => {
            const isActive = pathToolMode === id;
            const isEraseBtn = id === 'erase';
            return (
              <button
                key={id}
                onClick={() => onSetPathMode(id)}
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

        {/* Delete selected — only in select mode */}
        {pathToolMode === 'select' && (
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
              Delete {toolLabel}
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">

          {pathToolMode === 'erase' && (
            <p className="text-xs text-red-500 text-center pt-1">
              Hover over a {toolLabel.toLowerCase()} and click to erase it.
            </p>
          )}

          {pathToolMode === 'select' && !hasSelection && (
            <p className="text-xs text-gray-500 text-center pt-2">
              Hover over a {toolLabel.toLowerCase()} and click to select it.
            </p>
          )}

          {pathToolMode === 'select' && hasSelection && (
            <p className="text-xs text-blue-600 font-medium">
              {toolLabel} selected — edit below
            </p>
          )}

          {/* Style controls */}
          {editStyle && (pathToolMode === 'draw' || (pathToolMode === 'select' && hasSelection)) && (
            <>
              {/* Color — SwatchColorPicker */}
              <SwatchColorPicker
                swatches={swatches}
                value={editStyle.color}
                onChange={color => editUpdater({ color })}
              />

              {/* Width */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Width: {editStyle.width}px
                </label>
                <input
                  type="range" min="1" max="20"
                  value={editStyle.width}
                  onChange={e => editUpdater({ width: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Dash */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Line style</label>
                <div className="flex flex-col gap-1">
                  {DASH_OPTIONS.map(({ label, dash }) => {
                    const active = JSON.stringify(editStyle.dash) === JSON.stringify(dash);
                    return (
                      <button
                        key={label}
                        onClick={() => editUpdater({ dash })}
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

              {/* Spline */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Path smoothing</label>
                <button
                  onClick={() => editUpdater({ spline: { enabled: !editStyle.spline?.enabled } })}
                  className={`w-full text-xs px-2 py-1 rounded border ${
                    editStyle.spline?.enabled
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 text-gray-500 hover:border-gray-400'
                  }`}
                >
                  {editStyle.spline?.enabled ? '✓ Smooth curve' : 'Straight lines'}
                </button>
              </div>

              {editStyle.spline?.enabled && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Tension: {(editStyle.spline.tension ?? 0.5).toFixed(2)}
                  </label>
                  <input
                    type="range" min="0" max="1" step="0.05"
                    value={editStyle.spline.tension ?? 0.5}
                    onChange={e => editUpdater({ spline: { tension: parseFloat(e.target.value) } })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                    <span>Gentle</span><span>Sharp</span>
                  </div>
                </div>
              )}

              {/* Meander (river only) */}
              {showMeanderControls && (
                <div className="border-t border-gray-200 pt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-600">Meander</label>
                    <button
                      onClick={() => editUpdater({ meander: { enabled: !meander?.enabled } })}
                      className={`text-xs px-2 py-1 rounded border ${
                        meander?.enabled
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-500 hover:border-gray-400'
                      }`}
                    >
                      {meander?.enabled ? '✓ On' : 'Off'}
                    </button>
                  </div>

                  {meander?.enabled && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Amplitude: {(meander.amplitude ?? 0.25).toFixed(2)}
                        </label>
                        <input
                          type="range" min="0" max="1" step="0.05"
                          value={meander.amplitude ?? 0.25}
                          onChange={e => editUpdater({ meander: { amplitude: parseFloat(e.target.value) } })}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                          <span>Subtle</span><span>Wild</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Detail levels: {meander.depth ?? 2}
                        </label>
                        <input
                          type="range" min="1" max="4" step="1"
                          value={meander.depth ?? 2}
                          onChange={e => editUpdater({ meander: { depth: parseInt(e.target.value) } })}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                          <span>Simple</span><span>Complex</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Extra points: {meander.points ?? 3}
                        </label>
                        <input
                          type="range" min="0" max="8" step="1"
                          value={meander.points ?? 3}
                          onChange={e => editUpdater({ meander: { points: parseInt(e.target.value) } })}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                          <span>Sparse</span><span>Dense</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {/* Draw mode: path progress */}
          {pathToolMode === 'draw' && (
            <div className="border-t border-gray-200 pt-3 space-y-2">
              <p className="text-xs text-gray-500">
                {isDrawingPath
                  ? `${activePath?.length ?? 0} point${activePath?.length !== 1 ? 's' : ''} — click to extend`
                  : 'Click a cell to start drawing'}
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
          )}

        </div>
      </div>
    </div>
  );
}
