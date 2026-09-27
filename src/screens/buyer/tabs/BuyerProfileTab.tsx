import {
  Bell,
  Bookmark,
  Camera,
  ChevronRight,
  ContactRound,
  LockKeyhole,
  LogOut,
  UserRound,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@context/AuthContext";
import { buyerProfileService } from "@services/buyerProfileService";
import { pickImage } from "@utils/pickImage";
import { colors, fonts, radii } from "@constants/theme";
import { BuyerTabProps } from "@navigation/buyerRoutes";

type Dialog = "personal" | "password" | null;

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
  const [dialog, setDialog] = useState<Dialog>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    Promise.all([
      buyerProfileService.getProfile(),
      buyerProfileService.getPersonalDetails(),
    ])
      .then(([profileRes, detailsRes]) => {
        if (profileRes.success) {
          setName(profileRes.data.name);
          setImageUri(profileRes.data.picture ?? profileRes.data.image ?? null);
        }
        if (detailsRes.success) {
          setDetails({
            email: detailsRes.data.email ?? "",
            phone: detailsRes.data.phone ?? "",
            location: detailsRes.data.location ?? "",
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
    const res = await buyerProfileService.updateProfile(name, imageUri);
    setIsSaving(false);
    if (res.success) {
      setName(res.data.name);
      setImageUri(res.data.picture ?? res.data.image ?? imageUri);
      Alert.alert("Profile updated", "Your profile has been saved.");
    } else Alert.alert("Could not update profile", res.message);
  }

  async function saveDetails() {
    setIsSaving(true);
    const res = await buyerProfileService.updatePersonalDetails({
      name,
      location: details.location,
    });
    setIsSaving(false);
    if (res.success) {
      setDetails((current) => ({
        ...current,
        location: res.data.location ?? current.location,
      }));
      setDialog(null);
    } else Alert.alert("Could not update details", res.message);
  }

  async function savePassword() {
    if (
      !currentPassword ||
      newPassword.length < 8 ||
      newPassword !== confirmPassword
    ) {
      Alert.alert(
        "Check your password",
        "Use at least 8 characters and make both new passwords match.",
      );
      return;
    }
    setIsSaving(true);
    const res = await buyerProfileService.changePassword({
      currentPassword,
      newPassword,
    });
    setIsSaving(false);
    if (res.success) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setDialog(null);
      Alert.alert("Password changed", "Your password has been updated.");
    } else Alert.alert("Could not change password", res.message);
  }

  if (isLoading)
    return <ActivityIndicator style={styles.loading} color={colors.primary} />;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>My profile</Text>
        <Pressable style={styles.avatarButton} onPress={chooseImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.avatar} />
          ) : (
            <UserRound size={36} color={colors.primary} />
          )}
          <View style={styles.cameraBadge}>
            <Camera size={14} color={colors.white} />
          </View>
        </Pressable>
        <Text style={styles.name}>{name || "Buyer"}</Text>
        <Text style={styles.email}>{details.email}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Account</Text>
          <ProfileRow
            icon={<UserRound size={20} color={colors.primary} />}
            title="Personal information"
            subtitle="Name, phone number and location"
            onPress={() => setDialog("personal")}
          />
          <ProfileRow
            icon={<LockKeyhole size={20} color={colors.primary} />}
            title="Change password"
            subtitle="Update your account password"
            onPress={() => setDialog("password")}
          />
          <ProfileRow
            icon={<Bell size={20} color={colors.primary} />}
            title="Notifications"
            subtitle="Manage your notification preferences"
            onPress={() => navigation.getParent()?.navigate("Notifications")}
          />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saved</Text>
          <ProfileRow
            icon={<ContactRound size={20} color={colors.primary} />}
            title="Saved contacts"
            subtitle="View your saved shops and sellers"
            onPress={() => navigation.navigate("Saved", { section: "shops" })}
          />
          <ProfileRow
            icon={<Bookmark size={20} color={colors.primary} />}
            title="Saved products"
            subtitle="View products you saved"
            onPress={() => navigation.navigate("Saved")}
          />
        </View>

        <Pressable style={styles.logoutButton} onPress={logout}>
          <LogOut size={18} color={colors.danger} />
          <Text style={styles.logoutLabel}>Log out</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={dialog !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setDialog(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {dialog === "personal"
                  ? "Personal information"
                  : "Change password"}
              </Text>
              <Pressable onPress={() => setDialog(null)}>
                <Text style={styles.close}>Close</Text>
              </Pressable>
            </View>
            {dialog === "personal" ? (
              <>
                <FieldLabel text="Full name" />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                />
                <FieldLabel text="Email" />
                <TextInput
                  style={[styles.input, styles.readOnly]}
                  value={details.email}
                  editable={false}
                />
                <FieldLabel text="Phone number" />
                <TextInput
                  style={[styles.input, styles.readOnly]}
                  value={details.phone}
                  editable={false}
                />
                <FieldLabel text="Location" />
                <TextInput
                  style={styles.input}
                  value={details.location}
                  onChangeText={(location) =>
                    setDetails((current) => ({ ...current, location }))
                  }
                />
                <ActionButton
                  label="Save changes"
                  onPress={saveDetails}
                  loading={isSaving}
                />
              </>
            ) : (
              <>
                <PasswordField
                  label="Current password"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                <PasswordField
                  label="New password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <PasswordField
                  label="Confirm new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <ActionButton
                  label="Change password"
                  onPress={savePassword}
                  loading={isSaving}
                />
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ProfileRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowIcon}>{icon}</View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <ChevronRight size={19} color={colors.textMuted} />
    </Pressable>
  );
}
function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}
function PasswordField({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View>
      <FieldLabel text={label} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry
      />
    </View>
  );
}
function ActionButton({
  label,
  onPress,
  loading,
}: {
  label: string;
  onPress: () => void;
  loading: boolean;
}) {
  return (
    <Pressable style={styles.actionButton} onPress={onPress} disabled={loading}>
      <Text style={styles.actionLabel}>{loading ? "Saving..." : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
    alignSelf: "center",
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: { width: 108, height: 108, borderRadius: 54 },
  cameraBadge: {
    position: "absolute",
    right: 0,
    bottom: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background,
  },
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
    marginTop: 4,
  },
  section: { marginTop: 28 },
  sectionTitle: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: colors.textMuted,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radii.card,
    padding: 14,
    marginBottom: 10,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.card,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: { flex: 1, marginLeft: 12 },
  rowTitle: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
  },
  rowSubtitle: {
    fontSize: 12,
    fontFamily: fonts.bodyRegular,
    color: colors.textMuted,
    marginTop: 3,
  },
  logoutButton: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minWidth: 150,
    height: 48,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: radii.button,
  },
  logoutLabel: {
    color: colors.danger,
    fontSize: 15,
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
