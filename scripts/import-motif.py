"""Macht aus einem Malbuch-Motiv (Krea-PNG) ein Ausmalbild für die App.

Linien werden freigestellt (kleine Striche wie Gras fallen weg), auf Kinder-Strichstärke
verdickt und als 800 × 800 Schwarz-Weiß-PNG gespeichert. Gibt die Zahl der Flächen aus
(Feld „n“ in src/data/motifs.js).

  .venv/bin/python scripts/import-motif.py quelle.png public/assets/motifs/l_vogel.png [--dicke 3]
"""
import argparse

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ap = argparse.ArgumentParser()
ap.add_argument("src")
ap.add_argument("out")
ap.add_argument("--dicke", type=int, default=3, help="Verdickung der Linien in Pixeln (Quelle 1024 px)")
ap.add_argument("--rest", type=float, default=0.02, help="Linienstücke kleiner als dieser Anteil fallen weg")
a = ap.parse_args()

g = np.asarray(Image.open(a.src).convert("L"))
line = g < 120
lab, n = ndi.label(line, structure=np.ones((3, 3)))
sizes = ndi.sum(line, lab, range(1, n + 1))
keep = np.zeros(n + 1, bool)
keep[1:] = sizes > sizes.max() * a.rest
main = keep[lab]
filled = ndi.binary_fill_holes(ndi.binary_closing(main, np.ones((5, 5))))
main |= line & filled                      # Augen, Punkte im Inneren behalten
if a.dicke:
    main = ndi.binary_dilation(main, iterations=a.dicke)

ys, xs = np.nonzero(main)
cy, cx = (ys.min() + ys.max()) // 2, (xs.min() + xs.max()) // 2
h = max(ys.max() - ys.min(), xs.max() - xs.min()) // 2 + 40
canvas = np.full((g.shape[0] + 2 * h, g.shape[1] + 2 * h), 255, np.uint8)
canvas[h:h + g.shape[0], h:h + g.shape[1]] = np.where(main, 0, 255)
crop = canvas[cy:cy + 2 * h, cx:cx + 2 * h]
img = Image.fromarray(crop).resize((800, 800), Image.LANCZOS).point(lambda v: 0 if v < 128 else 255).convert("1")
img.save(a.out)

inside = ndi.binary_fill_holes(main) & ~main
reg, m = ndi.label(inside)
rs = ndi.sum(inside, reg, range(1, m + 1))
print(f"{a.out}: {int((rs > 30).sum())} Flächen")
