import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";

import { GlitchHeading } from "../../components/GlitchHeading";
import { RetroScreen } from "../../components/RetroScreen";
import { useBurnerComposer } from "../../hooks/useBurnerComposer";
import { appTheme } from "../../theme";

export default function CreateDetailsScreen() {
  const draft = useBurnerComposer();

  return (
    <RetroScreen>
      <ScrollView contentContainerStyle={styles.container}>
        <GlitchHeading title="Create Burner" subtitle="Title it like a secret. Write the note like it might matter." />
        <View style={styles.form}>
          <Field
            label="Title"
            value={draft.title}
            onChangeText={(value) => draft.setField("title", value)}
          />
          <Field
            label="Sender name"
            value={draft.senderName}
            onChangeText={(value) => draft.setField("senderName", value)}
          />
          <Field
            label="Message"
            multiline
            value={draft.note ?? ""}
            onChangeText={(value) => draft.setField("note", value)}
          />
          <Pressable onPress={() => router.push("/create/source")} style={styles.button}>
            <Text style={styles.buttonText}>Choose music source</Text>
          </Pressable>
        </View>
      </ScrollView>
    </RetroScreen>
  );
}

function Field({
  label,
  value,
  onChangeText,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText(text: string): void;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        multiline={multiline}
        onChangeText={onChangeText}
        placeholderTextColor={appTheme.colors.textMuted}
        style={[styles.input, multiline ? styles.textarea : null]}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: appTheme.spacing.lg,
    paddingVertical: appTheme.spacing.lg,
  },
  form: {
    gap: appTheme.spacing.md,
  },
  field: {
    gap: appTheme.spacing.xs,
  },
  label: {
    color: appTheme.colors.lime,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontWeight: "700",
  },
  input: {
    borderRadius: appTheme.radii.md,
    borderWidth: 1,
    borderColor: appTheme.colors.line,
    backgroundColor: "rgba(255,255,255,0.08)",
    color: appTheme.colors.text,
    paddingHorizontal: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.md,
  },
  textarea: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  button: {
    marginTop: appTheme.spacing.md,
    borderRadius: appTheme.radii.pill,
    backgroundColor: appTheme.colors.hotPink,
    paddingVertical: appTheme.spacing.md,
    alignItems: "center",
  },
  buttonText: {
    color: "#23091D",
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
});
