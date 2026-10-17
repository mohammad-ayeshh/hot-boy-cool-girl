"""Render design sketches of levels on the real 32x18 grid.

Usage: python tools/level_sketch.py <out.png>

Levels are built with small fill operations so the shapes follow the level
metrics (docs/GAME_DESIGN.md section 7.7): ledges 1-3 tiles, gaps 1-4 tiles.
"""
import sys
from PIL import Image, ImageDraw, ImageFont

W, H, T = 32, 18, 16  # grid size and pixels per tile

# Palette from docs/GAME_DESIGN.md section 4.3
ABYSS, WALL, STONE, EDGE = "#0A1211", "#16211F", "#2E3D39", "#55695F"
HOT, HOT_B, HOT_D = "#FF6A1A", "#FFB02E", "#B8320C"
COOL, COOL_B, COOL_D = "#1FA3FF", "#7ADFFF", "#0B57C9"
VIO, VIO_B, VIO_D = "#A23BE8", "#D17BFF", "#4E1677"
BRASS, GOLD, IVORY = "#E3B04B", "#D9A441", "#F1E6C8"


class Level:
    def __init__(self, name, teaches):
        self.name, self.teaches = name, teaches
        self.g = [["." for _ in range(W)] for _ in range(H)]
        self.objects = []
        self.fill(0, 0, W - 1, 0)      # ceiling
        self.fill(0, 0, 0, H - 1)      # left wall
        self.fill(W - 1, 0, W - 1, H - 1)
        self.fill(0, 16, W - 1, 17)    # ground: walk surface is row 16

    def fill(self, x1, y1, x2, y2, ch="#"):
        for y in range(y1, y2 + 1):
            for x in range(x1, x2 + 1):
                self.g[y][x] = ch
        return self

    def put(self, x, y, ch):
        self.g[y][x] = ch
        return self

    def obj(self, **o):
        self.objects.append(o)
        return self


def levels():
    out = []

    # 1. First Steps: two separate lanes, each player walks through their own liquid.
    l = Level("1  First Steps", "move, jump 1-2-3 tiles, your own liquid is safe, both doors needed")
    l.fill(1, 9, 20, 10)                      # Hot Boy's upper lane (surface row 9)
    l.fill(5, 9, 6, 9, "L").fill(12, 9, 14, 9, "L")
    l.fill(9, 8, 10, 8)                       # 1-tile step
    l.fill(7, 15, 8, 15)                      # Cool Girl's lane: 1-tile step
    l.fill(10, 16, 12, 16, "W").fill(18, 16, 19, 16, "W")
    l.fill(15, 14, 16, 15)                    # 2-tile block
    l.fill(21, 14, 22, 15)                    # stairs up: 2, 3, 2, 2
    l.fill(23, 11, 24, 15)
    l.fill(25, 9, 26, 15)
    l.fill(27, 7, 30, 15)
    l.put(2, 8, "h").put(5, 15, "c").put(27, 6, "H").put(30, 6, "C")
    l.put(5, 7, "r").put(13, 7, "r").put(11, 14, "b").put(18, 14, "b")
    out.append(l)

    # 2. Wrong Pool: one shared path; jump over the other's liquid; first poison.
    l = Level("2  Wrong Pool", "the other's liquid is deadly, violet kills both, 3-tile ledge, 3-wide jumps")
    l.fill(10, 16, 12, 16, "L")               # Cool Girl must jump (3 wide)
    l.fill(15, 13, 22, 15)                    # 3-tile ledge
    l.fill(18, 13, 20, 13, "W")               # Hot Boy must jump (3 wide)
    l.fill(23, 11, 30, 15)                    # 2-tile step
    l.fill(25, 11, 26, 11, "P")               # both jump (2 wide)
    l.put(5, 15, "h").put(7, 15, "c").put(28, 10, "H").put(30, 10, "C")
    l.put(11, 13, "b").put(19, 10, "r").put(25, 8, "r").put(26, 8, "b")
    out.append(l)

    # 3. Hold the Button: each player opens the gate for the other.
    l = Level("3  Hold the Button", "pressure buttons + gate; you hold it, I go, then I hold it for you")
    l.fill(15, 1, 16, 12)                     # dividing wall; the gate fills rows 13-15
    l.fill(4, 13, 6, 15)                      # 3-tile ledge with gems
    l.fill(18, 16, 19, 16, "W").fill(23, 16, 24, 16, "L")
    l.fill(26, 13, 30, 15)                    # 3-tile ledge to the doors
    l.put(8, 15, "h").put(10, 15, "c").put(27, 12, "H").put(29, 12, "C")
    l.put(4, 12, "r").put(6, 12, "b").put(18, 13, "r").put(23, 13, "b")
    l.obj(kind="button", x=12, y=15, rune="circle")
    l.obj(kind="button", x=21, y=15, rune="circle")
    l.obj(kind="gate", x=15, y=13, w=2, h=3, rune="circle")
    out.append(l)

    # 4. Going Up: one holds the elevator button, the other rides; a lever brings the first up.
    l = Level("4  Going Up", "elevator held by a button, a lever that stays; poison on the floor")
    l.fill(14, 7, 30, 15)                     # high shelf (surface row 7)
    l.fill(7, 16, 8, 16, "P")
    l.fill(20, 7, 21, 7, "L").fill(23, 7, 24, 7, "W")
    l.put(4, 15, "h").put(5, 15, "c").put(26, 6, "H").put(28, 6, "C")
    l.put(12, 10, "r").put(9, 10, "b").put(23, 5, "r").put(20, 5, "b")
    l.obj(kind="button", x=6, y=15, rune="triangle")
    l.obj(kind="platform", x=12, y=15, w=2, to=(12, 7), rune="triangle")
    l.obj(kind="lever", x=16, y=6, rune="circle")
    l.obj(kind="platform", x=9, y=15, w=2, to=(9, 7), rune="circle")
    out.append(l)

    # 5. Crossing Together: a ferry over a poison pit, a lever gate; everything so far combined.
    l = Level("5  Crossing Together", "ferry over poison (buttons on both sides), lever opens the gate, timing")
    l.fill(10, 16, 21, 16, "P")               # 12-wide poison pit: needs the ferry
    l.fill(24, 16, 25, 16, "W")
    l.fill(28, 13, 30, 15)                    # 3-tile step
    l.fill(25, 10, 27, 12)                    # door shelf (surface row 10)
    l.fill(25, 1, 30, 5)                      # ceiling over the doors; the gate fills col 28 rows 6-12
    l.put(6, 15, "h").put(8, 15, "c").put(25, 9, "H").put(27, 9, "C")
    l.put(15, 11, "r").put(17, 11, "b").put(24, 13, "b").put(29, 11, "r")
    l.obj(kind="button", x=4, y=15, rune="circle")
    l.obj(kind="button", x=27, y=15, rune="circle")
    l.obj(kind="platform", x=10, y=14, w=3, to=(19, 14), rune="circle")
    l.obj(kind="lever", x=22, y=15, rune="triangle")
    l.obj(kind="gate", x=28, y=6, w=1, h=7, rune="triangle")
    out.append(l)
    return out


