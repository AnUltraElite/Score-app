// ============================================================
// LOCAL PERSISTENCE — localStorage until a real backend/login exists
// ============================================================
// This is browser storage. On a real installed PWA on Android, the browser
// engine backing the installed app (Chrome/WebView) still owns this
// storage and keeps it on-device, scoped to the app — there isn't a
// separate "device storage API" to move to without native code, so this
// is already "device storage" for an installed PWA in practice.

const STORAGE_KEY = "scoreline:settings";
const PROFILE_KEY = "scoreline:profile";
const MATCHES_KEY = "scoreline:matches";
const DEVICE_KEY = "scoreline:deviceId";
const INSTALL_NUDGE_KEY = "scoreline:installNudge";

const DEFAULT_SETTINGS = {
  notifications: true,
  publicByDefault: false,
  darkMode: true,
  sound: true,
};

// No default bio — the field should read empty until the user sets one.
const DEFAULT_PROFILE = {
  name: "Elite",
  bio: "",
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage unavailable (private browsing etc) — fail silently
  }
}

export function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

// ---------- Matches ----------
// Persists the full matches array (seed + user-created + live edits) so
// ongoing scoring survives a refresh/app relaunch.
export function loadMatches(fallback) {
  try {
    const raw = localStorage.getItem(MATCHES_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

export function saveMatches(matches) {
  try {
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matches));
  } catch {
    // storage full or unavailable — fail silently, in-memory state still works
  }
}

// ---------- Device / owner identity ----------
// Until real accounts exist, a random per-device id is the stand-in for
// "who owns this match" so the feed can tell the creator's matches apart
// from everyone else's and only let the owner edit/score them.
export function getDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = "dev_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return "dev_session_only";
  }
}

// ---------- Install nudge frequency ----------
// The install reminder should show the very first time, then only
// occasionally afterwards — not on every visit. This tracks the last time
// it was shown so the app can decide whether today counts as "time to nudge again".
const NUDGE_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // ~3 days between reminders after the first

export function shouldShowInstallNudge() {
  try {
    const raw = localStorage.getItem(INSTALL_NUDGE_KEY);
    if (!raw) return true; // never shown -> definitely show first time
    const lastShown = Number(raw);
    if (Number.isNaN(lastShown)) return true;
    return Date.now() - lastShown > NUDGE_COOLDOWN_MS;
  } catch {
    return true;
  }
}

export function markInstallNudgeShown() {
  try {
    localStorage.setItem(INSTALL_NUDGE_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}
