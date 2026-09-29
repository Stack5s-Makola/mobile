import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, MapPin, Store } from "lucide-react-native";
import Mapbox, { Camera, MapView, MarkerView, UserLocation } from "@rnmapbox/maps";
import * as Location from "expo-location";
import { colors, fonts, radii } from "@constants/theme";
import { BuyerStackProps } from "@navigation/buyerRoutes";
import * as nearbyService from "@services/api/nearbyService";
import {
  ensureOfflinePack,
  saveNearby,
  readNearbyShops,
  readNearbyProducts,
  OFFLINE_RADIUS_KM,
} from "@services/db/mapCache";
import { SyncBanner, SyncStatus } from "@components/SyncBanner";
import { useAuth } from "@context/AuthContext";
import { NearbyProduct, NearbyShop } from "@types/seller";
import { formatDistance } from "@utils/geo";
import { labelColor } from "@utils/labelColor";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? null);

const GREEN = "#1CA30A";
const ORANGE = "#F5821F";

// Central Accra, used until the device reports a position.
const FALLBACK: [number, number] = [-0.187, 5.6037]; // Mapbox wants [lng, lat]

// How far out to look for shops and their products.
const SEARCH_RADIUS_KM = 10;

// The sheet's two heights. It opens when a shop is tapped. Expanded is a fixed
// number, not a share of the screen: the open state is a fixed-size card - the
// owner, the shop name and a button - so it needs the same room everywhere.
const SHEET_COLLAPSED = 75;
// The open sheet is measured, not guessed: the owner's name and the location
// line are each optional, so any fixed number either leaves a gap under the
// button or clips it. Used only for the very first frame, before onLayout.
const SHEET_EXPANDED_ESTIMATE = 170;
// The sheet's own paddingTop, the handle, and a matching gap under the button.
const SHEET_CHROME = 10 + 4 + 12;

