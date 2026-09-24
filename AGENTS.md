# AGENTS.md

## Commands
- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Tech Stack
- React 19 + Vite 7
- Tailwind CSS 3
- ESLint 9 (flat config, no TypeScript)

## Project Structure
- Entry point: `src/main.jsx` → `src/App.jsx`
- Components in `src/components/` (TileLibrary, FeatureLibrary, PathLibrary, Toolbar, UI, ErrorBoundary, SwatchColorPicker, TilePreview)
- Rendering in `src/rendering/` (renderer.js, drawPrimitives.js, drawPath.js, renderState.js)
- Hooks in `src/hooks/` (useMapData.js, useTileTools.js, useFeatureTools.js, usePathTools.js, useViewport.js, useTools.js)
- Data in `src/data/` (mapSchema.js, terrain.js, features.js, swatches.js)
- Utilities in `src/utils/` (hex.js, hitTest.js, styleUtils.js)

## Session Continuity
- `RECOMMENDATIONS.md` at project root contains prioritized codebase improvements with file paths and line numbers. Read this first to avoid redundant analysis across sessions.

## Notes
- No test framework configured
- No pre-commit hooks
- No TypeScript - uses .jsx files
- Lucide React for icons
- `App.css` is likely vestigial (project uses Tailwind only)