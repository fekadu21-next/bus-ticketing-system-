import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Theme } from '@/constants/theme';

interface AlertBannerProps {
  type?: 'error' | 'success' | 'warning' | 'info';
  message: string;
  title?: string;
  style?: ViewStyle;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type = 'error',
  message,
  title,
  style,
}) => {
  if (!message) return null;

  const icons = {
    error: '⚠️',
    success: '✅',
    warning: '⚡',
    info: 'ℹ️',
  };

  return (
    <View style={[styles.container, styles[type], style]}>
      <Text style={styles.icon}>{icons[type]}</Text>
      <View style={styles.textContainer}>
        {title && <Text style={[styles.title, styles[`${type}Title`]]}>{title}</Text>}
        <Text style={[styles.message, styles[`${type}Text`]]}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    marginBottom: 16,
  },
  icon: {
    fontSize: 16,
    marginRight: 10,
    marginTop: 1,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  error: {
    backgroundColor: Theme.colors.dangerLight,
    borderColor: Theme.colors.dangerBorder,
  },
  errorTitle: {
    color: Theme.colors.dangerDark,
  },
  errorText: {
    color: Theme.colors.dangerDark,
  },
  success: {
    backgroundColor: Theme.colors.successLight,
    borderColor: Theme.colors.successBorder,
  },
  successTitle: {
    color: Theme.colors.successDark,
  },
  successText: {
    color: Theme.colors.successDark,
  },
  warning: {
    backgroundColor: Theme.colors.warningLight,
    borderColor: Theme.colors.warningBorder,
  },
  warningTitle: {
    color: Theme.colors.warningDark,
  },
  warningText: {
    color: Theme.colors.warningDark,
  },
  info: {
    backgroundColor: Theme.colors.infoLight,
    borderColor: Theme.colors.infoBorder,
  },
  infoTitle: {
    color: Theme.colors.infoDark,
  },
  infoText: {
    color: Theme.colors.infoDark,
  },
});
