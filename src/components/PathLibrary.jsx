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

function modeHint(toolLabel, pathToolMode, isDrawingPath, activePath, hasSelection) {
  const tool = toolLabel.toLowerCase();
  if (pathToolMode === 'draw') {
    return isDrawingPath
      ? `${activePath?.length ?? 0} point${activePath?.length !== 1 ? 's' : ''} — click to extend`
      : `Click a cell to start drawing a ${tool}.`;
  }
  if (pathToolMode === 'select') {
    return hasSelection ? `${toolLabel} selected — edit below.` : `Click a ${tool} to select it.`;
  }
  if (pathToolMode === 'erase') {
    return `Click a ${tool} to erase it.`;
  }
  return null;
}

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
}) {
  const canCommit    = activePath?.length >= 2;
  const hasSelection = !!selectedPathId;

  const editStyle   = pathToolMode === 'select' && hasSelection ? selectedPathStyle : style;
  const editUpdater = pathToolMode === 'select' && hasSelection ? onUpdateSelectedStyle : onUpdateStyle;

  const meander   = editStyle?.meander;
  const algorithm = editStyle?.algorithm ?? 'meander'; // 'smooth' | 'meander'

  const showAlgorithmControls = isRiver && (pathToolMode === 'draw' || (pathToolMode === 'select' && hasSelection));

  const swatches = isRiver ? RIVER_SWATCHES : ROAD_SWATCHES;
  const hint     = modeHint(toolLabel, pathToolMode, isDrawingPath, activePath, hasSelection);

  return (
    <div className="absolute right-0 top-0 bottom-0 z-10" style={{ width: PANEL_WIDTH }}>
      <div className="bg-white border-l border-gray-300 h-full flex flex-col">

        {/* Header */}
        <div className="px-3 py-2 border-b border-gray-200 flex-shrink-0">
          <span className="text-sm font-semibold text-gray-700">{toolLabel}s</span>
        </div>

        {/* Draw / Select / Erase */}
        <div className="px-3 pt-2 flex gap-1.5 flex-shrink-0">
          {MODES.map(({ id, icon, label }) => {
            const isActive   = pathToolMode === id;
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

        {/* One-liner hint */}
        {hint && (
          <p className={`px-3 pt-1.5 pb-2 text-xs border-b border-gray-200 ${
            pathToolMode === 'erase' ? 'text-red-500' : 'text-gray-500'
          }`}>
            {hint}
          </p>
        )}

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

          {editStyle && (pathToolMode === 'draw' || (pathToolMode === 'select' && hasSelection)) && (
            <>
              {/* Color */}
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
                <div className="flex gap-1">
                  {DASH_OPTIONS.map(({ label, dash }) => {
                    const active = JSON.stringify(editStyle.dash) === JSON.stringify(dash);
                    return (
                      <button
                        key={label}
                        onClick={() => editUpdater({ dash })}
                        className={`flex-1 text-xs px-2 py-1 rounded border text-center ${
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

              {/* Path Algorithm (rivers only) */}
              {showAlgorithmControls && (
                <div className="border-t border-gray-200 pt-3 space-y-3">
                  <span className="text-sm font-semibold text-gray-700">Path Algorithm</span>

                  <div className="flex gap-1 mt-1">
                    {[
                      { id: 'smooth',  label: 'Smooth'  },
                      { id: 'meander', label: 'Meander' },
                    ].map(({ id, label }) => (
                      <button
                        key={id}
                        onClick={() => editUpdater({ algorithm: id })}
                        className={`flex-1 text-xs px-2 py-1.5 rounded border font-medium transition-colors ${
                          algorithm === id
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-300 text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Smooth controls */}
                  {algorithm === 'smooth' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Tension: {(editStyle.spline?.tension ?? 0.5).toFixed(2)}
                      </label>
                      <input
                        type="range" min="0" max="1" step="0.05"
                        value={editStyle.spline?.tension ?? 0.5}
                        onChange={e => editUpdater({ spline: { tension: parseFloat(e.target.value) } })}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                        <span>Sharp</span><span>Gentle</span>
                      </div>
                    </div>
                  )}

                  {/* Meander controls */}
                  {algorithm === 'meander' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Amplitude: {(meander?.amplitude ?? 0.70).toFixed(2)}
                        </label>
                        <input
                          type="range" min="0" max="1" step="0.05"
                          value={meander?.amplitude ?? 0.70}
                          onChange={e => editUpdater({ meander: { amplitude: parseFloat(e.target.value) } })}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                          <span>Subtle</span><span>Wild</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Fractal Depth: {meander?.depth ?? 3}
                        </label>
                        <input
                          type="range" min="1" max="5" step="1"
                          value={meander?.depth ?? 3}
                          onChange={e => editUpdater({ meander: { depth: parseInt(e.target.value) } })}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                          <span>Simple</span><span>Complex</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Extra Points: {meander?.points ?? 1}
                        </label>
                        <input
                          type="range" min="0" max="3" step="1"
                          value={meander?.points ?? 1}
                          onChange={e => editUpdater({ meander: { points: parseInt(e.target.value) } })}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                          <span>Sparse</span><span>Dense</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Path Smoothing (roads only) */}
              {!isRiver && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-semibold text-gray-700">Path Smoothing</label>
                    <button
                      onClick={() => editUpdater({ spline: { enabled: !editStyle.spline?.enabled } })}
                      className={`text-xs px-2 py-1 rounded border ${
                        editStyle.spline?.enabled
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-500 hover:border-gray-400'
                      }`}
                    >
                      {editStyle.spline?.enabled ? '✓ On' : 'Off'}
                    </button>
                  </div>
                  {editStyle.spline?.enabled && (
                    <div className="mt-2">
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
                        <span>Sharp</span><span>Gentle</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Draw mode: commit/cancel */}
          {pathToolMode === 'draw' && isDrawingPath && (
            <div className="border-t border-gray-200 pt-3 space-y-2">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
