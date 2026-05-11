"use client";

import { useEffect, useState } from "react";

type ResolvedTheme = "light" | "dark";
type ThemePreference = "system" | ResolvedTheme;

const STORAGE_KEY = "burner-theme";

const themePreferences: ThemePreference[] = ["system", "light", "dark"];

function isResolvedTheme(value: string | undefined): value is ResolvedTheme {
  return value === "dark" || value === "light";
}

function isThemePreference(
  value: string | null | undefined,
): value is ThemePreference {
  return value === "system" || isResolvedTheme(value ?? undefined);
}

function getSystemThemeQuery() {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return null;
  }

  return window.matchMedia("(prefers-color-scheme: dark)");
}

function resolveTheme(
  preference: ThemePreference,
  mediaQuery: MediaQueryList | null = getSystemThemeQuery(),
): ResolvedTheme {
  if (preference === "dark" || preference === "light") return preference;
  return mediaQuery?.matches ? "dark" : "light";
}

function readInitialPreference(): ThemePreference {
  if (typeof document !== "undefined") {
    const attr = document.documentElement.dataset.themePreference;
    if (isThemePreference(attr)) return attr;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isThemePreference(stored)) return stored;
  } catch {
    // Storage may be unavailable in private browsing.
  }

  return "system";
}

function readInitialResolvedTheme(): ResolvedTheme {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.dataset.theme;
  if (isResolvedTheme(attr)) return attr;
  return resolveTheme("system");
}

function getThemeLabel(
  preference: ThemePreference,
  resolvedTheme: ResolvedTheme,
) {
  if (preference === "system") return `Match system (${resolvedTheme} now)`;
  return `Use ${preference} mode`;
}

function ThemeIcon({ preference }: { preference: ThemePreference }) {
  if (preference === "system") {
    return (
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
        <rect height="12" rx="2" width="16" x="4" y="5" />
        <path d="M9 19h6" />
        <path d="M12 17v2" />
        <path d="M12 5v12" />
      </svg>
    );
  }

  if (preference === "light") {
    return (
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <path d="M20 14.2A7.5 7.5 0 0 1 9.8 4a8 8 0 1 0 10.2 10.2Z" />
    </svg>
  );
}

export function ThemeToggle() {
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPreference(readInitialPreference());
    setResolvedTheme(readInitialResolvedTheme());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = getSystemThemeQuery();
    const applyPreference = () => {
      const nextTheme = resolveTheme(preference, mediaQuery);
      setResolvedTheme(nextTheme);
      document.documentElement.dataset.theme = nextTheme;
      document.documentElement.dataset.themePreference = preference;

      try {
        if (preference === "system") {
          localStorage.removeItem(STORAGE_KEY);
        } else {
          localStorage.setItem(STORAGE_KEY, preference);
        }
      } catch {
        // Storage may be unavailable in private browsing.
      }
    };

    applyPreference();

    if (preference !== "system" || !mediaQuery) return;

    const handleSystemThemeChange = () => applyPreference();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleSystemThemeChange);
      return () =>
        mediaQuery.removeEventListener("change", handleSystemThemeChange);
    }

    try {
      mediaQuery.addListener(handleSystemThemeChange);
      return () => mediaQuery.removeListener(handleSystemThemeChange);
    } catch {
      return;
    }
  }, [preference, mounted]);

  return (
    <div aria-label="Color theme" className="theme-toggle" role="group">
      {themePreferences.map((themePreference) => {
        const label = getThemeLabel(themePreference, resolvedTheme);

        return (
          <button
            aria-label={label}
            aria-pressed={preference === themePreference}
            className="theme-toggle__button"
            key={themePreference}
            onClick={() => setPreference(themePreference)}
            title={label}
            type="button"
          >
            <ThemeIcon preference={themePreference} />
          </button>
        );
      })}
    </div>
  );
}
