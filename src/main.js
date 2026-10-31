import "./styles.css";
import "@fontsource/andika/400.css";
import "@fontsource/andika/700.css";
import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource/lexend/300.css";
import "@fontsource/lexend/400.css";
import "@fontsource/lexend/700.css";
import { VOICE as VOICE_CLIPS } from "./data/voice.js";
import { MOTIFS as MOTIF_LIST } from "./data/motifs.js";
import { CRAFTS } from "./data/crafts.js";
import { WORDS, LETTERS, LESSONS, GAMES, PRAISE, ROUND, COLORS, TOOL_NAME, sayL } from "./content.js";
import { normT } from "./voice-inventory.js";

/* Zeigt einen Hinweis statt einer leeren Seite, falls beim Start etwas schiefgeht */
window.addEventListener("error",e=>{const a=document.getElementById("app");if(a&&!a.children.length)a.innerHTML='<div style="padding:24px;font:18px/1.5 system-ui,sans-serif"><h1 style="font-size:1.4em">Lernfreunde konnte nicht starten</h1><p>Bitte die Seite neu laden oder einen aktuellen Browser verwenden.</p><p style="opacity:.7;font-size:.85em">Technischer Hinweis: '+String(e.message||e.error||"Unbekannter Fehler").replace(/[<>&]/g,"")+'</p></div>'});
/* ---------- Inhalte ---------- */
const learned=L=>{const i=LESSONS.indexOf(L);return L.review?LETTERS:[...new Set(LESSONS.slice(0,i+1).flatMap(x=>x.ls||[]))]};
const learnedSylls=L=>{const i=LESSONS.indexOf(L);return [...new Set(LESSONS.slice(0,i+1).flatMap(x=>x.sylls||[]))]};

/* ---------- Speicher ---------- */
const clone=x=>JSON.parse(JSON.stringify(x));
const DEF={subject:"lesen",name:"",face:"🦊",mode:"touch",scanMs:2000,dwellMs:1500,scanSpeak:true,choices:3,caps:true,laut:true,size:"normal",hc:false,calm:false,tts:true,rate:0.9,autoRead:true,sequential:false,prog:{},log:[],paint:{},gallery:[],craft:{}};
const FACES=["🦊","🐻","🐼","🐸","🦉","🐢","🐙","🦄"];
let S={profiles:[],cur:null};
function load(){try{const r=localStorage.getItem("lernfreunde.v1");if(r)S=JSON.parse(r)}catch(e){}
 if(!S.profiles)S.profiles=[];
 if(!S.seed2){S.profiles=S.profiles.filter(p=>!(p.example&&["p1","p2"].includes(p.id)));const ago=d=>Date.now()-d*864e5;
  S.profiles.unshift(
  {...clone(DEF),id:"p1",name:"Emilia",face:"🦄",example:true,choices:3,
   prog:{l1:{entdecken:1,anlaut:5,wortbild:4},l2:{entdecken:1,anlaut:4,wortbild:3},l3:{entdecken:1}},
   log:[{g:"anlaut",l:"l1",ok:5,n:5,ts:ago(4)},{g:"wortbild",l:"l1",ok:4,n:5,ts:ago(4)},{g:"anlaut",l:"l2",ok:4,n:5,ts:ago(2)},{g:"wortbild",l:"l2",ok:3,n:5,ts:ago(1)}]},
  {...clone(DEF),id:"p2",name:"Tim",face:"🐢",example:true,mode:"scan1",choices:2,size:"gross",calm:true,sequential:true,
   prog:{l1:{entdecken:1,anlaut:3}},log:[{g:"anlaut",l:"l1",ok:3,n:5,ts:ago(1)}]});S.seed2=true;save()}
 S.profiles.forEach(p=>{for(const k in DEF)if(p[k]===undefined)p[k]=clone(DEF[k])})}
function save(){try{localStorage.setItem("lernfreunde.v1",JSON.stringify(S))}catch(e){}}
const P=()=>S.profiles.find(p=>p.id===S.cur);

/* ---------- Sprache ---------- */
/* ---------- Lehrerinnen-Stimme: aufgenommene Clips (ElevenLabs), sonst Sprachausgabe des Geräts ---------- */
const VOICE=VOICE_CLIPS;
let VKEYS=null,VMAX=1;
function voicePlan(text){if(!VKEYS){VKEYS=new Set(Object.keys(VOICE));VKEYS.forEach(k=>{VMAX=Math.max(VMAX,k.split(" ").length)})}
 const tk=normT(text),out=[];let miss=[];
 for(let i=0;i<tk.length;){let hit=false;
  for(let n=Math.min(VMAX,tk.length-i);n>0;n--){const k=tk.slice(i,i+n).join(" ");
   if(VKEYS.has(k)){if(miss.length){out.push({t:miss.join(" ")});miss=[]}out.push({k});i+=n;hit=true;break}}
  if(!hit){miss.push(tk[i]);i++}}
 if(miss.length)out.push({t:miss.join(" ")});return out}
const AU=typeof Audio!=="undefined"?new Audio():null;if(AU)AU.preload="auto";
function playClip(src,rate){return new Promise(res=>{let done=false;const fin=()=>{if(!done){done=true;res()}};
 AU.onended=fin;AU.onerror=fin;AU.src=src;try{AU.preservesPitch=true;AU.playbackRate=rate}catch(e){}
 const pr=AU.play();if(pr&&pr.catch)pr.catch(fin);setTimeout(fin,9000)})}
const Speech={voice:null,gen:0,
 init(){if(!("speechSynthesis" in window))return;const pick=()=>{const v=speechSynthesis.getVoices();
  this.voice=v.find(x=>/^de/i.test(x.lang)&&/female|anna|katja|hedda|google/i.test(x.name))||v.find(x=>/^de/i.test(x.lang))||null};
  pick();speechSynthesis.onvoiceschanged=pick},
 current:Promise.resolve(),
 stopAll(){try{AU&&AU.pause()}catch(e){}try{window.speechSynthesis&&speechSynthesis.cancel()}catch(e){}
  const NT=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.TextToSpeech;if(NT)NT.stop().catch(()=>{})},
 say(text,o={}){if(!o.keep)this.gen++;const p=P();document.getElementById("live").textContent=text;
  if(!p||!p.tts)return(this.current=Promise.resolve());
  if(AU&&VKEYS!==false&&Object.keys(VOICE).length){const my=this.gen;if(!o.keep)this.stopAll();
   const plan=voicePlan(text),r=(o.rate||p.rate)/0.9;
   /* Satz nicht komplett aufgenommen → ganzen Satz mit einer Stimme sprechen, kein Stimmenmix */
   if(plan.some(st=>st.t))return(this.current=this.tts(text,o));
   this.current=(async()=>{for(const st of plan){if(this.gen!==my)return;
    if(st.k)await playClip(VOICE[st.k],r);else await this.tts(st.t,o);await wait(220)}})();
   return this.current}
  return(this.current=this.tts(text,o))},
 tts(text,o={}){const p=P();
  const NT=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.TextToSpeech;
  if(NT){/* App-Version: native Sprachausgabe von iOS/Android */
   const r=o.rate||p.rate;NT.stop().catch(()=>{});
   return Promise.race([NT.speak({text,lang:"de-DE",rate:r,pitch:1,volume:1,category:"playback"}).catch(()=>{}),wait(800+text.length*120/r)])}
  if(!("speechSynthesis" in window))return Promise.resolve();
  speechSynthesis.cancel();
  return new Promise(res=>{const u=new SpeechSynthesisUtterance(text);u.lang="de-DE";if(this.voice)u.voice=this.voice;
   u.rate=o.rate||p.rate;let done=false;const fin=()=>{if(!done){done=true;res()}};
   u.onend=fin;u.onerror=fin;setTimeout(fin,600+text.length*110/(u.rate||1));speechSynthesis.speak(u)})}};
/* Liste aller Aufnahmen, die die App braucht (Schlüssel = normalisierter Text) */

/* ---------- Eingabe-Schicht: Tippen, Verweilen, 1-Taste-Scan, 2-Tasten-Scan ---------- */
const Input={items:[],idx:-1,timer:null,paused:false,dwellT:null,
 mode(){const p=P();return app.dataset.child&&p?p.mode:"touch"},
 stop(){clearInterval(this.timer);this.timer=null;this.items.forEach(e=>e.classList.remove("scan"));this.idx=-1},
 async refresh(){this.stop();this.items=[...app.querySelectorAll(".tgt:not([disabled])")];
  const m=this.mode();if(!m.startsWith("scan")||this.paused)return;
  const token=this.token=Symbol();await Speech.current;if(token!==this.token||this.paused)return;
  this.step(true);if(m==="scan1")this.timer=setInterval(()=>this.step(),P().scanMs)},
 step(first){if(!this.items.length)return;this.items.forEach(e=>e.classList.remove("scan"));
  this.idx=first?(this.startAt||0)%this.items.length:(this.idx+1)%this.items.length;this.startAt=0;const el=this.items[this.idx];el.classList.add("scan");el.dispatchEvent(new Event("scanfocus"));
  el.scrollIntoView({block:"nearest"});const st=el.dataset.say||el.textContent.trim();if(P().scanSpeak&&st)Speech.say(st,{rate:1.05})},
 select(){const el=this.items[this.idx];if(el){this.stop();el.click()}},
 pause(v){this.paused=v;if(v){this.token=null;this.stop()}}};
const app=document.getElementById("app");
document.addEventListener("keydown",e=>{const m=Input.mode();if(!m.startsWith("scan"))return;
 if(m==="scan1"&&(e.code==="Space"||e.key==="Enter")){e.preventDefault();if(!e.repeat)Input.select()}
 if(m==="scan2"){if(e.code==="Space"||e.key==="ArrowRight"||e.key==="Tab"){e.preventDefault();if(!e.repeat){clearInterval(Input.timer);Input.step(Input.idx<0)}}
  if(e.key==="Enter"){e.preventDefault();if(!e.repeat)Input.select()}}},true);
document.addEventListener("click",e=>{const m=Input.mode();if(!m.startsWith("scan")||!e.isTrusted)return;
 e.preventDefault();e.stopPropagation();if(!Input.paused)Input.select()},true);
app.addEventListener("pointerover",e=>{if(Input.mode()!=="dwell")return;const t=e.target.closest(".tgt");if(!t||t.disabled||t===Input.dwellEl)return;
 cancelDwell();Input.dwellEl=t;t.style.setProperty("--dwell-ms",P().dwellMs+"ms");t.classList.add("dwelling");
 Input.dwellT=setTimeout(()=>{t.classList.remove("dwelling");Input.dwellEl=null;t.click()},P().dwellMs)});
app.addEventListener("pointerout",e=>{const t=e.target.closest(".tgt");if(t&&!t.contains(e.relatedTarget))cancelDwell()});
app.addEventListener("click",cancelDwell,true);
function cancelDwell(){clearTimeout(Input.dwellT);if(Input.dwellEl)Input.dwellEl.classList.remove("dwelling");Input.dwellEl=null}

