import { useSyncExternalStore } from "react";

export type ThemePreference = "system" | "light" | "dark";
export type FontSizePreference = "small" | "medium" | "large" | "extra-large";

const THEME_STORAGE_KEY = "dalan-theme";
const FONT_SIZE_STORAGE_KEY = "dalan-font-size";
const THEME_CHANGE_EVENT = "dalan-theme-change";

export function getThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";

  const preference = window.localStorage.getItem(THEME_STORAGE_KEY);
  return preference === "light" || preference === "dark" ? preference : "system";
}

function subscribeToTheme(onChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useThemePreference() {
  return useSyncExternalStore(
    subscribeToTheme,
    getThemePreference,
    () => "system",
  );
}

export function setThemePreference(preference: ThemePreference) {
  window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function getFontSizePreference(): FontSizePreference {
  if (typeof window === "undefined") return "medium";

  const preference = window.localStorage.getItem(FONT_SIZE_STORAGE_KEY);
  return preference === "small" ||
    preference === "large" ||
    preference === "extra-large"
    ? preference
    : "medium";
}

export function useFontSizePreference() {
  return useSyncExternalStore(
    subscribeToTheme,
    getFontSizePreference,
    () => "medium",
  );
}

export function setFontSizePreference(preference: FontSizePreference) {
  window.localStorage.setItem(FONT_SIZE_STORAGE_KEY, preference);
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}
