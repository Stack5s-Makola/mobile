import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { ArrowUpRight, MapPin } from "lucide-react-native";
import { Listing } from "../types/listing";
import { colors, fonts } from "@constants/theme";
import { formatDistance } from "@utils/geo";

type Props = {
  listing: Listing;
  onPress?: () => void;
};

export function ProductCard({ listing, onPress }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.imageTile}>
        <Image
          source={{ uri: listing.mainImage }}
          style={styles.image}
          resizeMode="cover"
        />
      </View>
      {/* Who is selling it, above the product's own details. */}
      <View style={styles.ownerRow}>
        {listing.ownerPicture ? (
          <Image source={{ uri: listing.ownerPicture }} style={styles.ownerAvatar} />
        ) : (
          <View style={[styles.ownerAvatar, styles.ownerAvatarFallback]}>
            <Text style={styles.ownerInitial}>
              {(listing.ownerName || listing.sellerName || "?").charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.ownerName} numberOfLines={1}>
          {/* The shop's name when the payload didn't nest an owner - better
              than an empty line where a name should be. */}
          {listing.ownerName || listing.sellerName || "Unknown seller"}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {listing.name}
        </Text>
        <Text style={styles.price}>GHS {listing.price.toFixed(2)}</Text>
        <View style={styles.locationRow}>
          <MapPin size={14} color={colors.textMuted} />
          <Text style={styles.location} numberOfLines={1}>
            {typeof listing.location === "string"
              ? listing.location
              : "Location unavailable"}
          </Text>
          {/* Only present when the request carried a point to measure from. */}
          {listing.distanceKm != null ? (
            <Text style={styles.distance}>{formatDistance(listing.distanceKm)}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.viewButton}>
        <ArrowUpRight size={20} color={colors.white} />
      </View>
    </Pressable>
  );
}

// Matching the seller screens.
const GREEN = "#1CA30A";
// Card fill - pinned rather than colors.primarySoft, which the theme change
// in the merge has already moved once.
const LIGHT_GREEN = "#E7F6E4";

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    // Pinned rather than radii.card (30): that reads as a pill on a card this
    // size, and the theme value is shared with ~19 other places.
    borderRadius: 14,
    backgroundColor: LIGHT_GREEN,
    padding: 10,
    position: "relative",
    // Taller than before to fit the owner row without squeezing the image.
    minHeight: 262,
  },
  pressed: { opacity: 0.9 },
  imageTile: {
    backgroundColor: colors.white,
    // A touch tighter than the card's, so the two curves nest.
    borderRadius: 10,
    aspectRatio: 1.08,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },

  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  ownerAvatar: { width: 22, height: 22, borderRadius: 11 },
  ownerAvatarFallback: {
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  ownerInitial: { fontSize: 11, fontFamily: fonts.bodyBold, color: colors.white },
  ownerName: {
    flex: 1,
    fontSize: 11,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
  },

  info: { marginTop: 6, paddingHorizontal: 2, paddingRight: 38 },
  name: { fontSize: 13, fontFamily: fonts.bodySemiBold, color: colors.text },
  price: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: colors.primary,
    marginTop: 3,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  distance: { fontSize: 11, fontFamily: fonts.bodySemiBold, color: GREEN },
  location: {
    fontSize: 11,
    fontFamily: fonts.bodyRegular,
    color: colors.textMuted,
  },
  viewButton: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
