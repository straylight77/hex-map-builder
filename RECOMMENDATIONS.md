# Codebase Recommendations

Generated 2026-06-08 after full codebase review.

## LLM Context (read first)

### How to navigate this codebase

**Entry points:**
- `src/App.jsx` — root component, orchestrates all state and event handling
- `src/main.jsx` — React mount point

**State lives in hooks:**
- `src/hooks/useMapData.js` — the entire map document (tiles, features, roads, rivers, bounds)
- `src/hooks/useTileTools.js` — tile tool mode/selection state
- `src/hooks/useFeatureTools.js` — feature tool mode/selection/style state
- `src/hooks/usePathTools.js` — road/river path tool state + drawing
- `src/hooks/useTools.js` — thin coordinator that owns `selectedTool` and spreads sub-tools
- `src/hooks/useViewport.js` — pan/zoom state

**Rendering pipeline:**
- `src/rendering/renderState.js` — assembles a flat state object from hooks into what renderer expects
- `src/rendering/renderer.js` — main `renderMap(canvas, state)` function; 7 passes over hex grid
- `src/rendering/drawPrimitives.js` — hex shapes, tile fills, hover highlights, feature stamps
- `src/rendering/drawPath.js` — Catmull-Rom spline + meander (midpoint displacement) path rendering

**UI panels (all right-side, 268px):**
- `src/components/TileLibrary.jsx` — tile picker (draw/select/erase modes)
- `src/components/FeatureLibrary.jsx` — feature picker with style controls
- `src/components/PathLibrary.jsx` — road/river style editor + commit controls
- `src/components/Toolbar.jsx` — left-hand tool/zoom buttons
- `src/components/UI.jsx` — menu bar, resize dialog, status bar
- `src/components/SwatchColorPicker.jsx` — reused color picker across all panels

**Data (pure, no React):**
- `src/data/mapSchema.js` — creates roads/rivers, serialise/deserialise
- `src/data/terrain.js` — 14 terrain tile definitions with pattern draw functions
- `src/data/features.js` — 24 feature icon definitions with draw functions
- `src/data/swatches.js` — colour palettes for all tool panels

**Utilities:**
- `src/utils/hex.js` — axial coordinate system (q/r), hexToPixel, pixelToHex, roundHex, hexKey, hexNeighbours
- `src/utils/hitTest.js` — point-to-segment distance, path hit-testing
- `src/utils/styleUtils.js` — deep merge for path style objects (handles spline/meander sub-objects)

### Key data types

```js
// Map document (useMapData returns mapDoc)
{
  version: '2.0',
  bounds: { minR, maxR, minCol, maxCol }, // offset-column boundary
  tiles: Map<string, { type: string, customColor?: string }>,
  features: Map<string, { id: string, color: string, size: string, rotation: number }>,
  roads: Array<{ id: string, path: [{q, r}], style: RoadStyle }>,
  rivers: Array<{ id: string, path: [{q, r}], style: RiverStyle }>,
}

// hexKey = `${q},${r}` — used as Map keys throughout
// HEX_SIZE = 70 — constant pixel radius of a hex
```

### Key rendering details

- Pointy-top hexagons, axial coordinates (q, r)
- Render order (back to front): out-of-bounds grey → tiles → rivers → roads → water tiles (re-drawn) → grid → coords → path preview → features → selection highlights → hover highlights → path highlights
- `visibleRange(canvasW, canvasH, viewport, buffer=3)` calculates which hexes are on screen
- Water tiles are rendered twice (pass 1 + pass 4) to overlay roads/rivers
- Path algorithms: 'none' (straight lines), 'smooth' (Catmull-Rom spline), 'meander' (midpoint displacement + spline)
- `buildExportRenderState` strips all interaction state for PNG export

### Rendering hot path (`renderer.js:renderMap`)

Called on every state change via `useEffect` in `App.jsx:72-98`. Iterates over the visible hex range in 7 separate nested loops. The range is typically small (visible area + 3 buffer), but map documents can be arbitrarily large. Each loop calls `hexToPixel()` and `hexKey()`.

### Import conventions

- No TypeScript — all `.jsx` files
- React 19 + Vite 7 + Tailwind CSS 3
- Lucide React for icons
- ESLint 9 flat config (no TypeScript plugins)
- No test framework

---

## P0 — Bugs & Correctness

### 1. Stale closures from spread in `useTools.js`

**File:** `src/hooks/useTools.js:42-44`

```js
tile:    { ...tile,    setMode: tileSetMode    },
feature: { ...feature, setMode: featureSetMode },
path:    { ...path,    setMode: pathSetMode    },
```

