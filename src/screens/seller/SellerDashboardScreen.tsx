import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Bell, MapPin, MoreVertical, Plus } from "lucide-react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fonts, radii } from "@constants/theme";
import { TAB_BAR_CLEARANCE } from "@components/AppTabBar";
import { useAuth } from "@context/AuthContext";
import { SellerTabProps } from "@navigation/sellerRoutes";
import * as apiSellerService from "@services/api/sellerService";
import { DashboardListing, SellerDashboardData } from "@types/seller";
import { firstName, formatPrice, initials } from "@utils/format";

// Reads GET /api/seller/dashboard directly rather than through the
// sellerService swap-point: that endpoint is live, while shop/listings/
// verification are still 404 and stay on the mock.

// The "+ Add products" fill. Bright enough that black type reads better on
// it than white.
const LIME = "#B5F505";
// Verified tick on the shop avatar.
const BLUE = "#1D9BF0";

const STATUS_LABEL: Record<DashboardListing["status"], string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export function SellerDashboardScreen({ navigation }: SellerTabProps<"Home">) {
  const { session } = useAuth();
  const [dashboard, setDashboard] = useState<SellerDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    try {
      const res = await apiSellerService.getDashboard();
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

  // Refetch whenever the tab regains focus so the counts reflect edits made
  // elsewhere.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function goToAddListing() {
    // Same destination as the Create tab - the Add Product form, pushed above
    // the tabs rather than the older listing form.
    navigation.navigate("AddProduct");
  }

  function editListing(listingId: string) {
    navigation.navigate("Listing", {
      screen: "ListingForm",
      params: { listingId },
      initial: false,
    });
  }

  if (!dashboard && !error) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // The greeting is the person, not the shop. Deliberately NOT dashboard.name:
  // that endpoint returns the shop name there, so it would read "Hello, Ama
  // Fabrics". fullName is what the seller typed as their own name at sign-up.
  const displayName = session?.user.fullName;
  const shopName = dashboard?.shopName ?? session?.user.businessName;

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
        <Text style={styles.greeting}>Hello, {firstName(displayName)}</Text>

        <View style={styles.identity}>
          {/* avatarBox matches the avatar exactly so the badge pins to the
              circle's edge. */}
          <View style={styles.avatarBox}>
            {dashboard?.avatar ? (
              <Image source={{ uri: dashboard.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitials}>{initials(shopName)}</Text>
              </View>
            )}
            {session?.user.emailVerified ? (
              <MaterialIcons
                name="verified"
                size={20}
                color={BLUE}
                style={styles.verifiedBadge}
                accessibilityLabel="Verified"
              />
            ) : null}
          </View>
          <Text style={styles.shopName} numberOfLines={2}>
            {shopName}
          </Text>
          {/* TODO: no notifications screen yet - wire this up once there is
              one to open. */}
          <Pressable
            onPress={() => {}}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Bell size={24} color={colors.text} />
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {dashboard ? (
          <>
            <View style={styles.listingsCard}>
              <Text style={styles.cardTitle}>My Listings</Text>

              <View style={styles.counts}>
                <Count value={dashboard.totalListings} label="Total" />
                <Count value={dashboard.approved} label="Approved" />
                <Count value={dashboard.pending} label="Pending" />
              </View>

              <Pressable
                style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
                onPress={goToAddListing}
                accessibilityRole="button"
              >
                <Plus size={18} color={colors.text} />
                <Text style={styles.addButtonLabel}>Add products</Text>
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>Recent Listing</Text>

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
                  <ListingRow
                    key={listing.id}
                    listing={listing}
                    onPress={() => editListing(listing.id)}
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

function Count({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.count}>
      <Text style={styles.countValue}>{value}</Text>
      <Text style={styles.countLabel}>{label}</Text>
    </View>
  );
}

function ListingRow({
  listing,
  onPress,
}: {
  listing: DashboardListing;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
      {listing.image ? (
        <Image source={{ uri: listing.image }} style={styles.rowImage} resizeMode="cover" />
      ) : (
        <View style={[styles.rowImage, styles.rowImageFallback]} />
      )}

      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>
          {listing.name}
        </Text>
        <Text style={styles.rowPrice}>{formatPrice(listing.price)}</Text>
        {listing.location ? (
          <View style={styles.rowLocation}>
            <MapPin size={13} color={colors.textMuted} />
            <Text style={styles.rowLocationText} numberOfLines={1}>
              {listing.location}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.rowEnd}>
        <Pressable
          onPress={onPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Options for ${listing.name}`}
        >
          <MoreVertical size={20} color={colors.text} />
        </Pressable>
        <View style={styles.status}>
          <Text style={styles.statusText}>{STATUS_LABEL[listing.status]}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  content: { padding: 20, paddingBottom: TAB_BAR_CLEARANCE, gap: 16 },

  greeting: { fontSize: 14, fontFamily: fonts.bodyMedium, color: colors.textMuted },
  identity: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: -4 },
  avatarBox: { width: 52, height: 52 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  verifiedBadge: { position: "absolute", right: -2, bottom: -2 },
  avatarFallback: {
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { fontSize: 18, fontFamily: fonts.headline, color: colors.primary },
  shopName: { flex: 1, fontSize: 22, fontFamily: fonts.headline, color: colors.primary },

  error: { fontSize: 14, fontFamily: fonts.bodyRegular, color: colors.danger },

  listingsCard: {
    backgroundColor: colors.white,
    borderRadius: radii.card,
    padding: 18,
    gap: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: { fontSize: 18, fontFamily: fonts.headline, color: colors.text },
  counts: { flexDirection: "row" },
  count: { flex: 1, alignItems: "flex-start" },
  countValue: { fontSize: 42, fontFamily: fonts.headline, color: colors.text },
  countLabel: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.primary,
    marginTop: 2,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: LIME,
    borderRadius: radii.button,
    paddingVertical: 12,
  },
  addButtonLabel: { fontSize: 15, fontFamily: fonts.bodySemiBold, color: colors.text },

  sectionTitle: { fontSize: 16, fontFamily: fonts.headline, color: colors.text },

  list: { gap: 12 },
  row: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.card,
    padding: 12,
  },
  rowImage: { width: 64, height: 64, borderRadius: 8 },
  rowImageFallback: { backgroundColor: colors.neutralSoft },
  rowBody: { flex: 1, gap: 2 },
  rowName: { fontSize: 15, fontFamily: fonts.bodySemiBold, color: colors.text },
  rowPrice: { fontSize: 15, fontFamily: fonts.headline, color: colors.primary },
  rowLocation: { flexDirection: "row", alignItems: "center", gap: 4 },
  rowLocationText: { fontSize: 12, fontFamily: fonts.bodyRegular, color: colors.textMuted },
  rowEnd: { alignItems: "flex-end", justifyContent: "space-between" },
  status: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { fontSize: 11, fontFamily: fonts.bodySemiBold, color: colors.white },

  empty: {
    backgroundColor: colors.white,
    borderRadius: radii.card,
    padding: 20,
    gap: 4,
  },
  emptyTitle: { fontSize: 15, fontFamily: fonts.bodySemiBold, color: colors.text },
  emptyBody: { fontSize: 13, fontFamily: fonts.bodyRegular, color: colors.textMuted },

  pressed: { opacity: 0.85 },
});
