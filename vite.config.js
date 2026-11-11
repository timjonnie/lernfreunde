import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

/* Relative Pfade: läuft so unter github.io/lernfreunde/, auf eigener Domain und später in der Store-App (Capacitor) */
export default defineConfig({
  base: "./",
  plugins: [
    /* Offline-fähig: Service Worker speichert App, Bilder, Töne und Schriften auf dem Gerät.
       Das Manifest liegt selbst gepflegt in public/manifest.webmanifest. */
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false, /* Registrierung in main.js – nicht in der Store-App */
      manifest: false,
      workbox: {
        globPatterns: ["**/*.{js,css,html,woff,woff2,png,svg,mp3,webmanifest}"],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
