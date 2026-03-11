import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { s, vs } from '../utils/scaling';
import axios from 'axios';
import { FONTS } from '../utils/constants';
import { ms } from 'react-native-size-matters';
import { useFontSize } from '../context/FontSizeContext';

// ─── Exact colors from screenshot ────────────────────────────────────────────
// Pills:     white bg (#FFFFFF), border (#D8D8D8), text (#212B36 near-black)
// Icon box:  white bg, gray border (#D0D0D0), blue icon (#096dd2)
// Divider:   #EBEBEB between rows
// Wrapper bg: white

const CategoryTab = ({
  selectedCategory,
  onCategoryPress,
  trendingTags = [],
}) => {
  const { sf } = useFontSize(); // Add font scaling
  
  const [specialTodayData, setSpecialTodayData] = useState([]);
  const [loadingSpecial, setLoadingSpecial] = useState(false);
  const [row1Active, setRow1Active] = useState(null);
  const [row2Active, setRow2Active] = useState(null);

  const safeTrendingTags = Array.isArray(trendingTags) ? trendingTags : [];

  useEffect(() => {
    fetchSpecialTodayData();
  }, []);

  const fetchSpecialTodayData = async () => {
    try {
      setLoadingSpecial(true);
      const response = await axios.get('https://api-st-cdn.dinamalar.com/home');
      const data     = response.data;
      const specialData = data?.specialtoday?.data || [];
      setSpecialTodayData(specialData.slice(0, 8));
    } catch (error) {
      console.error('Error fetching Special Today data:', error);
      setSpecialTodayData([]);
    } finally {
      setLoadingSpecial(false);
    }
  };

  // Row 1 tags from trendingTags
  const row1Tags = safeTrendingTags.map((tag, index) => ({
    id:   tag.key || `tag-${index}`,
    name: tag.key || `Tag ${index + 1}`,
    url:  tag.url || null,
  }));

  const handleRow1Press = (tag) => {
    setRow1Active(row1Active === tag.id ? null : tag.id);
    if (tag.url) Linking.openURL(tag.url);
    else onCategoryPress?.(tag.id);
  };

  const handleRow2Press = (item, index) => {
    const id = item.key || `special-${index}`;
    setRow2Active(row2Active === id ? null : id);
    const url = item.url || item.link || item.Url;
    if (url) Linking.openURL(url);
    else onCategoryPress?.(id);
  };

  if (row1Tags.length === 0 && specialTodayData.length === 0 && !loadingSpecial) {
    return null;
  }

  return (
    <View style={st.wrapper}>

      {/* ── Row 1: Trending ─────────────────────────────────────────────── */}
      {row1Tags.length > 0 && (
        <View style={st.row}>
          {/* Icon box — square, white bg, gray border, blue icon */}
          <View style={st.iconBox}>
            <Ionicons name="trending-up" size={sf(16)} color="#096dd2" />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            indicatorStyle="black"
            contentContainerStyle={st.scrollContent}
            style={st.scroll}
          >
            {row1Tags.map((tag) => {
              const isActive = row1Active === tag.id;
              return (
                <TouchableOpacity
                  key={tag.id}
                  style={[st.pill, isActive && st.pillActive]}
                  onPress={() => handleRow1Press(tag)}
                  activeOpacity={0.7}
                >
                  <Text style={[st.pillText, isActive && st.pillTextActive, { fontSize: sf(11) }]}>
                    {tag.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Thin divider between rows */}
      {row1Tags.length > 0 && (specialTodayData.length > 0 || loadingSpecial) && (
        <View style={st.rowDivider} />
      )}

      {/* ── Row 2: Special Today ─────────────────────────────────────────── */}
      {(specialTodayData.length > 0 || loadingSpecial) && (
        <View style={st.row}>
          {/* Icon box — calendar, same style */}
          <View style={st.iconBox}>
            <Ionicons name="calendar-clear-outline" size={sf(15)} color="#096dd2" />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            indicatorStyle="black"
            contentContainerStyle={st.scrollContent}
            style={st.scroll}
          >
            {loadingSpecial ? (
              <ActivityIndicator size="small" color="#096dd2" style={{ marginLeft: sf(8) }} />
            ) : (
              specialTodayData.map((item, index) => {
                const id       = item.key || `special-${index}`;
                const isActive = row2Active === id;
                return (
                  <TouchableOpacity
                    key={id}
                    style={[st.pill, isActive && st.pillActive]}
                    onPress={() => handleRow2Press(item, index)}
                    activeOpacity={0.7}
                  >
                    <Text style={[st.pillText, isActive && st.pillTextActive,{ fontSize: sf(11) }]}>
                      {item.key}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      )}

    </View>
  );
};

// ─── Styles — pixel-matched to screenshot ────────────────────────────────────
const st = StyleSheet.create({

  // Wrapper — pure white, bottom border
  wrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },

  // Row: icon + scrollable pills
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(7),
    paddingRight: s(8),
  },

  // Icon box — white bg, gray border, slight rounding matching screenshot
  iconBox: {
    width:           sf(32),
    height:          sf(32),
    borderWidth:     1,
    borderColor:     '#D0D0D0',   // matches screenshot gray border
    backgroundColor: '#FFFFFF',   // white bg — matches screenshot
    borderRadius:    sf(4),        // slight rounding — matches screenshot
    alignItems:      'center',
    justifyContent:  'center',
    marginLeft:      sf(10),
    marginRight:     sf(8),
    flexShrink:      0,
  },

  scroll: { flex: 1 },

  scrollContent: {
    paddingHorizontal: sf(2),
    alignItems:        'center',
    gap:               sf(8),      // gap between pills — matches screenshot spacing
    paddingVertical:   vs(2),
  },

  // Pill — WHITE background, GRAY border, DARK text — exact screenshot match
  pill: {
    borderWidth:     1,
    borderColor:     '#D8D8D8',   // screenshot gray border — slightly darker than wrapper
    borderRadius:    sf(20),       // fully rounded pill
    paddingHorizontal: sf(14),
    paddingVertical: vs(5),
    backgroundColor: '#eeeeee',   // pure white — matches screenshot
    alignItems:      'center',
    justifyContent:  'center',
  },

  // Active pill — blue bg, blue border
  pillActive: {
    backgroundColor: '#096dd2',
    borderColor:     '#096dd2',
  },

  // Pill text — near-black — matches screenshot dark text on white pill
  pillText: {
    fontFamily: FONTS.muktaMalar.medium,
    fontSize:   sf(13),
    color:      '#212B36',        // GREY[800] — near-black, matches screenshot
    textAlign:  'center',
  },

  // Active text — white
  pillTextActive: {
    fontFamily: FONTS.muktaMalar.bold,
    color:      '#FFFFFF',
    fontSize:   sf(13),
  },

  // Thin divider between row 1 and row 2
  rowDivider: {
    height:          1,
    backgroundColor: '#EBEBEB',   // matches screenshot thin gray line
    marginHorizontal: sf(10),
  },
});

export default CategoryTab;