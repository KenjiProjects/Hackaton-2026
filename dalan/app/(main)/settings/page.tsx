"use client";

import { useState } from "react";
import {
  setFontSizePreference,
  setThemePreference,
  useFontSizePreference,
  useThemePreference,
  type FontSizePreference,
  type ThemePreference,
} from "@/lib/theme";

const themeOptions: {
  value: ThemePreference;
  label: string;
  description: string;
}[] = [
  {
    value: "system",
    label: "System",
    description: "Follow your device appearance",
  },
  { value: "light", label: "Light", description: "Always use light mode" },
  { value: "dark", label: "Dark", description: "Always use dark mode" },
];

const fontSizeOptions: {
  value: FontSizePreference;
  label: string;
  description: string;
}[] = [
  { value: "small", label: "Small", description: "More content on screen" },
  { value: "medium", label: "Default", description: "Standard text size" },
  { value: "large", label: "Large", description: "Easier to read" },
  {
    value: "extra-large",
    label: "Extra large",
    description: "Largest text and controls",
  },
];

export default function SettingsPage() {
  const themePreference = useThemePreference();
  const fontSizePreference = useFontSizePreference();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function updateTheme(preference: ThemePreference) {
    setError("");
    setSaved(false);

    try {
      setThemePreference(preference);
      setSaved(true);
    } catch {
      setError("Theme preference could not be saved in this browser.");
    }
  }

  function updateFontSize(preference: FontSizePreference) {
    setError("");
    setSaved(false);

    try {
      setFontSizePreference(preference);
      setSaved(true);
    } catch {
      setError("Font size preference could not be saved in this browser.");
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 px-5 py-8 font-sans dark:bg-black sm:py-12">
      <div className="w-full max-w-2xl">
        <header className="mb-7">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-700 dark:text-orange-300">
            Personalize Dalan
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Settings
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Choose how Dalan looks on this device.
          </p>
        </header>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Appearance
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Your choice is saved in this browser.
            </p>
          </div>

          <fieldset className="mt-5 space-y-3">
            <legend className="sr-only">Color theme</legend>
            {themeOptions.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                  themePreference === option.value
                    ? "border-orange-600 bg-orange-50 dark:border-orange-300 dark:bg-orange-950/40"
                    : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                }`}
              >
                <input
                  type="radio"
                  name="theme"
                  value={option.value}
                  checked={themePreference === option.value}
                  onChange={() => updateTheme(option.value)}
                  className="mt-1 accent-orange-600"
                />
                <span>
                  <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-sm text-zinc-600 dark:text-zinc-400">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          {saved && (
            <p
              role="status"
              className="mt-4 text-sm text-orange-800 dark:text-orange-200"
            >
              Appearance preference saved.
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="mt-4 text-sm text-red-700 dark:text-red-300"
            >
              {error}
            </p>
          )}
        </section>

        <section className="mt-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Font size
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Changes the text and overall interface scale throughout Dalan.
            </p>
          </div>

          <fieldset className="mt-5 space-y-3">
            <legend className="sr-only">Font size</legend>
            {fontSizeOptions.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                  fontSizePreference === option.value
                    ? "border-orange-600 bg-orange-50 dark:border-orange-300 dark:bg-orange-950/40"
                    : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                }`}
              >
                <input
                  type="radio"
                  name="font-size"
                  value={option.value}
                  checked={fontSizePreference === option.value}
                  onChange={() => updateFontSize(option.value)}
                  className="mt-1 accent-orange-600"
                />
                <span>
                  <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-sm text-zinc-600 dark:text-zinc-400">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          {saved && (
            <p
              role="status"
              className="mt-4 text-sm text-orange-800 dark:text-orange-200"
            >
              Settings saved.
            </p>
          )}
          {error && (
            <p
              role="alert"
              className="mt-4 text-sm text-red-700 dark:text-red-300"
            >
              {error}
            </p>
          )}
        </section>

        <section className="mt-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            About Dalan
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            Dalan helps you explore Naga City transport locations, view routes,
            and estimate trip fares.
          </p>
          <p className="mt-3 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
            Map data © OpenStreetMap contributors. Fare estimates may change
            for special requests; confirm the fare with the driver before
            starting your trip.
          </p>
        </section>
      </div>
    </main>
  );
}