**Problem:** A new object is created every render, breaking referential identity. The `selectTool` callback captures `tile`, `feature`, `path` — but these are fresh objects each time. The keyboard handler in `App.jsx:188-211` depends on these and has an `eslint-disable-line` suppression as a workaround.

**Consequence:** Hard-to-track re-render cascades. The `useTools` return value changes identity every render, forcing all consumers to re-render even when nothing changed.

**Fix:** Instead of spreading, expose sub-tool setters directly and let consumers access sub-tool state through named properties. Or memoize the composed object.

### 2. `isInBounds` duplicated in two files

- `src/hooks/useMapData.js:13-17`
- `src/rendering/renderer.js:43-47`

**Problem:** Two independent implementations. If the boundary logic changes (e.g., different hex orientation), they'll diverge silently.

**Fix:** Move to `src/utils/hex.js` and import everywhere.

### 3. `hexKey(q, r)` called repeatedly in render hot path

**File:** `src/rendering/renderer.js` — lines 149, 172, 186, 197, 213

**Problem:** In each of the 5+ iteration passes over the hex range, `hexKey(q, r)` is called. This is a string concatenation (`${q},${r}`) — cheap, but called O(n×passes) per frame.

**Fix:** Compute the key once per iteration:

```js
for (let r = minR; r <= maxR; r++) {
  for (let q = minQ; q <= maxQ; q++) {
    const key = hexKey(q, r);
    // ... use key everywhere in this iteration
  }
}
```

---

## P1 — Performance

### 4. Water tiles rendered twice per frame

**File:** `src/rendering/renderer.js:145-153` (tile pass) and `167-177` (water re-draw pass)

**Problem:** All tiles are drawn in pass 1, rivers/roads in passes 2-3, then water tiles are redrawn in pass 4 to overlay the roads/rivers. This doubles rendering cost for water tiles.

**Fix options:**
- Skip water tiles in the first tile pass and only draw them in pass 4
- Or clip the water re-draw to only hexes that intersect road/river paths

### 5. Separate loops for roads and rivers

**File:** `src/rendering/renderer.js:155-165`

**Problem:** Two separate `forEach` loops that do the same thing — iterate paths and draw them.

