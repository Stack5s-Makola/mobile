import React from "react";
import { View, Text, StyleSheet } from "react-native";

// Placeholder for Step 3 (Onboarding + Auth). Replace with the actual
// onboarding carousel/screens per Charity's UI/UX spec.

export function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Makola — Onboarding (placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 16 },
});
