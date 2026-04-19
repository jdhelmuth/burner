import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { GlitchHeading } from "../../components/GlitchHeading";
import { RetroScreen } from "../../components/RetroScreen";
import { useBurnerComposer } from "../../hooks/useBurnerComposer";
import { demoDraft } from "../../lib/demo-data";
import { appTheme } from "../../theme";

export default function SelectSongsScreen() {
  const draft = useBurnerComposer();

  return (
    <RetroScreen>
      <ScrollView contentContainerStyle={styles.container}>
        <GlitchHeading title="Tracklist" subtitle="The sender sees everything. The receiver sees fate." />
        <View style={styles.stack}>
          {demoDraft.tracks.map((track, index) => (
            <Pressable
              key={track.providerTrackId}
              onPress={() => draft.addTrack(track)}
              style={styles.trackRow}
            >
              <Text style={styles.index}>{String(index + 1).padStart(2, "0")}</Text>
              <View style={styles.trackMeta}>
                <Text style={styles.trackTitle}>{track.title}</Text>
                <Text style={styles.trackSub}>{track.artist}</Text>
              </View>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={() => draft.setTracks(demoDraft.tracks)} style={styles.button}>
          <Text style={styles.buttonText}>Use curated demo mix</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/create/cover")} style={styles.secondary}>
          <Text style={styles.secondaryText}>Continue to cover art</Text>
        </Pressable>
      </ScrollView>
    </RetroScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: appTheme.spacing.lg,
    paddingVertical: appTheme.spacing.lg,
  },
  stack: {
    gap: appTheme.spacing.sm,
  },
  trackRow: {
    flexDirection: "row",
    gap: appTheme.spacing.md,
    borderRadius: appTheme.radii.md,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: appTheme.colors.line,
    borderWidth: 1,
    padding: appTheme.spacing.md,
    alignItems: "center",
  },
  index: {
    color: appTheme.colors.lime,
    width: 36,
    fontWeight: "900",
    fontSize: 16,
  },
  trackMeta: {
    flex: 1,
  },
  trackTitle: {
    color: appTheme.colors.text,
    fontWeight: "800",
    fontSize: 16,
  },
  trackSub: {
    color: appTheme.colors.textMuted,
    marginTop: 4,
  },
  button: {
    borderRadius: appTheme.radii.pill,
    backgroundColor: appTheme.colors.cyan,
    paddingVertical: appTheme.spacing.md,
    alignItems: "center",
  },
  buttonText: {
    color: "#092125",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  secondary: {
    borderRadius: appTheme.radii.pill,
    borderWidth: 1,
    borderColor: appTheme.colors.line,
    paddingVertical: appTheme.spacing.md,
    alignItems: "center",
  },
  secondaryText: {
    color: appTheme.colors.text,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
});
