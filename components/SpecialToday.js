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
      // For ALL special today tabs, open in WebView
      navigation.navigate('GenericWebViewScreen', {
        url: item.url,
        title: item.key || 'சிறப்பு இன்று'
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Section Header ──────────────────────────────────────── */}
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => navigation.navigate('SpecialTodayScreen', {
          screenTitle: specialData.title || 'சிறப்பு இன்று',
          apiEndpoint: 'https://api-st.dinamalar.com/specialtoday',
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
     paddingHorizontal: s(12),
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
    paddingVertical:ms(5)
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