import { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../constants/colors";
import { spacing } from "../constants/spacing";

type Props = {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: any;
};

export function ScreenContainer({ children, scroll = true, contentStyle }: Props) {
  const content = <View style={[styles.content, contentStyle]}>{children}</View>;

  return (
    <SafeAreaView style={styles.safe}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background
  },
  scroll: {
    flexGrow: 1
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.lg
  }
});
