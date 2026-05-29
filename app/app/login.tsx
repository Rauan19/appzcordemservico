import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Logo } from "@/components/brand/Logo";
import { Screen } from "@/components/ui/Screen";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/src/contexts/AuthContext";
import { brandName } from "@/src/constants/brand";
import { ApiRequestError } from "@/src/lib/api";
import { colors, shadows, tablet } from "@/src/constants/theme";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("tecnico@zcnet.local");
  const [password, setPassword] = useState("tecnico123");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert("Atenção", "Informe e-mail e senha.");
      return;
    }

    if (trimmedPassword.length < 4) {
      Alert.alert("Atenção", "A senha deve ter pelo menos 4 caracteres.");
      return;
    }

    setLoading(true);
    try {
      await signIn(trimmedEmail, trimmedPassword);
    } catch (err) {
      const msg =
        err instanceof ApiRequestError
          ? err.message
          : "Não foi possível conectar. Verifique a API e o IP.";
      Alert.alert("Erro no login", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll padded={false}>
      <View style={styles.hero}>
        <View style={styles.heroDecor} />
        <View style={styles.heroDecor2} />
        <Logo size="lg" />
        <Text style={styles.heroTitle}>{brandName}</Text>
        <Text style={styles.heroSubtitle}>App do técnico · tablet</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.body}
      >
        <View style={styles.form}>
          <Text style={styles.formTitle}>Entrar</Text>
          <Text style={styles.formHint}>Use suas credenciais de técnico</Text>

          <Input
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="tecnico@zcnet.local"
          />

          <Input
            label="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            placeholder="••••••••"
          />

          <Button title="Entrar" onPress={handleLogin} loading={loading} style={styles.btn} />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.headerBg,
    alignItems: "center",
    paddingTop: 48,
    paddingBottom: 40,
    paddingHorizontal: tablet.padding,
    overflow: "hidden",
  },
  heroDecor: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(43, 140, 255, 0.2)",
    top: -60,
    right: -40,
  },
  heroDecor2: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(30, 91, 184, 0.35)",
    bottom: 20,
    left: -30,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.headerText,
    marginTop: 16,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: tablet.fontSmall,
    color: "rgba(255,255,255,0.8)",
    marginTop: 6,
  },
  body: {
    flex: 1,
    paddingHorizontal: tablet.padding,
    marginTop: -20,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: tablet.radiusLg,
    padding: tablet.padding,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  formTitle: {
    fontSize: tablet.fontTitle,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  formHint: {
    fontSize: tablet.fontSmall,
    color: colors.textMuted,
    marginBottom: 20,
  },
  btn: { marginTop: 4 },
});
