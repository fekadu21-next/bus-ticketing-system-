import React from 'react';
import { StyleSheet, Text, View, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '@/constants/theme';

interface StatusBadgeProps {
  status: string;
  label?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  style,
  textStyle,
}) => {
  const normalized = (status || '').toUpperCase();
  const displayLabel = label || normalized.replace(/_/g, ' ');

  let badgeStyle: ViewStyle = styles.default;
  let textBadgeStyle: TextStyle = styles.defaultText;

  if (['CONFIRMED', 'VALID', 'ACTIVE', 'COMPLETED', 'VERIFIED', 'PAID', 'SUCCESS'].includes(normalized)) {
    badgeStyle = styles.success;
    textBadgeStyle = styles.successText;
  } else if (['CANCELLED', 'INVALID', 'EXPIRED', 'FAILED', 'REJECTED'].includes(normalized)) {
    badgeStyle = styles.danger;
    textBadgeStyle = styles.dangerText;
  } else if (['PENDING', 'HELD', 'ALREADY_USED', 'LOCKED', 'WAITING'].includes(normalized)) {
    badgeStyle = styles.warning;
    textBadgeStyle = styles.warningText;
  } else if (['SCHEDULED', 'IN_TRANSIT', 'BOARDING', 'INFO'].includes(normalized)) {
    badgeStyle = styles.info;
    textBadgeStyle = styles.infoText;
  }

  return (
    <View style={[styles.badge, badgeStyle, style]}>
      <Text style={[styles.text, textBadgeStyle, textStyle]}>{displayLabel}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.radius.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  default: {
    backgroundColor: Theme.colors.bgSurfaceHover,
    borderColor: Theme.colors.border,
  },
  defaultText: {
    color: Theme.colors.textMuted,
  },
  success: {
    backgroundColor: Theme.colors.successLight,
    borderColor: Theme.colors.successBorder,
  },
  successText: {
    color: Theme.colors.successDark,
  },
  danger: {
    backgroundColor: Theme.colors.dangerLight,
    borderColor: Theme.colors.dangerBorder,
  },
  dangerText: {
    color: Theme.colors.dangerDark,
  },
  warning: {
    backgroundColor: Theme.colors.warningLight,
    borderColor: Theme.colors.warningBorder,
  },
  warningText: {
    color: Theme.colors.warningDark,
  },
  info: {
    backgroundColor: Theme.colors.infoLight,
    borderColor: Theme.colors.infoBorder,
  },
  infoText: {
    color: Theme.colors.infoDark,
  },
});
