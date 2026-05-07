import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Upload } from "lucide-react-native";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors } from "../constants/colors";
import { typography } from "../constants/typography";
import { RootStackParamList } from "../navigation/types";
import { pickAndReadTextFile } from "../services/fileUpload";
import { CustomTrainingType, customTrainingTypes } from "../types/customTraining";

const minContentChars = 80;

export function CustomTrainingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [type, setType] = useState<CustomTrainingType>("quiz");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [filename, setFilename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pickingFile, setPickingFile] = useState(false);

  async function pickFile() {
    setError(null);
    setPickingFile(true);
    try {
      const result = await pickAndReadTextFile();
      if (!result) return;
      setContent(result.text);
      setFilename(result.filename);
      if (!title.trim()) setTitle(result.filename.replace(/\.[^.]+$/, ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Datei konnte nicht gelesen werden.");
    } finally {
      setPickingFile(false);
    }
  }

  function clearFile() {
    setContent("");
    setFilename(null);
  }

  function start() {
    if (content.trim().length < minContentChars) {
      setError("Das Material ist sehr kurz. Lade eine Datei hoch oder füge mindestens ein paar Sätze ein.");
      return;
    }
    navigation.navigate("Session", {
      customTraining: {
        type,
        title: title.trim(),
        content: content.trim()
      }
    });
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft color={colors.primary} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Eigenes Training</Text>
          <Text style={styles.subtitle}>Lade dein Material hoch — Rheto baut daraus eine Übung.</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trainingsart</Text>
        <View style={styles.typeGrid}>
          {customTrainingTypes.map((option) => (
            <Pressable
              key={option.id}
              onPress={() => setType(option.id)}
              style={[styles.typeCard, type === option.id && styles.typeCardSelected]}
            >
              <Text style={[styles.typeLabel, type === option.id && styles.typeLabelSelected]}>{option.label}</Text>
              <Text style={[styles.typeDescription, type === option.id && styles.typeDescriptionSelected]}>{option.description}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Titel (optional)</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="z.B. BWL-Klausur, CV Max Müller, Pitch v3"
          style={styles.input}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Material</Text>
        {Platform.OS === "web" ? (
          <View style={styles.uploadRow}>
            {filename ? (
              <View style={styles.fileChip}>
                <Text style={styles.fileChipText}>{filename}</Text>
                <Pressable onPress={clearFile}>
                  <Text style={styles.fileChipClear}>Entfernen</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={pickFile} disabled={pickingFile} style={styles.uploadButton}>
                <Upload color={colors.accent} size={18} />
                <Text style={styles.uploadButtonText}>
                  {pickingFile ? "Wird gelesen…" : "Textdatei hochladen (.txt, .md)"}
                </Text>
              </Pressable>
            )}
            <Text style={styles.uploadHint}>oder Inhalt direkt unten einfügen</Text>
          </View>
        ) : null}

        <TextInput
          value={content}
          onChangeText={(value) => {
            setContent(value);
            if (filename && value !== content) setFilename(null);
          }}
          placeholder="Hier Skript, CV, Anschreiben oder Manuskript einfügen…"
          multiline
          style={styles.textarea}
          textAlignVertical="top"
        />
        <Text style={styles.counter}>{content.trim().length} Zeichen · max. ~12.000 werden verwendet</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.footer}>
        <AppButton title="Training starten" onPress={start} variant="primary" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start"
  },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center"
  },
  headerText: { flex: 1, gap: 4 },
  title: {
    ...typography.title,
    color: colors.primary
  },
  subtitle: {
    ...typography.body,
    color: colors.muted
  },
  section: { gap: 10 },
  sectionTitle: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 16
  },
  typeGrid: { gap: 10 },
  typeCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4
  },
  typeCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.softAccent
  },
  typeLabel: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 16
  },
  typeLabelSelected: {
    color: colors.accent
  },
  typeDescription: {
    color: colors.muted,
    fontSize: 13
  },
  typeDescriptionSelected: {
    color: colors.primary
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    minHeight: 48,
    fontSize: 15,
    color: colors.primary
  },
  uploadRow: { gap: 8 },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.softAccent,
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: "dashed"
  },
  uploadButtonText: {
    color: colors.accent,
    fontWeight: "700"
  },
  uploadHint: {
    color: colors.muted,
    fontSize: 12
  },
  fileChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.softAccent,
    borderWidth: 1,
    borderColor: colors.accent,
    gap: 12
  },
  fileChipText: {
    color: colors.primary,
    fontWeight: "700",
    flex: 1
  },
  fileChipClear: {
    color: colors.error,
    fontWeight: "700"
  },
  textarea: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 140,
    maxHeight: 240,
    fontSize: 14,
    color: colors.primary
  },
  counter: {
    color: colors.muted,
    fontSize: 12
  },
  error: { color: colors.error },
  footer: { gap: 8 }
});
