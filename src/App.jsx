import React, { useState, useEffect, useRef } from 'react';
import { Hand, Pencil, Eraser, Plus, Minus, RotateCcw, ChevronRight, ChevronLeft, Grid3x3, Landmark, Route, Waves } from 'lucide-react';

// Hex math utilities
const HEX_SIZE = 70;
const HEX_WIDTH = HEX_SIZE * Math.sqrt(3);
const HEX_HEIGHT = HEX_SIZE * 2;

// Terrain tile definitions
const TERRAIN_TILES = [
  { id: 'plains', name: 'Plains', color: '#9ACD32', pattern: 'solid' },
  { id: 'farmland', name: 'Farmland', color: '#9ACD32', pattern: 'farmland' },
  { id: 'forest', name: 'Forest', color: '#228B22', pattern: 'trees' },
  { id: 'dense-forest', name: 'Dense Forest', color: '#1a5c1a', pattern: 'dense-trees' },
  { id: 'hills', name: 'Hills', color: '#D2B48C', pattern: 'wavy' },
  { id: 'mountain-range', name: 'Mountain Range', color: '#8B7355', pattern: 'peaks' },
  { id: 'large-mountain', name: 'Large Mountain', color: '#6B5344', pattern: 'large-peak' },
  { id: 'volcano', name: 'Volcano', color: '#8B4513', pattern: 'volcano' },
  { id: 'water', name: 'Water', color: '#4682B4', pattern: 'waves' },
  { id: 'shallow-water', name: 'Shallow Water', color: '#87CEEB', pattern: 'shallow-waves' },
  { id: 'deep-water', name: 'Deep Water', color: '#1e3a5f', pattern: 'rough-waves' },
  { id: 'desert', name: 'Desert/Beach', color: '#F4E4A6', pattern: 'dots' },
  { id: 'swamp', name: 'Swamp', color: '#5a6b5a', pattern: 'reeds' }
];

function hexToPixel(q, r, hexSize) {
  const x = hexSize * Math.sqrt(3) * (q + r / 2);
  const y = hexSize * 3/2 * r;
  return { x, y };
}

function pixelToHex(x, y, hexSize) {
  const q = (Math.sqrt(3)/3 * x - 1/3 * y) / hexSize;
  const r = (2/3 * y) / hexSize;
  return roundHex(q, r);
}

function roundHex(q, r) {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  let rs = Math.round(s);
  
  const qDiff = Math.abs(rq - q);
  const rDiff = Math.abs(rr - r);
  const sDiff = Math.abs(rs - s);
  
  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs;
  } else if (rDiff > sDiff) {
    rr = -rq - rs;
  }
  
  return { q: rq, r: rr };
}

function drawHex(ctx, x, y, size, fill, stroke = true, strokeColor = '#000', strokeWidth = 1) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 180 * (60 * i - 30);
    const hx = x + size * Math.cos(angle);
    const hy = y + size * Math.sin(angle);
    if (i === 0) ctx.moveTo(hx, hy);
    else ctx.lineTo(hx, hy);
  }
  ctx.closePath();
  
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  
  if (stroke) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
}

