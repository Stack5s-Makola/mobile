import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "@components/PrimaryButton";
import { colors, fonts } from "@constants/theme";
import { useAuth } from "@context/AuthContext";

export function OnboardingScreen({ navigation }: any) {
  const { setIsOnboarded } = useAuth();

  function handleGetStarted() {
    setIsOnboarded(true);
    navigation.navigate("RoleSelection");
  }

  function handleSignIn() {
    setIsOnboarded(true);
    navigation.navigate("SignIn");
  }

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require("../../assets/makola_tpbg.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <View style={styles.illustration}>
        <Image
          source={require("../../assets/onboarding_MAKOLA.png")}
          style={styles.illustrationImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.title}>Discover sellers beyond your network</Text>
        <Text style={styles.subtitle}>
          Browse thousands of verified products from local merchants across Ghana.
        </Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton label="Get started" onPress={handleGetStarted} />
        <View style={{ height: 12 }} />
        <PrimaryButton
          label="Sign In"
          variant="outline"
          onPress={handleSignIn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
  },
  logo: {
    width: 92,
    height: 40,
    alignSelf: "center",
    marginTop: 12,
  },
  illustration: {
    height: 370,
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  illustrationImage: { width: "100%", height: "100%" },
  textBlock: { marginTop: 24 },
  title: {
    fontSize: 30,
    fontFamily: fonts.bodyRegular,
    color: colors.text,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: fonts.bodyRegular,
    color: colors.text,
    marginTop: 16,
  },
  actions: { marginTop: "auto", marginBottom: 24 },
});
