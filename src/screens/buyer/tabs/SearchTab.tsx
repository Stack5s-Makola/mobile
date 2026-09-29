import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search as SearchIcon, X } from "lucide-react-native";
import { ProductCard } from "@components/ProductCard";
import { CategoryChip } from "@components/CategoryChip";
import { CATEGORIES } from "@constants/categories";
import { colors, fonts, radii } from "@constants/theme";
import { Listing } from "../../../types/listing";
import { listingService } from "@services/listingService";
import { BuyerTabProps } from "@navigation/buyerRoutes";

// NOTE: built against our data model/theme - Search wasn't in the Figma
// frames pulled before the rate limit hit. Refine once that resets.
export function SearchTab({ navigation }: BuyerTabProps<"Search">) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const trimmedQuery = query.trim();
    const request = trimmedQuery
      ? listingService.searchListings(trimmedQuery)
      : listingService.getListings();
    request.then((res) => {
      if (res.success) setListings(res.data);
      setIsLoading(false);
    });
  }, [query]);

  const results = useMemo(
    () =>
      listings.filter(
        (listing) => !categoryFilter || listing.category === categoryFilter
      ),
    [listings, categoryFilter]
  );

  const hasActiveFilters = categoryFilter !== null;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for sellers beyond your network"
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery("")}>
              <X size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {showFilters ? (
        <View style={styles.filterPanel}>
          <Text style={styles.filterLabel}>Category</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((cat) => (
              <CategoryChip
                key={cat.id}
                label={cat.label}
                icon={cat.icon}
                active={categoryFilter === cat.id}
                onPress={() =>
                  setCategoryFilter(categoryFilter === cat.id ? null : cat.id)
                }
              />
            ))}
          </View>
          <Text style={styles.filterLabel}>Price range (GHS)</Text>
          <View style={styles.priceRow}>
            <TextInput
              style={styles.priceInput}
              placeholder="Min"
              placeholderTextColor={colors.text}
              keyboardType="numeric"
              value={minPrice}
              onChangeText={setMinPrice}
            />
            <Text style={styles.priceDash}>-</Text>
            <TextInput
              style={styles.priceInput}
              placeholder="Max"
              placeholderTextColor={colors.text}
              keyboardType="numeric"
              value={maxPrice}
              onChangeText={setMaxPrice}
            />
          </View>
          {hasActiveFilters ? (
            <Pressable onPress={clearFilters}>
              <Text style={styles.clearFilters}>Clear filters</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loading}
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {query || hasActiveFilters
                ? "No matches. Try different terms or filters."
                : "Start typing to search."}
            </Text>
          }
          renderItem={({ item }) => (
            // Half-width cell rather than a flexing card: a lone result then
            // stays at column width instead of stretching across the row.
            <View style={styles.cell}>
              <ProductCard
                listing={item}
                onPress={() =>
                  navigation
                    .getParent()
                    ?.navigate("ProductDetails", { listingId: item.id })
                }
              />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchRow: { padding: 14 },
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
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.bodyRegular,
    color: colors.text,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: radii.button,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonActive: { backgroundColor: colors.primary },
  filterPanel: { paddingHorizontal: 16, paddingBottom: 16, gap: 8 },
  filterLabel: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: colors.primary,
    marginTop: 4,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  priceInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radii.button,
    paddingHorizontal: 12,
    height: 42,
    fontFamily: fonts.bodyRegular,
    fontSize: 13,
    color: colors.text,
  },
  priceDash: { color: colors.textMuted },
  clearFilters: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.danger,
    marginTop: 4,
  },
  loading: { marginTop: 40 },
  listContent: { padding: 14, paddingBottom: 132 },
  cell: { width: "50%" },
  empty: {
    textAlign: "center",
    marginTop: 40,
    fontFamily: fonts.bodyRegular,
    color: colors.textMuted,
    paddingHorizontal: 24,
  },
});
