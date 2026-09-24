import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ArrowLeft, MapPin } from "lucide-react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, fonts, radii } from "@constants/theme";
import { useAuth } from "@context/AuthContext";
import { SellerStackProps } from "@navigation/sellerRoutes";
import * as productService from "@services/api/productService";
import { ListingApprovalStatus, ProductDetails } from "@types/seller";

// Shows one of the seller's products the way a buyer sees it, via
// GET /api/buyer/products/:id. Laid out like ProductPreviewScreen so the
// listing a seller submitted and the listing they later open look the same.
const GREEN = "#1CA30A";
const AMBER = "#F5A623";
const RED = "#E02B2B";
const VERIFIED = "#F5821F";

const STATUS_LABEL: Record<ListingApprovalStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const STATUS_STYLE: Record<ListingApprovalStatus, { pill: object; label: object }> = {
  pending: { pill: { backgroundColor: AMBER }, label: { color: colors.white } },
  approved: { pill: { backgroundColor: GREEN }, label: { color: colors.white } },
  rejected: { pill: { backgroundColor: "#FDF7EC" }, label: { color: RED } },
};

export function SellerProductDetailsScreen({
  navigation,
  route,
}: SellerStackProps<"ProductDetails">) {
  const { session } = useAuth();
  const { productId } = route.params;
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await productService.getProductDetails(productId);
      if (res.success) {
        setProduct(res.data);
        setError(null);
      } else {
        setError(res.message);
      }
    } catch {
      setError("Couldn't load this product. Check your connection and try again.");
    }
  }, [productId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const shopName = product?.shop?.shopName ?? product?.seller?.shopName;
  // The payload carries coordinates, not a place name - the seller's own
  // typed location is the closest thing we have to show.
  const shopLocation = session?.user.location;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={26} color={GREEN} />
        </Pressable>
        <Text style={styles.headerTitle}>Product Details</Text>
        {/* Balances the arrow so the title stays optically centred. */}
        <View style={styles.headerSpacer} />
      </View>

      {!product && !error ? (
        <View style={styles.centre}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      ) : error ? (
        <View style={styles.centre}>
          <Text style={styles.error}>{error}</Text>
        </View>
      ) : product ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.imageCard}>
            {product.image ? (
              <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
            ) : null}
          </View>

          <View style={styles.headline}>
            <Text style={styles.name} numberOfLines={2}>
              {product.name}
            </Text>
            <Text style={styles.price}>GHS {product.price.toFixed(2)}</Text>
          </View>

          <View style={[styles.status, STATUS_STYLE[product.status].pill]}>
            <Text style={[styles.statusLabel, STATUS_STYLE[product.status].label]}>
              {STATUS_LABEL[product.status]}
            </Text>
          </View>

          {product.description ? (
            <View style={styles.block}>
              <Text style={styles.blockLabel}>Description</Text>
              <Text style={styles.blockBody}>{product.description}</Text>
            </View>
          ) : null}

          {product.category ? (
            <View style={styles.block}>
              <Text style={styles.blockLabel}>Categories</Text>
              <Text style={styles.blockBody}>{product.category}</Text>
            </View>
          ) : null}

          {product.tags.length > 0 ? (
            <View style={styles.block}>
              <Text style={styles.blockLabel}>Tags</Text>
              <View style={styles.tags}>
                {product.tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagLabel}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.seller}>
            <View style={styles.avatarBox}>
              {product.shop?.logo ? (
                <Image source={{ uri: product.shop.logo }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]} />
              )}
              {product.shop?.verificationStatus === "verified" ? (
                <MaterialIcons
                  name="verified"
                  size={18}
                  color={VERIFIED}
                  style={styles.verifiedBadge}
                  accessibilityLabel="Verified"
                />
              ) : null}
            </View>
            <View style={styles.sellerText}>
              <Text style={styles.shopName} numberOfLines={1}>
                {shopName}
              </Text>
              {shopLocation ? (
                <View style={styles.locationRow}>
                  <MapPin size={18} color={colors.textMuted} />
                  <Text style={styles.location} numberOfLines={1}>
                    {shopLocation}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  centre: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  error: { fontSize: 15, fontFamily: fonts.bodyRegular, color: colors.danger, textAlign: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: { fontSize: 22, fontFamily: fonts.headlineBold, color: colors.text },
  headerSpacer: { width: 26 },
  content: { padding: 20, paddingBottom: 32, gap: 18 },

  imageCard: {
    height: 300,
    borderRadius: 18,
    backgroundColor: "#EAF1EE",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },

  headline: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  name: { flex: 1, fontSize: 22, fontFamily: fonts.headline, color: colors.text },
  price: { fontSize: 26, fontFamily: fonts.headlineBold, color: colors.text },

  status: { alignSelf: "flex-start", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 },
  statusLabel: { fontSize: 14, fontFamily: fonts.bodySemiBold },

  block: { gap: 6 },
  blockLabel: { fontSize: 15, fontFamily: fonts.bodySemiBold, color: GREEN },
  blockBody: { fontSize: 15, fontFamily: fonts.bodyRegular, color: colors.textMuted, lineHeight: 22 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 2 },
  tag: { backgroundColor: GREEN, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  tagLabel: { fontSize: 13, fontFamily: fonts.bodySemiBold, color: colors.white },

  seller: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarBox: { width: 54, height: 54 },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  avatarFallback: { backgroundColor: colors.primarySoft },
  verifiedBadge: { position: "absolute", right: -2, bottom: -2 },
  sellerText: { flex: 1, gap: 2 },
  shopName: { fontSize: 17, fontFamily: fonts.bodySemiBold, color: GREEN },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  location: { fontSize: 16, fontFamily: fonts.bodyRegular, color: colors.textMuted },
});
