import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SellerPlaceholderScreen } from "@screens/seller/SellerPlaceholderScreen";

// This is the file Daniel's seller-experience minor work plugs into.
// Structure (tabs, screen names) was agreed during the nav-skeleton
// lock-in - do not restructure without re-syncing.
// Expected tabs (per architecture doc): Dashboard, Shop, Listings, Verification, Profile
// SellerPlaceholderScreen below exists only so the auth flow is testable
// end-to-end today - Daniel replaces this, not builds on top of it.

const Tab = createBottomTabNavigator();

export function SellerNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Dashboard" component={SellerPlaceholderScreen} />
    </Tab.Navigator>
  );
}
