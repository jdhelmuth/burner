export const webRetroTheme = {
  colorScheme: "light",
  colors: {
    ink: "#171b22",
    inkSoft: "#313a48",
    muted: "#5e697a",
    mutedSoft: "#8995a6",
    hairline: "rgba(56, 70, 93, 0.2)",
    hairlineStrong: "rgba(42, 56, 80, 0.4)",
    pageBg: "#bec8d6",
    surface: "#fbfdff",
    surfaceAlt: "#eaf0f8",
    surfaceSunken: "#d2dbe8",
    rowAlt: "#f4f7fb",
    accent: "#2f6fbd",
    accentDeep: "#1d4f94",
    accentSoft: "#dfeaf9",
    ember: "#ee7d20",
    emberDeep: "#a64d0f",
    danger: "#a94338",
    warning: "#a87a1e",
    success: "#3f7f4f",
  },
  radii: {
    sm: "3px",
    md: "5px",
    lg: "8px",
  },
  shadows: {
    sm: "0 1px 2px rgba(16, 22, 34, 0.08)",
    md: "0 8px 18px rgba(16, 22, 34, 0.1)",
    lg: "0 22px 48px rgba(16, 22, 34, 0.16)",
    insetTop: "inset 0 1px 0 rgba(255, 255, 255, 0.78)",
  },
  typography: {
    ui: [
      '"Avenir Next"',
      '"SF Pro Text"',
      "-apple-system",
      "BlinkMacSystemFont",
      '"Helvetica Neue"',
      '"Lucida Grande"',
      '"Segoe UI"',
      "Tahoma",
      "Arial",
      "sans-serif",
    ].join(", "),
    mono: ['"Monaco"', '"Consolas"', '"Courier New"', "monospace"].join(", "),
    sizes: {
      xs: "11px",
      sm: "12px",
      base: "13px",
      md: "14px",
      lg: "16px",
      xl: "20px",
      "2xl": "26px",
      "3xl": "34px",
    },
  },
} as const;

export const webRetroDarkPalette = {
  colorScheme: "dark",
  colors: {
    ink: "#e9eef6",
    inkSoft: "#bdc6d4",
    muted: "#8893a6",
    mutedSoft: "#6c7585",
    hairline: "rgba(180, 196, 220, 0.14)",
    hairlineStrong: "rgba(180, 196, 220, 0.28)",
    pageBg: "#141923",
    surface: "#1d2431",
    surfaceAlt: "#232b3a",
    surfaceSunken: "#10141c",
    rowAlt: "#1f2532",
    accent: "#5a9ce8",
    accentDeep: "#87b8f0",
    accentSoft: "rgba(90, 156, 232, 0.18)",
    ember: "#f08a2c",
    emberDeep: "#ba5a0d",
    danger: "#e07a6e",
    warning: "#d9b65a",
    success: "#6ec27f",
  },
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.4)",
    md: "0 8px 18px rgba(0, 0, 0, 0.45)",
    lg: "0 22px 48px rgba(0, 0, 0, 0.55)",
    insetTop: "inset 0 1px 0 rgba(255, 255, 255, 0.06)",
  },
} as const;

export const webRetroThemeClassName = "theme-burner-web-retro";

export const webRetroThemeCss = `
.${webRetroThemeClassName} {
  color-scheme: ${webRetroTheme.colorScheme};
  --ink: ${webRetroTheme.colors.ink};
  --ink-soft: ${webRetroTheme.colors.inkSoft};
  --muted: ${webRetroTheme.colors.muted};
  --muted-soft: ${webRetroTheme.colors.mutedSoft};
  --hairline: ${webRetroTheme.colors.hairline};
  --hairline-strong: ${webRetroTheme.colors.hairlineStrong};
  --page-bg: ${webRetroTheme.colors.pageBg};
  --surface: ${webRetroTheme.colors.surface};
  --surface-alt: ${webRetroTheme.colors.surfaceAlt};
  --surface-sunken: ${webRetroTheme.colors.surfaceSunken};
  --row-alt: ${webRetroTheme.colors.rowAlt};
  --accent: ${webRetroTheme.colors.accent};
  --accent-deep: ${webRetroTheme.colors.accentDeep};
  --accent-soft: ${webRetroTheme.colors.accentSoft};
  --ember: ${webRetroTheme.colors.ember};
  --ember-deep: ${webRetroTheme.colors.emberDeep};
  --danger: ${webRetroTheme.colors.danger};
  --warning: ${webRetroTheme.colors.warning};
  --success: ${webRetroTheme.colors.success};
  --radius-sm: ${webRetroTheme.radii.sm};
  --radius: ${webRetroTheme.radii.md};
  --radius-lg: ${webRetroTheme.radii.lg};
  --shadow-1: ${webRetroTheme.shadows.sm};
  --shadow-2: ${webRetroTheme.shadows.md};
  --shadow-3: ${webRetroTheme.shadows.lg};
  --inset-top: ${webRetroTheme.shadows.insetTop};
  --font-ui: ${webRetroTheme.typography.ui};
  --font-mono: ${webRetroTheme.typography.mono};
  --fs-xs: ${webRetroTheme.typography.sizes.xs};
  --fs-sm: ${webRetroTheme.typography.sizes.sm};
  --fs-base: ${webRetroTheme.typography.sizes.base};
  --fs-md: ${webRetroTheme.typography.sizes.md};
  --fs-lg: ${webRetroTheme.typography.sizes.lg};
  --fs-xl: ${webRetroTheme.typography.sizes.xl};
  --fs-2xl: ${webRetroTheme.typography.sizes["2xl"]};
  --fs-3xl: ${webRetroTheme.typography.sizes["3xl"]};
}

.${webRetroThemeClassName}[data-theme="dark"] {
  color-scheme: ${webRetroDarkPalette.colorScheme};
  --ink: ${webRetroDarkPalette.colors.ink};
  --ink-soft: ${webRetroDarkPalette.colors.inkSoft};
  --muted: ${webRetroDarkPalette.colors.muted};
  --muted-soft: ${webRetroDarkPalette.colors.mutedSoft};
  --hairline: ${webRetroDarkPalette.colors.hairline};
  --hairline-strong: ${webRetroDarkPalette.colors.hairlineStrong};
  --page-bg: ${webRetroDarkPalette.colors.pageBg};
  --surface: ${webRetroDarkPalette.colors.surface};
  --surface-alt: ${webRetroDarkPalette.colors.surfaceAlt};
  --surface-sunken: ${webRetroDarkPalette.colors.surfaceSunken};
  --row-alt: ${webRetroDarkPalette.colors.rowAlt};
  --accent: ${webRetroDarkPalette.colors.accent};
  --accent-deep: ${webRetroDarkPalette.colors.accentDeep};
  --accent-soft: ${webRetroDarkPalette.colors.accentSoft};
  --ember: ${webRetroDarkPalette.colors.ember};
  --ember-deep: ${webRetroDarkPalette.colors.emberDeep};
  --danger: ${webRetroDarkPalette.colors.danger};
  --warning: ${webRetroDarkPalette.colors.warning};
  --success: ${webRetroDarkPalette.colors.success};
  --shadow-1: ${webRetroDarkPalette.shadows.sm};
  --shadow-2: ${webRetroDarkPalette.shadows.md};
  --shadow-3: ${webRetroDarkPalette.shadows.lg};
  --inset-top: ${webRetroDarkPalette.shadows.insetTop};
}
`.trim();
