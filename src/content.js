/* Lerninhalte: Wörter, Lektionen, Spiele, Farben. Reine Daten – ohne Browser nutzbar (auch für Skripte). */
export const WORDS=[
 ["Maus","🐭"],["Mond","🌙"],["Melone","🍉"],["Apfel","🍎"],["Affe","🐒"],["Auto","🚗"],["Ameise","🐜"],
 ["Oma","👵"],["Ohr","👂"],["Orange","🍊"],["Oktopus","🐙"],
 ["Löwe","🦁"],["Löffel","🥄"],["Igel","🦔"],["Insel","🏝️"],["Ente","🦆"],["Eis","🍦"],["Elefant","🐘"],["Ei","🥚"],
 ["Uhr","⏰"],["Uhu","🦉"],["Ufo","🛸"],["Nase","👃"],["Nuss","🥜"],["Rakete","🚀"],["Rose","🌹"],["Rad","🚲"],
 ["Sonne","☀️"],["Socke","🧦"],["Tomate","🍅"],["Tiger","🐅"],["Tasse","☕"],["Hund","🐕"],["Haus","🏠"],["Hut","🎩"],
 ["Ball","⚽"],["Banane","🍌"],["Baum","🌳"],["Fisch","🐟"],["Feuer","🔥"],["Fuchs","🦊"],["Katze","🐈"],["Kuh","🐄"],["Kerze","🕯️"],
 ["Pilz","🍄"],["Pinguin","🐧"],["Dino","🦕"],["Daumen","👍"],["Giraffe","🦒"],["Gurke","🥒"],["Wal","🐋"],["Wolke","☁️"],
 ["Zug","🚆"],["Zitrone","🍋"],["Zebra","🦓"]
].map(([w,e])=>({w,e,l:w[0].toUpperCase()}));
export const LETTERS=[...new Set(WORDS.map(x=>x.l))];
/* Lektionen in Fibel-Reihenfolge: erst gut hörbare, dehnbare Laute, dann Stopplaute */
export const LESSONS=[
 {id:"l1",t:"Erste Laute",ls:["M","A","O"]},
 {id:"l2",t:"Neue Laute",ls:["L","I","E"]},
 {id:"l3",t:"Weiter geht's",ls:["U","N","R"]},
 {id:"l4",t:"Zischen und Hauchen",ls:["S","T","H"]},
 {id:"l5",t:"Kurze Laute",ls:["B","F","K"]},
 {id:"l6",t:"Die letzten Buchstaben",ls:["P","D","G","W","Z"]},
 {id:"l7",t:"Buchstaben wiederholen",ls:LETTERS.slice(),review:true},
 /* Silben: zuerst offene Silben (Konsonant + Vokal), dann ganze Wörter in Silben, zum Schluss lange Wörter */
 {id:"s1",t:"Silben mit M und L",syl:true,cv:true,show:"MA LI",sylls:["MA","MO","MI","ME","LA","LO","LI","LE"],
  words:[["O-ma","👵"],["La-ma","🦙"],["Li-mo","🥤"],["Ma-ma","👩"],["Me-lo-ne","🍉"]]},
 {id:"s2",t:"Silben mit N und R",syl:true,cv:true,show:"NA RO",sylls:["NA","NO","NI","NE","RA","RO","RI","RE"],
  words:[["Na-se","👃"],["Ro-se","🌹"],["Ra-ke-te","🚀"],["Ba-na-ne","🍌"],["Ro-bo-ter","🤖"]]},
 {id:"s3",t:"Silben mit S und T",syl:true,cv:true,show:"SO TA",sylls:["SA","SO","SI","SE","TA","TO","TI","TE"],
  words:[["So-fa","🛋️"],["To-ma-te","🍅"],["Tas-se","☕"],["Son-ne","☀️"],["Ti-ger","🐅"],["Sa-lat","🥗"]]},
 {id:"s4",t:"Silben mit B, F und K",syl:true,cv:true,show:"KI FO",sylls:["BA","BI","BE","FA","FO","KA","KO","KI"],
  words:[["Ki-wi","🥝"],["Ka-mel","🐪"],["Fo-to","📷"],["Ka-rot-te","🥕"],["Bie-ne","🐝"]]},
 {id:"s5",t:"Lange Wörter",syl:true,show:"GI·RAF·FE",
  words:[["Gi-raf-fe","🦒"],["Pin-gu-in","🐧"],["E-le-fant","🐘"],["Zi-tro-ne","🍋"],["Ok-to-pus","🐙"],["Ba-na-ne","🍌"]]},
 /* Zahlen: Menge (Zehnerfeld bzw. Zehnerstangen), Zahlwort und Ziffer verbinden */
 {id:"z1",t:"Zahlen bis 10",num:true,show:"0 – 10",range:[0,10],pages:[0,1,2,3,4,5,6,7,8,9,10],games:["zentdecken","wieviele","zhoeren"]},
 {id:"z2",t:"Zahlen bis 20",num:true,show:"10 – 20",range:[10,20],pages:[10,11,12,13,14,15,16,17,18,19,20],games:["zentdecken","wieviele","zhoeren"]},
 {id:"z3",t:"Zahlen bis 50",num:true,show:"20 – 50",range:[20,50],pages:[20,23,30,34,40,46,50],games:["zentdecken","wieviele","zhoeren"]},
 {id:"z4",t:"Zahlen bis 100",num:true,show:"50 – 100",range:[50,100],pages:[50,57,60,70,72,80,90,95,100],games:["zentdecken","wieviele","zhoeren"]},
 /* Rechnen: erst mit Bildern, dann ohne; bei Fehlern wird der Rechenweg erklärt. Bis 20 ohne Zehnerübergang */
 {id:"r1",t:"Plus bis 5",calc:true,show:"2 + 3",op:"+",max:5,games:["sogehts","bildrechnen","rechnen"]},
 {id:"r2",t:"Plus bis 10",calc:true,show:"4 + 5",op:"+",max:10,games:["sogehts","bildrechnen","rechnen"]},
 {id:"r3",t:"Minus bis 10",calc:true,show:"7 − 3",op:"-",max:10,games:["sogehts","bildrechnen","rechnen"]},
 {id:"r4",t:"Plus bis 20",calc:true,show:"13 + 4",op:"+",max:20,teen:true,games:["sogehts","bildrechnen","rechnen"]},
 {id:"r5",t:"Minus bis 20",calc:true,show:"17 − 5",op:"-",max:20,teen:true,games:["sogehts","bildrechnen","rechnen"]}
];
LESSONS.forEach(x=>{if(!x.syl)return;x.words=x.words.map(([s,e])=>({segs:s.split("-"),w:s.replace(/-/g,""),e}));
 if(!x.cv)x.sylls=[...new Set(x.words.flatMap(w=>w.segs.map(s=>s.toUpperCase())))];
 x.games=["silben","hoeren","bauen"]});
