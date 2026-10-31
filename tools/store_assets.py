"""Make the Google Play images (MARKETING.md) from raw 1920x1080 game captures.

Usage: python tools/store_assets.py <raw folder> docs/store
Raw captures come from the Feel Lab (?lab=<level id>) rendered straight from the game canvas:
01-fire-and-water, 02a-eyes-his, 02b-eyes-hers, 03-vault, 04-hold-the-button, feature-src.
Writes 1920x1080 captioned screenshots and the 1024x500 feature graphic. Change a caption here and run it again.
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1920, 1080
GOLD, WHITE, FIRE, WATER = (227, 176, 75), (240, 246, 241), (255, 138, 42), (63, 184, 255)
FONTS = "C:/Windows/Fonts/"


def font(size, black=False):
    for name in (["seguibl.ttf", "segoeuib.ttf"] if black else ["segoeuib.ttf", "arialbd.ttf"]):
        try:
            return ImageFont.truetype(FONTS + name, size)
        except OSError:
            pass
    return ImageFont.load_default()


def load(raw, name):
    return Image.open(os.path.join(raw, name + ".png")).convert("RGB").crop((0, 0, W, H))


def band(im, text, sub=None):
    """A dark band across the top with the caption: the first thing a store visitor reads."""
    over = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(over)
    h = 200 if sub else 150
    for y in range(h + 60):  # solid, then fading out
        a = 225 if y < h else int(225 * (1 - (y - h) / 60))
        d.line([(0, y), (W, y)], fill=(5, 10, 9, a))
    im = Image.alpha_composite(im.convert("RGBA"), over)
    d = ImageDraw.Draw(im)
    f = font(76, black=True)
    d.text((W / 2, 78), text, font=f, fill=WHITE, anchor="mm")
    if sub:
        d.text((W / 2, 152), sub, font=font(40), fill=GOLD, anchor="mm")
    return im.convert("RGB")


def screenshot_eyes(raw):
    """Different eyes: the same moment on his phone and on hers."""
    his, hers = load(raw, "02a-eyes-his"), load(raw, "02b-eyes-hers")
    out = Image.new("RGB", (W, H), (5, 10, 9))
    strip = (0, 40, W, 500)  # the top lane, where he jumps
    for i, (im, label, col) in enumerate([(his, "HIS SCREEN", FIRE), (hers, "HER SCREEN", WATER)]):
        part = im.crop(strip).resize((int(W * 0.92), int(460 * 0.92)))
        x, y = (W - part.width) // 2, 215 + i * 430
        out.paste(part, (x, y))
        d = ImageDraw.Draw(out)
        d.rectangle([x, y, x + part.width - 1, y + part.height - 1], outline=col, width=4)
        d.rounded_rectangle([x + 18, y + 18, x + 300, y + 74], 12, fill=(5, 10, 9))
        d.text((x + 159, y + 46), label, font=font(36, black=True), fill=col, anchor="mm")
    return band(out, "He can't see the stones. She can.", "Talk each other through it.")


def card(raw):
    """The friend's pass, said plainly (MARKETING.md: lead with "only one of you pays")."""
    bg = load(raw, "01-fire-and-water").filter(ImageFilter.GaussianBlur(10)).convert("RGBA")
    bg = Image.alpha_composite(bg, Image.new("RGBA", (W, H), (5, 10, 9, 170)))
    d = ImageDraw.Draw(bg)
    d.text((W / 2, 330), "Only one of you pays.", font=font(110, black=True), fill=WHITE, anchor="mm")
    lines = [("Chapters 1 and 2 are free to play together", GOLD),
             ("Unlock the rest once, and your friend plays every chapter with you", WHITE),
             ("No ads. No accounts. No timers.", GOLD)]
    for i, (t, col) in enumerate(lines):
        d.text((W / 2, 520 + i * 95), t, font=font(52), fill=col, anchor="mm")
    return bg.convert("RGB")


def feature(raw):
    """1024x500: title on the dark left, the duo glowing on the right."""
    src = load(raw, "feature-src")
    im = src.crop((0, 70, W, 70 + 937)).resize((1024, 500), Image.LANCZOS).convert("RGBA")
    shade = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(shade)
    for x in range(560):
        d.line([(x, 0), (x, 500)], fill=(5, 10, 9, int(200 * (1 - x / 560) ** 1.3)))
    im = Image.alpha_composite(im, shade)
    d = ImageDraw.Draw(im)
    f = font(66, black=True)
    d.text((48, 150), "Hot Boy", font=f, fill=FIRE)
    d.text((48, 222), "& Cool Girl", font=f, fill=WATER)
    d.text((50, 320), "Two friends. Two phones.", font=font(30), fill=WHITE)
    d.text((50, 360), "One temple.", font=font(30), fill=GOLD)
    return im.convert("RGB")


def main(raw, out):
    os.makedirs(out, exist_ok=True)
    shots = [
        ("1-fire-and-water", band(load(raw, "01-fire-and-water"), "Fire and water. Save each other.", "A co-op puzzle platformer for two phones")),
        ("2-different-eyes", screenshot_eyes(raw)),
        ("3-secret-code", band(load(raw, "03-vault"), "Crack your team's secret code.", "Every pair of friends gets a different one")),
        ("4-hold-the-button", band(load(raw, "04-hold-the-button"), "You hold the button. I'll go.", "35 levels across 7 temple chapters")),
        ("5-only-one-pays", card(raw)),
    ]
    for name, im in shots:
        im.save(os.path.join(out, f"screenshot-{name}.png"))
    feature(raw).save(os.path.join(out, "feature-graphic.png"))
    print("wrote", len(shots), "screenshots and the feature graphic to", out)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
