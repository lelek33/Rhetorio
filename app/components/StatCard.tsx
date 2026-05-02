import { StyleSheet, Text, View } from "react-native";

import { colors } from "../constants/colors";

type Props = {
  label: string;
  value: string | number;
};

export function StatCard({ label, value }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  value: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "800"
  },
  label: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 4
  }
});
