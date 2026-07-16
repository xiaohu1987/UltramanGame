from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

out = Path(".codexh/outputs/img-audit")
out.mkdir(parents=True, exist_ok=True)

items = [
    ("hero_gaia", "assets/ultraman_heroes/ULTRAMAN GAIA.jpg"),
    ("hero_ultra", "assets/ultraman_heroes/ULTRAMAN.jpg"),
    ("hero_tiga", "assets/ultraman_heroes/ULTRAMAN TIGA.png"),
    ("kaiju_bemstar", "assets/ultraman_kaiju/BEMSTAR.png"),
    ("kaiju_twin", "assets/ultraman_kaiju/TWINTAIL.png"),
    ("kaiju_zetton", "assets/ultraman_kaiju/ZETTON (1).jpg"),
]

# Make a contact sheet of raw assets
thumbs = []
for name, path in items:
    im = Image.open(path).convert("RGB")
    im.save(out / f"raw_{name}.jpg", quality=92)
    t = im.copy()
    t.thumbnail((220, 320))
    canvas = Image.new("RGB", (220, 320), (8, 12, 20))
    canvas.paste(t, ((220 - t.width) // 2, (320 - t.height) // 2))
    thumbs.append(canvas)

sheet = Image.new("RGB", (220 * len(thumbs), 320), (8, 12, 20))
for i, t in enumerate(thumbs):
    sheet.paste(t, (i * 220, 0))
sheet.save(out / "raw_contact_sheet.jpg", quality=92)

# Simulate landscape card with cover vs contain
frame_w, frame_h = 360, 160
for mode in ("cover", "contain"):
    row = Image.new("RGB", (frame_w * 3 + 40, frame_h + 20), (7, 17, 31))
    for i, (name, path) in enumerate(items[:3]):
        im = Image.open(path).convert("RGB")
        if mode == "cover":
            scale = max(frame_w / im.width, frame_h / im.height)
        else:
            scale = min(frame_w / im.width, frame_h / im.height)
        nw, nh = int(im.width * scale), int(im.height * scale)
        im2 = im.resize((nw, nh), Image.Resampling.LANCZOS)
        card = Image.new("RGB", (frame_w, frame_h), (5, 8, 15))
        # center for contain; center-top-ish for cover like old CSS
        if mode == "cover":
            x = (frame_w - nw) // 2
            y = 0  # top bias
        else:
            x = (frame_w - nw) // 2
            y = (frame_h - nh) // 2
        card.paste(im2, (x, y))
        row.paste(card, (10 + i * (frame_w + 10), 10))
    row.save(out / f"sim_card_{mode}.jpg", quality=92)

print("saved sims")
