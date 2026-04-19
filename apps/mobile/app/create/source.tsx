import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { GlitchHeading } from "../../components/GlitchHeading";
import { RetroScreen } from "../../components/RetroScreen";
import { useBurnerComposer } from "../../hooks/useBurnerComposer";
import { useMusicProviders } from "../../contexts/MusicProviderContext";
import { appTheme } from "../../theme";

export default function SelectSourceScreen() {
  const draft = useBurnerComposer();
  const { providers, connect } = useMusicProviders();

  return (
    <RetroScreen>
      <ScrollView contentContainerStyle={styles.container}>
        <GlitchHeading
          title="Select Songs"
          subtitle="Use real provider auth where it exists. Fall back to imported links where it doesn’t."
        />
        {providers.map((provider) => (
          <Pressable
            key={provider.provider}
            onPress={async () => {
              draft.setSelectedProvider(provider.provider);
              await connect(provider.provider);
              router.push("/create/select-songs");
            }}
            style={[
              styles.providerCard,
              draft.selectedProvider === provider.provider ? styles.activeCard : null,
            ]}
          >
            <Text style={styles.providerTitle}>{provider.displayName}</Text>
            <Text style={styles.providerMeta}>{provider.capabilities.join(" • ")}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </RetroScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.lg,
  },
  providerCard: {
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.line,
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.xs,
  },
  activeCard: {
    borderColor: appTheme.colors.cyan,
    backgroundColor: "rgba(111,247,255,0.14)",
  },
  providerTitle: {
    color: appTheme.colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  providerMeta: {
    color: appTheme.colors.textMuted,
    lineHeight: 20,
  },
});