/* ---------- Hilfen ---------- */
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
const fmt=w=>P().caps?w.toUpperCase():w;
const fmtL=l=>P().caps?l:l+" "+l.toLowerCase();
const T=(cls,say,html,attrs="")=>`<button class="tgt ${cls}" data-say="${esc(say)}" ${attrs}>${html}<span class="dwell"><i></i></span></button>`;
function applyLook(){const p=P();document.body.dataset.size=p?p.size:"normal";document.body.dataset.hc=p&&p.hc?"1":"0";document.body.dataset.calm=p&&p.calm?"1":"0"}
function view(html,child){app.innerHTML=html;if(child)app.dataset.child="1";else delete app.dataset.child;applyLook();cancelDwell();Input.pause(false);Input.refresh()}
const bind=(id,fn)=>{const el=document.getElementById(id);if(el)el.onclick=fn};

/* ---------- Startseite ---------- */
/* Maskottchen: der Dino aus „Mal mit mir!“ in CI-Farben */
const DINO="assets/mascot/dino.png";
const dino=(cls="")=>`<img class="dino ${cls}" src="${DINO}" alt="" aria-hidden="true">`;
const starsOf=p=>LESSONS.reduce((n,x)=>n+doneCount(p,x),0);
function kidCard(p){const nx=nextLesson(p),st=starsOf(p);
 const where=nx?`Weiter: ${CHAPTERS[chOf(nx)].t} · Lektion ${lno(nx)}`:p.subject==="malen"?"Malen":p.subject==="basteln"?"Basteln":"Alles geschafft!";
 return `<button class="tgt kid" data-id="${p.id}" data-say="${esc(p.name)}"><span class="face" aria-hidden="true">${p.face}</span><span class="name">${esc(p.name)}</span>
  <span class="kidmeta"><span class="kstars" aria-label="${st} Sterne">${starSvg(true)}<b>${st}</b></span><span>${esc(where)}</span></span>${p.example?'<span class="badge">Beispielprofil</span>':""}</button>`}
function home(){S.cur=null;window.speechSynthesis?.cancel();
 view(`<header class="brandbar"><div class="wordmark" aria-label="Lernfreunde"><span class="wl">Lern</span><span class="wb">freunde</span><span class="wd">.</span></div>
 <button class="gate" id="gate" aria-label="Für Erwachsene: 2 Sekunden gedrückt halten"><i></i><span style="position:relative">Für Erwachsene · gedrückt halten</span></button></header>
 <section class="greet">${dino()}<div class="bubble"><h1>Hallo! Wer lernt heute mit mir?</h1><p>Tippe auf deinen Namen.</p></div></section>
 <div class="kids">${S.profiles.map(kidCard).join("")}</div>
 <p class="note">Lesen, Rechnen, Malen und Basteln · Alle Daten bleiben nur auf diesem Gerät.</p>`);
 app.querySelectorAll(".kid").forEach(b=>b.onclick=()=>{S.cur=b.dataset.id;save();menu()});
 const g=document.getElementById("gate");let t;
 const start=e=>{if(e.repeat)return;g.classList.add("holding");t=setTimeout(()=>{g.classList.remove("holding");adult()},2000)};
 const end=()=>{clearTimeout(t);g.classList.remove("holding")};
 g.addEventListener("pointerdown",start);["pointerup","pointerleave","pointercancel"].forEach(ev=>g.addEventListener(ev,end));
 g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.code==="Space"){e.preventDefault();start(e)}});g.addEventListener("keyup",end)}

/* ---------- Lektionen ---------- */
const lp=(p,L)=>p.prog[L.id]||{};
const doneCount=(p,L)=>{const g=lp(p,L),[a,b,c]=L.games;return (g[a]?1:0)+((g[b]||0)>=3?1:0)+((g[c]||0)>=3?1:0)};
const subj=x=>x.num||x.calc?"zahlen":"lesen";
const isOpen=(p,i)=>{if(!p.sequential)return true;const x=LESSONS[i],prev=LESSONS.slice(0,i).reverse().find(y=>subj(y)===subj(x));return !prev||doneCount(p,prev)===3};
const fmtL1=l=>P().caps?l:l+l.toLowerCase();
const CHAPTERS=[{t:"Buchstaben",d:"Laute hören und Buchstaben erkennen",s:"lesen"},{t:"Silben",d:"Silben lesen und Wörter bauen",s:"lesen"},
 {t:"Zahlen",d:"Zahlen bis 100 sehen, hören und erkennen",s:"zahlen"},{t:"Rechnen",d:"Plus und Minus – Schritt für Schritt erklärt",s:"zahlen"}];
const SUBJECTS=[["lesen","📖 Lesen"],["zahlen","🔢 Zahlen & Rechnen"],["malen","🎨 Malen"],["basteln","✂️ Basteln"]];
const chOf=x=>x.syl?1:x.num?2:x.calc?3:0;
const lno=x=>LESSONS.filter(y=>chOf(y)===chOf(x)).indexOf(x)+1;
const lname=x=>`${CHAPTERS[chOf(x)].t} · Lektion ${lno(x)}`;
const lglyph=x=>x.num||x.calc?x.show:x.syl?fmtSyl(x.show):x.review?(P().caps?"A – Z":"Aa – Zz"):x.ls.map(fmtL1).join(" ");
const starSvg=(on,k=0)=>`<svg viewBox="0 0 24 24" aria-hidden="true" style="animation-delay:${k*.12}s"><path class="${on?"on":"off"}" d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>`;
const nextLesson=p=>LESSONS.find((x,i)=>subj(x)===p.subject&&isOpen(p,i)&&doneCount(p,x)<3);
let L=null;
function menu(){G=null;const p=P();L=null;if(p.subject==="malen")return malMenu();if(p.subject==="basteln")return bastelMenu();const nx=nextLesson(p);
 const chapter=(c,ci)=>{const ls=LESSONS.filter(x=>chOf(x)===ci),done=ls.filter(x=>doneCount(p,x)===3).length;
  if(c.s!==p.subject)return "";const cn=CHAPTERS.filter(x=>x.s===c.s).indexOf(c)+1;
  return `<section class="chapter c${ci+1}" aria-label="Kapitel ${cn}: ${c.t}">
  <header class="chhead"><div class="badge">Kapitel ${cn}</div><h2>${c.t}</h2><p>${c.d}</p>
  <div class="pbar" role="img" aria-label="${done} von ${ls.length} Lektionen geschafft"><i style="width:${done/ls.length*100}%"></i></div>
  <span class="pcount">${done} von ${ls.length} Lektionen geschafft</span></header>
  <div class="path">${ls.map(x=>{const i=LESSONS.indexOf(x),d=doneCount(p,x),o=isOpen(p,i),cur=x===nx;
   const st=d===3?"done":!o?"locked":cur?"current":"open";
   return T(`lesson ${st}`,`Lektion ${lno(x)}: ${x.t}${o?"":", noch gesperrt"}`,
   `<span class="medal" aria-hidden="true">${st==="done"?"✓":st==="locked"?"🔒":lno(x)}</span>
    <span class="lbody"><span class="ll">${lglyph(x)}</span><b>${x.t}</b>${cur?'<span class="chip">Hier geht es weiter</span>':""}</span>
    <span class="lstars" aria-label="${d} von 3 Sternen">${[0,1,2].map(k=>starSvg(k<d)).join("")}</span>`,
   `data-i="${i}" ${o?"":"disabled"}`)}).join("")}</div></section>`};
 view(`<div class="bar">${T("","Zurück zur Startseite","⌂ Start",'id="home"')}<div class="grow"><h1 class="hi">${p.face} Hallo ${esc(p.name)}!</h1></div></div>
 ${subjBar(p)}
 <div class="chapters">${CHAPTERS.map(chapter).join("")}</div>`,true);
 Speech.say(`Hallo! Welche Lektion möchtest du machen?`);Input.refresh();
 bindSubj(p);
 bind("home",home);app.querySelectorAll("[data-i]").forEach(b=>b.onclick=()=>{L=LESSONS[+b.dataset.i];lesson()})}

function lesson(){G=null;const p=P(),g=lp(p,L),ci=chOf(L);
 const st=k=>k===L.games[0]?(g[k]?"✓ geschafft":"Noch nicht gemacht"):(g[k]!=null?`✓ Bestes Ergebnis: ${g[k]} von ${ROUND}`:"Noch nicht gemacht");
 const ok=k=>k===L.games[0]?!!g[k]:(g[k]||0)>=3;const nextStep=L.games.find(k=>!ok(k));
 let glyph;if(L.num){glyph={zentdecken:String(L.range[0]+3),wieviele:"●●●",zhoeren:"👂"}}
 else if(L.calc){glyph={sogehts:"💡",bildrechnen:L.show.replace(/\d+/g,m=>"●".repeat(Math.min(+m,3))),rechnen:L.show+" = ?"}}
 else if(L.syl){glyph={silben:fmtSyl(L.sylls[0]),hoeren:"👂",bauen:L.words[0].e}}
 else{const w0=WORDS.find(w=>w.l===L.ls[0]);glyph={entdecken:fmtL(L.ls[0]),anlaut:w0.e,wortbild:fmt(w0.w)}}
 const stepName=["Kennenlernen","Üben","Anwenden"];
 view(`<div class="bar">${T("","Zurück zu den Lektionen","◀ Lektionen",'id="back"')}</div>
 <header class="lhead c${ci+1}"><div><div class="badge">${lname(L)}</div><h1 class="hi">${L.t}</h1></div>
 <div class="lbig" aria-hidden="true">${lglyph(L)}</div>
 <div class="lstars big" aria-label="${doneCount(p,L)} von 3 Sternen">${[0,1,2].map(k=>starSvg(k<doneCount(p,L))).join("")}</div></header>
 <div class="steps c${ci+1}">${L.games.map((k,n)=>{const x=GAMES[k];
  return T(`step${ok(k)?" done":""}${k===nextStep?" next":""}`,`Schritt ${n+1}: ${x.t}`,
  `<span class="snum" aria-hidden="true">${ok(k)?"✓":n+1}</span><span class="badge">Schritt ${n+1} · ${stepName[n]}</span>
   <span class="gl" aria-hidden="true">${glyph[k]}</span><b>${x.t}</b><span class="sd">${x.d}</span><span class="sst">${st(k)}</span>`,`data-g="${k}"`)}).join("")}</div>`,true);
 Speech.say(L.review?`Lektion ${lno(L)}. Wir wiederholen alle Buchstaben.`:`Lektion ${lno(L)}. ${L.t}.`);Input.refresh();
 bind("back",menu);app.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>start(b.dataset.g))}

/* ---------- Spiele ---------- */
let G=null;
function start(type){if(L.syl)return startSyl(type);if(L.num)return startNum(type);if(L.calc)return startCalc(type);const ws=WORDS.filter(x=>L.ls.includes(x.l));
 if(type==="entdecken"){G={type,pages:L.ls.flatMap(l=>WORDS.filter(w=>w.l===l).slice(0,L.review?1:2)),i:0};return discover()}
 let tasks=shuffle(L.ls).map(l=>shuffle(ws.filter(w=>w.l===l))[0]).slice(0,ROUND);
 const rest=shuffle(ws.filter(w=>!tasks.includes(w)));while(tasks.length<ROUND)tasks.push(rest.pop()||shuffle(ws)[0]);
 G={type,tasks:shuffle(tasks),i:0,ok:0,wrong:0};task()}
