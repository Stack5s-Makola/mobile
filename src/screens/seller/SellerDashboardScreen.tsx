import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import {
  Package,
  Eye,
  FilePen,
  PackageX,
  Plus,
  Store,
  ShieldAlert,
  Clock,
  CircleAlert,
  ChevronRight,
} from "lucide-react-native";
import { StatCard } from "@components/StatCard";
import { SellerListingRow } from "@components/SellerListingRow";
import { colors, fonts, radii } from "@constants/theme";
import { useAuth } from "@context/AuthContext";
import { SellerTabProps } from "@navigation/sellerRoutes";
import { sellerService } from "@services/sellerService";
import { SellerDashboard, VerificationStatus } from "@types/seller";
import { firstName, formatCount } from "@utils/format";

const VERIFICATION_BANNER: Record<
  Exclude<VerificationStatus, "VERIFIED">,
  { title: string; body: string; icon: typeof Clock; fg: string; bg: string }
> = {
  NOT_STARTED: {
    title: "Verify your shop",
    body: "Verified sellers get a badge and more trust from buyers.",
    icon: ShieldAlert,
    fg: colors.primary,
    bg: colors.primarySoft,
  },
  PENDING: {
    title: "Verification under review",
    body: "We'll let you know once your documents have been checked.",
    icon: Clock,
    fg: colors.warning,
    bg: colors.warningSoft,
  },
  REJECTED: {
    title: "Verification needs attention",
    body: "Your documents couldn't be approved. Tap to see why and resubmit.",
    icon: CircleAlert,
    fg: colors.danger,
    bg: colors.dangerSoft,
  },
};

export function SellerDashboardScreen({ navigation }: SellerTabProps<"Dashboard">) {
  const { session } = useAuth();
  const [dashboard, setDashboard] = useState<SellerDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    try {
      const res = await sellerService.getDashboard();
      if (res.success) {
        setDashboard(res.data);
        setError(null);
      } else {
        setError(res.message);
      }
    } catch {
      setError("Couldn't load your dashboard. Pull down to try again.");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Refetch whenever the tab regains focus so stats reflect edits made in
  // Listings/Shop/Verification.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function goToAddListing() {
    navigation.navigate("Listings", { screen: "ListingForm", params: {}, initial: false });
  }

  if (!dashboard && !error) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const banner =
    dashboard && dashboard.verificationStatus !== "VERIFIED"
      ? VERIFICATION_BANNER[dashboard.verificationStatus]
      : null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => load(true)}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {firstName(session?.user.fullName)}</Text>
          <Text style={styles.shopName}>
            {dashboard?.businessName ?? session?.user.businessName}
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {banner ? (
          <Pressable
            style={[styles.banner, { backgroundColor: banner.bg }]}
            onPress={() => navigation.navigate("Verification")}
            accessibilityRole="button"
          >
            <banner.icon size={22} color={banner.fg} />
            <View style={styles.bannerText}>
              <Text style={[styles.bannerTitle, { color: banner.fg }]}>{banner.title}</Text>
              <Text style={styles.bannerBody}>{banner.body}</Text>
            </View>
            <ChevronRight size={18} color={banner.fg} />
          </Pressable>
        ) : null}

        {dashboard ? (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                <StatCard
                  label="Active listings"
                  value={String(dashboard.activeListings)}
                  icon={<Package size={16} color={colors.primary} />}
                />
                <StatCard
                  label="Total views"
                  value={formatCount(dashboard.totalViews)}
                  icon={<Eye size={16} color={colors.primary} />}
                />
              </View>
              <View style={styles.statsRow}>
                <StatCard
                  label="Drafts"
                  value={String(dashboard.draftListings)}
                  icon={<FilePen size={16} color={colors.primary} />}
                />
                <StatCard
                  label="Sold out"
                  value={String(dashboard.soldOutListings)}
                  icon={<PackageX size={16} color={colors.primary} />}
                />
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.action, styles.actionPrimary, pressed && styles.pressed]}
                onPress={goToAddListing}
                accessibilityRole="button"
              >
                <Plus size={18} color={colors.white} />
                <Text style={[styles.actionLabel, styles.actionLabelPrimary]}>Add listing</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.action, pressed && styles.pressed]}
                onPress={() => navigation.navigate("Shop")}
                accessibilityRole="button"
              >
                <Store size={18} color={colors.primary} />
                <Text style={styles.actionLabel}>Edit shop</Text>
              </Pressable>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent listings</Text>
              {dashboard.totalListings > 0 ? (
                <Text
                  style={styles.seeAll}
                  onPress={() => navigation.navigate("Listings", { screen: "ListingsHome" })}
                >
                  See all ({dashboard.totalListings})
                </Text>
              ) : null}
            </View>

            {dashboard.recentListings.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No listings yet</Text>
                <Text style={styles.emptyBody}>
                  Add your first product so buyers nearby can find you.
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {dashboard.recentListings.map((listing) => (
                  <SellerListingRow
                    key={listing.id}
                    listing={listing}
                    onPress={() =>
                      navigation.navigate("Listings", {
                        screen: "ListingForm",
                        params: { listingId: listing.id },
                        initial: false,
                      })
                    }
                  />
                ))}
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  content: { padding: 20, paddingBottom: 32, gap: 16 },
  header: { marginTop: 4 },
  greeting: { fontSize: 14, fontFamily: fonts.bodyMedium, color: colors.textMuted },
  shopName: { fontSize: 24, fontFamily: fonts.headline, color: colors.primary, marginTop: 2 },
  error: { fontSize: 14, fontFamily: fonts.bodyRegular, color: colors.danger },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radii.card,
    padding: 14,
  },
  bannerText: { flex: 1 },
  bannerTitle: { fontSize: 15, fontFamily: fonts.bodySemiBold },
  bannerBody: { fontSize: 13, fontFamily: fonts.bodyRegular, color: colors.text, marginTop: 2 },
  statsGrid: { gap: 12 },
  statsRow: { flexDirection: "row", gap: 12 },
  actions: { flexDirection: "row", gap: 12 },
  action: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: radii.button,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  actionPrimary: { backgroundColor: colors.primary },
  actionLabel: { fontSize: 15, fontFamily: fonts.bodySemiBold, color: colors.primary },
  actionLabelPrimary: { color: colors.white },
  pressed: { opacity: 0.85 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 8,
  },
  sectionTitle: { fontSize: 18, fontFamily: fonts.headline, color: colors.text },
  seeAll: { fontSize: 14, fontFamily: fonts.bodySemiBold, color: colors.primary },
  list: { gap: 10 },
  empty: {
    backgroundColor: colors.white,
    borderRadius: radii.card,
    padding: 20,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 16, fontFamily: fonts.bodySemiBold, color: colors.text },
  emptyBody: {
    fontSize: 14,
    fontFamily: fonts.bodyRegular,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 4,
  },
});
