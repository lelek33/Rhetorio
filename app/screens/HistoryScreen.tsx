import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { AppCard } from "../components/AppCard";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors } from "../constants/colors";
import { typography } from "../constants/typography";
import { useAuth } from "../hooks/useAuth";
import { listHistory } from "../services/supabase/sessions";
import { HistoryItem } from "../types/session";
import { formatDate, formatDuration } from "../utils/formatDate";

export function HistoryScreen() {
  const navigation = useNavigation();
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
        <Pressable onPress={() => navigation.goBack()} style={styles.back}>
          <ArrowLeft color={colors.primary} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Verlauf</Text>
          <Text style={styles.subtitle}>Deine gespeicherten Sessions und wichtigsten Tipps.</Text>
        </View>
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
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12
  },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center"
  },
  headerText: {
    flex: 1,
    gap: 4
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
