import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { GlitchHeading } from "../../components/GlitchHeading";
import { JewelCaseCard } from "../../components/JewelCaseCard";
import { RetroScreen } from "../../components/RetroScreen";
import { demoDraft } from "../../lib/demo-data";
import { appTheme } from "../../theme";

const quickActions = [
  { label: "Create burner", route: "/create/details" },
  { label: "Choose source", route: "/create/source" },
  { label: "Receiver preview", route: "/burner/demo-burner" },
];

export default function HomeScreen() {
  return (
    <RetroScreen>
      <ScrollView contentContainerStyle={styles.container}>
        <GlitchHeading
          title="Home"
          subtitle="Ship a playlist like it is scribbled in Sharpie on a silver CD-R."
        />
        <JewelCaseCard
          eyebrow="latest draft"
          title={demoDraft.title}
          imageUrl={demoDraft.coverImageUrl}
        >
          <Text style={styles.meta}>
            {demoDraft.senderName} • {demoDraft.tracks.length} tracks
          </Text>
          <Text style={styles.note}>{demoDraft.note}</Text>
        </JewelCaseCard>
        <View style={styles.actions}>
          {quickActions.map((action) => (
            <Pressable key={action.label} onPress={() => router.push(action.route as never)} style={styles.actionCard}>
              <Text style={styles.actionText}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </RetroScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: appTheme.spacing.lg,
    paddingVertical: appTheme.spacing.lg,
  },
  meta: {
    color: appTheme.colors.lime,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  note: {
    color: appTheme.colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
  actions: {
    gap: appTheme.spacing.md,
  },
  actionCard: {
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.line,
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: appTheme.spacing.lg,
  },
  actionText: {
    color: appTheme.colors.text,
    fontSize: 18,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});
