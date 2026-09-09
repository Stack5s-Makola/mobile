import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AppTextInput } from "@components/AppTextInput";
import { PrimaryButton } from "@components/PrimaryButton";
import { AuthStackParamList } from "@navigation/AuthNavigator";
import * as mockAuthService from "@services/mocks/authService";

// Swap the import above for @services/api/authService once Promise's
// endpoints are live - same function names/signatures, no other changes.
const authService = mockAuthService;

type Nav = NativeStackNavigationProp<AuthStackParamList, "Register">;

export function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!fullName.trim() || !phone.trim()) {
      Alert.alert("Missing info", "Please enter your full name and phone number.");
      return;
    }

    setLoading(true);
    try {
      const res = await authService.register({ fullName: fullName.trim(), phone: phone.trim() });
      if (!res.success) {
        Alert.alert("Registration failed", res.message);
        return;
      }
      navigation.navigate("OtpVerify", {
        userId: res.data.userId,
        phone: res.data.phone,
        fullName: fullName.trim(),
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
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>We'll text you a one-time code to verify your number.</Text>

        <AppTextInput
          placeholder="Full name"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          style={styles.input}
        />
        <AppTextInput
          placeholder="Phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={styles.input}
        />
      </View>

      <PrimaryButton label="Send code" onPress={handleSubmit} loading={loading} />
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
