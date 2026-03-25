import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, Alert, ActivityIndicator, Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BookmarkSaved } from '../assets/svg/Icons';
import { getBookmarkedNews, removeBookmark } from '../utils/storage';
import { COLORS, FONTS } from '../utils/constants';
import { s, vs } from '../utils/scaling';
import UniversalHeaderComponent from '../components/UniversalHeaderComponent';
import AppHeaderComponent from '../components/AppHeaderComponent';

// Generate a unique identifier for news items (matching storage.js)
const getNewsUniqueId = (newsItem) => {
  const identifier = [
    newsItem.id || '',
    newsItem.newsid || '',
    newsItem.newstitle || '',
    newsItem.slug || '',
    newsItem.newsdate || ''
  ].join('|');
  
  return identifier;
};

const BookmarkListScreen = () => {
  const navigation = useNavigation();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLocationDrawerVisible, setIsLocationDrawerVisible] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('உள்ளூர்');

  // Platform-specific variables
  const isIOS = Platform.OS === 'ios';
  const isAndroid = Platform.OS === 'android';
  const platformVersion = Platform.Version;

  const goToSearch = () => navigation?.navigate('SearchScreen');
  const goToNotifs = () => navigation?.navigate('NotificationScreen');
  const handleSelectDistrict = (district) => {
    setSelectedDistrict(district.title);
    setIsLocationDrawerVisible(false);
    if (district.id) {
      navigation?.navigate('DistrictNewsScreen', {
        districtId: district.id,
        districtTitle: district.title
      });
    }
  };

  // Platform-specific bookmark removal
  const handleRemoveBookmark = async (bookmark) => {
    if (isIOS) {
      // iOS-specific alert style
      Alert.alert(
        'புக்மார்க் நீக்குதல்',
        'இந்த புக்மார்க்கை நீக்க விரும்புகிறீர்களா?',
        [
          { text: 'இல்லை', style: 'cancel' },
          {
            text: 'ஆம்',
            style: 'destructive',
            onPress: async () => {
              const success = await removeBookmark(bookmark);
              if (success) {
                const bookmarkUniqueId = getNewsUniqueId(bookmark);
                setBookmarks(prev => prev.filter(item => 
                  getNewsUniqueId(item) !== bookmarkUniqueId
                ));
              }
            }
          }
        ]
      );
    } else {
      // Android-specific alert style
      Alert.alert(
        'புக்மார்க் நீக்குதல்',
        'இந்த புக்மார்க்கை நீக்க விரும்புகிறீர்களா?',
        [
          {
            text: 'ஆம்', onPress: async () => {
              const success = await removeBookmark(bookmark);
              if (success) {
                const bookmarkUniqueId = getNewsUniqueId(bookmark);
                setBookmarks(prev => prev.filter(item => 
                  getNewsUniqueId(item) !== bookmarkUniqueId
                ));
              }
            }
          },
          { text: 'இல்லை', style: 'cancel' }
        ],
        { cancelable: false }
      );
    }
  };

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      const savedBookmarks = await getBookmarkedNews();
      setBookmarks(savedBookmarks.reverse()); // Show newest first
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewsPress = (bookmark) => {
    navigation.navigate('NewsDetailsScreen', {
      newsId: bookmark.id || bookmark.newsid,
      newsItem: bookmark
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ta-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderBookmark = ({ item }) => {
    const title = item.newstitle || item.title || '';
    const image = item.largeimages || item.images || '';
    const date = formatDate(item.bookmarkedAt);

    // Platform-specific styling (detect inside function to avoid scope issues)
    const isIOS = Platform.OS === 'ios';
    const isAndroid = Platform.OS === 'android';
    
    const itemStyle = [
      styles.bookmarkItem,
      isIOS && styles.bookmarkItemIOS,
      isAndroid && styles.bookmarkItemAndroid
    ];

    const imageStyle = [
      styles.bookmarkImage,
      isIOS && styles.bookmarkImageIOS,
      isAndroid && styles.bookmarkImageAndroid
    ];

    return (
      <TouchableOpacity
        style={itemStyle}
        onPress={() => handleNewsPress(item)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: image || 'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400' }}
          style={imageStyle}
          resizeMode="cover"
        />
        <View style={styles.bookmarkContent}>
          <Text style={[styles.bookmarkTitle, isIOS && styles.bookmarkTitleIOS]} numberOfLines={3}>
            {title}
          </Text>
          <View style={styles.bookmarkFooter}>
            <Text style={[styles.bookmarkDate, isAndroid && styles.bookmarkDateAndroid]}>{date}</Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveBookmark(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <BookmarkSaved size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    // Platform-specific styling
    const isIOS = Platform.OS === 'ios';

    if (loading) {
      return (
        <View style={[
          styles.loadingContainer,
          isIOS && { paddingTop: vs(40) }
        ]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>ஏற்றுகிறது...</Text>
        </View>
      );
    }

    if (bookmarks.length === 0) {
      return (
        <View style={[
          styles.emptyContainer,
          isIOS && { paddingTop: vs(60) }
        ]}>
          <BookmarkSaved size={48} color={COLORS.subtext} />
          <Text style={styles.emptyTitle}>புக்மார்க்கள் இல்லை</Text>
          <Text style={styles.emptySubtitle}>செய்திகளை புக்மார்க் செய்யவும்</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={bookmarks}
        renderItem={renderBookmark}
        keyExtractor={(item, index) =>
          `bookmark-${item.id || item.newsid || index}`
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <View style={styles.container}>
      <UniversalHeaderComponent
        statusBarStyle="dark-content"
        statusBarBackgroundColor={COLORS.white}
        onMenuPress={() => setIsDrawerVisible(true)}
        onNotification={goToNotifs}
        notifCount={0}
        isDrawerVisible={isDrawerVisible}
        setIsDrawerVisible={setIsDrawerVisible}
        navigation={navigation}
        isLocationDrawerVisible={isLocationDrawerVisible}
        setIsLocationDrawerVisible={setIsLocationDrawerVisible}
        onSelectDistrict={handleSelectDistrict}
        selectedDistrict={selectedDistrict}
      >
        <AppHeaderComponent
          onSearch={goToSearch}
          onMenu={() => setIsDrawerVisible(true)}
          onLocation={() => setIsLocationDrawerVisible(true)}
          selectedDistrict="உள்ளூர்"
        />
      </UniversalHeaderComponent>

      {/* ── Page Title ── */}
      <View style={styles.pageTitleWrap}>
        <Text style={[styles.pageTitle, { fontFamily: FONTS?.anek?.bold }]}>
          புக்மார்க் செய்தவை
        </Text>
      </View>

      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white, paddingTop: Platform.OS === 'android' ? vs(30) : 0 },

  pageTitleWrap: {
    paddingTop: vs(14),
    paddingBottom: vs(6),
    backgroundColor: '#fff',
  },
  pageTitle: {
    fontSize: s(18),
    fontFamily: FONTS?.anek?.bold,
    color: '#111',
    paddingHorizontal: s(12),
    marginBottom: vs(4),
  },
  listContainer: {
    padding: s(12),
  },
  bookmarkItem: {
    backgroundColor: 'white',
    borderRadius: s(12),
    marginBottom: s(12),
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  bookmarkItemIOS: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  bookmarkItemAndroid: {
    elevation: 3,
  },
  bookmarkImage: {
    width: s(100),
    // height: s(100),
    backgroundColor: '#f0f0f0',
  },
  bookmarkImageIOS: {
    borderRadius: s(8),
  },
  bookmarkImageAndroid: {
    borderRadius: s(4),
  },
  bookmarkContent: {
    flex: 1,
    padding: s(12),
    justifyContent: 'space-between',
  },
  bookmarkTitle: {
    fontSize: s(14),
    color: COLORS.text,
    lineHeight: s(20),
    fontFamily: FONTS?.muktaMalar?.medium,
    flex: 1,
  },
  bookmarkTitleIOS: {
    fontFamily: FONTS?.muktaMalar?.semibold,
  },
  bookmarkFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: s(8),
  },
  bookmarkDate: {
    fontSize: s(12),
    color: COLORS.subtext,
    fontFamily: FONTS?.muktaMalar?.regular,
  },
  bookmarkDateAndroid: {
    fontFamily: FONTS?.muktaMalar?.medium,
  },
  removeButton: {
    padding: s(4),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingTop: vs(20),
  },
  loadingText: {
    marginTop: s(12),
    fontSize: s(14),
    color: COLORS.subtext,
    fontFamily: FONTS?.muktaMalar?.medium,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: s(40),
    paddingTop: vs(40),
  },
  emptyTitle: {
    fontSize: s(18),
    color: COLORS.text,
    fontFamily: FONTS?.muktaMalar?.bold,
    marginTop: s(16),
    marginBottom: s(8),
  },
  emptySubtitle: {
    fontSize: s(14),
    color: COLORS.subtext,
    fontFamily: FONTS?.muktaMalar?.medium,
    textAlign: 'center',
  },
});

export default BookmarkListScreen;