**Fix:** Merge into a single loop that draws all paths, skipping hovered/selected paths (they're drawn later as highlights):

```js
const allPaths = [...(state.roads ?? []), ...(state.rivers ?? [])];
allPaths.forEach(path => {
  if (path.id === state.hoveredPathId || path.id === state.selectedPathId) return;
  drawPath(ctx, path.path, path.style);
});
```

### 6. Temp canvas allocation per `renderTilePreview` call

**File:** `src/rendering/drawPrimitives.js:85`

```js
const temp = document.createElement('canvas');
```

**Problem:** Every tile preview in the sidebar allocates and discards a new canvas element, triggering GC pressure.

**Fix:** Use a single shared offscreen canvas with `OffscreenCanvas` or a module-level cached canvas.

---

## P2 — Maintainability & Code Quality

### 7. `crypto.randomUUID()` needs fallback

**File:** `src/data/mapSchema.js:70,78`

**Problem:** Works only in secure contexts (HTTPS or localhost). Fails on HTTP or in some embedded web views.

**Fix:** Provide a simple fallback:

```js
function generateId() {
  try { return crypto.randomUUID(); } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
}
```

### 8. `PANEL_WIDTH = 268` duplicated

- `src/components/TileLibrary.jsx:7`
- `src/components/FeatureLibrary.jsx:10`
- `src/components/PathLibrary.jsx:4`

**Fix:** Export from a shared constants file, e.g., `src/utils/constants.js`.

### 9. `resizeMap` uses `alert()`

**File:** `src/hooks/useMapData.js:123-158`

**Problem:** `alert()` blocks the JS event loop and provides a poor UX. The `resizeMap` callback is called from `ExpandDialog` — it should return a status and let the UI show feedback.

**Fix:** Change `resizeMap` to return `{ success: boolean, reason?: string }` and let the dialog component show an inline error message.

### 10. Magic `SCALE = 1.3` in terrain renderers

**File:** `src/data/terrain.js:7`

**Problem:** All 14 terrain draw functions use this undocumented constant with no way for consumers to tune it.

**Fix:** Export it or make it a parameter of the draw pattern functions.

### 11. Inconsistent re-export of swatches

**File:** `src/components/SwatchColorPicker.jsx:9-14`

**Problem:** `swatches.js` data is re-exported through `SwatchColorPicker.jsx`. Some components import from `SwatchColorPicker.jsx`, others import directly from `../data/terrain.js`. This makes the dependency graph confusing.

**Fix:** Pick one convention — either always import data from `../data/*.js` or always through the component. The re-export exists for backward compat but adds indirection.

---

## P3 — Architecture & Patterns

### 12. No tests

**Context:** AGENTS.md says "No test framework configured."

**Risk:** The rendering pipeline (7 passes, meander algorithm, hit-testing, serialisation) is non-trivial and has no tests. Any refactoring requires manual visual verification.

**Suggestion:** At minimum, add unit tests for:
- `hex.js` (coordinate conversion, rounding)
- `mapSchema.js` (serialise/deserialise round-trip, migration)
- `drawPath.js` (meander algorithm determinism)
- `hitTest.js` (point-to-segment distance, path hit testing)

### 13. Render state is an unstructured object

**File:** `src/rendering/renderState.js:40-72`

**Problem:** The render state is a plain object with no validation. A misspelled key (e.g., `tiles` vs `tile`) silently produces a blank canvas. Without TypeScript, there's no compile-time check.

**Fix options:**
- Add runtime validation (simple `assert`-style checks)
- Or document the full shape as JSDoc in `renderState.js` and use it as the source of truth

### 14. Keyboard handler suppresses lint warnings

**File:** `src/App.jsx:211` — `// eslint-disable-line`

**Problem:** The `useEffect` dependency array is intentionally incomplete, with the lint rule suppressed. This means stale closures are possible if a callback changes without the effect re-running.

**Risk:** If `handleDeleteSelectedPath` or `handleDeleteSelectedFeature` change, the keyboard handler still uses the old version until the next render cycle that changes another listed dep.

### 15. Unused or vestigial `App.css`

**File:** `src/App.css`

**Problem:** The project uses Tailwind CSS exclusively. `App.css` may contain leftover styles from an earlier version. It's imported in `App.jsx` — if empty, remove the import.

---

## Quick wins (1-2 edits each)

These are safe, scoped fixes an LLM can make without risking breakage:

1. **Deduplicate `isInBounds`** — Move to `src/utils/hex.js`, update both import sites
2. **Cache `hexKey`** — In each renderer loop, call once per (q, r) and reuse
3. **Export `PANEL_WIDTH` from one place** — Create `src/utils/constants.js`
4. **Add fallback for `crypto.randomUUID()`** — One function change in `mapSchema.js`
5. **Merge road/river render loops** — Single `forEach` in `renderer.js:155-165`
6. **Check/remove `App.css`** — Audit whether it's actually used

---

## Tech stack recommendations

### TypeScript conversion — Recommended

**Verdict: Yes, worth doing — especially given the app will grow.**

The codebase is ~4,345 lines across 29 source files. TypeScript conversion is moderate effort (~2–4 hours for an experienced developer) with high long-term payoff for a growing project.

**Why it's worth it for a growing app:**
- **Catch regressions at compile time** — As features are added (layers, brushes, undo/redo, collaboration), type safety prevents entire classes of bugs (misspelled keys, wrong prop types, null dereferences)
- **Self-documenting interfaces** — The core data types (`MapDoc`, `Bounds`, `PathStyle`, `Road`, `River`, `RenderState`) become explicit contracts, not just JSDoc comments. New contributors (or LLMs) can understand the codebase faster
- **Refactor safely** — Changing a data structure (e.g., adding a field to `Road`) immediately shows every place that needs updating, instead of silently breaking at runtime
- **Better IDE support** — Autocomplete, inline documentation, and jump-to-definition across 29 files. Especially valuable for the 3 large components with 12–15 props each (TileLibrary, FeatureLibrary, PathLibrary)
- **Prevents the "render state" problem** — `renderState.js` builds a flat object with no validation; a misspelled key silently produces a blank canvas. TypeScript catches this at build time

**What makes this conversion manageable:**
- `@types/react` and `@types/react-dom` are already in devDependencies
- `utils/hex.js` and `utils/hexTest.js` are fully JSDoc-annotated — near-automatic conversion
- Vite 7 supports TypeScript with zero config changes
- No test framework means no test migration overhead

**Estimated effort:**
- ~25–30 new interfaces/types to define
- ~300–500 lines of new type annotations
- 74 existing JSDoc annotations map ~1:1 to TypeScript, saving ~30–40 minutes

**Recommended conversion order:**
1. Install TypeScript, create `tsconfig.json`
2. `src/data/mapSchema.js` → `.ts` (core domain types first)
3. `src/data/` remaining files → `.ts`
4. `src/utils/*.js` → `.ts` (already annotated, near-automatic)
5. `src/rendering/*.js` → `.ts` (depends on step 2 types)
6. `src/hooks/*.js` → `.ts` (define return types)
7. `src/components/*.jsx` → `.tsx` (define prop interfaces)
8. `src/App.jsx` → `.tsx` (last, once all dependencies typed)
9. Update ESLint config for TypeScript

---

### Replace manual Canvas 2D with Konva/react-konva — Recommended

**Current state:** The app implements its own 2D scene graph on raw Canvas — hit testing, hover highlights, selection rings, layered rendering, viewport pan/zoom, and wheel events are all hand-written across `renderer.js`, `drawPrimitives.js`, `drawPath.js`, `useViewport.js`, and `hitTest.js`.

**What Konva gives you:**
- **Built-in hit testing** — Eliminates `hitTest.js` (114 lines). Konva nodes respond to mouse events directly
- **Layer management** — Replace the 7-pass manual render order with Konva `Layer` groups. No more reasoning about draw order
- **Drag-and-drop** — Built-in drag support replaces `useViewport`'s manual drag tracking (~80 lines)
- **Zoom/pan** — `stage.scale()` and `stage.position()` replace the custom viewport transform
- **Shape events** — Each hex, road, and feature node gets `onClick`, `onMouseEnter`, `onMouseLeave` for free. Eliminates the monolithic `handleMouseDown`/`handleMouseMove` in App.jsx (~130 lines)
- **Batched rendering** — Konva only redraws changed nodes, not the entire canvas on every state change
- **Export to PNG** — Built-in `stage.toDataURL()` replaces the manual export canvas logic (~20 lines)

**Estimated code reduction:** ~400–500 lines removed, ~150–200 lines of Konva JSX added. Net savings of ~250–300 lines plus significantly simpler architecture.

**Tradeoff:** Adds a ~60KB dependency. For a desktop-style tool, this is negligible.

---

### Add Zustand for state management — Recommended

**Current state:** `useMapData.js` is a 268-line hook that returns 16 functions + the map document. All state flows through prop drilling from App.jsx to every child component. Adding features (layers, selection sets, clipboard) will make this hook unmanageable.

**What Zustand gives you:**
- **Simplify useMapData** — Replace the 268-line hook with a ~50-line Zustand store. Same API, less boilerplate
- **Eliminate prop drilling** — Components read state directly from the store instead of receiving 12–15 props. TileLibrary, FeatureLibrary, and PathLibrary each lose ~8–10 props
- **Devtools integration** — `zustand/middleware` provides Redux DevTools for free. Inspect map state, replay actions, debug rendering issues
- **Undo/redo** — `zustand/middleware` with a history enhancer. Critical for a map editor; currently missing entirely
- **Selective re-renders** — Zustand selectors ensure components only re-render when their specific slice changes. The current spread-in-`useTools` pattern (P0 bug #1) becomes unnecessary
- **Async actions** — File save/load, autosave to localStorage, and future cloud sync all fit naturally as async store actions

**Estimated code reduction:** ~200–300 lines. The 6 hook files consolidate into 1–2 stores.

---

### Add undo/redo now (via Zustand or Immer) — Recommended

**Current state:** No undo system. Every action (tile placement, feature removal, road drawing, resize) is permanent.

**Why do it now (during a refactor):**
- Retrofitting undo onto a growing codebase is 3–5x harder than building it in from the start
- Zustand + `immer` middleware makes this almost trivial: wrap state mutations in `produce()`, and each mutation becomes a reversible history entry
- The map document structure (immutable snapshots of `MapDoc`) is a natural fit for structural sharing

**Estimated effort:** ~40–60 lines with Zustand + Immer. ~150–200 lines with a custom implementation.

---

### Consider replacing localStorage autosave with IndexedDB (Dexie.js) — Low priority

**Current state:** Autosave serializes the entire map document to `localStorage` every 1 second. localStorage has a 5MB limit and blocks the main thread during serialization.

**When it matters:** If maps grow large (thousands of hexes with many features/paths), the serialized JSON may exceed 5MB. IndexedDB has no practical size limit and writes asynchronously.

**Dexie.js** provides a clean Promise-based API over IndexedDB. Add it only if map size becomes a real limitation — not urgent.

---

### Do NOT change (current stack is solid)

| Technology | Reason to keep |
|------------|----------------|
| **React 19** | Current, stable, no reason to change |
| **Vite 7** | Fast, excellent React/TS support, zero-config |
| **Tailwind CSS 3** | Good fit for tool UI, already deeply integrated |
| **Lucide React** | Lightweight, tree-shakeable, sufficient icon set |

---

### Do NOT add

| Technology | Why not |
|------------|---------|
| **Next.js / Remix** | This is a client-side tool, not a server-rendered app. No routing or SSR needed |
| **Redux / Jotai** | Overkill for this state complexity. Zustand is the sweet spot |
| **WebGL (Three.js)** | Only needed for 60fps animation on very large maps. Canvas 2D is fine for a map editor |
| **Monorepo tooling** | Single-package app. No need for Turborepo/Nx/Lerna |