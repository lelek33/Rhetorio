import { Briefcase, MessageCircle, Sparkles, BadgeEuro } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../constants/colors";
import { Scenario } from "../types/scenario";

type Props = {
  scenario: Scenario;
  onPress: () => void;
};

export function ScenarioCard({ scenario, onPress }: Props) {
  const Icon = scenario.category === "Bewerbung" ? Briefcase : scenario.category === "Gehalt" ? BadgeEuro : MessageCircle;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.iconWrap}>
        <Icon color={colors.accent} size={22} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{scenario.title}</Text>
          {scenario.is_premium ? <Text style={styles.badge}>Premium</Text> : null}
        </View>
        <Text style={styles.description}>{scenario.description}</Text>
        <View style={styles.metaRow}>
          <Sparkles size={14} color={colors.muted} />
          <Text style={styles.meta}>{scenario.duration_minutes} Min.</Text>
          <Text style={styles.meta}>{scenario.difficulty}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  pressed: {
    opacity: 0.8
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.softAccent
  },
  body: {
    flex: 1,
    gap: 6
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10
  },
  title: {
    flex: 1,
    color: colors.primary,
    fontWeight: "700",
    fontSize: 16
  },
  badge: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700"
  },
  description: {
    color: colors.muted,
    lineHeight: 20
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center"
  },
  meta: {
    color: colors.muted,
    fontSize: 13
  }
});
