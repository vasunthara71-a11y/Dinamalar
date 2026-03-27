import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Linking } from 'react-native';
import { s, vs } from '../utils/scaling';
import { COLORS, FONTS } from '../utils/constants';
import { SpeakerIcon, TrendingIcon } from '../assets/svg/Icons';
import { ms } from 'react-native-size-matters';

const TrendingTags = ({ trendingData }) => {
  const navigation = useNavigation();

  // Don't render if no trending data or empty array
  if (!trendingData || !trendingData.data || trendingData.data.length === 0) {
    return null;
  }

  const handleTagPress = (item) => {
    if (item.slug) {
      navigation.navigate(item.slug === '/search' ? 'SearchScreen' : 'CommonSectionScreen', {
        searchTerm: item.key,
        screenTitle: item.key,
        apiEndpoint: `https://www.dinamalar.com/search/${item.key}_`,
      });
    } else if (item.url) {
      Linking.openURL(item.url);
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Section Header ──────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => { }}
        disabled={true}
      >
        <View style={styles.iconContainer}>
          <TrendingIcon size={30} />
          <Text style={[styles.sectionTitle, { fontSize: ms(18) }]}>{trendingData.title}</Text>

        </View>
        <View style={styles.sectionUnderline} />
      </TouchableOpacity>

      <View style={styles.contentContainer}>
        {trendingData.data.map((item, index) => (
          <TouchableOpacity
            key={`trending-${index}-${item.key}`}
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

export default TrendingTags;

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
    gap: ms(5)
  },
  sectionTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    color: COLORS.grey800,
  },
  sectionUnderline: {
    height: vs(3),
    width: s(60),
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
