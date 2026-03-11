import { scale, verticalScale, moderateScale, moderateVerticalScale } from 'react-native-size-matters';

// Export scaling functions for consistent use across the app
export const s = scale;
export const vs = verticalScale;
export const ms = moderateScale;
export const mvs = moderateVerticalScale;

// Common scaled values for consistency
export const scaledSizes = {
  // Padding and margins
  padding: {
    xs: ms(4),
    sm: ms(8),
    md: ms(12),
    lg: ms(16),
    xl: ms(20),
    xxl: ms(24),
    xxxl: ms(32),
  },
  // Font sizes
  font: {
    xs: ms(10),
    sm: ms(12),
    md: ms(14),
    lg: ms(16),
    xl: ms(18),
    xxl: ms(20),
    xxxl: ms(24),
    huge: ms(28),
  },
  // Icon sizes
  icon: {
    xs: ms(12),
    sm: ms(14),
    md: ms(16),
    lg: ms(18),
    xl: ms(20),
    xxl: ms(24),
    xxxl:ms(24)
  },
  // Line heights
  lineHeight: {
    sm: ms(16),
    md: ms(20),
    lg: ms(22),
    xl: ms(26),
    xxl: ms(30),
  },
  // Border radius
  radius: {
    xs: ms(4),
    sm: ms(6),
    md: ms(8),
    lg: ms(12),
    xl: ms(16),
    xxl: ms(20),
  },
  // Spacing
  spacing: {
    xs: ms(2),
    sm: ms(4),
    md: ms(8),
    lg: ms(12),
    xl: ms(16),
    xxl: ms(20),
  },
  // Heights
  height: {
    xs: vs(40),
    sm: vs(50),
    md: vs(60),
    lg: vs(80),
    xl: vs(100),
    xxl: vs(120),
    xxxl: vs(150),
  },
  // Widths
  width: {
    xs: s(40),
    sm: s(50),
    md: s(60),
    lg: s(80),
    xl: s(100),
    xxl: s(120),
    xxxl: s(150),
  },
};

// ─── Font Utilities ───────────────────────────────────────────────────────────
export const getTamilFont = (weight = 'regular') => {
  const fontMap = {
    light: 'MuktaMalar-Light',
    regular: 'MuktaMalar',
    medium: 'MuktaMalar-Medium',
    semibold: 'MuktaMalar-SemiBold',
    bold: 'MuktaMalar-Bold',
  };
  return fontMap[weight] || fontMap.regular;
};

export const getFontStyle = (size = 14, weight = 'regular', color = '#000') => {
  return {
    fontFamily: getTamilFont(weight),
    fontSize: ms(size),
    color: color,
    lineHeight: ms(size * 1.6),
  };
};

export const getTamilHeaderStyle = (size = 18, weight = 'bold', color = '#000') => {
  return {
    fontFamily: getTamilFont(weight),
    fontSize: ms(size),
    fontWeight: weight,
    color: color,
    lineHeight: ms(size * 1.4),
  };
};
