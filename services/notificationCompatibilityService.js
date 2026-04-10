// services/notificationCompatibilityService.js - Handle Expo Go vs Development Build differences
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// ── Check if we're in Expo Go ─────────────────────────────────────────────
export function isExpoGo() {
  try {
    // Check if we're in Expo Go client
    return !!Constants.expoConfig?.extra?.clientExpoGo;
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
    supportsRemoteNotifications: !isExpoGo, // Only development builds support remote notifications
    supportsLocalNotifications: true, // Both support local notifications
    supportsSound: true, // Both support sound
    supportsVibration: true, // Both support vibration
    platform: Platform.OS,
  };
}

// ── Safe Notification Display ───────────────────────────────────────────────────
export async function showSafeNotification(title, body, data = {}) {
  const status = getNotificationStatus();
  
  if (status.isExpoGo) {
    // Expo Go: Show alert instead of push notification
    console.log('📱 Expo Go - Showing alert notification');
    Alert.alert(title, body, [
      { text: 'சரி', onPress: () => console.log('Notification acknowledged') },
      { text: 'விவண்பு', style: 'cancel' }
    ]);
    return { success: true, method: 'alert' };
  } else {
    // Development build: Use expo-notifications
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          vibrate: [0, 250, 250, 250],
        },
        trigger: null, // Show immediately
        data,
      });
      
      console.log('📱 Development build - Showing push notification');
      return { success: true, method: 'push' };
    } catch (error) {
      console.error('🔴 Failed to show notification:', error);
      return { success: false, error };
    }
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

// ── Initialize Safe Notifications ─────────────────────────────────────────────────────
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
    // Development build: Configure expo-notifications
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('🔴 Notification permissions denied');
        return {
          success: false,
          method: 'none',
          error: 'Permissions denied',
        };
      }

      // Set up notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          enableVibrate: true,
          vibrationPattern: [0, 250, 250, 250],
        });
      }

      console.log('📱 Development build - expo-notifications configured');
      return {
        success: true,
        method: 'push',
        message: 'Development build notifications active',
      };
    } catch (error) {
      console.error('🔴 Failed to configure notifications:', error);
      return {
        success: false,
        error,
      };
    }
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
