import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { ScoreCircle } from "../components/ScoreCircle";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors } from "../constants/colors";
import { typography } from "../constants/typography";
import { useAnalysis } from "../hooks/useAnalysis";
import { RootStackParamList } from "../navigation/types";
import { scoreRows } from "../utils/calculateScores";

type Props = NativeStackScreenProps<RootStackParamList, "Analysis">;

export function AnalysisScreen({ navigation, route }: Props) {
  const { analysis: loadedAnalysis, loading, error } = useAnalysis(route.params.sessionId);
  const analysis = route.params.analysis ?? loadedAnalysis;

  if (!analysis) {
    return (
      <ScreenContainer>
        <Text style={styles.title}>Analyse</Text>
        <Text style={styles.muted}>{loading ? "Rheto wertet dein Gespräch aus..." : error ?? "Noch keine Analyse gefunden."}</Text>
        <AppButton title="Zum Verlauf" onPress={() => navigation.navigate("MainTabs")} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.kicker}>Dein Feedback</Text>
        <Text style={styles.title}>Rheto hat dein Gespräch analysiert</Text>
      </View>

      <ScoreCircle score={analysis.score_total} />

      <AppCard>
        <Text style={styles.cardTitle}>Kurzfazit</Text>
        <Text style={styles.body}>{analysis.summary}</Text>
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>Top 3 Stärken</Text>
        {analysis.strengths.slice(0, 3).map((item) => (
          <Text key={item} style={styles.listItem}>• {item}</Text>
        ))}
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>Top 3 Verbesserungen</Text>
        {analysis.weaknesses.slice(0, 3).map((item) => (
          <Text key={item} style={styles.listItem}>• {item}</Text>
        ))}
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>Bessere Formulierungen</Text>
        {analysis.better_phrases.map((phrase) => (
          <View key={`${phrase.original}-${phrase.improved}`} style={styles.phrase}>
            <Text style={styles.original}>{phrase.original}</Text>
            <Text style={styles.improved}>{phrase.improved}</Text>
            <Text style={styles.reason}>{phrase.reason}</Text>
          </View>
        ))}
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>Detail-Scores</Text>
        {scoreRows(analysis).map((row) => (
          <View key={row.label} style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>{row.label}</Text>
            <Text style={styles.scoreValue}>{row.value}{row.label === "Füllwörter" ? "" : "/100"}</Text>
          </View>
        ))}
      </AppCard>

      <AppCard>
        <Text style={styles.cardTitle}>Nächste Übung</Text>
        <Text style={styles.body}>{analysis.next_exercise}</Text>
      </AppCard>

      <AppButton title="Weiter trainieren" onPress={() => navigation.navigate("MainTabs")} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8
  },
  kicker: {
    color: colors.accent,
    fontWeight: "800"
  },
  title: {
    ...typography.h1,
    color: colors.primary
  },
  muted: {
    color: colors.muted
  },
  cardTitle: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 17
  },
  body: {
    color: colors.text,
    lineHeight: 22
  },
  listItem: {
    color: colors.text,
    lineHeight: 22
  },
  phrase: {
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  original: {
    color: colors.error
  },
  improved: {
    color: colors.success,
    fontWeight: "800"
  },
  reason: {
    color: colors.muted,
    lineHeight: 20
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12
  },
  scoreLabel: {
    color: colors.text
  },
  scoreValue: {
    color: colors.primary,
    fontWeight: "800"
  }
});
