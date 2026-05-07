import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft, Trash2, Upload } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors } from "../constants/colors";
import { typography } from "../constants/typography";
import { useAuth } from "../hooks/useAuth";
import { RootStackParamList } from "../navigation/types";
import { createCustomScenarioInDb } from "../services/customTraining";
import { LoadedFileType, pickAndReadDocument } from "../services/fileUpload";
import {
  UserDocument,
  UserDocumentSourceType,
  createUserDocument,
  deleteUserDocument,
  listUserDocuments
} from "../services/supabase/userDocuments";
import { CustomTrainingType, customTrainingTypes } from "../types/customTraining";

const minContentChars = 80;

export function CustomTrainingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();

  const [type, setType] = useState<CustomTrainingType>("quiz");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [filename, setFilename] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<UserDocumentSourceType>("paste");
  const [savedDocuments, setSavedDocuments] = useState<UserDocument[]>([]);
  const [loadedDocumentId, setLoadedDocumentId] = useState<string | null>(null);
  const [saveOnStart, setSaveOnStart] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [pickingFile, setPickingFile] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    listUserDocuments(user.id).then(setSavedDocuments).catch(() => setSavedDocuments([]));
  }, [user?.id]);

  async function pickFile() {
    setError(null);
    setPickingFile(true);
    try {
      const result = await pickAndReadDocument();
      if (!result) return;
      setContent(result.text);
      setFilename(result.filename);
      setSourceType(mapSourceType(result.type));
      setLoadedDocumentId(null);
      if (!title.trim()) setTitle(result.filename.replace(/\.[^.]+$/, ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Datei konnte nicht gelesen werden.");
    } finally {
      setPickingFile(false);
    }
  }

  function loadSaved(document: UserDocument) {
    setContent(document.content);
    setTitle(document.title);
    setFilename(document.source_filename);
    setSourceType(document.source_type);
    setLoadedDocumentId(document.id);
    setSaveOnStart(false);
    setError(null);
  }

  function clearMaterial() {
    setContent("");
    setFilename(null);
    setLoadedDocumentId(null);
    setSourceType("paste");
  }

  async function removeSaved(document: UserDocument) {
    try {
      await deleteUserDocument(document.id);
      setSavedDocuments((current) => current.filter((doc) => doc.id !== document.id));
      if (loadedDocumentId === document.id) clearMaterial();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Material konnte nicht gelöscht werden.");
    }
  }

  async function start() {
    if (!user?.id) {
      setError("Bitte erneut einloggen.");
      return;
    }
    const trimmedContent = content.trim();
    if (trimmedContent.length < minContentChars) {
      setError("Das Material ist sehr kurz. Lade eine Datei hoch oder füge mindestens ein paar Sätze ein.");
      return;
    }

    setStarting(true);
    setError(null);
    try {
      if (saveOnStart && !loadedDocumentId) {
        const saved = await createUserDocument({
          userId: user.id,
          title: title.trim() || (filename ?? "Eigenes Material"),
          content: trimmedContent,
          sourceFilename: filename,
          sourceType
        });
        setSavedDocuments((current) => [saved, ...current]);
        setLoadedDocumentId(saved.id);
      }

      const scenario = await createCustomScenarioInDb(user.id, {
        type,
        title: title.trim(),
        content: trimmedContent
      });

      navigation.replace("Session", { scenarioId: scenario.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Training konnte nicht gestartet werden.");
    } finally {
      setStarting(false);
    }
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

      {savedDocuments.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gespeichertes Material</Text>
          <View style={styles.savedList}>
            {savedDocuments.map((doc) => (
              <View key={doc.id} style={[styles.savedCard, loadedDocumentId === doc.id && styles.savedCardSelected]}>
                <Pressable onPress={() => loadSaved(doc)} style={styles.savedCardBody}>
                  <Text style={[styles.savedTitle, loadedDocumentId === doc.id && styles.savedTitleSelected]} numberOfLines={1}>
                    {doc.title}
                  </Text>
                  <Text style={styles.savedMeta}>
                    {doc.source_type.toUpperCase()} · {Math.round(doc.char_count / 100) / 10}k Zeichen
                  </Text>
                </Pressable>
                <Pressable onPress={() => removeSaved(doc)} style={styles.savedDelete} hitSlop={8}>
                  <Trash2 color={colors.error} size={18} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      ) : null}

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
                <Pressable onPress={clearMaterial}>
                  <Text style={styles.fileChipClear}>Entfernen</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={pickFile} disabled={pickingFile} style={styles.uploadButton}>
                <Upload color={colors.accent} size={18} />
                <Text style={styles.uploadButtonText}>
                  {pickingFile ? "Wird gelesen…" : "Datei hochladen (.pdf, .txt, .md)"}
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
            if (loadedDocumentId) setLoadedDocumentId(null);
            if (filename && value !== content) setFilename(null);
          }}
          placeholder="Hier Skript, CV, Anschreiben oder Manuskript einfügen…"
          multiline
          style={styles.textarea}
          textAlignVertical="top"
        />
        <Text style={styles.counter}>{content.trim().length} Zeichen · max. ~12.000 werden verwendet</Text>

        {!loadedDocumentId && content.trim().length >= minContentChars ? (
          <Pressable style={styles.toggleRow} onPress={() => setSaveOnStart((value) => !value)}>
            <View style={[styles.toggleBox, saveOnStart && styles.toggleBoxOn]}>
              {saveOnStart ? <Text style={styles.toggleCheck}>✓</Text> : null}
            </View>
            <Text style={styles.toggleLabel}>Material in meinem Profil speichern</Text>
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.footer}>
        <AppButton title="Training starten" onPress={start} loading={starting} variant="primary" />
      </View>
    </ScreenContainer>
  );
}

function mapSourceType(type: LoadedFileType): UserDocumentSourceType {
  return type;
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
  savedList: { gap: 8 },
  savedCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border
  },
  savedCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.softAccent
  },
  savedCardBody: {
    flex: 1,
    gap: 2
  },
  savedTitle: {
    color: colors.primary,
    fontWeight: "700"
  },
  savedTitleSelected: {
    color: colors.accent
  },
  savedMeta: {
    color: colors.muted,
    fontSize: 12
  },
  savedDelete: {
    paddingLeft: 12
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
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4
  },
  toggleBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center"
  },
  toggleBoxOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent
  },
  toggleCheck: {
    color: colors.card,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 16
  },
  toggleLabel: {
    color: colors.primary,
    fontWeight: "700"
  },
  error: { color: colors.error },
  footer: { gap: 8 }
});
