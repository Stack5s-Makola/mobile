import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Bell } from "lucide-react-native";
import { colors, fonts } from "@constants/theme";
import { SellerStackProps } from "@navigation/sellerRoutes";

// Placeholder - opened from the bell on the dashboard. TODO(connect): fetch
// and list notifications once the endpoint exists.
const GREEN = "#1CA30A";

export function NotificationsScreen({ navigation }: SellerStackProps<"Notifications">) {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={26} color={GREEN} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        {/* Balances the arrow so the title stays optically centred. */}
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.empty}>
        <Bell size={40} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>Nothing here yet</Text>
        <Text style={styles.emptyBody}>
          Updates about your listings and shop will show up here.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: { fontSize: 22, fontFamily: fonts.headlineBold, color: GREEN },
  headerSpacer: { width: 26 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: fonts.bodySemiBold, color: colors.text },
  emptyBody: {
    fontSize: 14,
    fontFamily: fonts.bodyRegular,
    color: colors.textMuted,
    textAlign: "center",
  },
});
