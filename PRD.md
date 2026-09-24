# tt-atlas — Product Requirements Document

## 1. Overview

**tt-atlas** (table-top atlas) is a browser-based hexagonal map editor for fantasy/hex-crawl tabletop RPG games. Designed for west marches style campaigns, it augments virtual table top platforms like Roll 20 by providing a dedicated overland travel and world-building tool. Users paint terrain tiles onto a hex grid, place feature icons (settlements, fortifications, landmarks), and draw roads and rivers between hexes. Maps are saved/loaded as JSON and can be exported as PNG images.

Planned features include fog of war (hiding unexplored tiles from players) and a wiki/lore system (notes associated with tiles to track world lore).

---

## 2. Tech Stack

### 2.1 Core Stack (Retained)

| Technology | Purpose |
|------------|---------|
| React 19 | UI framework (functional components + hooks) |
| Vite 7 | Build tool and dev server |
| Tailwind CSS 3 | Utility-first styling |
| Lucide React | Icon library for toolbar/UI |

### 2.2 New Additions (From Recommendations)

| Technology | Purpose | Rationale |
|------------|---------|-----------|
| **TypeScript** | Type safety across all source files | Catch regressions at compile time, self-documenting interfaces, safe refactoring. ~25-30 interfaces, ~300-500 lines of annotations. |
| **Konva / react-konva** | Replace manual Canvas 2D rendering | Built-in hit testing, layer management, drag-and-drop, shape events, batched rendering, PNG export. Eliminates ~400-500 lines of hand-rolled rendering code. |
| **Zustand** | State management | Replace 6 hook files with 1-2 stores. Eliminates prop drilling, provides devtools, selective re-renders, and undo/redo foundation. |
| **Immer** | Immutable state updates with Zustand | Enables undo/redo via structural sharing. ~40-60 lines for full undo/redo. |
| **Vitest** | Unit testing | Natural fit with Vite. Unit tests for hex math, map schema, path algorithms, hit testing. |

### 2.3 Do NOT Add

| Technology | Why Not |
|------------|---------|
| Next.js / Remix | Client-side tool, no routing or SSR needed |
| Redux / Jotai | Overkill. Zustand is the sweet spot |
| WebGL (Three.js) | Only for 60fps on very large maps. Canvas 2D via Konva is fine |
| Monorepo tooling | Single-package app |

### 2.4 Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint
- `npm run test` — Run unit tests
- `npm run preview` — Preview production build

---

## 3. Application Architecture

### 3.1 Directory Structure (Target)

```
src/
├── main.tsx                    # React mount point
├── App.tsx                     # Root component — orchestrates state and events
├── components/
│   ├── Toolbar.tsx             # Left-hand tool selector + zoom buttons
│   ├── TileLibrary.tsx         # Right panel: terrain tile picker
│   ├── FeatureLibrary.tsx      # Right panel: feature icon picker + style controls
│   ├── PathLibrary.tsx         # Right panel: road/river style editor + commit
│   ├── UI.tsx                  # MenuBar, ExpandDialog, StatusBar
│   ├── CollapsiblePanel.tsx    # Reusable slide-in/slide-out panel wrapper
│   ├── SwatchColorPicker.tsx   # Reusable color swatch + native picker
│   ├── TilePreview.tsx         # Canvas-based terrain tile thumbnail
│   └── ErrorBoundary.tsx       # Class-based error boundary
├── data/
│   ├── mapSchema.ts            # Map document factory, serialization, road/river creation
│   ├── terrain.ts              # 14 terrain tile definitions with pattern draw functions
│   ├── features.ts             # 21+ feature icon definitions with draw functions
│   └── swatches.ts             # Color palettes for all tool panels
├── stores/
│   ├── mapStore.ts             # Zustand store: map document + all CRUD operations + undo/redo
│   ├── toolStore.ts            # Zustand store: tool selection + sub-tool state
│   └── viewportStore.ts        # Zustand store: pan/zoom state
├── rendering/
│   ├── HexTile.tsx             # Konva Shape: hex tile with terrain fill + pattern
│   ├── PathLine.tsx            # Konva Shape: road/river with algorithm applied
│   ├── FeatureIcon.tsx         # Konva Shape: feature icon stamp
│   ├── MapCanvas.tsx           # Konva Stage: orchestrates layers and viewport
│   └── drawPath.ts             # Catmull-Rom spline + meander algorithms (pure math)
├── types/
│   ├── map.ts                  # MapDoc, Bounds, Tile, Feature, Road, River, PathStyle
│   ├── tools.ts                # ToolState, TileToolState, FeatureToolState, PathToolState
│   └── render.ts               # RenderState (if still needed for export)
└── utils/
    ├── hex.ts                  # Axial coordinate system (q/r), conversions, neighbors
    ├── hitTest.ts              # Point-to-segment distance (retained for edge cases)
    ├── styleUtils.ts           # Deep merge for path style objects
    └── constants.ts            # PANEL_WIDTH, HANDLE_WIDTH, HANDLE_HEIGHT, HEX_SIZE
```

