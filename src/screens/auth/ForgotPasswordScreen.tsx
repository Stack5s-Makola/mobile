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
import { ArrowLeft, Mail } from "lucide-react-native";
import { AppTextInput } from "@components/AppTextInput";
import { PrimaryButton } from "@components/PrimaryButton";
import { colors, fonts } from "@constants/theme";
import { useToast } from "@components/Toast";
import * as authService from "@services/api/authService";

export function ForgotPasswordScreen({ navigation }: any) {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSendOtp() {
    setIsLoading(true);
    try {
      const res = await authService.resendOtp(email);
      if (res.success) {
        navigation.navigate("OtpVerify", {
          email,
          purpose: "resetPassword",
        });
      } else {
        showToast(res.message, "error");
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
          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we&apos;ll help you reset your
            password.
          </Text>

          <View style={styles.form}>
            <AppTextInput
              label="Email address"
              placeholder="Enter your email address"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              icon={<Mail size={20} color={colors.textMuted} />}
            />
          </View>

          <View style={styles.footer}>
            <PrimaryButton
              label="Send OTP"
              onPress={handleSendOtp}
              disabled={email.length === 0}
              loading={isLoading}
            />
            <Text style={styles.footerText}>
              Remember your password?{" "}
              <Text
                style={styles.link}
                onPress={() => navigation.navigate("SignIn")}
              >
                Sign In
              </Text>
            </Text>
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
  form: { marginTop: 24 },
  footer: { flex: 1, justifyContent: "flex-end", paddingBottom: 16, gap: 16 },
  footerText: {
    textAlign: "center",
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
    color: colors.text,
  },
  link: { color: colors.primary, fontFamily: fonts.bodySemiBold },
});
