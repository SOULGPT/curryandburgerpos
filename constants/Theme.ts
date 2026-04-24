import { Platform } from 'react-native';

export const Theme = {
  colors: {
    primaryOrange: '#E8500A',
    orangeLight: '#FF6B2B',
    darkBrown: '#1A0A00',
    cream: '#FFF8F0',
    amber: '#F4A012',
    emerald: '#27AE60',
    dangerRed: '#C0392B',
    mutedBrown: '#7A5C4A',
    border: 'rgba(232,80,10,0.15)',
    white: '#FFFFFF',
    transparent: 'transparent',
  },
  typography: {
    display: {
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
      fontSize: 32,
      fontWeight: '800',
    },
    heading: {
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
      fontSize: 22,
      fontWeight: '700',
    },
    body: {
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
      fontSize: 16,
      fontWeight: '500',
    },
    label: {
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
      fontSize: 12,
      fontWeight: '600',
    },

    price: {
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
      fontSize: 16,
      fontWeight: '800',
      color: '#E8500A',
    },

  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    pill: 9999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
};
