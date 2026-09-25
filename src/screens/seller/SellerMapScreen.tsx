import React, { useEffect, useState } from "react";
import { View, Text, Image, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import Mapbox, { Camera, MapView, MarkerView, UserLocation } from "@rnmapbox/maps";
import * as Location from "expo-location";
import { colors, fonts } from "@constants/theme";
import { useAuth } from "@context/AuthContext";
import { initials } from "@utils/format";
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

export function SellerMapScreen({ navigation }: SellerStackProps<"Map">) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const user = session?.user;
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
          <MarkerView coordinate={centre}>
            <View style={styles.marker}>
              {user?.photoUri ? (
                <Image source={{ uri: user.photoUri }} style={styles.markerImage} />
              ) : (
                <Text style={styles.markerInitials}>{initials(user?.businessName)}</Text>
              )}
            </View>
          </MarkerView>
        </MapView>
      ) : (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={ORANGE} />
        </View>
      )}

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
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.sheetHandle} />
      </View>
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
    minHeight: 150,
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
  sheetHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D8DCDA",
  },
  // The seller's own avatar, ringed so it stays legible over the map.
  marker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ORANGE,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 3,
    borderColor: ORANGE,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  markerImage: { width: "100%", height: "100%" },
  markerInitials: { fontSize: 16, fontFamily: fonts.headline, color: colors.white },
});
