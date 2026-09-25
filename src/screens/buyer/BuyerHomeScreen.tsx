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
import { ProductCard } from "@components/ProductCard";
import { CategoryChip } from "@components/CategoryChip";
import { CATEGORIES } from "@constants/categories";
import { colors, fonts, radii } from "@constants/theme";
import { Listing } from "../../types/listing";
import { listingService } from "@services/listingService";

export function BuyerHomeScreen({ navigation }: any) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState("Locating...");
  const [loadError, setLoadError] = useState<string | null>(null);
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
    try {
      const res = await listingService.getListings();
      if (res.success) {
        setListings(res.data);
        setLoadError(null);
      } else {
        setLoadError(res.message);
      }
    } catch {
      setLoadError(
        "Could not load products. Check your connection and try again.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const visibleListings = activeCategory
    ? listings.filter((listing) => listing.category === activeCategory)
    : listings;

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
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
          <ProductCard
            listing={item}
            onPress={() =>
              navigation.navigate("ProductDetails", { listingId: item.id })
            }
          />
        )}
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.locationLabel}>Current Location</Text>
                <View style={styles.locationValueRow}>
                  <MapPin size={16} color={colors.primary} />
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
                <Bell size={20} color={colors.primary} />
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
  listContent: { padding: 14, paddingBottom: 132 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  locationLabel: {
    fontSize: 12,
    fontFamily: fonts.bodyRegular,
    color: colors.textMuted,
  },
  locationValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  locationValue: {
    fontSize: 16,
    fontFamily: fonts.headline,
    color: colors.primary,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: radii.button,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.neutralSoft,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radii.button,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 20,
  },
  searchPlaceholder: {
    fontSize: 13,
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
    fontFamily: fonts.headline,
    color: colors.primary,
    marginBottom: 12,
  },
  viewAll: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
  },
  chipRow: { marginBottom: 20 },
  empty: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 14,
    fontFamily: fonts.bodyRegular,
    color: colors.textMuted,
  },
  emptyState: { alignItems: "center", paddingTop: 40 },
  retry: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: colors.primary,
  },
});
