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
import { SyncBanner, SyncStatus } from "@components/SyncBanner";
import { colors, fonts, radii } from "@constants/theme";
import { useAuth } from "@context/AuthContext";
import { useConnectivityChange } from "@hooks/useIsOffline";
import { ListingsStackProps } from "@navigation/sellerRoutes";
import * as sellerRepository from "@services/sellerRepository";
import { DashboardListing, ListingApprovalStatus } from "@types/seller";

// Reads through sellerRepository: GET /api/seller/shop (which despite its name
// returns this seller's products) when online, the SQLite mirror when not.
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
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");

  const userId = session?.user.id;

  const load = useCallback(
    async (isRefresh = false) => {
      if (!userId) {
        setError("We couldn't tell which account you're signed in to.");
        return;
      }
      if (isRefresh) setIsRefreshing(true);
      // Before any await: reading the local database can be slow, and the
      // banner must not wait on it.
      setSyncStatus("syncing");

      // Paint the stored copy first so the list is on screen immediately;
      // the network call then quietly replaces it.
      if (!isRefresh) {
        const cached = await sellerRepository.getCachedListings(userId).catch(() => null);
        if (cached && cached.length > 0) setListings(cached);
      }

      try {
        const res = await sellerRepository.getMyListings(userId);
        if (res.data) {
          setListings(res.data);
          setError(null);
          setSyncStatus(res.fromCache ? "offline" : "done");
        } else {
          setError(res.message);
          // The error is already on screen; don't also claim it synced.
          setSyncStatus(res.fromCache ? "offline" : "idle");
        }
      } catch {
        setError("Couldn't load your listings. Pull down to try again.");
        setSyncStatus("idle");
      } finally {
        setIsRefreshing(false);
      }
    },
    [userId]
  );

  // Announce the drop straight away, and on reconnect say so and refetch -
  // whatever failed while offline is worth retrying immediately.
  useConnectivityChange({
    onOffline: () => setSyncStatus("offline"),
    onOnline: () => {
      setSyncStatus("online");
      load();
    },
  });

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
      <SyncBanner status={syncStatus} syncingMessage="Updating your listings…" />
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

      {error ? <Text style={styles.notice}>{error}</Text> : null}

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
              <Text style={styles.emptyTitle}>Nothing here yet</Text>
              <Text style={styles.emptyBody}>
                {filter === "all"
                  ? "Add your first product so buyers nearby can find you."
                  : `You have no ${STATUS_LABEL[filter as ListingApprovalStatus].toLowerCase()} listings.`}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ListingCard
              listing={item}
              location={shopLocation}
              onPress={() => navigation.navigate("ProductDetails", { productId: item.id })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function ListingCard({
  listing,
  location,
  onPress,
}: {
  listing: DashboardListing;
  location?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
    >
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
    </Pressable>
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

  notice: {
    marginHorizontal: 20,
    marginBottom: 12,
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
  },
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
  pressed: { opacity: 0.85 },
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
