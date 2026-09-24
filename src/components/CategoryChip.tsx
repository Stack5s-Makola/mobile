import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { colors, fonts, radii } from "@constants/theme";
import type { LucideIcon } from "lucide-react-native";

type Props = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  onPress?: () => void;
};

export function CategoryChip({ label, icon, active, onPress }: Props) {
  const Icon = icon;

  return (
    <Pressable
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
      onPress={onPress}
    >
      <Icon
        size={15}
        color={active ? colors.white : colors.primary}
        strokeWidth={2}
      />
      <Text
        style={[
          styles.label,
          active ? styles.labelActive : styles.labelInactive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.button,
    marginRight: 8,
  },
  chipActive: { backgroundColor: colors.primary },
  chipInactive: { backgroundColor: colors.neutralSoft },
  label: { fontSize: 12, fontFamily: fonts.bodyMedium },
  labelActive: { color: colors.white },
  labelInactive: { color: colors.primary },
});
