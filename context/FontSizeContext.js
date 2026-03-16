// src/context/FontSizeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ─── Global sf fallback for emergency situations ───────────────────────────────
// This prevents "Property 'sf' doesn't exist" errors during initialization
if (typeof global !== 'undefined') {
  global.sf = global.sf || ((size) => {
    console.warn('Global sf fallback called with size:', size);
    return size;
  });
  global.ss = global.ss || ((size) => size);
  global.slh = global.slh || ((size) => size);
  global.sv = global.sv || ((size) => vs(size));
  global.sh = global.sh || ((size) => s(size));
}
if (typeof window !== 'undefined') {
  window.sf = window.sf || ((size) => {
    console.warn('Window sf fallback called with size:', size);
    return size;
  });
  window.ss = window.ss || ((size) => size);
  window.slh = window.slh || ((size) => size);
  window.sv = window.sv || ((size) => vs(size));
  window.sh = window.sh || ((size) => s(size));
}

const FONT_SCALES = {
  small:      0.875, // 14px from base 16px
  normal:     1.25,   // 16px from base 16px  
  large:      1.35,  // 20px from base 16px
  extraLarge: 1.5,   // 24px from base 16px
  // huge:       1.625, // 26px from base 16px
};

// Tamil labels for font sizes
const FONT_SIZE_LABELS = {
  small:      'சிறிய',       // 14px
  normal:     'இயல்பு',      // 16px
  large:      'பெரிய',      // 20px
  extraLarge: 'மிகப் பெரிய', // 24px
  // huge:       'மிகப் பெரிய', // 26px
};

export const THEME_COLORS = {
  black: '#1a1a1a',
  blue:  '#1565C0',
  brown: '#7B5E2A',
  red:   '#c62828',
};

const FONT_SIZE_KEY   = 'dinamalar_font_size';
const THEME_COLOR_KEY = 'dinamalar_theme_color';

const storage = {
  async get(key) {
    try {
      if (Platform.OS === 'web') return localStorage.getItem(key);
      return await SecureStore.getItemAsync(key);
    } catch (e) { return null; }
  },
  async set(key, value) {
    try {
      if (Platform.OS === 'web') localStorage.setItem(key, value);
      else await SecureStore.setItemAsync(key, value);
    } catch (e) {}
  },
};

const FontSizeContext = createContext({
  currentSize: 'normal',
  fontSizeScale: 1.0,
  availableSizes: ['small', 'normal', 'large', 'extraLarge', 'huge'],
  changeFontSize: () => {},
  themeColorId: 'red',
  themeColor: '#c62828',
  changeThemeColor: () => {},
  THEME_COLORS,
  FONT_SCALES,
  FONT_SIZE_LABELS,
  sf: (size) => size,
});

export const useFontSize = () => {
  const ctx = useContext(FontSizeContext);
  
  // Return fallback values if context is not provided
  if (!ctx) {
    console.error('FontSizeContext is undefined! Stack trace:', new Error().stack);
    return {
      currentSize: 'normal',
      fontSizeScale: 1.0,
      availableSizes: ['small', 'normal', 'large', 'extraLarge', 'huge'],
      changeFontSize: () => {},
      themeColorId: 'red',
      themeColor: '#c62828',
      changeThemeColor: () => {},
      THEME_COLORS,
      FONT_SCALES,
      FONT_SIZE_LABELS,
      sf: (size) => {
        console.warn('sf fallback called with size:', size, 'caller:', new Error().stack);
        return size;
      },
      ss: (size) => size,
      slh: (size) => size,
      sv: (size) => vs(size),
      sh: (size) => s(size),
    };
  }
  
  // Ensure sf is always a function
  const sf = ctx.sf || ((size) => {
    console.warn('sf was not a function, using fallback. size:', size);
    return size;
  });
  
  // Return context with safe sf function
  return {
    ...ctx,
    sf: (size) => {
      try {
        if (typeof ctx.sf === 'function') {
          return ctx.sf(size);
        } else {
          console.warn('sf is not a function, returning size:', size);
          return size;
        }
      } catch (error) {
        console.error('Error calling sf:', error, 'size:', size);
        return size;
      }
    },
    ss: ctx.ss || ((size) => size),
    slh: ctx.slh || ((size) => size),
    sv: ctx.sv || ((size) => vs(size)),
    sh: ctx.sh || ((size) => s(size)),
  };
};

export const FontSizeProvider = ({ children }) => {
  const [currentSize, setCurrentSize] = useState('normal');
  const [themeColorId, setThemeColorId] = useState('red');

  const fontSizeScale = FONT_SCALES[currentSize] || 1.0;
  const themeColor    = THEME_COLORS[themeColorId] || THEME_COLORS.red;

  // Load saved prefs on app start
  useEffect(() => {
    (async () => {
      const savedSize  = await storage.get(FONT_SIZE_KEY);
      const savedColor = await storage.get(THEME_COLOR_KEY);
      if (savedSize  && FONT_SCALES[savedSize])       setCurrentSize(savedSize);
      if (savedColor && THEME_COLORS[savedColor])     setThemeColorId(savedColor);
    })();
  }, []);

  const changeFontSize = (size) => {
    if (!FONT_SCALES[size]) return;
    setCurrentSize(size);
    storage.set(FONT_SIZE_KEY, size);
  };

  const changeThemeColor = (colorId) => {
    if (!THEME_COLORS[colorId]) return;
    setThemeColorId(colorId);
    storage.set(THEME_COLOR_KEY, colorId);
  };

  // sf = scale font — use this everywhere instead of scaleFont()
  // It re-runs on every render because it reads fontSizeScale from state
  const sf = (size) => Math.round(size * fontSizeScale);
  
  // ss = scale spacing - for margins, padding, etc.
  const ss = (size) => Math.round(size * fontSizeScale);
  
  // slh = scale line height - for line heights
  const slh = (size) => Math.round(size * fontSizeScale);
  
  // sv = scale vertical spacing - for vs() function
  const sv = (size) => vs(size * fontSizeScale);
  
  // sh = scale horizontal spacing - for s() function  
  const sh = (size) => s(size * fontSizeScale);

  const availableSizes = Object.keys(FONT_SCALES);

  return (
    <FontSizeContext.Provider value={{
      currentSize,
      fontSizeScale,
      availableSizes,
      changeFontSize,
      themeColorId,
      themeColor,
      changeThemeColor,
      THEME_COLORS,
      FONT_SCALES,
      FONT_SIZE_LABELS,
      sf, // scale font
      ss, // scale spacing
      slh, // scale line height
      sv, // scale vertical spacing
      sh, // scale horizontal spacing
    }}>
      {children}
    </FontSizeContext.Provider>
  );
};
