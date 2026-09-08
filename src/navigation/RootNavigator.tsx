import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "@context/AuthContext";
import { OnboardingScreen } from "@screens/onboarding/OnboardingScreen";

// TODO (Step 4): Replace this single-stack placeholder with real branching:
//   !isOnboarded -> OnboardingStack
//   !user        -> AuthNavigator
//   user.role === "BUYER"  -> BuyerNavigator
//   user.role === "SELLER" -> SellerNavigator
// This is the coordination point Daniel's seller-experience work plugs into,
// so this file should only change via reviewed PRs, not silently.

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { isOnboarded } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  );
}
