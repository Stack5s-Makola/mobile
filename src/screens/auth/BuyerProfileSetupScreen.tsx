import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, SafeAreaView } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { AppTextInput } from "@components/AppTextInput";
import { PrimaryButton } from "@components/PrimaryButton";
import { colors, fonts } from "@constants/theme";
import { useToast } from "@components/Toast";
import { useAuth } from "@context/AuthContext";
import * as mockAuthService from "@services/mocks/authService";

const authService = mockAuthService;

export function BuyerProfileSetupScreen({ navigation, route }: any) {
  const { userId } = route.params as { userId: string };
  const { login } = useAuth();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = fullName.length > 0 && location.length > 0;

  async function handleContinue() {
    setIsLoading(true);
    try {
      const res = await authService.completeBuyerProfile({ userId, fullName, location });
      if (res.success) {
        await login(res.data.accessToken, {
          id: res.data.userId,
          phone: res.data.phone,
          email: res.data.email,
          role: res.data.role,
          fullName: res.data.fullName,
          location: res.data.location,
        });
      } else {
        showToast(res.message, "error");
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
