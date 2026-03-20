// utils/imageCache.js
import { Image } from 'react-native';

// Simple image cache for better performance
const imageCache = new Map();

export const getCachedImage = (uri) => {
  if (!uri) return null;
  
  // Check if already cached
  if (imageCache.has(uri)) {
    return imageCache.get(uri);
  }
  
  // Cache the image
  const cachedImage = { uri };
  imageCache.set(uri, cachedImage);
  
  // Clean cache if too large (keep last 50 images)
  if (imageCache.size > 50) {
    const firstKey = imageCache.keys().next().value;
    imageCache.delete(firstKey);
  }
  
  return cachedImage;
};

export const preloadImages = async (imageUrls) => {
  if (!Array.isArray(imageUrls)) return;
  
  const validUrls = imageUrls.filter(url => url && typeof url === 'string');
  if (validUrls.length === 0) return;
  
  try {
    await Image.prefetch(validUrls);
  } catch (error) {
    console.warn('Image prefetch error:', error);
  }
};

export const clearImageCache = () => {
  imageCache.clear();
};
