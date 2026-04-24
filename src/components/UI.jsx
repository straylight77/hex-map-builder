import { useState } from 'react';

// ---------------------------------------------------------------------------
// MenuBar
// ---------------------------------------------------------------------------

export function MenuBar({
  showGrid,
  onToggleGrid,
  showCoords,
  onToggleCoords,
  onNewMap,
  onSave,
  onLoad,
  onExportPNG,
  onExpandMap,
}) {
  const [openMenu, setOpenMenu] = useState(null);

  const toggle = (name) => setOpenMenu(prev => (prev === name ? null : name));
  const close = () => setOpenMenu(null);

  return (
    <>
      {openMenu && (
        <div className="fixed inset-0 z-40" onClick={close} />
      )}

      <div className="bg-white border-b border-gray-300 px-4 py-2 flex gap-4 relative z-50">
        <div className="relative">
          <button
            onClick={() => toggle('file')}
            className="px-3 py-1 hover:bg-gray-100 rounded text-sm"
          >
            File ▼
          </button>
          {openMenu === 'file' && (
            <MenuDropdown>
              <MenuItem onClick={() => { onNewMap(); close(); }}>New Map</MenuItem>
              <MenuDivider />
              <MenuFileInput onFile={(f) => { onLoad(f); close(); }}>Open Map</MenuFileInput>
              <MenuItem onClick={() => { onSave(); close(); }}>Save Map</MenuItem>
              <MenuDivider />
              <MenuItem onClick={() => { onExportPNG(); close(); }}>Export as PNG</MenuItem>
              <MenuDivider />
              <MenuItem onClick={() => { onExpandMap(); close(); }}>Resize Map…</MenuItem>
            </MenuDropdown>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => toggle('view')}
            className="px-3 py-1 hover:bg-gray-100 rounded text-sm"
          >
            View ▼
          </button>
          {openMenu === 'view' && (
            <MenuDropdown>
              <MenuItem onClick={() => { onToggleGrid(); close(); }}>
                {showGrid ? '✓ ' : '\u00a0\u00a0'}Show Grid
              </MenuItem>
              <MenuItem onClick={() => { onToggleCoords(); close(); }}>
                {showCoords ? '✓ ' : '\u00a0\u00a0'}Show Coordinates
              </MenuItem>
            </MenuDropdown>
          )}
        </div>
      </div>
    </>
  );
}

function MenuDropdown({ children }) {
  return (
    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg min-w-[200px]">
      {children}
    </div>
  );
}

function MenuItem({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 whitespace-nowrap"
    >
      {children}
    </button>
  );
}

function MenuDivider() {
  return <div className="border-t border-gray-200" />;
}

function MenuFileInput({ onFile, children }) {
  return (
    <label className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 cursor-pointer whitespace-nowrap">
      {children}
      <input
        type="file"
        accept=".json"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
    </label>
  );
}

// ---------------------------------------------------------------------------
// ExpandDialog (Resize Map)
// ---------------------------------------------------------------------------

export function ExpandDialog({ isOpen, onClose, onApply }) {
  const [values, setValues] = useState({ north: 0, south: 0, east: 0, west: 0 });

  if (!isOpen) return null;

  const set = (dir, raw) => {
    const n = parseInt(raw);
    setValues(prev => ({ ...prev, [dir]: isNaN(n) ? 0 : n }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
        <h3 className="text-lg font-semibold mb-1">Resize Map</h3>
        <p className="text-xs text-gray-500 mb-4">
          Positive values add rows/columns in that direction. Negative values
          remove them. Contraction is blocked if any data would be lost.
        </p>

        <div className="space-y-3">
          {['north', 'south', 'east', 'west'].map(dir => (
            <div key={dir} className="flex items-center justify-between">
              <label className="capitalize text-sm w-12">{dir}</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => set(dir, values[dir] - 1)}
                  className="w-7 h-7 rounded border border-gray-300 hover:bg-gray-100 text-sm font-medium"
                >−</button>
                <input
                  type="number"
                  value={values[dir]}
                  onChange={e => set(dir, e.target.value)}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                />
                <button
                  onClick={() => set(dir, values[dir] + 1)}
                  className="w-7 h-7 rounded border border-gray-300 hover:bg-gray-100 text-sm font-medium"
                >+</button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => { onApply(values); onClose(); }}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            Apply
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatusBar
// ---------------------------------------------------------------------------

/**
 * Bottom status strip.
 *
 * Receives `bounds` ({ minR, maxR, minCol, maxCol }) and derives the
 * displayed column × row count from it.
 * `scale` is the display percentage (100 = home zoom).
 * `hoveredHex` is the currently highlighted hex { q, r } or null.
 */
function isInBounds(hex, bounds) {
  if (!hex) return false;
  const col = hex.q + Math.floor(hex.r / 2);
  return hex.r >= bounds.minR && hex.r <= bounds.maxR &&
         col >= bounds.minCol && col <= bounds.maxCol;
}

export function StatusBar({ bounds, scale, hoveredHex }) {
  const cols = bounds.maxCol - bounds.minCol;
  const rows = bounds.maxR   - bounds.minR;
  const hexLabel = isInBounds(hoveredHex, bounds)
    ? `(${hoveredHex.q}, ${hoveredHex.r})`
    : `(-, -)`;
  return (
    <div className="bg-white border-t border-gray-300 px-4 py-2 flex items-center gap-6 text-sm text-gray-600">
      <span>Map: {cols}×{rows}</span>
      <span>Zoom: {scale}%</span>
      <span>Hex: {hexLabel}</span>
    </div>
  );
}
