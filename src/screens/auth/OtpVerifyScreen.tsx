import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, Alert } from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";
import { AppTextInput } from "@components/AppTextInput";
import { PrimaryButton } from "@components/PrimaryButton";
import { AuthStackParamList } from "@navigation/AuthNavigator";
import { useAuth } from "@context/AuthContext";
import * as mockAuthService from "@services/mocks/authService";

const authService = mockAuthService;

type Route = RouteProp<AuthStackParamList, "OtpVerify">;

export function OtpVerifyScreen() {
  const { params } = useRoute<Route>();
  const { login } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (code.trim().length < 4) {
      Alert.alert("Enter the code", "Please enter the code we sent you.");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.verifyOtp({ userId: params.userId, code: code.trim() });
      if (!res.success) {
        Alert.alert("Verification failed", res.message);
        return;
      }
      // Once session is set, RootNavigator picks up from here:
      // role is null -> RoleSelectionScreen shows automatically.
      await login(res.data.accessToken, {
        id: res.data.userId,
        fullName: res.data.fullName,
        phone: res.data.phone,
        role: res.data.role,
      });
    } catch (err) {
      Alert.alert("Something went wrong", "Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Verify your number</Text>
        <Text style={styles.subtitle}>Enter the code we sent to {params.phone}.</Text>

        <AppTextInput
          placeholder="6-digit code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
          style={styles.input}
        />
      </View>

      <PrimaryButton label="Verify" onPress={handleSubmit} loading={loading} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "space-between" },
  content: { flex: 1, justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#555", marginBottom: 24 },
  input: { marginBottom: 14 },
});
