// components/NotificationCenter.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../utils/constants';
import { s, vs, ms, mvs } from '../utils/scaling';
import { useFontSize } from '../context/FontSizeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  getStoredNotifications, 
  markNotificationsAsRead, 
  clearAllNotifications,
  getBadgeCount,
  saveBadgeCount
} from '../services/realTimeNotificationService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.75;

const NOTIFICATION_COLORS = {
  flash: '#FF5252',
  breaking: '#FF9800',
  video: '#2196F3',
  audio: '#9C27B0',
  photo: '#4CAF50',
  default: '#1976D2'
};

const NOTIFICATION_ICONS = {
  flash: 'flash',
  breaking: 'alert-circle',
  video: 'videocam',
  audio: 'volume-high',
  photo: 'camera',
  default: 'notifications'
};

export default function NotificationCenter({ 
  visible, 
  onClose, 
  onNotificationPress,
  onRefresh 
}) {
  const { sf } = useFontSize();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadNotifications();
    }
  }, [visible]);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const storedNotifications = await getStoredNotifications();
      setNotifications(storedNotifications);
      
      // Mark all as viewed when opening the center
      if (storedNotifications.length > 0) {
        const updated = await markNotificationsAsRead();
        setNotifications(updated);
        await saveBadgeCount(0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadNotifications();
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setRefreshing(false);
    }
  }, [loadNotifications, onRefresh]);

  const handleNotificationPress = useCallback((notification) => {
    onClose();
    if (onNotificationPress) {
      onNotificationPress(notification);
    }
  }, [onClose, onNotificationPress]);

  const handleClearAll = useCallback(async () => {
    try {
      await clearAllNotifications();
      setNotifications([]);
      await saveBadgeCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }, []);

  const renderNotificationItem = ({ item, index }) => {
    const categoryColor = NOTIFICATION_COLORS[item.category] || NOTIFICATION_COLORS.default;
    const iconName = NOTIFICATION_ICONS[item.category] || NOTIFICATION_ICONS.default;
    const isUnread = !item.isRead;

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          isUnread && styles.unreadItem
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        {/* Left accent bar */}
        <LinearGradient
          colors={[categoryColor, categoryColor + '66']}
          style={styles.accentBar}
        />

        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: categoryColor + '20' }]}>
          <Ionicons name={iconName} size={s(20)} color={categoryColor} />
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.categoryText, { fontSize: sf(11) }]}>
              {getCategoryLabel(item.category)}
            </Text>
            <Text style={[styles.timeText, { fontSize: sf(10) }]}>
              {formatTime(item.timestamp)}
            </Text>
          </View>
          
          <Text 
            style={[styles.titleText, { fontSize: sf(13) }]} 
            numberOfLines={2}
          >
            {item.title}
          </Text>

          {/* Priority indicator */}
          {item.priority === 'high' && (
            <View style={styles.priorityRow}>
              <Ionicons name="alert" size={s(12)} color="#FF5252" />
              <Text style={[styles.priorityText, { fontSize: sf(10) }]}>
                High Priority
              </Text>
            </View>
          )}
        </View>

        {/* Thumbnail */}
        {item.imageUrl && (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        )}

        {/* Unread indicator */}
        {isUnread && (
          <View style={styles.unreadDot} />
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off" size={s(48)} color={COLORS.grey400} />
      <Text style={[styles.emptyText, { fontSize: sf(16) }]}>
        No notifications yet
      </Text>
      <Text style={[styles.emptySubtext, { fontSize: sf(12) }]}>
        We'll notify you when there's breaking news
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { fontSize: sf(18) }]}>
              Notifications
            </Text>
            {notifications.length > 0 && (
              <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
                <Text style={[styles.clearButtonText, { fontSize: sf(12) }]}>
                  Clear All
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Notifications List */}
        <FlatList
          data={notifications}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderNotificationItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={[
            styles.listContainer,
            notifications.length === 0 && styles.emptyListContainer
          ]}
          showsVerticalScrollIndicator={false}
        />

        {/* Close button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={s(24)} color={COLORS.grey600} />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

function getCategoryLabel(category) {
  const labels = {
    flash: 'Flash News',
    breaking: 'Breaking News',
    video: 'Video Update',
    audio: 'Audio News',
    photo: 'Photo Gallery',
    default: 'Latest Update'
  };
  return labels[category] || labels.default;
}

function formatTime(timestamp) {
  const now = new Date();
  const notificationTime = new Date(timestamp);
  const diffMs = now - notificationTime;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.grey100,
  },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grey200,
    paddingTop: vs(10),
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: s(16),
    paddingBottom: vs(16),
  },
  headerTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    color: COLORS.grey800,
  },
  clearButton: {
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    backgroundColor: COLORS.grey200,
    borderRadius: s(12),
  },
  clearButtonText: {
    fontFamily: FONTS.muktaMalar.regular,
    color: COLORS.grey600,
  },
  listContainer: {
    padding: s(16),
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: s(12),
    marginBottom: vs(12),
    padding: s(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadItem: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  accentBar: {
    width: s(3),
    borderRadius: s(1.5),
    marginRight: s(12),
  },
  iconContainer: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: s(12),
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(4),
  },
  categoryText: {
    fontFamily: FONTS.muktaMalar.bold,
    color: COLORS.grey600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  timeText: {
    fontFamily: FONTS.muktaMalar.regular,
    color: COLORS.grey500,
  },
  titleText: {
    fontFamily: FONTS.muktaMalar.regular,
    color: COLORS.grey800,
    lineHeight: sf(18),
    marginBottom: vs(4),
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  priorityText: {
    fontFamily: FONTS.muktaMalar.regular,
    color: '#FF5252',
  },
  thumbnail: {
    width: s(50),
    height: s(50),
    borderRadius: s(8),
    marginLeft: s(12),
  },
  unreadDot: {
    width: s(8),
    height: s(8),
    borderRadius: s(4),
    backgroundColor: COLORS.primary,
    position: 'absolute',
    top: vs(12),
    right: vs(12),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(40),
  },
  emptyText: {
    fontFamily: FONTS.muktaMalar.bold,
    color: COLORS.grey600,
    marginTop: vs(16),
  },
  emptySubtext: {
    fontFamily: FONTS.muktaMalar.regular,
    color: COLORS.grey500,
    marginTop: vs(8),
    textAlign: 'center',
    paddingHorizontal: s(40),
  },
  closeButton: {
    position: 'absolute',
    top: vs(10),
    right: s(16),
    padding: s(8),
    borderRadius: s(16),
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});
