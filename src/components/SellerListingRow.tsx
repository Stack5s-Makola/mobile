import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { ChevronRight, ImageOff } from "lucide-react-native";
import { SellerListing } from "@types/seller";
import { colors, fonts, radii } from "@constants/theme";
import { LISTING_STATUS_META } from "@constants/sellerStatus";
import { StatusBadge } from "@components/StatusBadge";
import { formatPrice } from "@utils/format";

type Props = {
  listing: SellerListing;
  onPress?: () => void;
};

export function SellerListingRow({ listing, onPress }: Props) {
  const status = LISTING_STATUS_META[listing.status];
  const mainImage = listing.images[0];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
    >
      {mainImage ? (
        <Image source={{ uri: mainImage }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <ImageOff size={20} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {listing.name}
        </Text>
        <Text style={styles.price}>{formatPrice(listing.price)}</Text>
        <View style={styles.metaRow}>
          <StatusBadge label={status.label} tone={status.tone} />
          <Text style={styles.meta}>
            {listing.stock} in stock · {listing.views} views
          </Text>
        </View>
      </View>
      <ChevronRight size={20} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radii.card,
    padding: 10,
  },
  pressed: { opacity: 0.85 },
  image: { width: 64, height: 64, borderRadius: 8, backgroundColor: colors.neutralSoft },
  imagePlaceholder: { alignItems: "center", justifyContent: "center" },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontFamily: fonts.bodySemiBold, color: colors.text },
  price: { fontSize: 14, fontFamily: fonts.bodySemiBold, color: colors.primary },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  meta: { fontSize: 12, fontFamily: fonts.bodyRegular, color: colors.textMuted, flexShrink: 1 },
});
