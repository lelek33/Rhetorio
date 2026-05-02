import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "../components/ScreenContainer";
import { ScenarioCard } from "../components/ScenarioCard";
import { colors } from "../constants/colors";
import { typography } from "../constants/typography";
import { useScenarios } from "../hooks/useScenarios";
import { RootStackParamList } from "../navigation/types";

export function TrainingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { grouped, loading, error } = useScenarios();
  const hasScenarios = Object.values(grouped).some((scenarios) => scenarios.length > 0);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Training</Text>
        <Text style={styles.subtitle}>Wähle ein Szenario. Rheto bleibt im Gespräch in der Rolle, Feedback kommt erst danach.</Text>
      </View>

      {loading ? <ActivityIndicator color={colors.accent} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !hasScenarios ? <Text style={styles.empty}>Noch keine Szenarien gefunden. Bitte prüfe die Supabase Migration.</Text> : null}

      {Object.entries(grouped).map(([category, scenarios]) =>
        scenarios.length ? (
          <View key={category} style={styles.section}>
            <Text style={styles.sectionTitle}>{category}</Text>
            {scenarios.map((scenario) => (
              <ScenarioCard key={scenario.id} scenario={scenario} onPress={() => navigation.navigate("ScenarioDetail", { scenarioId: scenario.id })} />
            ))}
          </View>
        ) : null
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 8
  },
  title: {
    ...typography.title,
    color: colors.primary
  },
  subtitle: {
    ...typography.body,
    color: colors.muted
  },
  section: {
    gap: 12
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.primary
  },
  error: {
    color: colors.error
  },
  empty: {
    color: colors.muted,
    lineHeight: 21
  }
});
