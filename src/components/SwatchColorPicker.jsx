/**
 * SwatchColorPicker — reusable swatch + custom color picker.
 *
 * Palette data lives in src/data/swatches.js — edit there to add/remove colors.
 * This file re-exports the named palettes so existing import sites don't break.
 */

// Re-export palettes so components that previously imported from here still work
export {
  TILE_SWATCHES,
  ROAD_SWATCHES,
  RIVER_SWATCHES,
  FEATURE_SWATCHES,
} from '../data/swatches.js';

/**
 * @param {{
 *   swatches: Array<{label: string, value: string}>,
 *   value: string,
 *   onChange: (color: string) => void,
 *   label?: string,
 * }} props
 */
export function SwatchColorPicker({ swatches, value, onChange, label = 'Color' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="flex gap-1 flex-wrap items-center">
        {swatches.map(({ label: swatchLabel, value: swatchValue }) => (
          <button
            key={swatchValue}
            title={swatchLabel}
            onClick={() => onChange(swatchValue)}
            className={`w-6 h-6 rounded-full border-2 transition-all flex-shrink-0 ${
              value === swatchValue ? 'border-blue-500 scale-110' : 'border-gray-300'
            }`}
            style={{
              backgroundColor: swatchValue,
              boxShadow:
                swatchValue === '#ffffff' || swatchValue === '#aaaaaa'
                  ? 'inset 0 0 0 1px #ccc'
                  : undefined,
            }}
          />
        ))}

        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          title="Custom color"
          className={`h-8 rounded cursor-pointer border-2 transition-all ${
            swatches.some(s => s.value === value)
              ? 'border-gray-300'
              : 'border-blue-500'
          }`}
          style={{ width: '2rem' }}
        />
      </div>
    </div>
  );
}
