import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ArrowLeft, Bell } from "lucide-react-native";
import { colors, fonts } from "@constants/theme";
import { SellerStackProps } from "@navigation/sellerRoutes";
import * as notificationService from "@services/api/notificationService";
import { SellerNotification } from "@types/seller";
import { formatDate } from "@utils/format";

const GREEN = "#1CA30A";

export function NotificationsScreen({ navigation }: SellerStackProps<"Notifications">) {
  const [notifications, setNotifications] = useState<SellerNotification[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    try {
      const res = await notificationService.getNotifications();
      if (res.success) {
        setNotifications(res.data);
        setError(null);
      } else {
        setError(res.message);
      }
    } catch {
      setError("Couldn't load your notifications. Pull down to try again.");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const unreadCount = notifications?.filter((item) => !item.read).length ?? 0;

  async function openNotification(item: SellerNotification) {
    if (!item.read) {
      // Mark it locally first so the row responds immediately; the request is
      // a background detail and a failure shouldn't block the navigation.
      setNotifications((current) =>
        current?.map((row) => (row.id === item.id ? { ...row, read: true } : row)) ?? current
      );
      notificationService.markRead(item.id).catch(() => {});
    }
    if (item.referenceId) {
      navigation.navigate("ProductDetails", { productId: item.referenceId });
    }
  }

  async function handleMarkAllRead() {
    setNotifications((current) => current?.map((row) => ({ ...row, read: true })) ?? current);
    try {
      await notificationService.markAllRead();
    } catch {
      // Next focus refetches, so a failure here corrects itself.
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={26} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <Pressable onPress={handleMarkAllRead} hitSlop={8} accessibilityRole="button">
            <Text style={styles.markAll}>Mark all</Text>
          </Pressable>
        ) : (
          // Balances the arrow so the title stays optically centred.
          <View style={styles.headerSpacer} />
        )}
      </View>

      {notifications === null && !error ? (
        <View style={styles.centre}>
          <ActivityIndicator size="large" color={GREEN} />
        </View>
      ) : (
        <FlatList
          data={notifications ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => load(true)}
              tintColor={GREEN}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Bell size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>
                {error ? "Something went wrong" : "Nothing here yet"}
              </Text>
              <Text style={styles.emptyBody}>
                {error ?? "Updates about your listings and shop will show up here."}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.row,
                !item.read && styles.rowUnread,
                pressed && styles.pressed,
              ]}
              onPress={() => openNotification(item)}
              accessibilityRole="button"
            >
              {/* A dot rather than bold-everything, so a long list stays calm. */}
              <View style={[styles.dot, item.read && styles.dotRead]} />
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.rowText} numberOfLines={3}>
                  {item.body}
                </Text>
                <Text style={styles.rowDate}>{formatDate(item.createdAt)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  centre: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: { fontSize: 22, fontFamily: fonts.headlineBold, color: colors.text },
  headerSpacer: { width: 26 },
  markAll: { fontSize: 14, fontFamily: fonts.bodySemiBold, color: GREEN },

  list: { padding: 20, gap: 12, flexGrow: 1 },
  row: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#F6F8F7",
  },
  rowUnread: { backgroundColor: "#E7F6E4" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: GREEN, marginTop: 6 },
  dotRead: { backgroundColor: "transparent" },
  rowBody: { flex: 1, gap: 3 },
  rowTitle: { fontSize: 15, fontFamily: fonts.bodySemiBold, color: colors.text },
  rowText: { fontSize: 14, fontFamily: fonts.bodyRegular, color: colors.textMuted, lineHeight: 20 },
  rowDate: { fontSize: 12, fontFamily: fonts.bodyRegular, color: colors.textMuted, marginTop: 2 },

  empty: { alignItems: "center", paddingTop: 80, paddingHorizontal: 20, gap: 8 },
  emptyTitle: { fontSize: 16, fontFamily: fonts.bodySemiBold, color: colors.text },
  emptyBody: {
    fontSize: 14,
    fontFamily: fonts.bodyRegular,
    color: colors.textMuted,
    textAlign: "center",
  },
  pressed: { opacity: 0.85 },
});
