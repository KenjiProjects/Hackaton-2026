"use client";

import { useEffect } from "react";
import {
  useFontSizePreference,
  useThemePreference,
} from "@/lib/theme";

export default function ThemeSync() {
  const preference = useThemePreference();
  const fontSize = useFontSizePreference();

  useEffect(() => {
    const root = document.documentElement;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");

    function applyTheme() {
      const useDarkTheme =
        preference === "dark" ||
        (preference === "system" && systemTheme.matches);
      root.classList.toggle("dark", useDarkTheme);

      if (preference === "system") {
        root.removeAttribute("data-theme");
      } else {
        root.dataset.theme = preference;
      }
    }

    applyTheme();
    systemTheme.addEventListener("change", applyTheme);
    return () => systemTheme.removeEventListener("change", applyTheme);
  }, [preference]);

  useEffect(() => {
    document.documentElement.dataset.fontSize = fontSize;
  }, [fontSize]);

  return null;
}
