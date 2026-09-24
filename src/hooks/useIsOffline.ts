import { useEffect, useRef } from "react";
import { useNetworkState } from "expo-network";

// True when the device has no usable connection. Both flags start undefined
// while the first reading comes in, so only an explicit `false` counts as
// offline - otherwise the banner would flash on every launch.
export function useIsOffline(): boolean {
  const { isConnected, isInternetReachable } = useNetworkState();
  return isConnected === false || isInternetReachable === false;
}

type Handlers = {
  onOffline?: () => void;
  onOnline?: () => void;
};

/**
 * Fires on the *transitions*, not the state. `onOnline` only runs after a real
 * drop, so opening the app with a working connection doesn't announce "back
 * online" to someone who was never away.
 */
export function useConnectivityChange({ onOffline, onOnline }: Handlers): void {
  const isOffline = useIsOffline();
  const wasOffline = useRef(false);
  // Held in refs so a handler that closes over fresh state doesn't re-run this
  // effect on every render.
  const handlers = useRef<Handlers>({ onOffline, onOnline });
  handlers.current = { onOffline, onOnline };

  useEffect(() => {
    if (isOffline) {
      wasOffline.current = true;
      handlers.current.onOffline?.();
      return;
    }
    if (wasOffline.current) {
      wasOffline.current = false;
      handlers.current.onOnline?.();
    }
  }, [isOffline]);
}
