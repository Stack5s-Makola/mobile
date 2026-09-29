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
import {
  ArrowLeft,
  Heart,
  MapPin,
  ShieldCheck,
  Phone,
  BookmarkPlus,
  BookmarkCheck,
} from "lucide-react-native";
import { StatusBadge } from "@components/StatusBadge";
import { Chip } from "@components/Chip";
import { useToast } from "@components/Toast";
import { colors, fonts, radii } from "@constants/theme";
import { Listing } from "../../types/listing";
import { getCategoryLabel } from "@constants/categories";
import { formatDistance } from "@utils/geo";
import * as buyerRepository from "@services/buyerRepository";
import * as savedRepository from "@services/savedRepository";
import { BuyerStackProps } from "@navigation/buyerRoutes";

// A readable day, or "" when the date is missing or unparseable - the caller
// drops empty rows.
function formatListedDate(raw: string | null | undefined): string {
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// NOTE: built against our existing data model/theme, not yet verified
// pixel-for-pixel against Figma's "product details" frame - the Figma MCP
// connector hit its rate limit mid-build. Refine once that resets.

export function ProductDetailsScreen({
  route,
  navigation,
}: BuyerStackProps<"ProductDetails">) {
  const { listingId } = route.params;
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProductSaved, setIsProductSaved] = useState(false);
  const [isSellerSaved, setIsSellerSaved] = useState(false);
  const { showToast } = useToast();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Falls back to what the map saved, so a product opened from an offline
    // shop still has a page.
    buyerRepository
      .getListingById(listingId)
      .then((res) => {
        if (cancelled) return;
        if (res.data) setListing(res.data);
        setIsOffline(res.fromCache);
        setIsLoading(false);
      })
      .catch(() => {
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
      // Straight off the device - no network, so nothing to fail.
      savedRepository
        .isProductSaved(listingId)
        .then((saved) => {
          if (!cancelled) setIsProductSaved(saved);
        })
        .catch(() => {});
      if (listing) {
        savedRepository
          .isShopSaved({ name: listing.sellerName, phone: listing.sellerPhone })
          .then((saved) => {
            if (!cancelled) setIsSellerSaved(saved);
          })
          .catch(() => {});
      }
      return () => {
        cancelled = true;
      };
    }, [listingId, listing]),
  );

  async function handleToggleSaveProduct() {
    if (!listing) return;
    try {
      // The whole listing, not just its id: the Saved page renders from the
      // device, so it needs the product itself stored alongside the save.
      const { saved } = await savedRepository.toggleSavedProduct(listing);
      setIsProductSaved(saved);
      // Naming what was saved - there are two save controls on this page, and
      // "Saved" alone doesn't say which tab to look in.
      showToast(
        saved ? "Product saved - see Saved > Products" : "Product removed from saved",
        "success",
      );
    } catch {
      // This used to fail silently: the heart didn't fill, nothing was stored,
      // and nothing said so.
      showToast("Couldn't save this product. Try again.", "error");
    }
  }

  async function handleToggleSaveSeller() {
    if (!listing) return;
    try {
      // The shop itself, with its products - not a stub built from this one
      // product. A shop is the container; this product is one item in it.
      const shop = await savedRepository.findShopByName(listing.sellerName);
      const { saved } = await savedRepository.toggleSavedShop(
        {
          id: shop?.id,
          name: shop?.shopName ?? listing.sellerName,
          phone: shop?.owner?.phone ?? listing.sellerPhone,
          // So the saved shop still has a face offline.
          image: shop?.owner?.picture ?? shop?.logo ?? listing.ownerPicture ?? undefined,
        },
        shop,
      );
      setIsSellerSaved(saved);
      showToast(
        saved
          ? shop
            ? `${shop.shopName ?? "Shop"} saved - see Saved > Shops`
            : "Shop saved - see Saved > Shops"
          : "Shop removed from saved",
        "success",
      );
    } catch {
      showToast("Couldn't save this shop. Try again.", "error");
    }
  }

  // A tel: URL has to be digits (plus an optional leading +). Passing the
  // number as typed - "024 123 4567", "(024) 123-4567" - is what left the
  // dialer sitting there empty.
  const dialablePhone = (listing?.sellerPhone ?? "")
    .trim()
    .replace(/(?!^\+)[^\d]/g, "");

  async function handleCall() {
    if (!dialablePhone) {
      // Nothing to dial: say so rather than opening an empty dialer.
      showToast("This seller hasn't added a phone number yet.", "error");
      return;
    }
    const url = `tel:${dialablePhone}`;
    try {
      await Linking.openURL(url);
    } catch {
      showToast("Couldn't open the dialer on this device.", "error");
    }
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

  // Everything worth stating that isn't already above. Rows with nothing to
  // show are dropped rather than printed as a dash.
  const detailRows: { label: string; value: string }[] = [
    { label: "Subcategory", value: listing.subcategory ?? "" },
    {
      label: "Availability",
      value:
        listing.stock === null || listing.stock === undefined
          ? ""
          : listing.stock > 0
            ? `${listing.stock} in stock`
            : "Sold out",
    },
    {
      label: "Distance",
      value: listing.distanceKm != null ? formatDistance(listing.distanceKm) : "",
    },
    { label: "Listed", value: formatListedDate(listing.listedAt) },
  ].filter((row) => row.value.length > 0);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: listing.mainImage }}
            style={styles.image}
            resizeMode="cover"
          />
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
          <Pressable
            style={styles.saveButton}
            onPress={handleToggleSaveProduct}
          >
            <Heart
              size={20}
              color={colors.primary}
              fill={isProductSaved ? colors.primary : "transparent"}
            />
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.category}>
            {getCategoryLabel(listing.category)}
          </Text>
          <Text style={styles.name}>{listing.name}</Text>
          {isOffline ? (
            <Text style={styles.offlineNote}>
              Saved copy - you're offline.
            </Text>
          ) : null}
          <Text style={styles.price}>GHS {listing.price.toFixed(2)}</Text>

          <View style={styles.locationRow}>
            <MapPin size={16} color={colors.textMuted} />
            <Text style={styles.locationText}>
              {typeof listing.location === "string"
                ? listing.location
                : "Location unavailable"}
            </Text>
          </View>

          <View style={styles.sellerCard}>
            {listing.ownerPicture ? (
              <Image source={{ uri: listing.ownerPicture }} style={styles.sellerAvatar} />
            ) : (
              // Only when there's no photo to show.
              <View style={styles.sellerAvatar}>
                <Text style={styles.sellerInitial}>
                  {(listing.ownerName || listing.sellerName || "?").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.flex}>
              <Text style={styles.sellerName}>{listing.sellerName}</Text>
              {/* The person behind the shop, when the payload names them. */}
              {listing.ownerName ? (
                <Text style={styles.sellerOwner}>{listing.ownerName}</Text>
              ) : null}
              {dialablePhone ? (
                <Text style={styles.sellerPhone}>{listing.sellerPhone}</Text>
              ) : null}
              {listing.sellerVerified ? (
                <View style={styles.verifiedRow}>
                  <ShieldCheck size={14} color={colors.primary} />
                  <StatusBadge label="Verified Seller" tone="success" />
                </View>
              ) : null}
            </View>
            <Pressable
              style={styles.saveContactButton}
              onPress={handleToggleSaveSeller}
              // Without a shop name there is nothing to save but a blank row.
              disabled={!listing.sellerName.trim()}
              accessibilityRole="button"
              accessibilityLabel={isSellerSaved ? "Remove shop from saved" : "Save shop"}
            >
              {isSellerSaved ? (
                <BookmarkCheck size={20} color={colors.primary} />
              ) : (
                <BookmarkPlus size={20} color={colors.primary} />
              )}
              <Text style={styles.saveShopLabel}>
                {isSellerSaved ? "Saved" : "Save shop"}
              </Text>
            </Pressable>
          </View>

          {listing.description ? (
            <View style={styles.descriptionBlock}>
              <Text style={styles.sectionHeader}>Description</Text>
              <Text style={styles.description}>{listing.description}</Text>
            </View>
          ) : null}

          {/* Only rendered when at least one row has something to say, so a
              leaner payload doesn't leave an empty heading behind. */}
          {detailRows.length > 0 ? (
            <View style={styles.descriptionBlock}>
              <Text style={styles.sectionHeader}>Details</Text>
              <View style={styles.detailList}>
                {detailRows.map((row) => (
                  <View key={row.label} style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{row.label}</Text>
                    <Text style={styles.detailValue} numberOfLines={2}>
                      {row.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {listing.tags && listing.tags.length > 0 ? (
            <View style={styles.descriptionBlock}>
              <Text style={styles.sectionHeader}>Tags</Text>
              <View style={styles.tagRow}>
                {listing.tags.map((tag) => (
                  <Chip key={tag} label={tag} />
                ))}
              </View>
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
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  notFound: { fontFamily: fonts.bodyMedium, color: colors.textMuted },
  content: { paddingBottom: 132 },
  flex: { flex: 1 },
  imageWrapper: { position: "relative" },
  image: { width: "100%", aspectRatio: 1, backgroundColor: colors.neutralSoft },
  backButton: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: radii.button,
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
    borderRadius: radii.button,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: 18, gap: 4 },
  category: {
    fontSize: 13,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
  },
  name: {
    fontSize: 22,
    fontFamily: fonts.headline,
    color: colors.text,
    marginTop: 2,
  },
  price: {
    fontSize: 20,
    fontFamily: fonts.bodySemiBold,
    color: colors.primary,
    marginTop: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  locationText: {
    fontSize: 14,
    fontFamily: fonts.bodyRegular,
    color: colors.textMuted,
  },
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
  sellerInitial: {
    fontSize: 18,
    fontFamily: fonts.headline,
    color: colors.primary,
  },
  sellerOwner: {
    fontSize: 12,
    fontFamily: fonts.bodyRegular,
    color: colors.textMuted,
  },
  sellerPhone: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: colors.primary,
  },

  offlineNote: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: colors.warning,
  },

  detailList: { marginTop: 8, gap: 10 },
  detailRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  detailLabel: {
    width: 104,
    fontSize: 13,
    fontFamily: fonts.bodyRegular,
    color: colors.textMuted,
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
  },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  sellerName: {
    fontSize: 15,
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  saveContactButton: { padding: 6, alignItems: "center", gap: 2 },
  saveShopLabel: { fontSize: 10, fontFamily: fonts.bodyMedium, color: colors.primary },
  descriptionBlock: { marginTop: 20 },
  sectionHeader: {
    fontSize: 15,
    fontFamily: fonts.headline,
    color: colors.text,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    fontFamily: fonts.bodyRegular,
    color: colors.text,
    lineHeight: 20,
  },
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
  contactLabel: {
    fontSize: 16,
    fontFamily: fonts.bodySemiBold,
    color: colors.white,
  },
});
