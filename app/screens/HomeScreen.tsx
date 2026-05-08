import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { ScreenContainer } from "../components/ScreenContainer";
import { ScenarioCard } from "../components/ScenarioCard";
import { StatCard } from "../components/StatCard";
import { colors } from "../constants/colors";
import { typography } from "../constants/typography";
import { useAuth } from "../hooks/useAuth";
import { useScenarios } from "../hooks/useScenarios";
import { RootStackParamList } from "../navigation/types";

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { profile } = useAuth();
  const { scenarios } = useScenarios();
  const quickStarts = scenarios.slice(0, 3);
  const bestScore = 82;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.greeting}>Guten Morgen</Text>
        <Text style={styles.title}>Was möchtest du heute trainieren?</Text>
      </View>

      <AppCard>
        <Text style={styles.cardLabel}>Tagesübung</Text>
        <Text style={styles.cardTitle}>Smalltalk auf einem Networking-Event</Text>
        <Text style={styles.cardText}>3 Minuten, ein klarer Gesprächseinstieg und mindestens zwei offene Rückfragen.</Text>
        <AppButton title="Jetzt üben" onPress={() => quickStarts[1] && navigation.navigate("Session", { scenarioId: quickStarts[1].id })} />
      </AppCard>

      <AppCard>
        <Text style={styles.cardLabel}>Eigenes Training</Text>
        <Text style={styles.cardTitle}>Lade dein Material hoch</Text>
        <Text style={styles.cardText}>Skript, CV oder Manuskript hochladen — Rheto baut daraus ein Quiz, Bewerbungsgespräch oder Pitch-Sparring.</Text>
        <AppButton
          title="Material hochladen"
          onPress={() => navigation.navigate("MainTabs", { screen: "CustomTraining" } as never)}
          variant="secondary"
        />
      </AppCard>

      <View style={styles.stats}>
        <StatCard label="Trainings diese Woche" value={profile?.free_sessions_used ?? 0} />
        <StatCard label="Bester Score" value={bestScore} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Schnellstart</Text>
        {quickStarts.map((scenario) => (
          <ScenarioCard key={scenario.id} scenario={scenario} onPress={() => navigation.navigate("ScenarioDetail", { scenarioId: scenario.id })} />
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6
  },
  greeting: {
    color: colors.muted,
    fontSize: 16
  },
  title: {
    ...typography.h1,
    color: colors.primary
  },
  cardLabel: {
    color: colors.accent,
    fontWeight: "800"
  },
  cardTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "800"
  },
  cardText: {
    color: colors.muted,
    lineHeight: 21
  },
  stats: {
    flexDirection: "row",
    gap: 12
  },
  section: {
    gap: 12
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.primary
  }
});
