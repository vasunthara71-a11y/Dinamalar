// services/mobileNotificationService.js - Mobile notifications with sound
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  isExpoGo, 
  getNotificationStatus, 
  showSafeNotification,
  playSafeNotificationSound,
  initializeSafeNotifications
} from './notificationCompatibilityService';

// ── Configure Notifications ─────────────────────────────────────────────────────────
export async function configureNotifications() {
  try {
    // Use compatibility service to handle Expo Go vs development builds
    const result = await initializeSafeNotifications();
    
    if (!result.success) {
      console.log('🔴 Failed to initialize notifications:', result.error);
      return false;
    }

    console.log('✅ Notifications configured:', result.message);
    return true;
  } catch (error) {
    console.error('🔴 Failed to configure notifications:', error);
    return false;
  }
}

// ── Play Notification Sound ───────────────────────────────────────────────────
export async function playNotificationSound() {
  try {
    // Use compatibility service to handle sound safely
    const result = await playSafeNotificationSound();
    return result;
  } catch (error) {
    console.error('🔴 Failed to play sound:', error);
    return false;
  }
}

// ── Show Local Notification ─────────────────────────────────────────────────────────
export async function showLocalNotification(title, body, data = {}) {
  try {
    // Use compatibility service to handle notifications safely
    const result = await showSafeNotification(title, body, data);
    console.log('📱 Local notification shown:', title);
    return result;
  } catch (error) {
    console.error('🔴 Failed to show local notification:', error);
    return false;
  }
}

// ── Show Flash News Notification ─────────────────────────────────────────────────────
export async function showFlashNewsNotification(flashItem) {
  const title = '⚡ ஃபிளாஷ் செய்தி';
  const body = flashItem?.title || flashItem?.newstitle || 'புதிய ஃபிளாஷ் செய்தி வந்துள்ளது';
  
  return await showLocalNotification(title, body, {
    type: 'flash_news',
    news_id: flashItem?.id,
    url: flashItem?.link,
  });
}

// ── Show Test Notification ───────────────────────────────────────────────────────────
export async function showTestNotification(testItem) {
  const title = '🧪 டெஸ்ட் அறிவிப்பு';
  const body = testItem?.title || testItem?.description || 'இது ஒரு டெஸ்ட் அறிவிப்பு';
  
  return await showLocalNotification(title, body, {
    type: 'test_notification',
    test_id: testItem?.id,
  });
}

// ── Get Notification Settings ─────────────────────────────────────────────────────────
export async function getNotificationSettings() {
  try {
    const settings = await AsyncStorage.getItem('notification_settings');
    return settings ? JSON.parse(settings) : {
      sound: true,
      vibrate: true,
      badge: true,
      flash_news: true,
      test_notifications: true,
    };
  } catch (error) {
    console.error('🔴 Failed to get notification settings:', error);
    return {
      sound: true,
      vibrate: true,
      badge: true,
      flash_news: true,
      test_notifications: true,
    };
  }
}

// ── Save Notification Settings ─────────────────────────────────────────────────────────
export async function saveNotificationSettings(settings) {
  try {
    await AsyncStorage.setItem('notification_settings', JSON.stringify(settings));
    console.log('💾 Notification settings saved:', settings);
    return true;
  } catch (error) {
    console.error('🔴 Failed to save notification settings:', error);
    return false;
  }
}

// ── Check Notification Permissions ───────────────────────────────────────────────
export async function checkNotificationPermissions() {
  try {
    const status = getNotificationStatus();
    return {
      granted: status.supportsRemoteNotifications,
      canAsk: true,
      denied: !status.supportsRemoteNotifications,
    };
  } catch (error) {
    console.error('🔴 Failed to check permissions:', error);
    return {
      granted: false,
      canAsk: false,
      denied: true,
    };
  }
}

// ── Request Notification Permissions ─────────────────────────────────────────────
export async function requestNotificationPermissions() {
  try {
    const status = getNotificationStatus();
    return {
      granted: status.supportsRemoteNotifications,
      canAsk: false,
      denied: !status.supportsRemoteNotifications,
    };
  } catch (error) {
    console.error('🔴 Failed to request permissions:', error);
    return {
      granted: false,
      canAsk: false,
      denied: true,
    };
  }
}

// ── Get Badge Count ─────────────────────────────────────────────────────────
export async function getBadgeCount() {
  try {
    // For both Expo Go and development, use AsyncStorage
    const count = await AsyncStorage.getItem('notification_badge_count');
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('🔴 Failed to get badge count:', error);
    return 0;
  }
}

// ── Set Badge Count ─────────────────────────────────────────────────────────
export async function setBadgeCount(count) {
  try {
    // For both Expo Go and development, use AsyncStorage
    await AsyncStorage.setItem('notification_badge_count', String(count));
    console.log('🏷️ Badge count set to:', count);
    return true;
  } catch (error) {
    console.error('🔴 Failed to set badge count:', error);
    return false;
  }
}

// ── Clear All Notifications ─────────────────────────────────────────────────────
export async function clearAllNotifications() {
  try {
    // For Expo Go and development, just clear badge count
    await setBadgeCount(0);
    console.log('🗑️ All notifications cleared');
    return true;
  } catch (error) {
    console.error('🔴 Failed to clear notifications:', error);
    return false;
  }
}
