import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { AppCard } from "../components/AppCard";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors } from "../constants/colors";
import { typography } from "../constants/typography";
import { useAuth } from "../hooks/useAuth";
import { listHistory } from "../services/supabase/sessions";
import { HistoryItem } from "../types/session";
import { formatDate, formatDuration } from "../utils/formatDate";

export function HistoryScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      setLoading(true);
      listHistory(user.id)
        .then(setItems)
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    }, [user?.id])
  );

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Verlauf</Text>
        <Text style={styles.subtitle}>Deine gespeicherten Sessions und wichtigsten Tipps.</Text>
      </View>

      {loading ? <ActivityIndicator color={colors.accent} /> : null}
      {!loading && !items.length ? <Text style={styles.empty}>Noch keine abgeschlossenen Trainings.</Text> : null}

      {items.map((item) => (
        <AppCard key={item.id}>
          <Text style={styles.cardTitle}>{formatDate(item.started_at)} · {item.scenario_title}</Text>
          <Text style={styles.meta}>{item.score_total ?? "-"} / 100 · {formatDuration(item.duration_seconds)}</Text>
          <Text style={styles.tip}>Tipp: {item.main_tip ?? "Mehr offene Fragen stellen."}</Text>
        </AppCard>
      ))}
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
  empty: {
    color: colors.muted
  },
  cardTitle: {
    color: colors.primary,
    fontWeight: "800"
  },
  meta: {
    color: colors.muted
  },
  tip: {
    color: colors.text,
    lineHeight: 21
  }
});
