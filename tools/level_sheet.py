"""Draw a chapter's real levels (from src/game/levels.ts) as one picture, for the design doc.

Usage: python tools/level_sheet.py <chapter number> <out.png>
Uses the drawing from tools/level_sketch.py. Needs Node (reads the levels) and Pillow.
"""
import json
import math
import subprocess
import sys

import level_sketch as ls

JS = """
import { CHAPTERS } from './src/game/levels.ts';
const c = CHAPTERS.find((c) => c.n === Number(process.argv[1]));
console.log(JSON.stringify(c));
"""


def rune(d, cx, cy, kind, r, color):
    if kind == "circle":
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color, width=2)
    elif kind == "square":
        d.rectangle([cx - r, cy - r, cx + r, cy + r], outline=color, width=2)
    elif kind == "star":
        pts = []
        for i in range(10):
            a = -math.pi / 2 + i * math.pi / 5
            rr = r * 1.2 if i % 2 == 0 else r * 0.5
            pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
        d.polygon(pts, outline=color, width=1)
    else:
        d.polygon([(cx, cy - r), (cx + r, cy + r * 0.8), (cx - r, cy + r * 0.8)], outline=color, width=2)


ls.rune = rune  # the sketch tool only knows circle and triangle


class Lv:
    def __init__(self, d, n):
        self.g = [list(r) for r in d["rows"]]
        self.objects = d.get("mechs", [])
        self.seen = d.get("seen", [])
        self.name = f"{d['id']}  {d['name']}"
        self.teaches = d.get("idea", "")
        self.team_code = bool(d.get("teamCode"))


def main(n, out):
    raw = subprocess.run(["node", "--input-type=module", "-e", JS, n], capture_output=True, text=True, check=True).stdout
    ch = json.loads(raw)
    lvs = [Lv(d, n) for d in ch["levels"]]
    ls.levels = lambda: lvs
    ls.main(out)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
