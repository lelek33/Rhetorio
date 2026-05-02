import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";

type Props = {
  score: number;
  size?: number;
};

export function ScoreCircle({ score, size = 128 }: Props) {
  const borderColor = score >= 80 ? colors.success : score >= 60 ? colors.warning : colors.accent;

  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, borderColor }]}>
      <Text style={styles.score}>{score}</Text>
      <Text style={styles.label}>Score</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignSelf: "center",
    borderWidth: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card
  },
  score: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: "800"
  },
  label: {
    color: colors.muted,
    fontSize: 13
  }
});