### 3.2 State Flow (Zustand)

```
App.tsx
  ├── useMapStore()        → { mapDoc, placeTile, eraseTile, commitRoad, undo, redo, ... }
  │                          (autosaves to localStorage every 1s, Immer for immutable updates)
  ├── useToolStore()       → { selectedTool, tile, feature, path, ... }
  └── useViewportStore()   → { viewport, startDrag, continueDrag, zoomBy, ... }
```

**Key changes from current hooks:**
- `useMapData` (268 lines) → `mapStore` (~50 lines with Zustand + Immer)
- `useTileTools` + `useFeatureTools` + `usePathTools` + `useTools` (4 files) → `toolStore` (~80 lines)
- `useViewport` → `viewportStore` (~40 lines)
- No prop drilling: components read directly from stores via selectors
- DevTools integration via `zustand/middleware`

### 3.3 Rendering Pipeline (Konva)

Replace the 13-step manual canvas render pass with Konva layers:

```
<MapCanvas>                         ← Konva Stage (handles viewport transform, wheel events)
  <Layer name="tiles">             ← Background layer
    {tiles.map(hex => <HexTile/>)} ← Konva Shapes with onClick, onMouseEnter
  </Layer>
  <Layer name="paths">             ← Paths layer
    {roads.map(r => <PathLine/>)}
    {rivers.map(r => <PathLine/>)}
    {activePath && <PathPreview/>}
  </Layer>
  <Layer name="features">          ← Features layer
    {features.map(f => <FeatureIcon/>)}
  </Layer>
  <Layer name="ui">                ← UI overlay (hover highlights, selection rings)
    <HoverHighlight/>
    <SelectionRing/>
  </Layer>
</MapCanvas>
```

**What Konva eliminates:**
- Manual `visibleRange()` frustum culling (Konva handles off-screen nodes)
- Manual viewport transform (`ctx.translate/scale`)
- Manual hit testing (`hitTest.js` for interactive use — retained only for edge cases)
- Manual hover/selection highlight drawing
- Manual grid line rendering
- Monolithic `handleMouseDown`/`handleMouseMove` in App.jsx (~130 lines)
- Manual PNG export canvas logic (~20 lines → `stage.toDataURL()`)

**What remains as pure math:**
- `drawPath.ts` — Catmull-Rom spline + meander algorithms (called by `PathLine` to generate Konva path data)
- `hex.ts` — Coordinate conversions (called by all Konva shapes for positioning)

---

## 4. Data Model (TypeScript Interfaces)

