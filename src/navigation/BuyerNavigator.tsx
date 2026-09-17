import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { BuyerStackParamList, BuyerTabParamList } from "@navigation/buyerRoutes";
import { BuyerTabBar } from "@components/BuyerTabBar";
import { BuyerHomeScreen } from "@screens/buyer/BuyerHomeScreen";
import { BuyerProfileTab } from "@screens/buyer/tabs/BuyerProfileTab";
import { ComingSoonTab } from "@screens/buyer/tabs/ComingSoonTab";
import { ProductDetailsScreen } from "@screens/buyer/ProductDetailsScreen";
import { CategoriesScreen } from "@screens/buyer/CategoriesScreen";

// Buyer side of the role-based nav skeleton, following the same
// Stack-wrapping-Tabs pattern as SellerNavigator. Tabs: Home, Search,
// Saved, Profile (matches Figma's 4-tab BUYER NAV - no separate Map tab).
// Categories and ProductDetails are full-screen pushes on top of the
// tabs, not tabs themselves.

const Stack = createNativeStackNavigator<BuyerStackParamList>();
const Tab = createBottomTabNavigator<BuyerTabParamList>();

function BuyerTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <BuyerTabBar {...props} />}>
      <Tab.Screen name="Home" component={BuyerHomeScreen} />
      <Tab.Screen name="Search">{() => <ComingSoonTab label="Search" />}</Tab.Screen>
      <Tab.Screen name="Saved">{() => <ComingSoonTab label="Saved" />}</Tab.Screen>
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
    </Stack.Navigator>
  );
}
