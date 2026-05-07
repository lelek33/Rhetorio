import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../constants/colors";
import { VoiceOption, voiceOptions } from "../services/voicePreference";

type Props = {
  value: string;
  onChange: (voiceId: string) => void;
  title?: string;
  subtitle?: string;
};

export function VoicePicker({ value, onChange, title, subtitle }: Props) {
  return (
    <View style={styles.wrap}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.grid}>
        {voiceOptions.map((option) => (
          <VoiceCard
            key={option.id}
            option={option}
            selected={option.id === value}
            onPress={() => onChange(option.id)}
          />
        ))}
      </View>
    </View>
  );
}

function VoiceCard({ option, selected, onPress }: { option: VoiceOption; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.card, selected && styles.cardSelected]}>
      <Text style={[styles.cardLabel, selected && styles.cardLabelSelected]}>{option.label}</Text>
      <Text style={[styles.cardGender, selected && styles.cardGenderSelected]}>{option.gender}</Text>
      <Text style={[styles.cardDescription, selected && styles.cardDescriptionSelected]}>{option.description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10
  },
  title: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 17
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  card: {
    flexBasis: "47%",
    flexGrow: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.softAccent
  },
  cardLabel: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "800"
  },
  cardLabelSelected: {
    color: colors.accent
  },
  cardGender: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  cardGenderSelected: {
    color: colors.accent
  },
  cardDescription: {
    color: colors.text,
    fontSize: 13
  },
  cardDescriptionSelected: {
    color: colors.primary
  }
});
