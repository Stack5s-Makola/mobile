import React from "react";
import { View, Text, Image, StyleSheet, SafeAreaView, useWindowDimensions } from "react-native";
import { PrimaryButton } from "@components/PrimaryButton";
import { colors, fonts } from "@constants/theme";
import { useAuth } from "@context/AuthContext";

// Sourced from Figma's temporary asset CDN (~7 day expiry) - see README
// "Known issues". Replace with real exported assets once available.
const WORDMARK = "https://www.figma.com/api/mcp/asset/470f0bbd-4747-40bd-9e8b-3bc5ad4aed42.png";
const PHOTOS = [
  { uri: "https://www.figma.com/api/mcp/asset/6c63f320-9a3a-46f4-ab35-7fcc47946541.png", x: 0, y: 66, rotate: "-27.31deg" },
  { uri: "https://www.figma.com/api/mcp/asset/ce0118e4-0f16-49e1-a8d3-44d30ee0224c.png", x: 234, y: 255, rotate: "-52.48deg" },
  { uri: "https://www.figma.com/api/mcp/asset/8ac14eb0-7944-4ccb-b965-448be264bd83.png", x: -18, y: 271, rotate: "-114.22deg" },
  { uri: "https://www.figma.com/api/mcp/asset/62fcb7cb-e074-4924-a2dd-a606700fd36c.png", x: 105, y: 383, rotate: "-27.31deg" },
  { uri: "https://www.figma.com/api/mcp/asset/19aee89a-5470-4175-82c7-99914f5a6332.png", x: 285, y: 60, rotate: "37.83deg" },
];
// Reference frame width from Figma (iPhone 402pt) - positions above scale
// proportionally to whatever device width this renders on.
const REFERENCE_WIDTH = 402;

export function OnboardingScreen({ navigation }: any) {
  const { setIsOnboarded } = useAuth();
  const { width } = useWindowDimensions();
  const scale = width / REFERENCE_WIDTH;

  function handleGetStarted() {
    setIsOnboarded(true);
    navigation.navigate("Register");
  }

  function handleSignIn() {
    setIsOnboarded(true);
    navigation.navigate("SignIn");
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.illustration}>
        <Image source={{ uri: WORDMARK }} style={styles.wordmark} resizeMode="contain" />
        {PHOTOS.map((photo, i) => (
          <Image
            key={i}
            source={{ uri: photo.uri }}
            style={[
              styles.photo,
              {
                left: photo.x * scale,
                top: photo.y * scale,
                transform: [{ rotate: photo.rotate }],
              },
            ]}
            resizeMode="contain"
          />
        ))}
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.title}>Discover sellers beyond your network</Text>
        <Text style={styles.subtitle}>
          Explore products from amazing sellers across Ghana, all in one place.
        </Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton label="Get started" onPress={handleGetStarted} />
        <View style={{ height: 12 }} />
        <PrimaryButton label="Sign In" variant="outline" onPress={handleSignIn} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16 },
  illustration: { height: 300, marginTop: 40, alignItems: "center", justifyContent: "center" },
  wordmark: { width: 90, height: 108, zIndex: 1 },
  photo: { position: "absolute", width: 120, height: 120, borderRadius: 12 },
  textBlock: { marginTop: 24 },
  title: { fontSize: 30, fontFamily: fonts.headline, color: colors.primary, lineHeight: 36 },
  subtitle: { fontSize: 16, fontFamily: fonts.bodyRegular, color: colors.text, marginTop: 16 },
  actions: { marginTop: "auto", marginBottom: 24 },
});
