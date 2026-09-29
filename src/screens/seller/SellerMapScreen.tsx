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
import { useAuth } from "@context/AuthContext";
import {
  ensureOfflinePack,
  saveNearby,
  readNearbyShops,
  readNearbyProducts,
  OFFLINE_RADIUS_KM,
} from "@services/db/mapCache";
import { SyncBanner, SyncStatus } from "@components/SyncBanner";
import * as nearbyService from "@services/api/nearbyService";
import { NearbyProduct, NearbyShop } from "@types/seller";
import { formatDistance } from "@utils/geo";
import { labelColor } from "@utils/labelColor";
import { SellerStackProps } from "@navigation/sellerRoutes";

// Mapbox is initialised once per app load, not per render. The public token
// ships in the bundle by design - that's what a pk.* token is for.
//
// NOTE: @rnmapbox/maps is a native module with a config plugin, so this screen
// renders only in a development build. In Expo Go the map area stays blank.
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? null);

const ORANGE = "#F5821F";
// Same green as the rest of the seller screens.
const GREEN = "#1CA30A";

// Central Accra - the same placeholder the sign-up flow uses when a seller's
// real coordinates aren't known.
const FALLBACK: [number, number] = [-0.187, 5.6037]; // Mapbox wants [lng, lat]

// The sheet's two heights. Tapping the handle moves between them.
// How far out to look for other shops and their products.
const SEARCH_RADIUS_KM = 10;

// The open state is a fixed-size card - the owner, the shop name and a button -
// so it needs the same room on every screen.
const SHEET_COLLAPSED = 75;
// The open sheet is measured, not guessed: the owner's name and the location
// line are each optional, so any fixed number either leaves a gap under the
// button or clips it. Used only for the very first frame, before onLayout.
const SHEET_EXPANDED_ESTIMATE = 170;
// The sheet's own paddingTop, the handle, and a matching gap under the button.
const SHEET_CHROME = 10 + 4 + 12;

