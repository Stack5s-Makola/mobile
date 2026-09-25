import React, { useEffect, useRef, useState } from "react";
import { Animated, ActivityIndicator, Easing, StyleSheet, Text } from "react-native";
import { colors, fonts } from "@constants/theme";

// Thin bar that drops in from the top while fresh data is being fetched, holds
// briefly on "Sync complete", then slides back up. Screens show their stored
// copy immediately, so this is the only signal that anything happened.

const HEIGHT = 40;
const SLIDE_MS = 320;
const DONE_HOLD_MS = 3000;
// Sits below the top edge rather than flush against the status bar.
const TOP_OFFSET = 56;
// Far enough up to clear its own height plus that offset when hidden.
const HIDDEN_Y = -(HEIGHT + TOP_OFFSET);
const YELLOW = "#FACC15";
// Reconnecting is good news, so it gets its own colour.
const GREEN = "#1CA30A";

export type SyncStatus = "idle" | "syncing" | "done" | "offline" | "online";

type Props = {
  status: SyncStatus;
  syncingMessage?: string;
  doneMessage?: string;
  offlineMessage?: string;
  onlineMessage?: string;
};

export function SyncBanner({
  status,
  syncingMessage = "Updating…",
  doneMessage = "Sync complete",
  offlineMessage = "You're offline",
  onlineMessage = "Back online",
}: Props) {
  // Kept mounted through the slide-out so the exit animation can be seen.
  const [isMounted, setIsMounted] = useState(status !== "idle");
  const translateY = useRef(new Animated.Value(status === "idle" ? HIDDEN_Y : 0)).current;

  useEffect(() => {
    if (status !== "idle") setIsMounted(true);

    function slideTo(value: number, onDone?: () => void) {
      const isEntering = value === 0;
      Animated.timing(translateY, {
        toValue: value,
        duration: SLIDE_MS,
        // Decelerate on the way in so it settles, accelerate on the way out so
        // it leaves cleanly - rather than the same linear-ish curve both ways.
        easing: isEntering ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onDone?.();
      });
    }

    if (status === "idle") {
      slideTo(HIDDEN_Y, () => setIsMounted(false));
      return;
    }

    slideTo(0);

    // "done" and "offline" are settled results: hold them long enough to be
    // read, then slide away. Only "syncing" stays put.
    if (status === "done" || status === "offline" || status === "online") {
      const timer = setTimeout(() => {
        slideTo(HIDDEN_Y, () => setIsMounted(false));
      }, DONE_HOLD_MS);
      return () => clearTimeout(timer);
    }
  }, [status, translateY]);

  // isMounted only keeps it alive through the slide-OUT. On the way in, the
  // status alone decides, so the bar appears on the first render rather than
  // waiting a frame for the effect.
  if (!isMounted && status === "idle") return null;

  const isSyncing = status === "syncing";

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.banner,
        status === "online" && styles.bannerOnline,
        { transform: [{ translateY }] },
      ]}
      accessibilityLiveRegion="polite"
    >
      {isSyncing ? <ActivityIndicator size="small" color={colors.text} /> : null}
      <Text style={[styles.label, status === "online" && styles.labelOnline]}>
        {isSyncing
          ? syncingMessage
          : status === "offline"
            ? offlineMessage
            : status === "online"
              ? onlineMessage
              : doneMessage}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: TOP_OFFSET,
    // A centred pill rather than a full-width bar.
    alignSelf: "center",
    width: "70%",
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
    backgroundColor: YELLOW,
  },
  bannerOnline: { backgroundColor: GREEN },
  label: { fontSize: 13, fontFamily: fonts.bodyBold, color: colors.text },
  labelOnline: { color: colors.white },
});
