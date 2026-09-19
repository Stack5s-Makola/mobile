import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Home, Search, Bookmark, User } from "lucide-react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { fonts } from "@constants/theme";

// Custom floating pill tab bar matching Figma's "BUYER NAV" component -
// the default React Navigation tab bar can't produce this rounded,
// floating-with-shadow look via style props alone.

const ICONS: Record<string, typeof Home> = {
  Home: Home,
  Search: Search,
  Saved: Bookmark,
  Profile: User,
};

const ACTIVE_COLOR = "#01573C";
const INACTIVE_COLOR = "#686868";

export function BuyerTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { bottom: insets.bottom + 14 }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const Icon = ICONS[route.name] ?? Home;
          const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

          return (
            <Pressable
              key={route.key}
              style={styles.tab}
              onPress={() => navigation.navigate(route.name)}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
            >
              <Icon size={24} color={color} />
              <Text style={[styles.label, { color }]}>{route.name}</Text>
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
    backgroundColor: "#FFFFFF",
    borderRadius: 75,
    paddingVertical: 9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  tab: { flex: 1, alignItems: "center", gap: 4 },
  label: { fontSize: 12, fontFamily: fonts.bodyRegular },
});