```typescript
// types/map.ts

interface MapDoc {
  version: '2.0';
  bounds: Bounds;
  tiles: Map<string, Tile>;
  features: Map<string, Feature>;
  roads: Road[];
  rivers: River[];
}

interface Bounds {
  minR: number;
  maxR: number;
  minCol: number;
  maxCol: number;
}

interface Tile {
  type: string;           // terrain ID or 'custom'
  customColor?: string;   // hex color for custom tiles
}

interface Feature {
  id: string;             // feature icon ID
  color: string;          // hex color
  size: 'small' | 'medium' | 'large';
  rotation: number;       // degrees, 0-330 in 30° increments
}

interface Road {
  id: string;
  path: HexCoord[];
  style: RoadStyle;
}

interface River {
  id: string;
  path: HexCoord[];
  style: RiverStyle;
}

interface HexCoord {
  q: number;
  r: number;
}

// types/tools.ts

type ToolType = 'hand' | 'tile' | 'feature' | 'road' | 'river';
type ToolMode = 'draw' | 'select' | 'erase';

interface TileToolState {
  mode: ToolMode;
  selectedTile: string;
  customColor: string;
  selectedHex: HexCoord | null;
}

interface FeatureToolState {
  mode: ToolMode;
  selectedId: string;
  color: string;
  size: 'small' | 'medium' | 'large';
  rotation: number;
  selectedHex: HexCoord | null;
}

interface PathToolState {
  mode: ToolMode;
  selectedPathId: string | null;
  hoveredPathId: string | null;
  activePath: HexCoord[];
  isDrawing: boolean;
  roadStyle: RoadStyle;
  riverStyle: RiverStyle;
}
```

---

## 5. Terrain Tiles (14 Types)

| ID | Name | Color | Pattern |
|----|------|-------|---------|
| `plains` | Plains | `#B4F157` | None (flat fill) |
| `farmland` | Farmland | `#a9e156` | Crop row lines |
| `forest` | Forest | `#4CAF50` | 9 sparse tree triangles |
| `dense-forest` | Dense Forest | `#2E7D32` | 19 dense tree triangles |
| `hills` | Hills | `#E8D4B8` | Wavy horizontal curves |
| `mountain-range` | Mountain Range | `#B09877` | 3 bottom + 2 top peak triangles |
| `large-mountain` | Large Mountain | `#8B7768` | Single large triangle with snow cap |
| `volcano` | Volcano | `#B36B2E` | Trapezoid with orange fill |
| `water` | Water | `#73A9D7` | 3 rows of wave curves |
| `shallow-water` | Shallow Water | `#ADE1F9` | 2 rows of gentle waves |
| `deep-water` | Deep Water | `#4A6B8C` | 4 rows of tight waves |
| `desert` | Desert/Beach | `#F9EDBB` | Scattered dots |
| `swamp` | Swamp | `#bad4ab` | Reed stalks |
| `custom` | Custom | `#cccccc` | None (user-picked color) |

- Water tile IDs: `['shallow-water', 'water', 'deep-water']`
- Pattern scale constant (`SCALE = 1.3`) exported from `terrain.ts` or made a parameter
- Custom tiles use a user-selected color via `SwatchColorPicker`

---

## 6. Feature Icons (21+ Icons in 4 Categories)

### 6.1 Shape/Status System (Cartographic Convention)

| Shape Family | Represents | Status Hierarchy |
|-------------|------------|------------------|
| **Circle** | Settlements | solid = humble, open = established, nested = major, star = exceptional, slash = ruined |
| **Square** | Fortifications | same hierarchy |
| **Diamond** | Landmarks | same hierarchy |

### 6.2 Settlements (Circle Family)

| ID | Name | Visual |
|----|------|--------|
| `homestead` | Homestead | Solid house silhouette |
| `thorp` | Thorp | Small open circle (r=12) |
| `village` | Village | Open circle (r=18) |
| `town` | Town | Open circle + inner solid circle |
| `city` | City | Open circle + inner star |
| `ruined-settlement` | Ruined Settlement | Open circle + diagonal slash |

### 6.3 Fortifications (Square Family)

| ID | Name | Visual |
|----|------|--------|
| `keep` | Keep | Solid square (26x26) |
| `fort` | Fort | Open square (38x38) |
| `castle` | Castle | Open square + inner solid square |
| `citadel` | Citadel | Open square + inner star |
| `ruined-fortification` | Ruined Fortification | Open square + diagonal slash |

### 6.4 Landmarks (Diamond Family)

