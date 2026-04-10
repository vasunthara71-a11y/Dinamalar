// services/mobileNotificationService.js - Mobile notifications with sound
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Configure Notifications ─────────────────────────────────────────────────────────
export async function configureNotifications() {
  try {
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('🔴 Notification permissions not granted');
      return false;
    }

    // Set notification handler
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        console.log('🔔 Notification received:', notification);
        
        // Play custom sound when notification is received
        if (notification.request.content) {
          await playNotificationSound();
        }
      },
      handleSuccess: (notificationId) => {
        console.log('✅ Notification displayed:', notificationId);
      },
      handleError: (notificationId, error) => {
        console.log('❌ Notification error:', notificationId, error);
      },
    });

    // Set notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default', // Use default notification sound
        enableVibrate: true,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    console.log('✅ Notifications configured');
    return true;
  } catch (error) {
    console.error('🔴 Failed to configure notifications:', error);
    return false;
  }
}

// ── Play Notification Sound ───────────────────────────────────────────────────────────
export async function playNotificationSound() {
  try {
    // You can use expo-av for custom sounds
    // For now, we'll use the system notification sound
    console.log('🔊 Playing notification sound');
    
    // If you want custom sound, you would use:
    // const { sound } = await Audio.Sound.createAsync(
    //   require('../assets/sounds/notification.mp3')
    // );
    // await sound.playAsync();
    // await sound.unloadAsync();
    
  } catch (error) {
    console.error('🔴 Failed to play sound:', error);
  }
}

// ── Show Local Notification ─────────────────────────────────────────────────────────
export async function showLocalNotification(title, body, data = {}) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        sound: 'default', // Play notification sound
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250],
      },
      trigger: null, // Show immediately
      data: data,
    });
    
    console.log('📱 Local notification shown:', title);
    return true;
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

// ── Check Notification Permissions ───────────────────────────────────────────────────────
export async function checkNotificationPermissions() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return {
      granted: status === 'granted',
      canAsk: status === 'undetermined',
      denied: status === 'denied',
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

// ── Request Notification Permissions ─────────────────────────────────────────────────────
export async function requestNotificationPermissions() {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return {
      granted: status === 'granted',
      canAsk: false,
      denied: status === 'denied',
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

// ── Get Badge Count ─────────────────────────────────────────────────────────────────
export async function getBadgeCount() {
  try {
    if (Platform.OS === 'ios') {
      const badgeCount = await Notifications.getBadgeCountAsync();
      return badgeCount;
    }
    // For Android, use AsyncStorage
    const count = await AsyncStorage.getItem('notification_badge_count');
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('🔴 Failed to get badge count:', error);
    return 0;
  }
}

// ── Set Badge Count ─────────────────────────────────────────────────────────────────
export async function setBadgeCount(count) {
  try {
    if (Platform.OS === 'ios') {
      await Notifications.setBadgeCountAsync(count);
    } else {
      await AsyncStorage.setItem('notification_badge_count', String(count));
    }
    console.log('🏷️ Badge count set to:', count);
    return true;
  } catch (error) {
    console.error('🔴 Failed to set badge count:', error);
    return false;
  }
}

// ── Clear All Notifications ─────────────────────────────────────────────────────────────
export async function clearAllNotifications() {
  try {
    await Notifications.dismissAllNotificationsAsync();
    await setBadgeCount(0);
    console.log('🗑️ All notifications cleared');
    return true;
  } catch (error) {
    console.error('🔴 Failed to clear notifications:', error);
    return false;
  }
}
