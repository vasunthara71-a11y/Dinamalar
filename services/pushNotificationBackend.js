// services/pushNotificationBackend.js
// This is a client-side simulation of what would typically be done on a backend server
// In production, this should be moved to your actual backend server

import { Expo } from 'expo-server-sdk';

// Create a new Expo SDK client
const expo = new Expo();

// Store push tokens (in production, this would be in a database)
let storedTokens = new Set();

// Register a new push token
export function registerPushToken(token, userId = null) {
  console.log('Registering push token:', token);
  storedTokens.add(token);
  
  // In production, you would store this in your database with userId
  // Example: db.pushTokens.create({ token, userId, platform: 'ios/android', createdAt: new Date() });
  
  return true;
}

// Remove a push token (for logout)
export function removePushToken(token) {
  console.log('Removing push token:', token);
  storedTokens.delete(token);
  
  // In production, you would remove from database
  // Example: db.pushTokens.delete({ where: { token } });
  
  return true;
}

// Send push notifications to multiple devices
export async function sendPushNotifications(tokens, notificationData) {
  try {
    // Create messages array
    const messages = [];
    
    for (const pushToken of tokens) {
      // Check if the token is a valid Expo push token
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Invalid Expo push token: ${pushToken}`);
        continue;
      }
      
      // Create the notification message
      messages.push({
        to: pushToken,
        sound: notificationData.sound || 'default',
        title: notificationData.title,
        body: notificationData.body,
        data: notificationData.data || {},
        priority: notificationData.priority || 'normal',
        channelId: notificationData.channelId || 'default',
        ttl: notificationData.ttl || 0, // Time to live in seconds
        expiration: notificationData.expiration || 0, // Unix timestamp
      });
    }
    
    // Chunk the messages into batches of 100 (Expo's limit)
    const chunks = expo.chunkPushNotificationMessages(messages);
    
    // Send each chunk
    const tickets = [];
    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }
    
    // Handle the tickets (check for delivery status)
    const receiptIds = [];
    for (const ticket of tickets) {
      if (ticket.id) {
        receiptIds.push(ticket.id);
      }
    }
    
    // In production, you would store these receipt IDs and check their status later
    console.log(`Sent ${tickets.length} push notifications, ${receiptIds.length} receipt IDs to check`);
    
    return {
      success: true,
      sentCount: tickets.length,
      receiptIds,
    };
    
  } catch (error) {
    console.error('Error sending push notifications:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Send notification to all registered devices
export async function sendToAllDevices(notificationData) {
  const tokens = Array.from(storedTokens);
  
  if (tokens.length === 0) {
    console.log('No registered push tokens');
    return { success: true, sentCount: 0 };
  }
  
  return await sendPushNotifications(tokens, notificationData);
}

// Send notification to specific user (if you have userId mapping)
export async function sendToUser(userId, notificationData) {
  // In production, you would query your database for this user's tokens
  // const userTokens = await db.pushTokens.findAll({ where: { userId } });
  
  // For now, send to all devices
  return await sendToAllDevices(notificationData);
}

// Check the status of sent notifications
export async function checkNotificationReceipts(receiptIds) {
  try {
    const receipts = await expo.getPushNotificationReceiptsAsync(receiptIds);
    
    const results = [];
    for (const receipt of receipts) {
      if (receipt.status === 'ok') {
        results.push({ id: receipt.id, status: 'delivered' });
      } else if (receipt.status === 'error') {
        console.error(`Notification delivery error: ${receipt.message}`);
        results.push({ id: receipt.id, status: 'error', error: receipt.message });
        
        // If the token is no longer valid, remove it
        if (receipt.details?.error === 'DeviceNotRegistered') {
          // In production, you would remove the invalid token from your database
          console.log('Removing invalid token due to DeviceNotRegistered error');
        }
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error checking notification receipts:', error);
    return [];
  }
}

// Get statistics about push notifications
export function getPushNotificationStats() {
  return {
    totalRegisteredTokens: storedTokens.size,
    registeredTokens: Array.from(storedTokens),
  };
}

// Example notification templates for different types
export const NotificationTemplates = {
  FLASH_NEWS: (title, data = {}) => ({
    title: 'Flash News',
    body: title,
    data: { type: 'flash', newsId: data.id, link: data.link, priority: 'high' },
    priority: 'high',
    channelId: 'flash-news',
    sound: 'default',
    ttl: 3600, // 1 hour
  }),
  
  BREAKING_NEWS: (title, data = {}) => ({
    title: 'Breaking News',
    body: title,
    data: { type: 'breaking', newsId: data.id, link: data.link },
    priority: 'normal',
    channelId: 'breaking-news',
    sound: 'default',
    ttl: 7200, // 2 hours
  }),
  
  VIDEO_UPDATE: (title, data = {}) => ({
    title: 'Video Update',
    body: title,
    data: { type: 'video', newsId: data.id, link: data.link },
    priority: 'normal',
    channelId: 'media-updates',
    sound: 'default',
    ttl: 86400, // 24 hours
  }),
  
  AUDIO_UPDATE: (title, data = {}) => ({
    title: 'Audio News',
    body: title,
    data: { type: 'audio', newsId: data.id, link: data.link },
    priority: 'normal',
    channelId: 'media-updates',
    sound: 'default',
    ttl: 86400, // 24 hours
  }),
};

// Example usage function
export async function sendNewsUpdate(notification, preferences = {}) {
  try {
    let template;
    
    // Choose the appropriate template based on notification type
    switch (notification.category) {
      case 'flash':
        template = NotificationTemplates.FLASH_NEWS(notification.title, notification);
        break;
      case 'breaking':
        template = NotificationTemplates.BREAKING_NEWS(notification.title, notification);
        break;
      case 'video':
        template = NotificationTemplates.VIDEO_UPDATE(notification.title, notification);
        break;
      case 'audio':
      case 'podcast':
        template = NotificationTemplates.AUDIO_UPDATE(notification.title, notification);
        break;
      default:
        template = NotificationTemplates.BREAKING_NEWS(notification.title, notification);
    }
    
    // Apply user preferences
    if (!preferences.soundEnabled) {
      template.sound = null;
    }
    
    if (!preferences.vibrationEnabled) {
      template.vibrate = false;
    }
    
    // Send the notification
    const result = await sendToAllDevices(template);
    
    console.log(`News update sent: ${result.sentCount} devices notified`);
    return result;
    
  } catch (error) {
    console.error('Error sending news update:', error);
    return { success: false, error: error.message };
  }
}
