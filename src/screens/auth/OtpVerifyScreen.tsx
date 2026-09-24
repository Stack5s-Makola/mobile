import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { PrimaryButton } from "@components/PrimaryButton";
import { colors, fonts } from "@constants/theme";
import { useToast } from "@components/Toast";
import { useAuth } from "@context/AuthContext";
import { ProfileDraft, IssuedFromRegister } from "@types/auth";
import { UserRole } from "@types/user";
import * as mockAuthService from "@services/mocks/authService";
import * as apiAuthService from "@services/api/authService";

// Two paths through this screen:
//   - seller registration, which is fully live: the account exists on the
//     backend and the code is checked by POST /api/verify-otp, keyed by
//     email (registration returns no userId).
//   - the mock-backed flows (buyer registration, password reset), which
//     still key off a userId from the mock service.
//
// `email` in the route params is what distinguishes them.
const authService = mockAuthService;
const CODE_LENGTH = 6;
// A code is always sent just before this screen opens, so the timer starts
// running immediately rather than offering a resend the server would reject.
const RESEND_COOLDOWN_SECONDS = 60;

// Registration already issued a token, so the session can be built even if
// verify-otp returns nothing. If it does return a fresher token, that one
// wins - its payload should have emailVerified true. Its exact shape isn't
// pinned down yet (it can't be probed without a real code from an inbox),
// hence the tolerant read.
type IssuedTokens = {
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
  user?: { id?: string; role?: UserRole };
};

function readTokens(data: unknown) {
  const d = (data ?? {}) as IssuedTokens;
  return {
    accessToken: d.accessToken,
    refreshToken: d.refreshToken,
    userId: d.userId ?? d.user?.id,
    role: d.user?.role,
  };
}

export function OtpVerifyScreen({ navigation, route }: any) {
  const {
    userId,
    phone,
    email,
    profile,
    issued,
    purpose = "register",
  } = route.params as {
    userId?: string;
    phone?: string;
    email?: string; // seller flow: the code is emailed, not texted
    profile?: ProfileDraft; // what they typed at sign-up
    issued?: IssuedFromRegister; // token + role from registration
    purpose?: "register" | "resetPassword" | "sellerRegister" | "buyerRegister";
  };
  const { showToast } = useToast();
  const { login } = useAuth();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [isLoading, setIsLoading] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);

  const code = digits.join("");
  const canSubmit = code.length === CODE_LENGTH;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function handleResend() {
    if (cooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      // The seller account lives on the real backend, so its code comes from
      // POST /api/verify-otp/resend. The mock-backed flows use the mock.
      const res = email
        ? await apiAuthService.resendOtp(email)
        : await authService.resendOtp(userId ?? "");
      if (res.success) {
        showToast("We've sent you a new code.", "success");
        setDigits(Array(CODE_LENGTH).fill(""));
        inputs.current[0]?.focus();
        setCooldown(RESEND_COOLDOWN_SECONDS);
      } else {
        // Throttled ("Please wait 56 seconds...") or a bad email.
        showToast(res.errors?.email ?? res.message, "error");
      }
    } catch {
      showToast("Check your connection and try again.", "error");
    } finally {
      setIsResending(false);
    }
  }

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
      // The seller account was created on the real backend, which keys the
      // code off the email (registration returns no userId to use).
      if (email) {
        const res = await apiAuthService.verifyOtp({ email, code });
        if (res.success) {
          showToast(res.message, "success");
          // login() persists this to secure storage, so the seller stays
          // signed in across app restarts instead of logging in again.
          // Prefer a token minted by verify-otp (it should carry
          // emailVerified: true); otherwise keep the one from registration.
          const verified = readTokens(res.data);
          const accessToken = verified.accessToken ?? issued?.accessToken ?? "";
          if (!accessToken) {
            // Not fatal - they still get into the app - but any authenticated
            // request will fail, so make it visible rather than silent.
            console.warn(
              "no access token available after verify-otp",
              res.data,
            );
          }
          await login(
            accessToken,
            {
              // The backend stores the profile but returns none of it, so the
              // session is built from what was typed at sign-up.
              id: verified.userId ?? issued?.userId ?? email,
              email,
              phone: phone ?? "",
              // Whatever the backend says, falling back to the role the
              // account was registered with - this is what decides between
              // the buyer and seller stacks.
              role: verified.role ?? issued?.role ?? "BUYER",
              // Reaching here means the code checked out.
              emailVerified: true,
              fullName: profile?.fullName ?? "",
              location: profile?.location ?? "",
              businessName: profile?.businessName,
              photoUri: profile?.photoUri,
            },
            verified.refreshToken,
          );
          // No navigation needed - RootNavigator swaps to the seller stack
          // as soon as the session exists.
        } else {
          // A malformed code comes back under errors.code; a wrong or
          // expired one as a ready-to-show message.
          showToast(res.errors?.code ?? res.message, "error");
          setDigits(Array(CODE_LENGTH).fill(""));
          inputs.current[0]?.focus();
        }
        return;
      }

      // Only the mock-backed flows reach here, and both are entered with a
      // userId; the seller flow returned above.
      if (!userId) {
        showToast(
          "Something went wrong. Please start the sign-up again.",
          "error",
        );
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
        showToast(res.message, "error");
      }
    } catch {
      showToast("Check your connection and try again.", "error");
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
          <Text style={styles.title}>
            Verify your {email ? "email" : "number"}
          </Text>
          <Text style={styles.subtitle}>
            We&apos;ve sent a 6-digit code to {email ?? phone}.
          </Text>

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

          <Pressable
            onPress={handleResend}
            disabled={cooldown > 0 || isResending}
            style={styles.resend}
          >
            <Text
              style={[
                styles.resendText,
                (cooldown > 0 || isResending) && styles.resendDisabled,
              ]}
            >
              {isResending
                ? "Sending..."
                : cooldown > 0
                  ? `Resend OTP verification in ${cooldown}s`
                  : "Resend OTP verification"}
            </Text>
          </Pressable>

          <View style={styles.footer}>
            <PrimaryButton
              label="Verify OTP"
              onPress={handleVerify}
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
    color: colors.textMuted,
    marginTop: 8,
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 32,
  },
  resend: {
    marginTop: 20,
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  resendText: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: colors.primary,
  },
  resendDisabled: { color: colors.textMuted, fontFamily: fonts.bodyRegular },
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
