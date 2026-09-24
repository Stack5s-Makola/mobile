import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home } from "lucide-react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { colors, fonts } from "@constants/theme";

// Floating pill tab bar matching Figma's "BUYER NAV" component - the default
// React Navigation tab bar can't produce this rounded, floating-with-shadow
// look via style props alone.
//
// Shared by both sides of the app: pass the icon for each route name. It
// renders absolutely positioned, so it floats OVER the screen rather than
// reserving space - every screen behind it needs enough bottom padding to
// clear it (see TAB_BAR_CLEARANCE).

type TabIcon = typeof Home;

type Props = BottomTabBarProps & {
  icons: Record<string, TabIcon>;
};

// What a scrollable screen should leave at the bottom so its last row isn't
// hidden behind the floating bar.
export const TAB_BAR_CLEARANCE = 100;

const ACTIVE_COLOR = colors.primary;
const INACTIVE_COLOR = colors.textMuted;

export function AppTabBar({ state, navigation, icons }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + 14 }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const Icon = icons[route.name] ?? Home;
          const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

          function handlePress() {
            // The standard tab-press dance: emitting the event lets a nested
            // stack pop to its root when its tab is tapped again, and lets a
            // screen cancel the navigation.
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          }

          return (
            <Pressable
              key={route.key}
              style={styles.tab}
              onPress={handlePress}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
            >
              <Icon size={24} color={color} />
              <Text style={[styles.label, { color }]} numberOfLines={1}>
                {route.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: "absolute", left: 14, right: 14, alignItems: "center" },
  bar: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: 75,
    paddingVertical: 9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  tab: { flex: 1, alignItems: "center", gap: 4, paddingHorizontal: 2 },
  label: { fontSize: 12, fontFamily: fonts.bodyRegular },
});
