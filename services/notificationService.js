// services/notificationService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import {  dmrApi } from '../config/api';

const KEY_LAST_FLASH_ID  = 'notif_last_flash_id';
const KEY_BADGE_COUNT    = 'notif_badge_count';
const KEY_FLASH_ITEMS    = 'notif_flash_items';

// ── Poll /latestmain and count NEW flash items ────────────────────────────────
export async function pollFlashNotifications() {
  try {
    const res     = await  dmrApi.get('/latestmain', { params: { page: 1 } });
    const detail  = res?.data?.detail || [];

    // Only flash items
    const flashItems = detail.filter(i => i.maincat === 'flash');
    if (!flashItems.length) return { isNew: false, count: 0, items: [] };

    // The latest (newest) flash item id
    const latestId   = String(flashItems[0].id);
    const savedId    = await AsyncStorage.getItem(KEY_LAST_FLASH_ID);

    // First ever launch — set baseline silently, no badge
    if (!savedId) {
      await AsyncStorage.setItem(KEY_LAST_FLASH_ID, latestId);
      await AsyncStorage.setItem(KEY_FLASH_ITEMS, JSON.stringify(flashItems));
      return { isNew: false, count: 0, items: [] };
    }

    // No new flash news
    if (latestId === savedId) {
      return { isNew: false, count: 0, items: [] };
    }

    // Count how many flash items are newer than what we last saw
    const savedIdNum  = parseInt(savedId, 10);
    const newItems    = flashItems.filter(i => i.id > savedIdNum);
    const count       = newItems.length || flashItems.length;

    // Save new baseline and items
    await AsyncStorage.setItem(KEY_LAST_FLASH_ID, latestId);
    await AsyncStorage.setItem(KEY_FLASH_ITEMS, JSON.stringify(flashItems));

    return { isNew: true, count, items: newItems };

  } catch {
    return { isNew: false, count: 0, items: [] };
  }
}

// ── Get stored flash items for notification panel ─────────────────────────────
export async function getStoredFlashItems() {
  try {
    const raw = await AsyncStorage.getItem(KEY_FLASH_ITEMS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ── Badge helpers ─────────────────────────────────────────────────────────────
export async function getBadgeCount() {
  try {
    const val = await AsyncStorage.getItem(KEY_BADGE_COUNT);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

export async function saveBadgeCount(count) {
  try {
    await AsyncStorage.setItem(KEY_BADGE_COUNT, String(count));
  } catch {}
}

export async function resetBadgeCount() {
  try {
    await AsyncStorage.setItem(KEY_BADGE_COUNT, '0');
  } catch {}
}