LESSONS.forEach(x=>{if(!x.games)x.games=["entdecken","anlaut","wortbild"]});
export const GAMES={
 entdecken:{t:"Buchstaben entdecken",d:"Buchstabe, Bild und Wort ansehen und hören"},
 anlaut:{t:"Anlaut finden",d:"Womit fängt das Wort an?"},
 wortbild:{t:"Wort und Bild",d:"Das Wort lesen und das passende Bild finden"},
 silben:{t:"Silben entdecken",d:"Silben und Wörter ansehen und hören"},
 hoeren:{t:"Silbe hören",d:"Welche Silbe hörst du?"},
 bauen:{t:"Wörter bauen",d:"Setze das Wort aus Silben zusammen"},
 zentdecken:{t:"Zahlen entdecken",d:"Zahl, Menge und Name kennenlernen"},
 wieviele:{t:"Wie viele?",d:"Die Menge ansehen und die Zahl finden"},
 zhoeren:{t:"Zahl hören",d:"Welche Zahl hörst du?"},
 sogehts:{t:"So geht's",d:"Der Rechenweg Schritt für Schritt erklärt"},
 bildrechnen:{t:"Rechnen mit Bildern",d:"Punkte ansehen und das Ergebnis finden"},
 rechnen:{t:"Rechnen",d:"Aufgaben lösen – bei Fehlern gibt es eine Erklärung"}
};
export const PRAISE=["Ja, richtig!","Super!","Toll gemacht!","Genau!","Prima!"];
export const ROUND=5;
export const COLORS=[["Rot","#E53935"],["Orange","#FB8C00"],["Gelb","#FDD835"],["Grün","#43A047"],["Hellblau","#4FC3F7"],["Blau","#1E63C8"],["Lila","#8E44AD"],["Rosa","#F48FB1"],["Braun","#8D5A3B"],["Weiß","#FFFFFF"]];
export const TOOL_NAME={schere:"Schere",stift:"Stifte",kleber:"Kleber",bogen:"Bastelbogen",haken:"Fertig"};
