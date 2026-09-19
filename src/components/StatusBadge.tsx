import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts } from "@constants/theme";

type Tone = "success" | "warning" | "danger" | "neutral";

type Props = {
  label: string;
  tone: Tone;
};

const TONE_COLORS: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: colors.primarySoft, fg: colors.primary },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  neutral: { bg: colors.neutralSoft, fg: colors.textMuted },
};

export function StatusBadge({ label, tone }: Props) {
  const { bg, fg } = TONE_COLORS[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, alignSelf: "flex-start" },
  label: { fontSize: 11, fontFamily: fonts.bodyMedium },
});
