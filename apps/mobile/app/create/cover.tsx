import { Alert, Image, Pressable, ScrollView, StyleSheet, Text } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";

import { GlitchHeading } from "../../components/GlitchHeading";
import { RetroScreen } from "../../components/RetroScreen";
import { useBurnerComposer } from "../../hooks/useBurnerComposer";
import { appTheme } from "../../theme";

export default function CoverScreen() {
  const draft = useBurnerComposer();

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    if (!asset?.uri) {
      Alert.alert("Could not load image");
      return;
    }

    draft.setField("coverImageUrl", asset.uri);
  }

  return (
    <RetroScreen>
      <ScrollView contentContainerStyle={styles.container}>
        <GlitchHeading title="Cover Art" subtitle="The mystery starts with a suspiciously gorgeous image." />
        {draft.coverImageUrl ? <Image source={{ uri: draft.coverImageUrl }} style={styles.image} /> : null}
        <Pressable onPress={pickImage} style={styles.primaryButton}>
          <Text style={styles.primaryText}>Choose cover image</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/create/preview")} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>Preview the reveal</Text>
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
  image: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: appTheme.radii.lg,
  },
  primaryButton: {
    borderRadius: appTheme.radii.pill,
    backgroundColor: appTheme.colors.hotPink,
    paddingVertical: appTheme.spacing.md,
    alignItems: "center",
  },
  primaryText: {
    color: "#23091D",
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
