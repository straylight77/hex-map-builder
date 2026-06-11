import { ChevronRight, ChevronLeft } from 'lucide-react';
import { PANEL_WIDTH, HANDLE_WIDTH, HANDLE_HEIGHT } from '../utils/constants.js';

export function CollapsiblePanel({ collapsed, onToggle, children }) {
  return (
    <>
      <button
        onClick={onToggle}
        className="absolute z-20 top-1/2 -translate-y-1/2 flex items-center justify-center
                   bg-white border border-gray-300 shadow-sm hover:bg-gray-100
                   transition-[right] duration-200 ease-in-out cursor-pointer"
        style={{
          width: HANDLE_WIDTH,
          height: HANDLE_HEIGHT,
          right: collapsed ? 0 : PANEL_WIDTH,
          borderRadius: collapsed ? '4px 0 0 4px' : '0 4px 4px 0',
        }}
        title={collapsed ? 'Expand panel' : 'Collapse panel'}
      >
        {collapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      <div
        className="absolute top-0 bottom-0 z-10
                   transition-transform duration-200 ease-in-out"
        style={{
          width: PANEL_WIDTH,
          right: 0,
          transform: collapsed ? `translateX(${PANEL_WIDTH}px)` : 'translateX(0)',
        }}
      >
        {children}
      </div>
    </>
  );
}