"""Erzeugt die Sticker fürs Sticker-Album aus den Ausmalbildern (public/assets/motifs).

Jedes Motiv wird eingefärbt (Linien Nachtblau, Flächen in einer Motivfarbe, kleine
Flächen wie Augen dunkel) und bekommt einen weißen Sticker-Rand.
Ergebnis: public/assets/stickers/<id>.png (256 × 256, transparent).

Braucht numpy, scipy und pillow:
  python3 -m venv .venv && .venv/bin/pip install numpy scipy pillow
  .venv/bin/python scripts/make-stickers.py
"""
import json
import re
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "assets" / "motifs"
OUT = ROOT / "public" / "assets" / "stickers"
OUT.mkdir(parents=True, exist_ok=True)

NAVY = (27, 42, 74)
# Motivfarben: kindlich, aber passend zu den CI-Farben
COLOR = {
    "Ball": "#E53935", "Sonne": "#FDD835", "Haus": "#F6C98B", "Auto": "#1E63C8", "Blume": "#F48FB1",
    "Pferd": "#A1683A", "Kuh": "#FFFFFF", "Schwein": "#F8A5B8", "Ente": "#FDD835", "Hase": "#D7B899",
    "Schmetterling": "#8E44AD", "Schildkröte": "#43A047", "Papagei": "#43A047", "Apfelbaum": "#43A047",
    "Apfel": "#E53935", "Biene": "#FDD835", "Elefant": "#9AA5B8", "Fisch": "#4FC3F7", "Hund": "#C58B52",
    "Igel": "#8D5A3B", "Katze": "#FB8C00", "Maus": "#B0B7C3", "Tiger": "#FB8C00", "Zebra": "#FFFFFF",
    "Raupe": "#7CB342", "Delfin": "#4FC3F7", "Bus": "#FDD835", "Giraffe": "#F6C98B", "Löwe": "#F2B705",
    "Dino": "#F6C98B", "Chamäleon": "#7CB342", "Jacke": "#E53935", "Vogel": "#4FC3F7", "Xylofon": "#C58B52",
    "Yak": "#A1683A", "Qualle": "#F48FB1",
}


def hexrgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def load_motifs():
    text = (ROOT / "src" / "data" / "motifs.js").read_text(encoding="utf-8")
    return json.loads(re.search(r"=\s*(\[.*\]);", text, re.S).group(1))


def sticker(path, color):
    g = np.asarray(Image.open(path).convert("L"))
    line = g < 128
    free = ~line
    lab, n = ndi.label(free)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    inside = free & ~np.isin(lab, list(border))
    shape = inside | line
    shape = ndi.binary_fill_holes(shape)
    reg, m = ndi.label(inside)
    sizes = ndi.sum(inside, reg, range(1, m + 1))
    total = shape.sum()

    rgba = np.zeros(g.shape + (4,), np.uint8)
    base = hexrgb(color)
    for i, s in enumerate(sizes, 1):
        rgba[reg == i] = (NAVY if s < total * 0.004 else base) + (255,)
    rgba[line & shape] = NAVY + (255,)
    # weißer Sticker-Rand
    rim = ndi.binary_dilation(shape, iterations=18) & ~shape
    rgba[rim] = (255, 255, 255, 255)

    ys, xs = np.nonzero(rgba[..., 3])
    cy, cx = (ys.min() + ys.max()) // 2, (xs.min() + xs.max()) // 2
    h = max(ys.max() - ys.min(), xs.max() - xs.min()) // 2 + 6
    pad = np.zeros((g.shape[0] + 2 * h, g.shape[1] + 2 * h, 4), np.uint8)
    pad[h:h + g.shape[0], h:h + g.shape[1]] = rgba
    crop = pad[cy:cy + 2 * h, cx:cx + 2 * h]
    return Image.fromarray(crop, "RGBA").resize((256, 256), Image.LANCZOS)


for m in load_motifs():
    img = sticker(SRC / f"{m['id']}.png", COLOR.get(m["w"], "#F6C98B"))
    img.save(OUT / f"{m['id']}.png", optimize=True)
    print("✓", m["id"])
