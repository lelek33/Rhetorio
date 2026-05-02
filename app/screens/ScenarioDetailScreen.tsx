import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors } from "../constants/colors";
import { typography } from "../constants/typography";
import { RootStackParamList } from "../navigation/types";
import { getScenario } from "../services/supabase/scenarios";
import { Scenario } from "../types/scenario";

type Props = NativeStackScreenProps<RootStackParamList, "ScenarioDetail">;

export function ScenarioDetailScreen({ navigation, route }: Props) {
  const [scenario, setScenario] = useState<Scenario | null>(null);

  useEffect(() => {
    getScenario(route.params.scenarioId).then(setScenario).catch(() => setScenario(null));
  }, [route.params.scenarioId]);

  if (!scenario) {
    return (
      <ScreenContainer>
        <Text style={styles.title}>Szenario nicht gefunden</Text>
        <AppButton title="Zurück" onPress={() => navigation.goBack()} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <ArrowLeft color={colors.primary} />
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.kicker}>{scenario.category}</Text>
        <Text style={styles.title}>{scenario.title}</Text>
        <Text style={styles.subtitle}>{scenario.description}</Text>
      </View>

      <AppCard>
        <Text style={styles.label}>Situation</Text>
        <Text style={styles.body}>{scenario.situation}</Text>
      </AppCard>

      <AppCard>
        <Text style={styles.label}>Ziel</Text>
        <Text style={styles.body}>{scenario.goal}</Text>
      </AppCard>

      <AppCard>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{scenario.duration_minutes} Minuten</Text>
          <Text style={styles.meta}>{scenario.difficulty}</Text>
          {scenario.is_premium ? <Text style={styles.premium}>Premium</Text> : null}
        </View>
        <Text style={styles.label}>Bewertet wird</Text>
        <View style={styles.criteria}>
          {scenario.criteria.map((criterion) => (
            <Text key={criterion} style={styles.chip}>
              {criterion}
            </Text>
          ))}
        </View>
      </AppCard>

      <AppButton title="Training starten" onPress={() => navigation.navigate("Session", { scenarioId: scenario.id })} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card
  },
  header: {
    gap: 8
  },
  kicker: {
    color: colors.accent,
    fontWeight: "800"
  },
  title: {
    ...typography.title,
    color: colors.primary
  },
  subtitle: {
    ...typography.body,
    color: colors.muted
  },
  label: {
    color: colors.primary,
    fontWeight: "800"
  },
  body: {
    color: colors.text,
    lineHeight: 22
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap"
  },
  meta: {
    color: colors.muted,
    fontWeight: "700"
  },
  premium: {
    color: colors.accent,
    fontWeight: "800"
  },
  criteria: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  chip: {
    backgroundColor: colors.softAccent,
    color: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
    overflow: "hidden",
    fontWeight: "700"
  }
});
