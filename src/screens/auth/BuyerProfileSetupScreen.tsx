import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, SafeAreaView } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { AppTextInput } from "@components/AppTextInput";
import { PrimaryButton } from "@components/PrimaryButton";
import { colors, fonts } from "@constants/theme";
import { useToast } from "@components/Toast";
import * as apiAuthService from "@services/api/authService";

// Last step before verification. The credentials were collected on the
// previous screen and are submitted here, mirroring the seller flow.
//
// POST /api/register/buyer takes credentials only - a buyer's name and
// location have nowhere to go on the backend yet, so they're collected for
// the local session (BuyerProfileTab reads fullName) and carried through
// the OTP screen.
export function BuyerProfileSetupScreen({ navigation, route }: any) {
  const { phone, email, password } = route.params as {
    phone: string;
    email: string;
    password: string;
  };
  const { showToast } = useToast();
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = fullName.length > 0 && location.length > 0;

  async function handleContinue() {
    setIsLoading(true);
    try {
      const res = await apiAuthService.registerBuyer({ email, phone, password });
      if (res.success) {
        showToast(res.message, "success");
        navigation.navigate("OtpVerify", {
          email,
          phone,
          purpose: "buyerRegister",
          profile: { fullName: fullName.trim(), location: location.trim() },
          issued: {
            accessToken: res.data.accessToken,
            userId: res.data.user?.id ?? "",
            role: res.data.user?.role ?? "BUYER",
          },
        });
      } else {
        // Duplicate email / phone come back as a 409 with a ready-to-show
        // message and no field-level `errors` map.
        showToast(res.errors?.email ?? res.errors?.phone ?? res.message, "error");
      }
    } catch {
      showToast("Check your connection and try again.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <ArrowLeft size={28} color={colors.text} />
      </Pressable>
      <Text style={styles.title}>Set up your profile</Text>
      <Text style={styles.subtitle}>Tell us a little about yourself</Text>

      <View style={styles.form}>
        <View>
          <Text style={styles.fieldQuestion}>What should we call you?</Text>
          <AppTextInput placeholder="Enter your name" value={fullName} onChangeText={setFullName} />
        </View>
        <View>
          <Text style={styles.fieldQuestion}>Where do you live?</Text>
          <AppTextInput placeholder="Enter your location" value={location} onChangeText={setLocation} />
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label="Continue"
          onPress={handleContinue}
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
  subtitle: { fontSize: 14, fontFamily: fonts.bodyRegular, color: "#435c46", marginTop: 4 },
  form: { gap: 24, marginTop: 32 },
  fieldQuestion: { fontSize: 20, fontFamily: fonts.headline, color: colors.primary, marginBottom: 8 },
  footer: { flex: 1, justifyContent: "flex-end", paddingBottom: 16 },
});
