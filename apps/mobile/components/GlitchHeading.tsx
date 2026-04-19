import { Text, StyleSheet, View } from "react-native";

import { appTheme } from "../theme";

export function GlitchHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, styles.shadowA]}>{title}</Text>
      <Text style={[styles.title, styles.shadowB]}>{title}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: appTheme.spacing.lg,
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    letterSpacing: 1.3,
    color: appTheme.colors.text,
    textTransform: "uppercase",
  },
  shadowA: {
    position: "absolute",
    color: appTheme.colors.hotPink,
    left: 2,
    top: -1,
    opacity: 0.75,
  },
  shadowB: {
    position: "absolute",
    color: appTheme.colors.cyan,
    left: -2,
    top: 1,
    opacity: 0.75,
  },
  subtitle: {
    marginTop: appTheme.spacing.sm,
    color: appTheme.colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
});
