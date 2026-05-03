"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "burner-theme";

function readInitialTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.dataset.theme;
  if (attr === "dark" || attr === "light") return attr;
  return "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(readInitialTheme());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Storage may be unavailable in private browsing.
    }
  }, [theme, mounted]);

  const next: Theme = theme === "dark" ? "light" : "dark";
  const label = `Switch to ${next} mode`;

  return (
    <button
      aria-label={label}
      className="theme-toggle"
      onClick={() => setTheme(next)}
      title={label}
      type="button"
    >
      <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
    </button>
  );
}
