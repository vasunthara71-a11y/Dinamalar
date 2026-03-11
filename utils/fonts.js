import { Platform } from 'react-native';

// ─── Font Configuration ───────────────────────────────────────────────────────────────
export const FONTS = {
  // Primary Tamil font
  muktaMalar: {
    family: 'MuktaMalar',
    // Different weights for different text styles
    regular: 'MuktaMalar',
    medium: 'MuktaMalar-Medium',
    semibold: 'MuktaMalar-SemiBold',
    bold: 'MuktaMalar-Bold',
  },
  
  // Fallback fonts
  system: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
};

// ─── Font Weight Mapping ───────────────────────────────────────────────────────────
export const FONT_WEIGHTS = {
  300: 'MuktaMalar-Light',
  400: 'MuktaMalar',
  500: 'MuktaMalar-Medium', 
  600: 'MuktaMalar-SemiBold',
  700: 'MuktaMalar-Bold',
};

// ─── Helper Functions ───────────────────────────────────────────────────────────────
export const getFontFamily = (weight = 400) => {
  return FONT_WEIGHTS[weight] || FONT_WEIGHTS[400];
};

// ─── Tamil Text Detection ─────────────────────────────────────────────────────────
export const isTamilText = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  // Unicode range for Tamil characters
  const tamilRegex = /[\u0B80-\u0BFF\u0B95\u0B99\u0B9A\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8\u0BA9\u0BAE\u0BAF\u0BB0\u0BB1\u0BB2\u0BB4\u0BB5\u0BB6\u0BB7\u0BB8\u0BB9\u0BBB\u0BBE\u0BBF\u0BC0\u0BC1\u0BC2\u0BC6\u0BC7\u0BC8\u0BCB\u0BCD\u0BE6\u0BE7\u0BE8\u0BE9\u0BEA\u0BEB\u0BEC\u0BED\u0BEE\u0BEF\u0BF0\u0BF1\u0BF2\u0BF3\u0BF4\u0BF5\u0BF6\u0BF7\u0BF8\u0BF9\u0BFA]/;
  
  return tamilRegex.test(text);
};

// ─── Smart Font Selection ───────────────────────────────────────────────────────────
export const getSmartFont = (text, defaultFont = null) => {
  // If text contains Tamil characters, use MuktaMalar
  if (isTamilText(text)) {
    return getFontFamily(400); // Regular weight by default
  }
  
  // Otherwise use default font or system font
  return defaultFont || FONTS.system;
};

// ─── Default Font Styles ───────────────────────────────────────────────────────────
export const FONT_STYLES = {
  // Tamil text styles
  tamil: {
    fontFamily: 'MuktaMalar',
    fontSize: 14,
    color: '#000',
    lineHeight: 22,
  },
  
  // English text styles  
  english: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  
  // Mixed content (Tamil + English)
  mixed: {
    fontFamily: 'MuktaMalar',
    fontSize: 14,
    color: '#000',
    lineHeight: 22,
  },
};
