import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, Alert } from "react-native";
import { PrimaryButton } from "@components/PrimaryButton";
import { useAuth } from "@context/AuthContext";
import { UserRole } from "@types/user";
import * as mockAuthService from "@services/mocks/authService";

const authService = mockAuthService;

export function RoleSelectionScreen() {
  const { session, setRole } = useAuth();
  const [loadingRole, setLoadingRole] = useState<UserRole | null>(null);

  async function handleSelect(role: UserRole) {
    if (!session) return;
    setLoadingRole(role);
    try {
      const res = await authService.selectRole({ userId: session.user.id, role });
      if (!res.success) {
        Alert.alert("Something went wrong", res.message);
        return;
      }
      // RootNavigator re-evaluates on role change and routes into
      // BuyerNavigator/SellerNavigator automatically.
      await setRole(role);
    } catch (err) {
      Alert.alert("Something went wrong", "Please check your connection and try again.");
    } finally {
      setLoadingRole(null);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>How will you use Makola?</Text>
        <Text style={styles.subtitle}>You can't change this later without contacting support.</Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          label="I'm a Buyer"
          onPress={() => handleSelect("BUYER")}
          loading={loadingRole === "BUYER"}
          disabled={loadingRole !== null}
          style={styles.buttonSpacing}
        />
        <PrimaryButton
          label="I'm a Seller"
          onPress={() => handleSelect("SELLER")}
          loading={loadingRole === "SELLER"}
          disabled={loadingRole !== null}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "space-between" },
  content: { flex: 1, justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#555" },
  actions: { paddingBottom: 8 },
  buttonSpacing: { marginBottom: 12 },
});
