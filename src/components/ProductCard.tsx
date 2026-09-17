import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { ArrowUpRight, MapPin } from "lucide-react-native";
import { Listing } from "@types/listing";
import { colors, fonts, radii } from "@constants/theme";

type Props = {
  listing: Listing;
  onPress?: () => void;
};

export function ProductCard({ listing, onPress }: Props) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.imageTile}>
        <Image source={{ uri: listing.mainImage }} style={styles.image} resizeMode="cover" />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {listing.name}
        </Text>
        <Text style={styles.price}>GHS {listing.price.toFixed(2)}</Text>
        <View style={styles.locationRow}>
          <MapPin size={14} color={colors.textMuted} />
          <Text style={styles.location} numberOfLines={1}>
            {listing.location}
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
    borderRadius: 20,
    backgroundColor: colors.neutralSoft,
    padding: 8,
    position: "relative",
  },
  pressed: { opacity: 0.9 },
  imageTile: {
    backgroundColor: colors.white,
    borderRadius: 16,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: { width: "88%", height: "88%", borderRadius: 12 },
  info: { marginTop: 8, paddingHorizontal: 2 },
  name: { fontSize: 14, fontFamily: fonts.headline, color: colors.primary },
  price: { fontSize: 14, fontFamily: fonts.bodyRegular, fontWeight: "700", color: colors.primary, marginTop: 2 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  location: { fontSize: 12, fontFamily: fonts.bodyRegular, color: colors.textMuted },
  viewButton: {
    position: "absolute",
    right: 14,
    bottom: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
