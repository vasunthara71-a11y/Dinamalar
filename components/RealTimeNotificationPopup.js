// components/RealTimeNotificationPopup.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Animated,
  StyleSheet,
  Dimensions,
  StatusBar,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../utils/constants';
import { s, vs, ms, mvs } from '../utils/scaling';
import { useFontSize } from '../context/FontSizeContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const POPUP_HEIGHT = vs(120);
const POPUP_MARGIN = vs(20);

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

export default function RealTimeNotificationPopup({ 
  notification, 
  visible, 
  onClose, 
  onPress,
  autoHideDelay = 5000 
}) {
  const { sf } = useFontSize();
  const slideAnim = useRef(new Animated.Value(-POPUP_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isVisible, setIsVisible] = useState(false);
  const autoHideTimer = useRef(null);

  useEffect(() => {
    if (visible && notification) {
      showPopup();
    } else {
      hidePopup();
    }

    return () => {
      if (autoHideTimer.current) {
        clearTimeout(autoHideTimer.current);
      }
    };
  }, [visible, notification]);

  const showPopup = () => {
    setIsVisible(true);
    
    // Clear any existing timer
    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
    }

    // Animate in
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-hide after delay
    autoHideTimer.current = setTimeout(() => {
      hidePopup();
      if (onClose) onClose();
    }, autoHideDelay);
  };

  const hidePopup = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -POPUP_HEIGHT,
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
    });

    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
    }
  };

  const handlePress = () => {
    hidePopup();
    if (onPress) onPress(notification);
  };

  const handleClose = () => {
    hidePopup();
    if (onClose) onClose();
  };

  if (!isVisible || !notification) return null;

  const categoryColor = NOTIFICATION_COLORS[notification.category] || NOTIFICATION_COLORS.default;
  const iconName = NOTIFICATION_ICONS[notification.category] || NOTIFICATION_ICONS.default;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <Animated.View 
        style={[
          styles.popupContainer,
          { 
            transform: [{ translateY: slideAnim }],
            backgroundColor: categoryColor,
          }
        ]}
      >
        <LinearGradient
          colors={[categoryColor, categoryColor + 'DD', categoryColor + '99']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={s(16)} color="#fff" />
          </TouchableOpacity>

          {/* Notification content */}
          <TouchableOpacity 
            style={styles.contentContainer} 
            onPress={handlePress}
            activeOpacity={0.8}
          >
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Ionicons name={iconName} size={s(24)} color="#fff" />
            </View>

            {/* Text content */}
            <View style={styles.textContainer}>
              <Text style={[styles.categoryText, { fontSize: sf(12) }]}>
                {getCategoryLabel(notification.category)}
              </Text>
              <Text 
                style={[styles.titleText, { fontSize: sf(14) }]} 
                numberOfLines={2}
              >
                {notification.title}
              </Text>
              <Text style={[styles.timeText, { fontSize: sf(10) }]}>
                {formatTime(notification.timestamp)}
              </Text>
            </View>

            {/* Image thumbnail */}
            {notification.imageUrl && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: notification.imageUrl }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Arrow indicator */}
            <View style={styles.arrowContainer}>
              <Ionicons name="chevron-forward" size={s(16)} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Priority indicator */}
          {notification.priority === 'high' && (
            <View style={styles.priorityIndicator}>
              <View style={styles.priorityDot} />
            </View>
          )}
        </LinearGradient>
      </Animated.View>
    </Animated.View>
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
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    height: POPUP_HEIGHT + POPUP_MARGIN,
  },
  popupContainer: {
    marginTop: POPUP_MARGIN,
    marginHorizontal: s(16),
    borderRadius: s(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 12,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: vs(8),
    right: s(8),
    zIndex: 1,
    padding: s(4),
    borderRadius: s(12),
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: s(12),
  },
  iconContainer: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: s(12),
  },
  textContainer: {
    flex: 1,
    marginRight: s(12),
  },
  categoryText: {
    color: '#fff',
    fontFamily: FONTS.muktaMalar.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: vs(2),
  },
  titleText: {
    color: '#fff',
    fontFamily: FONTS.muktaMalar.bold,
    lineHeight: sf(18),
    marginBottom: vs(2),
  },
  timeText: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: FONTS.muktaMalar.regular,
  },
  imageContainer: {
    width: s(50),
    height: s(50),
    borderRadius: s(8),
    overflow: 'hidden',
    marginRight: s(8),
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  arrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: vs(3),
    backgroundColor: '#fff',
  },
  priorityDot: {
    width: s(6),
    height: s(6),
    borderRadius: s(3),
    backgroundColor: '#FF5252',
    position: 'absolute',
    top: vs(4),
    right: s(8),
  },
});