const dotsN=(n,i)=>`<div class="dots" aria-label="${i+1} von ${n}">${Array.from({length:n},(_,k)=>`<span class="${k<i?"done":k===i?"now":""}"></span>`).join("")}</div>`;
const topbar=(mid,again=true)=>`<div class="bar">${T("","Zurück zur Lektion","◀ Lektion",'id="back"')}<div class="grow">${mid}</div>${again?T("","Nochmal hören","🔊 Nochmal",'id="again"'):""}</div>`;

function discover(){const w=G.pages[G.i],l=w.l,word=fmt(w.w),text=`${sayL(l,P().laut)} wie ${w.w}.`;
 view(`${topbar(dotsN(G.pages.length,G.i),false)}
 <div class="stage"><div class="prompt" style="flex:1"><div class="letter">${fmtL(l)}</div><div class="pic" aria-hidden="true">${w.e}</div>
 <div class="word"><span class="first">${word[0]}</span>${word.slice(1)}</div></div>
 <div class="navrow">${T("","Zurück","◀ Zurück",`id="prev" ${G.i===0?"disabled":""}`)}${T("primary","Hören","🔊 Hören",'id="hear"')}${T("","Weiter","Weiter ▶",'id="next"')}</div></div>`,true);
 Speech.say(text);Input.refresh();
 bind("back",lesson);bind("hear",()=>{Speech.say(text);Input.refresh()});
 bind("prev",()=>{G.i=Math.max(0,G.i-1);discover()});
 bind("next",()=>{if(G.i<G.pages.length-1){G.i++;discover()}else{const p=P();(p.prog[L.id]=p.prog[L.id]||{}).entdecken=1;save();
  result(1,1,"Du hast alle Buchstaben angeschaut!")}})}

function task(){const p=P(),t=G.tasks[G.i];G.wrong=0;const n=Math.min(p.choices,4),known=learned(L);
 let opts,prompt,say;
 if(G.type==="anlaut"){let others=shuffle(known.filter(l=>l!==t.l));if(others.length<n-1)others=others.concat(shuffle(LETTERS.filter(l=>l!==t.l&&!others.includes(l))));
  opts=shuffle([t.l,...others.slice(0,n-1)]).map(l=>({v:l,html:fmtL(l).split(" ")[0],say:sayL(l,p.laut)}));
  prompt=`<div class="pic" aria-hidden="true">${t.e}</div><p class="ask">Womit fängt das Wort an?</p>`;say=`${t.w}. Womit fängt das Wort an?`}
 else{let others=shuffle(WORDS.filter(x=>x.l!==t.l&&known.includes(x.l)));if(others.length<n-1)others=others.concat(shuffle(WORDS.filter(x=>x.l!==t.l&&!others.includes(x))));
  opts=shuffle([t,...others.slice(0,n-1)]).map(x=>({v:x.w,html:x.e,say:x.w,pict:1}));
  prompt=`<div><div class="word">${fmt(t.w)}</div><p class="ask" style="margin-inline:auto">Welches Bild passt zum Wort?</p></div>`;
  say=p.autoRead?`${t.w}. Welches Bild passt?`:"Lies das Wort. Welches Bild passt?"}
 const correct=G.type==="anlaut"?t.l:t.w;
 view(`${topbar(dotsN(G.tasks.length,G.i))}<div class="stage"><div class="prompt">${prompt}</div>
 <div class="choices" style="--n:${n}">${opts.map(o=>T("choice"+(o.pict?" pict":""),o.say,o.html,`data-v="${esc(o.v)}" aria-label="${esc(o.say)}"`)).join("")}</div>
 <div class="feedback" id="fb"></div></div>`,true);
 Speech.say(say);Input.refresh();
 bind("back",lesson);bind("again",()=>{Speech.say(say);Input.refresh()});
 app.querySelectorAll(".choice").forEach(b=>b.onclick=async()=>{const myG=G;const fb=document.getElementById("fb");
  if(b.dataset.v===correct){Input.pause(true);b.classList.add("right");if(!G.wrong)G.ok++;
   app.querySelectorAll(".choice").forEach(x=>x.disabled=true);
   const msg=PRAISE[Math.random()*PRAISE.length|0];fb.className="feedback ok";fb.textContent=msg+" "+(G.type==="anlaut"?`${t.w} beginnt mit ${t.l}.`:fmt(t.w));
   await Speech.say(G.type==="anlaut"?`${msg} ${t.w} beginnt mit ${sayL(t.l,p.laut)}.`:`${msg} ${t.w}.`);
   await new Promise(r=>setTimeout(r,500));if(G!==myG)return;G.i++;G.i<G.tasks.length?task():finish()}
  else{G.wrong++;b.classList.add("wrong");b.disabled=true;fb.className="feedback no";
   fb.textContent="Noch nicht. Versuch es nochmal.";Input.pause(true);
   await Speech.say(G.type==="anlaut"?`Noch nicht. Hör genau: ${t.w}.`:`Das ist ${b.dataset.v}. Versuch es nochmal.`);
   Input.pause(false);Input.refresh()}})}

function finish(){const p=P(),pr=(p.prog[L.id]=p.prog[L.id]||{});pr[G.type]=Math.max(pr[G.type]||0,G.ok);
 p.log.push({g:G.type,l:L.id,ok:G.ok,n:G.tasks.length,ts:Date.now()});p.log=p.log.slice(-30);save();
 result(G.ok,G.tasks.length,G.ok>=G.tasks.length-1?"Super gemacht!":"Gut geübt!")}
function result(ok,n,title){const p=P(),i=LESSONS.indexOf(L),complete=doneCount(p,L)===3,rew=complete&&L.ls?L.ls.map(l=>MOTIFS.find(m=>m.l===l)).find(Boolean):null,next=LESSONS.slice(i+1).find(x=>subj(x)===subj(L));
 if(complete)title=`Lektion ${lno(L)} geschafft!`;
 const st=Math.max(1,Math.round(ok/n*5));const star=(on,k)=>`<svg viewBox="0 0 24 24" aria-hidden="true" style="animation-delay:${k*.12}s"><path class="${on?"on":"off"}" d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>`;
 view(`<div class="result">${dino("cheer")}<h2>${title}</h2><div class="stars" role="img" aria-label="${st} von 5 Sternen">${[0,1,2,3,4].map(k=>star(k<st,k)).join("")}</div>
 <div class="rowbtns">${complete&&next?T("primary","Nächste Lektion","Nächste Lektion ▶",'id="nextL"'):""}${T(complete&&next?"":"primary","Nochmal spielen","↻ Nochmal",'id="again2"')}${T("","Zur Lektion","Zur Lektion",'id="menu"')}${rew?T("",`${rew.w} ausmalen`,`🎨 ${rew.w} ausmalen`,'id="paintR"'):""}</div></div>`,true);
 Speech.say(title);Input.refresh();const type=G.type;bind("paintR",()=>paintOpen(rew,lesson));bind("again2",()=>start(type));bind("menu",lesson);bind("nextL",()=>{L=next;lesson()})}

/* ---------- Silben-Spiele ---------- */
const fmtSyl=s=>P().caps?s.toUpperCase():s.split(" ").map(t=>t[0].toUpperCase()+t.slice(1).toLowerCase()).join(" ");
const fmtSeg=s=>P().caps?s.toUpperCase():s;
const optSyl=s=>P().caps?s.toUpperCase():s.toLowerCase();
const sayS=s=>s.toLowerCase();
const arcs=(segs,filled=segs.length)=>segs.map((s,k)=>k<filled?`<span class="syl s${k%2}">${fmtSeg(s)}</span>`:`<span class="slot" aria-hidden="true"></span>`).join("");
const wait=ms=>new Promise(r=>setTimeout(r,ms));
/* liest ein Wort Silbe für Silbe vor und markiert dabei die Silbenbögen */
function readWord(w){const my=++Speech.gen;const run=(async()=>{const spans=[...app.querySelectorAll(".word .syl")];
 for(let k=0;k<w.segs.length;k++){if(Speech.gen!==my)return;spans.forEach(s=>s.classList.toggle("lit",s===spans[k]));
  await Speech.say(sayS(w.segs[k]),{keep:true});if(!P()||!P().tts)await wait(600);else await wait(150)}
 if(Speech.gen!==my)return;spans.forEach(s=>s.classList.remove("lit"));await Speech.say(w.w+".",{keep:true})})();
 Speech.current=run;return run}

function startSyl(type){const p=P();
 if(type==="silben"){G={type,pages:[...(L.cv?L.sylls.map(s=>({s})):[]),...L.words.map(w=>({w}))],i:0};return discoverSyl()}
 const src=type==="hoeren"?L.sylls:L.words;let tasks=[];while(tasks.length<ROUND)tasks.push(...shuffle(src));
 G={type,tasks:tasks.slice(0,ROUND),i:0,ok:0,wrong:0};type==="hoeren"?taskHoeren():taskBauen(true)}

function discoverSyl(){const pg=G.pages[G.i];let html;
 if(pg.s){const c=pg.s[0],v=pg.s.slice(1);
  html=`<div class="cv"><span>${fmtSeg(c)}</span><span class="plus">+</span><span>${optSyl(v)}</span><span class="plus">=</span><span class="word"><span class="syl s0">${fmtSyl(pg.s)}</span></span></div>`}
 else html=`<div class="pic" aria-hidden="true">${pg.w.e}</div><div class="word">${arcs(pg.w.segs)}</div>`;
 view(`${topbar(dotsN(G.pages.length,G.i),false)}
 <div class="stage"><div class="prompt" style="flex:1">${html}</div>
 <div class="navrow">${T("","Zurück","◀ Zurück",`id="prev" ${G.i===0?"disabled":""}`)}${T("primary","Hören","🔊 Hören",'id="hear"')}${T("","Weiter","Weiter ▶",'id="next"')}</div></div>`,true);
 const speak=()=>{pg.s?Speech.say(sayS(pg.s)+"."):readWord(pg.w);Input.refresh()};speak();
 bind("back",lesson);bind("hear",speak);
 bind("prev",()=>{G.i=Math.max(0,G.i-1);discoverSyl()});
 bind("next",()=>{if(G.i<G.pages.length-1){G.i++;discoverSyl()}else{const p=P();(p.prog[L.id]=p.prog[L.id]||{}).silben=1;save();
  result(1,1,"Du hast alle Silben angeschaut!")}})}

async function praiseNext(fb,text,sayFn){const myG=G;Input.pause(true);const msg=PRAISE[Math.random()*PRAISE.length|0];
 fb.className="feedback ok";fb.textContent=msg+" "+text;await Speech.say(msg,{keep:false});await sayFn();await wait(500);if(G!==myG)return;
 G.i++;G.i<G.tasks.length?(G.type==="hoeren"?taskHoeren():taskBauen(true)):finish()}

