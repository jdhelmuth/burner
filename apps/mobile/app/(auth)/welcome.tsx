import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Link, router } from "expo-router";

import { GlitchHeading } from "../../components/GlitchHeading";
import { JewelCaseCard } from "../../components/JewelCaseCard";
import { RetroScreen } from "../../components/RetroScreen";
import { useAuth } from "../../contexts/AuthContext";
import { getAuthErrorMessage } from "../../lib/auth";
import { appTheme } from "../../theme";

export default function WelcomeScreen() {
  const { signInWithMagicLink, signInWithApple, signInWithGoogle, continueAsDemoSender, loading, isDemoAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const isBusy = loading || Boolean(pendingAction);

  async function runAuthAction(label: string, action: () => Promise<void>, onSuccess?: () => void) {
    try {
      setPendingAction(label);
      await action();
      onSuccess?.();
    } catch (error) {
      Alert.alert("Authentication failed", getAuthErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleMagicLink() {
    await runAuthAction(
      "magic",
      () => signInWithMagicLink(email),
      () =>
        Alert.alert(
          "Check your inbox",
          "Burner sent the magic link. Open it on this device and the callback screen will finish the session.",
        ),
    );
  }

  async function handleGoogle() {
    await runAuthAction("google", () => signInWithGoogle(), () => router.replace("/(tabs)"));
  }

  async function handleApple() {
    await runAuthAction("apple", () => signInWithApple(), () => router.replace("/(tabs)"));
  }

  async function handleDemo() {
    await runAuthAction("demo", () => continueAsDemoSender(email || "demo@burner.local"), () =>
      router.replace("/(tabs)"),
    );
  }

  return (
    <RetroScreen>
      <View style={styles.container}>
        <GlitchHeading
          title="Burner"
          subtitle="Make a mixtape feel dangerous again. Hide the tracklist. Reveal it one song at a time."
        />
        <JewelCaseCard title="Burned After Midnight" eyebrow="freshly burned">
          <Text style={styles.cardText}>A mysterious playlist delivery system for hopeless romantics.</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.push("/(tabs)")}>
            <Text style={styles.primaryText}>Enter the app</Text>
          </Pressable>
        </JewelCaseCard>

        <View style={styles.authBlock}>
          <Text style={styles.label}>Sender sign-in</Text>
          <Text style={styles.helper}>
            {isDemoAuth
              ? "Running without Supabase credentials. Demo sender mode will work instantly."
              : "Use magic link for production-style auth, or test Apple/Google OAuth if configured."}
          </Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@burner.fm"
            placeholderTextColor={appTheme.colors.textMuted}
            style={styles.input}
            value={email}
          />
          <Pressable
            disabled={!email || isBusy}
            onPress={handleMagicLink}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryText}>{isDemoAuth ? "Enter demo sender mode" : "Send magic link"}</Text>
          </Pressable>
          <View style={styles.row}>
            <Pressable disabled={isBusy} onPress={handleGoogle} style={[styles.oauthButton, isBusy && styles.disabledButton]}>
              <Text style={styles.oauthText}>Google</Text>
            </Pressable>
            <Pressable disabled={isBusy} onPress={handleApple} style={[styles.oauthButton, isBusy && styles.disabledButton]}>
              <Text style={styles.oauthText}>Apple</Text>
            </Pressable>
            <Pressable disabled={isBusy} onPress={handleDemo} style={[styles.oauthButton, isBusy && styles.disabledButton]}>
              <Text style={styles.oauthText}>Demo</Text>
            </Pressable>
          </View>
          <Link href="/burner/demo-burner" style={styles.linkText}>
            Open a burner someone sent you
          </Link>
        </View>
      </View>
    </RetroScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    gap: appTheme.spacing.lg,
  },
  cardText: {
    color: appTheme.colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
  authBlock: {
    gap: appTheme.spacing.sm,
  },
  helper: {
    color: appTheme.colors.textMuted,
    lineHeight: 18,
    fontSize: 12,
  },
  row: {
    flexDirection: "row",
    gap: appTheme.spacing.sm,
    flexWrap: "wrap",
  },
  label: {
    color: appTheme.colors.text,
    fontWeight: "700",
    fontSize: 14,
    textTransform: "uppercase",
    letterSpacing: 1.3,
  },
  oauthButton: {
    borderRadius: appTheme.radii.pill,
    borderWidth: 1,
    borderColor: appTheme.colors.line,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  disabledButton: {
    opacity: 0.5,
  },
  oauthText: {
    color: appTheme.colors.text,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    fontSize: 12,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.line,
    color: appTheme.colors.text,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.md,
  },
  primaryButton: {
    backgroundColor: appTheme.colors.hotPink,
    paddingHorizontal: appTheme.spacing.lg,
    paddingVertical: appTheme.spacing.md,
    borderRadius: appTheme.radii.pill,
    alignSelf: "flex-start",
  },
  primaryText: {
    color: "#1C0824",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  secondaryButton: {
    backgroundColor: appTheme.colors.cyan,
    paddingHorizontal: appTheme.spacing.lg,
    paddingVertical: appTheme.spacing.md,
    borderRadius: appTheme.radii.pill,
    alignSelf: "flex-start",
  },
  secondaryText: {
    color: "#092125",
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  linkText: {
    color: appTheme.colors.lime,
    fontWeight: "700",
    marginTop: 6,
  },
});
