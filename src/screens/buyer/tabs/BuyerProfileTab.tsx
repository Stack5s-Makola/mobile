import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "@components/PrimaryButton";
import { useAuth } from "@context/AuthContext";

// Placeholder Profile tab. Keeps a working "log out" affordance so the
// full auth flow stays testable now that BuyerPlaceholderScreen (which
// used to hold this) is gone - replace with the real profile screen later.

export function BuyerProfileTab() {
  const { session, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{session?.user.fullName}</Text>
        <Text style={styles.subtitle}>Profile screen — coming soon</Text>
      </View>
      <PrimaryButton label="Log out (for testing)" onPress={logout} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "space-between" },
  content: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#777" },
});