function taskHoeren(){const p=P(),t=G.tasks[G.i];G.wrong=0;const n=Math.min(p.choices,4);
 let others=shuffle(learnedSylls(L).filter(s=>s!==t));
 const opts=shuffle([t,...others.slice(0,n-1)]);const say=`Welche Silbe hörst du? ${sayS(t)}.`;
 view(`${topbar(dotsN(G.tasks.length,G.i))}<div class="stage"><div class="prompt"><div class="pic" aria-hidden="true">👂</div><p class="ask">Welche Silbe hörst du?</p></div>
 <div class="choices" style="--n:${n}">${opts.map(s=>T("choice",sayS(s),optSyl(s),`data-v="${s}" aria-label="${sayS(s)}"`)).join("")}</div>
 <div class="feedback" id="fb"></div></div>`,true);
 Speech.say(say);Input.refresh();
 bind("back",lesson);bind("again",()=>{Speech.say(sayS(t)+".");Input.refresh()});
 app.querySelectorAll(".choice").forEach(b=>b.onclick=async()=>{const myG=G;const fb=document.getElementById("fb");
  if(b.dataset.v===t){b.classList.add("right");if(!G.wrong)G.ok++;app.querySelectorAll(".choice").forEach(x=>x.disabled=true);
   await praiseNext(fb,optSyl(t),()=>Speech.say(sayS(t)+".",{keep:true}))}
  else{G.wrong++;b.classList.add("wrong");b.disabled=true;fb.className="feedback no";fb.textContent="Noch nicht. Hör nochmal.";
   Input.pause(true);await Speech.say(`Noch nicht. Hör genau: ${sayS(t)}.`);Input.pause(false);Input.refresh()}})}

function taskBauen(first){const p=P(),t=G.tasks[G.i];
 if(first){G.wrong=0;G.filled=0;G.bad=[];const own=[...new Set(t.segs.map(s=>s.toUpperCase()))];
  const total=Math.min(6,Math.max(Math.min(p.choices,4),own.length+1));
  const others=shuffle(learnedSylls(L).filter(s=>!own.includes(s)));G.opts=shuffle([...own,...others.slice(0,total-own.length)])}
 const cols=G.opts.length<=4?G.opts.length:3;
 view(`${topbar(dotsN(G.tasks.length,G.i))}<div class="stage"><div class="prompt"><div class="pic" aria-hidden="true">${t.e}</div>
 <div><div class="word">${arcs(t.segs,G.filled)}</div><p class="ask" style="margin-inline:auto">Baue das Wort aus Silben.</p></div></div>
 <div class="choices" style="--n:${cols}">${G.opts.map(s=>T("choice"+(G.bad.includes(s)?" wrong":""),sayS(s),optSyl(s),`data-v="${s}" aria-label="${sayS(s)}" ${G.bad.includes(s)?"disabled":""}`)).join("")}</div>
 <div class="feedback" id="fb"></div></div>`,true);
 if(first)Speech.say(p.autoRead?`${t.w}. Baue das Wort.`:"Baue das Wort.");Input.refresh();
 bind("back",lesson);bind("again",()=>{readWord(t);Input.refresh()});
 app.querySelectorAll(".choice").forEach(b=>b.onclick=async()=>{const myG=G;const fb=document.getElementById("fb"),exp=t.segs[G.filled].toUpperCase();
  Input.pause(true);
  if(b.dataset.v===exp){G.filled++;G.bad=[];
   if(G.filled<t.segs.length){await Speech.say(sayS(exp)+".");if(G!==myG)return;taskBauen(false);return}
   if(!G.wrong)G.ok++;taskBauen(false);Input.pause(true);app.querySelectorAll(".choice").forEach(x=>x.disabled=true);
   await praiseNext(document.getElementById("fb"),fmt(t.w),()=>readWord(t))}
  else{G.wrong++;G.bad.push(b.dataset.v);b.classList.add("wrong");b.disabled=true;fb.className="feedback no";fb.textContent="Noch nicht. Hör genau.";
   await Speech.say("Noch nicht. Hör genau.");await readWord(t);Input.pause(false);Input.refresh()}})}

/* ---------- Zahlen & Rechnen ---------- */
const zw=n=>n===1?"ein":String(n);
const sayEq=(t,withRes)=>`${t.a} ${t.op==="+"?"plus":"minus"} ${t.b}${withRes?` ist ${res(t)}`:""}`;
const res=t=>t.op==="+"?t.a+t.b:t.a-t.b;
const showEq=(t,r)=>`${t.a} ${t.op==="+"?"+":"−"} ${t.b} = ${r===undefined?'<span class="q">?</span>':r}`;
/* Zehnerfeld (2 × 5, "Kraft der Fünf"); bis 20 zwei Felder */
function frames(cells,split){const nf=Math.max(1,Math.ceil(cells.length/10));let h="";
 for(let f=0;f<nf;f++){h+=`<div class="frame${split&&f===0?" ten":""}">`;for(let k=0;k<10;k++){const c=cells[f*10+k];h+=`<span class="cell">${c?`<i class="dot ${c}"></i>`:""}</span>`}h+="</div>"}
 return `<div class="frames" aria-hidden="true">${h}</div>`}
/* ab 21: Zehnerstangen und Einerwürfel */
function rods(n){const t=Math.floor(n/10),u=n%10;
 return `<div class="rods" aria-hidden="true">${Array.from({length:t},()=>`<span class="rod">${"<i></i>".repeat(10)}</span>`).join("")}${u?`<span class="units">${"<i></i>".repeat(u)}</span>`:""}</div>`}
const qty=n=>n<=20?frames(Array(n).fill("d1")):rods(n);
const zeText=n=>{const z=Math.floor(n/10),u=n%10;return n<10?"":n===100?"10 Zehner":`${z} Zehner${u?` · ${u} Einer`:""}`};
const zeSay=n=>{const z=Math.floor(n/10),u=n%10;return n<10?"":n===100?"10 Zehner.":`${zw(z)} Zehner${u?` und ${zw(u)} Einer`:""}.`.replace(/^./,c=>c.toUpperCase())};
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const reverse=n=>n>=12&&n<100&&n%10&&Math.floor(n/10)!==n%10?(n%10)*10+Math.floor(n/10):null;

function numOpts(n,count,lo,hi){const c=[];const add=v=>{if(v!==n&&v>=0&&v<=100&&!c.includes(v))c.push(v)};
 const r=reverse(n);if(r!==null)add(r);[1,-1,2,-2,10,-10,3,-3].forEach(d=>add(n+d));
 const near=c.filter(v=>v>=lo-2&&v<=hi+2);return shuffle([n,...(near.length>=count-1?near:c).slice(0,count-1)])}
function calcOpts(t,count){const r=res(t),c=[];const add=v=>{if(v!==r&&v>=0&&!c.includes(v))c.push(v)};
 if(t.op==="-")add(t.a+t.b);[1,-1,2,-2,3].forEach(d=>add(r+d));return shuffle([r,...c.slice(0,count-1)])}
function genCalc(L){let a,b;
 if(L.op==="+"){if(L.teen){const u=rnd(1,8);a=10+u;b=rnd(1,9-u)}else{a=rnd(1,L.max-1);b=rnd(1,L.max-a)}}
 else{if(L.teen){const u=rnd(2,9);a=10+u;b=rnd(1,u)}else{a=rnd(2,L.max);b=rnd(1,a-1)}}
 return {a,b,op:L.op}}
function calcTasks(L,n){const out=[],seen=new Set();let guard=0;while(out.length<n&&guard++<200){const t=genCalc(L),k=t.a+t.op+t.b;if(!seen.has(k)){seen.add(k);out.push(t)}}return out}

/* Schritte einer Erklärung: Menge zeigen, dazu-/wegnehmen, bei Zahlen über 10 in Zehner und Einer zerlegen */
function calcSteps(t){const {a,b}=t,r=res(t),s=[],A=Array(a).fill("d1");
 if(t.op==="+"){const C=[...A,...Array(b).fill("d2")];
  s.push({cells:A,eq:`${a}`,say:a===1?"Das ist einer.":`Das sind ${a}.`});
  s.push({cells:C,eq:`${a} + ${b}`,say:b===1?"Dazu kommt noch einer.":`Dazu kommen ${b}.`});
  if(a>10){const u=a-10;s.push({cells:C,split:1,eq:`${a} + ${b}`,say:`${a} sind 10 und ${u}. ${u} plus ${b} sind ${u+b}.`});
   s.push({cells:C,split:1,eq:`${a} + ${b} = ${r}`,say:`10 und ${u+b} sind ${r}. Also ist ${a} plus ${b} gleich ${r}.`})}
  else s.push({cells:C,eq:`${a} + ${b} = ${r}`,say:`Zusammen sind es ${r}. ${a} plus ${b} ist ${r}.`})}
 else{const C=[...Array(a-b).fill("d1"),...Array(b).fill("gone")];
  s.push({cells:A,eq:`${a}`,say:`Das sind ${a}.`});
  s.push({cells:C,eq:`${a} − ${b}`,say:b===1?"Wir nehmen einen weg.":`Wir nehmen ${b} weg.`});
  if(a>10){const u=a-10;s.push({cells:C,split:1,eq:`${a} − ${b}`,say:`${a} sind 10 und ${u}. ${u} minus ${b} sind ${u-b}.`});
   s.push({cells:C,split:1,eq:`${a} − ${b} = ${r}`,say:`10 und ${u-b} sind ${r}. Also ist ${a} minus ${b} gleich ${r}.`})}
  else s.push({cells:C,eq:`${a} − ${b} = ${r}`,say:`Übrig bleiben ${r}. ${a} minus ${b} ist ${r}.`})}
 return s}
function explainRun(t,box){const my=++Speech.gen;const steps=calcSteps(t);
 const run=(async()=>{for(const st of steps){if(Speech.gen!==my)return;
  box.innerHTML=`<div class="eqline">${st.eq}</div>${frames(st.cells,st.split)}<p class="say">${st.say}</p>`;
  await Speech.say(st.say,{keep:true});await wait((P()&&P().tts)?350:1800)}})();
 Speech.current=run;return run}

function startNum(type){const [lo,hi]=L.range;
 if(type==="zentdecken"){G={type,pages:L.pages,i:0};return discoverNum()}
 const pool=shuffle(Array.from({length:hi-lo+1},(_,k)=>lo+k));G={type,tasks:pool.slice(0,ROUND),i:0,ok:0,wrong:0};taskNum()}
function startCalc(type){if(type==="sogehts"){G={type,pages:calcTasks(L,4),i:0};return discoverCalc()}
 G={type,tasks:calcTasks(L,ROUND),i:0,ok:0,wrong:0};taskCalc()}

