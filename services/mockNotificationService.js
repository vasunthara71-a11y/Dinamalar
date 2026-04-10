// services/mockNotificationService.js - Separate test service for OneSignal API testing
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  configureNotifications,
  showFlashNewsNotification,
  showTestNotification,
  playNotificationSound,
  checkNotificationPermissions,
} from './notificationCompatibilityService';

const REAL_API_URL = 'https://dmrapi.dinamalar.com/latestnotify';
const KEY_TEST_NOTIFS = 'test_notifications';
const KEY_TEST_BADGE = 'test_badge_count';

// ── Fetch notifications from Real Dinamalar API (every 2 seconds) ───────────────────────────────
export async function fetchTestNotifications() {
  try {
    const res = await fetch(
      `${REAL_API_URL}?sortBy=createdAt&order=desc`
    );
    const data = await res.json();
    
    // Transform API response to match expected structure
    if (data && data.flash && data.flash.Yflash) {
      return data.flash.Yflash.map(item => ({
        id: item.id,
        title: item.title,
        description: item.title, // Use title as description for now
        createdAt: item.clsdt,
        link: item.link,
        clr: item.clr,
        clsdt: item.clsdt,
        target: item.target,
      }));
    }
    
    return data || [];
  } catch (err) {
    console.log('🔴 Real API Error:', err);
    return [];
  }
}

// ── Get stored test notifications ─────────────────────────────────────────────────────────
export async function getStoredTestNotifications() {
  try {
    const stored = await AsyncStorage.getItem(KEY_TEST_NOTIFS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// ── Store test notifications ─────────────────────────────────────────────────────────────
export async function storeTestNotifications(notifications) {
  try {
    await AsyncStorage.setItem(KEY_TEST_NOTIFS, JSON.stringify(notifications));
  } catch (err) {
    console.log('🔴 Storage Error:', err);
  }
}

// ── Get test badge count ────────────────────────────────────────────────────────────────
export async function getTestBadgeCount() {
  try {
    const count = await AsyncStorage.getItem(KEY_TEST_BADGE);
    return count ? parseInt(count, 10) : 0;
  } catch {
    return 0;
  }
}

// ── Save test badge count ───────────────────────────────────────────────────────────────
export async function saveTestBadgeCount(count) {
  try {
    await AsyncStorage.setItem(KEY_TEST_BADGE, String(count));
  } catch (err) {
    console.log('🔴 Badge Save Error:', err);
  }
}

// ── Reset test badge count ───────────────────────────────────────────────────────────────
export async function resetTestBadgeCount() {
  try {
    await AsyncStorage.setItem(KEY_TEST_BADGE, '0');
  } catch (err) {
    console.log('🔴 Badge Reset Error:', err);
  }
}

// ── Polling logic (detect new flash news) ───────────────────────────
export async function pollTestNotifications(currentNotifications, setNotifications, setNotifCount) {
  try {
    // Check permissions first
    const { granted } = await checkNotificationPermissions();
    if (!granted) {
      console.log('🔴 Notification permissions not granted');
      return { newItems: [], totalItems: 0 };
    }

    const data = await fetchTestNotifications();
    
    // Store current notifications for comparison
    const stored = await getStoredTestNotifications();
    
    if (stored.length === 0) {
      // First time - set baseline
      await storeTestNotifications(data);
      setNotifications(data);
      return { newItems: [], totalItems: data.length };
    }

    // Detect new items by comparing with stored
    const newItems = data.filter(
      item => !stored.some(old => old.id === item.id)
    );

    if (newItems.length > 0) {
      console.log(`🆕 ${newItems.length} new flash news detected`);
      
      // Play sound for new notifications
      await playNotificationSound();
      
      // Show mobile notifications for each new item immediately
      for (const newItem of newItems) {
        await showFlashNewsNotification(newItem);
      }
      
      // Update badge count
      const currentCount = await getTestBadgeCount();
      const newCount = currentCount + newItems.length;
      await saveTestBadgeCount(newCount);
      setNotifCount(newCount);
      
      // Update notifications
      await storeTestNotifications(data);
      setNotifications(data);
      
      return { newItems, totalItems: data.length };
    }
    
    // Update notifications even if no new items (to keep UI in sync)
    setNotifications(data);
    return { newItems: [], totalItems: data.length };
    
  } catch (err) {
    console.log('🔴 Real API Polling Error:', err);
    return { newItems: [], totalItems: 0 };
  }
}

// ── Test notification creation (for manual testing) ───────────────────────────────────
export async function createTestNotification(title, description) {
  try {
    const newNotif = {
      title: title || 'Test Notification 📰',
      description: description || 'This is a test notification from Dinamalar app',
      createdAt: new Date().toISOString(),
      id: Date.now().toString()
    };

    // This would normally be a POST to the mock API
    console.log('🧪 Creating test notification:', newNotif);
    
    return newNotif;
  } catch (err) {
    console.log('🔴 Create Error:', err);
    return null;
  }
}
