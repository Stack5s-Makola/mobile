import React, { useState } from "react";
import { Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { AppTextInput } from "@components/AppTextInput";
import { useToast } from "@components/Toast";
import { colors, fonts, radii } from "@constants/theme";
import { useAuth } from "@context/AuthContext";
import { BuyerStackProps } from "@navigation/buyerRoutes";
import { buyerProfileService } from "@services/buyerProfileService";

// Same green as the rest of the app.
const GREEN = "#1CA30A";

// POST /api/buyer/my-profile/update/name. Mirrors the seller's
// BusinessNameScreen: seeded from the session, and the button only wakes up
// once the value actually differs.
export function BuyerNameScreen({ navigation }: BuyerStackProps<"BuyerName">) {
  const { session, updateUser } = useAuth();
  const { showToast } = useToast();
  const [savedName, setSavedName] = useState(session?.user.fullName ?? "");
  const [name, setName] = useState(savedName);
  const [isSaving, setIsSaving] = useState(false);

  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0 && trimmed !== savedName.trim() && !isSaving;

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSaving(true);
    try {
      const res = await buyerProfileService.updateName(trimmed);
      if (res.success) {
        const next = res.data?.name ?? trimmed;
        setSavedName(next);
        setName(next);
        await updateUser({ fullName: next });
        showToast(res.message, "success");
      } else {
        // 400 "name is required" when blank.
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

      <Text style={styles.title}>Name</Text>

      <AppTextInput
        style={styles.input}
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
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
            Change name
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
