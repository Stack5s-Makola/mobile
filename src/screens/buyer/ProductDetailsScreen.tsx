import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ArrowLeft, Heart, MapPin, ShieldCheck, Phone, BookmarkPlus, BookmarkCheck } from "lucide-react-native";
import { StatusBadge } from "@components/StatusBadge";
import { colors, fonts, radii } from "@constants/theme";
import { Listing } from "@types/listing";
import { getCategoryLabel } from "@constants/categories";
import { listingService } from "@services/listingService";
import { savedService } from "@services/savedService";
import { BuyerStackProps } from "@navigation/buyerRoutes";

// NOTE: built against our existing data model/theme, not yet verified
// pixel-for-pixel against Figma's "product details" frame - the Figma MCP
// connector hit its rate limit mid-build. Refine once that resets.

export function ProductDetailsScreen({ route, navigation }: BuyerStackProps<"ProductDetails">) {
  const { listingId } = route.params;
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProductSaved, setIsProductSaved] = useState(false);
  const [isSellerSaved, setIsSellerSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listingService.getListingById(listingId).then((res) => {
      if (!cancelled && res.success) setListing(res.data);
      if (!cancelled) setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  // Re-check saved state whenever this screen regains focus, since it can
  // change from other screens (e.g. un-saving from the Saved tab).
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      savedService.getSavedProductIds().then((res) => {
        if (!cancelled && res.success) setIsProductSaved(res.data.includes(listingId));
      });
      if (listing) {
        savedService.getSavedSellers().then((res) => {
          if (!cancelled && res.success) {
            setIsSellerSaved(res.data.some((s) => s.phone === listing.sellerPhone));
          }
        });
      }
      return () => {
        cancelled = true;
      };
    }, [listingId, listing])
  );

  async function handleToggleSaveProduct() {
    const res = await savedService.toggleSavedProduct(listingId);
    if (res.success) setIsProductSaved(res.data.saved);
  }

  async function handleToggleSaveSeller() {
    if (!listing) return;
    const res = await savedService.toggleSavedSeller({
      name: listing.sellerName,
      phone: listing.sellerPhone,
    });
    if (res.success) setIsSellerSaved(res.data.saved);
  }

  function handleCall() {
    if (listing) Linking.openURL(`tel:${listing.sellerPhone}`);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView style={styles.loading}>
        <Text style={styles.notFound}>Listing not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageWrapper}>
          <Image source={{ uri: listing.mainImage }} style={styles.image} resizeMode="cover" />
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
          <Pressable style={styles.saveButton} onPress={handleToggleSaveProduct}>
            <Heart size={20} color={colors.primary} fill={isProductSaved ? colors.primary : "transparent"} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.category}>{getCategoryLabel(listing.category)}</Text>
          <Text style={styles.name}>{listing.name}</Text>
          <Text style={styles.price}>GHS {listing.price.toFixed(2)}</Text>

          <View style={styles.locationRow}>
            <MapPin size={16} color={colors.textMuted} />
            <Text style={styles.locationText}>{listing.location}</Text>
          </View>

          <View style={styles.sellerCard}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerInitial}>{listing.sellerName.charAt(0)}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.sellerName}>{listing.sellerName}</Text>
              {listing.sellerVerified ? (
                <View style={styles.verifiedRow}>
                  <ShieldCheck size={14} color={colors.primary} />
                  <StatusBadge label="Verified Seller" tone="success" />
                </View>
              ) : null}
            </View>
            <Pressable style={styles.saveContactButton} onPress={handleToggleSaveSeller}>
              {isSellerSaved ? (
                <BookmarkCheck size={20} color={colors.primary} />
              ) : (
                <BookmarkPlus size={20} color={colors.primary} />
              )}
            </Pressable>
          </View>

          {listing.description ? (
            <View style={styles.descriptionBlock}>
              <Text style={styles.sectionHeader}>Description</Text>
              <Text style={styles.description}>{listing.description}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.contactButton} onPress={handleCall}>
          <Phone size={18} color={colors.white} />
          <Text style={styles.contactLabel}>Contact Seller</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  notFound: { fontFamily: fonts.bodyMedium, color: colors.textMuted },
  content: { paddingBottom: 100 },
  flex: { flex: 1 },
  imageWrapper: { position: "relative" },
  image: { width: "100%", aspectRatio: 1, backgroundColor: colors.neutralSoft },
  backButton: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: 20, gap: 4 },
  category: { fontSize: 13, fontFamily: fonts.bodyMedium, color: colors.textMuted },
  name: { fontSize: 22, fontFamily: fonts.headline, color: colors.primary, marginTop: 2 },
  price: { fontSize: 20, fontFamily: fonts.bodySemiBold, color: colors.primary, marginTop: 4 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  locationText: { fontSize: 14, fontFamily: fonts.bodyRegular, color: colors.textMuted },
  sellerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radii.card,
    padding: 14,
    marginTop: 20,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  sellerInitial: { fontSize: 18, fontFamily: fonts.headline, color: colors.primary },
  sellerName: { fontSize: 15, fontFamily: fonts.bodySemiBold, color: colors.text },
  verifiedRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  saveContactButton: { padding: 6 },
  descriptionBlock: { marginTop: 20 },
  sectionHeader: { fontSize: 15, fontFamily: fonts.headline, color: colors.primary, marginBottom: 6 },
  description: { fontSize: 14, fontFamily: fonts.bodyRegular, color: colors.text, lineHeight: 20 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: colors.background,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 54,
    borderRadius: radii.button,
    backgroundColor: colors.primary,
  },
  contactLabel: { fontSize: 16, fontFamily: fonts.bodySemiBold, color: colors.white },
});
