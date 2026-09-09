import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RegisterScreen } from "@screens/auth/RegisterScreen";
import { OtpVerifyScreen } from "@screens/auth/OtpVerifyScreen";

export type AuthStackParamList = {
  Register: undefined;
  OtpVerify: { userId: string; phone: string; fullName: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="OtpVerify" component={OtpVerifyScreen} />
    </Stack.Navigator>
  );
}
