import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

// Placeholder. This is the file Daniel's seller-experience minor work
// plugs into. Structure (tabs, screen names) was agreed with Daniel/Charity
// during the nav-skeleton lock-in - do not restructure without re-syncing.
// Expected tabs (per architecture doc): Dashboard, Shop, Listings, Verification, Profile

const Tab = createBottomTabNavigator();

export function SellerNavigator() {
  return <Tab.Navigator screenOptions={{ headerShown: false }} />;
}
