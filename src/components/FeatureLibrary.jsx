import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Pencil, MousePointer2, Trash2 } from 'lucide-react';
import {
  FEATURES_BY_CATEGORY,
  FEATURE_MAP,
  FEATURE_SIZES,
  DEFAULT_FEATURE_COLOR,
} from '../data/features.js';

const COLOR_PRESETS = [
  { label: 'Black',     value: '#000000' },
  { label: 'White',     value: '#ffffff' },
  { label: 'Red',       value: '#bb2222' },
  { label: 'Dark Blue', value: '#1a3a7a' },
  { label: 'Gold',      value: '#b89500' },
];

const ROTATIONS = [0, 60, 120, 180, 240, 300];

// ── Per-feature canvas thumbnail ─────────────────────────────────────────────

function FeaturePreview({ feature, color }) {
  const canvasRef = useRef(null);
  const px = 52;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = 2;
    canvas.width  = px * dpr;
    canvas.height = px * dpr;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(px / 2, px / 2);
    // medium scale (1.0) at px=52 — coordinates designed for 70px hex,
    // so scale down a touch so the symbol fits the preview tile comfortably
    ctx.scale(0.72, 0.72);
    feature.draw(ctx, color || DEFAULT_FEATURE_COLOR);
    ctx.restore();
  }, [feature, color]);

  return (
    <canvas ref={canvasRef} style={{ width: px, height: px }} className="block" />
  );
}

// ── Main panel ───────────────────────────────────────────────────────────────

/**
 * Right-hand panel for the Feature tool.
 * Mirrors PathLibrary's Draw / Select / Delete pattern exactly.
 */
