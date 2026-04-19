import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import * as Linking from "expo-linking";
import { router } from "expo-router";

import { JewelCaseCard } from "../../components/JewelCaseCard";
import { RetroScreen } from "../../components/RetroScreen";
import { useAuth } from "../../contexts/AuthContext";
import { getAuthErrorMessage } from "../../lib/auth";
import { appTheme } from "../../theme";

export default function AuthCallbackScreen() {
  const liveUrl = Linking.useURL();
  const { consumeAuthCallbackUrl } = useAuth();
  const [checkedInitialUrl, setCheckedInitialUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(liveUrl);

  useEffect(() => {
    if (liveUrl) {
      setResolvedUrl(liveUrl);
    }
  }, [liveUrl]);

  useEffect(() => {
    let isMounted = true;

    Linking.getInitialURL()
      .then((initialUrl) => {
        if (!isMounted) {
          return;
        }

        if (initialUrl) {
          setResolvedUrl((currentUrl) => currentUrl ?? initialUrl);
        }

        setCheckedInitialUrl(true);
      })
      .catch((nextError) => {
        if (!isMounted) {
          return;
        }

        setError(getAuthErrorMessage(nextError));
        setCheckedInitialUrl(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!resolvedUrl) {
      return;
    }

    let isMounted = true;

    consumeAuthCallbackUrl(resolvedUrl)
      .then(() => {
        if (isMounted) {
          router.replace("/(tabs)");
        }
      })
      .catch((nextError) => {
        if (isMounted) {
          setError(getAuthErrorMessage(nextError));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [consumeAuthCallbackUrl, resolvedUrl]);

  return (
    <RetroScreen>
      <View style={styles.container}>
        <JewelCaseCard title="Authenticating..." eyebrow="burner callback">
          {error ? (
            <View style={styles.content}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={() => router.replace("/(auth)/welcome")} style={styles.button}>
                <Text style={styles.buttonText}>Back to welcome</Text>
              </Pressable>
            </View>
          ) : !resolvedUrl && checkedInitialUrl ? (
            <View style={styles.content}>
              <Text style={styles.helperText}>
                Burner never received a callback URL. Retry the sign-in flow from the welcome screen.
              </Text>
              <Pressable onPress={() => router.replace("/(auth)/welcome")} style={styles.button}>
                <Text style={styles.buttonText}>Return</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.content}>
              <ActivityIndicator color={appTheme.colors.lime} />
              <Text style={styles.helperText}>
                Burning the session into place. Stay here while Burner swaps the callback for a real
                login.
              </Text>
            </View>
          )}
        </JewelCaseCard>
      </View>
    </RetroScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  content: {
    gap: appTheme.spacing.md,
  },
  helperText: {
    color: appTheme.colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: appTheme.colors.hotPink,
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    alignSelf: "flex-start",
    backgroundColor: appTheme.colors.cyan,
    borderRadius: appTheme.radii.pill,
    paddingHorizontal: appTheme.spacing.lg,
    paddingVertical: appTheme.spacing.md,
  },
  buttonText: {
    color: "#092125",
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
});