// Shops and products around the buyer, laid out like the seller's map.
export function BuyerMapScreen({ navigation }: BuyerStackProps<"BuyerMap">) {
  const insets = useSafeAreaInsets();
  const [centre, setCentre] = useState<[number, number] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [shops, setShops] = useState<NearbyShop[]>([]);
  const [products, setProducts] = useState<NearbyProduct[]>([]);
  const [selected, setSelected] = useState<NearbyShop | null>(null);
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [offlineProgress, setOfflineProgress] = useState(0);
  // Which half of the save the banner is reporting on.
  const [syncPhase, setSyncPhase] = useState<"data" | "tiles">("data");

  const sheetHeight = useRef(new Animated.Value(SHEET_COLLAPSED)).current;
  // What the open sheet's contents actually measure, via onLayout.
  const [cardHeight, setCardHeight] = useState(0);
  const sheetExpanded =
    cardHeight > 0 ? cardHeight + SHEET_CHROME : SHEET_EXPANDED_ESTIMATE;

  useEffect(() => {
    Animated.timing(sheetHeight, {
      toValue: selected ? sheetExpanded : SHEET_COLLAPSED,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      // Height can't be driven natively.
      useNativeDriver: false,
    }).start();
  }, [selected, sheetExpanded, sheetHeight]);

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

    // Before any await, or the banner misses its first render and never shows.
    setSyncPhase("data");
    setOfflineProgress(0);
    setSyncStatus("syncing");

    (async () => {
      // Show whatever was saved last time straight away, then refresh it.
      const [cachedShops, cachedProducts] = await Promise.all([
        readNearbyShops().catch(() => []),
        readNearbyProducts().catch(() => []),
      ]);
      if (!cancelled && cachedShops.length > 0) setShops(cachedShops);
      if (!cancelled && cachedProducts.length > 0) setProducts(cachedProducts);

      const [shopsRes, productsRes] = await Promise.all([
        nearbyService.getNearbyShops(longitude, latitude, SEARCH_RADIUS_KM).catch(() => null),
        nearbyService.getNearbyProducts(longitude, latitude, SEARCH_RADIUS_KM).catch(() => null),
      ]);
      if (cancelled) return;
      if (shopsRes?.success) setShops(shopsRes.data);
      if (productsRes?.success) setProducts(productsRes.data);

      // Every shop and product - owners, descriptions, listings and their
      // photos - on disk before the tiles, so the data survives even if the
      // tile download is the thing that fails.
      if (shopsRes?.success || productsRes?.success) {
        await saveNearby(shopsRes?.data ?? [], productsRes?.data ?? []).catch(() => {});
      }
      if (cancelled) return;

      // Tiles are per-account, so there's nothing to name a pack after until
      // the session is known.
      if (!userId) {
        setSyncStatus("done");
        return;
      }

      setSyncPhase("tiles");
      const outcome = await ensureOfflinePack(userId, centre, (percentage) => {
        if (cancelled) return;
        setOfflineProgress(percentage);
        if (percentage >= 100) setSyncStatus("done");
      });
      // Nothing was downloaded - already covered - but the data above was
      // still saved, so this is a "done", not a silent dismissal.
      if (!cancelled && outcome !== "downloading") setSyncStatus("done");
    })();

    return () => {
      cancelled = true;
    };
  }, [centre, userId]);

  // Markers are drawn in array order, so the last one wins where they overlap.
  // Shops with a logo go last: test shops share coordinates, so a stack of
  // plain icons would otherwise bury the one recognisable shop. The selected
  // shop goes last of all so it is never hidden.
  const orderedShops = [...shops].sort((a, b) => {
    if (a.id === selected?.id) return 1;
    if (b.id === selected?.id) return -1;
    return (
      Number(Boolean(a.owner?.picture ?? a.logo)) -
      Number(Boolean(b.owner?.picture ?? b.logo))
    );
  });

  // The selected shop's own listings when the endpoint sent them; otherwise
  // whatever matches by name, which is all the old shape allowed.
  const visibleProducts = selected
    ? selected.products.length > 0
      ? selected.products
      : products.filter((product) => product.shopName === selected.shopName)
    : products;

  // The owner's photo first: only a handful of shops have uploaded a logo, and
  // every owner has a picture.
  const shopAvatar = selected?.owner?.picture ?? selected?.logo ?? null;

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
              {/* The whole thing is the target, so the name is tappable too. */}
              <Pressable
                style={({ pressed }) => [styles.markerWrap, pressed && styles.pressed]}
                onPress={() =>
                  setSelected((current) => (current?.id === shop.id ? null : shop))
                }
                accessibilityRole="button"
                accessibilityLabel={shop.shopName ?? "Shop"}
              >
                <View
                  style={[
                    styles.marker,
                    selected?.id === shop.id && styles.markerSelected,
                  ]}
                >
                  {(shop.owner?.picture ?? shop.logo) ? (
                    <Image
                      source={{ uri: (shop.owner?.picture ?? shop.logo) as string }}
                      style={styles.markerImage}
                      resizeMode="cover"
                    />
                  ) : (
                    // No logo uploaded - a shop icon reads better than initials.
                    <Store size={26} color={colors.white} />
                  )}
                </View>
                {shop.shopName ? (
                  <View style={styles.markerLabel}>
                    <Text
                      style={[styles.markerLabelText, { color: labelColor(shop.id) }]}
                      numberOfLines={1}
                    >
                      {shop.shopName}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            </MarkerView>
          ))}
        </MapView>
      ) : (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      )}

      <SyncBanner
        status={syncStatus}
        syncingMessage={
          syncPhase === "data"
            ? "Saving shops nearby…"
            : `Saving ${OFFLINE_RADIUS_KM}km offline… ${Math.round(offlineProgress)}%`
        }
        doneMessage="Shops and map saved for offline use"
      />

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

        {selected ? (
          <View
            onLayout={(event) => {
              const measured = Math.round(event.nativeEvent.layout.height);
              // Only on a real change, or setting state from layout loops.
              setCardHeight((current) => (current === measured ? current : measured));
            }}
          >
            <View style={styles.shopRow}>
              {shopAvatar ? (
                <Image source={{ uri: shopAvatar }} style={styles.shopAvatar} />
              ) : (
                <View style={[styles.shopAvatar, styles.shopAvatarFallback]}>
                  <Store size={26} color={colors.white} />
                </View>
              )}
              <View style={styles.shopBody}>
                <Text style={styles.shopName} numberOfLines={1}>
                  {selected.shopName ?? "Shop"}
                </Text>
                {selected.owner?.name ? (
                  <Text style={styles.shopOwner} numberOfLines={1}>
                    {selected.owner.name}
                  </Text>
                ) : null}
                {selected.locationName || selected.distanceKm != null ? (
                  <View style={styles.shopMetaRow}>
                    <MapPin size={13} color={ORANGE} />
                    <Text style={styles.shopMeta} numberOfLines={1}>
                      {[
                        selected.locationName,
                        selected.distanceKm != null
                          ? formatDistance(selected.distanceKm)
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.viewShop, pressed && styles.pressed]}
              onPress={() =>
                navigation.navigate("ShopProfile", {
                  shop: selected,
                  // What the map matched by name, for a backend that hasn't
                  // shipped nested listings yet.
                  products: visibleProducts,
                  openProducts: true,
                })
              }
              accessibilityRole="button"
            >
              <Text style={styles.viewShopLabel}>View Shop</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.sheetRow}>
            <MapPin size={20} color={ORANGE} />
            <Text style={styles.sheetTitle} numberOfLines={1}>
              {`${shops.length} shop${shops.length === 1 ? "" : "s"} within ${SEARCH_RADIUS_KM}km`}
            </Text>
          </View>
        )}
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
    width: 56,
    height: 56,
    borderRadius: 28,
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
  markerImage: { width: "100%", height: "100%", borderRadius: 28 },
  markerWrap: { alignItems: "center" },
  markerLabel: {
    // Negative, so it tucks up against the circle instead of floating below.
    marginTop: -4,
    maxWidth: 110,
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  markerLabelText: { fontSize: 11, fontFamily: fonts.bodySemiBold, color: colors.text },

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
  shopRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16 },
  shopAvatar: { width: 60, height: 60, borderRadius: 30 },
  shopAvatarFallback: {
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  shopBody: { flex: 1, gap: 2 },
  shopName: { fontSize: 17, fontFamily: fonts.headlineBold, color: colors.text },
  shopOwner: { fontSize: 13, fontFamily: fonts.bodyMedium, color: colors.textMuted },
  shopMetaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  shopMeta: { flex: 1, fontSize: 12, fontFamily: fonts.bodyRegular, color: colors.textMuted },
  viewShop: {
    marginTop: 16,
    borderRadius: radii.button,
    backgroundColor: GREEN,
    paddingVertical: 14,
    alignItems: "center",
  },
  viewShopLabel: { fontSize: 15, fontFamily: fonts.bodyBold, color: colors.white },

  pressed: { opacity: 0.85 },
});
