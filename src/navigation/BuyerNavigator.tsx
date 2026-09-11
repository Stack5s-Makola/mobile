import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BuyerHomeScreen } from "@screens/buyer/BuyerHomeScreen";
import { ComingSoonTab } from "@screens/buyer/tabs/ComingSoonTab";
import { BuyerProfileTab } from "@screens/buyer/tabs/BuyerProfileTab";

// Tabs per the architecture doc's buyer discovery flow: Home, Map,
// Categories, Saved, Profile. Only Home is built out so far - the
// others are stubbed with ComingSoonTab so the tab bar structure is
// real and testable, without pretending those screens are finished.

const Tab = createBottomTabNavigator();

export function BuyerNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={BuyerHomeScreen} />
      <Tab.Screen name="Map">{() => <ComingSoonTab label="Map" />}</Tab.Screen>
      <Tab.Screen name="Categories">{() => <ComingSoonTab label="Categories" />}</Tab.Screen>
      <Tab.Screen name="Saved">{() => <ComingSoonTab label="Saved" />}</Tab.Screen>
      <Tab.Screen name="Profile" component={BuyerProfileTab} />
    </Tab.Navigator>
  );
}