function discoverNum(){const n=G.pages[G.i];const text=n===0?"0. Hier ist kein Punkt.":`${n}. ${zeSay(n)}`.trim();
 view(`${topbar(dotsN(G.pages.length,G.i),false)}
 <div class="stage"><div class="prompt numpage" style="flex:1"><div class="bignum">${n}</div><div>${qty(n)}${n>=10?`<p class="zetext">${zeText(n)}</p>`:""}</div></div>
 <div class="navrow">${T("","Zurück","◀ Zurück",`id="prev" ${G.i===0?"disabled":""}`)}${T("primary","Hören","🔊 Hören",'id="hear"')}${T("","Weiter","Weiter ▶",'id="next"')}</div></div>`,true);
 const speak=()=>{Speech.say(text);Input.refresh()};speak();
 bind("back",lesson);bind("hear",speak);bind("prev",()=>{G.i=Math.max(0,G.i-1);discoverNum()});
 bind("next",()=>{if(G.i<G.pages.length-1){G.i++;discoverNum()}else{const p=P();(p.prog[L.id]=p.prog[L.id]||{}).zentdecken=1;save();result(1,1,"Du hast alle Zahlen angeschaut!")}})}

function taskNum(){const p=P(),t=G.tasks[G.i];G.wrong=0;const n=Math.min(p.choices,4),[lo,hi]=L.range;
 const opts=numOpts(t,n,lo,hi);let prompt,say;
 if(G.type==="wieviele"){prompt=`<div>${qty(t)}</div><p class="ask">Wie viele sind es?</p>`;
  say=t<=10?"Wie viele Punkte sind es?":t<=20?"Wie viele Punkte sind es? Ein volles Feld sind 10.":"Wie viele sind es? Eine Stange sind 10, ein Würfel ist 1."}
 else{prompt=`<div class="pic" aria-hidden="true">👂</div><p class="ask">Welche Zahl hörst du?</p>`;say=`Welche Zahl hörst du? ${t}.`}
 view(`${topbar(dotsN(G.tasks.length,G.i))}<div class="stage"><div class="prompt">${prompt}</div>
 <div class="choices" style="--n:${n}">${opts.map(v=>T("choice num",String(v),String(v),`data-v="${v}" aria-label="${v}"`)).join("")}</div>
 <div class="feedback" id="fb"></div></div>`,true);
 Speech.say(say);Input.refresh();
 bind("back",lesson);bind("again",()=>{Speech.say(G.type==="zhoeren"?`${t}.`:say);Input.refresh()});
 app.querySelectorAll(".choice").forEach(b=>b.onclick=async()=>{const myG=G;const fb=document.getElementById("fb"),v=+b.dataset.v;
  if(v===t){Input.pause(true);b.classList.add("right");if(!G.wrong)G.ok++;app.querySelectorAll(".choice").forEach(x=>x.disabled=true);
   const msg=PRAISE[Math.random()*PRAISE.length|0];fb.className="feedback ok";fb.textContent=`${msg} ${t}${t>=10?" – "+zeText(t):""}`;
   await Speech.say(G.type==="wieviele"?`${msg} Es sind ${t}.`:`${msg} ${t}.`);await wait(500);if(G!==myG)return;G.i++;G.i<G.tasks.length?taskNum():finish()}
  else{G.wrong++;b.classList.add("wrong");b.disabled=true;fb.className="feedback no";Input.pause(true);let s;
   const z=Math.floor(t/10),u=t%10;
   if(G.type==="zhoeren"&&reverse(t)===v){s=`Das ist ${v}. Bei ${t} hörst du zuerst die ${u}. Geschrieben wird aber zuerst die ${z}, denn das sind ${zw(z)} Zehner.`}
   else if(G.type==="zhoeren"){s=`Das ist ${v}. Hör genau: ${t}.`}
   else if(t<=10){s=`Noch nicht. Wir zählen zusammen: ${Array.from({length:t},(_,k)=>k+1).join(", ")}.`}
   else if(t<=20){s="Noch nicht. Ein volles Feld sind 10."+(u===1?" Dazu kommt noch einer.":u?` Dazu kommen ${u}.`:t===20?" Das sind 2 Zehner.":"")}
   else s=`Noch nicht. Zähle die Stangen: ${zw(z)} Zehner.`+(u?` Dann die Würfel: ${zw(u)} Einer.`:"");
   fb.textContent=s.replace(/ Wir zählen.*/,"").replace(/\. Hör genau.*/,". Hör genau hin.");
   await Speech.say(s);Input.pause(false);Input.refresh()}})}

function discoverCalc(){const t=G.pages[G.i];
 view(`${topbar(dotsN(G.pages.length,G.i),false)}
 <div class="stage"><div class="prompt explain" id="ex" style="flex:1"></div>
 <div class="navrow">${T("","Zurück","◀ Zurück",`id="prev" ${G.i===0?"disabled":""}`)}${T("primary","Nochmal erklären","🔊 Nochmal",'id="hear"')}${T("","Weiter","Weiter ▶",'id="next"')}</div></div>`,true);
 const ex=document.getElementById("ex");const go=()=>{explainRun(t,ex);Input.refresh()};go();
 bind("back",lesson);bind("hear",go);bind("prev",()=>{G.i=Math.max(0,G.i-1);discoverCalc()});
 bind("next",()=>{if(G.i<G.pages.length-1){G.i++;discoverCalc()}else{const p=P();(p.prog[L.id]=p.prog[L.id]||{}).sogehts=1;save();result(1,1,"Du kennst jetzt den Rechenweg!")}})}

function taskCalc(){const p=P(),t=G.tasks[G.i],r=res(t);G.wrong=0;const n=Math.min(p.choices,4);const opts=calcOpts(t,n);
 const pic=G.type==="bildrechnen"?frames(t.op==="+"?[...Array(t.a).fill("d1"),...Array(t.b).fill("d2")]:[...Array(t.a-t.b).fill("d1"),...Array(t.b).fill("gone")]):"";
 const say=`Wie viel ist ${sayEq(t)}?`;
 view(`${topbar(dotsN(G.tasks.length,G.i))}<div class="stage"><div class="prompt explain" id="ex"><div class="eqline big" id="eq">${showEq(t)}</div>${pic}</div>
 <div class="choices" style="--n:${n}">${opts.map(v=>T("choice num",String(v),String(v),`data-v="${v}" aria-label="${v}"`)).join("")}</div>
 <div class="feedback" id="fb"></div></div>`,true);
 Speech.say(say);Input.refresh();
 bind("back",lesson);bind("again",()=>{Speech.say(say);Input.refresh()});
 app.querySelectorAll(".choice").forEach(b=>b.onclick=async()=>{const myG=G;const fb=document.getElementById("fb"),v=+b.dataset.v;
  if(v===r){Input.pause(true);b.classList.add("right");if(!G.wrong)G.ok++;app.querySelectorAll(".choice").forEach(x=>x.disabled=true);
   const eq=document.getElementById("eq");if(eq)eq.innerHTML=showEq(t,r);
   const msg=PRAISE[Math.random()*PRAISE.length|0];fb.className="feedback ok";fb.textContent=`${msg} ${t.a} ${t.op==="+"?"+":"−"} ${t.b} = ${r}`;
   await Speech.say(`${msg} ${sayEq(t,true)}.`);await wait(500);if(G!==myG)return;G.i++;G.i<G.tasks.length?taskCalc():finish()}
  else{G.wrong++;b.classList.add("wrong");b.disabled=true;fb.className="feedback no";fb.textContent="Noch nicht. Ich erkläre es dir.";Input.pause(true);
   await Speech.say("Noch nicht. Ich erkläre es dir.");await explainRun(t,document.getElementById("ex"));if(G!==myG)return;
   fb.textContent="Jetzt du: Welche Zahl ist richtig?";Input.pause(false);Input.refresh()}})}

/* ---------- Bereich für Erwachsene ---------- */
/* ---------- Malen: Ausmalbilder zum Antippen und freies Malen ---------- */
/* Hinweis auf die Bücher: bewusst ohne Link (Regeln für Kinder-Apps in den Stores) */
const BOOKS={name:"Die Malbücher von Tim Kipper",
 list:[{id:"einfach",t:"Einfach malen & basteln",d:"Spezial-Ausgabe in Leichter Sprache: große Formen, dicke Linien, Malen, Schneiden und Kleben",app:"Einfache Bilder"},
  {id:"lernen",t:"Malen und lernen",d:"Reihe „Lernen“, ab 5 Jahren: Buchstaben nachspuren, Silben klatschen, Zählen und Rechnen",app:"Bilder zu den Buchstaben"},
  {id:"spass",t:"Mal mit mir!",d:"Reihe „Spaß & Entdecken“, ab 3 Jahren: Tiere und Fahrzeuge mit dicken Linien",app:"Tiere"},
  {id:"kreativ",t:"Natur & Muster",d:"Reihe „Kreativ & Entspannen“: Mandalas und Motive für Jugendliche und Erwachsene",app:""}],
 hint:"Alle Bilder stammen aus den Malbüchern von Tim Kipper: „Einfach malen & basteln“, „Malen und lernen“ und „Mal mit mir!“. Darin gibt es noch viel mehr zum Ausmalen und Basteln."};
/* Ausmalbilder aus Tims Malbüchern (motifs.js): {id,w,l,books,n,lvl,src} */
const MOTIFS=MOTIF_LIST;
const motifUrl=m=>m.src;
const LVL=["","leicht","mittel","knifflig"];
const PSZ=800;const hex=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));
/* Zerlegt ein Linienbild in Flächen (funktioniert auch mit Bildern aus den Malbüchern) */
async function prepMotif(m){if(m.prep)return m.prep;
 const img=new Image();img.src=m.src;await img.decode();
 const c=document.createElement("canvas");c.width=c.height=PSZ;const g=c.getContext("2d");g.fillStyle="#fff";g.fillRect(0,0,PSZ,PSZ);g.drawImage(img,0,0,PSZ,PSZ);
 const d=g.getImageData(0,0,PSZ,PSZ).data,N=PSZ*PSZ,raw=new Int32Array(N).fill(-1),line=new Uint8Array(N);
 for(let i=0;i<N;i++)line[i]=(d[i*4]+d[i*4+1]+d[i*4+2])<510?1:0;
 const stack=new Int32Array(N),regs=[];
 for(let s=0;s<N;s++){if(line[s]||raw[s]!==-1)continue;const id=regs.length,px=[];let sp=0,sx=0,sy=0;stack[sp++]=s;raw[s]=id;
  while(sp){const p=stack[--sp],x=p%PSZ,y=(p/PSZ)|0;px.push(p);sx+=x;sy+=y;
   const nb=[x>0?p-1:-1,x<PSZ-1?p+1:-1,y>0?p-PSZ:-1,y<PSZ-1?p+PSZ:-1];
   for(const q of nb)if(q>=0&&!line[q]&&raw[q]===-1){raw[q]=id;stack[sp++]=q}}
  regs.push({px:Uint32Array.from(px),cx:sx/px.length,cy:sy/px.length})}
 const keep=regs.map((r,i)=>({r,i})).filter(o=>o.r.px.length>=150).sort((a,b)=>Math.round(a.r.cy/90)-Math.round(b.r.cy/90)||a.r.cx-b.r.cx);
 const map=new Int32Array(regs.length).fill(-1);keep.forEach((o,k)=>map[o.i]=k);
 const lab=new Int32Array(N);for(let i=0;i<N;i++)lab[i]=raw[i]<0?-1:map[raw[i]];
 const out=keep.map(o=>{const r=o.r;let best=r.px[0],bd=1e18;for(const p of r.px){const dx=p%PSZ-r.cx,dy=((p/PSZ)|0)-r.cy,dd=dx*dx+dy*dy;if(dd<bd){bd=dd;best=p}}
  return {px:r.px,ax:best%PSZ,ay:(best/PSZ)|0}});
 return (m.prep={c,lab,regs:out})}
