/* Erzeugt fehlende Sprachclips mit ElevenLabs – Schritt für Schritt.
 *
 * Liest die Liste aller Texte aus der App (src/voice-inventory.js), überspringt
 * vorhandene Aufnahmen und erzeugt so viele neue, wie das Guthaben hergibt.
 * Beim nächsten Lauf geht es dort weiter. Am Ende wird src/data/voice.js neu geschrieben.
 *
 *   ELEVENLABS_API_KEY=… node scripts/generate-voice.mjs            # erzeugen
 *   node scripts/generate-voice.mjs --dry-run                        # nur anzeigen, was fehlt
 *   ELEVENLABS_API_KEY=… node scripts/generate-voice.mjs --limit 50  # höchstens 50 Clips
 *
 * Optionale Umgebungsvariablen: ELEVENLABS_VOICE_ID (Standard: Juna), ELEVENLABS_MODEL_ID.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { voiceInventory } from "../src/voice-inventory.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public", "assets", "voice");
const MANIFEST = join(ROOT, "src", "data", "voice.js");

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "uZCiMraXvGgdBPlDzm6l"; // Juna – Warm & Expressive
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const LIMIT = args.includes("--limit") ? Number(args[args.indexOf("--limit") + 1]) : Infinity;
/* Reihenfolge: was die Kinder am häufigsten hören, zuerst */
const ORDER = ["saetze", "laute", "buchstaben", "woerter", "silben", "zahlen"];

export const slug = s => s.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
  .normalize("NFKD").replace(/[^\x00-\x7f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "x";
const fileOf = k => `voice/${slug(k)}.mp3`;

const items = voiceInventory().sort((a, b) => ORDER.indexOf(a.cat) - ORDER.indexOf(b.cat));
const missing = items.filter(x => !existsSync(join(ROOT, "public", "assets", fileOf(x.k))));
const chars = list => list.reduce((n, x) => n + x.t.length, 0);

function writeManifest() {
  const map = {};
  for (const x of items) if (existsSync(join(ROOT, "public", "assets", fileOf(x.k)))) map[x.k] = `assets/${fileOf(x.k)}`;
  const sorted = Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b, "de")));
  writeFileSync(MANIFEST, `/* Aufgenommene Sprachclips (ElevenLabs, Stimme Juna) – erzeugt von scripts/generate-voice.mjs */\n` +
    `export const VOICE = ${JSON.stringify(sorted, null, 1)};\n`);
  return Object.keys(map).length;
}

async function remainingCredits() {
  const r = await fetch("https://api.elevenlabs.io/v1/user/subscription", { headers: { "xi-api-key": API_KEY } });
  if (!r.ok) return null; // Schlüssel ohne Leserecht auf das Abo – dann einfach loslegen
  const s = await r.json();
  if (s.next_character_count_reset_unix)
    console.log(`Nächste Aufladung des Guthabens: ${new Date(s.next_character_count_reset_unix * 1000).toLocaleDateString("de-DE")}`);
  return s.character_limit - s.character_count;
}

async function speak(text) {
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": API_KEY, "content-type": "application/json", accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: MODEL_ID, language_code: "de",
      voice_settings: { stability: 0.6, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true } }),
  });
  if (!r.ok) {
    const body = await r.text();
    const err = new Error(`HTTP ${r.status}: ${body.slice(0, 300)}`);
    err.stop = [401, 402, 403].includes(r.status) ||
      /authentication|invalid_api_key|api_key|quota|credits|limit|free_users|payment/i.test(body);
    throw err;
  }
  return Buffer.from(await r.arrayBuffer());
}

console.log(`${items.length} Texte in der App, ${items.length - missing.length} schon aufgenommen, ` +
  `${missing.length} fehlen (${chars(missing)} Zeichen).`);
for (const cat of ORDER) {
  const m = missing.filter(x => x.cat === cat);
  if (m.length) console.log(`  ${cat}: ${m.length} fehlen (${chars(m)} Zeichen)`);
}

if (DRY || !missing.length) {
  writeManifest();
  process.exit(0);
}
if (!API_KEY) {
  console.error("ELEVENLABS_API_KEY fehlt. Siehe README → „Stimme“.");
  process.exit(1);
}

let budget = await remainingCredits().catch(() => null);
if (budget != null) console.log(`Guthaben bei ElevenLabs: ${budget} Zeichen.`);
mkdirSync(OUT_DIR, { recursive: true });
let made = 0, failed = 0, stopReason = "";
for (const x of missing) {
  if (made >= LIMIT) { stopReason = `Limit von ${LIMIT} Clips erreicht`; break; }
  if (budget != null && x.t.length > budget) { stopReason = "Guthaben aufgebraucht"; break; }
  try {
    writeFileSync(join(ROOT, "public", "assets", fileOf(x.k)), await speak(x.t));
    made++;
    if (budget != null) budget -= x.t.length;
    console.log(`  ✓ ${x.t}`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${x.t} – ${e.message}`);
    if (e.stop) { stopReason = "ElevenLabs hat abgelehnt (Guthaben, Tarif oder Schlüssel)"; break; }
    if (e.name === "TypeError") { stopReason = "ElevenLabs nicht erreichbar (Netzwerk)"; break; }
  }
}
const total = writeManifest();
console.log(`\n${made} neue Clips erzeugt. Insgesamt ${total} von ${items.length} aufgenommen.` +
  (stopReason ? ` Gestoppt: ${stopReason}. Beim nächsten Lauf geht es weiter.` : ""));
/* Nichts geschafft, aber Fehler → Lauf als fehlgeschlagen melden, damit es auffällt */
if (!made && failed) process.exit(1);