function drawPattern(ctx, x, y, pattern, size, color) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.4;
  
  const scale = 1.3;
  
  switch(pattern) {
    case 'farmland':
      ctx.strokeStyle = '#8B6914';
      ctx.lineWidth = 2.5;
      
      const quadrants = [
        { cx: x - 15 * scale, cy: y - 15 * scale, rotation: 0 },
        { cx: x + 15 * scale, cy: y - 15 * scale, rotation: Math.PI/2 },
        { cx: x - 15 * scale, cy: y + 15 * scale, rotation: Math.PI/2 },
        { cx: x + 15 * scale, cy: y + 15 * scale, rotation: 0 }
      ];
      
      quadrants.forEach(({ cx, cy, rotation }) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation);
        
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(-12 * scale, i * 6 * scale);
          ctx.lineTo(12 * scale, i * 6 * scale);
          ctx.stroke();
        }
        
        ctx.restore();
      });
      break;
    
    case 'peaks':
      for (let i = 0; i < 3; i++) {
        const px = x - 26 * scale + i * 26 * scale;
        const py = y + 18 * scale;
        ctx.beginPath();
        ctx.moveTo(px - 10 * scale, py + 10 * scale);
        ctx.lineTo(px, py - 10 * scale);
        ctx.lineTo(px + 10 * scale, py + 10 * scale);
        ctx.stroke();
      }
      for (let i = 0; i < 2; i++) {
        const px = x - 13 * scale + i * 26 * scale;
        const py = y - 15 * scale;
        ctx.beginPath();
        ctx.moveTo(px - 10 * scale, py + 10 * scale);
        ctx.lineTo(px, py - 10 * scale);
        ctx.lineTo(px + 10 * scale, py + 10 * scale);
        ctx.stroke();
      }
      break;
      
    case 'large-peak':
      ctx.beginPath();
      ctx.moveTo(x - 30 * scale, y + 25 * scale);
      ctx.lineTo(x, y - 25 * scale);
      ctx.lineTo(x + 30 * scale, y + 25 * scale);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 10 * scale, y - 10 * scale);
      ctx.lineTo(x, y - 25 * scale);
      ctx.lineTo(x + 10 * scale, y - 10 * scale);
      ctx.closePath();
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = 0.6;
      ctx.fill();
      ctx.globalAlpha = 0.4;
      break;
      
    case 'volcano':
      ctx.beginPath();
      ctx.moveTo(x - 28 * scale, y + 20 * scale);
      ctx.lineTo(x - 8 * scale, y - 20 * scale);
      ctx.lineTo(x + 8 * scale, y - 20 * scale);
      ctx.lineTo(x + 28 * scale, y + 20 * scale);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x - 8 * scale, y - 20 * scale);
      ctx.lineTo(x - 5 * scale, y - 15 * scale);
      ctx.lineTo(x + 5 * scale, y - 15 * scale);
      ctx.lineTo(x + 8 * scale, y - 20 * scale);
      ctx.stroke();
      ctx.fillStyle = '#ff4500';
      ctx.globalAlpha = 0.3;
      ctx.fillRect(x - 5 * scale, y - 20 * scale, 10 * scale, 5 * scale);
      ctx.globalAlpha = 0.4;
      break;
      
    case 'wavy':
      for (let i = 0; i < 2; i++) {
        const py = y - 13 * scale + i * 26 * scale;
        ctx.beginPath();
        ctx.moveTo(x - 33 * scale, py);
        ctx.quadraticCurveTo(x - 20 * scale, py - 7 * scale, x - 7 * scale, py);
        ctx.quadraticCurveTo(x + 7 * scale, py + 7 * scale, x + 20 * scale, py);
        ctx.quadraticCurveTo(x + 33 * scale, py - 7 * scale, x + 40 * scale, py);
        ctx.stroke();
      }
      break;
      
    case 'trees':
      const positions = [
        [-25, -10], [-8, -18], [8, -10], [25, -2],
        [-17, 8], [0, 3], [17, 8],
        [-8, 20], [8, 20]
      ];
      const treeSize = 5;
      positions.forEach(([px, py]) => {
        ctx.beginPath();
        ctx.moveTo(x + px * scale - treeSize * scale, y + py * scale + 8 * scale);
        ctx.lineTo(x + px * scale, y + py * scale - 8 * scale);
        ctx.lineTo(x + px * scale + treeSize * scale, y + py * scale + 8 * scale);
        ctx.closePath();
        ctx.fill();
      });
      break;
      
    case 'dense-trees':
      const densePos = [
        [-28, -15], [-14, -20], [0, -24], [14, -20], [28, -15],
        [-21, -5], [-7, -8], [7, -8], [21, -5],
        [-14, 5], [0, 2], [14, 5],
        [-21, 15], [-7, 18], [7, 18], [21, 15],
        [-14, 25], [0, 28], [14, 25]
      ];
      const denseTreeSize = 5;
      densePos.forEach(([px, py]) => {
        ctx.beginPath();
        ctx.moveTo(x + px * scale - denseTreeSize * scale, y + py * scale + 8 * scale);
        ctx.lineTo(x + px * scale, y + py * scale - 8 * scale);
        ctx.lineTo(x + px * scale + denseTreeSize * scale, y + py * scale + 8 * scale);
        ctx.closePath();
        ctx.fill();
      });
      break;
      
    case 'waves':
      for (let i = 0; i < 3; i++) {
        const py = y - 20 * scale + i * 20 * scale;
        ctx.beginPath();
        ctx.moveTo(x - 30 * scale, py);
        for (let j = 0; j < 3; j++) {
          const cx = x - 30 * scale + j * 20 * scale;
          ctx.quadraticCurveTo(cx + 7 * scale, py - 5 * scale, cx + 10 * scale, py);
          ctx.quadraticCurveTo(cx + 13 * scale, py + 5 * scale, cx + 20 * scale, py);
        }
        ctx.stroke();
      }
      break;
      
    case 'shallow-waves':
      for (let i = 0; i < 2; i++) {
        const py = y - 13 * scale + i * 26 * scale;
        ctx.beginPath();
        ctx.moveTo(x - 33 * scale, py);
        for (let j = 0; j < 3; j++) {
          const cx = x - 33 * scale + j * 22 * scale;
          ctx.quadraticCurveTo(cx + 7 * scale, py - 4 * scale, cx + 11 * scale, py);
          ctx.quadraticCurveTo(cx + 15 * scale, py + 4 * scale, cx + 22 * scale, py);
        }
        ctx.stroke();
      }
      break;
      
    case 'rough-waves':
      ctx.strokeStyle = '#87CEEB';
      for (let i = 0; i < 4; i++) {
        const py = y - 20 * scale + i * 13 * scale;
        ctx.beginPath();
        ctx.moveTo(x - 33 * scale, py);
        for (let j = 0; j < 5; j++) {
          const cx = x - 33 * scale + j * 13 * scale;
          ctx.quadraticCurveTo(cx + 3 * scale, py - 6 * scale, cx + 7 * scale, py);
          ctx.quadraticCurveTo(cx + 10 * scale, py + 6 * scale, cx + 13 * scale, py);
        }
        ctx.stroke();
      }
      break;
      
    case 'dots':
      const dotPos = [[-20, -20], [0, -13], [20, -20], [-27, 0], [-7, 7], [13, 0], [27, 7], [-13, 20], [7, 24]];
      dotPos.forEach(([px, py]) => {
        ctx.beginPath();
        ctx.arc(x + px * scale, y + py * scale, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
      
    case 'reeds':
      const reedPos = [-20, -7, 7, 20];
      reedPos.forEach(px => {
        ctx.beginPath();
        ctx.moveTo(x + px * scale, y + 20 * scale);
        ctx.lineTo(x + px * scale, y - 20 * scale);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + px * scale, y - 13 * scale);
        ctx.lineTo(x + px * scale - 4 * scale, y - 7 * scale);
        ctx.stroke();
      });
      break;
  }
  
  ctx.globalAlpha = 1.0;
}

