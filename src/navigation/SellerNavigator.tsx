import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LayoutDashboard, Store, Package, User } from "lucide-react-native";
import { colors, fonts } from "@constants/theme";
import {
  ListingsStackParamList,
  SellerStackParamList,
  SellerTabParamList,
} from "@navigation/sellerRoutes";
import { SellerDashboardScreen } from "@screens/seller/SellerDashboardScreen";
import { SellerShopScreen } from "@screens/seller/SellerShopScreen";
import { SellerListingsScreen } from "@screens/seller/SellerListingsScreen";
import { ListingFormScreen } from "@screens/seller/ListingFormScreen";
import { SellerVerificationScreen } from "@screens/seller/SellerVerificationScreen";
import { SellerProfileScreen } from "@screens/seller/SellerProfileScreen";

// Seller side of the role-based nav skeleton. Tabs: Dashboard, Shop,
// Listings, Profile. Verification is a full screen on top of the tabs
// (reached from the Dashboard banner and Profile menu) rather than a tab -
// it's a one-off task, not a place sellers return to daily.
//
// Listings has depth (list -> create/edit form), so it gets its own
// nested stack; the other tabs are single screens.

const Stack = createNativeStackNavigator<SellerStackParamList>();
const Tab = createBottomTabNavigator<SellerTabParamList>();
const ListingsStack = createNativeStackNavigator<ListingsStackParamList>();

const TAB_BAR_HEIGHT = 72; // excluding the bottom safe-area inset

function ListingsNavigator() {
  return (
    <ListingsStack.Navigator screenOptions={{ headerShown: false }}>
      <ListingsStack.Screen name="ListingsHome" component={SellerListingsScreen} />
      <ListingsStack.Screen name="ListingForm" component={ListingFormScreen} />
    </ListingsStack.Navigator>
  );
}

const TAB_ICONS: Record<keyof SellerTabParamList, typeof LayoutDashboard> = {
  Dashboard: LayoutDashboard,
  Shop: Store,
  Listings: Package,
  Profile: User,
};

function SellerTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const Icon = TAB_ICONS[route.name];
        return {
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            height: TAB_BAR_HEIGHT + insets.bottom,
            paddingTop: 10,
            paddingBottom: insets.bottom + 10,
          },
          tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 12, marginTop: 2 },
          tabBarIcon: ({ color }) => <Icon color={color} size={24} />,
        };
      }}
    >
      <Tab.Screen name="Dashboard" component={SellerDashboardScreen} />
      <Tab.Screen name="Shop" component={SellerShopScreen} />
      <Tab.Screen name="Listings" component={ListingsNavigator} />
      <Tab.Screen name="Profile" component={SellerProfileScreen} />
    </Tab.Navigator>
  );
}

export function SellerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SellerTabs" component={SellerTabs} />
      <Stack.Screen name="Verification" component={SellerVerificationScreen} />
    </Stack.Navigator>
  );
}
