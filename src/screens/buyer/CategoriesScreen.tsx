import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { ProductCard } from "@components/ProductCard";
import { CATEGORIES } from "@constants/categories";
import { colors, fonts, radii } from "@constants/theme";
import { Listing } from "../../types/listing";
import { listingService } from "@services/listingService";
import { BuyerStackProps } from "@navigation/buyerRoutes";

// NOTE: built against our data model/theme - not yet verified against
// Figma's Categories frame (rate-limited). Refine once that resets.

export function CategoriesScreen({
  route,
  navigation,
}: BuyerStackProps<"Categories">) {
  const initialCategoryId = route.params?.categoryId ?? null;
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    initialCategoryId,
  );
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedCategory) return;
    setIsLoading(true);
    listingService.getListingsByCategory(selectedCategory).then((res) => {
      if (res.success) setListings(res.data);
      setIsLoading(false);
    });
  }, [selectedCategory]);

  if (selectedCategory) {
    const category = CATEGORIES.find((c) => c.id === selectedCategory);
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => setSelectedCategory(null)}
            style={styles.backButton}
          >
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
          <View style={styles.categoryHeaderTitle}>
            {category ? (
              <category.icon size={20} color={colors.primary} />
            ) : null}
            <Text style={styles.headerTitle}>{category?.label}</Text>
          </View>
        </View>
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.loading}
          />
        ) : (
          <FlatList
            data={listings}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.empty}>
                No listings in this category yet.
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
          />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Categories</Text>
      </View>
      <FlatList
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            style={styles.categoryCard}
            onPress={() => setSelectedCategory(item.id)}
          >
            <item.icon size={36} color={colors.primary} strokeWidth={1.8} />
            <Text style={styles.categoryLabel}>{item.label}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  categoryHeaderTitle: { flexDirection: "row", alignItems: "center", gap: 8 },
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.headline,
    color: colors.primary,
  },
  listContent: { padding: 14, paddingBottom: 132 },
  loading: { marginTop: 40 },
  empty: {
    textAlign: "center",
    marginTop: 40,
    fontFamily: fonts.bodyRegular,
    color: colors.textMuted,
  },
  categoryCard: {
    flex: 1,
    margin: 6,
    aspectRatio: 1.2,
    borderRadius: radii.card,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  categoryIcon: { fontSize: 36 },
  categoryLabel: {
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
  },
});
