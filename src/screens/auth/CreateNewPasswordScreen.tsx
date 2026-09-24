import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Lock } from "lucide-react-native";
import { AppTextInput } from "@components/AppTextInput";
import { PrimaryButton } from "@components/PrimaryButton";
import { colors, fonts } from "@constants/theme";
import { useToast } from "@components/Toast";
import * as mockAuthService from "@services/mocks/authService";

const authService = mockAuthService;

export function CreateNewPasswordScreen({ navigation, route }: any) {
  const { userId } = route.params as { userId: string };
  const { showToast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = password.length >= 6 && password === confirmPassword;

  async function handleReset() {
    if (password !== confirmPassword) {
      showToast(
        "Passwords don't match. Please re-enter your new password.",
        "error",
      );
      return;
    }
    setIsLoading(true);
    try {
      const res = await authService.resetPassword({
        userId,
        newPassword: password,
      });
      if (res.success) {
        showToast(
          "Password updated. You can now sign in with your new password.",
          "success",
        );
        navigation.navigate("SignIn");
      } else {
        showToast("Couldn't reset password. Please try again.", "error");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Pressable onPress={() => navigation.goBack()} style={styles.back}>
            <ArrowLeft size={28} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Create New Password</Text>
          <Text style={styles.subtitle}>
            Choose a new password for your Makola account
          </Text>

          <View style={styles.form}>
            <AppTextInput
              label="New Password"
              placeholder="Enter password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              icon={<Lock size={20} color={colors.textMuted} />}
            />
            <AppTextInput
              label="Confirm New Password"
              placeholder="Enter password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              icon={<Lock size={20} color={colors.textMuted} />}
            />
          </View>

          <View style={styles.footer}>
            <PrimaryButton
              label="Reset Password"
              onPress={handleReset}
              disabled={!canSubmit}
              loading={isLoading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    paddingTop: 40,
  },
  keyboardAvoidingView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 16 },
  back: { marginBottom: 24 },
  title: { fontSize: 24, fontFamily: fonts.headline, color: colors.primary },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.bodyRegular,
    color: "#686868",
    marginTop: 8,
  },
  form: { gap: 20, marginTop: 24 },
  footer: { flex: 1, justifyContent: "flex-end", paddingBottom: 16 },
});
