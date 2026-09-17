import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts } from "@constants/theme";

// Placeholder - full Categories screen (category grid + filtered
// products) is Assignment 2 (Tue-Thu) work, not this Mon-Tue chunk.

export function CategoriesScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.text}>Categories — coming this week</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  text: { fontSize: 16, fontFamily: fonts.bodyMedium, color: colors.textMuted },
});
