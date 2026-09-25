import React, { useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Mapbox, { Camera, MapView, MarkerView } from "@rnmapbox/maps";
import * as Location from "expo-location";
import { PrimaryButton } from "@components/PrimaryButton";
import { colors, fonts } from "@constants/theme";

Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? null);

const GREEN = "#1CA30A";
const ORANGE = "#F5821F";

// Central Accra, used until we know better.
const FALLBACK: [number, number] = [-0.187, 5.6037]; // Mapbox wants [lng, lat]

// Pick a shop's position by moving the map under a fixed centre pin. Returns
// the choice to whichever screen opened it, via `onPicked` in the route params.
export function LocationPickerScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const { initial, onPicked } = route.params as {
    initial?: { latitude: number; longitude: number };
    onPicked: (picked: { latitude: number; longitude: number }) => void;
  };

  const [centre, setCentre] = useState<[number, number] | null>(
    initial ? [initial.longitude, initial.latitude] : null
  );
  // Tracks the map as it moves; the pin itself never leaves the middle.
  const [picked, setPicked] = useState<[number, number] | null>(centre);

  useEffect(() => {
    if (centre) return;
    let cancelled = false;

    (async () => {
      try {
        const { granted } = await Location.requestForegroundPermissionsAsync();
        if (!granted) throw new Error("denied");
        const position = await Location.getCurrentPositionAsync({});
        if (cancelled) return;
        const here: [number, number] = [position.coords.longitude, position.coords.latitude];
        setCentre(here);
        setPicked(here);
      } catch {
        if (cancelled) return;
        setCentre(FALLBACK);
        setPicked(FALLBACK);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [centre]);

  function handleProceed() {
    if (!picked) return;
    onPicked({ longitude: picked[0], latitude: picked[1] });
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      {centre ? (
        <MapView
          style={StyleSheet.absoluteFill}
          styleURL={Mapbox.StyleURL.Light}
          scaleBarEnabled={false}
          onCameraChanged={(state) =>
            setPicked([state.properties.center[0], state.properties.center[1]])
          }
        >
          <Camera centerCoordinate={centre} zoomLevel={15} animationDuration={0} />
        </MapView>
      ) : (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      )}

      {/* Fixed to the centre of the screen - the map moves beneath it, which
          is steadier than dragging a marker around. */}
      <View style={styles.pinWrap} pointerEvents="none">
        <MaterialCommunityIcons name="map-marker" size={46} color={ORANGE} />
      </View>

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
          <Text style={styles.title}>Pick your location</Text>
          <View style={styles.topBarSpacer} />
        </View>
      </SafeAreaView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={styles.coordinates}>
          {picked
            ? `${picked[1].toFixed(5)}, ${picked[0].toFixed(5)}`
            : "Move the map to place the pin"}
        </Text>
        <PrimaryButton label="Proceed" onPress={handleProceed} disabled={!picked} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },

  pinWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    // Lifts the point of the pin onto the exact centre of the map.
    paddingBottom: 46,
  },

  topOverlay: { position: "absolute", top: 0, left: 0, right: 0, padding: 16 },
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

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    gap: 12,
    backgroundColor: colors.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  coordinates: {
    textAlign: "center",
    fontSize: 14,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
  },
});
