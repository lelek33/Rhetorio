import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { VoiceOrb } from "../components/VoiceOrb";
import { colors } from "../constants/colors";
import { typography } from "../constants/typography";
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
  const conversation = useConversationSession(user?.id, scenario);
  const voice = useRealtimeVoice({ sessionId: conversation.session?.id, scenario });

  useEffect(() => {
    getScenario(route.params.scenarioId).then(setScenario).catch(() => setScenario(null));
  }, [route.params.scenarioId]);

  useEffect(() => {
    if (conversation.error === "SESSION_LIMIT_REACHED") navigation.replace("Upgrade");
  }, [conversation.error, navigation]);

  async function finish() {
    if (voice.connected || voice.mode === "connecting") await voice.stop();
    const analysis = await conversation.finish();
    if (conversation.session && analysis) {
      navigation.replace("Analysis", { sessionId: conversation.session.id, analysis });
    }
  }

  const idle = voice.mode === "idle" || voice.mode === "error";
  const subtitle = (() => {
    if (voice.mode === "speaking") return "Rheto spricht …";
    if (voice.mode === "connected") return "Du bist dran — sprich einfach los.";
    if (voice.mode === "connecting") return "Verbinde …";
    if (voice.mode === "error") return "Verbindung verloren. Tippe zum erneuten Starten.";
    return "Tippe auf die Kugel, um das Gespräch zu starten.";
  })();

  const elapsed = `${Math.floor(conversation.elapsedSeconds / 60)}:${String(conversation.elapsedSeconds % 60).padStart(2, "0")}`;
  const sessionError = conversation.error && conversation.error !== "SESSION_LIMIT_REACHED" ? conversation.error : null;
  const displayError = sessionError ?? voice.error ?? null;

  return (
    <ScreenContainer scroll={false}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft color={colors.primary} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>{scenario?.title ?? "Training"}</Text>
          <Text style={styles.timer}>{elapsed} · Live Voice</Text>
        </View>
      </View>

      {displayError ? <Text style={styles.error}>{displayError}</Text> : null}

      <View style={styles.center}>
        <VoiceOrb mode={voice.mode} onPress={idle ? voice.start : undefined} />
        <Text style={styles.subtitle}>{subtitle}</Text>
        {idle ? <Text style={styles.hint}>Tipp: Kopfhörer nutzen für die beste Klangqualität.</Text> : null}
      </View>

      <AppButton
        title="Gespräch beenden & Analyse starten"
        onPress={finish}
        loading={conversation.loading}
        variant="secondary"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
  error: {
    color: colors.error
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14
  },
  subtitle: {
    ...typography.body,
    color: colors.primary,
    textAlign: "center"
  },
  hint: {
    color: colors.muted,
    fontSize: 13,
    textAlign: "center"
  }
});
