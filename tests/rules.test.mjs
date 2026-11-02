// Prüft die Sicherheitsregeln im Firestore-Emulator: npm run test:rules
import { test, before, after } from "node:test";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

let env;
const kind = { name: "Emilia", face: "🦄", prog: { l1: { anlaut: 5 } }, stickers: ["l_apfel"], updated: 1 };
const konto = { consent: { version: "2026-11", at: 1 }, created: 1 };

before(async () => {
  env = await initializeTestEnvironment({ projectId: "lernfreunde-test", firestore: { rules: readFileSync("firestore.rules", "utf8") } });
});
after(() => env.cleanup());

test("Konto darf eigene Kinderprofile anlegen, lesen und löschen", async () => {
  const db = env.authenticatedContext("anna").firestore();
  await assertSucceeds(setDoc(doc(db, "konten/anna"), konto));
  await assertSucceeds(setDoc(doc(db, "konten/anna/kinder/k1"), kind));
  await assertSucceeds(getDoc(doc(db, "konten/anna/kinder/k1")));
  await assertSucceeds(deleteDoc(doc(db, "konten/anna/kinder/k1")));
});

test("fremdes Konto kommt nicht an die Kinder", async () => {
  await env.withSecurityRulesDisabled(c => setDoc(doc(c.firestore(), "konten/anna/kinder/k2"), kind));
  const db = env.authenticatedContext("ben").firestore();
  await assertFails(getDoc(doc(db, "konten/anna/kinder/k2")));
  await assertFails(setDoc(doc(db, "konten/anna/kinder/k2"), kind));
  await assertFails(deleteDoc(doc(db, "konten/anna/kinder/k2")));
  await assertFails(getDoc(doc(db, "konten/anna")));
});

test("ohne Anmeldung ist alles gesperrt", async () => {
  const db = env.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, "konten/anna/kinder/k2")));
  await assertFails(setDoc(doc(db, "konten/x/kinder/k1"), kind));
});

test("unbekannte Felder und zu lange Namen werden abgelehnt", async () => {
  const db = env.authenticatedContext("anna").firestore();
  await assertFails(setDoc(doc(db, "konten/anna/kinder/k3"), { ...kind, geburtstag: "2020-01-01" }));
  await assertFails(setDoc(doc(db, "konten/anna/kinder/k3"), { ...kind, gallery: ["data:image/jpeg;base64,…"] }));
  await assertFails(setDoc(doc(db, "konten/anna/kinder/k3"), { ...kind, name: "x".repeat(41) }));
  await assertFails(setDoc(doc(db, "konten/anna/kinder/k3"), { ...kind, updated: "gestern" }));
  await assertFails(setDoc(doc(db, "konten/anna"), { ...konto, email: "a@b.de" }));
});

test("andere Sammlungen sind gesperrt", async () => {
  const db = env.authenticatedContext("anna").firestore();
  await assertFails(setDoc(doc(db, "irgendwas/1"), { a: 1 }));
});
