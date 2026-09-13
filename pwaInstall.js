// ============================================================
// PWA install support
// ============================================================
// Registers the service worker, and captures Chrome/Android's
// 'beforeinstallprompt' event so the app can trigger the native
// install prompt from its own UI button instead of relying on
// the browser's address-bar icon.

export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // registration failure shouldn't break the app
    });
  });
}

// Simple pub/sub so React components can react to install availability
// without needing the event to fire while they're already mounted.
let deferredPrompt = null;
let listeners = [];

export function initInstallPromptCapture() {
  if (typeof window === "undefined") return;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    listeners.forEach((cb) => cb(true));
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    listeners.forEach((cb) => cb(false));
  });
}

export function isInstallAvailable() {
  return !!deferredPrompt;
}

export function onInstallAvailabilityChange(cb) {
  listeners.push(cb);
  return () => { listeners = listeners.filter((l) => l !== cb); };
}

export async function promptInstall() {
  if (!deferredPrompt) return { outcome: "unavailable" };
  deferredPrompt.prompt();
  const result = await deferredPrompt.userChoice;
  deferredPrompt = null;
  listeners.forEach((cb) => cb(false));
  return result; // { outcome: 'accepted' | 'dismissed' }
}

// Detect if already running as an installed PWA (standalone display mode),
// so the app can hide the install button entirely in that case.
export function isRunningStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true // iOS Safari
  );
}
