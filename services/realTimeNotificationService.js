// services/realTimeNotificationService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dmrApi } from '../config/api';
import { Alert, Platform } from 'react-native';

const KEYS = {
  LAST_SEEN_ID: 'realtime_last_seen_id',
  NOTIFICATION_QUEUE: 'realtime_notification_queue',
  BADGE_COUNT: 'realtime_badge_count',
  LAST_POLL_TIME: 'realtime_last_poll_time',
  USER_PREFERENCES: 'realtime_user_preferences'
};

// Default user preferences for notifications
const DEFAULT_PREFERENCES = {
  flashNews: true,
  breakingNews: true,
  videoUpdates: true,
  audioNews: true,
  pollingInterval: 30000, // 30 seconds
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  }
};

// Enhanced notification types based on latestmain API response
const NOTIFICATION_TYPES = {
  FLASH: 'flash',
  BREAKING: 'breaking',
  VIDEO: 'video',
  AUDIO: 'audio',
  PHOTO: 'photo',
  PODCAST: 'podcast'
};

// Get user preferences
export async function getUserPreferences() {
  try {
    const stored = await AsyncStorage.getItem(KEYS.USER_PREFERENCES);
    return stored ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) } : DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

// Save user preferences
export async function saveUserPreferences(preferences) {
  try {
    await AsyncStorage.setItem(KEYS.USER_PREFERENCES, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
}

// Check if we're in quiet hours
export function isInQuietHours(preferences) {
  if (!preferences.quietHours.enabled) return false;
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
  
  return currentTime >= preferences.quietHours.start && currentTime <= preferences.quietHours.end;
}

// Enhanced polling for real-time notifications
export async function pollRealTimeNotifications() {
  try {
    const preferences = await getUserPreferences();
    
    // Skip polling during quiet hours
    if (isInQuietHours(preferences)) {
      return { notifications: [], count: 0, shouldAlert: false };
    }

    const res = await dmrApi.get('/latestmain', { 
      params: { 
        page: 1,
        _t: Date.now(), // Cache buster
        _realtime: 1 // Flag for real-time polling
      } 
    });
    
    const items = res?.data?.detail || [];
    if (!items.length) {
      return { notifications: [], count: 0, shouldAlert: false };
    }

    const lastSeenId = await AsyncStorage.getItem(KEYS.LAST_SEEN_ID);
    const lastSeenIdNum = lastSeenId ? parseInt(lastSeenId, 10) : 0;
    
    // Filter and categorize new items
    const newItems = items.filter(item => {
      const itemId = parseInt(item.id, 10);
      return itemId > lastSeenIdNum;
    });

    if (!newItems.length) {
      return { notifications: [], count: 0, shouldAlert: false };
    }

    // Categorize notifications based on user preferences
    const categorizedNotifications = newItems.map(item => {
      const notification = {
        id: item.id,
        title: item.newstitle || 'Breaking News',
        category: determineNotificationCategory(item),
        timestamp: item.newsdate || Date.now(),
        imageUrl: item.images || item.largeimages || item.thumbnail,
        link: item.slug || item.reacturl,
        isRead: false,
        priority: determinePriority(item)
      };

      // Check if user wants this type of notification
      const shouldNotify = checkUserPreference(notification.category, preferences);
      return { ...notification, shouldNotify };
    }).filter(notification => notification.shouldNotify);

    // Update last seen ID
    const latestId = String(items[0].id);
    await AsyncStorage.setItem(KEYS.LAST_SEEN_ID, latestId);
    
    // Store notifications in queue
    await storeNotifications(categorizedNotifications);
    
    // Update badge count
    const currentCount = await getBadgeCount();
    const newCount = currentCount + categorizedNotifications.length;
    await saveBadgeCount(newCount);

    return {
      notifications: categorizedNotifications,
      count: categorizedNotifications.length,
      shouldAlert: categorizedNotifications.length > 0
    };

  } catch (error) {
    console.error('Error polling real-time notifications:', error);
    return { notifications: [], count: 0, shouldAlert: false };
  }
}

// Determine notification category based on item properties
function determineNotificationCategory(item) {
  if (item.maincat === 'flash') return NOTIFICATION_TYPES.FLASH;
  if (item.maincat === 'video' || item.type === 'video') return NOTIFICATION_TYPES.VIDEO;
  if (item.maincat === 'podcast' || item.audio === '1') return NOTIFICATION_TYPES.AUDIO;
  if (item.maincat === 'photo') return NOTIFICATION_TYPES.PHOTO;
  return NOTIFICATION_TYPES.BREAKING;
}

// Determine notification priority
function determinePriority(item) {
  if (item.maincat === 'flash') return 'high';
  if (item.maincat === 'video') return 'medium';
  if (item.audio === '1') return 'medium';
  return 'normal';
}

// Check if user wants this type of notification
function checkUserPreference(category, preferences) {
  switch (category) {
    case NOTIFICATION_TYPES.FLASH:
      return preferences.flashNews;
    case NOTIFICATION_TYPES.VIDEO:
      return preferences.videoUpdates;
    case NOTIFICATION_TYPES.AUDIO:
    case NOTIFICATION_TYPES.PODCAST:
      return preferences.audioNews;
    default:
      return preferences.breakingNews;
  }
}

// Store notifications in queue
async function storeNotifications(notifications) {
  try {
    const existing = await getStoredNotifications();
    const updated = [...notifications, ...existing].slice(0, 50); // Keep only last 50
    await AsyncStorage.setItem(KEYS.NOTIFICATION_QUEUE, JSON.stringify(updated));
  } catch (error) {
    console.error('Error storing notifications:', error);
  }
}

// Get stored notifications
export async function getStoredNotifications() {
  try {
    const stored = await AsyncStorage.getItem(KEYS.NOTIFICATION_QUEUE);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting stored notifications:', error);
    return [];
  }
}

// Mark notifications as read
export async function markNotificationsAsRead(notificationIds = null) {
  try {
    const notifications = await getStoredNotifications();
    const updatedNotifications = notifications.map(notification => {
      if (!notificationIds || notificationIds.includes(notification.id)) {
        return { ...notification, isRead: true };
      }
      return notification;
    });
    
    await AsyncStorage.setItem(KEYS.NOTIFICATION_QUEUE, JSON.stringify(updatedNotifications));
    
    // Update badge count
    const unreadCount = updatedNotifications.filter(n => !n.isRead).length;
    await saveBadgeCount(unreadCount);
    
    return updatedNotifications;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return [];
  }
}

// Clear all notifications
export async function clearAllNotifications() {
  try {
    await AsyncStorage.setItem(KEYS.NOTIFICATION_QUEUE, JSON.stringify([]));
    await saveBadgeCount(0);
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
}

// Badge count functions
export async function getBadgeCount() {
  try {
    const count = await AsyncStorage.getItem(KEYS.BADGE_COUNT);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('Error getting badge count:', error);
    return 0;
  }
}

export async function saveBadgeCount(count) {
  try {
    await AsyncStorage.setItem(KEYS.BADGE_COUNT, String(count));
  } catch (error) {
    console.error('Error saving badge count:', error);
  }
}

// Initialize notification service
export async function initializeNotificationService() {
  try {
    // Set initial last seen ID if not exists
    const lastSeenId = await AsyncStorage.getItem(KEYS.LAST_SEEN_ID);
    if (!lastSeenId) {
      const res = await dmrApi.get('/latestmain', { params: { page: 1 } });
      const items = res?.data?.detail || [];
      if (items.length > 0) {
        await AsyncStorage.setItem(KEYS.LAST_SEEN_ID, String(items[0].id));
      }
    }
    
    // Initialize user preferences if not exists
    const preferences = await getUserPreferences();
    await saveUserPreferences(preferences);
    
    console.log('Real-time notification service initialized');
  } catch (error) {
    console.error('Error initializing notification service:', error);
  }
}

// Create notification alert (for important notifications)
export function createNotificationAlert(notification) {
  if (Platform.OS === 'web') return;
  
  const title = notification.category === NOTIFICATION_TYPES.FLASH ? 'Flash News' : 'Breaking News';
  const message = notification.title;
  
  Alert.alert(
    title,
    message,
    [
      { text: 'Dismiss', style: 'cancel' },
      { text: 'View', onPress: () => handleNotificationPress(notification) }
    ],
    { cancelable: true }
  );
}

// Handle notification press
function handleNotificationPress(notification) {
  // This would be handled by the navigation system
  console.log('Notification pressed:', notification);
  // Navigate to appropriate screen based on notification type
}
