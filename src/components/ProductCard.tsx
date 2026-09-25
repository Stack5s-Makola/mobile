import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { ArrowUpRight, MapPin } from "lucide-react-native";
import { Listing } from "../types/listing";
import { colors, fonts, radii } from "@constants/theme";

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
        </View>
      </View>
      <View style={styles.viewButton}>
        <ArrowUpRight size={20} color={colors.white} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    borderRadius: radii.card,
    backgroundColor: colors.white,
    padding: 10,
    position: "relative",
    minHeight: 232,
  },
  pressed: { opacity: 0.9 },
  imageTile: {
    backgroundColor: colors.white,
    borderRadius: radii.card,
    aspectRatio: 1.08,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  info: { marginTop: 10, paddingHorizontal: 2, paddingRight: 38 },
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
