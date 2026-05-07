import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { VoicePicker } from "../components/VoicePicker";
import { colors } from "../constants/colors";
import { typography } from "../constants/typography";
import { AuthStackParamList } from "../navigation/types";
import { setOnboardingSeen } from "../services/onboarding";
import { defaultVoiceId, getVoicePreference, setVoicePreference } from "../services/voicePreference";

type Props = NativeStackScreenProps<AuthStackParamList, "Onboarding">;

const slides = [
  {
    title: "Übe echte Gespräche mit KI",
    text: "Trainiere Smalltalk, Bewerbungsgespräche und Gehaltsverhandlungen realistisch mit deinem KI-Coach."
  },
  {
    title: "Sprich mit Rheto",
    text: "Wähle ein Szenario und führe ein realistisches Gespräch."
  },
  {
    title: "Bekomme ehrliches Feedback",
    text: "Erhalte konkrete Tipps, bessere Formulierungen und deinen Fortschritt."
  }
];

const goals = ["Smalltalk", "Bewerbung", "Gehaltsverhandlung", "Selbstbewusster sprechen", "Präsentationen", "Alltag & Dating"];

export function OnboardingScreen({ navigation }: Props) {
  const [index, setIndex] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [voiceId, setVoiceId] = useState<string>(defaultVoiceId);
  const current = slides[index];
  const lastSlide = index === slides.length - 1;

  useEffect(() => {
    getVoicePreference().then(setVoiceId);
  }, []);

  async function pickVoice(nextVoiceId: string) {
    setVoiceId(nextVoiceId);
    await setVoicePreference(nextVoiceId);
  }

  async function next() {
    if (lastSlide) {
      await setVoicePreference(voiceId);
      await setOnboardingSeen();
      navigation.replace("Auth");
    } else {
      setIndex((value) => value + 1);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.hero}>
        <Text style={styles.kicker}>RhetoCoach</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.text}>{current.text}</Text>
      </View>

      <View style={styles.dots}>
        {slides.map((slide, slideIndex) => (
          <View key={slide.title} style={[styles.dot, slideIndex === index && styles.activeDot]} />
        ))}
      </View>

      {lastSlide ? (
        <View style={styles.lastSlide}>
          <View style={styles.goalWrap}>
            <Text style={styles.sectionTitle}>Was möchtest du verbessern?</Text>
            <View style={styles.goalGrid}>
              {goals.map((goal) => (
                <Pressable
                  key={goal}
                  onPress={() => setSelectedGoal(goal)}
                  style={[styles.goal, selectedGoal === goal && styles.goalSelected]}
                >
                  <Text style={[styles.goalText, selectedGoal === goal && styles.goalTextSelected]}>{goal}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <VoicePicker
            value={voiceId}
            onChange={pickVoice}
            title="Wähle Rhetos Stimme"
            subtitle="Du kannst sie später jederzeit im Profil ändern."
          />
        </View>
      ) : null}

      <View style={styles.footer}>
        <AppButton title={lastSlide ? "Kostenlos starten" : "Weiter"} onPress={next} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    justifyContent: "center",
    gap: 14
  },
  kicker: {
    color: colors.accent,
    fontWeight: "800",
    letterSpacing: 0
  },
  title: {
    ...typography.title,
    color: colors.primary
  },
  text: {
    ...typography.body,
    color: colors.muted
  },
  dots: {
    flexDirection: "row",
    gap: 8,
    alignSelf: "center"
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.accent
  },
  lastSlide: {
    gap: 22
  },
  goalWrap: {
    gap: 12
  },
  sectionTitle: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 17
  },
  goalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  goal: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border
  },
  goalSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.softAccent
  },
  goalText: {
    color: colors.text,
    fontWeight: "600"
  },
  goalTextSelected: {
    color: colors.accent
  },
  footer: {
    gap: 10
  }
});