export function FeatureLibrary({
  // mode
  featureToolMode,
  onSetFeatureMode,
  // gallery selection
  selectedFeatureId,
  onSelectFeature,
  // selected-cell feature data (select mode)
  selectedFeatureHex,
  selectedFeatureData,   // { id, color, size, rotation } | null
  onDeleteSelected,
  // draw-mode style controls
  featureColor,
  onSetColor,
  featureSize,
  onSetSize,
  featureRotation,
  onSetRotation,
  // panel width
  columns,
  onSetColumns,
}) {
  const panelWidth = Math.max(columns * 90, 240);
  const hasSelection = !!selectedFeatureHex && !!selectedFeatureData;

  // In select mode with a selection: show that feature's live data in controls
  const displayColor    = featureToolMode === 'select' && hasSelection ? selectedFeatureData.color    : featureColor;
  const displaySize     = featureToolMode === 'select' && hasSelection ? selectedFeatureData.size     : featureSize;
  const displayRotation = featureToolMode === 'select' && hasSelection ? selectedFeatureData.rotation : featureRotation;
  const displayFeatureId = featureToolMode === 'select' && hasSelection ? selectedFeatureData.id : selectedFeatureId;
  const displayFeature  = FEATURE_MAP[displayFeatureId];

  return (
    <div className="absolute right-0 top-0 bottom-0 z-10" style={{ width: panelWidth }}>
      <div className="bg-white border-l border-gray-300 h-full flex flex-col">

        {/* ── Header ── */}
        <div className="px-3 py-2 border-b border-gray-300 flex justify-between items-center flex-shrink-0">
          <span className="text-sm font-semibold text-gray-700">Features</span>
          <div className="flex gap-1">
            <button onClick={() => onSetColumns(Math.min(columns + 1, 4))} disabled={columns >= 4}
              className={`p-1 rounded ${columns >= 4 ? 'text-gray-300' : 'hover:bg-gray-100'}`}>
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => onSetColumns(Math.max(columns - 1, 1))} disabled={columns <= 1}
              className={`p-1 rounded ${columns <= 1 ? 'text-gray-300' : 'hover:bg-gray-100'}`}>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* ── Draw / Select mode toggle — identical to PathLibrary ── */}
        <div className="px-3 py-2 border-b border-gray-300 flex gap-2 flex-shrink-0">
          <button
            onClick={() => onSetFeatureMode('draw')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium border transition-colors ${
              featureToolMode === 'draw'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <Pencil size={13} /> Draw
          </button>
          <button
            onClick={() => onSetFeatureMode('select')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium border transition-colors ${
              featureToolMode === 'select'
                ? 'bg-blue-500 text-white border-blue-500'
                : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50'
            }`}
          >
            <MousePointer2 size={13} /> Select
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto p-2 space-y-3">

          {/* Select mode — no selection yet */}
          {featureToolMode === 'select' && !hasSelection && (
            <p className="text-xs text-gray-500 text-center pt-2">
              Click a hex with a feature to select it.
            </p>
          )}

          {/* Select mode — selection active */}
          {featureToolMode === 'select' && hasSelection && (
            <p className="text-xs text-blue-600 font-medium px-1">
              {displayFeature?.name ?? 'Feature'} selected — edit below
            </p>
          )}

          {/* Draw mode — gallery always visible */}
          {featureToolMode === 'draw' && (
            <>
              {FEATURES_BY_CATEGORY.map(({ category, features }) => (
                <div key={category}>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1 px-1">
                    {category}
                  </p>
                  <div
                    className="grid gap-1"
                    style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                  >
                    {features.map(feature => {
                      const active = selectedFeatureId === feature.id;
                      return (
                        <button
                          key={feature.id}
                          onClick={() => onSelectFeature(feature.id)}
                          title={feature.name}
                          className={`flex flex-col items-center p-1 rounded border-2 transition-all ${
                            active
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          <FeaturePreview feature={feature} color={featureColor} />
                          {columns <= 2 && (
                            <span className="text-xs mt-0.5 text-center leading-tight text-gray-600">
                              {feature.name}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Style controls — draw mode always; select mode when something selected */}
          {(featureToolMode === 'draw' || (featureToolMode === 'select' && hasSelection)) && (
            <div className="border-t border-gray-200 pt-3 space-y-3">

              {/* Color */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                <div className="flex gap-1 flex-wrap">
                  {COLOR_PRESETS.map(({ label, value }) => (
                    <button
                      key={value}
                      title={label}
                      onClick={() => onSetColor(value)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        displayColor === value ? 'border-blue-500 scale-110' : 'border-gray-300'
                      }`}
                      style={{
                        backgroundColor: value,
                        boxShadow: value === '#ffffff' ? 'inset 0 0 0 1px #ccc' : undefined,
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={displayColor}
                    onChange={e => onSetColor(e.target.value)}
                    title="Custom color"
                    className="w-6 h-6 rounded cursor-pointer border border-gray-300"
                  />
                </div>
              </div>

              {/* Size */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Size</label>
                <div className="flex gap-1">
                  {['small', 'medium', 'large'].map(s => (
                    <button key={s} onClick={() => onSetSize(s)}
                      className={`flex-1 text-xs py-1 rounded border capitalize transition-colors ${
                        displaySize === s
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'border-gray-300 text-gray-600 hover:border-gray-400'
                      }`}
                    >{s}</button>
                  ))}
                </div>
              </div>

              {/* Rotation */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Rotation: {displayRotation}°
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {ROTATIONS.map(r => (
                    <button key={r} onClick={() => onSetRotation(r)}
                      className={`text-xs py-1 rounded border transition-colors ${
                        displayRotation === r
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'border-gray-300 text-gray-600 hover:border-gray-400'
                      }`}
                    >{r}°</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Delete button — select mode only, mirrors PathLibrary ── */}
        {featureToolMode === 'select' && (
          <div className="border-t border-gray-300 p-3 flex-shrink-0">
            <button
              onClick={onDeleteSelected}
              disabled={!hasSelection}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                hasSelection
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Trash2 size={14} />
              Delete Feature
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
