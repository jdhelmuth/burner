export const colors = {
  background: "#120B1C",
  panel: "#20112F",
  panelRaised: "#2D1841",
  text: "#FFF7F0",
  textMuted: "#D7C5E8",
  hotPink: "#FF4FA3",
  cyan: "#6FF7FF",
  lime: "#E6FF75",
  burnOrange: "#FF9152",
  line: "rgba(255, 255, 255, 0.14)",
  scratch: "rgba(255, 255, 255, 0.08)",
  success: "#75F2B3",
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 12,
  md: 20,
  lg: 28,
  pill: 999,
} as const;

export const typography = {
  display: "System",
  body: "System",
  mono: "Courier",
} as const;

export const gradients = {
  chrome: ["#FFE4C7", "#FF8DD1", "#85F8FF"],
  disc: ["#2C1740", "#4F2984", "#A950A1"],
  glitch: ["#FF4FA3", "#6FF7FF", "#FFF7F0"],
} as const;
