import { useEffect, useRef } from 'react';
import { Pencil, MousePointer2 } from 'lucide-react';
import {
  FEATURES_BY_CATEGORY,
  FEATURE_MAP,
  DEFAULT_FEATURE_COLOR,
} from '../data/features.js';

const PANEL_WIDTH = 268;
const GRID_COLUMNS = 2;

const COLOR_PRESETS = [
  { label: 'Black',     value: '#000000' },
  { label: 'White',     value: '#ffffff' },
  { label: 'Red',       value: '#bb2222' },
  { label: 'Dark Blue', value: '#1a3a7a' },
  { label: 'Gold',      value: '#b89500' },
];

const ROTATIONS = [0, 60, 120, 180, 240, 300];

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
    ctx.scale(0.72, 0.72);
    feature.draw(ctx, color || DEFAULT_FEATURE_COLOR);
    ctx.restore();
  }, [feature, color]);

  return (
    <canvas ref={canvasRef} style={{ width: px, height: px }} className="block" />
  );
}

/**
 * Right-hand panel for the Feature tool.
 * Color, size, rotation controls are always visible above the gallery.
 * Erase button removes the feature on the clicked hex.
 */
export function FeatureLibrary({
  featureToolMode,
  onSetFeatureMode,
  selectedFeatureId,
  onSelectFeature,
  selectedFeatureHex,
  selectedFeatureData,
  onDeleteSelected,
  featureColor,
  onSetColor,
  featureSize,
  onSetSize,
  featureRotation,
  onSetRotation,
  isErasing,
  onToggleErase,
}) {
  const hasSelection = !!selectedFeatureHex && !!selectedFeatureData;

  // In select mode with a selection, controls reflect the placed feature's data
  const displayColor    = featureToolMode === 'select' && hasSelection ? selectedFeatureData.color    : featureColor;
  const displaySize     = featureToolMode === 'select' && hasSelection ? selectedFeatureData.size     : featureSize;
  const displayRotation = featureToolMode === 'select' && hasSelection ? selectedFeatureData.rotation : featureRotation;
  const displayFeatureId = featureToolMode === 'select' && hasSelection ? selectedFeatureData.id : selectedFeatureId;
  const displayFeature   = FEATURE_MAP[displayFeatureId];

  return (
    <div className="absolute right-0 top-0 bottom-0 z-10" style={{ width: PANEL_WIDTH }}>
      <div className="bg-white border-l border-gray-300 h-full flex flex-col">

        {/* Header */}
        <div className="px-3 py-2 border-b border-gray-200 flex-shrink-0">
          <span className="text-sm font-semibold text-gray-700">Features</span>
        </div>

        {/* Draw / Select */}
        <div className="px-3 py-2 border-b border-gray-200 flex gap-2 flex-shrink-0">
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
            Erase Features
          </button>
        </div>

        {/* ── Style controls — always visible ── */}
        <div className="px-3 py-2 border-b border-gray-200 flex-shrink-0 space-y-3">

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

          {/* Select-mode: delete button */}
          {featureToolMode === 'select' && (
            <button
              onClick={onDeleteSelected}
              disabled={!hasSelection}
              className={`w-full py-1.5 rounded text-xs font-medium border-2 transition-colors ${
                hasSelection
                  ? 'bg-red-500 text-white border-red-500 hover:bg-red-600'
                  : 'border-gray-200 text-gray-300 cursor-not-allowed'
              }`}
            >
              Delete Selected Feature
            </button>
          )}
        </div>

        {/* Select-mode hint */}
        {featureToolMode === 'select' && !hasSelection && (
          <div className="px-3 pt-2 flex-shrink-0">
            <p className="text-xs text-gray-400">Click a hex with a feature to select it.</p>
          </div>
        )}
        {featureToolMode === 'select' && hasSelection && (
          <div className="px-3 pt-2 flex-shrink-0">
            <p className="text-xs text-blue-600 font-medium">
              {displayFeature?.name ?? 'Feature'} selected
            </p>
          </div>
        )}

        {/* Feature gallery — only in draw mode */}
        {featureToolMode === 'draw' && (
          <div className="flex-1 overflow-y-auto p-2">
            {FEATURES_BY_CATEGORY.map(({ category, features }) => (
              <div key={category} className="mb-3">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1 px-1">
                  {category}
                </p>
                <div
                  className="grid gap-1"
                  style={{ gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))` }}
                >
                  {features.map(feature => (
                    <button
                      key={feature.id}
                      onClick={() => onSelectFeature(feature.id)}
                      title={feature.name}
                      className={`flex flex-col items-center p-1 rounded border-2 transition-all ${
                        selectedFeatureId === feature.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <FeaturePreview feature={feature} color={featureColor} />
                      <span className="text-xs mt-0.5 text-center leading-tight text-gray-600">
                        {feature.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Select mode: no gallery, just a spacer */}
        {featureToolMode === 'select' && <div className="flex-1" />}

      </div>
    </div>
  );
}
