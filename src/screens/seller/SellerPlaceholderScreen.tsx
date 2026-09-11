import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { PrimaryButton } from "@components/PrimaryButton";
import { useAuth } from "@context/AuthContext";

// Temporary landing screen so the auth flow is testable end-to-end.
// Daniel's seller-experience work replaces this - not the real Seller Home.

export function SellerPlaceholderScreen() {
  const { session, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome, {session?.user.fullName}</Text>
        <Text style={styles.subtitle}>Signed in as SELLER. Daniel's screens plug in here.</Text>
      </View>
      <PrimaryButton label="Log out (for testing)" onPress={logout} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "space-between" },
  content: { flex: 1, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#555" },
});
