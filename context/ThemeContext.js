// ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { COLORS } from '../utils/constants';

// Define theme colors
export const THEMES = {
  light: {
    background: '#f2f2f2',
    cardBackground: '#ffffff',
    text: '#212B36',
    textSecondary: '#637381',
    border: '#EBEBEB',
    tabBar: '#ffffff',
    tabBarActive: '#096DD2',
    header: '#ffffff',
    shadow: 'rgba(0, 0, 0, 0.1)',
    placeholder: '#919EAB',
    // Keep existing colors that work well in both modes
    primary: COLORS.primary,
    success: COLORS.success,
    warning: COLORS.warning,
    error: COLORS.error,
  },
  dark: {
    background: '#121212',
    cardBackground: '#1e1e1e',
    text: '#ffffff',
    textSecondary: '#b3b3b3',
    border: '#333333',
    tabBar: '#1e1e1e',
    tabBarActive: '#096DD2',
    header: '#1e1e1e',
    shadow: 'rgba(0, 0, 0, 0.3)',
    placeholder: '#666666',
    // Keep existing colors that work well in both modes
    primary: COLORS.primary,
    success: COLORS.success,
    warning: COLORS.warning,
    error: COLORS.error,
  },
};

// Create context
const ThemeContext = createContext();

// Theme provider component
export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [theme, setTheme] = useState(THEMES.light);

  // Toggle theme
  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    setTheme(newMode ? THEMES.dark : THEMES.light);
    
    // Save preference to AsyncStorage
    try {
      require('@react-native-async-storage/async-storage').default.setItem('darkMode', JSON.stringify(newMode));
    } catch (error) {
      console.log('Error saving theme preference:', error);
    }
  };

  // Load saved theme on app start
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await require('@react-native-async-storage/async-storage').default.getItem('darkMode');
        if (saved !== null) {
          const savedMode = JSON.parse(saved);
          setIsDarkMode(savedMode);
          setTheme(savedMode ? THEMES.dark : THEMES.light);
        }
      } catch (error) {
        console.log('Error loading theme preference:', error);
      }
    };
    loadTheme();
  }, []);

  const value = {
    isDarkMode,
    theme,
    toggleTheme,
    colors: theme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
