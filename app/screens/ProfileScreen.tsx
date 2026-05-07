import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { LogOut } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { AppCard } from "../components/AppCard";
import { ScreenContainer } from "../components/ScreenContainer";
import { VoicePicker } from "../components/VoicePicker";
import { colors } from "../constants/colors";
import { typography } from "../constants/typography";
import { useAuth } from "../hooks/useAuth";
import { RootStackParamList } from "../navigation/types";
import { signOut } from "../services/supabase/auth";
import { defaultVoiceId, getVoicePreference, setVoicePreference } from "../services/voicePreference";

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, profile } = useAuth();
  const [voiceId, setVoiceId] = useState<string>(defaultVoiceId);

  useEffect(() => {
    getVoicePreference().then(setVoiceId);
  }, []);

  async function pickVoice(nextVoiceId: string) {
    setVoiceId(nextVoiceId);
    await setVoicePreference(nextVoiceId);
  }

  async function logout() {
    try {
      await signOut();
    } catch (error) {
      Alert.alert("Logout fehlgeschlagen", error instanceof Error ? error.message : "Bitte versuche es erneut.");
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.title}>Profil</Text>
        <Text style={styles.subtitle}>{user?.email}</Text>
      </View>

      <AppCard>
        <Text style={styles.label}>Abo-Status</Text>
        <Text style={styles.status}>{profile?.subscription_status ?? "free"}</Text>
        <AppButton title="Premium ansehen" onPress={() => navigation.navigate("Upgrade")} variant="secondary" />
      </AppCard>

      <AppCard>
        <Text style={styles.label}>Trainingsziel</Text>
        <Text style={styles.value}>{profile?.training_goal ?? "Selbstbewusster sprechen"}</Text>
      </AppCard>

      <AppCard>
        <VoicePicker
          value={voiceId}
          onChange={pickVoice}
          title="Rhetos Stimme"
          subtitle="Wird beim nächsten Voice-Training verwendet."
        />
      </AppCard>

      <AppCard>
        <Text style={styles.label}>Datenschutz</Text>
        <Text style={styles.body}>Deine Gespräche sind privat. Audiofunktionen werden später optional mit automatischem Löschen unterstützt.</Text>
      </AppCard>

      <AppCard>
        <Text style={styles.label}>Sprache</Text>
        <Text style={styles.value}>Deutsch</Text>
        <Text style={styles.label}>Support</Text>
        <Text style={styles.value}>support@rhetocoach.app</Text>
      </AppCard>

      <Pressable onPress={logout} style={styles.logout}>
        <LogOut color={colors.error} size={19} />
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6
  },
  title: {
    ...typography.title,
    color: colors.primary
  },
  subtitle: {
    color: colors.muted
  },
  label: {
    color: colors.muted,
    fontWeight: "700"
  },
  status: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  value: {
    color: colors.primary,
    fontWeight: "700"
  },
  body: {
    color: colors.text,
    lineHeight: 22
  },
  logout: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16
  },
  logoutText: {
    color: colors.error,
    fontWeight: "800"
  }
});
