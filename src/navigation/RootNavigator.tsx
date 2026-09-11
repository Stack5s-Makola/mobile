import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "@context/AuthContext";
import { AuthNavigator } from "@navigation/AuthNavigator";
import { BuyerNavigator } from "@navigation/BuyerNavigator";
import { SellerNavigator } from "@navigation/SellerNavigator";

// This is the coordination point Daniel's seller-experience work plugs
// into (via SellerNavigator) - changes here go through review, not
// silent edits.
//
// Branching order:
//   isHydrating -> loading spinner (checking SecureStore)
//   !session    -> AuthNavigator (Onboarding -> Register/SignIn -> ... ->
//                  login() is only ever called once role + profile are
//                  both set, so a session here always has a role)
//   role === BUYER  -> BuyerNavigator
//   role === SELLER -> SellerNavigator

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { isHydrating, session } = useAuth();

  if (isHydrating) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!session ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : session.user.role === "BUYER" ? (
        <Stack.Screen name="Buyer" component={BuyerNavigator} />
      ) : (
        <Stack.Screen name="Seller" component={SellerNavigator} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
});
