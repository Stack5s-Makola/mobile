import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Placeholder. Built out in Step 3 (Onboarding + Auth screens):
//   Register -> OTP Verify -> Role Selection -> RootNavigator re-evaluates

const Stack = createNativeStackNavigator();

export function AuthNavigator() {
  return <Stack.Navigator screenOptions={{ headerShown: false }} />;
}
