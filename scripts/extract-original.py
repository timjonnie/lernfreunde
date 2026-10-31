"""Zerlegt original/lernfreunde-artifact.html in ein Projekt mit einzelnen Dateien.

Einmalig für die Migration genutzt; bleibt zur Nachvollziehbarkeit im Repo.
Aufruf (im Repo-Hauptordner): python3 -I scripts/extract-original.py
"""
import base64
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "original" / "lernfreunde-artifact.html"
lines = SRC.read_text(encoding="utf-8").split("\n")


def block(start, end):
    """Zeilen start..end (1-basiert, inklusive)."""
    return "\n".join(lines[start - 1:end])


def find(pattern, start=1):
    for i in range(start - 1, len(lines)):
        if re.search(pattern, lines[i]):
            return i + 1
    raise SystemExit(f"Muster nicht gefunden: {pattern}")


def slug(text):
    t = text.lower().replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    t = unicodedata.normalize("NFKD", t).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", t).strip("-") or "x"


def save_data_url(data_url, path):
    m = re.match(r"data:([^;]+);base64,(.*)", data_url, re.S)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(base64.b64decode(m.group(2)))


def js_module(name, value, comment):
    body = json.dumps(value, ensure_ascii=False, indent=1)
    return f"/* {comment} – erzeugt von scripts/extract-original.py */\nexport const {name} = {body};\n"


public = ROOT / "public" / "assets"
data_dir = ROOT / "src" / "data"
data_dir.mkdir(parents=True, exist_ok=True)

# Sprachclips
voice_line = find(r"^<script>window\.LF_VOICE=")
voice = json.loads(re.search(r"LF_VOICE=(\{.*\})", lines[voice_line - 1]).group(1))
voice_out = {}
for key, url in voice.items():
    name = f"voice/{slug(key)}.mp3"
    save_data_url(url, public / name)
    voice_out[key] = f"assets/{name}"
(data_dir / "voice.js").write_text(js_module("VOICE", voice_out, "Aufgenommene Sprachclips (ElevenLabs)"), encoding="utf-8")

# Ausmalbilder
motif_line = find(r"window\.LF_MOTIFS=")
motifs = json.loads(re.search(r"LF_MOTIFS=(\[.*\])", lines[motif_line - 1]).group(1))
for m in motifs:
    name = f"motifs/{m['id']}.png"
    save_data_url(m["src"], public / name)
    m["src"] = f"assets/{name}"
(data_dir / "motifs.js").write_text(js_module("MOTIFS", motifs, "Ausmalbilder aus den Malbüchern von Tim Kipper"), encoding="utf-8")

# Bastelbögen
craft_line = find(r"window\.LF_CRAFTS=")
crafts = json.loads(re.search(r"LF_CRAFTS=(\{.*\})", lines[craft_line - 1]).group(1))
for key, url in crafts["pages"].items():
    name = f"crafts/{key}.png"
    save_data_url(url, public / name)
    crafts["pages"][key] = f"assets/{name}"
(data_dir / "crafts.js").write_text(js_module("CRAFTS", crafts, "Bastelideen aus „Einfach malen & basteln“ von Tim Kipper"), encoding="utf-8")

# Styles: Grundstil des Artifact-Rahmens (Zeile 1) + eigentliches Stylesheet
base_css = re.search(r"<style>(.*?)</style>", lines[0]).group(1)
style_start = find(r"^<style>$")
style_end = find(r"^</style>$", style_start)
css = "/* Grundstil */\n" + base_css.replace("}", "}\n") + "\n" + block(style_start + 1, style_end - 1) + "\n"
(ROOT / "src" / "styles.css").write_text(css, encoding="utf-8")

# App-Code: letzter <script>-Block ohne die Tags
code_start = find(r"^<script>$", craft_line)
code_end = find(r"^</script>$", code_start)
code = block(code_start + 1, code_end - 1)
for old, new in [
    ("window.LF_VOICE||{}", "VOICE_CLIPS"),
    ("window.LF_MOTIFS||[]", "MOTIF_LIST"),
    ("window.LF_CRAFTS||{pages:{},list:[]}", "CRAFTS"),
]:
    if old not in code:
        raise SystemExit(f"Nicht gefunden im Code: {old}")
    code = code.replace(old, new)
header = (
    'import "./styles.css";\n'
    'import "@fontsource/andika/400.css";\n'
    'import "@fontsource/andika/700.css";\n'
    'import "@fontsource/atkinson-hyperlegible/400.css";\n'
    'import "@fontsource/atkinson-hyperlegible/700.css";\n'
    'import { VOICE as VOICE_CLIPS } from "./data/voice.js";\n'
    'import { MOTIFS as MOTIF_LIST } from "./data/motifs.js";\n'
    'import { CRAFTS } from "./data/crafts.js";\n\n'
)
(ROOT / "src" / "main.js").write_text(header + code + "\n", encoding="utf-8")

print(f"{len(voice_out)} Sprachclips, {len(motifs)} Ausmalbilder, {len(crafts['pages'])} Bastelbögen, "
      f"{code.count(chr(10)) + 1} Zeilen Code, {css.count(chr(10))} Zeilen CSS")
