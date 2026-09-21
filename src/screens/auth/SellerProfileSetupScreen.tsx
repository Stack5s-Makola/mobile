import React, { useState } from "react";
import { View, Text, Image, Pressable, StyleSheet, SafeAreaView, Alert } from "react-native";
import { ArrowLeft, Camera } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { AppTextInput } from "@components/AppTextInput";
import { PrimaryButton } from "@components/PrimaryButton";
import { colors, fonts } from "@constants/theme";
import * as apiAuthService from "@services/api/authService";

// This screen calls the REAL backend directly (not the authService
// swap-point) because only THIS endpoint is confirmed live by Daniel -
// login/verify-otp/etc. aren't necessarily ready, so flipping the whole
// swap-point would break those. Revisit once more of Priority 2 lands.
//
// CONFIRMED: POST /api/register/set-seller-profile creates the account
// and triggers the OTP email in one call (Daniel).
// UNCONFIRMED (best guess, flagged in src/types/auth.ts): exact request
// body field names, and the response shape / what identifier to carry
// into OtpVerifyScreen.

export function SellerProfileSetupScreen({ navigation, route }: any) {
  const { phone, email, password } = route.params as { phone: string; email: string; password: string };
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [location, setLocation] = useState("");
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = fullName.length > 0 && businessName.length > 0 && location.length > 0;

  async function handlePickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to upload a profile photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function handleContinue() {
    setIsLoading(true);
    try {
      const res = await apiAuthService.registerSeller({
        phone,
        email,
        password,
        fullName,
        businessName,
        location,
        photoUri,
      });
      if (res.success) {
        navigation.navigate("OtpVerify", {
          userId: res.data.userId,
          phone: res.data.phone,
          purpose: "sellerRegister",
        });
      } else {
        Alert.alert("Couldn't create account", res.message);
      }
    } catch {
      Alert.alert("Couldn't create account", "Check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <ArrowLeft size={28} color={colors.text} />
      </Pressable>
      <Text style={styles.title}>Set up your seller profile</Text>
      <Text style={styles.subtitle}>
        Create your profile so buyers can recognize and connect with you.
      </Text>

      <View style={styles.photoSection}>
        <Pressable style={styles.photoCircle} onPress={handlePickPhoto}>
          {photoUri ? <Image source={{ uri: photoUri }} style={styles.photoImage} /> : null}
        </Pressable>
        <Pressable style={styles.uploadBadge} onPress={handlePickPhoto}>
          <Camera size={14} color={colors.white} />
          <Text style={styles.uploadLabel}>Upload your photo</Text>
        </Pressable>
      </View>

      <View style={styles.form}>
        <View>
          <Text style={styles.fieldQuestion}>Full Name</Text>
          <AppTextInput placeholder="Enter your fullname" value={fullName} onChangeText={setFullName} />
        </View>
        <View>
          <Text style={styles.fieldQuestion}>Business Name</Text>
          <AppTextInput
            placeholder="Enter your business name"
            value={businessName}
            onChangeText={setBusinessName}
          />
        </View>
        <View>
          <Text style={styles.fieldQuestion}>Where do you live?</Text>
          <AppTextInput placeholder="Enter your location" value={location} onChangeText={setLocation} />
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label="Continue"
          onPress={handleContinue}
          disabled={!canSubmit}
          loading={isLoading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 24, paddingTop: 40 },
  back: { marginBottom: 16 },
  title: { fontSize: 24, fontFamily: fonts.headline, color: colors.primary },
  subtitle: { fontSize: 14, fontFamily: fonts.bodyRegular, color: "#435c46", marginTop: 4 },
  photoSection: { alignItems: "center", marginVertical: 24 },
  photoCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: colors.white,
    backgroundColor: "#ddd",
    overflow: "hidden",
  },
  photoImage: { width: "100%", height: "100%" },
  uploadBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: -20,
  },
  uploadLabel: { color: colors.white, fontSize: 12, fontFamily: fonts.headline },
  form: { gap: 24 },
  fieldQuestion: { fontSize: 20, fontFamily: fonts.headline, color: colors.primary, marginBottom: 8 },
  footer: { flex: 1, justifyContent: "flex-end", paddingBottom: 16 },
});
