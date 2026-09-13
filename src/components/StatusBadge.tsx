import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts } from "@constants/theme";
import { StatusTone } from "@constants/sellerStatus";

type Props = {
  label: string;
  tone: StatusTone;
};

const TONES: Record<StatusTone, { bg: string; fg: string }> = {
  success: { bg: colors.primarySoft, fg: colors.primary },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
  neutral: { bg: colors.neutralSoft, fg: colors.textMuted },
};

export function StatusBadge({ label, tone }: Props) {
  const { bg, fg } = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  label: { fontSize: 11, fontFamily: fonts.bodySemiBold },
});
