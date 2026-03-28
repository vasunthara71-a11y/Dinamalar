import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { mainApi } from '../config/api';
import { COLORS, FONTS } from '../utils/constants';
import { s, vs, ms } from '../utils/scaling';
import { Ionicons } from '@expo/vector-icons';

const FlashNews = ({ onPress }) => {
  const [flashNews, setFlashNews] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef(null);

  // Fetch flash news data
  useEffect(() => {
    const fetchFlashNews = async () => {
      try {
        setLoading(true);
        const response = await mainApi.get('/flash');
        console.log('Flash News API Response:', response.data);
        const flashData = response.data?.flash || {};
        const newsData = flashData.Yflash || [];
        console.log('Flash News Data:', newsData);
        setFlashNews(newsData);
      } catch (error) {
        console.error('Error fetching flash news:', error);
        setFlashNews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFlashNews();
    
    // Refresh data every 5 minutes
    const refreshInterval = setInterval(fetchFlashNews, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Auto-rotate news every 10 seconds
  useEffect(() => {
    if (flashNews.length <= 1) return;

    const startRotation = () => {
      intervalRef.current = setInterval(() => {
        // Fade out
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          // Change content
          setCurrentIndex((prev) => (prev + 1) % flashNews.length);
          
          // Fade in
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        });
      }, 10000); // Change every 10 seconds
    };

    startRotation();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [flashNews.length, fadeAnim]);

  const currentNews = flashNews[currentIndex];

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading flash news...</Text>
        </View>
      </View>
    );
  }

  if (!flashNews.length || !currentNews) {
    return (
      <View style={styles.container}>
        <View style={styles.flashContainer}>
          <View style={styles.headerContainer}>
            <Ionicons name="flash" size={s(16)} color={COLORS.primary} />
            <Text style={styles.flashLabel}>FLASH</Text>
          </View>
          <Text style={styles.newsTitle}>
            No flash news available
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.flashContainer}
        onPress={() => onPress && onPress(currentNews)}
        activeOpacity={0.8}
      >
        {/* Flash icon and label */}
        {/* <View style={styles.headerContainer}>
          <Ionicons name="flash" size={s(16)} color={COLORS.primary} />
          <Text style={styles.flashLabel}>FLASH</Text>
        </View> */}

        {/* News content */}
        <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
          <Text style={styles.newsTitle} numberOfLines={2}>
            {currentNews.title || ''}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    // paddingHorizontal: s(12),
    paddingVertical: vs(8),
  },
  flashContainer: {
    backgroundColor: '#ffd800', // Yellow background
    borderColor: '#ffd800',
    borderWidth: 1,
    // borderRadius: s(8),
    // padding: s(12),
    // minHeight: vs(10),
    justifyContent: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(4),
  },
  flashLabel: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(12),
    color: COLORS.primary,
    marginLeft: s(4),
    letterSpacing: 1,
    textAlign:"center"
  },
  contentContainer: {
    flex: 1,
  },
  newsTitle: {
    fontFamily: FONTS.muktaMalar.semibold,
    fontSize: ms(13),
    color: '#000000',
    lineHeight: vs(18),
    textAlign:"center",
    paddingVertical:ms(5),
    fontWeight:"600"
  },
  loadingContainer: {
    backgroundColor: '#e2e2e2',
    borderColor: '#e2e2e2',
    borderWidth: 1,
    borderRadius: s(8),
    padding: s(12),
    alignItems: 'center',
    justifyContent: 'center',
    // minHeight: vs(80),
  },
  loadingText: {
    fontFamily: FONTS.muktaMalar.regular,
    fontSize: ms(14),
    color: '#666666',
  },
});

export default FlashNews;
