import { ms } from 'react-native-size-matters';

// Global font scale factor - this will be updated by FontSizeContext
let globalFontScale = 1.0;

// Function to set the global font scale
export const setGlobalFontScale = (scale) => {
  globalFontScale = scale;
};

// Function to get the current global font scale
export const getGlobalFontScale = () => {
  return globalFontScale;
};

// Function to scale font sizes
export const scaleFont = (size) => {
  // Apply moderate scale first for responsive design, then apply user's font scale
  const responsiveSize = ms(size);
  return Math.round(responsiveSize * globalFontScale);
};

// Function to scale text styles
export const scaleTextStyle = (style) => {
  if (!style || typeof style !== 'object') return style;
  
  const scaledStyle = { ...style };
  
  if (scaledStyle.fontSize) {
    scaledStyle.fontSize = scaleFont(scaledStyle.fontSize);
  }
  
  if (scaledStyle.lineHeight) {
    scaledStyle.lineHeight = scaleFont(scaledStyle.lineHeight);
  }
  
  return scaledStyle;
};

// Hook to get current font scale and update styles
export const useFontScale = () => {
  const { fontSizeScale } = require('../context/FontSizeContext').useFontSize();
  
  // Update global scale when context changes
  setGlobalFontScale(fontSizeScale);
  
  return {
    fontSizeScale,
    scaleFont,
    scaleTextStyle,
  };
};
