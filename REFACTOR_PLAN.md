# Refactor Plan: TypeScript + Konva + Zustand + honeycomb-grid

Single source of truth for the migration. Update after every session; every task
on this list is committed independently so the branch is always bisectable.

**Branch:** `refactor/hexeditor-ts-konva` (all work here — `main` untouched until the final step)

**Goal:** same app, stable foundation, fewer lines, battle-tested libraries, cheaper/faster for AI to extend.

**Target stack:** React 19 + Vite 7 (keep) · **react-konva 19** · **Zustand + Immer + zundo** · **honeycomb-grid v4** · **TypeScript** · **Vitest**

---

## Progress

| Milestone | Status | Session | Verdict |
|-----------|--------|---------|---------|
| 0 — Scaffold & pure-data migration (TS + tests) | ⬜ pending | — | — |
| 1 — Zustand stores + undo/redo, rewire App | ⬜ pending | — | — |
| 2 — Konva rendering scene + delete manual renderer | ⬜ pending | — | — |
| 3 — Components → `.tsx`, remove prop drilling | ⬜ pending | — | — |
| 4 — Full QA, docs cleanup, replace `main` | ⬜ pending | — | — |

## Current Session

_Nothing in progress yet — ready for Milestone 0._

---

## Milestone 0 — Scaffold (TS, Vitest, deps, pure-data migration)

Target: typecheck + lint + tests green, dev server renders exactly as before, math moved to honeycomb-grid behind an adapter.

- [ ] Install deps: `konva`, `react-konva`, `zustand`, `zundo`, `immer`, `honeycomb-grid`, `typescript`, `vitest`, `@napi-rs/canvas`
- [ ] `tsconfig.json` (strict) + `vite.config.ts` + `vitest.config.ts`
- [ ] ESLint flat config → TS support (keep react-hooks/react-refresh)
- [ ] `package.json` scripts: `typecheck`, `test`
- [ ] Add `src/types/` for `MapDoc`, `Bounds`, `Tile`, `Feature`, `Road`, `River`, `PathStyle`, `HexCoord`, tool state
- [ ] Convert pure files to TS: `constants.ts`, `swatches.ts`, `styleUtils.ts`, `mapSchema.ts`, `terrain.ts`, `features.ts`
- [ ] `src/utils/grid.ts` — honeycomb-grid adapter replacing `hex.js` (keeps `hexKey`, `parseHexKey`, `isInBounds`, `hexToPixel`, `pixelToHex`, `neighbors`, adds `distance`, `ring`, `spiral`, `line`)
- [ ] Delete `hex.js`
- [ ] Vitest tests: `grid.ts`, `mapSchema.ts` round-trip + migration, `styleUtils.ts`
- [ ] `npx tsx` smoke: adapter math matches old `hex.js` outputs on known values

**Definition of Done:** `npm run typecheck` ✗, `npm run lint` makes no changes, `npm run test` green, `npm run dev` renders pixel-identical map incl. autosave load.

**Verification log:** _pending_

---

## Milestone 1 — Zustand stores + undo/redo (renderer untouched)

Target: App behaves identically, but all state lives in stores with selective re-renders; no hooks; undo/redo works.

- [ ] `src/stores/mapStore.ts` — replaces `useMapData.js` (CRUD, serialize/deserialize, autosave, resize returning `{success, reason}` — no `alert()`)
- [ ] `src/stores/toolStore.ts` — replaces `useTileTools` + `useFeatureTools` + `usePathTools` + `useTools` (fixes stale-closure bug)
- [ ] `src/stores/viewportStore.ts` — replaces `useViewport.js`
- [ ] undo/redo via `zundo` temporal middleware (limit ~50, cleared on New Map)
- [ ] Rewire `App.jsx` to consume stores; delete the 6 hook files
- [ ] Keyboard shortcuts read/write stores (remove `eslint-disable`)
- [ ] Tests: store transitions + undo/redo history

**Definition of Done:** typecheck + lint + tests green; all existing interactions identical; Ctrl+Z / Ctrl+Shift+Z undo the last action. Old canvas renderer still used (parity baseline lives here).

**Parity checkpoint 1:** renderer.js sample-map output recorded to fixture.

**Verification log:** _pending_

---

## Milestone 2 — Konva rendering scene

Target: declarative scene replaces the 7-pass renderer, hit-testing, viewport math and manual highlights.

