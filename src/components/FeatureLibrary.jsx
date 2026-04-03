import { useEffect, useRef } from 'react';
import { Pencil, MousePointer2, Eraser } from 'lucide-react';
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

const MODES = [
  { id: 'draw',   icon: <Pencil size={14} />,        label: 'Draw'   },
  { id: 'select', icon: <MousePointer2 size={14} />,  label: 'Select' },
  { id: 'erase',  icon: <Eraser size={14} />,         label: 'Erase'  },
];

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

        {/* Draw / Select / Erase — unified mode row */}
        <div className="px-3 py-2 border-b border-gray-200 flex gap-1.5 flex-shrink-0">
          {MODES.map(({ id, icon, label }) => {
            const isActive = featureToolMode === id;
            const isEraseBtn = id === 'erase';
            return (
              <button
                key={id}
                onClick={() => onSetFeatureMode(id)}
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

        {/* Delete selected — only in select mode, right below mode row */}
        {featureToolMode === 'select' && (
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
              Delete Selected Feature
            </button>
          </div>
        )}

        {/* Erase mode hint */}
        {featureToolMode === 'erase' && (
          <div className="px-3 pt-2 flex-shrink-0">
            <p className="text-xs text-red-500">Click a hex to erase its feature.</p>
          </div>
        )}

        {/* Style controls — visible in draw mode and select mode */}
        {(featureToolMode === 'draw' || featureToolMode === 'select') && (
          <div className="px-3 py-2 border-b border-gray-200 flex-shrink-0 space-y-3">

            {/* Select mode status */}
            {featureToolMode === 'select' && !hasSelection && (
              <p className="text-xs text-gray-400">Click a hex with a feature to select it.</p>
            )}
            {featureToolMode === 'select' && hasSelection && (
              <p className="text-xs text-blue-600 font-medium">
                {displayFeature?.name ?? 'Feature'} selected
              </p>
            )}

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
              <label className="block text-xs font-medium text-gray-600 mb-1">Rotation</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSetRotation(((displayRotation - 30) + 360) % 360)}
                  className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50 text-sm font-bold flex-shrink-0"
                  title="Rotate left 30°"
                >‹</button>
                <span className="flex-1 text-center text-xs text-gray-700 font-medium tabular-nums">
                  {displayRotation}°
                </span>
                <button
                  onClick={() => onSetRotation((displayRotation + 30) % 360)}
                  className="w-8 h-8 flex items-center justify-center rounded border border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50 text-sm font-bold flex-shrink-0"
                  title="Rotate right 30°"
                >›</button>
              </div>
            </div>
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

        {/* Select / Erase mode: spacer */}
        {(featureToolMode === 'select' || featureToolMode === 'erase') && <div className="flex-1" />}

      </div>
    </div>
  );
}
