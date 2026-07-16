from PIL import Image
import os

paths = [
    "assets/ultraman_heroes/ULTRAMAN GAIA.jpg",
    "assets/ultraman_heroes/ULTRAMAN.jpg",
    "assets/ultraman_heroes/ULTRAMAN TIGA.png",
    "assets/ultraman_kaiju/BEMSTAR.png",
    "assets/ultraman_kaiju/TWINTAIL.png",
    "assets/ultraman_kaiju/ZETTON (1).jpg",
]

for p in paths:
    im = Image.open(p).convert("RGB")
    w, h = im.size
    px = im.load()
    step = max(1, w // 80)
    rows = []
    for y in range(h):
        dark = 0
        total = 0
        for x in range(0, w, step):
            r, g, b = px[x, y]
            total += 1
            if r + g + b < 60:
                dark += 1
        rows.append(dark / total if total else 1)

    top = 0
    for y, d in enumerate(rows):
        if d < 0.85:
            top = y
            break
    bot = h - 1
    for y in range(h - 1, -1, -1):
        if rows[y] < 0.85:
            bot = y
            break

    def band(y0, y1):
        s = n = 0
        xstep = max(1, w // 40)
        for y in range(y0, max(y0 + 1, y1)):
            for x in range(0, w, xstep):
                r, g, b = px[x, y]
                s += r + g + b
                n += 1
        return s / n if n else 0

    t = band(0, h // 3)
    m = band(h // 3, 2 * h // 3)
    b = band(2 * h // 3, h)
    print(
        f"{os.path.basename(p):22} {w}x{h} contentY={top}-{bot} "
        f"({(bot - top + 1) / h:.2f}) bandsTMB=({t:.0f},{m:.0f},{b:.0f})"
    )
