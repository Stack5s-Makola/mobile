import React, { useEffect, useRef } from "react";
import { View, ActivityIndicator } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import {
  NavigationContainer,
  DefaultTheme,
  Theme,
} from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  Sora_600SemiBold,
  Sora_700Bold,
} from "@expo-google-fonts/sora";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import { colors } from "@constants/theme";
import { AuthProvider } from "@context/AuthContext";
import { ToastProvider } from "@components/Toast";
import { RootNavigator } from "@navigation/RootNavigator";

const MINIMUM_SPLASH_DURATION_MS = 3000;

void SplashScreen.preventAutoHideAsync();

// React Navigation paints its own root background behind every screen; its
// default is a light grey that reads as dark under a translucent status bar
// on some devices. Pin it to the app's white.
const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.white },
};

export default function App() {
  const startupTime = useRef(Date.now());
  const [fontsLoaded] = useFonts({
    Sora_600SemiBold,
    Sora_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });

  useEffect(() => {
    if (!fontsLoaded) return;

    const remainingDuration =
      MINIMUM_SPLASH_DURATION_MS - (Date.now() - startupTime.current);
    const timeout = setTimeout(
      () => {
        void SplashScreen.hideAsync();
      },
      Math.max(remainingDuration, 0),
    );

    return () => clearTimeout(timeout);
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    // SafeAreaProvider so the toast can sit below the notch/status bar.
    // ToastProvider wraps the navigator so its overlay renders above every
    // screen.
    <SafeAreaProvider>
      <AuthProvider>
        <ToastProvider>
          <NavigationContainer theme={navigationTheme}>
            <RootNavigator />
            <StatusBar style="dark" backgroundColor={colors.white} />
          </NavigationContainer>
        </ToastProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