let PM=null;
function subjBar(p){return `<div class="subjects" role="group" aria-label="Fach">${SUBJECTS.map(([k,l])=>T("subj"+(p.subject===k?" on":""),l.replace(/^\S+ /,""),l,`data-s="${k}" aria-pressed="${p.subject===k}"`)).join("")}</div>`}
function bindSubj(p){app.querySelectorAll("[data-s]").forEach(b=>b.onclick=()=>{p.subject=b.dataset.s;save();menu()})}
function malMenu(){const p=P();PM=null;const scan=Input.mode().startsWith("scan");
 view(`<div class="bar">${T("","Zurück zur Startseite","⌂ Start",'id="home"')}<div class="grow"><h1 class="hi">${p.face} Hallo ${esc(p.name)}!</h1></div></div>
 ${subjBar(p)}
 <div class="chapters malen">${BOOKS.list.filter(bk=>bk.app).map(bk=>{const ms=MOTIFS.filter(m=>m.books.includes(bk.id));if(!ms.length)return "";
  return `<section class="chapter c5" aria-label="${bk.app}"><header class="chhead"><div class="badge">Aus dem Malbuch „${bk.t}“</div><h2>${bk.app}</h2><p>Farbe wählen und auf eine Fläche tippen</p></header>
 <div class="motifs">${ms.map(m=>T("motif",m.w,`<span class="mthumb" aria-hidden="true"><img src="${m.src}" alt=""></span><b>${m.w}</b>${m.l&&bk.id==="lernen"?`<span class="ml">${fmtL1(m.l)} wie ${m.w}</span>`:""}<span class="lvl l${m.lvl}">${LVL[m.lvl]}</span>${p.paint&&p.paint[m.id]?'<span class="chip">angefangen</span>':""}`,`data-m="${m.id}"`)).join("")}</div></section>`}).join("")}
 <section class="chapter c5" aria-label="Freies Malen und meine Bilder"><header class="chhead"><div class="badge">Selbst malen</div><h2>Freies Malen</h2><p>${scan?"Freies Malen geht mit Tippen oder Maus. Mit Tasten lieber Bilder ausmalen.":"Mit dem Finger oder der Maus malen"}</p></header>
 <div class="motifs">${T("motif",`Freies Malen`,`<span class="mthumb big" aria-hidden="true">🖌️</span><b>Leeres Blatt</b>`,`id="free" ${scan?"disabled":""}`)}</div>
 <header class="chhead"><h2>Meine Bilder</h2><p>${p.gallery.length?`${p.gallery.length} ${p.gallery.length===1?"Bild":"Bilder"}`:"Hier erscheinen deine fertigen Bilder."}</p></header>
 <div class="gallery">${p.gallery.map((g,i)=>T("gpic",`Mein Bild ${i+1}`,`<img src="${g.img}" alt="">`,`data-g="${i}"`)).join("")}</div>
 <p class="note books">📚 ${BOOKS.hint}</p></section></div>`,true);
 Speech.say("Was möchtest du malen?");Input.refresh();bindSubj(p);bind("home",home);bind("free",freePaint);
 app.querySelectorAll("[data-m]").forEach(b=>b.onclick=()=>paintOpen(MOTIFS.find(m=>m.id===b.dataset.m),malMenu));
 app.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>showPic(+b.dataset.g))}
async function paintOpen(m,ret){const p=P();const prep=await prepMotif(m);const sv=p.paint&&p.paint[m.id];
 PM={m,prep,ret:ret||malMenu,cols:sv&&sv.length===prep.regs.length?sv.slice():Array(prep.regs.length).fill(null),color:null,undo:[],phase:"color",hl:-1};
 paintView(true)}
function paintView(first){const scan=Input.mode().startsWith("scan"),area=scan&&PM.phase==="area";
 view(`<div class="bar paintbar">${T("","Zurück","◀ Bilder",`id="back" ${area?"disabled":""}`)}<div class="grow"><h1 class="hi">${PM.m.w}</h1></div>${T("","Rückgängig","↶ Rückgängig",`id="undo" ${area||!PM.undo.length?"disabled":""}`)}${T("primary","Fertig","✓ Fertig",`id="done" ${area?"disabled":""}`)}</div>
 <div class="paint"><div class="pwrap"><canvas id="pc" width="${PSZ}" height="${PSZ}" role="img" aria-label="Ausmalbild ${PM.m.w}"></canvas><canvas id="po" width="${PSZ}" height="${PSZ}" aria-hidden="true"></canvas>
 ${PM.prep.regs.map((r,i)=>`<button class="tgt reg" data-r="${i}" data-say="" style="left:${r.ax/PSZ*100}%;top:${r.ay/PSZ*100}%" aria-label="Fläche ${i+1}" ${area?"":"disabled"}></button>`).join("")}</div>
 <div class="pal" role="group" aria-label="Farben">${area?T("primary swap","Andere Farbe",`<i style="background:${PM.color}"></i><span>Andere Farbe</span>`,'id="swap"'):COLORS.map(([n,c])=>T("col"+(PM.color===c?" on":""),n,`<i style="background:${c}"></i><span>${n}</span>`,`data-c="${c}" aria-pressed="${PM.color===c}"`)).join("")}</div></div>`,true);
 paintRender();
 if(first)Speech.say(scan?"Wähle eine Farbe.":"Wähle eine Farbe. Dann tippe auf eine Fläche.");
 bind("back",()=>PM.ret());bind("done",paintDone);
 bind("undo",()=>{const u=PM.undo.pop();if(u){PM.cols[u[0]]=u[1];paintSave();paintView()}});
 bind("swap",()=>{PM.phase="color";PM.hl=-1;paintView();Speech.say("Wähle eine Farbe.")});
 app.querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{PM.color=b.dataset.c;const n=COLORS.find(x=>x[1]===PM.color)[0];
  if(scan){PM.phase="area";paintView();Speech.say(n+".")}else{app.querySelectorAll("[data-c]").forEach(x=>{x.classList.toggle("on",x===b);x.setAttribute("aria-pressed",x===b)});Speech.say(n+".")}});
 app.querySelectorAll(".reg").forEach(b=>{const i=+b.dataset.r;b.onclick=()=>{paintFill(i);Input.startAt=i+1;Input.refresh()};
  b.addEventListener("scanfocus",()=>{PM.hl=i;paintOverlay()})});
 const cv=document.getElementById("pc");
 cv.addEventListener("click",e=>{if(Input.mode().startsWith("scan"))return;const r=regAt(e);if(r>=0)paintFill(r)});
 let dw=null,dr=-1;cv.addEventListener("pointermove",e=>{if(Input.mode()!=="dwell")return;const r=regAt(e);if(r===dr)return;dr=r;clearTimeout(dw);PM.hl=r;paintOverlay();
  if(r>=0)dw=setTimeout(()=>{paintFill(r);dr=-1;PM.hl=-1;paintOverlay()},P().dwellMs)});
 cv.addEventListener("pointerleave",()=>{clearTimeout(dw);dr=-1;PM.hl=-1;paintOverlay()})}
function regAt(e){const cv=document.getElementById("pc"),b=cv.getBoundingClientRect();
 const x=Math.floor((e.clientX-b.left)/b.width*PSZ),y=Math.floor((e.clientY-b.top)/b.height*PSZ);return x<0||y<0||x>=PSZ||y>=PSZ?-1:PM.prep.lab[y*PSZ+x]}
function paintFill(i){if(!PM.color){Speech.say("Wähle zuerst eine Farbe.");return}
 if(PM.cols[i]===PM.color)return;PM.undo.push([i,PM.cols[i]]);PM.undo=PM.undo.slice(-30);PM.cols[i]=PM.color;paintSave();paintRender();
 const u=document.getElementById("undo");if(u&&!(Input.mode().startsWith("scan")&&PM.phase==="area"))u.disabled=false}
function paintSave(){const p=P();p.paint=p.paint||{};p.paint[PM.m.id]=PM.cols;save()}
function paintRender(){const cv=document.getElementById("pc");if(!cv)return;const g=cv.getContext("2d"),im=g.createImageData(PSZ,PSZ),D=im.data;D.fill(255);
 PM.prep.regs.forEach((r,i)=>{const c=PM.cols[i];if(!c)return;const [R,G2,B]=hex(c);for(const p of r.px){const k=p*4;D[k]=R;D[k+1]=G2;D[k+2]=B}});
 g.putImageData(im,0,0);g.globalCompositeOperation="multiply";g.drawImage(PM.prep.c,0,0);g.globalCompositeOperation="source-over";paintOverlay()}
function paintOverlay(){const o=document.getElementById("po");if(!o)return;const g=o.getContext("2d");g.clearRect(0,0,PSZ,PSZ);if(!(PM.hl>=0))return;
 const im=g.createImageData(PSZ,PSZ),D=im.data;for(const p of PM.prep.regs[PM.hl].px){const k=p*4;D[k]=255;D[k+1]=176;D[k+2]=0;D[k+3]=140}g.putImageData(im,0,0)}
function snapshot(){const cv=document.getElementById("pc"),t=document.createElement("canvas");t.width=t.height=600;const g=t.getContext("2d");g.fillStyle="#fff";g.fillRect(0,0,600,600);g.drawImage(cv,0,0,600,600);return t.toDataURL("image/jpeg",.85)}
function addGallery(img,m){const p=P();p.gallery=[{img,m,ts:Date.now()},...(p.gallery||[])].slice(0,12);save()}
function paintDone(){const img=snapshot();if(!PM.free&&!PM.cols.some(Boolean)){Speech.say("Male zuerst etwas an.");return}
 addGallery(img,PM.free?"frei":PM.m.id);const m=PM.m,free=PM.free,ret=PM.ret;
 view(`<div class="result"><h2>Toll gemalt!</h2><img class="donepic" src="${img}" alt="Dein fertiges Bild">
 <div class="rowbtns">${T("primary","Weiter malen","🎨 Weiter malen",'id="more"')}${T("","Drucken","🖨️ Drucken",'id="print"')}${T("","Zur Bildauswahl","Zur Bildauswahl",'id="menu"')}</div>
 <p class="note books">📚 ${BOOKS.hint}</p></div>`,true);
 Speech.say("Toll gemalt!");Input.refresh();
 bind("more",()=>free?freePaint():paintOpen(m,ret));bind("print",()=>printImg(img,free?"Mein Bild":m.w));bind("menu",malMenu)}
