import React, { useState } from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Camera } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { AppTextInput } from "@components/AppTextInput";
import { PrimaryButton } from "@components/PrimaryButton";
import { colors, fonts } from "@constants/theme";
import { useToast } from "@components/Toast";
import * as apiAuthService from "@services/api/authService";

// Last step before verification. The credentials were collected on the
// previous screen and are submitted here, mirroring the seller flow.
//
// POST /api/register/buyer takes credentials only - a buyer's name and
// location have nowhere to go on the backend yet, so they're collected for
// the local session (BuyerProfileTab reads fullName) and carried through
// the OTP screen.
export function BuyerProfileSetupScreen({ navigation, route }: any) {
  const { phone, email, password } = route.params as {
    phone: string;
    email: string;
    password: string;
  };
  const { showToast } = useToast();
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = fullName.length > 0 && location.length > 0;

  async function handlePickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast(
        "Allow photo library access to upload a profile photo.",
        "error",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  }

  async function handleContinue() {
    setIsLoading(true);
    try {
      const res = await apiAuthService.registerBuyer({
        email,
        phone,
        password,
      });
      if (res.success) {
        showToast(res.message, "success");
        navigation.navigate("OtpVerify", {
          email,
          phone,
          purpose: "buyerRegister",
          profile: {
            fullName: fullName.trim(),
            location: location.trim(),
            photoUri,
          },
          issued: {
            accessToken: res.data.accessToken,
            userId: res.data.user?.id ?? "",
            role: res.data.user?.role ?? "BUYER",
          },
        });
      } else {
        // Duplicate email / phone come back as a 409 with a ready-to-show
        // message and no field-level `errors` map.
        showToast(
          res.errors?.email ?? res.errors?.phone ?? res.message,
          "error",
        );
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
      <Text style={styles.title}>Set up your profile</Text>
      <Text style={styles.subtitle}>Tell us a little about yourself</Text>

      <View style={styles.photoSection}>
        <Pressable style={styles.photoCircle} onPress={handlePickPhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoImage} />
          ) : (
            <Camera size={32} color={colors.primary} />
          )}
        </Pressable>
        <Pressable style={styles.uploadButton} onPress={handlePickPhoto}>
          <Camera size={16} color={colors.white} />
          <Text style={styles.uploadLabel}>
            {photoUri ? "Change photo" : "Upload a photo"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.form}>
        <View>
          <Text style={styles.fieldQuestion}>What should we call you?</Text>
          <AppTextInput
            placeholder="Enter your name"
            value={fullName}
            onChangeText={setFullName}
          />
        </View>
        <View>
          <Text style={styles.fieldQuestion}>Where do you live?</Text>
          <AppTextInput
            placeholder="Enter your location"
            value={location}
            onChangeText={setLocation}
          />
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    paddingTop: 40,
  },
  back: { marginBottom: 24 },
  title: { fontSize: 24, fontFamily: fonts.headline, color: colors.primary },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.bodyRegular,
    color: "#435c46",
    marginTop: 4,
  },
  photoSection: { alignItems: "center", marginVertical: 20 },
  photoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photoImage: { width: "100%", height: "100%" },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: -18,
  },
  uploadLabel: {
    color: colors.white,
    fontSize: 12,
    fontFamily: fonts.bodySemiBold,
  },
  form: { gap: 24 },
  fieldQuestion: {
    fontSize: 20,
    fontFamily: fonts.headline,
    color: colors.primary,
    marginBottom: 8,
  },
  footer: { flex: 1, justifyContent: "flex-end", paddingBottom: 16 },
});
