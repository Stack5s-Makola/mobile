import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { PrimaryButton } from "@components/PrimaryButton";
import { useAuth } from "@context/AuthContext";

// Single-screen placeholder for onboarding. Replace with Charity's
// multi-slide carousel spec when it's ready - the "Get Started" action
// (setIsOnboarded) is the only piece the rest of the app depends on,
// so the visual design here can change freely without touching
// RootNavigator or AuthNavigator.

export function OnboardingScreen() {
  const { setIsOnboarded } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Makola</Text>
        <Text style={styles.subtitle}>
          Discover sellers near you, and connect directly - no middlemen.
        </Text>
      </View>
      <PrimaryButton label="Get Started" onPress={() => setIsOnboarded(true)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "space-between" },
  content: { flex: 1, justifyContent: "center" },
  title: { fontSize: 32, fontWeight: "700", marginBottom: 12 },
  subtitle: { fontSize: 16, color: "#555", lineHeight: 22 },
});
