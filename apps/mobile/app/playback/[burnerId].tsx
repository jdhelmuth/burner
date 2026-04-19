import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";

import { GlitchHeading } from "../../components/GlitchHeading";
import { RetroScreen } from "../../components/RetroScreen";
import { TrackRevealCard } from "../../components/TrackRevealCard";
import { useRecipientBurner } from "../../hooks/useBurnerQueries";
import { useCompleteTrackUnlock, useStartListenSession } from "../../hooks/usePlaybackUnlock";
import { demoDraft } from "../../lib/demo-data";
import { providerAdapters } from "../../services/music-providers";
import { appTheme } from "../../theme";

export default function PlaybackScreen() {
  const { burnerId, slug, sessionToken, token, payload } = useLocalSearchParams<{
    burnerId: string;
    slug: string;
    sessionToken: string;
    token?: string;
    payload?: string;
  }>();
  const burnerQuery = useRecipientBurner(slug ?? "demo-burner", token, payload);
  const startListen = useStartListenSession();
  const completeUnlock = useCompleteTrackUnlock();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [position, setPosition] = useState(1);
  const playbackTracks = useMemo(() => {
    const maybeLocal = burnerQuery.data as { localTracks?: typeof demoDraft.tracks } | undefined;
    return maybeLocal?.localTracks ?? demoDraft.tracks;
  }, [burnerQuery.data]);
  const currentTrack = useMemo(() => playbackTracks[position - 1], [playbackTracks, position]);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (burnerId && sessionToken && currentTrack) {
      startListen.mutate({
        burnerId,
        position,
        provider: currentTrack.provider,
        sessionToken,
      });
    }
  }, [burnerId, currentTrack, position, sessionToken, startListen]);

  async function playTrack() {
    const adapter =
      providerAdapters.find((candidate) => candidate.provider === currentTrack.provider) ??
      providerAdapters[0];

    await adapter.startPlayback({
      track: {
        position,
        title: currentTrack.title,
        artist: currentTrack.artist,
        albumArtUrl: currentTrack.albumArtUrl,
        albumName: currentTrack.albumName,
        provider: currentTrack.provider,
        providerUri: currentTrack.handoffUri,
        playbackCapabilities: ["handoffPlayback"],
      },
    });
  }

  async function unlockNext() {
    if (!burnerId || !sessionToken) {
      return;
    }

    await completeUnlock.mutateAsync({
      burnerId,
      position,
      sessionToken,
      elapsedSeconds,
      observedCompletion: elapsedSeconds >= 30,
      tracks: playbackTracks,
    });

    setElapsedSeconds(0);
    setPosition((current) => Math.min(current + 1, playbackTracks.length));
  }

  return (
    <RetroScreen>
      <ScrollView contentContainerStyle={styles.container}>
        <GlitchHeading
          title={burnerQuery.data?.burner.title ?? "Burner Playback"}
          subtitle="One reveal at a time. No skipping the emotional damage."
        />
        <TrackRevealCard
          track={{
            position,
            title: currentTrack.title,
            artist: currentTrack.artist,
            albumArtUrl: currentTrack.albumArtUrl,
            albumName: currentTrack.albumName,
            provider: currentTrack.provider,
            providerUri: currentTrack.handoffUri,
            playbackCapabilities: ["handoffPlayback"],
          }}
        />
        <TrackRevealCard locked={position >= playbackTracks.length} />
        <View style={styles.timerBox}>
          <Text style={styles.timerLabel}>Reveal timer</Text>
          <Text style={styles.timerValue}>{elapsedSeconds}s / 30s</Text>
        </View>
        <Pressable onPress={playTrack} style={styles.primaryButton}>
          <Text style={styles.primaryText}>Play in {currentTrack.provider}</Text>
        </Pressable>
        <Pressable onPress={unlockNext} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>Mark song as landed</Text>
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
  timerBox: {
    borderRadius: appTheme.radii.md,
    borderColor: appTheme.colors.line,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.xs,
  },
  timerLabel: {
    color: appTheme.colors.lime,
    textTransform: "uppercase",
    letterSpacing: 1.3,
    fontWeight: "700",
  },
  timerValue: {
    color: appTheme.colors.text,
    fontSize: 28,
    fontWeight: "900",
  },
  primaryButton: {
    borderRadius: appTheme.radii.pill,
    backgroundColor: appTheme.colors.cyan,
    paddingVertical: appTheme.spacing.md,
    alignItems: "center",
  },
  primaryText: {
    color: "#092125",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  secondaryButton: {
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
