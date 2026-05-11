import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { webRetroThemeClassName, webRetroThemeCss } from "@burner/ui";

import { CanonicalLocalhost } from "../components/canonical-localhost";
import { ThemeToggle } from "../components/theme-toggle";
import {
  burnerBrandName,
  burnerMetaDescription,
  burnerTagline,
} from "../lib/brand";

export const metadata: Metadata = {
  title: `${burnerBrandName} | ${burnerTagline}`,
  description: burnerMetaDescription,
};

const themeBootScript = `
(function () {
  try {
    var stored = localStorage.getItem('burner-theme');
    var preference = stored === 'dark' || stored === 'light' || stored === 'system'
      ? stored
      : 'system';
    var prefersDark =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = preference === 'dark' || preference === 'light'
      ? preference
      : prefersDark ? 'dark' : 'light';
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.themePreference = preference;
  } catch (e) {
    document.documentElement.dataset.theme = 'light';
    document.documentElement.dataset.themePreference = 'system';
  }
})();
`.trim();

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html className={webRetroThemeClassName} lang="en" suppressHydrationWarning>
      <head>
        <style id="burner-web-retro-theme">{webRetroThemeCss}</style>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        <CanonicalLocalhost />
        {children}
        <ThemeToggle />
        <Analytics />
      </body>
    </html>
  );
}
