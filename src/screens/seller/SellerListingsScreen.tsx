import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ArrowLeft, MapPin, MoreVertical } from "lucide-react-native";
import { TAB_BAR_CLEARANCE } from "@components/AppTabBar";
import { colors, fonts, radii } from "@constants/theme";
import { useAuth } from "@context/AuthContext";
import { ListingsStackProps } from "@navigation/sellerRoutes";
import * as apiSellerService from "@services/api/sellerService";
import { DashboardListing, ListingApprovalStatus } from "@types/seller";

// Reads GET /api/seller/shop, which despite its name returns this seller's
// products.
const GREEN = "#1CA30A";

type Filter = "all" | ListingApprovalStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "approved", label: "Approved" },
  { key: "pending", label: "Pending" },
  { key: "rejected", label: "Rejected" },
];

const STATUS_LABEL: Record<ListingApprovalStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export function SellerListingsScreen({ navigation }: ListingsStackProps<"ListingsHome">) {
  const { session } = useAuth();
  const [listings, setListings] = useState<DashboardListing[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    try {
      const res = await apiSellerService.getMyListings();
      if (res.success) {
        setListings(res.data);
        setError(null);
      } else {
        setError(res.message);
      }
    } catch {
      setError("Couldn't load your listings. Pull down to try again.");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Refetch on focus so a product added from the Create tab shows up.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Listings carry no location of their own - the shop's is what a buyer sees.
  const shopLocation = session?.user.location;
  const visible =
    listings?.filter((listing) => filter === "all" || listing.status === filter) ?? [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : undefined)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={26} color={GREEN} />
        </Pressable>
        <Text style={styles.headerTitle}>My Listings</Text>
        {/* Balances the arrow so the title stays optically centred. */}
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filters}
      >
        {FILTERS.map((option) => {
          const isActive = filter === option.key;
          return (
            <Pressable
              key={option.key}
              style={[styles.filter, isActive && styles.filterActive]}
              onPress={() => setFilter(option.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.filterLabel, isActive && styles.filterLabelActive]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {listings === null && !error ? (
        <View style={styles.centre}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => load(true)}
              tintColor={GREEN}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {error ? "Something went wrong" : "Nothing here yet"}
              </Text>
              <Text style={styles.emptyBody}>
                {error ??
                  (filter === "all"
                    ? "Add your first product so buyers nearby can find you."
                    : `You have no ${STATUS_LABEL[filter as ListingApprovalStatus].toLowerCase()} listings.`)}
              </Text>
            </View>
          }
          renderItem={({ item }) => <ListingCard listing={item} location={shopLocation} />}
        />
      )}
    </SafeAreaView>
  );
}

function ListingCard({
  listing,
  location,
}: {
  listing: DashboardListing;
  location?: string;
}) {
  return (
    <View style={styles.card}>
      {listing.image ? (
        <Image source={{ uri: listing.image }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImage, styles.cardImageFallback]} />
      )}

      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>
          {listing.name}
        </Text>
        <Text style={styles.cardPrice}>GHS {listing.price.toFixed(2)}</Text>
        {location ? (
          <View style={styles.cardLocation}>
            <MapPin size={16} color={colors.textMuted} />
            <Text style={styles.cardLocationText} numberOfLines={1}>
              {location}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardEnd}>
        {/* TODO: no per-listing actions yet - edit/delete need endpoints. */}
        <Pressable hitSlop={8} accessibilityRole="button" accessibilityLabel={`Options for ${listing.name}`}>
          <MoreVertical size={20} color={colors.text} />
        </Pressable>
        <View style={[styles.status, STATUS_STYLE[listing.status].pill]}>
          <Text style={[styles.statusLabel, STATUS_STYLE[listing.status].label]}>
            {STATUS_LABEL[listing.status]}
          </Text>
        </View>
      </View>
    </View>
  );
}

const AMBER = "#F5A623";
const RED = "#E02B2B";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  centre: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: { fontSize: 22, fontFamily: fonts.headlineBold, color: GREEN },
  headerSpacer: { width: 26 },

  // flexGrow: 0 stops the horizontal ScrollView claiming the leftover
  // vertical space in the column.
  filterBar: { flexGrow: 0 },
  filters: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingVertical: 16 },
  filter: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F1F4F2",
  },
  filterActive: { backgroundColor: GREEN },
  filterLabel: { fontSize: 15, fontFamily: fonts.bodyMedium, color: colors.text },
  filterLabelActive: { color: colors.white, fontFamily: fonts.bodySemiBold },

  list: { paddingHorizontal: 20, paddingBottom: TAB_BAR_CLEARANCE, gap: 14, flexGrow: 1 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: radii.card,
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImage: { width: 76, height: 76, borderRadius: 10 },
  cardImageFallback: { backgroundColor: colors.neutralSoft },
  cardBody: { flex: 1, gap: 2 },
  cardName: { fontSize: 17, fontFamily: fonts.bodyMedium, color: colors.text },
  cardPrice: { fontSize: 17, fontFamily: fonts.bodySemiBold, color: colors.text },
  cardLocation: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  cardLocationText: { fontSize: 14, fontFamily: fonts.bodyRegular, color: colors.textMuted },
  cardEnd: { alignItems: "flex-end", justifyContent: "space-between", alignSelf: "stretch" },

  status: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 },
  statusLabel: { fontSize: 14, fontFamily: fonts.bodySemiBold },

  empty: { alignItems: "center", paddingTop: 60, paddingHorizontal: 20, gap: 6 },
  emptyTitle: { fontSize: 16, fontFamily: fonts.bodySemiBold, color: colors.text },
  emptyBody: {
    fontSize: 14,
    fontFamily: fonts.bodyRegular,
    color: colors.textMuted,
    textAlign: "center",
  },
});

// Pending and Approved are filled with white type; Rejected is a pale tint
// with red type, per the design.
const STATUS_STYLE: Record<
  ListingApprovalStatus,
  { pill: object; label: object }
> = {
  pending: { pill: { backgroundColor: AMBER }, label: { color: colors.white } },
  approved: { pill: { backgroundColor: GREEN }, label: { color: colors.white } },
  rejected: { pill: { backgroundColor: "#FDF7EC" }, label: { color: RED } },
};
