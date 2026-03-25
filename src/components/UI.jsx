import { useState } from 'react';

// ---------------------------------------------------------------------------
// MenuBar
// ---------------------------------------------------------------------------

/**
 * Top menu bar with File and View menus.
 *
 * @param {{
 *   showGrid: boolean,
 *   onToggleGrid: () => void,
 *   onNewMap: () => void,
 *   onSave: () => void,
 *   onLoad: (file: File) => void,
 *   onExportPNG: () => void,
 *   onExpandMap: () => void,
 * }} props
 */
export function MenuBar({
  showGrid,
  onToggleGrid,
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
      {/* Backdrop to close menus on outside click */}
      {openMenu && (
        <div className="fixed inset-0 z-40" onClick={close} />
      )}

      <div className="bg-white border-b border-gray-300 px-4 py-2 flex gap-4 relative z-50">
        {/* File menu */}
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
              <MenuItem onClick={() => { onExpandMap(); close(); }}>Expand Map…</MenuItem>
            </MenuDropdown>
          )}
        </div>

        {/* View menu */}
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
            </MenuDropdown>
          )}
        </div>
      </div>
    </>
  );
}

// Small internal helpers — not exported

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
// ExpandDialog
// ---------------------------------------------------------------------------

/**
 * Modal dialog for expanding the map in each cardinal direction.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onApply: (values: {north,south,east,west}) => void,
 * }} props
 */
export function ExpandDialog({ isOpen, onClose, onApply }) {
  const [values, setValues] = useState({ north: 5, south: 5, east: 5, west: 5 });

  if (!isOpen) return null;

  const set = (dir, raw) => {
    const n = parseInt(raw) || 0;
    setValues(prev => ({ ...prev, [dir]: Math.max(0, n) }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
        <h3 className="text-lg font-semibold mb-4">Expand Map</h3>

        <div className="space-y-3">
          {['north', 'south', 'east', 'west'].map(dir => (
            <div key={dir} className="flex items-center justify-between">
              <label className="capitalize text-sm">{dir}:</label>
              <input
                type="number"
                value={values[dir]}
                onChange={e => set(dir, e.target.value)}
                min="0"
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
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
 * Bottom status strip showing map dimensions and zoom level.
 *
 * @param {{ dimensions: {width,height}, scale: number }} props
 */
export function StatusBar({ dimensions, scale }) {
  return (
    <div className="bg-white border-t border-gray-300 px-4 py-2 flex items-center gap-6 text-sm text-gray-600">
      <span>Map: {dimensions.width}×{dimensions.height}</span>
      <span>Zoom: {Math.round(scale * 100)}%</span>
    </div>
  );
}
