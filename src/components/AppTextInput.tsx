import React from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
} from "react-native";
import { colors, fonts, radii } from "@constants/theme";

type Props = TextInputProps & {
  label?: string;
  icon?: React.ReactNode;
  // Field-level message - shown under the field and reddens the border.
  error?: string;
};

export function AppTextInput({ label, icon, error, style, ...rest }: Props) {
  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputRow}>
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <TextInput
          style={[
            styles.input,
            icon ? styles.inputWithIcon : null,
            error ? styles.inputError : null,
            style as object,
          ]}
          placeholderTextColor={colors.textMuted}
          {...rest}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: "100%" },
  inputError: { borderColor: colors.danger },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: fonts.bodyRegular,
    color: colors.danger,
  },
  label: {
    fontSize: 16,
    color: colors.text,
    fontFamily: fonts.headline,
    marginBottom: 8,
  },
  inputRow: { position: "relative", justifyContent: "center" },
  icon: { position: "absolute", left: 14, zIndex: 1 },
  input: {
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radii.button,
    paddingHorizontal: 14,
    height: 52,
    fontSize: 14,
    fontFamily: fonts.bodyRegular,
    width: "100%",
    color: colors.text,
  },
  inputWithIcon: { paddingLeft: 46 },
});
