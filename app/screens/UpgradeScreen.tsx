import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft, Check } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors } from "../constants/colors";
import { typography } from "../constants/typography";
import { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Upgrade">;

const benefits = ["Mehr Sessions", "Alle Szenarien", "Detaillierte Analysen", "Bessere Formulierungen", "Fortschrittsverlauf", "Später Live Voice"];

export function UpgradeScreen({ navigation }: Props) {
  return (
    <ScreenContainer>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <ArrowLeft color={colors.primary} />
      </Pressable>

      <View style={styles.header}>
        <Text style={styles.kicker}>RhetoCoach Premium</Text>
        <Text style={styles.title}>Trainiere ohne Limit und verbessere deine Gespräche schneller.</Text>
      </View>

      <AppCard>
        {benefits.map((benefit) => (
          <View key={benefit} style={styles.benefit}>
            <Check color={colors.success} size={19} />
            <Text style={styles.benefitText}>{benefit}</Text>
          </View>
        ))}
      </AppCard>

      <View style={styles.prices}>
        <AppCard>
          <Text style={styles.price}>9,99 €/Monat</Text>
          <Text style={styles.muted}>Flexibel monatlich</Text>
        </AppCard>
        <AppCard>
          <Text style={styles.price}>79,99 €/Jahr</Text>
          <Text style={styles.muted}>Besserer Jahrespreis</Text>
        </AppCard>
      </View>

      <AppButton title="Premium vormerken" onPress={() => navigation.goBack()} />
      <Text style={styles.notice}>Noch kein echtes Payment im MVP. RevenueCat ist für den nächsten Schritt vorgesehen.</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card
  },
  header: {
    gap: 10
  },
  kicker: {
    color: colors.accent,
    fontWeight: "800"
  },
  title: {
    ...typography.title,
    color: colors.primary
  },
  benefit: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center"
  },
  benefitText: {
    color: colors.text,
    fontWeight: "700"
  },
  prices: {
    gap: 12
  },
  price: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "800"
  },
  muted: {
    color: colors.muted
  },
  notice: {
    color: colors.muted,
    textAlign: "center",
    lineHeight: 19
  }
});
