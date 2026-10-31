/* Liste aller Texte, die die App spricht (Schlüssel = normalisierter Text).
   Grundlage für scripts/generate-voice.mjs; ohne Browser nutzbar. */
import { WORDS, LETTERS, LESSONS, GAMES, PRAISE, COLORS, TOOL_NAME } from "./content.js";
import { MOTIFS as MOTIF_LIST } from "./data/motifs.js";
import { CRAFTS } from "./data/crafts.js";

export const normT=s=>String(s).toLowerCase().replace(/&/g," und ").replace(/[.,!?:;„“"()–—]/g," ").trim().split(/\s+/).filter(Boolean);
export function voiceInventory(){const out=[],seen=new Set();const add=(t,cat)=>{const k=normT(t).join(" ");if(!seen.has(k)){seen.add(k);out.push({k,t,cat})}};
 const PH=["Hallo! Welche Lektion möchtest du machen?","Lektion","Wir wiederholen alle Buchstaben.","Schritt","wie",
  "Womit fängt das Wort an?","beginnt mit","Welches Bild passt?","Lies das Wort.","Noch nicht.","Versuch es nochmal.","Hör genau:","Hör genau.",
  "Das ist","Ich erkläre es dir.","Baue das Wort.","Welche Silbe hörst du?","Welche Zahl hörst du?","Wie viele Punkte sind es?",
  "Ein volles Feld sind 10.","Wie viele sind es?","Eine Stange sind 10, ein Würfel ist 1.","Wir zählen zusammen:","Zähle die Stangen:",
  "Dann die Würfel:","Zehner","Einer","ein Zehner","ein Einer","und","Es sind","Hier ist kein Punkt.","Bei","hörst du zuerst die",
  "Geschrieben wird aber zuerst die","denn das sind","Wie viel ist","plus","minus","ist","gleich","Also ist","sind","Das sind",
  "Das ist einer.","Dazu kommt noch einer.","Dazu kommen","Zusammen sind es","Wir nehmen einen weg.","Wir nehmen","weg.","Übrig bleiben",
  "Super gemacht!","Gut geübt!","geschafft!","Du hast alle Buchstaben angeschaut!","Du hast alle Silben angeschaut!",
  "Du hast alle Zahlen angeschaut!","Du kennst jetzt den Rechenweg!","Zurück zur Startseite.","Zurück zu den Lektionen.","Zurück zur Lektion.",
  "Nochmal hören.","Hören.","Weiter.","Zurück.","Nochmal erklären.","Nochmal spielen.","Nächste Lektion.","Zur Lektion.","noch gesperrt",
  "Lesen.","Zahlen und Rechnen.","Malen.","Was möchtest du malen?","Wähle eine Farbe.","Wähle eine Farbe. Dann tippe auf eine Fläche.","Wähle zuerst eine Farbe.","Andere Farbe.","Toll gemalt!","Weiter malen.","Drucken.","Zur Bildauswahl.","Rückgängig.","Fertig.","Male zuerst etwas an.","Male mit dem Finger.","Freies Malen.","Neues Blatt.","Nochmal tippen, dann ist das Blatt leer.",...COLORS.map(c=>c[0]+"."),...MOTIF_LIST.map(m=>m.w+"."),"Basteln.","Was möchtest du basteln?","Das brauchst du:","Los geht's.","Bastelbogen drucken.","Du hast es geschafft! Toll gemacht.","Noch etwas basteln.","Erst in der App ausmalen.","Nochmal von vorn.","Zurück zum Basteln.",...Object.values(TOOL_NAME).map(t=>t+"."),"Bastelbögen.",...CRAFTS.list.flatMap(c=>[c.t+".",...c.steps.map(s=>s.text)])];
 PRAISE.forEach(t=>add(t,"saetze"));PH.forEach(t=>add(t,"saetze"));
 LESSONS.forEach(x=>add(x.t+".","saetze"));Object.values(GAMES).forEach(g=>add(g.t+".","saetze"));
 for(let n=0;n<=100;n++)add(n+".","zahlen");
 LETTERS.forEach(l=>add(l+".","buchstaben"));
 const syl=new Set();LESSONS.forEach(x=>{(x.sylls||[]).forEach(s=>syl.add(s.toLowerCase()));(x.words||[]).forEach(w=>w.segs.forEach(s=>syl.add(s.toLowerCase())))});
 syl.forEach(s=>add(s[0].toUpperCase()+s.slice(1)+".","silben"));
 WORDS.forEach(w=>add(w.w+".","woerter"));LESSONS.forEach(x=>(x.words||[]).forEach(w=>add(w.w+".","woerter")));
 return out}
