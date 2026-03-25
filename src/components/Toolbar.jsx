import { Hand, Eraser, Plus, Minus, RotateCcw, Landmark, Route, Waves } from 'lucide-react';

const HEX_ICON = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2L21 7v10l-9 5-9-5V7l9-5z" />
  </svg>
);

const TOOLS = [
  { id: 'tile',    label: 'Tile Placement', icon: HEX_ICON },
  { id: 'feature', label: 'Features',       icon: <Landmark size={24} /> },
  { id: 'road',    label: 'Roads',          icon: <Route size={24} /> },
  { id: 'river',   label: 'Rivers',         icon: <Waves size={24} /> },
];

/**
 * Left-hand toolbar: tool selection + zoom controls.
 *
 * @param {{
 *   selectedTool: string,
 *   onSelectTool: (id: string) => void,
 *   onZoomIn: () => void,
 *   onZoomOut: () => void,
 *   onResetView: () => void,
 * }} props
 */
export function Toolbar({ selectedTool, onSelectTool, onZoomIn, onZoomOut, onResetView }) {
  return (
    <div className="absolute left-0 top-0 bottom-0 w-16 bg-white border-r border-gray-300 flex flex-col items-center py-4 gap-2 z-20">
      {TOOLS.map(tool => (
        <button
          key={tool.id}
          onClick={() => onSelectTool(tool.id)}
          title={tool.label}
          className={`p-3 rounded ${
            selectedTool === tool.id
              ? 'bg-blue-500 text-white'
              : 'hover:bg-gray-100'
          }`}
        >
          {tool.icon}
        </button>
      ))}

      <div className="border-t border-gray-300 w-full my-2" />

      <button
        onClick={() => onSelectTool('hand')}
        title="Pan (H)"
        className={`p-3 rounded ${
          selectedTool === 'hand' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
        }`}
      >
        <Hand size={24} />
      </button>

      <button onClick={onZoomIn}    className="p-3 hover:bg-gray-100 rounded" title="Zoom In">
        <Plus size={24} />
      </button>
      <button onClick={onZoomOut}   className="p-3 hover:bg-gray-100 rounded" title="Zoom Out">
        <Minus size={24} />
      </button>
      <button onClick={onResetView} className="p-3 hover:bg-gray-100 rounded" title="Reset View">
        <RotateCcw size={24} />
      </button>
    </div>
  );
}
