import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { Listing } from "@types/listing";

type Props = {
  listing: Listing;
  onPress?: () => void;
};

export function ProductCard({ listing, onPress }: Props) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      <Image source={{ uri: listing.mainImage }} style={styles.image} resizeMode="cover" />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {listing.name}
        </Text>
        <Text style={styles.price}>GH₵ {listing.price.toFixed(2)}</Text>
        <Text style={styles.seller} numberOfLines={1}>
          {listing.sellerName}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 6,
    borderRadius: 10,
    backgroundColor: "#fff",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
  },
  pressed: { opacity: 0.85 },
  image: { width: "100%", aspectRatio: 1, backgroundColor: "#f2f2f2" },
  info: { padding: 8 },
  name: { fontSize: 14, fontWeight: "600" },
  price: { fontSize: 14, fontWeight: "700", color: "#1a7f4b", marginTop: 2 },
  seller: { fontSize: 12, color: "#777", marginTop: 2 },
});
