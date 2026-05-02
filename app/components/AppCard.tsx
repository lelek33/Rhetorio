import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";

type Props = {
  children: ReactNode;
};

export function AppCard({ children }: Props) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md
  }
});
