import { useEffect, useRef } from 'react';
import { Pencil, MousePointer2, Eraser } from 'lucide-react';
import {
  FEATURES_BY_CATEGORY,
  FEATURE_MAP,
  DEFAULT_FEATURE_COLOR,
} from '../data/features.js';
import { SwatchColorPicker, FEATURE_SWATCHES } from './SwatchColorPicker.jsx';

const PANEL_WIDTH = 268;
const GRID_COLUMNS = 2;

const MODES = [
  { id: 'draw',   icon: <Pencil size={14} />,        label: 'Draw'   },
  { id: 'select', icon: <MousePointer2 size={14} />,  label: 'Select' },
  { id: 'erase',  icon: <Eraser size={14} />,         label: 'Erase'  },
];

function modeHint(featureToolMode, hasSelection) {
  if (featureToolMode === 'draw')   return 'Click a hex to place a feature.';
  if (featureToolMode === 'erase')  return 'Click a hex to erase its feature.';
  if (featureToolMode === 'select') return hasSelection
    ? 'Feature selected — edit below.'
    : 'Click a hex with a feature to select it.';
  return null;
}

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
}) {
  const hasSelection = !!selectedFeatureHex && !!selectedFeatureData;

  const displayColor     = featureToolMode === 'select' && hasSelection ? selectedFeatureData.color    : featureColor;
  const displaySize      = featureToolMode === 'select' && hasSelection ? selectedFeatureData.size     : featureSize;
  const displayRotation  = featureToolMode === 'select' && hasSelection ? selectedFeatureData.rotation : featureRotation;
  const displayFeatureId = featureToolMode === 'select' && hasSelection ? selectedFeatureData.id       : selectedFeatureId;
  const displayFeature   = FEATURE_MAP[displayFeatureId];

  const hint = modeHint(featureToolMode, hasSelection);

  return (
    <div className="absolute right-0 top-0 bottom-0 z-10" style={{ width: PANEL_WIDTH }}>
      <div className="bg-white border-l border-gray-300 h-full flex flex-col">

        {/* Header */}
        <div className="px-3 py-2 border-b border-gray-200 flex-shrink-0">
          <span className="text-sm font-semibold text-gray-700">Features</span>
        </div>

        {/* Draw / Select / Erase */}
        <div className="px-3 pt-2 flex gap-1.5 flex-shrink-0">
          {MODES.map(({ id, icon, label }) => {
            const isActive   = featureToolMode === id;
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

        {/* One-liner hint */}
        {hint && (
          <p className={`px-3 pt-1.5 pb-2 text-xs border-b border-gray-200 ${
            featureToolMode === 'erase' ? 'text-red-500' : 'text-gray-500'
          }`}>
            {hint}
          </p>
        )}

        {/* Delete selected — only in select mode */}
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

        {/* Style controls */}
        {(featureToolMode === 'draw' || featureToolMode === 'select') && (
          <div className="px-3 py-2 border-b border-gray-200 flex-shrink-0 space-y-3">

            {featureToolMode === 'select' && hasSelection && (
              <p className="text-xs text-blue-600 font-medium">
                {displayFeature?.name ?? 'Feature'} selected
              </p>
            )}

            {/* Color */}
            <SwatchColorPicker
              swatches={FEATURE_SWATCHES}
              value={displayColor}
              onChange={onSetColor}
            />

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
                  className="flex-1 text-xs py-1 rounded border capitalize transition-colors border-gray-300 text-gray-600 hover:border-gray-400"
                  title="Rotate left 30°"
                >‹</button>
                <span className="flex-1 text-center text-xs text-gray-700 font-medium tabular-nums">
                  {displayRotation}°
                </span>
                <button
                  onClick={() => onSetRotation((displayRotation + 30) % 360)}
                  className="flex-1 text-xs py-1 rounded border capitalize transition-colors border-gray-300 text-gray-600 hover:border-gray-400"
                  title="Rotate right 30°"
                >›</button>
              </div>
            </div>
          </div>
        )}

        {/* Feature gallery — draw mode only */}
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
                  {features.map(f => (
                    <button
                      key={f.id}
                      onClick={() => onSelectFeature(f.id)}
                      title={f.name}
                      className={`flex flex-col items-center p-1 rounded border-2 transition-all ${
                        selectedFeatureId === f.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <FeaturePreview feature={f} color={featureColor} />
                      <span className="text-xs mt-0.5 text-center leading-tight text-gray-600">
                        {f.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {(featureToolMode === 'select' || featureToolMode === 'erase') && <div className="flex-1" />}
      </div>
    </div>
  );
}
