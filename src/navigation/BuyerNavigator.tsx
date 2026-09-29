import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  BuyerStackParamList,
  BuyerTabParamList,
} from "@navigation/buyerRoutes";
import { AppTabBar } from "@components/AppTabBar";
import { Home, Search, Bookmark, User } from "lucide-react-native";
import { BuyerHomeScreen } from "@screens/buyer/BuyerHomeScreen";
import { SearchTab } from "@screens/buyer/tabs/SearchTab";
import { SavedTab } from "@screens/buyer/tabs/SavedTab";
import { BuyerProfileTab } from "@screens/buyer/tabs/BuyerProfileTab";
import { ProductDetailsScreen } from "@screens/buyer/ProductDetailsScreen";
import { CategoriesScreen } from "@screens/buyer/CategoriesScreen";
import { NotificationsScreen } from "@screens/buyer/NotificationsScreen";
import { BuyerMapScreen } from "@screens/buyer/BuyerMapScreen";
import { ShopProfileScreen } from "@screens/shared/ShopProfileScreen";
import { BuyerNameScreen } from "@screens/buyer/profile/BuyerNameScreen";
import { BuyerPhoneScreen } from "@screens/buyer/profile/BuyerPhoneScreen";
import { BuyerPasswordScreen } from "@screens/buyer/profile/BuyerPasswordScreen";

// Buyer side of the role-based nav skeleton, following the same
// Stack-wrapping-Tabs pattern as SellerNavigator. Tabs: Home, Search,
// Saved, Profile (matches Figma's 4-tab BUYER NAV - no separate Map tab).
// Categories and ProductDetails are full-screen pushes on top of the
// tabs, not tabs themselves.

const Stack = createNativeStackNavigator<BuyerStackParamList>();
const Tab = createBottomTabNavigator<BuyerTabParamList>();

const TAB_ICONS: Record<keyof BuyerTabParamList, typeof Home> = {
  Home,
  Search,
  Saved: Bookmark,
  Profile: User,
};

function BuyerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <AppTabBar {...props} icons={TAB_ICONS} />}
    >
      <Tab.Screen name="Home" component={BuyerHomeScreen} />
      <Tab.Screen name="Search" component={SearchTab} />
      <Tab.Screen name="Saved" component={SavedTab} />
      <Tab.Screen name="Profile" component={BuyerProfileTab} />
    </Tab.Navigator>
  );
}

export function BuyerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BuyerTabs" component={BuyerTabs} />
      <Stack.Screen name="Categories" component={CategoriesScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="BuyerMap" component={BuyerMapScreen} />
      <Stack.Screen name="ShopProfile" component={ShopProfileScreen} />
      <Stack.Screen name="BuyerName" component={BuyerNameScreen} />
      <Stack.Screen name="BuyerPhone" component={BuyerPhoneScreen} />
      <Stack.Screen name="BuyerPassword" component={BuyerPasswordScreen} />
    </Stack.Navigator>
  );
}
