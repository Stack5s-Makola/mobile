import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Lock } from "lucide-react-native";
import { AppTextInput } from "@components/AppTextInput";
import { useToast } from "@components/Toast";
import { colors, fonts, radii } from "@constants/theme";
import { BuyerStackProps } from "@navigation/buyerRoutes";
import { buyerProfileService } from "@services/buyerProfileService";

const GREEN = "#1CA30A";
const MIN_PASSWORD_LENGTH = 8; // the backend's floor

// POST /api/buyer/my-profile/update/password.
export function BuyerPasswordScreen({ navigation }: BuyerStackProps<"BuyerPassword">) {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const matches = newPassword === confirmPassword;
  const canSubmit =
    currentPassword.length > 0 &&
    newPassword.length >= MIN_PASSWORD_LENGTH &&
    matches &&
    !isSaving;

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSaving(true);
    try {
      const res = await buyerProfileService.changePassword({
        currentPassword,
        newPassword,
      });
      if (res.success) {
        showToast(res.message, "success");
        navigation.goBack();
      } else {
        // 401 "Your current password is incorrect", or a 400 on length.
        showToast(res.message, "error");
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

      <Text style={styles.title}>Change Password</Text>

      <View style={styles.form}>
        <AppTextInput
          label="Current password"
          placeholder="Enter your current password"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
          icon={<Lock size={20} color={colors.textMuted} />}
        />
        <AppTextInput
          label="New password"
          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          icon={<Lock size={20} color={colors.textMuted} />}
        />
        <AppTextInput
          label="Confirm new password"
          placeholder="Re-enter the new password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={
            confirmPassword.length > 0 && !matches ? "Passwords don't match" : undefined
          }
          icon={<Lock size={20} color={colors.textMuted} />}
        />
      </View>

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
            Change password
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
  form: { marginTop: 20, gap: 18 },
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
