import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Theme } from '@/constants/theme';

interface AppTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
}

export const AppTextInput: React.FC<AppTextInputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  isPassword = false,
  containerStyle,
  style,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(!isPassword);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputWrapperFocused,
          Boolean(error) && styles.inputWrapperError,
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
        <TextInput
          placeholderTextColor={Theme.colors.textSubtle}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[styles.input, style]}
          {...rest}
        />
        {isPassword ? (
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword((prev) => !prev)}
            activeOpacity={0.7}
          >
            <Text style={styles.eyeText}>{showPassword ? '👁' : '🔒'}</Text>
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightIconContainer}>{rightIcon}</View>
        ) : null}
      </View>
      {Boolean(error) && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textMain,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.bgCard,
    borderWidth: 1.2,
    borderColor: Theme.colors.borderDark,
    borderRadius: Theme.radius.md,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  inputWrapperFocused: {
    borderColor: Theme.colors.borderFocus,
    backgroundColor: '#ffffff',
  },
  inputWrapperError: {
    borderColor: Theme.colors.danger,
    backgroundColor: '#fffdfd',
  },
  leftIconContainer: {
    marginRight: 8,
  },
  rightIconContainer: {
    marginLeft: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Theme.colors.textMain,
    paddingVertical: 10,
  },
  eyeButton: {
    padding: 6,
  },
  eyeText: {
    fontSize: 16,
    color: Theme.colors.textMuted,
  },
  errorText: {
    fontSize: 12,
    color: Theme.colors.danger,
    marginTop: 4,
    fontWeight: '500',
  },
});
