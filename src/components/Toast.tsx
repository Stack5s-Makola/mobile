import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fonts, radii } from "@constants/theme";

// App-wide toast: slides down from the top, holds briefly, slides back up.
// Replaces Alert.alert for plain success/failure messages - Alert is still
// the right call for anything that asks the user to choose (log out?,
// delete listing?), because a toast can't carry buttons.
//
// Usage:
//   const { showToast } = useToast();
//   showToast("Shop updated", "success");
//   showToast(res.message, "error");

export type ToastType = "success" | "error";

type ToastState = { message: string; type: ToastType } | null;

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const VISIBLE_MS = 3000;
const SLIDE_MS = 250;
const OFFSCREEN = -160; // far enough to clear the tallest toast + its shadow

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const translateY = useRef(new Animated.Value(OFFSCREEN)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const hide = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    Animated.timing(translateY, {
      toValue: OFFSCREEN,
      duration: SLIDE_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      // Guard against unmounting a toast that a newer showToast just
      // animated back in.
      if (finished) setToast(null);
    });
  }, [translateY]);

  const showToast = useCallback(
    (message: string, type: ToastType = "error") => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setToast({ message, type });
      translateY.setValue(OFFSCREEN);
      Animated.timing(translateY, {
        toValue: 0,
        duration: SLIDE_MS,
        useNativeDriver: true,
      }).start();
      hideTimer.current = setTimeout(hide, VISIBLE_MS);
    },
    [hide, translateY]
  );

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.wrapper, { top: insets.top + 8, transform: [{ translateY }] }]}
        >
          <Pressable
            onPress={hide}
            accessibilityRole="alert"
            style={[
              styles.toast,
              toast.type === "success" ? styles.success : styles.error,
            ]}
          >
            <Text style={styles.text}>{toast.message}</Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    borderRadius: radii.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    // Lift it off whatever screen is behind it.
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  success: { backgroundColor: colors.success },
  error: { backgroundColor: colors.danger },
  text: {
    color: colors.white,
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    lineHeight: 20,
  },
});