| ID | Name | Visual |
|----|------|--------|
| `shrine` | Shrine | Solid diamond (r=16) |
| `tower` | Tower | Open diamond (r=22) |
| `abbey` | Abbey | Open diamond + inner solid diamond |
| `cathedral` | Cathedral | Open diamond + inner star |
| `ruins` | Ruins | Open diamond + diagonal slash |

### 6.5 Other

| ID | Name | Visual |
|----|------|--------|
| `bridge` | Bridge | Two bracket shapes (OSR symbol) |
| `ford` | Ford | Two parallel dashed lines |
| `mine` | Mine | Crossed pickaxe + hammer |
| `lair` | Lair | Bear paw print |
| `cave` | Cave | Solid arch shape |
| `dungeon` | Dungeon | Portcullis (arch + bars) |
| `barrows` | Barrows | Three dots in triangle |
| `obelisk` | Obelisk | Shaft + pyramidion |
| `stone-circle` | Stone Circle | Ring of 6 dots |
| `poi` | Point of Interest | Solid 5-pointed star |

### 6.6 Feature Properties

- **Color**: Any hex color (default `#000000`)
- **Size**: `small` (0.65x), `medium` (1.0x), `large` (1.45x)
- **Rotation**: 0-330 degrees in 30-degree increments

---

## 7. Path System (Roads & Rivers)

### 7.1 Drawing Interaction

1. User selects Road or River tool
2. Click hexes on the map to add waypoints
3. Path renders as a dashed preview line with waypoint dots
4. Double-click or press Enter to commit
5. Press Escape to cancel
6. Minimum 2 points required to commit

### 7.2 Algorithms

| Algorithm | Description | Used By |
|-----------|-------------|---------|
| `'none'` | Straight line segments between waypoints | Optional for any |
| `'smooth'` | Catmull-Rom spline smoothing | Roads (default) |
| `'meander'` | Midpoint displacement + spline | Rivers (default) |

### 7.3 Meander Algorithm Details

1. **Inject intermediate points**: Subdivides segments by `meander.points` count (default 1)
2. **Midpoint displacement**: Recursively inserts midpoints offset perpendicularly by seeded random amount
   - Amplitude scaling: `amplitude * segmentLength * 0.55^(3-depth)`
   - Default depth: 3 levels
   - Seeded PRNG ensures deterministic shape across renders

### 7.4 River Rendering

Rivers get a **border pass**: a wider stroke (`width + 4`) in a darkened color (`darkenColor(color, 0.58)`) is drawn first, then the main color on top.

### 7.5 Style Controls

| Control | Options |
|---------|---------|
| Color | Swatch picker (4 river colors, 5 road colors) + native picker |
| Width | 1-20px slider |
| Dash | Solid `[]`, Dashed `[16,10]`, Dotted `[3,12]` |
| Algorithm | None / Smooth / Meander (rivers only get all three) |
| Spline tension | 0-1 (Sharp-to-Gentle) — when algorithm is Smooth or Meander |
| Meander amplitude | 0-1 (Subtle-to-Wild) |
| Meander depth | 1-5 (Simple-to-Complex) |
| Meander points | 0-3 (Sparse-to-Dense) |

---

## 8. UI Layout

```
┌──────────────────────────────────────────────────────┐
│ MenuBar (File | View)                                 │
├────┬───────────────────────────────────┬─────────────┤
│    │                                   │ TileLibrary │
│    │                                   │ OR          │
│Tool│     Konva Stage (hex map)         │ FeatureLib  │
│bar │     (react-konva rendering)       │ OR          │
│    │                                   │ PathLibrary │
│    │                                   │ (right side)│
├────┴───────────────────────────────────┴─────────────┤
│ StatusBar (map size | zoom% | hovered hex coords)    │
└──────────────────────────────────────────────────────┘
```

### 8.1 Toolbar (Left Side, 64px wide)

- **Tile Placement** (hex icon) — key: `T`
- **Roads** (Route icon) — key: `R`
- **Rivers** (Waves icon) — key: `W`
- **Features** (Landmark icon) — key: `F`
- Divider
- **Pan** (Hand icon) — key: `H`
- Divider
- Zoom In (+), Zoom Out (-), Reset View (rotate-ccw)

