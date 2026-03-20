// utils/preloader.js
import { api } from '../config/api';

class DataPreloader {
  constructor() {
    this.preloadedData = new Map();
    this.preloadingPromises = new Map();
    this.lastPreloadTime = 0;
    this.PRELOAD_INTERVAL = 5 * 60 * 1000; // 5 minutes
  }

  // Preload critical data in background
  async preloadCriticalData() {
    const now = Date.now();
    if (now - this.lastPreloadTime < this.PRELOAD_INTERVAL) {
      return; // Don't preload too frequently
    }
    
    this.lastPreloadTime = now;
    
    // Preload home data (most critical)
    this.preloadInBackground('home', () => api.getHome());
    
    // Preload popular categories
    this.preloadInBackground('tamilagam', () => api.getTamilagam());
    this.preloadInBackground('india', () => api.getIndia());
    this.preloadInBackground('world', () => api.getWorld());
    
    // Preload short news (fast loading)
    this.preloadInBackground('shortnews', () => api.getLatestNotify());
  }

  preloadInBackground(key, fetchFunction) {
    // Don't preload if already in progress
    if (this.preloadingPromises.has(key)) {
      return this.preloadingPromises.get(key);
    }

    const promise = fetchFunction()
      .then(response => {
        this.preloadedData.set(key, {
          data: response.data,
          timestamp: Date.now()
        });
        this.preloadingPromises.delete(key);
        return response.data;
      })
      .catch(error => {
        console.warn(`Preload failed for ${key}:`, error);
        this.preloadingPromises.delete(key);
        return null;
      });

    this.preloadingPromises.set(key, promise);
    return promise;
  }

  getPreloadedData(key, maxAge = 5 * 60 * 1000) { // 5 minutes
    const cached = this.preloadedData.get(key);
    if (cached && (Date.now() - cached.timestamp) < maxAge) {
      return cached.data;
    }
    return null;
  }

  // Preload images from a list of items
  preloadImages(items, imageKey = 'images') {
    const imageUrls = items
      .map(item => item[imageKey])
      .filter(url => url && typeof url === 'string')
      .slice(0, 10); // Limit to first 10 images

    if (imageUrls.length > 0) {
      import('./imageCache').then(({ preloadImages }) => {
        preloadImages(imageUrls);
      });
    }
  }

  clearCache() {
    this.preloadedData.clear();
    this.preloadingPromises.clear();
  }
}

export const dataPreloader = new DataPreloader();