def font(size, bold=False):
    for name in (["segoeuib.ttf", "arialbd.ttf"] if bold else ["segoeui.ttf", "arial.ttf"]):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    return ImageFont.load_default()


def rune(d, cx, cy, kind, r, color):
    if kind == "circle":
        d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color, width=2)
    else:
        d.polygon([(cx, cy - r), (cx + r, cy + r * 0.8), (cx - r, cy + r * 0.8)], outline=color, width=2)


def draw_level(lv):
    im = Image.new("RGB", (W * T, H * T), ABYSS)
    d = ImageDraw.Draw(im)
    for y in range(H):  # back wall bricks
        off = (T // 2) if y % 2 else 0
        for x in range(-1, W + 1):
            d.rounded_rectangle([x * T + off + 1, y * T + 1, x * T + off + T - 1, y * T + T - 1], 2, fill=WALL)
    liquids = {"L": (HOT, HOT_B), "W": (COOL, COOL_B), "P": (VIO_D, VIO)}
    for y in range(H):
        for x in range(W):
            ch, px, py = lv.g[y][x], x * T, y * T
            if ch == "#":
                d.rectangle([px, py, px + T - 1, py + T - 1], fill=STONE)
                if y > 0 and lv.g[y - 1][x] not in "#LWP":
                    d.rectangle([px, py, px + T - 1, py + 2], fill=EDGE)
            elif ch in liquids:
                body, top = liquids[ch]
                d.rectangle([px, py + 3, px + T - 1, py + T - 1], fill=body)
                d.rectangle([px, py + 3, px + T - 1, py + 5], fill=top)
    # thumb zones (section 5.3)
    for zx in (0, W - 4):
        d.rectangle([zx * T, 14 * T, zx * T + 4 * T - 1, H * T - 1], outline="#8a9a92", width=1)
    for o in lv.objects:
        x, y = o["x"] * T, o["y"] * T
        if o["kind"] == "button":
            d.rounded_rectangle([x + 2, y + T - 4, x + T - 2, y + T - 1], 2, fill=BRASS)
            rune(d, x + T / 2, y + T / 2 - 4, o["rune"], 4, GOLD)
        elif o["kind"] == "lever":
            d.rectangle([x + 4, y + T - 4, x + T - 4, y + T - 1], fill=STONE, outline=BRASS)
            d.line([x + T / 2, y + T - 4, x + T - 3, y + 2], fill=BRASS, width=3)
            rune(d, x + T / 2, y - 6, o["rune"], 4, GOLD)
        elif o["kind"] == "gate":
            d.rectangle([x, y, x + o["w"] * T - 1, y + o["h"] * T - 1], fill="#3b3523", outline=BRASS, width=2)
            rune(d, x + o["w"] * T / 2, y + o["h"] * T / 2, o["rune"], 5, GOLD)
        elif o["kind"] == "platform":
            tx, ty = o["to"][0] * T, o["to"][1] * T
            w = o["w"] * T
            d.rectangle([tx, ty + T - 6, tx + w - 1, ty + T - 1], outline=BRASS, width=1)  # end position (ghost)
            d.line([x + w / 2, y + T - 3, tx + w / 2, ty + T - 3], fill=GOLD, width=1)
            d.rectangle([x, y + T - 6, x + w - 1, y + T - 1], fill=BRASS)
            rune(d, x + w / 2, y + T - 13, o["rune"], 4, GOLD)
    for y in range(H):
        for x in range(W):
            ch, px, py = lv.g[y][x], x * T, y * T
            if ch in "hc":
                body, light = (HOT, HOT_B) if ch == "h" else (COOL, COOL_B)
                d.rounded_rectangle([px + 2, py - 8, px + T - 2, py + T - 1], 6, fill=body)
                d.ellipse([px + 4, py - 4, px + T - 4, py + 4], fill=light)
            elif ch in "HC":
                col, deep = (HOT, HOT_D) if ch == "H" else (COOL, COOL_D)
                d.rounded_rectangle([px - 3, py - T, px + T + 2, py + T - 1], 5, fill=ABYSS, outline=deep, width=3)
                rune(d, px + T / 2, py - 2, "circle", 3, col)
            elif ch in "rb":
                col = HOT_B if ch == "r" else COOL_B
                cx, cy = px + T / 2, py + T / 2
                d.polygon([(cx, cy - 6), (cx + 5, cy), (cx, cy + 6), (cx - 5, cy)], fill=col)
    return im


def main(out):
    lvs = levels()
    pad, label_h, cols = 20, 46, 2
    tw, th = W * T, H * T
    rows = (len(lvs) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw + (cols + 1) * pad, rows * (th + label_h) + (rows + 1) * pad), "#101816")
    d = ImageDraw.Draw(sheet)
    f1, f2 = font(17, True), font(13)
    for i, lv in enumerate(lvs):
        cx, cy = pad + (i % cols) * (tw + pad), pad + (i // cols) * (th + label_h + pad)
        sheet.paste(draw_level(lv), (cx, cy))
        d.text((cx, cy + th + 6), lv.name, fill="#E8F3EA", font=f1)
        d.text((cx, cy + th + 27), lv.teaches, fill="#9BB5A3", font=f2)
    # legend in the empty slot
    if len(lvs) % cols:
        lx, ly = pad + tw + pad + 10, pad + (rows - 1) * (th + label_h + pad) + 10
        items = [
            ("Hot Boy start / gem / door", HOT), ("Cool Girl start / gem / door", COOL),
            ("Lava (kills Cool Girl)", HOT_B), ("Water (kills Hot Boy)", COOL_B), ("Poison (kills both)", VIO),
            ("Gold = button, lever, gate, platform", BRASS),
            ("Same symbol = linked (circle / triangle)", GOLD),
            ("Thin outline: thumb zones (kept empty)", "#8a9a92"),
            ("Grid: 32 x 18 tiles, 1 tile = character width", "#9BB5A3"),
        ]
        d.text((lx, ly), "Legend", fill="#E8F3EA", font=f1)
        for j, (txt, col) in enumerate(items):
            yy = ly + 32 + j * 26
            d.rounded_rectangle([lx, yy + 3, lx + 14, yy + 17], 3, fill=col)
            d.text((lx + 24, yy), txt, fill="#E8F3EA", font=f2)
    sheet.save(out)
    for lv in lvs:  # ASCII dump for checking metrics by eye
        print(lv.name)
        print("\n".join("".join(r) for r in lv.g))


if __name__ == "__main__":
    main(sys.argv[1])
