#!/usr/bin/env python3
"""
install_updates.py

Usage:
    python install_updates.py file1.jsx /some/path/file2.js ~/Downloads/file3.jsx ...

Copies known files into the correct repo locations based on filename.
"""

import sys
import os
import shutil
from pathlib import Path

# ── Known files: bare filename → destination directory ──

DEST = {
    "App.jsx": "src",
    "main.jsx": "src",
    "index.css": "src",
    "App.css": "src",

    "Toolbar.jsx": "src/components",
    "TileLibrary.jsx": "src/components",
    "TilePreview.jsx": "src/components",
    "PathLibrary.jsx": "src/components",
    "FeatureLibrary.jsx": "src/components",
    "UI.jsx": "src/components",

    "useViewport.js": "src/hooks",
    "useTools.js": "src/hooks",
    "useMapData.js": "src/hooks",

    "terrain.js": "src/data",
    "features.js": "src/data",
    "mapSchema.js": "src/data",

    "renderer.js": "src/rendering",
    "drawPrimitives.js": "src/rendering",
    "drawPath.js": "src/rendering",

    "hex.js": "src/utils",
    "hitTest.js": "src/utils",
}

# ── Resolve script directory (repo root) ──

SCRIPT_DIR = Path(__file__).resolve().parent

# ── Process arguments ──

if len(sys.argv) < 2:
    print(f"Usage: {Path(sys.argv[0]).name} <file> [file ...]")
    sys.exit(1)

ok = 0
skipped = 0

for src in sys.argv[1:]:
    src_path = Path(src).expanduser()
    bare = src_path.name

    if bare not in DEST:
        print(f"  UNKNOWN:  {bare} — not in the known-files list, skipping")
        skipped += 1
        continue

    if not src_path.is_file():
        print(f"  MISSING:  {src} — file not found, skipping")
        skipped += 1
        continue

    dest_dir = SCRIPT_DIR / DEST[bare]
    dest_path = dest_dir / bare

    dest_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src_path, dest_path)

    print(f"  OK:       {bare} → {DEST[bare]}/")
    ok += 1

print("")
print(f"{ok} file(s) installed, {skipped} skipped.")
if ok > 0:
    print("Run 'npm run dev' to start the dev server.")

