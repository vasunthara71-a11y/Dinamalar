// hooks/useAppOptimization.js
import { useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { backgroundRefresh } from '../utils/backgroundRefresh';
import { dataPreloader } from '../utils/preloader';

export const useAppOptimization = () => {
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App coming to foreground
        backgroundRefresh.setAppBackgroundState(false);
        
        // Preload critical data
        setTimeout(() => {
          dataPreloader.preloadCriticalData();
        }, 1000);
      } else if (nextAppState.match(/inactive|background/)) {
        // App going to background
        backgroundRefresh.setAppBackgroundState(true);
      }
      
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Start background refresh
    backgroundRefresh.startBackgroundRefresh();

    // Initial preload
    dataPreloader.preloadCriticalData();

    return () => {
      subscription?.remove();
      backgroundRefresh.stopBackgroundRefresh();
    };
  }, []);

  const refreshData = useCallback((dataType) => {
    backgroundRefresh.refreshSpecificData(dataType);
  }, []);

  const preloadImages = useCallback((items) => {
    dataPreloader.preloadImages(items);
  }, []);

  return {
    refreshData,
    preloadImages,
  };
};
