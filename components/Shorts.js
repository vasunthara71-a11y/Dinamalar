import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { s, vs, ms } from '../utils/scaling';
import { COLORS, FONTS } from '../utils/constants';
import { useFontSize } from '../context/FontSizeContext';

const { width: SCREEN_W } = Dimensions.get('window');

const Shorts = ({ shortsData, onShortPress }) => {
  const { sf } = useFontSize();
  const [loading, setLoading] = useState(false);

  if (!shortsData || shortsData.length === 0) {
    return null;
  }

  const handleShortPress = (short) => {
    if (onShortPress) {
      onShortPress(short);
    } else if (short.link || short.url || short.slug) {
      const url = short.link || short.url || (short.slug ? `https://www.dinamalar.com${short.slug}` : null);
      if (url) {
        Linking.openURL(url);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { fontSize: sf(18) }]}>ஷார்ட்ஸ்</Text>
        <View style={styles.sectionUnderline} />
      </View>
      
      <View style={styles.gridContainer}>
        {shortsData.map((short, index) => (
          <TouchableOpacity
            key={`short-${index}`}
            style={styles.shortCard}
            onPress={() => handleShortPress(short)}
            activeOpacity={0.8}
          >
            <View style={styles.thumbnailContainer}>
              <Image
                source={{ uri: short.images || short.thumbnail || short.image || short.largeimages }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
              {short.duration && (
                <View style={styles.durationBadge}>
                  <Text style={[styles.durationText, { fontSize: sf(10) }]}>
                    {short.duration}
                  </Text>
                </View>
              )}
              {/* Title overlay at bottom */}
              <View style={styles.titleOverlay}>
                <Text style={[styles.shortTitle, { fontSize: ms(14) }]}  >
                  {short.title || short.newstitle || short.etitle || 'Short Video'}
                </Text>
                {short.views && (
                  <Text style={[styles.viewsText, { fontSize: sf(10) }]}>
                    {short.views} views
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: vs(12),
    paddingHorizontal: s(16),
        backgroundColor: '#ffffff',

  },
  // Section Header styles (matching HomeScreen)
  sectionHeader: {
    // paddingHorizontal: s(12),
    // paddingTop: vs(14),
    paddingVertical:ms(10)
   },
  sectionTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    color: '#4a4a4a', // PALETTE.grey800 equivalent
  },
  sectionUnderline: {
    height: vs(3),
    width: s(40),
    backgroundColor: COLORS.primary,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -s(6), // Negative margin to compensate for card margins
  },
  shortCard: {
    width: '50%', // 2 columns
    paddingHorizontal: s(6),
    marginBottom: vs(12),
  },
  thumbnailContainer: {
    width: '100%',
    aspectRatio: 9/16, // Vertical video aspect ratio
    borderRadius: s(12),
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  durationBadge: {
    position: 'absolute',
    bottom: s(8),
    left: s(8),
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: s(6),
    paddingVertical: s(2),
    borderRadius: s(4),
  },
  durationText: {
    color: '#fff',
    fontFamily: FONTS.muktaMalar.regular,
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: vs(10),
    paddingHorizontal: s(8),
    borderBottomLeftRadius: s(12),
    borderBottomRightRadius: s(12),
  },
  shortTitle: {
    fontFamily: FONTS.muktaMalar.semibold,
    fontSize: ms(14),
    color: '#FFFFFF',
    lineHeight: ms(22),
    textAlign: 'center',
  },
  viewsText: {
    fontFamily: FONTS.muktaMalar.regular,
    color: '#ccc',
    marginTop: vs(2),
  },
});

export default Shorts;
