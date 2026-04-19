import { colors, gradients, radii, spacing, typography } from "@burner/ui";

export const appTheme = {
  colors,
  gradients,
  radii,
  spacing,
  typography,
  shadows: {
    jewelCase: {
      shadowColor: "#000",
      shadowOpacity: 0.45,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 14 },
      elevation: 16,
    },
  },
} as const;
