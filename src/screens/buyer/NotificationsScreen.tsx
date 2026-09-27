import React, { useState } from "react";
import { Bell, CheckCheck, ChevronLeft, Inbox } from "lucide-react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts, radii } from "@constants/theme";
import { BuyerStackProps } from "@navigation/buyerRoutes";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
};

export function NotificationsScreen({
  navigation,
}: BuyerStackProps<"Notifications">) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  function markAllAsRead() {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true })),
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
        >
          <ChevronLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Notifications</Text>
        <Pressable
          accessibilityLabel="Mark all notifications as read"
          disabled={unreadCount === 0}
          onPress={markAllAsRead}
          style={styles.iconButton}
        >
          <CheckCheck
            size={21}
            color={unreadCount > 0 ? colors.primary : colors.divider}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Inbox size={34} color={colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>You&apos;re all caught up</Text>
            <Text style={styles.emptyMessage}>
              New updates from sellers and Makola will appear here.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notifications.map((notification) => (
              <View
                key={notification.id}
                style={[
                  styles.notification,
                  !notification.read && styles.unreadNotification,
                ]}
              >
                <View style={styles.notificationIcon}>
                  <Bell size={18} color={colors.primary} />
                </View>
                <View style={styles.notificationBody}>
                  <Text style={styles.notificationTitle}>
                    {notification.title}
                  </Text>
                  <Text style={styles.notificationMessage}>
                    {notification.message}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {notification.time}
                  </Text>
                </View>
                {!notification.read ? <View style={styles.unreadDot} /> : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontFamily: fonts.headline,
    color: colors.text,
  },
  content: { flexGrow: 1, padding: 20 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 80,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 19,
    fontFamily: fonts.headline,
    color: colors.text,
    textAlign: "center",
  },
  emptyMessage: {
    marginTop: 8,
    maxWidth: 280,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fonts.bodyRegular,
    color: colors.textMuted,
    textAlign: "center",
  },
  list: { gap: 10 },
  notification: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: radii.card,
    backgroundColor: colors.neutralSoft,
  },
  unreadNotification: { backgroundColor: colors.primarySoft },
  notificationIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  notificationBody: { flex: 1, marginLeft: 12 },
  notificationTitle: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: colors.text,
  },
  notificationMessage: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.bodyRegular,
    color: colors.textMuted,
  },
  notificationTime: {
    marginTop: 8,
    fontSize: 11,
    fontFamily: fonts.bodyMedium,
    color: colors.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 5,
  },
});
