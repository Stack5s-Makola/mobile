import React, { useCallback, useEffect, useState } from "react";
import * as Location from "expo-location";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Bell, MapPin } from "lucide-react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ProductCard } from "@components/ProductCard";
import { CategoryChip } from "@components/CategoryChip";
import { CATEGORIES } from "@constants/categories";
import { colors, fonts } from "@constants/theme";
import { Listing } from "../../types/listing";
import * as buyerRepository from "@services/buyerRepository";
import { SyncBanner, SyncStatus } from "@components/SyncBanner";
import { useConnectivityChange } from "@hooks/useIsOffline";

export function BuyerHomeScreen({ navigation }: any) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState("Locating...");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCurrentLocation = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) {
          if (isMounted) setCurrentLocation("Location unavailable");
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const places = await Location.reverseGeocodeAsync({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        const place = places[0];
        const readableLocation =
          place?.district ??
          place?.city ??
          place?.subregion ??
          place?.region ??
          place?.country ??
          "Location unavailable";

        if (isMounted) {
          setCurrentLocation(readableLocation);
          setCoordinates({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        }
      } catch {
        if (isMounted) setCurrentLocation("Location unavailable");
      }
    };

    loadCurrentLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadListings = useCallback(async (isRefresh = false) => {
    isRefresh ? setIsRefreshing(true) : setIsLoading(true);
    // Before any await: reading the local database can be slow, and the banner
    // must not wait on it.
    setSyncStatus("syncing");

    // Paint the stored feed first so products are on screen immediately; the
    // network call then quietly replaces them.
    if (!isRefresh) {
      const cached = await buyerRepository.getCachedListings().catch(() => null);
      if (cached && cached.length > 0) {
        setListings(cached);
        // Something is on screen now, so the spinner has nothing left to say.
        setIsLoading(false);
      }
    }

    try {
      // No radiusKm on purpose: the point is for distances and for matching
      // each shop's owner, not for narrowing the feed.
      const res = await buyerRepository.getListings(
        coordinates
          ? { latitude: coordinates.latitude, longitude: coordinates.longitude }
          : {}
      );
      if (res.data) {
        setListings(res.data);
        // The banner says "You're offline"; no need to repeat it in the error
        // line when the feed itself rendered fine from cache.
        setLoadError(null);
        setSyncStatus(res.fromCache ? "offline" : "done");
      } else {
        setLoadError(res.message);
        // The error is already on screen; don't also claim it synced.
        setSyncStatus(res.fromCache ? "offline" : "idle");
      }
    } catch {
      setLoadError(
        "Could not load products. Check your connection and try again.",
      );
      setSyncStatus("idle");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
    // Re-runs once the device reports a position - `coordinates` stays null
    // when location is denied, so that case fetches only once.
  }, [coordinates]);

  // Announce the drop straight away, and on reconnect say so and refetch -
  // whatever failed while offline is worth retrying immediately.
  useConnectivityChange({
    onOffline: () => setSyncStatus("offline"),
    onOnline: () => {
      setSyncStatus("online");
      loadListings();
    },
  });

  const visibleListings = activeCategory
    ? listings.filter((listing) => listing.category === activeCategory)
    : listings;

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  if (isLoading) {
    return (
      // The banner belongs here too - this branch renders on a cold start,
      // which is exactly when the sync/offline state matters most.
      <SafeAreaView style={styles.loading} edges={["top"]}>
        <SyncBanner status={syncStatus} syncingMessage="Updating products…" />
        <ActivityIndicator size="large" color={GREEN} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <SyncBanner status={syncStatus} syncingMessage="Updating products…" />
      <FlatList
        data={visibleListings}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadListings(true)}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.empty}>
              {loadError ??
                (activeCategory
                  ? "No listings in this category yet."
                  : "No listings yet - check back soon.")}
            </Text>
            {loadError ? (
              <Pressable onPress={() => loadListings(true)}>
                <Text style={styles.retry}>Try again</Text>
              </Pressable>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          // Half-width cell rather than a flexing card: a lone product on the
          // last row then stays at column width and sits left, leaving the
          // gap that says another one would go there.
          <View style={styles.cell}>
            <ProductCard
              listing={item}
              onPress={() =>
                navigation.navigate("ProductDetails", { listingId: item.id })
              }
            />
          </View>
        )}
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.locationLabel}>Current Location</Text>
                <View style={styles.locationValueRow}>
                  <MapPin size={16} color={GREEN} />
                  <Text style={styles.locationValue}>{currentLocation}</Text>
                </View>
              </View>
              <Pressable
                accessibilityLabel="Open notifications"
                style={styles.bellButton}
                onPress={() =>
                  navigation.getParent()?.navigate("Notifications")
                }
              >
                <Bell size={20} color={colors.text} />
              </Pressable>
            </View>

            <Pressable
              style={styles.searchBar}
              onPress={() => navigation.navigate("Search")}
            >
              <Search size={18} color={colors.textMuted} />
              <Text style={styles.searchPlaceholder}>
                Search for sellers beyond your network
              </Text>
            </Pressable>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Categories</Text>
              <Text
                style={styles.viewAll}
                onPress={() => navigation.getParent()?.navigate("Categories")}
              >
                View All
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipRow}
            >
              {CATEGORIES.map((cat) => (
                <CategoryChip
                  key={cat.id}
                  label={cat.label}
                  icon={cat.icon}
                  active={activeCategory === cat.id}
                  onPress={() =>
                    setActiveCategory(activeCategory === cat.id ? null : cat.id)
                  }
                />
              ))}
            </ScrollView>

            <Text style={styles.sectionHeader}>Recommended For You</Text>
          </View>
        }
      />

      <Pressable
        style={({ pressed }) => [styles.mapButton, pressed && styles.mapButtonPressed]}
        onPress={() => navigation.navigate("BuyerMap")}
        accessibilityRole="button"
        accessibilityLabel="Open map"
      >
        <MaterialCommunityIcons name="map-marker-radius" size={26} color={colors.white} />
      </Pressable>
    </SafeAreaView>
  );
}

// Matching the seller screens: white page, black headings, green accents.
const GREEN = "#1CA30A";
// Floating map button, matching the seller dashboard.
const ORANGE = "#F5821F";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  listContent: { padding: 14, paddingBottom: 132 },
  // Clears the floating tab bar, which sits about 90px up from the bottom.
  mapButton: {
    position: "absolute",
    right: 20,
    bottom: 108,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  mapButtonPressed: { opacity: 0.8 },
  cell: { width: "50%" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  locationLabel: {
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
  },
  locationValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  locationValue: {
    fontSize: 20,
    fontFamily: fonts.headlineBold,
    color: colors.text,
  },
  bellButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F1F4F2",
    borderWidth: 0,
    borderRadius: 26,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 20,
  },
  searchPlaceholder: {
    fontSize: 14,
    fontFamily: fonts.bodyRegular,
    color: colors.textMuted,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 18,
    fontFamily: fonts.headlineBold,
    color: colors.text,
    marginBottom: 12,
  },
  viewAll: { fontSize: 14, fontFamily: fonts.bodySemiBold, color: GREEN },
  chipRow: { marginBottom: 20 },
  empty: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
    fontFamily: fonts.bodyRegular,
    color: colors.textMuted,
  },
  emptyState: { alignItems: "center", paddingTop: 40 },
  retry: { marginTop: 12, fontSize: 14, fontFamily: fonts.bodySemiBold, color: GREEN },
});
