import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { GlitchHeading } from "../../components/GlitchHeading";
import { JewelCaseCard } from "../../components/JewelCaseCard";
import { RetroScreen } from "../../components/RetroScreen";
import { TrackRevealCard } from "../../components/TrackRevealCard";
import { useRecipientBurner } from "../../hooks/useBurnerQueries";
import { appTheme } from "../../theme";

export default function ReceiveBurnerScreen() {
  const { slug, token, payload } = useLocalSearchParams<{ slug: string; token?: string; payload?: string }>();
  const burnerQuery = useRecipientBurner(slug ?? "demo-burner", token, payload);

  if (!burnerQuery.data) {
    return (
      <RetroScreen>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Loading burner…</Text>
        </View>
      </RetroScreen>
    );
  }

  return (
    <RetroScreen>
      <ScrollView contentContainerStyle={styles.container}>
        <GlitchHeading
          title={burnerQuery.data.burner.title}
          subtitle={`Sent by ${burnerQuery.data.burner.senderName}`}
        />
        <JewelCaseCard
          eyebrow="mystery loaded"
          title={burnerQuery.data.burner.title}
          imageUrl={burnerQuery.data.burner.coverImageUrl}
        >
          <Text style={styles.note}>{burnerQuery.data.burner.note}</Text>
        </JewelCaseCard>
        <View style={styles.stack}>
          <TrackRevealCard track={burnerQuery.data.firstTrack} />
          <TrackRevealCard locked />
        </View>
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/playback/[burnerId]",
              params: {
                burnerId: burnerQuery.data.burner.id,
                slug: burnerQuery.data.burner.slug,
                sessionToken: burnerQuery.data.sessionToken,
                token,
                payload,
              },
            })
          }
          style={styles.button}
        >
          <Text style={styles.buttonText}>Start listening</Text>
        </Pressable>
      </ScrollView>
    </RetroScreen>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: appTheme.colors.text,
  },
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
    backgroundColor: appTheme.colors.hotPink,
    paddingVertical: appTheme.spacing.md,
    alignItems: "center",
  },
  buttonText: {
    color: "#23091D",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
});
