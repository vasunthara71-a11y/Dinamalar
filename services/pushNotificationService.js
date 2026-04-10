// services/pushNotificationService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { 
  isExpoGo, 
  getNotificationStatus, 
  showSafeNotification,
  initializeSafeNotifications
} from './notificationCompatibilityService';

const PUSH_TOKEN_KEY = 'push_notification_token';
const USER_PREFERENCES_KEY = 'push_notification_preferences';

// Default push notification preferences
const DEFAULT_PUSH_PREFERENCES = {
  flashNews: true,
  breakingNews: true,
  videoUpdates: true,
  audioNews: true,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  },
  soundEnabled: true,
  vibrationEnabled: true
};

// Configure notification handler
export function configurePushNotifications() {
  const status = getNotificationStatus();
  
  if (status.isExpoGo) {
    console.log('📱 Expo Go - Skipping push notification configuration');
    return { success: true, method: 'none' };
  } else {
    console.log('📱 Development build - Push notifications would be configured here');
    return { success: true, method: 'push' };
  }
}

// Request notification permissions
export async function requestNotificationPermissions() {
  try {
    const status = getNotificationStatus();
    
    if (status.isExpoGo) {
      console.log('📱 Expo Go - Notifications not supported, returning true for compatibility');
      return true;
    } else {
      console.log('📱 Development build - Push notification permissions would be requested here');
      return true;
    }
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

// Get push notification token
export async function getPushNotificationToken() {
  try {
    const status = getNotificationStatus();
    
    if (status.isExpoGo) {
      console.log('📱 Expo Go - Push tokens not supported, returning mock token');
      return 'expo-go-mock-token';
    }

    // Check if token already exists
    const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (storedToken) {
      return storedToken;
    }

    // For development build, return mock token for now
    console.log('📱 Development build - Returning mock push token');
    const mockToken = 'development-mock-token-' + Date.now();
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, mockToken);
    
    return mockToken;
  } catch (error) {
    console.error('Error getting push notification token:', error);
    return null;
  }
}

// Register push token with your backend
export async function registerPushToken(token, userId = null) {
  try {
    // Here you would send the token to your backend server
    // For now, we'll just store it locally
    console.log('Registering push token:', token);
    
    // Example API call to your backend:
    // await fetch('https://your-api.com/register-push-token', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ token, userId, platform: Platform.OS })
    // });
    
    return true;
  } catch (error) {
    console.error('Error registering push token:', error);
    return false;
  }
}

// Send push notification (this would be called from your backend)
export async function sendPushNotification(tokens, notificationData) {
  try {
    const status = getNotificationStatus();
    
    if (status.isExpoGo) {
      console.log('📱 Expo Go - Push notifications not supported, showing alert');
      // Show alert instead of push notification
      const { Alert } = await import('react-native');
      Alert.alert(notificationData.title, notificationData.body, [
        { text: 'OK', onPress: () => console.log('Notification acknowledged') }
      ]);
      return true;
    }

    // This is a client-side example - in production, this should be done from your backend
    const message = {
      to: tokens, // Array of push tokens
      sound: notificationData.sound || 'default',
      title: notificationData.title,
      body: notificationData.body,
      data: notificationData.data || {},
      priority: notificationData.priority || 'normal',
      channelId: notificationData.channelId || 'default',
    };

    // For testing purposes only - in production, use your backend service
    console.log('Would send push notification:', message);
    
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

// Get user push notification preferences
export async function getPushNotificationPreferences() {
  try {
    const stored = await AsyncStorage.getItem(USER_PREFERENCES_KEY);
    return stored ? { ...DEFAULT_PUSH_PREFERENCES, ...JSON.parse(stored) } : DEFAULT_PUSH_PREFERENCES;
  } catch (error) {
    console.error('Error getting push notification preferences:', error);
    return DEFAULT_PUSH_PREFERENCES;
  }
}

// Save user push notification preferences
export async function savePushNotificationPreferences(preferences) {
  try {
    await AsyncStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving push notification preferences:', error);
  }
}

// Check if we should send push notification based on user preferences
export function shouldSendPushNotification(notification, preferences) {
  // Check quiet hours
  if (preferences.quietHours.enabled) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    if (currentTime >= preferences.quietHours.start && currentTime <= preferences.quietHours.end) {
      return false;
    }
  }

  // Check notification type preferences
  switch (notification.category) {
    case 'flash':
      return preferences.flashNews;
    case 'video':
      return preferences.videoUpdates;
    case 'audio':
    case 'podcast':
      return preferences.audioNews;
    default:
      return preferences.breakingNews;
  }
}

// Create notification payload for different types
export function createNotificationPayload(notification, preferences) {
  const basePayload = {
    title: 'Dinamalar',
    body: notification.title,
    data: {
      type: notification.category,
      newsId: notification.id,
      link: notification.link,
      priority: notification.priority,
    },
    sound: preferences.soundEnabled ? 'default' : null,
    vibrate: preferences.vibrationEnabled,
  };

  // Customize based on notification type
  switch (notification.category) {
    case 'flash':
      return {
        ...basePayload,
        title: 'Flash News',
        channelId: 'flash-news',
        priority: 'high',
        data: { ...basePayload.data, urgent: true }
      };
    
    case 'breaking':
      return {
        ...basePayload,
        title: 'Breaking News',
        channelId: 'breaking-news',
        priority: 'normal',
      };
    
    case 'video':
    case 'audio':
      return {
        ...basePayload,
        title: 'Media Update',
        channelId: 'media-updates',
        priority: 'normal',
      };
    
    default:
      return basePayload;
  }
}

// Handle received push notification
export function handlePushNotification(notification) {
  console.log('Push notification received:', notification);
  
  // Here you can handle navigation based on notification data
  const { data } = notification.request.content;
  
  if (data?.newsId) {
    // Navigate to news details
    // navigation.navigate('NewsDetailsScreen', { newsId: data.newsId });
  }
  
  if (data?.link) {
    // Handle custom links
    // Linking.openURL(data.link);
  }
}

// Initialize push notification service
export async function initializePushNotifications() {
  try {
    const status = getNotificationStatus();
    
    if (status.isExpoGo) {
      console.log('📱 Expo Go - Push notifications not supported');
      return 'expo-go-disabled';
    }

    // Configure notification handler
    configurePushNotifications();
    
    // Request permissions
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('Push notification permissions denied');
      return null;
    }
    
    // Get and register push token
    const token = await getPushNotificationToken();
    if (token) {
      await registerPushToken(token);
      console.log('Push notifications initialized successfully');
      return token;
    }
    
    return null;
  } catch (error) {
    console.error('Error initializing push notifications:', error);
    return null;
  }
}

// Remove push token (for logout)
export async function removePushToken() {
  try {
    const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (token) {
      // Notify your backend to remove the token
      console.log('Removing push token:', token);
      
      // await fetch('https://your-api.com/remove-push-token', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ token })
      // });
      
      await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
    }
  } catch (error) {
    console.error('Error removing push token:', error);
  }
}
