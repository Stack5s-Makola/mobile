import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Generic "coming soon" placeholder so tab bar structure and navigation
// are testable before each tab is actually built out.

type Props = {
  label: string;
};

export function ComingSoonTab({ label }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>{label} — coming soon</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 16, color: "#777" },
});
