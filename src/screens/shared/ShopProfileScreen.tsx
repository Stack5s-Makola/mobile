import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  ArrowLeft,
  MapPin,
  Store,
  User,
  BookmarkPlus,
  BookmarkCheck,
} from "lucide-react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fonts } from "@constants/theme";
import { NearbyProduct, NearbyShop } from "@types/seller";
import { formatDistance } from "@utils/geo";
import * as savedRepository from "@services/savedRepository";

// Same green as the rest of the app.
const GREEN = "#1CA30A";

// A shop as seen by someone else, opened from the map sheet's "View Shop".
//
// Everything comes in through route params rather than a fetch: /shops/nearby
// already returns each shop whole - owner, description, approved listings - so
// a second call would be wasted, and this way the page works offline from the
// map's cache.
//
// Registered on both the buyer and seller stacks, so its navigation isn't tied
// to either param list - hence the loose typing here. `openProducts` is how the
// buyer stack opts into pushing ProductDetails, which sellers have no route to.
type ShopProfileParams = {
  shop: NearbyShop;
  products: NearbyProduct[];
  openProducts?: boolean;
};

export function ShopProfileScreen() {
  const navigation = useNavigation<any>();
  const { shop, products, openProducts } = useRoute().params as ShopProfileParams;

  // What identifies this shop in the saved list.
  const savedShop = {
    id: shop.id,
    name: shop.shopName ?? "Shop",
    phone: shop.owner?.phone ?? undefined,
    image: shop.owner?.picture ?? shop.logo ?? undefined,
  };

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    savedRepository
      .isShopSaved(savedShop)
      .then((saved) => {
        if (!cancelled) setIsSaved(saved);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // Keyed on the shop, not the object literal, which is new every render.
  }, [shop.id]);

  async function handleToggleSave() {
    // The whole shop goes with it, so the Saved page can reopen this page -
    // and its product photos are cached for when there's no connection.
    const { saved } = await savedRepository.toggleSavedShop(savedShop, shop);
    setIsSaved(saved);
  }

  const owner = shop.owner;
  const avatar = owner?.picture ?? shop.logo;
  const isVerified =
    shop.verificationStatus?.toUpperCase() === "VERIFIED" || owner?.emailVerified;

  // The shop's own listings when it has them, and whatever the map matched by
  // name as the fallback for a backend that hasn't shipped them yet.
  const listings = shop.products.length > 0 ? shop.products : products;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={28} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {shop.shopName ?? "Shop"}
        </Text>
        <Pressable
          onPress={handleToggleSave}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={isSaved ? "Remove shop from saved" : "Save shop"}
          accessibilityState={{ selected: isSaved }}
        >
          {isSaved ? (
            <BookmarkCheck size={24} color={GREEN} />
          ) : (
            <BookmarkPlus size={24} color={colors.text} />
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Store size={34} color={colors.white} />
              </View>
            )}
            {isVerified ? (
              <MaterialIcons
                name="verified"
                size={24}
                color="#1D9BF0"
                style={styles.verifiedBadge}
              />
            ) : null}
          </View>

          <Text style={styles.shopName}>{shop.shopName ?? "Shop"}</Text>

          {shop.locationName || shop.distanceKm != null ? (
            <View style={styles.metaRow}>
              <MapPin size={16} color={GREEN} />
              <Text style={styles.metaText} numberOfLines={1}>
                {[
                  shop.locationName,
                  shop.distanceKm != null ? formatDistance(shop.distanceKm) : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </View>
          ) : null}

          {shop.description ? (
            <Text style={styles.description}>{shop.description}</Text>
          ) : null}
        </View>

        {owner?.name ? (
          <View style={styles.ownerCard}>
            <View style={styles.ownerIcon}>
              <User size={18} color={GREEN} />
            </View>
            <View style={styles.ownerBody}>
              <Text style={styles.ownerLabel}>Owner</Text>
              <Text style={styles.ownerName} numberOfLines={1}>
                {owner.name}
              </Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>
          {listings.length} {listings.length === 1 ? "product" : "products"}
        </Text>

        {listings.length === 0 ? (
          <Text style={styles.empty}>This shop has no approved products yet.</Text>
        ) : (
          <View style={styles.productList}>
            {listings.map((product) => (
              <Pressable
                key={product.id}
                style={({ pressed }) => [styles.productRow, pressed && styles.pressed]}
                // Sellers get a read-only list: ProductDetails is a buyer route.
                disabled={!openProducts}
                onPress={
                  openProducts
                    ? () =>
                        navigation.navigate("ProductDetails", { listingId: product.id })
                    : undefined
                }
                accessibilityRole={openProducts ? "button" : undefined}
              >
                {product.image ? (
                  <Image source={{ uri: product.image }} style={styles.productImage} />
                ) : (
                  <View style={[styles.productImage, styles.productImageFallback]} />
                )}
                <View style={styles.productBody}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  {product.category ? (
                    <Text style={styles.productMeta} numberOfLines={1}>
                      {product.category}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.productPrice}>GHS {product.price.toFixed(2)}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontFamily: fonts.headlineBold,
    color: colors.text,
  },

  content: { paddingHorizontal: 16, paddingBottom: 32 },

  hero: { alignItems: "center", gap: 8, paddingTop: 8, paddingBottom: 20 },
  avatarWrap: { width: 96, height: 96 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarFallback: {
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedBadge: { position: "absolute", right: 0, bottom: 2 },
  shopName: { fontSize: 20, fontFamily: fonts.headlineBold, color: colors.text },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 14, fontFamily: fonts.bodyMedium, color: colors.textMuted },
  description: {
    marginTop: 4,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bodyRegular,
    color: colors.textMuted,
  },

  ownerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    // Pinned rather than radii.card: that's 30, which on a short row reads as
    // a pill instead of a card.
    borderRadius: 14,
    backgroundColor: colors.neutralSoft,
  },
  ownerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  ownerBody: { flex: 1, gap: 2 },
  ownerLabel: { fontSize: 12, fontFamily: fonts.bodyRegular, color: colors.textMuted },
  ownerName: { fontSize: 15, fontFamily: fonts.bodySemiBold, color: colors.text },

  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    fontSize: 16,
    fontFamily: fonts.headline,
    color: colors.text,
  },
  empty: { fontSize: 14, fontFamily: fonts.bodyRegular, color: colors.textMuted },

  productList: { gap: 14 },
  productRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  productImage: { width: 56, height: 56, borderRadius: 10 },
  productImageFallback: { backgroundColor: colors.neutralSoft },
  productBody: { flex: 1, gap: 2 },
  productName: { fontSize: 15, fontFamily: fonts.bodySemiBold, color: colors.text },
  productMeta: { fontSize: 13, fontFamily: fonts.bodyRegular, color: colors.textMuted },
  productPrice: { fontSize: 15, fontFamily: fonts.bodyBold, color: GREEN },

  pressed: { opacity: 0.85 },
});
