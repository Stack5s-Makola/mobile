import React, { useState } from "react";
import { Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { AppTextInput } from "@components/AppTextInput";
import { useToast } from "@components/Toast";
import { colors, fonts, radii } from "@constants/theme";
import { useAuth } from "@context/AuthContext";
import { SellerStackProps } from "@navigation/sellerRoutes";
import * as apiSellerService from "@services/api/sellerService";

// Same green as the seller profile page.
const GREEN = "#1CA30A";

// Opened from the Business Information list on the seller profile. Mirrors
// BusinessNameScreen: seeded from the session, and the button only wakes up
// once the value actually differs.
export function PhoneNumberScreen({ navigation }: SellerStackProps<"PhoneNumber">) {
  const { session, updateUser } = useAuth();
  const { showToast } = useToast();
  const [savedPhone, setSavedPhone] = useState(session?.user.phone ?? "");
  const [phone, setPhone] = useState(savedPhone);
  const [isSaving, setIsSaving] = useState(false);

  const trimmed = phone.trim();
  const canSubmit = trimmed.length > 0 && trimmed !== savedPhone.trim() && !isSaving;

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSaving(true);
    try {
      const res = await apiSellerService.updatePhone(trimmed);
      if (res.success) {
        // Keep whatever the server normalised it to, not the raw input.
        const next = res.data?.phone ?? trimmed;
        setSavedPhone(next);
        setPhone(next);
        await updateUser({ phone: next });
        showToast(res.message, "success");
      } else {
        showToast(res.errors?.phone ?? res.message, "error");
      }
    } catch {
      showToast("Check your connection and try again.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Pressable
        onPress={() => navigation.goBack()}
        style={styles.back}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <ArrowLeft size={28} color={colors.text} />
      </Pressable>

      <Text style={styles.title}>Phone Number</Text>

      <AppTextInput
        style={styles.input}
        placeholder="Enter your phone number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <Pressable
        style={({ pressed }) => [
          styles.button,
          canSubmit ? styles.buttonActive : styles.buttonInactive,
          pressed && canSubmit && styles.pressed,
        ]}
        onPress={handleSubmit}
        disabled={!canSubmit}
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSubmit }}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <Text style={[styles.buttonLabel, !canSubmit && styles.buttonLabelInactive]}>
            Change phone number
          </Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, padding: 20 },
  back: { alignSelf: "flex-start" },
  title: { fontSize: 22, fontFamily: fonts.headlineBold, color: GREEN, marginTop: 20 },
  input: { marginTop: 20, fontSize: 16, fontFamily: fonts.bodySemiBold },
  button: {
    marginTop: 24,
    height: 52,
    borderRadius: radii.button,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonActive: { backgroundColor: GREEN },
  buttonInactive: { backgroundColor: colors.neutralSoft },
  buttonLabel: { fontSize: 16, fontFamily: fonts.bodySemiBold, color: colors.white },
  buttonLabelInactive: { color: colors.textMuted },
  pressed: { opacity: 0.85 },
});
