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

// Opened from the Business Information list on the seller profile. Seeded
// from the session's copy of the shop name.
export function BusinessNameScreen({ navigation }: SellerStackProps<"BusinessName">) {
  const { session, updateUser } = useAuth();
  const { showToast } = useToast();
  // savedName is the last value known to be on the server - what the input is
  // compared against to decide whether there's anything to submit.
  const [savedName, setSavedName] = useState(session?.user.businessName ?? "");
  const [businessName, setBusinessName] = useState(savedName);
  const [isSaving, setIsSaving] = useState(false);

  const trimmed = businessName.trim();
  const canSubmit = trimmed.length > 0 && trimmed !== savedName.trim() && !isSaving;

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsSaving(true);
    try {
      const res = await apiSellerService.updateShopName(trimmed);
      if (res.success) {
        setSavedName(trimmed);
        await updateUser({ businessName: trimmed });
        showToast(res.message, "success");
      } else {
        // Shop names are unique, so "That shop name is already taken" is the
        // one to expect here.
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

      <Text style={styles.title}>Business Name</Text>

      <AppTextInput
        style={styles.input}
        placeholder="Enter your business name"
        value={businessName}
        onChangeText={setBusinessName}
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
            Change shop name
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
  // AppTextInput spreads `style` onto the inner TextInput, so these override
  // its defaults (14 / bodyRegular).
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
