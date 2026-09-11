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

const authService = mockAuthService;
const CODE_LENGTH = 6;

export function OtpVerifyScreen({ navigation, route }: any) {
  const { userId, phone } = route.params as { userId: string; phone: string };
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
      const res = await authService.verifyOtp({ userId, code });
      if (res.success) {
        navigation.navigate("RoleSelection", { userId });
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