- [ ] `src/rendering/MapCanvas.tsx` — `Stage` + `Layer`s (tiles → paths → features → ui), pan/zoom via Stage, visible-range culling maintained
- [ ] `HexTile.tsx` — Konva Shape using existing terrain draw functions (`sceneFunc`)
- [ ] `PathLine.tsx` + `PathPreview.tsx` — Konva Shapes around `drawPath.ts` (kept as pure math)
- [ ] `FeatureIcon.tsx` — Konva Shape around feature draw functions
- [ ] Hover/selection highlights as a UI layer (no hand-drawn pass)
- [ ] PNG export via `stage.toDataURL()`
- [ ] Delete `renderer.js`, `renderState.js`, `hitTest.js`, `useViewport.js` remnants
- [ ] **Pixel parity tests** (old renderer vs new sceneFuncs via `@napi-rs/canvas`, small tolerance) — proves visual output identical before old code is gone

**Definition of Done:** parity tests green across sample maps (tiles, features, roads, rivers/meander, water-overlay order, grid, coords); interactions (hover/paint/select/hit) verified manually.

**Verification log:** _pending_

---

## Milestone 3 — Components → `.tsx` + slimming

- [ ] Convert all components (`Toolbar`, `TileLibrary`, `FeatureLibrary`, `PathLibrary`, `UI`, `SwatchColorPicker`, `CollapsiblePanel`, `TilePreview`, `ErrorBoundary`) to typed `.tsx`, read from stores, drop prop drilling
- [ ] `TilePreview` renders via a small inline Konva stage (kill temp-canvas-per-preview)
- [ ] `ExpandDialog` surfaces `resizeMap` result inline (no `alert()`)
- [ ] Remove vestigial `App.css` + import
- [ ] Single `PANEL_WIDTH`/etc. from `constants.ts`

**Definition of Done:** typecheck + lint + tests green; full Manual QA pass logged.

**Verification log:** _pending_

---

## Milestone 4 — Hardening + replace `main`

- [ ] Full Manual QA pass (below) — all pass
- [ ] Update `AGENTS.md` (new commands, architecture map), retire/refresh `RECOMMENDATIONS.md` + `PRD.md`
- [ ] (Optional) Playwright browser smoke test — drag-paint, path draw/commit, undo
- [ ] PR `refactor/hexeditor-ts-konva` → `main`, review, merge (or force-move `main` only if requested)
- [ ] Update this Progress table

**Verification log:** _pending_

---

## Manual QA Script (run at end of every milestone from Milestone 1 on)

| # | Action | Expected | Pass |
|---|--------|----------|------|
| 1 | Tile tool → draw paints hex; drag paints along path | tile placed under cursor, drag fills | ⬜ |
| 2 | Tile tool → erase removes tile (incl. drag) | hex cleared | ⬜ |
| 3 | Tile tool → select shows tile info; delete works | panel shows tile, delete clears | ⬜ |
| 4 | Custom tile color applies to placed/when selected | color updates | ⬜ |
| 5 | Feature tool → draw places icon; right-click removes | icon appears/removes | ⬜ |
| 6 | Feature tool → select + color/size/rotation edits | live update of selected feature | ⬜ |
| 7 | Road tool → click waypoints, double-click/Enter commits | smooth-style road commits | ⬜ |
| 8 | River tool → click waypoints, commit | meander river commits | ⬜ |
| 9 | Escape cancels active path | active path discarded | ⬜ |
| 10 | Path select → hover/select highlights; delete key removes | path removes | ⬜ |
| 11 | Path erase mode → click removes closest path | path removed | ⬜ |
| 12 | Pan (hand) + drag; wheel pan; Ctrl+wheel zoom; reset view | viewport behaves | ⬜ |
| 13 | Grid toggle; Coordinates toggle | toggles render | ⬜ |
| 14 | Save Map (download JSON); Open Map reloads it | round-trip works | ⬜ |
| 15 | Autosave → refresh restores last map | restored | ⬜ |
| 16 | Export PNG downloads image matching screen | PNG correct | ⬜ |
| 17 | Resize: expand all edges; contract that would lose data is blocked with inline error | resize works, no `alert()` | ⬜ |
| 18 | Ctrl+Z undoes last action; Ctrl+Shift+Z redoes | history works | ⬜ |
| 19 | Shortcuts H/T/F/R/W switch tools; Delete removes selected | shortcuts work | ⬜ |

---

## Verification gates (all green before any milestone is marked done)

1. `npm run typecheck`
2. `npm run lint`
3. `npm run test` (unit + parity)
4. Manual QA script above (Milestone 1+)