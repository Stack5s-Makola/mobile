import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { OnboardingScreen } from "@screens/onboarding/OnboardingScreen";
import { RegisterScreen } from "@screens/auth/RegisterScreen";
import { OtpVerifyScreen } from "@screens/auth/OtpVerifyScreen";
import { RoleSelectionScreen } from "@screens/auth/RoleSelectionScreen";
import { BuyerProfileSetupScreen } from "@screens/auth/BuyerProfileSetupScreen";
import { SellerProfileSetupScreen } from "@screens/auth/SellerProfileSetupScreen";
import { SignInScreen } from "@screens/auth/SignInScreen";
import { ForgotPasswordScreen } from "@screens/auth/ForgotPasswordScreen";
import { CreateNewPasswordScreen } from "@screens/auth/CreateNewPasswordScreen";

// Flow: Onboarding -> Register -> OtpVerify -> RoleSelection ->
// BuyerProfileSetup | SellerProfileSetup -> (login, RootNavigator takes over)
// SignIn is reachable from Onboarding or Register for returning users.

const Stack = createNativeStackNavigator();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="CreateNewPassword" component={CreateNewPasswordScreen} />
      <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="BuyerProfileSetup" component={BuyerProfileSetupScreen} />
      <Stack.Screen name="SellerProfileSetup" component={SellerProfileSetupScreen} />
    </Stack.Navigator>
  );
}
