import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ChevronRight,
  Package,
  Plus,
  Settings,
  LogOut,
  MapPin,
  Phone,
  Store,
} from "lucide-react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { pickImage } from "@utils/pickImage";
import { colors, fonts, radii } from "@constants/theme";
import { TAB_BAR_CLEARANCE } from "@components/AppTabBar";
import { useAuth } from "@context/AuthContext";
import { useToast } from "@components/Toast";
import * as apiSellerService from "@services/api/sellerService";
import { SellerTabProps } from "@navigation/sellerRoutes";
import { initials } from "@utils/format";

export function SellerProfileScreen({ navigation }: SellerTabProps<"Profile">) {
  const { session, logout, updateUser } = useAuth();
  const { showToast } = useToast();
  const user = session?.user;
  const businessName = user?.businessName;
  const [photoUri, setPhotoUri] = useState(user?.photoUri);
  // A picture chosen but not uploaded yet. Its presence is what reveals Save.
  const [pendingUri, setPendingUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function handleLogout() {
    Alert.alert("Log out?", "You'll need to sign in again to manage your shop.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: logout },
    ]);
  }

  async function handleChangePhoto() {
    // askSource: false opens the device library straight away. Flip it to
    // true to offer "Take photo" as well.
    const uri = await pickImage({ aspect: [1, 1] });
    if (uri) setPendingUri(uri);
  }

  async function handleSavePhoto() {
    if (!pendingUri) return;
    setIsSaving(true);
    try {
      const res = await apiSellerService.updateProfilePicture(pendingUri);
      if (res.success) {
        // Keep the hosted URL, not the local file path, so it survives a
        // reinstall and matches what the dashboard shows.
        setPhotoUri(res.data.avatar);
        setPendingUri(null);
        await updateUser({ photoUri: res.data.avatar });
        showToast(res.message, "success");
      } else {
        showToast(res.message, "error");
      }
    } catch {
      showToast("Check your connection and try again.", "error");
    } finally {
      setIsSaving(false);
    }
  }

  // Profile is a tab, so "back" means the tab the seller came from - the tab
  // navigator is set to backBehavior="history" so goBack() honours that.
  // Falls back to Home when there's nothing to go back to (e.g. Profile was
  // the first tab opened).
  function goBack() {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("Home");
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable
            onPress={goBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={28} color={colors.text} />
          </Pressable>
          {/* TODO: no settings screen exists yet - wire this up once there is
              one to open. */}
          <Pressable
            onPress={() => {}}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Settings size={24} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.identity}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              {pendingUri ?? photoUri ? (
                <Image source={{ uri: pendingUri ?? photoUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>{initials(businessName)}</Text>
              )}
            </View>
            <Pressable
              style={({ pressed }) => [styles.changePhoto, pressed && styles.pressed]}
              onPress={handleChangePhoto}
              accessibilityRole="button"
              accessibilityLabel="Change photo"
            >
              <FontAwesome5 name="camera" size={13} color={colors.white} />
              <Text style={styles.changePhotoLabel}>Change Photo</Text>
            </Pressable>
          </View>
          <View style={styles.identityText}>
            <Text style={styles.name}>{businessName}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Business Information</Text>

        <View style={styles.card}>
          <MenuRow
            icon={<Store size={18} color={GREEN} />}
            label="Business name"
            onPress={() => navigation.navigate("BusinessName")}
          />
          {/* TODO: Location has no editor yet - point it somewhere once one
              exists. */}
          <MenuRow
            icon={<MapPin size={18} color={GREEN} />}
            label="Location"
            onPress={() => {}}
          />
          <MenuRow
            icon={<Phone size={18} color={GREEN} />}
            label="Phone number"
            onPress={() => navigation.navigate("PhoneNumber")}
            last
          />
        </View>

        <Text style={styles.sectionLabel}>My Store</Text>

        <View style={styles.card}>
          <MenuRow
            icon={<Package size={18} color={GREEN} />}
            label="My Listings"
            onPress={() => navigation.navigate("Listing", { screen: "ListingsHome" })}
          />
          <MenuRow
            icon={<Plus size={18} color={GREEN} />}
            label="New Products"
            onPress={() =>
              navigation.navigate("Listing", {
                screen: "ListingForm",
                params: {},
                initial: false,
              })
            }
            last
          />
        </View>

        {/* space-between keeps Log out on the left whether or not Save is
            showing, and puts Save on the right when it is. */}
        <View style={styles.actionsRow}>
          <Pressable
            style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
            onPress={handleLogout}
            accessibilityRole="button"
          >
            <LogOut size={18} color={SOFT_BLACK} />
            <Text style={styles.logoutLabel}>Log out</Text>
          </Pressable>

          {pendingUri ? (
            <Pressable
              style={({ pressed }) => [styles.save, pressed && styles.pressed]}
              onPress={handleSavePhoto}
              disabled={isSaving}
              accessibilityRole="button"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.saveLabel}>Save</Text>
              )}
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, !last && styles.rowDivider, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      {icon}
      <Text style={[styles.rowLabel, styles.flex]}>{label}</Text>
      <ChevronRight size={18} color={colors.textMuted} />
    </Pressable>
  );
}

// Softer than colors.text (#000) - reads as black without the harshness.
const SOFT_BLACK = "#3A3A3A";
// Profile-page green. Deliberately local: colors.primary (#01573C) is still
// the app-wide brand colour, this only re-skins this screen.
const GREEN = "#1CA30A";

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.white },
  content: { padding: 20, paddingBottom: TAB_BAR_CLEARANCE, gap: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  // Centred column: avatar on top, name/shop/badge beneath it. marginTop
  // drops the whole block below the "Profile" title.
  identity: { alignItems: "center", gap: 4, marginTop: 12 },
  identityText: { alignItems: "center" },
  sectionLabel: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
    marginTop: 32,
    // Negative, to keep the heading tucked close to the card it labels.
    marginBottom: -6,
  },
  // Relative wrapper so the green pill can straddle the avatar's lower edge.
  // paddingBottom reserves room for the pill INSIDE the wrapper: on Android a
  // child sticking out past its parent's bounds gets no touch events, which
  // left the lower half of the button dead.
  avatarWrap: { alignItems: "center", paddingBottom: 14 },
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
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarInitials: { fontSize: 32, fontFamily: fonts.headline, color: GREEN },
  name: { fontSize: 20, fontFamily: fonts.headlineBold, color: colors.text, textAlign: "center" },
  // Swapped with the page: cards now carry the tinted background.
  card: { backgroundColor: colors.background, borderRadius: radii.card, paddingHorizontal: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  rowLabel: { fontSize: 15, fontFamily: fonts.bodyMedium, color: colors.text },
  pressed: { opacity: 0.85 },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  save: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: GREEN,
    borderRadius: radii.button,
    paddingHorizontal: 28,
    height: 52,
    minWidth: 110,
  },
  saveLabel: { fontSize: 15, fontFamily: fonts.bodySemiBold, color: colors.white },
  logout: {
    // Sized to its content; actionsRow handles the left/right placement.
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    paddingHorizontal: 20,
    borderRadius: radii.button,
    borderWidth: 2,
    borderColor: colors.white,
    marginTop: 8,
  },
  logoutLabel: { fontSize: 16, fontFamily: fonts.bodySemiBold, color: SOFT_BLACK },
});
