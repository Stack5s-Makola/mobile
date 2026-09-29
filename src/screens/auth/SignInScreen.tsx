import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Mail, Lock } from "lucide-react-native";
import { AppTextInput } from "@components/AppTextInput";
import { PrimaryButton } from "@components/PrimaryButton";
import { colors, fonts } from "@constants/theme";
import { useToast } from "@components/Toast";
import { useAuth } from "@context/AuthContext";
import * as authService from "@services/api/authService";



export function SignInScreen({ navigation }: any) {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = email.length > 0 && password.length > 0;

  async function handleSignIn() {
    setIsLoading(true);
    try {
      const res = await authService.login({ email, password });
      if (!res.success) {
        showToast(res.message, "error");
        return;
      }

      // Signing in emails a fresh code whenever the account isn't verified,
      // so send them to the OTP screen rather than into the app. The token
      // rides along unsaved - verifying is what creates the session.
      if (!res.data.emailVerified) {
        showToast(res.message, "success");
        navigation.navigate("OtpVerify", {
          email: res.data.email,
          phone: res.data.phone,
          purpose: res.data.role === "SELLER" ? "sellerRegister" : "buyerRegister",
          profile: {
            fullName: res.data.fullName,
            location: res.data.location,
            businessName: res.data.businessName,
            photoUri: res.data.photoUri,
          },
          issued: {
            accessToken: res.data.accessToken,
            userId: res.data.userId,
            role: res.data.role,
          },
        });
        return;
      }

      await login(res.data.accessToken, {
        id: res.data.userId,
        phone: res.data.phone,
        email: res.data.email,
        role: res.data.role,
        emailVerified: true,
        fullName: res.data.fullName,
        location: res.data.location,
        businessName: res.data.businessName,
        photoUri: res.data.photoUri,
      });
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
          <Image
            source={require("../../assets/makola_tpbg.png")}
            style={styles.wordmark}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome back!</Text>
          <Text style={styles.subtitle}>
            Let&apos;s get you back to Makola.
          </Text>

          <View style={styles.form}>
            <AppTextInput
              label="Email address"
              placeholder="Enter your email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
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
            <Text
              style={styles.forgot}
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              Forgot password?
            </Text>
          </View>

          <View style={styles.footer}>
            <PrimaryButton
              label="Sign In"
              onPress={handleSignIn}
              disabled={!canSubmit}
              loading={isLoading}
            />
            <Text style={styles.footerText}>
              Don&apos;t have an account?{" "}
              <Text
                style={styles.link}
                onPress={() => navigation.navigate("RoleSelection")}
              >
                Sign Up
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
    paddingTop: 60,
  },
  keyboardAvoidingView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 16 },
  wordmark: {
    width: 80,
    height: 95,
    alignSelf: "center",
    marginBottom: 16,
    transform: [{ rotate: "13.31deg" }],
  },
  title: {
    fontSize: 28,
    fontFamily: fonts.headline,
    color: colors.primary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.bodyRegular,
    color: colors.text,
    marginTop: 4,
    textAlign: "center",
  },
  form: { gap: 20, marginTop: 32 },
  forgot: {
    textAlign: "right",
    color: colors.primary,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
  },
  footer: { flex: 1, justifyContent: "flex-end", paddingBottom: 16, gap: 16 },
  footerText: {
    textAlign: "center",
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
    color: colors.text,
  },
  link: { color: colors.primary, fontFamily: fonts.bodySemiBold },
});
