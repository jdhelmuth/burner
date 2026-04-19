import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

import { appTheme } from "../theme";

export function RetroScreen({ children }: PropsWithChildren) {
  return (
    <LinearGradient colors={appTheme.gradients.disc} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.scratches} />
        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: appTheme.spacing.lg,
    paddingBottom: appTheme.spacing.lg,
  },
  scratches: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
    backgroundColor: appTheme.colors.scratch,
    transform: [{ rotate: "-5deg" }],
  },
});
