import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft, Send } from "lucide-react-native";
import { useEffect, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { MessageBubble } from "../components/MessageBubble";
import { ScreenContainer } from "../components/ScreenContainer";
import { VoiceButton } from "../components/VoiceButton";
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
  const voice = useRealtimeVoice({ sessionId: conversation.session?.id, scenarioTitle: scenario?.title });

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
    if (conversation.session && analysis) {
      navigation.replace("Analysis", { sessionId: conversation.session.id, analysis });
    }
  }

  return (
    <ScreenContainer scroll={false}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboard}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.back}>
            <ArrowLeft color={colors.primary} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>{scenario?.title ?? "Training"}</Text>
            <Text style={styles.timer}>
              {Math.floor(conversation.elapsedSeconds / 60)}:{String(conversation.elapsedSeconds % 60).padStart(2, "0")} ·{" "}
              {voice.connected ? "Live Voice" : "Textmodus"}
            </Text>
          </View>
        </View>

        {conversation.error && conversation.error !== "SESSION_LIMIT_REACHED" ? <Text style={styles.error}>{conversation.error}</Text> : null}
        {voice.error ? <Text style={styles.error}>{voice.error}</Text> : null}
        <Text style={styles.voiceStatus}>
          {Platform.OS === "web" ? `Voice: ${voice.mode === "idle" ? "bereit" : voice.mode}` : "Live Voice wird später nativ aktiviert."}
        </Text>

        <FlatList
          data={conversation.messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={styles.messages}
        />

        <View style={styles.inputRow}>
          <VoiceButton enabled={Platform.OS === "web"} recording={voice.connected || voice.mode === "connecting"} onPress={voice.toggle} />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Antworte Rheto..."
            multiline
            style={styles.input}
          />
          <Pressable disabled={!text.trim() || conversation.sending} onPress={send} style={styles.send}>
            <Send color={colors.card} size={20} />
          </Pressable>
        </View>

        <AppButton title="Gespräch beenden & Analyse starten" onPress={finish} loading={conversation.loading} variant="secondary" />
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    gap: 12
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center"
  },
  headerText: {
    flex: 1
  },
  title: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "800"
  },
  timer: {
    color: colors.muted
  },
  voiceStatus: {
    color: colors.muted,
    fontSize: 13
  },
  messages: {
    gap: 10,
    paddingVertical: 10
  },
  error: {
    color: colors.error
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10
  },
  input: {
    flex: 1,
    minHeight: 50,
    maxHeight: 110,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.primary
  },
  send: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  }
});
