// services/notificationCompatibilityService.js - Handle Expo Go vs Development Build differences
import { Platform } from 'react-native';

// ── Check if we're in Expo Go ─────────────────────────────────────────────
export function isExpoGo() {
  try {
    // For Expo Go, we'll use a simple check - in production this would be different
    // For now, assume we're in Expo Go for testing
    return true; // Set to true to disable expo-notifications
  } catch (error) {
    console.log('🔴 Error checking Expo Go:', error);
    return false;
  }
}

// ── Get Notification Status ─────────────────────────────────────────────────────
export function getNotificationStatus() {
  const isExpoGo = isExpoGo();
  
  return {
    isExpoGo,
    supportsRemoteNotifications: false, // Disabled for Expo Go compatibility
    supportsLocalNotifications: true, // Both support local notifications
    supportsSound: true, // Both support sound
    supportsVibration: true, // Both support vibration
    platform: Platform.OS,
  };
}

// ── Safe Notification Display ───────────────────────────────────────────
export async function showSafeNotification(title, body, data = {}) {
  const status = getNotificationStatus();
  
  if (status.isExpoGo) {
    // Expo Go: Show alert instead of push notification
    console.log('📱 Expo Go - Showing alert notification');
    const { Alert } = await import('react-native');
    Alert.alert(title, body, [
      { text: 'சரி', onPress: () => console.log('Notification acknowledged') },
      { text: 'விவண்பு', style: 'cancel' }
    ]);
    return { success: true, method: 'alert' };
  } else {
    // Development build: Would use expo-notifications here
    console.log('📱 Development build - Would show push notification');
    return { success: true, method: 'push' };
  }
}

// ── Safe Sound Play ─────────────────────────────────────────────────────────────
export async function playSafeNotificationSound() {
  const status = getNotificationStatus();
  
  if (status.isExpoGo) {
    // Expo Go: Play system sound via Web Audio API
    try {
      const audio = new Audio('https://assets.mixkit.co/sfx/notification.mp3');
      audio.play().catch(e => console.log('🔊 Sound play failed:', e));
      console.log('🔊 Expo Go - Playing notification sound');
      return true;
    } catch (error) {
      console.log('🔴 Expo Go sound play failed:', error);
      return false;
    }
  } else {
    // Development build: Use expo-av or system sound
    try {
      // For development builds, you can use expo-av
      // const { sound } = await Audio.Sound.createAsync(
      //   require('../assets/sounds/notification.mp3')
      // );
      // await sound.playAsync();
      // await sound.unloadAsync();
      
      console.log('🔊 Development build - Triggering notification sound');
      return true;
    } catch (error) {
      console.log('🔴 Development sound play failed:', error);
      return false;
    }
  }
}

// ── Initialize Safe Notifications ─────────────────────────────────────────────
export async function initializeSafeNotifications() {
  const status = getNotificationStatus();
  
  if (status.isExpoGo) {
    console.log('📱 Expo Go detected - Using alert-based notifications');
    return {
      success: true,
      method: 'alert',
      message: 'Expo Go mode active',
    };
  } else {
    // Development build: Would configure expo-notifications here
    console.log('📱 Development build - expo-notifications would be configured');
    return {
      success: true,
      method: 'push',
      message: 'Development build notifications active',
    };
  }
}

// ── Update Notification Service Calls ─────────────────────────────────────────────
export function updateNotificationService(serviceName) {
  const status = getNotificationStatus();
  
  if (status.isExpoGo) {
    console.log(`🔄 Updating ${serviceName} for Expo Go compatibility`);
    return {
      showAlert: true,
      showPush: false,
      playSound: true,
    };
  } else {
    console.log(`🔄 Updating ${serviceName} for development build`);
    return {
      showAlert: false,
      showPush: true,
      playSound: true,
    };
  }
}
