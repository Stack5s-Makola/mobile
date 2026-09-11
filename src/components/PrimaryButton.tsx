import React from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator, PressableProps } from "react-native";
import { colors, fonts, radii } from "@constants/theme";

type Props = PressableProps & {
  label: string;
  loading?: boolean;
  variant?: "solid" | "outline";
};

export function PrimaryButton({ label, loading, disabled, variant = "solid", style, ...rest }: Props) {
  const isOutline = variant === "outline";
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        isOutline ? styles.outline : styles.solid,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style as object,
      ]}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? colors.primary : colors.white} />
      ) : (
        <Text style={[styles.label, isOutline && styles.labelOutline]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radii.button,
    borderWidth: 3,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 54,
  },
  solid: { backgroundColor: colors.primary, borderColor: colors.primary },
  outline: { backgroundColor: "transparent", borderColor: colors.primary },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.85 },
  label: { color: colors.white, fontSize: 16, fontFamily: fonts.bodySemiBold },
  labelOutline: { color: colors.primary, fontFamily: fonts.bodyMedium },
});
