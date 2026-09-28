import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, MapPin, Store } from "lucide-react-native";
import Mapbox, { Camera, MapView, MarkerView, UserLocation } from "@rnmapbox/maps";
import * as Location from "expo-location";
import { colors, fonts } from "@constants/theme";
import { BuyerStackProps } from "@navigation/buyerRoutes";
import * as nearbyService from "@services/api/nearbyService";
import { NearbyProduct, NearbyShop } from "@types/seller";
import { formatDistance } from "@utils/geo";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? null);

const GREEN = "#1CA30A";
const ORANGE = "#F5821F";

// Central Accra, used until the device reports a position.
const FALLBACK: [number, number] = [-0.187, 5.6037]; // Mapbox wants [lng, lat]

// How far out to look for shops and their products.
const SEARCH_RADIUS_KM = 10;

// The sheet's two heights. It opens when a shop is tapped.
const SHEET_COLLAPSED = 75;
const SHEET_EXPANDED = SHEET_COLLAPSED * 4;

// Shops and products around the buyer, laid out like the seller's map.
export function BuyerMapScreen({ navigation }: BuyerStackProps<"BuyerMap">) {
  const insets = useSafeAreaInsets();
  const [centre, setCentre] = useState<[number, number] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [shops, setShops] = useState<NearbyShop[]>([]);
  const [products, setProducts] = useState<NearbyProduct[]>([]);
  const [selected, setSelected] = useState<NearbyShop | null>(null);

  const sheetHeight = useRef(new Animated.Value(SHEET_COLLAPSED)).current;

  useEffect(() => {
    Animated.timing(sheetHeight, {
      toValue: selected ? SHEET_EXPANDED : SHEET_COLLAPSED,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      // Height can't be driven natively.
      useNativeDriver: false,
    }).start();
  }, [selected, sheetHeight]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { granted } = await Location.requestForegroundPermissionsAsync();
        if (!granted) throw new Error("denied");
        const position = await Location.getCurrentPositionAsync({});
        if (!cancelled) {
          setCentre([position.coords.longitude, position.coords.latitude]);
        }
      } catch {
        if (!cancelled) {
          setNotice("Location is off, so the map is centred on Accra.");
          setCentre(FALLBACK);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!centre) return;
    let cancelled = false;
    const [longitude, latitude] = centre;

    nearbyService
      .getNearbyShops(longitude, latitude, SEARCH_RADIUS_KM)
      .then((res) => {
        if (!cancelled && res.success) setShops(res.data);
      })
      .catch(() => {});

    nearbyService
      .getNearbyProducts(longitude, latitude, SEARCH_RADIUS_KM)
      .then((res) => {
        if (!cancelled && res.success) setProducts(res.data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [centre]);

  // Markers are drawn in array order, so the last one wins where they overlap.
  // Shops with a logo go last: test shops share coordinates, so a stack of
  // plain icons would otherwise bury the one recognisable shop. The selected
  // shop goes last of all so it is never hidden.
  const orderedShops = [...shops].sort((a, b) => {
    if (a.id === selected?.id) return 1;
    if (b.id === selected?.id) return -1;
    return Number(Boolean(a.logo)) - Number(Boolean(b.logo));
  });

  // Only the selected shop's products, when one is chosen.
  const visibleProducts = selected
    ? products.filter((product) => product.shopName === selected.shopName)
    : products;

  return (
    <View style={styles.container}>
      {centre ? (
        <MapView
          style={StyleSheet.absoluteFill}
          styleURL={Mapbox.StyleURL.Light}
          scaleBarEnabled={false}
        >
          <Camera
            centerCoordinate={centre}
            zoomLevel={13}
            pitch={55}
            animationDuration={0}
          />
          {/* The buyer's own position, so they can see where they are
              relative to the shops. */}
          <UserLocation visible />

          {orderedShops.map((shop) => (
            <MarkerView key={shop.id} coordinate={[shop.longitude, shop.latitude]}>
              <Pressable
                style={({ pressed }) => [
                  styles.marker,
                  selected?.id === shop.id && styles.markerSelected,
                  pressed && styles.pressed,
                ]}
                onPress={() =>
                  setSelected((current) => (current?.id === shop.id ? null : shop))
                }
                accessibilityRole="button"
                accessibilityLabel={shop.shopName ?? "Shop"}
              >
                {shop.logo ? (
                  <Image
                    source={{ uri: shop.logo }}
                    style={styles.markerImage}
                    resizeMode="cover"
                  />
                ) : (
                  // No logo uploaded - a shop icon reads better than initials.
                  <Store size={20} color={colors.white} />
                )}
              </Pressable>
            </MarkerView>
          ))}
        </MapView>
      ) : (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      )}

      <SafeAreaView style={styles.topOverlay} edges={["top"]} pointerEvents="box-none">
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Map</Text>
          {/* Matches the arrow's width so the title stays optically centred. */}
          <View style={styles.topBarSpacer} />
        </View>
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      </SafeAreaView>

      <Animated.View
        style={[styles.sheet, { height: Animated.add(sheetHeight, insets.bottom) }]}
      >
        <Pressable
          onPress={() => setSelected(null)}
          disabled={!selected}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Collapse details"
        >
          <View style={styles.sheetHandle} />
        </Pressable>

        <View style={styles.sheetRow}>
          <MapPin size={20} color={ORANGE} />
          <Text style={styles.sheetTitle} numberOfLines={1}>
            {selected
              ? (selected.shopName ?? "Shop")
              : `${shops.length} shop${shops.length === 1 ? "" : "s"} within ${SEARCH_RADIUS_KM}km`}
          </Text>
          {selected?.distanceKm != null ? (
            <Text style={styles.sheetDistance}>{formatDistance(selected.distanceKm)}</Text>
          ) : null}
        </View>

        {selected?.locationName ? (
          <Text style={styles.sheetSubtitle} numberOfLines={1}>
            {selected.locationName}
          </Text>
        ) : null}

        <ScrollView
          style={styles.sheetList}
          contentContainerStyle={styles.sheetListContent}
          showsVerticalScrollIndicator={false}
        >
          {visibleProducts.length === 0 ? (
            <Text style={styles.sheetEmpty}>
              {selected ? "No products from this shop yet." : "No products nearby yet."}
            </Text>
          ) : (
            visibleProducts.map((product) => (
              <Pressable
                key={product.id}
                style={({ pressed }) => [styles.productRow, pressed && styles.pressed]}
                onPress={() =>
                  navigation.navigate("ProductDetails", { listingId: product.id })
                }
                accessibilityRole="button"
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
                  <Text style={styles.productMeta} numberOfLines={1}>
                    GHS {product.price.toFixed(2)}
                    {product.shopName ? ` · ${product.shopName}` : ""}
                  </Text>
                </View>
                {product.distanceKm != null ? (
                  <Text style={styles.productDistance}>
                    {formatDistance(product.distanceKm)}
                  </Text>
                ) : null}
              </Pressable>
            ))
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },

  topOverlay: { position: "absolute", top: 0, left: 0, right: 0, padding: 16, gap: 10 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderRadius: 26,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  topBarSpacer: { width: 24 },
  title: { fontSize: 17, fontFamily: fonts.headlineBold, color: GREEN },
  notice: {
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: fonts.bodyRegular,
    color: colors.textMuted,
  },

  marker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 3,
    borderColor: colors.white,
  },
  markerSelected: { borderColor: ORANGE },
  // Its own radius, not just the parent's overflow:hidden - Android doesn't
  // reliably clip a child image to a rounded parent.
  markerImage: { width: "100%", height: "100%", borderRadius: 22 },

  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: colors.white,
    paddingTop: 10,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D8DCDA",
  },
  sheetRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 },
  sheetTitle: { flex: 1, fontSize: 16, fontFamily: fonts.bodySemiBold, color: colors.text },
  sheetDistance: { fontSize: 14, fontFamily: fonts.bodySemiBold, color: GREEN },
  sheetSubtitle: {
    marginTop: 2,
    marginLeft: 28,
    fontSize: 13,
    fontFamily: fonts.bodyRegular,
    color: colors.textMuted,
  },

  sheetList: { marginTop: 10 },
  sheetListContent: { gap: 10, paddingBottom: 8 },
  sheetEmpty: { fontSize: 14, fontFamily: fonts.bodyRegular, color: colors.textMuted },
  productRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  productImage: { width: 44, height: 44, borderRadius: 8 },
  productImageFallback: { backgroundColor: colors.neutralSoft },
  productBody: { flex: 1, gap: 2 },
  productName: { fontSize: 14, fontFamily: fonts.bodySemiBold, color: colors.text },
  productMeta: { fontSize: 12, fontFamily: fonts.bodyRegular, color: colors.textMuted },
  productDistance: { fontSize: 13, fontFamily: fonts.bodySemiBold, color: GREEN },

  pressed: { opacity: 0.85 },
});