### 8.2 MenuBar (Top)

**File menu:**
- New Map (confirms before clearing)
- Open Map (JSON file picker)
- Save Map (downloads JSON)
- Export as PNG (`stage.toDataURL()`)
- Resize Map (opens ExpandDialog)

**View menu:**
- Show Grid (toggle, checkmark)
- Show Coordinates (toggle, checkmark)

### 8.3 Right Panel (268px, collapsible)

Each panel (Tile/Feature/Path) shares:
- **CollapsiblePanel** wrapper with chevron toggle handle
- **Draw/Select/Erase** mode switcher (Pencil/MousePointer2/Eraser icons)
- **Context-sensitive hint text** below mode switcher
- **Delete button** (red, Select mode only)

**TileLibrary panel:**
- Custom color picker (when custom tile selected)
- Tile gallery (list or card view, scrollable)
- Each tile rendered as `TilePreview` canvas with label
- Select mode: shows selected hex's tile + delete button

**FeatureLibrary panel:**
- Color swatch picker
- Size toggle (small/medium/large)
- Rotation controls (30° increments, left/right arrows)
- Categorized feature gallery (Settlements/Fortifications/Landmarks/Other)
- Each feature rendered as canvas preview
- Select mode: shows selected hex's feature data

**PathLibrary panel:**
- Live point count during drawing ("3 points — double click to finish")
- Commit / Cancel buttons (during active drawing)
- Color swatch picker
- Width slider (1-20px)
- Dash pattern selector (Solid/Dashed/Dotted)
- Algorithm selector (None/Smooth/Meander)
- Spline tension slider (when applicable)
- Meander amplitude/depth/points sliders (rivers only)
- Select mode: shows selected path's style + delete button

### 8.4 StatusBar (Bottom)

- Map dimensions: `cols x rows`
- Zoom level: `100%` (100 = home/0.5 scale)
- Hovered hex coordinates: `(q, r)` or `(-, -)`

### 8.5 ExpandDialog (Modal)

- Per-edge increment/decrement: North, South, East, West
- Positive values expand, negative contract
- Data-loss check on contraction (returns `{ success, reason }` — no `alert()`)
- Apply / Cancel buttons

### 8.6 Cursor Logic

| Tool/Mode | Cursor |
|-----------|--------|
| Hand / Dragging | `grab` |
| Erase mode | `crosshair` |
| Path select mode | `pointer` |
| Feature select mode | `pointer` |
| Tile select mode | `pointer` |
| Default | `crosshair` |

---

## 9. Interactions (Konva Event Model)

### 9.1 Mouse Interactions

With Konva, each hex shape receives events directly:

| Konva Event | Behavior |
|-------------|----------|
| `HexTile.onClick` (tile draw) | Place tile at hex |
| `HexTile.onDragMove` (tile draw) | Paint tiles along drag path |
| `HexTile.onClick` (tile erase) | Erase tile at hex |
| `HexTile.onClick` (tile select) | Select hex for inspection |
| `HexTile.onClick` (feature draw) | Place feature at hex |
| `HexTile.onRightClick` (feature draw) | Remove feature at hex |
| `HexTile.onClick` (feature erase) | Remove feature at hex |
| `HexTile.onClick` (feature select) | Select hex's feature |
| `HexTile.onClick` (path draw) | Add waypoint to active path |
| `PathLine.onDoubleClick` (path draw) | Commit active path |
| `PathLine.onClick` (path erase) | Delete path |
| `PathLine.onClick` (path select) | Select path |
| `Stage.onDragMove` (hand) | Pan the viewport |
| `Stage.onWheel` | Pan (plain) or Zoom (Ctrl/Cmd held) |

### 9.2 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `H` | Switch to Hand (Pan) tool |
| `T` | Switch to Tile tool |
| `F` | Switch to Feature tool |
| `R` | Switch to Road tool |
| `W` | Switch to River tool |
| `Enter` | Commit active path |
| `Escape` | Cancel path / clear selection |
| `Delete` / `Backspace` | Delete selected path or feature |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |

Shortcuts are disabled when focus is on an `<input>` or `<textarea>`.

