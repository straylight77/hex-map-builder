// ---------------------------------------------------------------------------
// SwatchColorPicker — reusable swatch + custom color picker
//
// Usage:
//   <SwatchColorPicker swatches={ROAD_SWATCHES} value={color} onChange={setColor} />
//
// ---------------------------------------------------------------------------
//
// ══ CONFIGURING SWATCHES ════════════════════════════════════════════════════
//
// Swatches are defined as arrays of { label, value } objects.
// Each tool's swatch list lives in the SWATCH_PRESETS object below.
// The FIRST entry in each array becomes the default color for that tool
// (set in useTools.js as the initial state for each style's color field).
//
// To ADD a swatch:    append { label: 'My Color', value: '#aabbcc' }
// To REMOVE a swatch: delete the entry
// To CHANGE a color:  edit the `value` hex string
// To REORDER:         move the entry; the first entry is still the default
//
// ════════════════════════════════════════════════════════════════════════════

// ── Swatch palettes ──────────────────────────────────────────────────────────
// These are the color lists shown in each tool's panel.
// Edit here to add / remove / reorder swatches.

export const TILE_SWATCHES = [
  { label: 'Grey',          value: '#b3b3b3' },   // "neutral", default
  { label: 'Red',           value: '#FF6666' },   // "danger"
  { label: 'Yellow',        value: '#ffde66' },   // "warning"
  { label: 'Plains Green',  value: '#B4F157' },   // terrain.js: plains / farmland
  { label: 'Forest Green',  value: '#4CAF50' },   // terrain.js: forest
  { label: 'Hills Brown',   value: '#E8D4B8' },   // terrain.js: hills
  { label: 'Swamp Grey',    value: '#a8b5a0' },   // terrain.js: swamp
];

export const ROAD_SWATCHES = [
  { label: 'Light Brown',   value: '#c4a882' },   // default
  { label: 'Dark Brown',    value: '#8B7355' },
  { label: 'Black',         value: '#222222' },
  { label: 'Light Grey',    value: '#aaaaaa' },
];

export const RIVER_SWATCHES = [
  { label: 'Shallow Water', value: '#ADE1F9' },   // terrain.js: shallow-water
  { label: 'Water',         value: '#73A9D7' },   // terrain.js: water
  { label: 'Deep Water',    value: '#4A6B8C' },   // terrain.js: deep-water
  { label: 'Lava Flow',     value: '#e15b5b' },
];

// ── Component ────────────────────────────────────────────────────────────────

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

        {/* Custom color — wider rectangle so it's easy to click */}
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
