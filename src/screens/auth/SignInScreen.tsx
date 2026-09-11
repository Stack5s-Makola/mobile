import React, { useState } from "react";
import { View, Text, Image, StyleSheet, SafeAreaView, Alert } from "react-native";
import { Phone, Lock } from "lucide-react-native";
import { AppTextInput } from "@components/AppTextInput";
import { PrimaryButton } from "@components/PrimaryButton";
import { colors, fonts } from "@constants/theme";
import { useAuth } from "@context/AuthContext";
import * as mockAuthService from "@services/mocks/authService";

const authService = mockAuthService;

// NOTE: sourced directly from Figma's temporary asset CDN (expires ~7 days) -
// see README "Known issues".
const WORDMARK = "https://www.figma.com/api/mcp/asset/45f68554-0092-45a1-89ec-48881b40850f.png";

export function SignInScreen({ navigation }: any) {
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = phone.length > 0 && password.length > 0;

  async function handleSignIn() {
    setIsLoading(true);
    try {
      const res = await authService.login({ phone, password });
      if (res.success) {
        await login(res.data.accessToken, {
          id: res.data.userId,
          phone: res.data.phone,
          email: res.data.email,
          role: res.data.role,
          fullName: res.data.fullName,
          location: res.data.location,
          businessName: res.data.businessName,
          photoUri: res.data.photoUri,
        });
      } else {
        Alert.alert("Couldn't sign in", res.message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Image source={{ uri: WORDMARK }} style={styles.wordmark} resizeMode="contain" />
      <Text style={styles.title}>Welcome back!</Text>
      <Text style={styles.subtitle}>Let&apos;s get you back to Makola.</Text>

      <View style={styles.form}>
        <AppTextInput
          label="Phone Number"
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          icon={<Phone size={20} color={colors.textMuted} />}
        />
        <AppTextInput
          label="Password"
          placeholder="Enter password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          icon={<Lock size={20} color={colors.textMuted} />}
        />
        <Text style={styles.forgot} onPress={() => navigation.navigate("ForgotPassword")}>
          Forgot password?
        </Text>
      </View>

      <View style={styles.footer}>
        <PrimaryButton label="Sign In" onPress={handleSignIn} disabled={!canSubmit} loading={isLoading} />
        <Text style={styles.footerText}>
          Don&apos;t have an account?{" "}
          <Text style={styles.link} onPress={() => navigation.navigate("Register")}>
            Sign Up
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, paddingTop: 60 },
  wordmark: { width: 80, height: 95, alignSelf: "center", marginBottom: 16, transform: [{ rotate: "13.31deg" }] },
  title: { fontSize: 28, fontFamily: fonts.headline, color: colors.primary, textAlign: "center" },
  subtitle: { fontSize: 14, fontFamily: fonts.bodyRegular, color: colors.text, marginTop: 4, textAlign: "center" },
  form: { gap: 20, marginTop: 32 },
  forgot: { textAlign: "right", color: colors.primary, fontFamily: fonts.bodyMedium, fontSize: 13 },
  footer: { flex: 1, justifyContent: "flex-end", paddingBottom: 16, gap: 16 },
  footerText: { textAlign: "center", fontFamily: fonts.bodyRegular, fontSize: 14, color: colors.text },
  link: { color: colors.primary, fontFamily: fonts.bodySemiBold },
});
