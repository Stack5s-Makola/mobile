import React, { useCallback, useEffect, useState } from "react";
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
import { Search, Bell, MapPin, ChevronDown } from "lucide-react-native";
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

  const loadListings = useCallback(
    async (isRefresh = false) => {
      isRefresh ? setIsRefreshing(true) : setIsLoading(true);
      try {
        const res = await listingService.getListings(
          activeCategory ? { category: activeCategory } : undefined,
        );
        if (res.success) setListings(res.data);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [activeCategory],
  );

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
        data={listings}
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
          <Text style={styles.empty}>
            {activeCategory
              ? "No listings in this category yet."
              : "No listings yet - check back soon."}
          </Text>
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
                <Pressable style={styles.locationValueRow}>
                  <MapPin size={16} color={colors.primary} />
                  <Text style={styles.locationValue}>Madina</Text>
                  <ChevronDown size={16} color={colors.primary} />
                </Pressable>
              </View>
              <Pressable style={styles.bellButton}>
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
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.white,
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
});