---

## 10. Undo/Redo System

### 10.1 Implementation

Via Zustand + Immer middleware:
- Each state mutation wraps in `produce()` → creates structural sharing snapshot
- History stack stores previous `MapDoc` snapshots
- `undo()` / `redo()` restore from stack
- Keyboard: `Ctrl+Z` / `Ctrl+Shift+Z`

### 10.2 Scope

All map mutations are undoable:
- Tile placement/erasure
- Feature placement/removal/update
- Road/river drawing/deletion/style changes
- Map resize

### 10.3 Limits

- History depth: configurable (default 50 steps)
- Clears on "New Map"

---

## 11. File I/O

### 11.1 Autosave

- Debounced 1-second save to `localStorage` under key `hexmap-autosave`
- Serializes entire map document via `serialiseMap()` (converts Maps to arrays)
- On app init, attempts to restore from localStorage; falls back to empty 20x20 map
- Future: migrate to IndexedDB (Dexie.js) if maps exceed 5MB localStorage limit

### 11.2 Save to File

- Serializes map to JSON, creates Blob, triggers browser download as `hexmap-{timestamp}.json`

### 11.3 Load from File

- Reads JSON file via FileReader, deserializes (restores Maps from arrays)
- Migrates old schema formats (e.g., `dimensions: {width, height}` → `bounds`)
- If file includes viewport data, restores viewport position

### 11.4 Export PNG

- Konva's `stage.toDataURL()` replaces manual offscreen canvas
- Grid always included in export
- Triggers download as `hexmap-{timestamp}.png`

---

## 12. Viewport System

### 12.1 State

```typescript
{ x: number; y: number; scale: number }  // default: { x: 0, y: 0, scale: 0.5 }
```

- `MIN_SCALE` = 0.1, `MAX_SCALE` = 4.0
- Default (home) is `scale = 0.5`
- Zoom percent displayed as `(scale / 0.5) * 100`

### 12.2 Konva Integration

- `Stage.scale()` and `Stage.position()` handle viewport transform
- Built-in drag support replaces manual `useViewport` drag tracking
- `Stage.onWheel` handles zoom (Ctrl/Cmd) and pan (plain scroll)

---

## 13. Hex Grid Math (utils/hex.ts)

| Function | Purpose |
|----------|---------|
| `isInBounds(q, r, bounds)` | Check if hex is within map bounds (single source of truth) |
| `hexToPixel(q, r, size?)` | Axial coords → pixel center |
| `pixelToHex(x, y, size?)` | Pixel → nearest hex (with rounding) |
| `roundHex(q, r)` | Round fractional axial coords to nearest hex |
| `hexNeighbours(q, r)` | Returns 6 adjacent hex coordinates |
| `hexKey(q, r)` | Canonical string key `"q,r"` for Map usage |
| `parseHexKey(key)` | Parse `"q,r"` back to `{q, r}` |

**Key formulas (pointy-top):**
- `x = size * sqrt(3) * (q + r/2)`
- `y = size * 3/2 * r`

**Deduplication fix:** `isInBounds` exists in one place (`hex.ts`), imported by all consumers.

---

## 14. Hit Testing

### 14.1 Interactive (Konva)

Konva handles hit testing natively via its scene graph. Each `HexTile`, `PathLine`, and `FeatureIcon` shape receives mouse events directly. No manual point-to-segment distance needed for interactive use.

### 14.2 Edge Cases (Retained)

`hitTest.ts` retained for potential future use (e.g., click-to-select in exported static maps or proximity-based path selection), but not used in the primary interactive path.

---

## 15. Persistence & Migration

- Map schema version: `'2.0'`
- Serialization: `Map` → arrays for JSON compatibility
- Deserialization: arrays → `Map` objects
- Migration: old `dimensions: {width, height}` format auto-converted to `bounds`
- Road/river styles: missing `algorithm` and `meander` fields injected with defaults
- ID generation: `crypto.randomUUID()` with try/catch fallback (`Date.now()-random`)

---

## 16. Color Palettes

