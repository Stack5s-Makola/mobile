import React, { useState } from "react";
import { View, Text, Image, StyleSheet, ScrollView, Alert } from "react-native";
import { Mail, Phone, Lock } from "lucide-react-native";
import { AppTextInput } from "@components/AppTextInput";
import { PrimaryButton } from "@components/PrimaryButton";
import { colors, fonts } from "@constants/theme";
import * as mockAuthService from "@services/mocks/authService";

// Swap the import above for @services/api/authService once Promise's
// /api/auth/register endpoint is live - same function signature.
const authService = mockAuthService;

// NOTE: sourced directly from Figma's temporary asset CDN (expires ~7 days
// from when it was pulled). Replace with a real exported asset in
// src/assets once available - see README "Known issues" for context.
const WORDMARK_URL = "https://www.figma.com/api/mcp/asset/7c5b8b52-e295-4f19-94a8-253f0baf48d0.png";

export function RegisterScreen({ navigation }: any) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = phone.length > 0 && email.length > 0 && password.length >= 6 && password === confirmPassword;

  async function handleCreateAccount() {
    if (password !== confirmPassword) {
      Alert.alert("Passwords don't match", "Please re-enter your password.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await authService.register({ phone, email, password });
      if (res.success) {
        navigation.navigate("OtpVerify", { userId: res.data.userId, phone: res.data.phone });
      } else {
        Alert.alert("Couldn't create account", res.message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Image source={{ uri: WORDMARK_URL }} style={styles.wordmark} resizeMode="contain" />
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Makola and start discovering or selling today.</Text>
      </View>

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
          label="Email address"
          placeholder="Enter your email address"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          icon={<Mail size={20} color={colors.textMuted} />}
        />
        <AppTextInput
          label="Password"
          placeholder="Enter password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          icon={<Lock size={20} color={colors.textMuted} />}
        />
        <AppTextInput
          label="Confirm Password"
          placeholder="Enter password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          icon={<Lock size={20} color={colors.textMuted} />}
        />
      </View>

      <PrimaryButton
        label="Create Account"
        onPress={handleCreateAccount}
        disabled={!canSubmit}
        loading={isLoading}
      />

      <Text style={styles.footer}>
        Already have an account?{" "}
        <Text style={styles.link} onPress={() => navigation.navigate("SignIn")}>
          Sign In
        </Text>
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.background, padding: 24, paddingTop: 60 },
  header: { alignItems: "center", marginBottom: 24 },
  wordmark: { width: 70, height: 84, marginBottom: 8 },
  title: { fontSize: 28, fontFamily: fonts.headline, color: colors.primary },
  subtitle: { fontSize: 14, fontFamily: fonts.bodyRegular, color: colors.text, marginTop: 4 },
  form: { gap: 20, marginBottom: 24 },
  footer: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 14,
    fontFamily: fonts.bodyRegular,
    color: colors.text,
  },
  link: { color: colors.primary, fontFamily: fonts.bodySemiBold },
});
