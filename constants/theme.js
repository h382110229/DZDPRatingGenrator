export const theme = {
  colors: {
    // Background Hierarchy
    background: '#000000',
    surface: '#0D0D0D',           // Surface level (separated from background)
    surfaceElevated: '#1A1A1A',   // Elevated surface (cards, modals)
    surfaceHover: '#242424',      // Hover/Selected state

    // Brand Colors
    primary: '#D4AF37',
    primaryLight: '#E8C84A',
    primaryDark: '#B8962E',
    primarySubtle: 'rgba(212, 175, 55, 0.1)',
    secondary: '#9E9E9E',         // Defined to fix undefined reference

    // Text
    text: '#FFFFFF',
    textSecondary: '#9E9E9E',     // Improved contrast ~5.5:1
    textTertiary: '#666666',

    // Borders
    border: '#2A2A2A',            // Improved contrast ~2.5:1
    borderLight: '#1A1A1A',

    // Semantic Colors
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 8,     // Inputs, buttons
    md: 12,    // Cards, modals
    lg: 16,    // Large cards, bottom sheets
    xl: 24,    // Brand elements
  }
};
