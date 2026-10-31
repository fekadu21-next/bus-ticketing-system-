import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Theme } from '@/constants/theme';

interface AppButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle | TextStyle[];
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  disabled,
  style,
  textStyle,
  ...rest
}) => {
  const isActionDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isActionDisabled}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        isActionDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'outline' || variant === 'ghost' || variant === 'secondary'
              ? Theme.colors.primary
              : Theme.colors.textWhite
          }
        />
      ) : (
        <>
          {icon && iconPosition === 'left' ? <>{icon}</> : null}
          <Text
            style={[
              styles.textBase,
              styles[`text_${variant}`],
              styles[`textSize_${size}`],
              isActionDisabled && styles.textDisabled,
              icon && iconPosition === 'left' ? { marginLeft: 8 } : null,
              icon && iconPosition === 'right' ? { marginRight: 8 } : null,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' ? <>{icon}</> : null}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Theme.radius.md,
  },
  // Variants
  primary: {
    backgroundColor: Theme.colors.primary,
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: Theme.colors.primaryLight,
    borderWidth: 1,
    borderColor: Theme.colors.primaryBorder,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Theme.colors.borderDark,
  },
  danger: {
    backgroundColor: Theme.colors.danger,
    borderWidth: 0,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  // Sizes
  size_sm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Theme.radius.sm,
  },
  size_md: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: Theme.radius.md,
  },
  size_lg: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: Theme.radius.lg,
  },
  // Text Styles
  textBase: {
    fontWeight: '700',
    textAlign: 'center',
  },
  text_primary: {
    color: Theme.colors.textWhite,
  },
  text_secondary: {
    color: Theme.colors.primary,
  },
  text_outline: {
    color: Theme.colors.textMain,
  },
  text_danger: {
    color: Theme.colors.textWhite,
  },
  text_ghost: {
    color: Theme.colors.primary,
  },
  // Size text
  textSize_sm: {
    fontSize: 13,
  },
  textSize_md: {
    fontSize: 15,
  },
  textSize_lg: {
    fontSize: 16,
  },
  // Disabled
  disabled: {
    opacity: 0.55,
  },
  textDisabled: {
    opacity: 0.8,
  },
});
