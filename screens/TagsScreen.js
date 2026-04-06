import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { s, vs, ms } from '../utils/scaling';
import { COLORS, FONTS } from '../utils/constants';
import { useFontSize } from '../context/FontSizeContext';
import axios from 'axios';
import UniversalHeaderComponent from '../components/UniversalHeaderComponent';
import AppHeaderComponent from '../components/AppHeaderComponent';

const { width: SCREEN_W } = Dimensions.get('window');

const TAGS_API_BASE = 'https://api-st-cdn.dinamalar.com/taglist';

const TagsScreen = () => {
  const navigation = useNavigation();
  const { sf } = useFontSize();

  const [loading, setLoading] = useState(false);
  const [tagsData, setTagsData] = useState({});
  const [activeTab, setActiveTab] = useState('All');
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [cachedData, setCachedData] = useState({}); // Cache for loaded data

  // Header state variables
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isLocationDrawerVisible, setIsLocationDrawerVisible] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('உள்ளூர்');

  // Alphabet tabs including #
  const alphabetTabs = ['All', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#'];

  useEffect(() => {
    if (activeTab === 'All') {
      fetchAllTagsData();
    } else {
      fetchTagsByLetter(activeTab);
    }
  }, [activeTab]);

  const fetchAllTagsData = async () => {
    try {
      setLoading(true);
      const allTags = {};
      
      // Fetch data for all letters
      const letters = alphabetTabs.slice(1); // Exclude 'All'
      const promises = letters.map(async (letter) => {
        try {
          const response = await axios.get(`${TAGS_API_BASE}?letter=${letter === '#' ? 'other' : letter}`);
          const tags = response.data?.newslist?.[letter]?.data || [];
          return { letter, data: tags };
        } catch (error) {
          console.error(`Error fetching tags for letter ${letter}:`, error);
          return { letter, data: [] };
        }
      });

      const results = await Promise.all(promises);
      
      // Group all tags by their first letter
      results.forEach(({ letter, data }) => {
        allTags[letter] = data;
      });

      setCachedData(allTags);
      setTagsData(allTags);
    } catch (error) {
      console.error('Error fetching all tags data:', error);
      setTagsData({});
    } finally {
      setLoading(false);
    }
  };

  const fetchTagsByLetter = async (letter) => {
    // Check if already cached
    if (cachedData[letter]) {
      setTagsData({ [letter]: cachedData[letter] });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${TAGS_API_BASE}?letter=${letter === '#' ? 'other' : letter}`);
      const tags = response.data?.newslist?.[letter]?.data || [];

      // Update cache
      const updatedCache = { ...cachedData, [letter]: tags };
      setCachedData(updatedCache);
      setTagsData({ [letter]: tags });
    } catch (error) {
      console.error(`Error fetching tags for letter ${letter}:`, error);
      setTagsData({ [letter]: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleTagPress = (tag) => {
    // Extract search term from tag object
    const searchTerm = tag.keywords || tag.name || tag.key || tag;
    // Navigate to SearchScreen with search term
    navigation.navigate('SearchScreen', {
      searchTerm: searchTerm
    });
  };

  const handleTabPress = (tab) => {
    setActiveTab(tab);
    setSelectedLetter(tab === 'All' ? null : tab);
  };

  // Header functions
  const goToSearch = () => navigation.navigate('SearchScreen');

  const handleMenuPress = (menuItem) => {
    const link = menuItem?.Link || menuItem?.link || '';
    const title = menuItem?.Title || menuItem?.title || '';
    if (link && (link.startsWith('http://') || link.startsWith('https://'))) {
      // External link - could open in browser if needed
      console.log('External menu link:', link);
    } else {
      // Internal navigation
      navigation?.navigate('TimelineScreen', { catName: title });
    }
  };

  const handleSelectDistrict = (district) => {
    setSelectedDistrict(district.title);
    setIsLocationDrawerVisible(false);
    if (district.id) {
      navigation?.navigate('DistrictNewsScreen', {
        districtId: district.id,
        districtTitle: district.title,
      });
    }
  };

  const renderTagItem = ({ item }) => (
    <TouchableOpacity
      style={styles.tagItem}
      onPress={() => handleTagPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.tagIcon}>
        <Ionicons name="ellipse" size={s(12)} color={COLORS.primary} />
      </View>
      <Text style={[styles.tagText, { fontSize: sf(14) }]}>
        {item.keywords || item.name || item.key || item.title || 'Unknown'}
      </Text>
    </TouchableOpacity>
  );

  const renderTagsSection = (letter) => {
    const tags = tagsData[letter] || [];
    if (tags.length === 0) return null;

    return (
      <View style={styles.letterSection}>
        <View style={styles.letterHeader}>
          <TouchableOpacity onPress={() => handleTabPress(letter)}>
            <Text style={[styles.letterText, { fontSize: sf(18) }]}>{letter}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.tagsGrid}>
          {tags.map((tag, index) => (
            <View key={`${letter}-${index}`} style={styles.tagGridItem}>
              {renderTagItem({ item: tag })}
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { fontSize: sf(16) }]}>Loading tags...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <UniversalHeaderComponent
        showMenu showSearch showNotifications showLocation
        onSearch={goToSearch}
        onLocation={() => setIsLocationDrawerVisible(true)}
        selectedDistrict={selectedDistrict}
        navigation={navigation}
        isDrawerVisible={isDrawerVisible}
        setIsDrawerVisible={setIsDrawerVisible}
        isLocationDrawerVisible={isLocationDrawerVisible}
        setIsLocationDrawerVisible={setIsLocationDrawerVisible}
        onSelectDistrict={handleSelectDistrict}
      >
        <AppHeaderComponent
          onSearch={goToSearch}
          onMenu={() => setIsDrawerVisible(true)}
          onLocation={() => setIsLocationDrawerVisible(true)}
          selectedDistrict={selectedDistrict}
        />
      </UniversalHeaderComponent>

      {/* Alphabet Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {alphabetTabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tabButton,
              activeTab === tab && styles.tabButtonActive
            ]}
            onPress={() => handleTabPress(tab)}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.tabText,
              { fontSize: sf(12) },
              activeTab === tab && styles.tabTextActive
            ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Tags Content */}
      <ScrollView
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'All' ? (
          // Show all tags when "All" is selected
          alphabetTabs.slice(1).map(letter => (
            <View key={letter}>
              {renderTagsSection(letter)}
            </View>
          ))
        ) : (
          // Show specific letter tags
          renderTagsSection(activeTab)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: '#f2f2f2', paddingTop: Platform.OS === 'android' ? vs(0) : 20 },


  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(16),
    paddingVertical: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grey200,
  },
  backButton: {
    padding: s(4),
  },
  headerTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    color: COLORS.grey800,
    marginLeft: s(12),
  },
  headerSpacer: {
    flex: 1,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: FONTS.muktaMalar.medium,
    color: COLORS.grey600,
    marginTop: vs(8),
  },

  // Tabs
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grey200,
    maxHeight: vs(70),
  },
  tabsContent: {
    paddingHorizontal: s(4),
    alignItems: 'center',
    gap: s(4),
  },
  tabButton: {
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
    marginHorizontal: s(1),
    borderRadius: s(4),
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    minWidth: s(35),
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontFamily: FONTS.muktaMalar.medium,
    color: COLORS.primary,
  },
  tabTextActive: {
    color: COLORS.white,
  },

  // Content
  contentContainer: {
    flex: 1,
    paddingHorizontal: s(16),
  },

  // Letter Section
  letterSection: {
    marginBottom: vs(20),
   
  },
  letterHeader: {
    marginBottom: vs(12),
  },
  letterText: {
    fontFamily: FONTS.muktaMalar.semibold,
    color: COLORS.primary,
    // fontWeight: '700',
  },

  // Tags Grid
  tagsGrid: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
     borderWidth:1,
    borderColor:COLORS.grey400
  },
  tagGridItem: {
    width: '48%',
    // marginBottom: vs(8),
  },

  // Tag Item
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(8),
    paddingHorizontal: s(8),
    // backgroundColor: COLORS.grey500,
    // borderRadius: s(8),
    // borderWidth: 1,
    borderColor: COLORS.grey200,
  },
  tagIcon: {
    marginRight: s(8),
  },
  tagText: {
    fontFamily: FONTS.muktaMalar.medium,
    color: COLORS.grey800,
    flex: 1,
  },
});

export default TagsScreen;
