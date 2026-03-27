import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Linking } from 'react-native';
import { s, vs } from '../utils/scaling';
import { COLORS, FONTS } from '../utils/constants';
import { SpecialCalendar } from '../assets/svg/Icons';
import { ms } from 'react-native-size-matters';

const SpecialToday = ({ specialData }) => {
  const navigation = useNavigation();

  // Don't render if no special data or empty array
  if (!specialData || !specialData.data || specialData.data.length === 0) {
    return null;
  }

  const handleTagPress = (item) => {
    if (item.url) {
      // Check if URL contains spirituality-related paths and navigate to CommonSectionScreen
      if (item.url.includes('anmegam-spirituality') || item.url.includes('hindu-kathikal')) {
        navigation.navigate('CommonSectionScreen', {
          screenTitle: 'ஆன்மீகம்',
          apiEndpoint: 'https://api-st-cdn.dinamalar.com/anmeegam',
          allTabLink: 'https://www.dinamalar.com/anmegam-spirituality'
        });
      } else if (item.url.includes('malarkal/ariviyal-malar')) {
        // Handle science articles section
        navigation.navigate('CommonSectionScreen', {
          screenTitle: 'அறிவியல் மலர்',
          apiEndpoint: 'https://api-st-cdn.dinamalar.com/ariviyal',
          allTabLink: 'https://www.dinamalar.com/malarkal/ariviyal-malar-science-articles'
        });
      } else {
        // Extract news ID from URL and navigate to NewsDetailsScreen within the app
        const urlMatch = item.url.match(/\/(\d+)(?:\/|$)/);
        if (urlMatch) {
          const newsId = urlMatch[1];
          navigation.navigate('NewsDetailsScreen', { 
            newsId: newsId,
            newsItem: { id: newsId, newsid: newsId }
          });
        } else {
          // If no news ID found, open in browser as fallback
          Linking.openURL(item.url);
        }
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Section Header ──────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => navigation.navigate('SpecialTodayScreen', {
          screenTitle: specialData.title || 'சிறப்பு இன்று',
          apiEndpoint: 'https://api-st-cdn.dinamalar.com/specialtoday',
          allTabLink: 'https://www.dinamalar.com/specialtoday'
        })}
      >
        <View style={styles.iconContainer}>
          <SpecialCalendar size={30} />
          <Text style={[styles.sectionTitle, { fontSize: ms(18) }]}>{specialData.title}</Text>
        </View>
        <View style={styles.sectionUnderline} />
      </TouchableOpacity>

      <View style={styles.contentContainer}>
        {specialData.data.map((item, index) => (
          <TouchableOpacity
            key={`special-${index}-${item.key}`}
            style={styles.tagButton}
            onPress={() => handleTagPress(item)}
            activeOpacity={0.8}
          >
            <Text style={styles.tagText} numberOfLines={1}>
              {item.key}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default SpecialToday;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: s(16),
    paddingVertical: vs(12),
    backgroundColor: '#ffffff',
  },

  // Section Header
  sectionHeader: {
    //  paddingHorizontal: s(12),
    paddingTop: vs(14),
    paddingBottom: vs(15),
  },
  iconContainer: {
    marginRight: s(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8)
  },
  sectionTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    color: COLORS.grey800,
  },
  sectionUnderline: {
    height: vs(3),
    width: s(80),
    backgroundColor: COLORS.primary,
    marginTop: vs(2),
  },


  contentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: s(8),
  },

  tagButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: s(20),
    paddingHorizontal: s(12),
    paddingVertical: vs(4),
    alignItems: 'center',
    justifyContent: 'center',
  },

  tagText: {
    fontSize: s(14),
    color: '#1a1a1a',
    fontFamily: FONTS?.muktaMalar?.semibold || 'System',
  },
});