### Tile Swatches (7)
Grey `#b3b3b3`, Red `#FF6666`, Yellow `#ffde66`, Plains Green `#B4F157`, Forest Green `#4CAF50`, Hills Brown `#E8D4B8`, Swamp Grey `#bad4ab`

### Road Swatches (5)
Light Brown `#c4a882`, Dark Brown `#8B7355`, Black `#222222`, Light Grey `#aaaaaa`, Red `#bb2222`

### River Swatches (4)
Shallow Water `#ADE1F9`, Water `#73A9D7`, Deep Water `#4A6B8C`, Lava Flow `#e15b5b`

### Feature Swatches (7)
Black `#000000`, Red `#bb2222`, Green `#2e6930`, Blue `#507696`, Brown `#b09673`, Grey-Green `#6c7466`, Grey `#cccccc`

---

## 17. TypeScript Conversion Order

1. Install TypeScript, create `tsconfig.json`
2. `src/data/mapSchema.ts` — core domain types first
3. `src/data/terrain.ts`, `features.ts`, `swatches.ts`
4. `src/utils/hex.ts`, `hitTest.ts`, `styleUtils.ts`, `constants.ts`
5. `src/types/map.ts`, `tools.ts`, `render.ts` — define all interfaces
6. `src/stores/mapStore.ts`, `toolStore.ts`, `viewportStore.ts` — new Zustand stores
7. `src/rendering/` — Konva components
8. `src/components/*.tsx` — define prop interfaces
9. `src/App.tsx` — last, once all dependencies typed
10. Update ESLint config for TypeScript

---

## 18. Known Issues & Technical Debt (Current → Fixed)

| Issue | Current State | Target State |
|-------|---------------|--------------|
| Stale closures in `useTools.js` | Spread creates new objects every render | Zustand selectors eliminate this entirely |
| `isInBounds` duplicated | 2 implementations | Single source in `hex.ts` |
| `hexKey` called repeatedly in render | O(n×passes) per frame | Konva only redraws changed nodes |
| Water tiles rendered twice | Double rendering cost | Konva layer ordering eliminates need |
| Separate road/river render loops | Two `forEach` loops | Single layer in Konva |
| Temp canvas per tile preview | GC pressure | Single shared offscreen canvas |
| `crypto.randomUUID()` no fallback | Fails on non-secure contexts | Try/catch with timestamp fallback |
| `PANEL_WIDTH` duplicated | 3 files | Single export from `constants.ts` |
| `resizeMap` uses `alert()` | Blocks event loop | Returns `{ success, reason }` |
| `SCALE = 1.3` magic number | Undocumented | Exported or parameterized |
| Swatch re-exports inconsistent | Mixed import paths | Single convention |
| No tests | Manual verification only | Vitest unit tests for hex, mapSchema, drawPath, hitTest |
| Render state unstructured | Plain object, no validation | TypeScript interfaces enforce shape |
| Keyboard handler `eslint-disable` | Suppressed lint warning | Zustand store eliminates stale closure |
| Vestigial `App.css` | Empty file imported | Removed |

---

## 19. Testing Strategy

**Framework:** Vitest (natural fit with Vite)

**Minimum unit tests:**
- `hex.ts` — coordinate conversion, rounding, bounds checking
- `mapSchema.ts` — serialise/deserialise round-trip, migration
- `drawPath.ts` — meander algorithm determinism
- `hitTest.ts` — point-to-segment distance, path hit testing

---

## 20. Quick Wins (Implementation Order)

These are safe, scoped fixes to apply during the rewrite:

1. **Deduplicate `isInBounds`** — Single source in `hex.ts`
2. **Cache `hexKey`** — Compute once per iteration in render loops
3. **Centralize `PANEL_WIDTH`** — Single export from `constants.ts`
4. **Add `crypto.randomUUID()` fallback** — Try/catch in `mapSchema.ts`
5. **Merge road/river render loops** — Single Konva layer
6. **Remove `App.css`** — Delete vestigial file
7. **Replace `alert()` in resize** — Return status object to UI
8. **Export `SCALE` constant** — From `terrain.ts` or as parameter
