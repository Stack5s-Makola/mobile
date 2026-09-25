import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { OnboardingScreen } from "@screens/onboarding/OnboardingScreen";
import { RegisterScreen } from "@screens/auth/RegisterScreen";
import { OtpVerifyScreen } from "@screens/auth/OtpVerifyScreen";
import { RoleSelectionScreen } from "@screens/auth/RoleSelectionScreen";
import { BuyerProfileSetupScreen } from "@screens/auth/BuyerProfileSetupScreen";
import { SellerProfileSetupScreen } from "@screens/auth/SellerProfileSetupScreen";
import { LocationPickerScreen } from "@screens/auth/LocationPickerScreen";
import { SignInScreen } from "@screens/auth/SignInScreen";
import { ForgotPasswordScreen } from "@screens/auth/ForgotPasswordScreen";
import { CreateNewPasswordScreen } from "@screens/auth/CreateNewPasswordScreen";

// Flow: Onboarding -> RoleSelection -> Register ->
// BuyerProfileSetup | SellerProfileSetup -> OtpVerify -> (login, RootNavigator
// takes over)
//
// Role is picked first, straight off "Get started", so the sign-up form can
// be framed for a buyer or a seller. It rides through Register in nav params
// to the matching profile-setup screen, which is where the account is
// actually created (one combined submission).
//
// SignIn is reachable from Onboarding or Register for returning users.

const Stack = createNativeStackNavigator();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="CreateNewPassword" component={CreateNewPasswordScreen} />
      <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
      <Stack.Screen name="BuyerProfileSetup" component={BuyerProfileSetupScreen} />
      <Stack.Screen name="SellerProfileSetup" component={SellerProfileSetupScreen} />
      <Stack.Screen name="LocationPicker" component={LocationPickerScreen} />
    </Stack.Navigator>
  );
}
