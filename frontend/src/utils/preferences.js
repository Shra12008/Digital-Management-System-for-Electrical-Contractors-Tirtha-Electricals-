// Tiny localStorage-backed stores for per-device preferences (theme, profile
// extras). No backend endpoint exists yet for these, so they live in the
// browser; the shape is deliberately simple so it can move to an API later.
import { useSyncExternalStore } from "react";

function createStore(key, defaults) {
  let raw;
  let cache;
  const listeners = new Set();
  const read = () => {
    const r = localStorage.getItem(key);
    if (cache === undefined || r !== raw) {
      raw = r;
      try {
        cache = { ...defaults, ...(r ? JSON.parse(r) : {}) };
      } catch {
        cache = { ...defaults };
      }
    }
    return cache;
  };
  const emit = () => listeners.forEach((fn) => fn());
  const subscribe = (fn) => {
    listeners.add(fn);
    const onStorage = (e) => e.key === key && fn();
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(fn);
      window.removeEventListener("storage", onStorage);
    };
  };
  return {
    get: read,
    set(patch) {
      const next = { ...read(), ...patch };
      localStorage.setItem(key, JSON.stringify(next));
      raw = localStorage.getItem(key);
      cache = next;
      emit();
    },
    reset() {
      localStorage.removeItem(key);
      raw = null;
      cache = { ...defaults };
      emit();
    },
    use: () => useSyncExternalStore(subscribe, read),
  };
}

export const SETTINGS_DEFAULTS = {
  theme: "dark", // dark | light | system
  density: "comfortable", // comfortable | compact
  reduceMotion: false,
  defaultGst: 18,
  dueDays: 14,
};
export const settingsStore = createStore("tirth_settings", SETTINGS_DEFAULTS);

const PROFILE_DEFAULTS = { displayName: "", phone: "", designation: "", location: "", avatar: "" };
const profileStores = {};
/** One profile store per signed-in user, so two accounts on one browser don't share a photo. */
export function profileStoreFor(user) {
  const id = user?.userId ?? user?.email ?? "guest";
  const key = `tirth_profile_${id}`;
  if (!profileStores[key]) profileStores[key] = createStore(key, PROFILE_DEFAULTS);
  return profileStores[key];
}

const systemLight = () => window.matchMedia?.("(prefers-color-scheme: light)").matches;

/** Writes the theme / density / motion choice onto <html> so CSS variables switch. */
export function applyAppearance(settings) {
  const root = document.documentElement;
  root.dataset.theme = settings.theme === "system" ? (systemLight() ? "light" : "dark") : settings.theme;
  root.dataset.density = settings.density;
  root.dataset.motion = settings.reduceMotion ? "reduced" : "full";
}

export function clearAppearance() {
  const root = document.documentElement;
  delete root.dataset.theme;
  delete root.dataset.density;
  delete root.dataset.motion;
}

/** Downscale + centre-crop an uploaded photo to a small square JPEG data URL. */
export function fileToAvatar(file, size = 256) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(new Error("Please choose an image file."));
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const min = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      canvas.getContext("2d").drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.86));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That image could not be read."));
    };
    img.src = url;
  });
}
