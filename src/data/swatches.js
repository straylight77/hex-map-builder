/**
 * swatches.js
 *
 * Color palette definitions for all tool panels.
 * These are data, not UI — keeping them here makes it easy to adjust
 * palettes without touching component files.
 *
 * Convention: the FIRST entry in each array is the default color for that tool
 * and must stay in sync with the matching DEFAULT_*_STYLE in mapSchema.js.
 */

export const TILE_SWATCHES = [
  { label: 'Grey',          value: '#b3b3b3' },
  { label: 'Red',           value: '#FF6666' },
  { label: 'Yellow',        value: '#ffde66' },
  { label: 'Plains Green',  value: '#B4F157' },
  { label: 'Forest Green',  value: '#4CAF50' },
  { label: 'Hills Brown',   value: '#E8D4B8' },
  { label: 'Swamp Grey',    value: '#bad4ab' },
];

export const ROAD_SWATCHES = [
  { label: 'Light Brown',   value: '#c4a882' },
  { label: 'Dark Brown',    value: '#8B7355' },
  { label: 'Black',         value: '#222222' },
  { label: 'Light Grey',    value: '#aaaaaa' },
  { label: 'Red',           value: '#bb2222' },
];

export const RIVER_SWATCHES = [
  { label: 'Shallow Water', value: '#ADE1F9' },
  { label: 'Water',         value: '#73A9D7' },
  { label: 'Deep Water',    value: '#4A6B8C' },
  { label: 'Lava Flow',     value: '#e15b5b' },
];

export const FEATURE_SWATCHES = [
  { label: 'Black',      value: '#000000' },
  { label: 'Red',        value: '#bb2222' },
  { label: 'Green',      value: '#2e6930' },
  { label: 'Blue',       value: '#507696' },
  { label: 'Brown',      value: '#b09673' },
  { label: 'Grey-Green', value: '#6c7466' },
  { label: 'Grey',       value: '#cccccc' },
];
