import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";

import { AppButton } from "../components/AppButton";
import { ScreenContainer } from "../components/ScreenContainer";
import { colors } from "../constants/colors";
import { typography } from "../constants/typography";
import { useAuth } from "../hooks/useAuth";
import { sendPasswordReset, signIn, signUp, updatePassword } from "../services/supabase/auth";
import { maskEmail } from "../utils/maskEmail";
import { validateEmail, validatePassword } from "../utils/validators";

type AuthMode = "login" | "signup" | "forgot";

export function AuthScreen() {
  const { passwordRecovery, clearPasswordRecovery } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState<string | null>(null);

  const signupMode = mode === "signup";
  const forgotMode = mode === "forgot";

  async function submit() {
    if (passwordRecovery) return submitNewPassword();
    if (!validateEmail(email)) return Alert.alert("E-Mail prüfen", "Bitte gib eine gültige E-Mail-Adresse ein.");
    if (forgotMode) return submitPasswordReset();
    if (!validatePassword(password)) return Alert.alert("Passwort prüfen", "Das Passwort braucht mindestens 6 Zeichen.");

    setLoading(true);
    try {
      if (signupMode) {
        const result = await signUp(email.trim(), password);
        const identities = result.user && "identities" in result.user ? result.user.identities : undefined;
        if (Array.isArray(identities) && identities.length === 0) {
          Alert.alert("E-Mail bereits registriert", "Diese E-Mail ist bereits registriert. Logge dich ein oder nutze Passwort vergessen.");
          setMode("login");
          return;
        }
        if (!result.session) {
          setConfirmationEmail(maskEmail(email.trim()));
          return;
        }
      } else {
        await signIn(email.trim(), password);
      }
    } catch (error) {
      Alert.alert("Anmeldung fehlgeschlagen", error instanceof Error ? error.message : "Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  async function submitPasswordReset() {
    setLoading(true);
    try {
      await sendPasswordReset(email.trim());
      setResetEmail(maskEmail(email.trim()));
    } catch (error) {
      Alert.alert("Reset fehlgeschlagen", error instanceof Error ? error.message : "Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  async function submitNewPassword() {
    if (!validatePassword(password)) return Alert.alert("Passwort prüfen", "Das Passwort braucht mindestens 6 Zeichen.");
    if (password !== confirmPassword) return Alert.alert("Passwörter prüfen", "Die Passwörter stimmen nicht überein.");

    setLoading(true);
    try {
      await updatePassword(password);
      clearPasswordRecovery();
    } catch (error) {
      Alert.alert("Passwort konnte nicht geändert werden", error instanceof Error ? error.message : "Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    setConfirmationEmail(null);
    setResetEmail(null);
  }

  const title = passwordRecovery ? "Neues Passwort setzen" : forgotMode ? "Passwort vergessen" : signupMode ? "Account erstellen" : "Willkommen zurück";
  const buttonTitle = passwordRecovery ? "Passwort speichern" : forgotMode ? "Reset-Link senden" : signupMode ? "Kostenlos registrieren" : "Einloggen";

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.brand}>RhetoCoach</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Trainiere echte Gespräche privat mit deinem KI-Coach Rheto.</Text>
      </View>

      <View style={styles.form}>
        {confirmationEmail ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Bestätige deine E-Mail</Text>
            <Text style={styles.noticeText}>Wir haben einen Bestätigungslink an {confirmationEmail} gesendet. Danach kannst du dich hier einloggen.</Text>
          </View>
        ) : null}
        {resetEmail ? (
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Reset-Link versendet</Text>
            <Text style={styles.noticeText}>Wir haben einen Link zum Zurücksetzen an {resetEmail} gesendet.</Text>
          </View>
        ) : null}

        {!passwordRecovery ? (
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="E-Mail"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
        ) : null}
        {!forgotMode || passwordRecovery ? (
          <TextInput
            placeholder={passwordRecovery ? "Neues Passwort" : "Passwort"}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />
        ) : null}
        {passwordRecovery ? (
          <TextInput
            placeholder="Neues Passwort wiederholen"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
          />
        ) : null}
      </View>

      <View style={styles.actions}>
        <AppButton title={buttonTitle} onPress={submit} loading={loading} />
        {!passwordRecovery && !forgotMode ? <AppButton title="Passwort vergessen" onPress={() => switchMode("forgot")} variant="ghost" /> : null}
        {!passwordRecovery ? (
          <AppButton
            title={signupMode || forgotMode ? "Zurück zum Login" : "Neuen Account erstellen"}
            onPress={() => switchMode(signupMode || forgotMode ? "login" : "signup")}
            variant="ghost"
          />
        ) : null}
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
  notice: {
    backgroundColor: colors.softAccent,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: 14,
    gap: 6
  },
  noticeTitle: {
    color: colors.primary,
    fontWeight: "800"
  },
  noticeText: {
    color: colors.text,
    lineHeight: 20
  },
  actions: {
    gap: 8
  }
});
