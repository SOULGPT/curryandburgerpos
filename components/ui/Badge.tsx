import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '../../constants/Theme';

interface BadgeProps {
  label: string;
  type?: 'neutral' | 'new' | 'hot' | 'chef' | 'preparing' | 'ready';
}

export function Badge({ label, type = 'neutral' }: BadgeProps) {
  let backgroundColor = Theme.colors.mutedBrown;
  let textColor = Theme.colors.white;

  switch (type) {
    case 'new':
      backgroundColor = Theme.colors.primaryOrange;
      break;
    case 'hot':
      backgroundColor = Theme.colors.dangerRed;
      break;
    case 'chef':
      backgroundColor = Theme.colors.amber;
      textColor = Theme.colors.darkBrown;
      break;
    case 'preparing':
      backgroundColor = 'rgba(244, 160, 18, 0.15)'; // amber 15%
      textColor = Theme.colors.amber;
      break;
    case 'ready':
      backgroundColor = 'rgba(39, 174, 96, 0.15)'; // emerald 15%
      textColor = Theme.colors.emerald;
      break;
  }

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.pill,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: Theme.typography.label.fontFamily,
    fontSize: 10,
    fontWeight: '700',
  }
});
