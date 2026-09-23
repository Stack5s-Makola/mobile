import React, { useState } from "react";
import { View, Text, Image, Pressable, StyleSheet, SafeAreaView } from "react-native";
import { ArrowLeft, Camera } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { AppTextInput } from "@components/AppTextInput";
import { PrimaryButton } from "@components/PrimaryButton";
import { colors, fonts } from "@constants/theme";
import { useToast } from "@components/Toast";
import * as apiAuthService from "@services/api/authService";

// This screen calls the REAL backend directly (not the authService
// swap-point) because only THIS endpoint is confirmed live -
// login/verify-otp/etc. are still 404, so flipping the whole swap-point
// would break those.
//
// VERIFIED against the live backend: POST /api/register/set-seller-profile
// creates the account and emails the OTP in one call, and returns only
// { saved: true } - no userId - so the OTP screen is handed the email and
// phone we already collected here.
//
// TODO(location): the backend requires GPS coordinates and rejects a plain
// string. Until Google Maps / device location is wired up, the typed
// location is sent as location.address (extra keys are accepted) alongside
// the placeholder coordinates below. Replace these with real ones then -
// nothing else about this call needs to change.
const PLACEHOLDER_COORDINATES = { latitude: 5.6037, longitude: -0.187 }; // Accra

export function SellerProfileSetupScreen({ navigation, route }: any) {
  const { phone, email, password } = route.params as { phone: string; email: string; password: string };
  const { showToast } = useToast();
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [location, setLocation] = useState("");
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = fullName.length > 0 && businessName.length > 0 && location.length > 0;

  async function handlePickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast("Allow photo library access to upload a profile photo.", "error");
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
        location: { ...PLACEHOLDER_COORDINATES, address: location.trim() },
        photoUri,
      });
      if (res.success) {
        showToast(res.message, "success");
        // The backend returns none of this back, so carry it forward - the
        // OTP screen uses it to build the session the seller lands in.
        navigation.navigate("OtpVerify", {
          email,
          phone,
          purpose: "sellerRegister",
          // A token is issued here, but the account isn't verified yet - so
          // it rides along to the OTP screen instead of becoming a session.
          issued: {
            accessToken: res.data.accessToken,
            userId: res.data.user.id,
            role: res.data.user.role,
          },
          profile: {
            fullName: fullName.trim(),
            businessName: businessName.trim(),
            location: location.trim(),
            photoUri,
          },
        });
      } else {
        // Duplicate email / phone / shop name come back as a 409 with a
        // ready-to-show message and no field-level `errors` map.
        showToast(res.message, "error");
      }
    } catch {
      showToast("Check your connection and try again.", "error");
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
