import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, SafeAreaView, Alert } from "react-native";
import { ArrowLeft, Phone } from "lucide-react-native";
import { AppTextInput } from "@components/AppTextInput";
import { PrimaryButton } from "@components/PrimaryButton";
import { colors, fonts } from "@constants/theme";
import * as mockAuthService from "@services/mocks/authService";

const authService = mockAuthService;

export function ForgotPasswordScreen({ navigation }: any) {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSendOtp() {
    setIsLoading(true);
    try {
      const res = await authService.forgotPassword({ phone });
      if (res.success) {
        navigation.navigate("OtpVerify", { userId: res.data.userId, phone, purpose: "resetPassword" });
      } else {
        Alert.alert("Couldn't send code", res.message);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <ArrowLeft size={28} color={colors.text} />
      </Pressable>
      <Text style={styles.title}>Forgot Password?</Text>
      <Text style={styles.subtitle}>
        Enter your phone number and we&apos;ll help you reset your password.
      </Text>

      <View style={styles.form}>
        <AppTextInput
          label="Phone Number"
          placeholder="Enter your phone number"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          icon={<Phone size={20} color={colors.textMuted} />}
        />
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label="Send OTP"
          onPress={handleSendOtp}
          disabled={phone.length === 0}
          loading={isLoading}
        />
        <Text style={styles.footerText}>
          Remember your password?{" "}
          <Text style={styles.link} onPress={() => navigation.navigate("SignIn")}>
            Sign In
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, paddingTop: 40 },
  back: { marginBottom: 24 },
  title: { fontSize: 24, fontFamily: fonts.headline, color: colors.primary },
  subtitle: { fontSize: 14, fontFamily: fonts.bodyRegular, color: "#686868", marginTop: 8 },
  form: { marginTop: 24 },
  footer: { flex: 1, justifyContent: "flex-end", paddingBottom: 16, gap: 16 },
  footerText: { textAlign: "center", fontFamily: fonts.bodyRegular, fontSize: 14, color: colors.text },
  link: { color: colors.primary, fontFamily: fonts.bodySemiBold },
});
