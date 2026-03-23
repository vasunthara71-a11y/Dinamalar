// utils/backgroundRefresh.js
import { dataPreloader } from './preloader';

class BackgroundRefresh {
  constructor() {
    this.refreshInterval = null;
    this.isAppInBackground = false;
    this.REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
  }

  startBackgroundRefresh() {
    // Clear any existing interval
    this.stopBackgroundRefresh();
    
    // Start periodic refresh
    this.refreshInterval = setInterval(() => {
      if (!this.isAppInBackground) {
        this.performBackgroundRefresh();
      }
    }, this.REFRESH_INTERVAL);
  }

  stopBackgroundRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  async performBackgroundRefresh() {
    try {
      // Refresh critical data silently
      await dataPreloader.preloadCriticalData();
    } catch (error) {
      console.warn('Background refresh failed:', error);
    }
  }

  setAppBackgroundState(isInBackground) {
    this.isAppInBackground = isInBackground;
    
    if (isInBackground) {
      // Stop refresh when app is in background
      this.stopBackgroundRefresh();
    } else {
      // Resume refresh when app comes to foreground
      this.startBackgroundRefresh();
      // Also do an immediate refresh
      setTimeout(() => this.performBackgroundRefresh(), 1000);
    }
  }

  // Force refresh specific data
  async refreshSpecificData(dataType) {
    switch (dataType) {
      case 'home':
        await dataPreloader.preloadInBackground('home', () => 
          import('../config/api').then(({ api }) => api.getHome())
        );
        break;
      case 'news':
        await Promise.all([
          dataPreloader.preloadInBackground('tamilagam', () => 
            import('../config/api').then(({ api }) => api.getTamilagam())
          ),
          dataPreloader.preloadInBackground('india', () => 
            import('../config/api').then(({ api }) => api.getIndia())
          ),
        ]);
        break;
      default:
        await this.performBackgroundRefresh();
    }
  }
}

export const backgroundRefresh = new BackgroundRefresh();
