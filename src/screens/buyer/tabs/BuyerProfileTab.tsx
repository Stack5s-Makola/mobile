import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PrimaryButton } from "@components/PrimaryButton";
import { useAuth } from "@context/AuthContext";
import { buyerProfileService } from "@services/buyerProfileService";
import { pickImage } from "@utils/pickImage";
import { colors, fonts, radii } from "@constants/theme";
import { Camera } from "lucide-react-native";

export function BuyerProfileTab() {
  const { session, logout } = useAuth();
  const [name, setName] = useState(session?.user.fullName ?? "");
  const [imageUri, setImageUri] = useState<string | null>(
    session?.user.photoUri ?? null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    buyerProfileService.getProfile().then((res) => {
      if (res.success) {
        setName(res.data.name);
        setImageUri(res.data.picture ?? res.data.image ?? null);
      }
      setIsLoading(false);
    });
  }, []);

  async function chooseImage() {
    const uri = await pickImage({ aspect: [1, 1], askSource: true });
    if (uri) setImageUri(uri);
  }

  async function saveProfile() {
    if (!name.trim() || !imageUri) {
      Alert.alert("Profile incomplete", "Add your name and a profile image.");
      return;
    }
    setIsSaving(true);
    const res = await buyerProfileService.updateProfile(name, imageUri);
    setIsSaving(false);
    if (res.success) {
      setName(res.data.name);
      setImageUri(res.data.picture ?? res.data.image ?? imageUri);
      Alert.alert("Profile updated", "Your buyer profile has been saved.");
    } else {
      Alert.alert("Could not update profile", res.message);
    }
  }

  if (isLoading)
    return <ActivityIndicator style={styles.loading} color={colors.primary} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>My profile</Text>
        <Pressable style={styles.avatarButton} onPress={chooseImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.avatar} />
          ) : (
            <Camera size={28} color={colors.primary} />
          )}
        </Pressable>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
        />
        <PrimaryButton
          label={isSaving ? "Saving..." : "Save profile"}
          onPress={saveProfile}
          disabled={isSaving}
        />
      </View>
      <PrimaryButton label="Log out" onPress={logout} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
    backgroundColor: colors.background,
  },
  content: { flex: 1, alignItems: "center", paddingTop: 40 },
  loading: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.headline,
    color: colors.primary,
    marginBottom: 24,
  },
  avatarButton: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  avatar: { width: 112, height: 112, borderRadius: 56 },
  label: {
    alignSelf: "stretch",
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
    marginBottom: 6,
  },
  input: {
    alignSelf: "stretch",
    height: 50,
    backgroundColor: colors.white,
    borderRadius: radii.button,
    paddingHorizontal: 16,
    fontFamily: fonts.bodyRegular,
    marginBottom: 18,
  },
});