function showPic(i){const p=P(),g=p.gallery[i];if(!g)return malMenu();
 view(`<div class="result"><img class="donepic" src="${g.img}" alt="Mein Bild"><div class="rowbtns">${T("","Zurück","◀ Zurück",'id="menu"')}${T("","Drucken","🖨️ Drucken",'id="print"')}</div></div>`,true);
 Input.refresh();bind("menu",malMenu);bind("print",()=>printImg(g.img,"Mein Bild"))}
function printImg(src,title){let pr=document.getElementById("print-area");if(!pr){pr=document.createElement("div");pr.id="print-area";document.body.appendChild(pr)}
 pr.innerHTML=`<h1>${esc(title)}</h1><img src="${src}" alt=""><p>${esc(BOOKS.hint)}</p>`;const im=pr.querySelector("img");
 const go=()=>{try{window.print()}catch(e){}};im.complete?setTimeout(go,50):im.onload=go}
/* Freies Malen mit Finger oder Maus */
function freePaint(){PM={free:true,color:"#1E63C8",size:22,undo:[],ret:malMenu};
 const SZ=[["Dünn",10],["Mittel",22],["Dick",44]];
 view(`<div class="bar paintbar">${T("","Zurück","◀ Bilder",'id="back"')}<div class="grow"><h1 class="hi">Freies Malen</h1></div>${T("","Rückgängig","↶ Rückgängig",'id="undo"')}${T("","Neues Blatt","🗑 Neu",'id="clear"')}${T("primary","Fertig","✓ Fertig",'id="done"')}</div>
 <div class="paint"><div class="pwrap"><canvas id="pc" width="${PSZ}" height="${PSZ}" role="img" aria-label="Leeres Blatt zum Malen"></canvas></div>
 <div class="pal" role="group" aria-label="Farben und Pinsel">${COLORS.map(([n,c])=>T("col"+(PM.color===c?" on":""),n,`<i style="background:${c}"></i><span>${n}</span>`,`data-c="${c}"`)).join("")}
 ${SZ.map(([n,s])=>T("col sz"+(PM.size===s?" on":""),n+"er Pinsel",`<i style="width:${Math.max(10,s*.8)}px;height:${Math.max(10,s*.8)}px;background:var(--fg)"></i><span>${n}</span>`,`data-s2="${s}"`)).join("")}</div></div>`,true);
 Speech.say("Male mit dem Finger.");Input.refresh();
 const cv=document.getElementById("pc"),g=cv.getContext("2d");g.fillStyle="#fff";g.fillRect(0,0,PSZ,PSZ);g.lineCap=g.lineJoin="round";
 let down=false,last=null;const pt=e=>{const b=cv.getBoundingClientRect();return [(e.clientX-b.left)/b.width*PSZ,(e.clientY-b.top)/b.height*PSZ]};
 cv.addEventListener("pointerdown",e=>{down=true;cv.setPointerCapture(e.pointerId);PM.undo.push(g.getImageData(0,0,PSZ,PSZ));PM.undo=PM.undo.slice(-8);last=pt(e);
  g.fillStyle=PM.color;g.beginPath();g.arc(last[0],last[1],PM.size/2,0,7);g.fill()});
 cv.addEventListener("pointermove",e=>{if(!down)return;const q=pt(e);g.strokeStyle=PM.color;g.lineWidth=PM.size;g.beginPath();g.moveTo(last[0],last[1]);g.lineTo(q[0],q[1]);g.stroke();last=q});
 ["pointerup","pointercancel"].forEach(t=>cv.addEventListener(t,()=>{down=false}));
 bind("back",malMenu);bind("done",paintDone);bind("undo",()=>{const u=PM.undo.pop();if(u)g.putImageData(u,0,0)});
 let arm=false;bind("clear",()=>{if(!arm){arm=true;Speech.say("Nochmal tippen, dann ist das Blatt leer.");setTimeout(()=>arm=false,3000);return}
  PM.undo.push(g.getImageData(0,0,PSZ,PSZ));g.fillStyle="#fff";g.fillRect(0,0,PSZ,PSZ);arm=false});
 app.querySelectorAll("[data-c]").forEach(b=>b.onclick=()=>{PM.color=b.dataset.c;app.querySelectorAll("[data-c]").forEach(x=>x.classList.toggle("on",x===b));Speech.say(COLORS.find(x=>x[1]===PM.color)[0]+".")});
 app.querySelectorAll("[data-s2]").forEach(b=>b.onclick=()=>{PM.size=+b.dataset.s2;app.querySelectorAll("[data-s2]").forEach(x=>x.classList.toggle("on",x===b))})}

/* ---------- Basteln: Schritt-für-Schritt-Anleitungen mit Bastelbögen aus „Einfach malen & basteln“ ---------- */
const CR=CRAFTS;
const TOOL_SVG={
 schere:`<svg viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"><circle cx="14" cy="20" r="8"/><circle cx="14" cy="44" r="8"/><path d="M21 24 L56 41 M21 40 L56 23"/></g></svg>`,
 stift:`<svg viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"><path d="M10 54 L14 40 L42 12 L52 22 L24 50 Z"/><path d="M36 18 L46 28 M14 40 L24 50"/></g></svg>`,
 kleber:`<svg viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"><rect x="21" y="24" width="22" height="34" rx="3"/><rect x="23" y="8" width="18" height="16" rx="2" fill="currentColor"/><path d="M28 36 H36 M28 44 H36"/></g></svg>`,
 bogen:`<svg viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="4.5" stroke-linejoin="round"><path d="M14 6 H40 L52 18 V58 H14 Z"/><path d="M40 6 V18 H52"/><path d="M20 36 H46" stroke-dasharray="5 4"/></g></svg>`,
 haken:`<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" stroke-width="4.5"/><path d="M19 33 L28 42 L46 22" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`};
/* Bildausschnitte aus den Bastelbögen werden im Browser zugeschnitten */
const cropImg=(c,cls="")=>`<img class="crop ${cls}" data-p="${c.p}" data-r="${c.r.join(",")}" alt="">`;
const _pg={},_cr={};
function pageImg(k){return _pg[k]||(_pg[k]=new Promise(res=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>res(null);im.src=CR.pages[k]}))}
async function hydrateCrops(){for(const el of app.querySelectorAll("img.crop:not([src])")){const key=el.dataset.p+"|"+el.dataset.r;
 if(!_cr[key]){const im=await pageImg(el.dataset.p);if(!im)continue;const [x0,y0,x1,y1]=el.dataset.r.split(",").map(Number);
  const sw=(x1-x0)*im.width,sh=(y1-y0)*im.height,sc=Math.min(1,900/Math.max(sw,sh)),c=document.createElement("canvas");
  c.width=Math.round(sw*sc);c.height=Math.round(sh*sc);const g=c.getContext("2d");g.fillStyle="#fff";g.fillRect(0,0,c.width,c.height);
  g.drawImage(im,x0*im.width,y0*im.height,sw,sh,0,0,c.width,c.height);_cr[key]=c.toDataURL("image/png")}
 el.src=_cr[key]}}
const craftBook=()=>BOOKS.list.find(b=>b.id===(CR.book||"einfach"));
function bastelMenu(){const p=P();p.craft=p.craft||{};const bk=craftBook();
 view(`<div class="bar">${T("","Zurück zur Startseite","⌂ Start",'id="home"')}<div class="grow"><h1 class="hi">${p.face} Hallo ${esc(p.name)}!</h1></div></div>
 ${subjBar(p)}
 <div class="chapters malen"><section class="chapter c6" aria-label="Basteln"><header class="chhead"><div class="badge">Aus dem Buch „${bk.t}“</div><h2>Basteln</h2><p>Schritt für Schritt: malen, schneiden, kleben</p></header>
 <div class="motifs">${CR.list.map(c=>{const st=p.craft[c.id];return T("motif",c.t,`<span class="mthumb">${cropImg(c.thumb)}</span><b>${c.t}</b><span class="stufe">${"●".repeat(c.lvl)}${"○".repeat(2-c.lvl)} Stufe ${c.lvl}</span>${st&&st.done?'<span class="chip okc">✓ geschafft</span>':st&&st.i?`<span class="chip">Schritt ${st.i+1} von ${c.steps.length}</span>`:""}`,`data-k="${c.id}"`)}).join("")}</div></section>
 <section class="chapter c6" aria-label="Hinweise"><header class="chhead"><div class="badge">So geht das Basteln</div><h2>Die Zeichen</h2></header>
 <ul class="need">${["stift","schere","kleber","haken"].map(t=>`<li><span class="tool">${TOOL_SVG[t]}</span>${{stift:"Male das Bild an.",schere:"Schneide auf der Linie aus.",kleber:"Klebe das Teil auf.",haken:"Ich bin fertig."}[t]}</li>`).join("")}</ul>
 <p class="note">Für Erwachsene: Den Bastelbogen vorher ausdrucken, nur einseitig. Für Kinder eine Schere mit runder Spitze nehmen.</p>
 <p class="note books">📚 ${BOOKS.hint}</p></section></div>`,true);
 hydrateCrops();Speech.say("Was möchtest du basteln?");Input.refresh();bindSubj(p);bind("home",home);
 app.querySelectorAll("[data-k]").forEach(b=>b.onclick=()=>craftIntro(CR.list.find(c=>c.id===b.dataset.k)))}
function craftIntro(c){const st=P().craft[c.id]||{};const need=c.need.map(t=>t==="bogen"&&c.pages.length>1?`${c.pages.length} Bastelbögen`:TOOL_NAME[t]);
 view(`<div class="bar">${T("","Zurück zum Basteln","◀ Basteln",'id="back"')}<div class="grow"><h1 class="hi">${c.t}</h1></div></div>
 <div class="stage"><div class="cintro"><div class="cbig">${cropImg(c.thumb)}</div><div><h2>Das brauchst du:</h2>
 <ul class="need">${c.need.map((t,k)=>`<li><span class="tool">${TOOL_SVG[t]}</span>${need[k]}</li>`).join("")}</ul></div></div>
 <div class="rowbtns">${T("primary","Los geht's","Los geht's ▶",'id="go"')}${st.i&&!st.done?T("",`Weiter bei Schritt ${st.i+1}`,`Weiter bei Schritt ${st.i+1}`,'id="cont"'):""}${T("","Bastelbogen drucken","🖨️ Bastelbogen drucken",'id="print"')}</div></div>`,true);
 hydrateCrops();Speech.say(`${c.t}. Das brauchst du: ${need.join(", ")}.`);Input.refresh();
 bind("back",bastelMenu);bind("go",()=>craftStep(c,0));bind("cont",()=>craftStep(c,st.i));bind("print",()=>printPages(c.pages.map(k=>CR.pages[k])))}
