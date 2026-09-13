// ============================================================
// SETTINGS — persisted to localStorage until a real backend/login exists
// ============================================================
const STORAGE_KEY = "scoreline:settings";
const PROFILE_KEY = "scoreline:profile";

const DEFAULT_SETTINGS = {
  notifications: true,
  publicByDefault: false,
  darkMode: true,
  sound: true,
};

const DEFAULT_PROFILE = {
  name: "Elite",
  bio: "Organiser",
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
