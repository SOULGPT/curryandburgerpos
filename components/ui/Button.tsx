import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, StyleProp } from 'react-native';
import { Theme } from '../../constants/Theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive' | 'kitchenPronto';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
  loading?: boolean;
}

export function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  style, 
  textStyle, 
  disabled = false,
  loading = false
}: ButtonProps) {
  let backgroundColor = Theme.colors.primaryOrange;
  let color = Theme.colors.white;
  let borderColor = Theme.colors.transparent;
  let borderWidth = 0;

  if (variant === 'secondary') {
    backgroundColor = Theme.colors.white;
    color = Theme.colors.darkBrown;
    borderColor = Theme.colors.darkBrown;
    borderWidth = 1;
  } else if (variant === 'destructive') {
    backgroundColor = Theme.colors.white;
    color = Theme.colors.dangerRed;
    borderColor = Theme.colors.dangerRed;
    borderWidth = 1;
  } else if (variant === 'kitchenPronto') {
    backgroundColor = Theme.colors.emerald;
    color = Theme.colors.white;
  }

  const opacity = disabled ? 0.6 : 1;

  return (
    <TouchableOpacity
      style={[
        styles.button, 
        { backgroundColor, borderColor, borderWidth, opacity },
        variant === 'primary' && styles.shadow,
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Text style={[styles.text, { color }, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: Theme.radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: Theme.spacing.lg,
  },
  text: {
    fontFamily: Theme.typography.label.fontFamily,
    fontSize: Theme.typography.label.fontSize,
    fontWeight: '800',
  },
  shadow: {
    shadowColor: Theme.colors.primaryOrange,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  }
});
