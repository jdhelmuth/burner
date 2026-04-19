import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { GlitchHeading } from "../../components/GlitchHeading";
import { JewelCaseCard } from "../../components/JewelCaseCard";
import { RetroScreen } from "../../components/RetroScreen";
import { TrackRevealCard } from "../../components/TrackRevealCard";
import { usePreviewBurner, usePublishBurner } from "../../hooks/useBurnerQueries";
import { useBurnerComposer } from "../../hooks/useBurnerComposer";
import { appTheme } from "../../theme";

export default function PreviewScreen() {
  const draft = useBurnerComposer();
  const preview = usePreviewBurner();
  const publish = usePublishBurner();

  return (
    <RetroScreen>
      <ScrollView contentContainerStyle={styles.container}>
        <GlitchHeading title="Preview" subtitle="This is the social moment. Cover first, trust later." />
        <JewelCaseCard title={preview.data?.title ?? draft.title} imageUrl={draft.coverImageUrl} eyebrow={draft.senderName}>
          <Text style={styles.note}>{draft.note}</Text>
        </JewelCaseCard>
        <View style={styles.stack}>
          <TrackRevealCard
            track={{
              position: 1,
              title: draft.tracks[0]?.title ?? "Unknown",
              artist: draft.tracks[0]?.artist ?? "",
              albumArtUrl: draft.tracks[0]?.albumArtUrl,
              albumName: draft.tracks[0]?.albumName,
              provider: draft.tracks[0]?.provider ?? "generic",
              playbackCapabilities: ["handoffPlayback"],
            }}
          />
          <TrackRevealCard locked />
        </View>
        <Pressable onPress={() => publish.mutate()} style={styles.button}>
          <Text style={styles.buttonText}>{publish.isPending ? "Publishing…" : "Publish burner"}</Text>
        </Pressable>
        {publish.data ? (
          <View style={styles.shareBox}>
            <Text style={styles.shareTitle}>Share link</Text>
            <Text style={styles.shareText}>{publish.data.shareUrl}</Text>
            <Text style={styles.shareCode}>Code: {publish.data.shortCode}</Text>
          </View>
        ) : null}
      </ScrollView>
    </RetroScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: appTheme.spacing.lg,
    paddingVertical: appTheme.spacing.lg,
  },
  note: {
    color: appTheme.colors.textMuted,
    lineHeight: 21,
  },
  stack: {
    gap: appTheme.spacing.sm,
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
  shareBox: {
    padding: appTheme.spacing.lg,
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.line,
    backgroundColor: "rgba(255,255,255,0.06)",
    gap: appTheme.spacing.xs,
  },
  shareTitle: {
    color: appTheme.colors.lime,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    fontWeight: "700",
  },
  shareText: {
    color: appTheme.colors.text,
    fontSize: 15,
  },
  shareCode: {
    color: appTheme.colors.textMuted,
    fontSize: 13,
  },
});
