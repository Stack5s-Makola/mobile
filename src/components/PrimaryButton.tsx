import React from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator, PressableProps } from "react-native";

type Props = PressableProps & {
  label: string;
  loading?: boolean;
};

export function PrimaryButton({ label, loading, disabled, style, ...rest }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style as object,
      ]}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.label}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#1a7f4b",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    width: "100%",
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  label: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