function formatCoordinates([longitude, latitude]: [number, number]): string {
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

export function SellerMapScreen({ navigation }: SellerStackProps<"Map">) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const user = session?.user;
  const [selected, setSelected] = useState<NearbyShop | null>(null);
  const [shops, setShops] = useState<NearbyShop[]>([]);
  const [products, setProducts] = useState<NearbyProduct[]>([]);
  const [offlineProgress, setOfflineProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<SyncStatus>("idle");
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
  const [centre, setCentre] = useState<[number, number] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { granted } = await Location.requestForegroundPermissionsAsync();
        if (!granted) {
          if (!cancelled) {
            setNotice("Location access is off, so the map is centred on Accra.");
            setCentre(FALLBACK);
          }
          return;
        }
        const position = await Location.getCurrentPositionAsync({});
        if (!cancelled) {
          setCentre([position.coords.longitude, position.coords.latitude]);
        }
      } catch {
        if (!cancelled) {
          setNotice("Couldn't get your location, so the map is centred on Accra.");
          setCentre(FALLBACK);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const userId = user?.id;

  // Data first, then tiles, in one effect so the banner can report both as a
  // single save rather than two that race each other.
  useEffect(() => {
    if (!centre) return;
    let cancelled = false;
    const [longitude, latitude] = centre;

    // Before any await, or the banner misses its first render and never shows.
    setSyncPhase("data");
    setOfflineProgress(0);
    setDownloadStatus("syncing");

    (async () => {
      // Show whatever was saved last time straight away, then refresh it.
      const [cachedShops, cachedProducts] = await Promise.all([
        readNearbyShops().catch(() => []),
        readNearbyProducts().catch(() => []),
      ]);
      if (!cancelled && cachedShops.length > 0) setShops(cachedShops);
      if (!cancelled && cachedProducts.length > 0) setProducts(cachedProducts);

      const [shopsRes, productsRes] = await Promise.all([
        // The seller's own copy of the endpoint, behind the seller guard.
        nearbyService
          .getNearbyShops(longitude, latitude, SEARCH_RADIUS_KM, "seller")
          .catch(() => null),
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
        setDownloadStatus("done");
        return;
      }

      setSyncPhase("tiles");
      const outcome = await ensureOfflinePack(userId, centre, (percentage) => {
        if (cancelled) return;
        setOfflineProgress(percentage);
        if (percentage >= 100) setDownloadStatus("done");
      });
      // Nothing was downloaded - already covered - but the data above was
      // still saved, so this is a "done", not a silent dismissal.
      if (!cancelled && outcome !== "downloading") setDownloadStatus("done");
    })();

    return () => {
      cancelled = true;
    };
  }, [centre, userId]);

  // Everyone else's shops; the seller's own position is already the blue dot.
  const otherShops = shops.filter((shop) => shop.shopName !== user?.businessName);

  // Markers are drawn in array order, so the last one wins where they overlap.
  // Shops with a logo go last: test shops share coordinates, so a stack of
  // plain icons would otherwise bury the one recognisable shop. The selected
  // shop goes last of all so it is never hidden.
  const orderedShops = [...otherShops].sort((a, b) => {
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
        // Fills the screen; the controls float on top of it rather than
        // taking a slice of the layout.
        <MapView
          style={StyleSheet.absoluteFill}
          styleURL={Mapbox.StyleURL.Light}
          // The scale bar sits top-left, right under our floating title bar.
          scaleBarEnabled={false}
        >
          <Camera
            centerCoordinate={centre}
            zoomLevel={14}
            // Tilted, for a 3D perspective on the light basemap.
            pitch={55}
            animationDuration={0}
          />
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
                    styles.otherMarker,
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
                    <Store size={24} color={colors.white} />
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
          <ActivityIndicator size="large" color={ORANGE} />
        </View>
      )}

      <SyncBanner
        status={downloadStatus}
        syncingMessage={
          syncPhase === "data"
            ? "Saving shops nearby…"
            : `Saving ${OFFLINE_RADIUS_KM}km offline… ${Math.round(offlineProgress)}%`
        }
        doneMessage="Shops and map saved for offline use"
      />

      {/* box-none so taps fall through to the map everywhere except the
          controls themselves. */}
      <SafeAreaView style={styles.overlay} edges={["top"]} pointerEvents="box-none">
        {/* One wide bar holding both the arrow and the title. */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
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

      {/* Bottom sheet, Google Maps style: flush to the edges, rounded only at
          the top, with a drag handle. Empty for now; content to come. */}
      <Animated.View
        style={[styles.sheet, { height: Animated.add(sheetHeight, insets.bottom) }]}
      >
        <Pressable
          onPress={() => setSelected(null)}
          disabled={!selected}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Collapse details"
          accessibilityState={{ expanded: selected !== null }}
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
                  products: visibleProducts,
                  // ProductDetails is a buyer route - a seller browsing a rival
                  // shop gets the list without taps.
                  openProducts: false,
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
            <Text style={styles.sheetLocation} numberOfLines={1}>
              {/* Where the seller is - what they typed at sign-up, with the
                  coordinates as the fallback when they never gave one. */}
              {user?.location || (centre ? formatCoordinates(centre) : "Location unknown")}
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  overlay: { position: "absolute", top: 0, left: 0, right: 0, padding: 16, gap: 10 },
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
  back: { alignItems: "center", justifyContent: "center" },
  backPressed: { opacity: 0.8 },
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
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    // Height is animated between the two states; content beyond it is clipped.
    overflow: "hidden",
    // Corners only at the top - the sheet runs off the bottom of the screen.
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
  sheetRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 14 },
  sheetLocation: { flex: 1, fontSize: 16, fontFamily: fonts.bodySemiBold, color: colors.text },
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
  productDistance: { fontSize: 13, fontFamily: fonts.bodySemiBold, color: GREEN },
  sheetHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D8DCDA",
  },
  otherMarker: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.white,
  },
  // Its own radius: Android doesn't reliably clip a child image to a rounded
  // parent via overflow: hidden.
  markerImage: { width: "100%", height: "100%", borderRadius: 26 },
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
  // Orange ring on the shop whose details the sheet is showing.
  markerSelected: { borderColor: ORANGE },

  pressed: { opacity: 0.85 },
});
