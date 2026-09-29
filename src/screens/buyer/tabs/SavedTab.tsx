import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  Pressable,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Phone, Trash2, Store, ChevronRight } from "lucide-react-native";
import { colors, fonts, radii } from "@constants/theme";
import * as savedRepository from "@services/savedRepository";
import { SavedShopEntry } from "@services/savedRepository";
import { BuyerTabProps } from "@navigation/buyerRoutes";

// NOTE: built against our data model/theme - not yet verified against
// Figma's "Saved" frame (rate-limited before it could be pulled).

// Shops only. A shop is the container - saving one keeps everything in it - so
// a separate list of individual products was a second way to say the same thing.
export function SavedTab({ navigation }: BuyerTabProps<"Saved">) {
  const [sellers, setSellers] = useState<SavedShopEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadSaved = useCallback(async () => {
    setIsLoading(true);
    // Straight off the device, so this works with no connection.
    const savedShops = await savedRepository.getSavedShops().catch(() => []);
    setSellers(savedShops);
    setIsLoading(false);
  }, []);

  // Refresh every time the tab regains focus, since saves/un-saves happen
  // on Product Details, a different screen.
  useFocusEffect(
    useCallback(() => {
      loadSaved();
    }, [loadSaved]),
  );

  async function handleRemoveSeller(seller: SavedShopEntry) {
    await savedRepository.toggleSavedShop(seller);
    setSellers((prev) =>
      prev.filter((s) => s.id !== seller.id && s.phone !== seller.phone),
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Text style={styles.title}>Saved Shops</Text>

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loading}
        />
      ) : (
        <FlatList
          key="shops-list"
          data={sellers}
          keyExtractor={(item, index) => item.id ?? item.phone ?? String(index)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.empty}>
              No saved shops yet. Save a shop to keep it and everything in it.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.sellerRow, pressed && styles.pressed]}
              // Only shops saved with their full details can reopen their page.
              disabled={!item.nearby}
              onPress={
                item.nearby
                  ? () =>
                      navigation.getParent()?.navigate("ShopProfile", {
                        shop: item.nearby,
                        products: item.nearby?.products ?? [],
                        openProducts: true,
                      })
                  : undefined
              }
              accessibilityRole={item.nearby ? "button" : undefined}
            >
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.sellerAvatar} />
              ) : (
                <View style={[styles.sellerAvatar, styles.sellerAvatarFallback]}>
                  <Store size={20} color={colors.white} />
                </View>
              )}
              <View style={styles.flex}>
                <Text style={styles.sellerName}>{item.name}</Text>
                {/* A shop is a container - say how much is in it, so it can't
                    be mistaken for a single product. */}
                <Text style={styles.sellerPhone} numberOfLines={1}>
                  {[
                    item.nearby
                      ? `${item.nearby.products.length} ${
                          item.nearby.products.length === 1 ? "product" : "products"
                        }`
                      : null,
                    item.nearby?.locationName ?? item.phone ?? null,
                  ]
                    .filter(Boolean)
                    .join(" \u00b7 ")}
                </Text>
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
              {item.nearby ? (
                <ChevronRight size={18} color={colors.textMuted} />
              ) : null}
            </Pressable>
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
  sellerAvatar: { width: 44, height: 44, borderRadius: 22 },
  sellerAvatarFallback: {
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.85 },
});
