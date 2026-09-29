import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Camera } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  const [coordinates, setCoordinates] = useState<
    { latitude: number; longitude: number } | null
  >(null);
  const [isLocating, setIsLocating] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = fullName.length > 0 && coordinates !== null;

  async function handleUseCurrentLocation() {
    setIsLocating(true);
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        showToast("Allow location access, or pick your spot on the map.", "error");
        return;
      }
      const position = await Location.getCurrentPositionAsync({});
      setCoordinates({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch {
      showToast("Couldn't get your location. Try the map instead.", "error");
    } finally {
      setIsLocating(false);
    }
  }

  function handlePickOnMap() {
    navigation.navigate("LocationPicker", {
      initial: coordinates ?? undefined,
      onPicked: setCoordinates,
    });
  }

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
        fullName: fullName.trim(),
        name: fullName.trim(),
        location: coordinates ?? undefined,
        photoUri,
      });
      if (res.success) {
        showToast(res.message, "success");
        navigation.navigate("OtpVerify", {
          email,
          phone,
          purpose: "buyerRegister",
          profile: {
            fullName: fullName.trim(),
            location: `${coordinates!.latitude.toFixed(4)}, ${coordinates!.longitude.toFixed(4)}`,
            photoUri,
          },
          issued: {
            accessToken: res.data.accessToken ?? res.data.token ?? "",
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
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
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
              <View style={styles.locationRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.locationButton,
                    coordinates && styles.locationButtonSet,
                    pressed && styles.pressed,
                  ]}
                  onPress={handleUseCurrentLocation}
                  disabled={isLocating}
                  accessibilityRole="button"
                >
                  {isLocating ? (
                    <ActivityIndicator size="small" color={GREEN} />
                  ) : (
                    <Text style={styles.locationButtonLabel} numberOfLines={1}>
                      {coordinates
                        ? `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`
                        : "Use my current location"}
                    </Text>
                  )}
                </Pressable>

                <Pressable
                  style={({ pressed }) => [styles.mapButton, pressed && styles.pressed]}
                  onPress={handlePickOnMap}
                  accessibilityRole="button"
                  accessibilityLabel="Pick location on the map"
                >
                  <MaterialCommunityIcons name="map-marker-radius" size={24} color={colors.white} />
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <PrimaryButton
              label="Continue"
              onPress={handleContinue}
              disabled={!canSubmit}
              loading={isLoading}
              style={styles.continueButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Same green as the rest of the seller screens.
const GREEN = "#1CA30A";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 24,
    paddingTop: 40,
  },
  keyboardAvoidingView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 16 },
  back: { marginBottom: 24 },
  title: { fontSize: 24, fontFamily: fonts.bodyRegular, color: colors.text },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.bodyRegular,
    color: colors.textMuted,
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
    color: colors.text,
    marginBottom: 8,
  },
  locationRow: { flexDirection: "row", gap: 10, alignItems: "stretch" },
  // 70% of the row, with the map button taking the rest.
  locationButton: {
    flex: 0.7,
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#a7a0a0",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  locationButtonSet: { borderColor: GREEN },
  locationButtonLabel: { fontSize: 14, fontFamily: fonts.bodyMedium, color: colors.text },
  mapButton: {
    flex: 0.3,
    minHeight: 52,
    borderRadius: 10,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.85 },
  footer: { flex: 1, justifyContent: "flex-end", paddingBottom: 16, paddingTop: 28 },
  // PrimaryButton draws a 3px border in the theme colour; this drops it.
  continueButton: { borderWidth: 0 },
});
