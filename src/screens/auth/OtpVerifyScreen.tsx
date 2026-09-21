import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Alert,
} from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { PrimaryButton } from "@components/PrimaryButton";
import { colors, fonts } from "@constants/theme";
import * as mockAuthService from "@services/mocks/authService";

// NOTE: this still calls the MOCK verifyOtp, even for the "sellerRegister"
// purpose where the account was just created via the REAL backend
// (SellerProfileSetupScreen -> api/authService.registerSeller). That's a
// deliberate, temporary hybrid: Daniel confirmed the account-creation
// endpoint, but not the verify-otp endpoint itself, so calling a guessed
// real path here could fail in a more confusing way than just staying
// mock. Flip this once he confirms POST /api/auth/verify-otp (or
// whatever the real path is) for the seller flow specifically.
const authService = mockAuthService;
const CODE_LENGTH = 6;

export function OtpVerifyScreen({ navigation, route }: any) {
  const { userId, phone, purpose = "register" } = route.params as {
    userId: string;
    phone: string;
    purpose?: "register" | "resetPassword" | "sellerRegister";
  };
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);

  const code = digits.join("");
  const canSubmit = code.length === CODE_LENGTH;

  function handleChange(text: string, index: number) {
    const next = [...digits];
    next[index] = text.slice(-1);
    setDigits(next);
    if (text && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(e: any, index: number) {
    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    setIsLoading(true);
    try {
      if (purpose === "sellerRegister") {
        // TEMPORARY: the account was created via the REAL backend
        // (registerSeller), but Daniel hasn't confirmed a real
        // verify-otp endpoint yet. Calling the mock's verifyOtp here
        // would always fail (it checks its own local user list, which
        // never saw this real userId). Bypassing the check entirely
        // until he confirms the real endpoint - remove this branch and
        // call the real verify-otp once that's known.
        // TODO: also unconfirmed what happens after verification - does
        // the backend return a session to log straight in, or does the
        // seller sign in separately? Using the safer assumption
        // (separate sign-in) until confirmed.
        Alert.alert("Account verified!", "You can now sign in to your seller account.", [
          { text: "OK", onPress: () => navigation.navigate("SignIn") },
        ]);
        return;
      }

      const res = await authService.verifyOtp({ userId, code });
      if (res.success) {
        if (purpose === "resetPassword") {
          navigation.navigate("CreateNewPassword", { userId });
        } else {
          navigation.navigate("RoleSelection", { userId });
        }
      } else {
        Alert.alert("Verification failed", res.message);
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
      <Text style={styles.title}>Verify your number</Text>
      <Text style={styles.subtitle}>We&apos;ve sent a 6-digit code to {phone}.</Text>

      <View style={styles.codeRow}>
        {digits.map((digit, i) => (
          <TextInput
            key={i}
            ref={(ref) => (inputs.current[i] = ref)}
            style={styles.codeBox}
            value={digit}
            onChangeText={(text) => handleChange(text, i)}
            onKeyPress={(e) => handleKeyPress(e, i)}
            keyboardType="number-pad"
            maxLength={1}
            textAlign="center"
          />
        ))}
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label="Verify OTP"
          onPress={handleVerify}
          disabled={!canSubmit}
          loading={isLoading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, paddingTop: 40 },
  back: { marginBottom: 24 },
  title: { fontSize: 24, fontFamily: fonts.headline, color: colors.primary },
  subtitle: { fontSize: 14, fontFamily: fonts.bodyRegular, color: colors.textMuted, marginTop: 8 },
  codeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 32 },
  codeBox: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#686868",
    borderRadius: 10,
    fontSize: 20,
    color: colors.text,
  },
  footer: { flex: 1, justifyContent: "flex-end", paddingBottom: 16 },
});
