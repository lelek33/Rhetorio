import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors } from "../constants/colors";
import { typography } from "../constants/typography";
import { signIn, signUp } from "../services/supabase/auth";
import { validateEmail, validatePassword } from "../utils/validators";

export function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signupMode, setSignupMode] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!validateEmail(email)) return Alert.alert("E-Mail prüfen", "Bitte gib eine gültige E-Mail-Adresse ein.");
    if (!validatePassword(password)) return Alert.alert("Passwort prüfen", "Das Passwort braucht mindestens 6 Zeichen.");

    setLoading(true);
    try {
      if (signupMode) await signUp(email.trim(), password);
      else await signIn(email.trim(), password);
    } catch (error) {
      Alert.alert("Anmeldung fehlgeschlagen", error instanceof Error ? error.message : "Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.brand}>RhetoCoach</Text>
        <Text style={styles.title}>{signupMode ? "Account erstellen" : "Willkommen zurück"}</Text>
        <Text style={styles.subtitle}>Trainiere echte Gespräche privat mit deinem KI-Coach Rheto.</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="E-Mail"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          placeholder="Passwort"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />
      </View>

      <View style={styles.actions}>
        <AppButton title={signupMode ? "Kostenlos registrieren" : "Einloggen"} onPress={submit} loading={loading} />
        <AppButton
          title={signupMode ? "Ich habe schon einen Account" : "Neuen Account erstellen"}
          onPress={() => setSignupMode((value) => !value)}
          variant="ghost"
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 72,
    gap: 12
  },
  brand: {
    color: colors.accent,
    fontWeight: "800"
  },
  title: {
    ...typography.title,
    color: colors.primary
  },
  subtitle: {
    ...typography.body,
    color: colors.muted
  },
  form: {
    gap: 12
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    minHeight: 54,
    fontSize: 16,
    color: colors.primary
  },
  actions: {
    gap: 8
  }
});
