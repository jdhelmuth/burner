import { Image, StyleSheet, Text, View } from "react-native";
import type { RevealedTrack } from "@burner/core";

import { appTheme } from "../theme";

export function TrackRevealCard({
  track,
  locked,
}: {
  track?: RevealedTrack;
  locked?: boolean;
}) {
  if (locked || !track) {
    return (
      <View style={[styles.card, styles.lockedCard]}>
        <Text style={styles.lockedText}>???</Text>
        <Text style={styles.meta}>Unlock after the current song lands.</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      {track.albumArtUrl ? <Image source={{ uri: track.albumArtUrl }} style={styles.art} /> : null}
      <View style={styles.content}>
        <Text style={styles.position}>Track {track.position.toString().padStart(2, "0")}</Text>
        <Text style={styles.title}>{track.title}</Text>
        <Text style={styles.meta}>
          {track.artist}
          {track.albumName ? ` • ${track.albumName}` : ""}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: appTheme.spacing.md,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: appTheme.colors.line,
    borderWidth: 1,
    borderRadius: appTheme.radii.md,
    padding: appTheme.spacing.md,
  },
  lockedCard: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  art: {
    width: 72,
    height: 72,
    borderRadius: 18,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  position: {
    color: appTheme.colors.lime,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  title: {
    color: appTheme.colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  meta: {
    color: appTheme.colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  lockedText: {
    color: appTheme.colors.text,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 8,
  },
});
