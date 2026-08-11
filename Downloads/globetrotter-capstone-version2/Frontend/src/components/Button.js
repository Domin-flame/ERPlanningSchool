import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../config/theme';

const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  loading = false,
  disabled = false,
  icon = null,
  style,
}) => {
  const buttonStyles = [
    styles.button,
    styles[variant],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? COLORS.surface : COLORS.primary} 
        />
      ) : (
        <>
          {icon}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    minHeight: 52,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.lg,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Primary
  primary: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.md,
  },
  primaryText: {
    color: COLORS.surface,
  },
  
  // Secondary
  secondary: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.bleuGlacier,
    ...SHADOWS.sm,
  },
  secondaryText: {
    color: COLORS.textPrimary,
  },
  
  // Ghost
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.bleuGlacier,
  },
  ghostText: {
    color: COLORS.textPrimary,
  },
  
  // Disabled
  disabled: {
    opacity: 0.5,
  },
});

export default Button;
