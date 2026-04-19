#!/usr/bin/env python3
"""
install_updates.py

Usage:
    python install_updates.py file1.jsx /some/path/file2.js ~/Downloads/file3.jsx ...

Copies known files into the correct repo locations based on filename,
then deletes each source file once the copy has been verified.
"""

import sys
import os
import shutil
from pathlib import Path

# ── Known files: bare filename → destination directory ──────────────────────
DEST = {
    # Root source files
    "App.jsx":                  "src",
    "main.jsx":                 "src",
    "index.css":                "src",
    "App.css":                  "src",

    # Components
    "ErrorBoundary.jsx":        "src/components",
    "FeatureLibrary.jsx":       "src/components",
    "PathLibrary.jsx":          "src/components",
    "SwatchColorPicker.jsx":    "src/components",
    "TileLibrary.jsx":          "src/components",
    "TilePreview.jsx":          "src/components",
    "Toolbar.jsx":              "src/components",
    "UI.jsx":                   "src/components",

    # Data
    "features.js":              "src/data",
    "mapSchema.js":             "src/data",
    "swatches.js":              "src/data",
    "terrain.js":               "src/data",

    # Hooks
    "useFeatureTools.js":       "src/hooks",
    "useMapData.js":            "src/hooks",
    "usePathTools.js":          "src/hooks",
    "useTileTools.js":          "src/hooks",
    "useTools.js":              "src/hooks",
    "useViewport.js":           "src/hooks",

    # Rendering
    "drawPath.js":              "src/rendering",
    "drawPrimitives.js":        "src/rendering",
    "renderer.js":              "src/rendering",
    "renderState.js":           "src/rendering",

    # Utils
    "hex.js":                   "src/utils",
    "hitTest.js":               "src/utils",
    "styleUtils.js":            "src/utils",
}

# ── Resolve script directory (repo root) ────────────────────────────────────

SCRIPT_DIR = Path(__file__).resolve().parent

# ── Process arguments ────────────────────────────────────────────────────────

if len(sys.argv) < 2:
    print(f"Usage: {Path(sys.argv[0]).name} <file> [file ...]")
    sys.exit(1)

ok = 0
skipped = 0
cleaned = 0

for src in sys.argv[1:]:
    src_path = Path(src).expanduser().resolve()
    bare = src_path.name

    if bare not in DEST:
        print(f"  UNKNOWN:  {bare} — not in the known-files list, skipping")
        skipped += 1
        continue

    if not src_path.is_file():
        print(f"  MISSING:  {src} — file not found, skipping")
        skipped += 1
        continue

    dest_dir  = SCRIPT_DIR / DEST[bare]
    dest_path = dest_dir / bare

    dest_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src_path, dest_path)

    # ── Verify the copy before touching the source ───────────────────────────
    src_size  = src_path.stat().st_size
    dest_size = dest_path.stat().st_size if dest_path.exists() else -1

    if not dest_path.exists() or src_size != dest_size:
        print(f"  FAILED:   {bare} → {DEST[bare]}/ (size mismatch, source kept)")
        skipped += 1
        continue

    print(f"  OK:       {bare} → {DEST[bare]}/", end="")

    # ── Delete the source now that the destination is confirmed ──────────────
    try:
        src_path.unlink()
        print(" (source deleted)")
        cleaned += 1
    except OSError as e:
        print(f" (could not delete source: {e})")

    ok += 1

print("")
print(f"{ok} file(s) installed, {cleaned} source(s) deleted, {skipped} skipped.")
if ok > 0:
    print("Run 'npm run dev' to start the dev server.")