function TilePreview({ tile, size }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const fullSize = HEX_SIZE;
    const tempCanvas = document.createElement('canvas');
    const tempSize = fullSize * 3;
    tempCanvas.width = tempSize;
    tempCanvas.height = tempSize;
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCtx.save();
    tempCtx.translate(tempSize / 2, tempSize / 2);
    drawHex(tempCtx, 0, 0, fullSize, tile.color, true, '#555', 2);
    if (tile.pattern !== 'solid') {
      drawPattern(tempCtx, 0, 0, tile.pattern, fullSize, tile.pattern === 'rough-waves' ? '#87CEEB' : '#000');
    }
    tempCtx.restore();
    
    canvas.width = size * 2;
    canvas.height = size * 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0, tempSize, tempSize, 0, 0, canvas.width, canvas.height);
    
  }, [tile, size]);
  
  return <canvas ref={canvasRef} className="w-16 h-16" />;
}

export default function HexMapBuilder() {
  const canvasRef = useRef(null);
  const [mapData, setMapData] = useState(new Map());
  const [dimensions, setDimensions] = useState({ width: 20, height: 20 });
  const [viewport, setViewport] = useState({ x: 0, y: 0, scale: 1 });
  const [selectedTool, setSelectedTool] = useState('tile');
  const [selectedTile, setSelectedTile] = useState('plains');
  const [isErasing, setIsErasing] = useState(false);
  const [libraryColumns, setLibraryColumns] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredHex, setHoveredHex] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [showExpandDialog, setShowExpandDialog] = useState(false);
  const [expandValues, setExpandValues] = useState({ north: 5, south: 5, east: 5, west: 5 });

  useEffect(() => {
    const timer = setTimeout(() => {
      const data = {
        tiles: Array.from(mapData.entries()),
        dimensions,
        viewport,
        lastModified: Date.now()
      };
      localStorage.setItem('hexmap-autosave', JSON.stringify(data));
    }, 1000);
    return () => clearTimeout(timer);
  }, [mapData, dimensions, viewport]);

  useEffect(() => {
    const saved = localStorage.getItem('hexmap-autosave');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setMapData(new Map(data.tiles));
        setDimensions(data.dimensions);
        setViewport(data.viewport);
      } catch (e) {
        console.error('Failed to load saved data', e);
      }
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    ctx.translate(canvas.width / 2 + viewport.x, canvas.height / 2 + viewport.y);
    ctx.scale(viewport.scale, viewport.scale);
    
    const padding = 5;
    const minQ = Math.floor(-dimensions.width / 2) - padding;
    const maxQ = Math.ceil(dimensions.width / 2) + padding;
    const minR = Math.floor(-dimensions.height / 2) - padding;
    const maxR = Math.ceil(dimensions.height / 2) + padding;
    
    for (let r = minR; r <= maxR; r++) {
      for (let q = minQ; q <= maxQ; q++) {
        const { x, y } = hexToPixel(q, r, HEX_SIZE);
        const key = `${q},${r}`;
        const tile = mapData.get(key);
        const isHovered = hoveredHex && hoveredHex.q === q && hoveredHex.r === r;
        
        if (tile) {
          const terrain = TERRAIN_TILES.find(t => t.id === tile.type);
          if (terrain) {
            drawHex(ctx, x, y, HEX_SIZE, terrain.color, showGrid, '#555', 1);
            if (terrain.pattern !== 'solid') {
              drawPattern(ctx, x, y, terrain.pattern, HEX_SIZE, '#000');
            }
          }
        } else {
          drawHex(ctx, x, y, HEX_SIZE, null, showGrid, '#bbb', 0.5);
        }
        
        // Draw hover highlight
        if (isHovered && (selectedTool === 'tile' || selectedTool === 'feature' || selectedTool === 'road' || selectedTool === 'river')) {
          const highlightColor = isErasing ? '#ef4444' : '#3b82f6';
          drawHex(ctx, x, y, HEX_SIZE, null, true, highlightColor, 3);
        }
      }
    }
    
    ctx.restore();
  }, [mapData, dimensions, viewport, showGrid, hoveredHex, selectedTool, isErasing]);

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvas.width / 2 - viewport.x) / viewport.scale;
    const y = (e.clientY - rect.top - canvas.height / 2 - viewport.y) / viewport.scale;
    return pixelToHex(x, y, HEX_SIZE);
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    
    const isSpacePressed = e.nativeEvent.getModifierState && e.nativeEvent.getModifierState('Space');
    
    if (selectedTool === 'hand' || isSpacePressed) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
    } else if (selectedTool === 'tile' && !isErasing) {
      const hex = getMousePos(e);
      placeTile(hex.q, hex.r);
    } else if (isErasing) {
      const hex = getMousePos(e);
      eraseTile(hex.q, hex.r);
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setViewport(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    } else {
      // Update hovered hex for drawing tools
      if (selectedTool === 'tile' || selectedTool === 'feature' || selectedTool === 'road' || selectedTool === 'river') {
        const hex = getMousePos(e);
        setHoveredHex(hex);
      }
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoveredHex(null);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setViewport(prev => ({
        ...prev,
        scale: Math.max(0.3, Math.min(3, prev.scale * delta))
      }));
    } else {
      setViewport(prev => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  const placeTile = (q, r) => {
    const key = `${q},${r}`;
    setMapData(prev => {
      const newMap = new Map(prev);
      newMap.set(key, { type: selectedTile });
      return newMap;
    });
    
    const halfWidth = dimensions.width / 2;
    const halfHeight = dimensions.height / 2;
    
    if (Math.abs(q) >= halfWidth - 1 || Math.abs(r) >= halfHeight - 1) {
      setDimensions(prev => ({
        width: prev.width + 5,
        height: prev.height + 5
      }));
    }
  };

  const eraseTile = (q, r) => {
    const key = `${q},${r}`;
    setMapData(prev => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
  };

  const handleZoom = (delta) => {
    setViewport(prev => ({
      ...prev,
      scale: Math.max(0.3, Math.min(3, prev.scale + delta))
    }));
  };

  const resetZoom = () => {
    setViewport({ x: 0, y: 0, scale: 1 });
  };

  const clearMap = () => {
    if (window.confirm('Are you sure you want to clear the entire map? This cannot be undone.')) {
      setMapData(new Map());
      setDimensions({ width: 20, height: 20 });
      resetZoom();
    }
  };

  const saveMap = () => {
    const data = {
      version: '1.0',
      dimensions,
      tiles: Object.fromEntries(mapData),
      metadata: {
        created: Date.now(),
        modified: Date.now(),
        name: 'Hex Map'
      }
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hexmap-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadMap = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        setMapData(new Map(Object.entries(data.tiles)));
        setDimensions(data.dimensions);
        resetZoom();
      } catch (err) {
        alert('Failed to load map file');
      }
    };
    reader.readAsText(file);
  };

  const exportPNG = () => {
    const exportCanvas = document.createElement('canvas');
    const padding = 2;
    exportCanvas.width = (dimensions.width + padding) * HEX_WIDTH;
    exportCanvas.height = (dimensions.height + padding) * HEX_HEIGHT * 0.75;
    
    const ctx = exportCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    
    ctx.save();
    ctx.translate(exportCanvas.width / 2, exportCanvas.height / 2);
    
    const minQ = Math.floor(-dimensions.width / 2);
    const maxQ = Math.ceil(dimensions.width / 2);
    const minR = Math.floor(-dimensions.height / 2);
    const maxR = Math.ceil(dimensions.height / 2);
    
    for (let r = minR; r <= maxR; r++) {
      for (let q = minQ; q <= maxQ; q++) {
        const { x, y } = hexToPixel(q, r, HEX_SIZE);
        const key = `${q},${r}`;
        const tile = mapData.get(key);
        
        if (tile) {
          const terrain = TERRAIN_TILES.find(t => t.id === tile.type);
          if (terrain) {
            drawHex(ctx, x, y, HEX_SIZE, terrain.color, true, '#333', 2);
            if (terrain.pattern !== 'solid') {
              drawPattern(ctx, x, y, terrain.pattern, HEX_SIZE, '#000');
            }
          }
        } else {
          drawHex(ctx, x, y, HEX_SIZE, '#ffffff', true, '#ccc', 1);
        }
      }
    }
    
    ctx.restore();
    
    exportCanvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hexmap-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const expandMap = () => {
    setDimensions(prev => ({
      width: prev.width + expandValues.east + expandValues.west,
      height: prev.height + expandValues.north + expandValues.south
    }));
    setShowExpandDialog(false);
  };

  const getCursorStyle = () => {
    if (selectedTool === 'hand') return 'grab';
    return 'crosshair';
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <style>{`
        .eraser-cursor {
          cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2"><path d="M20 20H7L2 15l9-9 9 9-2 2M7 20v-4"/></svg>') 4 20, auto;
        }
      `}</style>
      
      <div className="bg-white border-b border-gray-300 px-4 py-2 flex gap-4 relative">
        <div className="relative">
          <button
            onClick={() => setMenuOpen(menuOpen === 'file' ? null : 'file')}
            className="px-3 py-1 hover:bg-gray-100 rounded"
          >
            File ▼
          </button>
          {menuOpen === 'file' && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 min-w-[220px]">
              <button onClick={clearMap} className="w-full px-4 py-2 text-left hover:bg-gray-100 whitespace-nowrap">New Map</button>
              <div className="border-t border-gray-200"></div>
              <label className="block w-full px-4 py-2 text-left hover:bg-gray-100 cursor-pointer whitespace-nowrap">
                Open Map
                <input type="file" accept=".json" onChange={loadMap} className="hidden" />
              </label>
              <button onClick={saveMap} className="w-full px-4 py-2 text-left hover:bg-gray-100 whitespace-nowrap">Save Map</button>
              <div className="border-t border-gray-200"></div>
              <button onClick={exportPNG} className="w-full px-4 py-2 text-left hover:bg-gray-100 whitespace-nowrap">Export as PNG</button>
              <div className="border-t border-gray-200"></div>
              <button onClick={() => { setShowExpandDialog(true); setMenuOpen(null); }} className="w-full px-4 py-2 text-left hover:bg-gray-100 whitespace-nowrap">Expand Map...</button>
            </div>
          )}
        </div>
        
        <div className="relative">
          <button
            onClick={() => setMenuOpen(menuOpen === 'view' ? null : 'view')}
            className="px-3 py-1 hover:bg-gray-100 rounded"
          >
            View ▼
          </button>
          {menuOpen === 'view' && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded shadow-lg z-50 min-w-[220px]">
              <button onClick={() => setShowGrid(!showGrid)} className="w-full px-4 py-2 text-left hover:bg-gray-100 whitespace-nowrap">
                {showGrid ? '✓' : ' '} Show Grid
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="w-16 bg-white border-r border-gray-300 flex flex-col items-center py-4 gap-2">
          <button
            onClick={() => setSelectedTool('tile')}
            className={`p-3 rounded ${selectedTool === 'tile' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
            title="Tile Placement"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L21 7v10l-9 5-9-5V7l9-5z" />
            </svg>
          </button>
          
          <button
            onClick={() => setSelectedTool('feature')}
            className={`p-3 rounded ${selectedTool === 'feature' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
            title="Features"
          >
            <Landmark size={24} />
          </button>
          
          <button
            onClick={() => setSelectedTool('road')}
            className={`p-3 rounded ${selectedTool === 'road' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
            title="Roads"
          >
            <Route size={24} />
          </button>
          
          <button
            onClick={() => setSelectedTool('river')}
            className={`p-3 rounded ${selectedTool === 'river' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
            title="Rivers"
          >
            <Waves size={24} />
          </button>
          
          <div className="border-t border-gray-300 w-full my-2"></div>
          
          <button
            onClick={() => setSelectedTool('hand')}
            className={`p-3 rounded ${selectedTool === 'hand' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}
            title="Hand (H)"
          >
            <Hand size={24} />
          </button>
          <button onClick={() => handleZoom(0.1)} className="p-3 hover:bg-gray-100 rounded" title="Zoom In">
            <Plus size={24} />
          </button>
          <button onClick={() => handleZoom(-0.1)} className="p-3 hover:bg-gray-100 rounded" title="Zoom Out">
            <Minus size={24} />
          </button>
          <button onClick={resetZoom} className="p-3 hover:bg-gray-100 rounded" title="Reset View">
            <RotateCcw size={24} />
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ cursor: getCursorStyle() }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
          />
        </div>

        {/* Tile Library - on right side */}
        {(selectedTool === 'tile') && (
          <div className="flex relative">
            {/* Tab controls - always visible */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full flex flex-col gap-1 z-10">
              <button 
                onClick={() => setLibraryColumns(Math.min(3, libraryColumns + 1))}
                disabled={libraryColumns >= 3}
                className={`px-2 py-3 bg-white border border-r-0 border-gray-300 rounded-l-lg shadow-lg ${libraryColumns >= 3 ? 'text-gray-300' : 'hover:bg-gray-50'}`}
                title="Expand Library"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setLibraryColumns(Math.max(0, libraryColumns - 1))}
                disabled={libraryColumns <= 0}
                className={`px-2 py-3 bg-white border border-r-0 border-gray-300 rounded-l-lg shadow-lg ${libraryColumns <= 0 ? 'text-gray-300' : 'hover:bg-gray-50'}`}
                title="Collapse Library"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            {/* Library panel */}
            <div className={`bg-white border-l border-gray-300 flex flex-col transition-all duration-300`} style={{ width: libraryColumns * 128 + 'px' }}>
              <div className="p-2 border-b border-gray-300 flex justify-end items-center">
                <button 
                  onClick={() => setIsErasing(!isErasing)}
                  className={`p-2 rounded ${isErasing ? 'bg-red-500 text-white' : 'hover:bg-gray-100'}`}
                  title="Erase Tiles"
                >
                  <Eraser size={18} />
                </button>
              </div>
              {libraryColumns > 0 && (
                <div className="flex-1 overflow-y-auto p-2">
                  <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${libraryColumns}, minmax(0, 1fr))` }}>
                    {TERRAIN_TILES.map(tile => (
                      <button
                        key={tile.id}
                        onClick={() => { setSelectedTile(tile.id); setIsErasing(false); }}
                        className={`flex flex-col items-center p-2 rounded border-2 transition-all ${
                          selectedTile === tile.id && !isErasing ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <TilePreview tile={tile} size={50} />
                        <span className="text-xs mt-1 text-center leading-tight">{tile.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Feature Library */}
        {(selectedTool === 'feature') && (
          <div className="flex relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full flex flex-col gap-1 z-10">
              <button 
                onClick={() => setLibraryColumns(Math.min(3, libraryColumns + 1))}
                disabled={libraryColumns >= 3}
                className={`px-2 py-3 bg-white border border-r-0 border-gray-300 rounded-l-lg shadow-lg ${libraryColumns >= 3 ? 'text-gray-300' : 'hover:bg-gray-50'}`}
                title="Expand Library"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setLibraryColumns(Math.max(0, libraryColumns - 1))}
                disabled={libraryColumns <= 0}
                className={`px-2 py-3 bg-white border border-r-0 border-gray-300 rounded-l-lg shadow-lg ${libraryColumns <= 0 ? 'text-gray-300' : 'hover:bg-gray-50'}`}
                title="Collapse Library"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <div className={`bg-white border-l border-gray-300 flex flex-col transition-all duration-300`} style={{ width: libraryColumns * 128 + 'px' }}>
              <div className="p-2 border-b border-gray-300 flex justify-end items-center">
                <button 
                  onClick={() => setIsErasing(!isErasing)}
                  className={`p-2 rounded ${isErasing ? 'bg-red-500 text-white' : 'hover:bg-gray-100'}`}
                  title="Erase Features"
                >
                  <Eraser size={18} />
                </button>
              </div>
              {libraryColumns > 0 && (
                <div className="flex-1 overflow-y-auto p-2">
                  <div className="text-xs text-gray-500 text-center p-4">
                    Feature library coming soon
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Road Library */}
        {(selectedTool === 'road') && (
          <div className="flex relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full flex flex-col gap-1 z-10">
              <button 
                onClick={() => setLibraryColumns(Math.min(3, libraryColumns + 1))}
                disabled={libraryColumns >= 3}
                className={`px-2 py-3 bg-white border border-r-0 border-gray-300 rounded-l-lg shadow-lg ${libraryColumns >= 3 ? 'text-gray-300' : 'hover:bg-gray-50'}`}
                title="Expand Library"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setLibraryColumns(Math.max(0, libraryColumns - 1))}
                disabled={libraryColumns <= 0}
                className={`px-2 py-3 bg-white border border-r-0 border-gray-300 rounded-l-lg shadow-lg ${libraryColumns <= 0 ? 'text-gray-300' : 'hover:bg-gray-50'}`}
                title="Collapse Library"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <div className={`bg-white border-l border-gray-300 flex flex-col transition-all duration-300`} style={{ width: libraryColumns * 128 + 'px' }}>
              <div className="p-2 border-b border-gray-300 flex justify-end items-center">
                <button 
                  onClick={() => setIsErasing(!isErasing)}
                  className={`p-2 rounded ${isErasing ? 'bg-red-500 text-white' : 'hover:bg-gray-100'}`}
                  title="Erase Roads"
                >
                  <Eraser size={18} />
                </button>
              </div>
              {libraryColumns > 0 && (
                <div className="flex-1 overflow-y-auto p-2">
                  <div className="text-xs text-gray-500 text-center p-4">
                    Road library coming soon
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* River Library */}
        {(selectedTool === 'river') && (
          <div className="flex relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full flex flex-col gap-1 z-10">
              <button 
                onClick={() => setLibraryColumns(Math.min(3, libraryColumns + 1))}
                disabled={libraryColumns >= 3}
                className={`px-2 py-3 bg-white border border-r-0 border-gray-300 rounded-l-lg shadow-lg ${libraryColumns >= 3 ? 'text-gray-300' : 'hover:bg-gray-50'}`}
                title="Expand Library"
              >
                <ChevronRight size={20} />
              </button>
              <button 
                onClick={() => setLibraryColumns(Math.max(0, libraryColumns - 1))}
                disabled={libraryColumns <= 0}
                className={`px-2 py-3 bg-white border border-r-0 border-gray-300 rounded-l-lg shadow-lg ${libraryColumns <= 0 ? 'text-gray-300' : 'hover:bg-gray-50'}`}
                title="Collapse Library"
              >
                <ChevronLeft size={20} />
              </button>
            </div>
            <div className={`bg-white border-l border-gray-300 flex flex-col transition-all duration-300`} style={{ width: libraryColumns * 128 + 'px' }}>
              <div className="p-2 border-b border-gray-300 flex justify-end items-center">
                <button 
                  onClick={() => setIsErasing(!isErasing)}
                  className={`p-2 rounded ${isErasing ? 'bg-red-500 text-white' : 'hover:bg-gray-100'}`}
                  title="Erase Rivers"
                >
                  <Eraser size={18} />
                </button>
              </div>
              {libraryColumns > 0 && (
                <div className="flex-1 overflow-y-auto p-2">
                  <div className="text-xs text-gray-500 text-center p-4">
                    River library coming soon
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-gray-300 px-4 py-2 flex items-center gap-6 text-sm text-gray-600">
        <div>Map: {dimensions.width}×{dimensions.height}</div>
        <div>Zoom: {Math.round(viewport.scale * 100)}%</div>
      </div>

      {showExpandDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Expand Map</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label>North:</label>
                <input
                  type="number"
                  value={expandValues.north}
                  onChange={(e) => setExpandValues(prev => ({ ...prev, north: parseInt(e.target.value) || 0 }))}
                  className="w-20 px-2 py-1 border border-gray-300 rounded"
                  min="0"
                />
              </div>
              <div className="flex items-center justify-between">
                <label>South:</label>
                <input
                  type="number"
                  value={expandValues.south}
                  onChange={(e) => setExpandValues(prev => ({ ...prev, south: parseInt(e.target.value) || 0 }))}
                  className="w-20 px-2 py-1 border border-gray-300 rounded"
                  min="0"
                />
              </div>
              <div className="flex items-center justify-between">
                <label>East:</label>
                <input
                  type="number"
                  value={expandValues.east}
                  onChange={(e) => setExpandValues(prev => ({ ...prev, east: parseInt(e.target.value) || 0 }))}
                  className="w-20 px-2 py-1 border border-gray-300 rounded"
                  min="0"
                />
              </div>
              <div className="flex items-center justify-between">
                <label>West:</label>
                <input
                  type="number"
                  value={expandValues.west}
                  onChange={(e) => setExpandValues(prev => ({ ...prev, west: parseInt(e.target.value) || 0 }))}
                  className="w-20 px-2 py-1 border border-gray-300 rounded"
                  min="0"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={expandMap} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Apply
              </button>
              <button onClick={() => setShowExpandDialog(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}