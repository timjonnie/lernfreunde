/* Konten und Abgleich mit Firebase (Server in Frankfurt).
   Wird erst nach dem Start nachgeladen, damit der Kinderbereich sofort und ohne Netz läuft.
   Kennt die Datenstruktur der App nicht: main.js liefert und empfängt fertige Profil-Objekte. */
import { initializeApp } from "firebase/app";
import {
  initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, sendPasswordResetEmail, sendEmailVerification, deleteUser, connectAuthEmulator,
} from "firebase/auth";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator,
  collection, doc, setDoc, deleteDoc, getDocs, onSnapshot, writeBatch,
} from "firebase/firestore";

/* Öffentliche Projektkennung (kein Geheimnis): geschützt werden die Daten durch firestore.rules */
const firebaseConfig = {
  apiKey: "AIzaSyBCKJhjsHgVhhFs8_zkWajrTxf4rjYerMo",
  authDomain: "lernfreunde-69dd8.firebaseapp.com",
  projectId: "lernfreunde-69dd8",
  storageBucket: "lernfreunde-69dd8.firebasestorage.app",
  messagingSenderId: "563389426709",
  appId: "1:563389426709:web:9197b40ad3115b9e1c721c",
};
export const CONSENT_VERSION = "2026-11";

const ERR = {
  "auth/invalid-email": "Die E-Mail-Adresse ist ungültig.",
  "auth/missing-password": "Bitte ein Passwort eingeben.",
  "auth/weak-password": "Das Passwort braucht mindestens 6 Zeichen.",
  "auth/email-already-in-use": "Für diese E-Mail gibt es schon ein Konto. Bitte anmelden.",
  "auth/invalid-credential": "E-Mail oder Passwort stimmt nicht.",
  "auth/user-not-found": "E-Mail oder Passwort stimmt nicht.",
  "auth/wrong-password": "E-Mail oder Passwort stimmt nicht.",
  "auth/too-many-requests": "Zu viele Versuche. Bitte in ein paar Minuten nochmal.",
  "auth/network-request-failed": "Keine Internetverbindung.",
  "auth/requires-recent-login": "Bitte einmal ab- und wieder anmelden, dann nochmal versuchen.",
};
export const errText = e => ERR[e && e.code] || "Das hat nicht geklappt. Bitte später nochmal versuchen.";

/* hooks: onUser(user|null), onRemote(changes:[{id,data}], removed:[id]), onStatus("synced"|"pending"|"offline") */
export function createCloud(hooks) {
  const app = initializeApp(firebaseConfig);
  /* initializeAuth statt getAuth: läuft auch in der iOS-App (WKWebView), Anmeldung bleibt gespeichert */
  const auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });
  auth.languageCode = "de";
  const db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) });
  /* nur lokal zum Testen: ?emulator verbindet mit den Firebase-Emulatoren */
  if (location.hostname === "localhost" && new URLSearchParams(location.search).has("emulator")) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
  }
  let stop = null;
  const kids = uid => collection(db, "konten", uid, "kinder");

  onAuthStateChanged(auth, user => {
    if (stop) { stop(); stop = null; }
    hooks.onUser(user ? { uid: user.uid, email: user.email, verified: user.emailVerified } : null);
    if (!user) return;
    stop = onSnapshot(kids(user.uid), { includeMetadataChanges: true }, snap => {
      const changes = [], removed = [];
      snap.docChanges().forEach(c => {
        if (c.type === "removed") removed.push(c.doc.id);
        else if (!c.doc.metadata.hasPendingWrites) changes.push({ id: c.doc.id, data: c.doc.data() });
      });
      if (changes.length || removed.length) hooks.onRemote(changes, removed);
      hooks.onStatus(snap.metadata.hasPendingWrites ? "pending" : snap.metadata.fromCache ? "offline" : "synced");
    }, () => hooks.onStatus("offline"));
  });

  return {
    user: () => auth.currentUser,
    async register(email, password) {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "konten", user.uid), { consent: { version: CONSENT_VERSION, at: Date.now() }, created: Date.now() });
      sendEmailVerification(user).catch(() => {});
    },
    signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
    signOut: () => signOut(auth),
    resetPassword: email => sendPasswordResetEmail(auth, email),
    /* Profil speichern; offline landet es in der Warteschlange und wird später übertragen */
    push(id, data) { const u = auth.currentUser; if (u) setDoc(doc(kids(u.uid), id), data).catch(() => hooks.onStatus("offline")); },
    remove(id) { const u = auth.currentUser; if (u) deleteDoc(doc(kids(u.uid), id)).catch(() => {}); },
    /* Konto und alle Daten löschen (DSGVO Art. 17) */
    async deleteAccount() {
      const u = auth.currentUser; if (!u) return;
      const all = await getDocs(kids(u.uid));
      const b = writeBatch(db);
      all.forEach(d => b.delete(d.ref));
      b.delete(doc(db, "konten", u.uid));
      await b.commit();
      await deleteUser(u);
    },
  };
}
