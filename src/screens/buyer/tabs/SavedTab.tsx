import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Phone, Trash2 } from "lucide-react-native";
import { ProductCard } from "@components/ProductCard";
import { colors, fonts, radii } from "@constants/theme";
import { Listing } from "../../../types/listing";
import { savedService, SavedShop } from "@services/savedService";
import { BuyerTabProps } from "@navigation/buyerRoutes";

// NOTE: built against our data model/theme - not yet verified against
// Figma's "Saved" frame (rate-limited before it could be pulled).

type Section = "products" | "shops";

export function SavedTab({ navigation, route }: BuyerTabProps<"Saved">) {
  const [section, setSection] = useState<Section>(
    route.params?.section ?? "products",
  );
  const [products, setProducts] = useState<Listing[]>([]);
  const [sellers, setSellers] = useState<SavedShop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSaved = useCallback(async () => {
    setIsLoading(true);
    const [productsRes, shopsRes] = await Promise.all([
      savedService.getSavedProducts(),
      savedService.getSavedShops(),
    ]);
    if (shopsRes.success) setSellers(shopsRes.data);
    if (productsRes.success) setProducts(productsRes.data);
    setIsLoading(false);
  }, []);

  // Refresh every time the tab regains focus, since saves/un-saves happen
  // on Product Details, a different screen.
  useFocusEffect(
    useCallback(() => {
      loadSaved();
    }, [loadSaved]),
  );

  async function handleRemoveProduct(id: string) {
    await savedService.toggleSavedProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleRemoveSeller(seller: SavedShop) {
    await savedService.toggleSavedShop(seller);
    setSellers((prev) =>
      prev.filter((s) => s.id !== seller.id && s.phone !== seller.phone),
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Saved</Text>

      <View style={styles.segmentRow}>
        <Pressable
          style={[
            styles.segment,
            section === "products" && styles.segmentActive,
          ]}
          onPress={() => setSection("products")}
        >
          <Text
            style={[
              styles.segmentLabel,
              section === "products" && styles.segmentLabelActive,
            ]}
          >
            Products
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segment, section === "shops" && styles.segmentActive]}
          onPress={() => setSection("shops")}
        >
          <Text
            style={[
              styles.segmentLabel,
              section === "shops" && styles.segmentLabelActive,
            ]}
          >
            Shops
          </Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loading}
        />
      ) : section === "products" ? (
        <FlatList
          key="products-list"
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.empty}>No saved products yet.</Text>
          }
          renderItem={({ item }) => (
            <ProductCard
              listing={item}
              onPress={() =>
                navigation
                  .getParent()
                  ?.navigate("ProductDetails", { listingId: item.id })
              }
            />
          )}
        />
      ) : (
        <FlatList
          key="shops-list"
          data={sellers}
          keyExtractor={(item, index) => item.id ?? item.phone ?? String(index)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.empty}>No saved shops yet.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.sellerRow}>
              <View style={styles.flex}>
                <Text style={styles.sellerName}>{item.name}</Text>
                {item.phone ? (
                  <Text style={styles.sellerPhone}>{item.phone}</Text>
                ) : null}
              </View>
              {item.phone ? (
                <Pressable
                  style={styles.iconButton}
                  onPress={() => Linking.openURL(`tel:${item.phone}`)}
                >
                  <Phone size={18} color={colors.primary} />
                </Pressable>
              ) : null}
              <Pressable
                style={styles.iconButton}
                onPress={() => handleRemoveSeller(item)}
              >
                <Trash2 size={18} color={colors.danger} />
              </Pressable>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: {
    fontSize: 24,
    fontFamily: fonts.headline,
    color: colors.text,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  segmentRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 18,
    backgroundColor: colors.neutralSoft,
    borderRadius: radii.button,
    padding: 4,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: radii.button - 2,
  },
  segmentActive: { backgroundColor: colors.primary },
  segmentLabel: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
  },
  segmentLabelActive: { color: colors.white },
  loading: { marginTop: 40 },
  listContent: { padding: 14, paddingBottom: 132 },
  empty: {
    textAlign: "center",
    marginTop: 40,
    fontFamily: fonts.bodyRegular,
    color: colors.textMuted,
  },
  flex: { flex: 1 },
  sellerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.white,
    borderRadius: radii.card,
    padding: 14,
    marginBottom: 10,
  },
  sellerName: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
  },
  sellerPhone: {
    fontSize: 13,
    fontFamily: fonts.bodyRegular,
    color: colors.textMuted,
    marginTop: 2,
  },
  iconButton: { padding: 8 },
});
