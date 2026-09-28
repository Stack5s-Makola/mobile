import {
  Bookmark,
  Camera,
  ChevronRight,
  ContactRound,
  LockKeyhole,
  LogOut,
  Phone,
  UserRound,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@context/AuthContext";
import { buyerProfileService } from "@services/buyerProfileService";
import { pickImage } from "@utils/pickImage";
import { colors, fonts, radii } from "@constants/theme";
import { BuyerTabProps } from "@navigation/buyerRoutes";

export function BuyerProfileTab({ navigation }: BuyerTabProps<"Profile">) {
  const { session, logout } = useAuth();
  const [name, setName] = useState(session?.user.fullName ?? "");
  const [imageUri, setImageUri] = useState<string | null>(
    session?.user.photoUri ?? null,
  );
  const [details, setDetails] = useState({
    email: session?.user.email ?? "",
    phone: session?.user.phone ?? "",
    location: session?.user.location ?? "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      buyerProfileService.getProfile(),
      buyerProfileService.getPersonalDetails(),
    ])
      .then(([profileRes, detailsRes]) => {
        if (profileRes.success) {
          setName(profileRes.data.name ?? "");
          setImageUri(
            profileRes.data.profilePicture ??
              profileRes.data.picture ??
              profileRes.data.image ??
              null,
          );
        }
        if (detailsRes.success) {
          setDetails({
            email: detailsRes.data.email ?? "",
            phone: detailsRes.data.phone ?? "",
            // personal-details doesn't return a location, so keep whatever
            // the session already has rather than blanking the field.
            location: detailsRes.data.location ?? session?.user.location ?? "",
          });
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
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
    const res = await buyerProfileService.updateProfilePicture(imageUri);
    setIsSaving(false);
    if (res.success) {
      // Keep the hosted URL, not the local file path - it survives a reinstall.
      setImageUri(res.data.profilePicture ?? imageUri);
      Alert.alert("Profile updated", "Your profile has been saved.");
    } else Alert.alert("Could not update profile", res.message);
  }


  if (isLoading)
    return <ActivityIndicator style={styles.loading} color={colors.primary} />;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.identity}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarButton}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.avatar} />
              ) : (
                <UserRound size={36} color={GREEN} />
              )}
            </View>
            <Pressable
              style={({ pressed }) => [styles.changePhoto, pressed && styles.pressed]}
              onPress={chooseImage}
              accessibilityRole="button"
              accessibilityLabel="Change photo"
            >
              <Camera size={13} color={colors.white} />
              <Text style={styles.changePhotoLabel}>Change Photo</Text>
            </Pressable>
          </View>
          <Text style={styles.name}>{name || session?.user.fullName}</Text>
          <Text style={styles.email}>{details.email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Account</Text>
          <View style={styles.card}>
          <ProfileRow
            icon={<UserRound size={20} color={colors.primary} />}
            title="Name"
            onPress={() => navigation.getParent()?.navigate("BuyerName")}
          />
          <ProfileRow
            icon={<LockKeyhole size={20} color={colors.primary} />}
            title="Change password"
            onPress={() => navigation.getParent()?.navigate("BuyerPassword")}
          />
          <ProfileRow
            icon={<Phone size={20} color={colors.primary} />}
            title="Phone Number"
            onPress={() => navigation.getParent()?.navigate("BuyerPhone")}
            last
          />
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved</Text>
          <View style={styles.card}>
          <ProfileRow
            icon={<ContactRound size={20} color={colors.primary} />}
            title="Saved contacts"
            onPress={() => navigation.navigate("Saved", { section: "shops" })}
          />
          <ProfileRow
            icon={<Bookmark size={20} color={colors.primary} />}
            title="Saved products"
            onPress={() => navigation.navigate("Saved")}
            last
          />
          </View>
        </View>

        <Pressable style={styles.logoutButton} onPress={logout}>
          <LogOut size={18} color={SOFT_BLACK} />
          <Text style={styles.logoutLabel}>Log out</Text>
        </Pressable>
      </ScrollView>

    </SafeAreaView>
  );
}

function ProfileRow({
  icon,
  title,
  onPress,
  last,
}: {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable style={[styles.row, !last && styles.rowDivider]} onPress={onPress}>
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={[styles.rowTitle, styles.rowCopy]}>{title}</Text>
      <ChevronRight size={19} color={colors.textMuted} />
    </Pressable>
  );
}

// Matching the seller profile page.
const GREEN = "#1CA30A";
const SOFT_BLACK = "#3A3A3A";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: 20, paddingBottom: 128 },
  loading: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  title: {
    textAlign: "center",
    fontSize: 20,
    fontFamily: fonts.headline,
    color: colors.text,
    marginBottom: 18,
  },
  avatarButton: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatar: { width: "100%", height: "100%" },
  changePhoto: {
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: GREEN,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  changePhotoLabel: { fontSize: 12, fontFamily: fonts.bodySemiBold, color: colors.white },
  name: {
    textAlign: "center",
    fontSize: 20,
    fontFamily: fonts.headline,
    color: colors.text,
    marginTop: 12,
  },
  email: {
    textAlign: "center",
    fontSize: 13,
    fontFamily: fonts.bodyRegular,
    color: colors.textMuted,
    marginTop: 2,
  },
  section: { marginTop: 28, gap: 8 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
  },
  pressed: { opacity: 0.85 },
  // The card carries the fill; rows just divide it up.
  card: {
    backgroundColor: "#ECF0EF",
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  rowIcon: { width: 24, alignItems: "center", justifyContent: "center" },
  rowCopy: { flex: 1, marginLeft: 12 },
  rowTitle: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
  },
  logoutButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 52,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  logoutLabel: {
    color: SOFT_BLACK,
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modalCard: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    gap: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 19,
    fontFamily: fonts.headline,
    color: colors.text,
  },
  close: { fontSize: 13, fontFamily: fonts.bodyMedium, color: colors.danger },
  fieldLabel: {
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
    marginTop: 6,
    marginBottom: 4,
  },
  input: {
    height: 48,
    backgroundColor: colors.white,
    borderRadius: radii.button,
    paddingHorizontal: 14,
    fontFamily: fonts.bodyRegular,
    color: colors.text,
  },
  readOnly: { color: colors.textMuted, backgroundColor: colors.neutralSoft },
  actionButton: {
    height: 50,
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  actionLabel: {
    color: colors.white,
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
  },
});
