import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "@context/AuthContext";
import { OnboardingScreen } from "@screens/onboarding/OnboardingScreen";
import { RoleSelectionScreen } from "@screens/auth/RoleSelectionScreen";
import { AuthNavigator } from "@navigation/AuthNavigator";
import { BuyerNavigator } from "@navigation/BuyerNavigator";
import { SellerNavigator } from "@navigation/SellerNavigator";

// This is the coordination point Daniel's seller-experience work plugs
// into (via SellerNavigator) - changes here go through review, not
// silent edits.
//
// Branching order:
//   isHydrating   -> loading spinner (checking SecureStore)
//   !isOnboarded  -> OnboardingScreen
//   !session      -> AuthNavigator (Register -> OtpVerify)
//   !session.user.role -> RoleSelectionScreen
//   role === BUYER  -> BuyerNavigator
//   role === SELLER -> SellerNavigator

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { isHydrating, isOnboarded, session } = useAuth();

  if (isHydrating) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isOnboarded ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : !session ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : !session.user.role ? (
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
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
