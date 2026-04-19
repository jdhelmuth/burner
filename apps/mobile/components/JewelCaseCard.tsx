import type { PropsWithChildren } from "react";
import { ImageBackground, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";

import { appTheme } from "../theme";

export function JewelCaseCard({
  title,
  imageUrl,
  eyebrow,
  children,
}: PropsWithChildren<{ title: string; imageUrl?: string; eyebrow?: string }>) {
  return (
    <View style={styles.frame}>
      <ImageBackground
        source={{
          uri:
            imageUrl ??
            "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80",
        }}
        imageStyle={styles.image}
        style={styles.cover}
      >
        <BlurView intensity={25} tint="dark" style={styles.overlay}>
          {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          <View style={styles.childWrap}>{children}</View>
        </BlurView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderRadius: appTheme.radii.lg,
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: appTheme.colors.line,
    ...appTheme.shadows.jewelCase,
  },
  cover: {
    minHeight: 270,
    overflow: "hidden",
    borderRadius: appTheme.radii.md,
  },
  image: {
    borderRadius: appTheme.radii.md,
  },
  overlay: {
    flex: 1,
    padding: appTheme.spacing.lg,
    justifyContent: "space-between",
  },
  eyebrow: {
    color: appTheme.colors.lime,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  title: {
    color: appTheme.colors.text,
    fontWeight: "900",
    fontSize: 28,
    lineHeight: 32,
    textTransform: "uppercase",
  },
  childWrap: {
    gap: appTheme.spacing.sm,
  },
});
