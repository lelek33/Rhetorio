import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Menu, Settings2, ChevronDown, Plus, Mic, Sparkles } from "lucide-react-native";
import { useEffect, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { MessageBubble } from "../components/MessageBubble";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors } from "../constants/colors";
import { useAuth } from "../hooks/useAuth";
import { useConversationSession } from "../hooks/useConversationSession";
import { useRealtimeVoice } from "../hooks/useRealtimeVoice";
import { RootStackParamList } from "../navigation/types";
import { getScenario } from "../services/supabase/scenarios";
import { Scenario } from "../types/scenario";

type Props = NativeStackScreenProps<RootStackParamList, "Session">;

export function SessionScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [text, setText] = useState("");
  const conversation = useConversationSession(user?.id, scenario);
  const voice = useRealtimeVoice({ sessionId: conversation.session?.id, scenario });

  useEffect(() => {
    getScenario(route.params.scenarioId).then(setScenario).catch(() => setScenario(null));
  }, [route.params.scenarioId]);

  useEffect(() => {
    if (conversation.error === "SESSION_LIMIT_REACHED") navigation.replace("Upgrade");
  }, [conversation.error, navigation]);

  async function send() {
    const nextText = text;
    setText("");
    await conversation.send(nextText);
  }

  async function finish() {
    if (voice.connected || voice.mode === "connecting") await voice.stop();
    const analysis = await conversation.finish();
    if (conversation.session && analysis) navigation.replace("Analysis", { sessionId: conversation.session.id, analysis });
  }

  return (
    <ScreenContainer scroll={false} contentStyle={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <View style={styles.headerBar}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}><Menu size={22} color={colors.muted} /></Pressable>
          <View style={styles.brandWrap}>
            <Text style={styles.brand}>Rhetorio</Text>
            <Text style={styles.brandSub}>Audio-Coach</Text>
          </View>
          <Pressable style={styles.iconButton}><Settings2 size={22} color={colors.muted} /></Pressable>
        </View>

        <View style={styles.scenarioCard}>
          <View style={styles.dot} />
          <View style={styles.scenarioTextWrap}>
            <Text style={styles.scenarioTitle}>{scenario?.title ?? "Trainingschat"}</Text>
            <Text style={styles.timer}>{Math.floor(conversation.elapsedSeconds / 60)}:{String(conversation.elapsedSeconds % 60).padStart(2, "0")} · {voice.connected ? "Live Voice" : "Textmodus"}</Text>
          </View>
          <ChevronDown color={colors.muted} />
        </View>

        <FlatList data={conversation.messages} keyExtractor={(item) => item.id} renderItem={({ item }) => <MessageBubble message={item} />} contentContainerStyle={styles.messages} />

        <View style={styles.voiceOrb}>
          <View style={styles.orbInner} />
        </View>

        <View style={styles.inputShell}>
          <Pressable style={styles.circleInputButton}><Plus color={colors.primary} /></Pressable>
          <TextInput value={text} onChangeText={setText} placeholder="Rhetorio fragen" placeholderTextColor="#8D93A8" multiline style={styles.input} />
          <Pressable onPress={voice.toggle} style={[styles.circleInputButton, (voice.connected || voice.mode === "connecting") && styles.activeMic]}><Mic color={colors.primary} /></Pressable>
        </View>

        <Pressable style={styles.finishButton} onPress={finish}>
          <Text style={styles.finishText}>Gespräch beenden & Analyse starten</Text>
          <Sparkles size={17} color="#F2F4FF" />
        </Pressable>

        {conversation.error && conversation.error !== "SESSION_LIMIT_REACHED" ? <Text style={styles.error}>{conversation.error}</Text> : null}
        {voice.error ? <Text style={styles.error}>{voice.error}</Text> : null}
        {!!text.trim() ? <Pressable disabled={conversation.sending} style={styles.floatingSend} onPress={send}><Text style={styles.floatingSendText}>Senden</Text></Pressable> : null}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#F5F6FB" },
  keyboard: { flex: 1, gap: 14 },
  headerBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconButton: { width: 52, height: 52, borderRadius: 26, backgroundColor: "#FFFFFFCC", alignItems: "center", justifyContent: "center" },
  brandWrap: { alignItems: "center" },
  brand: { fontSize: 46/2, fontWeight: "800", color: "#1E2746" },
  brandSub: { color: "#8890A5", fontSize: 17 },
  scenarioCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFFE6", borderRadius: 24, padding: 16, gap: 12 },
  dot: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#E2E5FF" },
  scenarioTextWrap: { flex: 1 },
  scenarioTitle: { fontSize: 22/1.3, color: "#1E2746", fontWeight: "700" },
  timer: { color: "#8E95AD", marginTop: 3, fontSize: 15 },
  messages: { gap: 14, paddingTop: 8, paddingBottom: 10 },
  voiceOrb: { alignSelf: "center", width: 165, height: 165, borderRadius: 83, backgroundColor: "#C9D4FF44", alignItems: "center", justifyContent: "center", marginVertical: 8 },
  orbInner: { width: 134, height: 134, borderRadius: 67, backgroundColor: "#AEBCFF" },
  inputShell: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFFE8", borderRadius: 34, borderWidth: 1, borderColor: "#EEF0F5", padding: 8, gap: 8 },
  circleInputButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#ECEEF4", alignItems: "center", justifyContent: "center" },
  activeMic: { backgroundColor: "#D9E0FF" },
  input: { flex: 1, minHeight: 46, maxHeight: 100, borderRadius: 23, backgroundColor: "#F1F2F7", paddingHorizontal: 16, color: colors.primary },
  finishButton: { minHeight: 68, borderRadius: 34, backgroundColor: "#667DF5", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  finishText: { color: "#FFFFFF", fontSize: 18, fontWeight: "700" },
  error: { color: colors.error, textAlign: "center" },
  floatingSend: { position: "absolute", right: 8, bottom: 94, backgroundColor: "#7A8DF6", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
  floatingSendText: { color: "white", fontWeight: "700" }
});