function craftStep(c,i){const s=c.steps[i],p=P();p.craft[c.id]={...(p.craft[c.id]||{}),i};save();const last=i===c.steps.length-1;
 const say=`Schritt ${i+1}. ${s.text}`;
 view(`<div class="bar">${T("","Zurück zum Basteln","◀ Basteln",'id="back"')}<div class="grow">${dotsN(c.steps.length,i)}</div>${T("","Nochmal hören","🔊 Nochmal",'id="again"')}</div>
 <div class="stage cstep"><div class="ctext"><span class="tool big">${TOOL_SVG[s.tool]}</span><p><span class="badge">Schritt ${i+1} von ${c.steps.length}</span><br>${esc(s.text)}</p></div>
 <div class="cimg">${cropImg(s.img)}</div>
 ${s.paint&&MOTIFS.some(m=>m.id===s.paint)?`<div class="rowbtns">${T("","Erst in der App ausmalen","🎨 Erst in der App ausmalen",'id="paint"')}</div>`:""}
 <div class="navrow">${T("","Zurück","◀ Zurück",`id="prev" ${i===0?"disabled":""}`)}${T("","Hören","🔊 Hören",'id="hear"')}${T("primary",last?"Fertig":"Weiter",last?"✓ Fertig":"Weiter ▶",'id="next"')}</div></div>`,true);
 hydrateCrops();Speech.say(say);Input.refresh();
 bind("back",bastelMenu);bind("again",()=>{Speech.say(say);Input.refresh()});bind("hear",()=>{Speech.say(say);Input.refresh()});
 bind("prev",()=>craftStep(c,Math.max(0,i-1)));bind("next",()=>last?craftDone(c):craftStep(c,i+1));
 bind("paint",()=>paintOpen(MOTIFS.find(m=>m.id===s.paint),()=>craftStep(c,i)))}
function craftDone(c){const p=P();p.craft[c.id]={i:0,done:true};save();
 view(`<div class="result"><h2>Du hast es geschafft!</h2><div class="stars" role="img" aria-label="3 Sterne">${[0,1,2].map(k=>starSvg(true,k)).join("")}</div>
 <div class="cdone">${cropImg(c.steps[c.steps.length-1].img)}</div>
 <div class="rowbtns">${T("primary","Noch etwas basteln","✂️ Noch etwas basteln",'id="menu"')}${T("","Nochmal von vorn","↻ Nochmal",'id="again2"')}</div>
 <p class="note books">📚 ${BOOKS.hint}</p></div>`,true);
 hydrateCrops();Speech.say("Du hast es geschafft! Toll gemacht.");Input.refresh();bind("menu",bastelMenu);bind("again2",()=>craftStep(c,0))}
function printPages(srcs){let pr=document.getElementById("print-area");if(!pr){pr=document.createElement("div");pr.id="print-area";document.body.appendChild(pr)}
 pr.innerHTML=srcs.map(s=>`<div class="ppage"><img src="${s}" alt=""></div>`).join("");
 const ims=[...pr.querySelectorAll("img")];Promise.all(ims.map(im=>im.complete?1:new Promise(r=>{im.onload=im.onerror=r}))).then(()=>{try{window.print()}catch(e){}})}

let editId=null,delArm=false;
function adult(){S.cur=null;editId=editId&&S.profiles.find(p=>p.id===editId)?editId:S.profiles[0]?.id;delArm=false;renderAdult()}
function renderAdult(){const p=S.profiles.find(x=>x.id===editId);
 const sel=(id,label,val,opts)=>`<label class="f">${label}<select id="${id}">${opts.map(([v,t])=>`<option value="${v}" ${String(v)===String(val)?"selected":""}>${t}</option>`).join("")}</select></label>`;
 const chk=(id,label,val)=>`<label class="c"><input type="checkbox" id="${id}" ${val?"checked":""}>${label}</label>`;
 const names={entdecken:"Entdecken",anlaut:"Anlaut",wortbild:"Wort & Bild",silben:"Silben entdecken",hoeren:"Silbe hören",bauen:"Wörter bauen",zentdecken:"Zahlen entdecken",wieviele:"Wie viele?",zhoeren:"Zahl hören",sogehts:"So geht's",bildrechnen:"Rechnen mit Bildern",rechnen:"Rechnen"};const lnum=id=>{const x=LESSONS.find(y=>y.id===id);return x?lname(x)+" · ":""};
 view(`<div class="bar"><button class="plain" id="out">⌂ Zurück zum Kinderbereich</button><div class="grow"><h1>Einstellungen für Erwachsene</h1></div></div>
 <div class="adult"><div class="plist">${S.profiles.map(x=>`<button data-id="${x.id}" aria-current="${x.id===editId}">${x.face} ${esc(x.name)}${x.example?' <span class="badge">Beispiel</span>':""}</button>`).join("")}
 <button class="plain" id="add">＋ Neues Profil</button></div>
 ${p?`<form class="settings" id="f">
 <fieldset><legend>Kind</legend><label class="f">Name<input type="text" id="name" value="${esc(p.name)}"></label>
 ${sel("face","Symbol",p.face,FACES.map(f=>[f,f]))}</fieldset>
 <fieldset><legend>Bedienung</legend>
 ${sel("mode","Bedienart",p.mode,[["touch","Tippen / Klicken"],["dwell","Verweilen (Augensteuerung, Kopfmaus)"],["scan1","1 Taste: automatischer Durchlauf"],["scan2","2 Tasten: Leertaste = weiter, Enter = wählen"]])}
 ${sel("scanMs","Durchlauf-Tempo",p.scanMs,[[1200,"schnell (1,2 s)"],[2000,"mittel (2 s)"],[3000,"langsam (3 s)"],[4500,"sehr langsam (4,5 s)"]])}
 ${sel("dwellMs","Verweilzeit",p.dwellMs,[[800,"0,8 s"],[1500,"1,5 s"],[2500,"2,5 s"]])}
 ${chk("scanSpeak","Beim Durchlauf vorlesen",p.scanSpeak)}</fieldset>
 <fieldset><legend>Aufgaben</legend>
 ${sel("choices","Antworten zur Auswahl",p.choices,[[2,"2"],[3,"3"],[4,"4"]])}
 ${sel("caps","Schrift",p.caps,[[true,"GROSSBUCHSTABEN"],[false,"Groß- und Kleinbuchstaben"]])}
 ${chk("laut","Buchstaben als Laut sprechen („mmm“ statt „em“)",p.laut)}${chk("autoRead","„Wort und Bild“: Wort vorlesen",p.autoRead)}
 ${chk("sequential","Lektionen nacheinander freischalten",p.sequential)}</fieldset>
 <fieldset><legend>Darstellung & Ton</legend>
 ${sel("size","Größe",p.size,[["normal","normal"],["gross","groß"],["sehrgross","sehr groß"]])}
 ${sel("rate","Sprechtempo",p.rate,[[0.7,"langsam"],[0.9,"normal"],[1.1,"zügig"]])}
 ${chk("tts","Sprachausgabe",p.tts)}${chk("hc","Hoher Kontrast",p.hc)}${chk("calm","Ruhig (keine Animationen)",p.calm)}</fieldset>
 <div class="stats"><b>Lektionen</b><table>${LESSONS.map((x,i)=>{const g=lp(p,x);return `<tr><td>${lname(x)}</td><td>${x.t}</td><td>${"★".repeat(doneCount(p,x))}${"☆".repeat(3-doneCount(p,x))}</td></tr>`}).join("")}</table><b>Zuletzt gespielt</b>${p.log.length?`<table>${p.log.slice(-6).reverse().map(r=>`<tr><td>${new Date(r.ts).toLocaleDateString("de-DE")}</td><td>${lnum(r.l)}${names[r.g]||r.g}</td><td>${r.ok} von ${r.n} beim ersten Versuch</td></tr>`).join("")}</table>`:"<p>Noch keine Runden.</p>"}</div>
 <fieldset><legend>Malen und Basteln</legend><p class="note" style="grid-column:1/-1;margin:0">Ausmalbilder zum Ausdrucken, ohne Farbe. Mehr davon gibt es in den Malbüchern von Tim Kipper.</p>
 <div class="letters">${MOTIFS.map(m=>`<button type="button" class="plain" data-pm="${m.id}">🖨️ ${m.w}</button>`).join("")}</div>
 <p class="note" style="grid-column:1/-1;margin:0">Bastelbögen zum Ausdrucken (einseitig):</p>
 <div class="letters">${CR.list.map(c=>`<button type="button" class="plain" data-pk="${c.id}">🖨️ ${c.t}</button>`).join("")}</div>
 <div style="grid-column:1/-1"><button type="button" class="plain danger" id="delpics">${p.gallery&&p.gallery.length?`Gemalte Bilder löschen (${p.gallery.length})`:"Noch keine gemalten Bilder"}</button></div></fieldset>
 <div class="stats books"><b>📚 ${BOOKS.name}</b><p>Alle Ausmalbilder in der App stammen aus diesen Büchern. Zum Ausdrucken und Weitermalen auf Papier:</p>
 <ul>${BOOKS.list.map(bk=>`<li><b>„${bk.t}“</b> – ${bk.d}</li>`).join("")}</ul></div>
 <div><button class="plain danger" id="del">${delArm?"Wirklich löschen? Nochmal tippen":"Profil löschen"}</button></div>
 </form>`:"<p>Lege ein Profil an.</p>"}</div>`,false);
 bind("out",home);bind("add",()=>{const id="p"+Date.now();S.profiles.push({...clone(DEF),id,name:"Neues Kind",face:FACES[S.profiles.length%FACES.length]});editId=id;save();renderAdult()});
 app.querySelectorAll(".plist [data-id]").forEach(b=>b.onclick=()=>{editId=b.dataset.id;delArm=false;renderAdult()});
 if(!p)return;
 app.querySelectorAll("[data-pm]").forEach(b=>b.onclick=()=>{const m=MOTIFS.find(x=>x.id===b.dataset.pm);printImg(motifUrl(m),m.w+" – zum Ausmalen")});
 app.querySelectorAll("[data-pk]").forEach(b=>b.onclick=()=>{const c=CR.list.find(x=>x.id===b.dataset.pk);printPages(c.pages.map(k=>CR.pages[k]))});
 bind("delpics",()=>{if(!p.gallery||!p.gallery.length)return;p.gallery=[];p.paint={};save();renderAdult()});
 bind("del",()=>{if(!delArm){delArm=true;renderAdult();return}S.profiles=S.profiles.filter(x=>x.id!==p.id);editId=S.profiles[0]?.id;save();renderAdult()});
 const f=document.getElementById("f");f.addEventListener("submit",e=>e.preventDefault());
 f.addEventListener("input",e=>{const el=e.target;if(el.dataset.l){p.letters=[...f.querySelectorAll("[data-l]:checked")].map(x=>x.dataset.l)}
  else if(el.type==="checkbox")p[el.id]=el.checked;
  else if(el.id==="name")p.name=el.value;
  else if(["scanMs","dwellMs","choices","rate"].includes(el.id))p[el.id]=+el.value;
  else if(el.id==="caps")p.caps=el.value==="true";
  else p[el.id]=el.value;
  p.example=false;save();if(el.id!=="name")renderAdult()});
 f.addEventListener("change",e=>{if(e.target.id==="name")renderAdult()})}

load();Speech.init();home();
