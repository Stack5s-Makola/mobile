import React, { useCallback, useState } from "react";
import { View, Text, Image, ScrollView, Pressable, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
  ChevronRight,
  LogOut,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Store,
} from "lucide-react-native";
import { StatusBadge } from "@components/StatusBadge";
import { VERIFICATION_STATUS_META } from "@constants/sellerStatus";
import { colors, fonts, radii } from "@constants/theme";
import { useAuth } from "@context/AuthContext";
import { SellerTabProps } from "@navigation/sellerRoutes";
import { sellerService } from "@services/sellerService";
import { VerificationStatus } from "@types/seller";
import { initials } from "@utils/format";

export function SellerProfileScreen({ navigation }: SellerTabProps<"Profile">) {
  const { session, logout } = useAuth();
  const user = session?.user;
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [businessName, setBusinessName] = useState(user?.businessName);

  // Shop name can change from the Shop tab, and verification from the
  // Verification tab, so refresh both on focus rather than trusting the session.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all([sellerService.getVerification(), sellerService.getShop()])
        .then(([verification, shop]) => {
          if (cancelled) return;
          if (verification.success) setVerificationStatus(verification.data.status);
          if (shop.success) setBusinessName(shop.data.businessName);
        })
        .catch(() => {});
      return () => {
        cancelled = true;
      };
    }, [])
  );

  function handleLogout() {
    Alert.alert("Log out?", "You'll need to sign in again to manage your shop.", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: logout },
    ]);
  }

  const verificationMeta = verificationStatus ? VERIFICATION_STATUS_META[verificationStatus] : null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.identity}>
          <View style={styles.avatar}>
            {user?.photoUri ? (
              <Image source={{ uri: user.photoUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarInitials}>{initials(user?.fullName)}</Text>
            )}
          </View>
          <View style={styles.flex}>
            <Text style={styles.name}>{user?.fullName}</Text>
            {businessName ? <Text style={styles.business}>{businessName}</Text> : null}
            {verificationMeta ? (
              <View style={styles.badge}>
                <StatusBadge label={verificationMeta.label} tone={verificationMeta.tone} />
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.card}>
          <InfoRow icon={<Phone size={18} color={colors.primary} />} label="Phone" value={user?.phone} />
          <InfoRow icon={<Mail size={18} color={colors.primary} />} label="Email" value={user?.email} />
          <InfoRow
            icon={<MapPin size={18} color={colors.primary} />}
            label="Location"
            value={user?.location}
            last
          />
        </View>

        <View style={styles.card}>
          <MenuRow
            icon={<Store size={18} color={colors.primary} />}
            label="Manage shop"
            onPress={() => navigation.navigate("Shop")}
          />
          <MenuRow
            icon={<ShieldCheck size={18} color={colors.primary} />}
            label="Verification"
            onPress={() => navigation.navigate("Verification")}
            last
          />
        </View>

        <Pressable
          style={({ pressed }) => [styles.logout, pressed && styles.pressed]}
          onPress={handleLogout}
          accessibilityRole="button"
        >
          <LogOut size={18} color={colors.danger} />
          <Text style={styles.logoutLabel}>Log out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      {icon}
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value || "—"}
      </Text>
    </View>
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40, gap: 16 },
  title: { fontSize: 24, fontFamily: fonts.headline, color: colors.primary },
  identity: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarInitials: { fontSize: 24, fontFamily: fonts.headline, color: colors.primary },
  name: { fontSize: 18, fontFamily: fonts.headline, color: colors.text },
  business: { fontSize: 14, fontFamily: fonts.bodyRegular, color: colors.textMuted, marginTop: 2 },
  badge: { marginTop: 6 },
  card: { backgroundColor: colors.white, borderRadius: radii.card, paddingHorizontal: 14 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  rowLabel: { fontSize: 15, fontFamily: fonts.bodyMedium, color: colors.text },
  rowValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 14,
    fontFamily: fonts.bodyRegular,
    color: colors.textMuted,
  },
  pressed: { opacity: 0.85 },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: radii.button,
    borderWidth: 2,
    borderColor: colors.danger,
    marginTop: 8,
  },
  logoutLabel: { fontSize: 16, fontFamily: fonts.bodySemiBold, color: colors.danger },
});
