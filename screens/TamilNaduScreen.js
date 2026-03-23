import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  RefreshControl,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { CDNApi, API_ENDPOINTS } from '../config/api';
import { COLORS } from '../utils/constants';
import { s, vs, scaledSizes } from '../utils/scaling';
import { ms } from 'react-native-size-matters';
import UniversalHeaderComponent from '../components/UniversalHeaderComponent';
import AppHeaderComponent from '../components/AppHeaderComponent';

// ─── HTML Rendering Config ───────────────────────────────────────────────
const htmlConfig = {
  baseStyle: {
    fontSize: scaledSizes.font.xs,
    color: COLORS.subtext,
    lineHeight: scaledSizes.lineHeight.sm,
  },
  tagsStyles: {
    p: {
      margin: 0,
      marginBottom: vs(2),
      fontSize: scaledSizes.font.xs,
      color: COLORS.subtext,
      lineHeight: scaledSizes.lineHeight.sm,
    },
    strong: {
      fontWeight: '700',
      color: COLORS.text,
    },
    b: {
      fontWeight: '700',
      color: COLORS.text,
    },
    em: {
      fontStyle: 'italic',
      color: COLORS.subtext,
    },
    i: {
      fontStyle: 'italic',
      color: COLORS.subtext,
    },
  },
  ignoredTags: ['script', 'style'],
  enableUserAgentStyles: false,
  enableExperimentalMarginCollapsing: true,
};

// ─── Tamil Nadu Screen ───────────────────────────────────────────
export default function TamilNaduScreen() {
  const navigation = useNavigation();
  
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isLocationDrawerVisible, setIsLocationDrawerVisible] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('உள்ளூர்');

  // ─── Navigation Handlers ───────────────────────────────────────────────────────
  const handleMenuPress = (menuItem) => {
    const link  = menuItem?.Link  || menuItem?.link  || '';
    const title = menuItem?.Title || menuItem?.title || '';

    console.log('TamilNadu: Clicked menu:', title);
    console.log('TamilNadu: Link value:', link);

    // Handle navigation logic here
    if (link.startsWith('http://') || link.startsWith('https://') || link.startsWith('www.')) {
      Linking.openURL(link);
      return;
    }

    // Add other navigation logic as needed
  };

  const goToSearch = () => navigation?.navigate('SearchScreen');
  const goToNotifs = () => navigation?.navigate('NotificationScreen');

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

  // ─── Fetch Tamil Nadu News ───────────────────────────────────────
  const fetchTamilNaduNews = useCallback(async (pageNum = 1, isRefresh = false) => {
    try {
      if (pageNum === 1) {
        isRefresh ? setRefreshing(true) : setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Use correct API endpoint for Tamil Nadu news (category ID 89)
      const response = await CDNApi.get('/newsdata?cat=89');
      const newsData = response.data?.detail || [];

      console.log('Tamil Nadu news response:', response.data);
      console.log('News items count:', newsData.length);

      if (newsData.length === 0) {
        setHasMore(false);
      } else {
        setNews(prev => pageNum === 1 ? newsData : [...prev, ...newsData]);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching Tamil Nadu news:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  // ─── Effects ───────────────────────────────────────────────────────
  useEffect(() => {
    fetchTamilNaduNews(1);
  }, [fetchTamilNaduNews]);

  // ─── Event Handlers ───────────────────────────────────────────────
  const onRefresh = useCallback(() => {
    setHasMore(true);
    fetchTamilNaduNews(1, true);
  }, [fetchTamilNaduNews]);

  const onEndReached = useCallback(() => {
    if (!loadingMore && hasMore && !loading) {
      fetchTamilNaduNews(page + 1);
    }
  }, [loadingMore, hasMore, loading, page, fetchTamilNaduNews]);

  const goToArticle = (item) => {
    const newsId = item.id || item.newsid;
    
    navigation.navigate('NewsDetailsScreen', {
      newsId,
      newsItem: item,
    });
  };

  // ─── Render News Item ───────────────────────────────────────────────
  const renderNewsItem = ({ item, index }) => {
    const hasImage = !!item.images || !!item.imageurl;
    const isVideo = item.maincat === 'video' || item.path?.includes('youtube');
    
    return (
      <TouchableOpacity 
        style={styles.newsItem}
        onPress={() => goToArticle(item)}
        activeOpacity={0.7}
      >
        {/* Image/Video Thumbnail */}
        {hasImage && !isVideo && (
          <Image 
            source={{ uri: item.images || item.imageurl }} 
            style={styles.newsImage}
            resizeMode="cover"
          />
        )}
        
        {isVideo && (
          <View style={styles.videoThumbnail}>
            <Ionicons name="play-circle" size={s(32)} color="#fff" />
          </View>
        )}

        {/* Content */}
        <View style={styles.newsContent}>
          {/* Category Badge */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {item.categrorytitle || item.catengtitle || 'தமிழகம்'}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.newsTitle} numberOfLines={3}>
            {item.newstitle || item.title || 'செய்தி தலைப்பு'}
          </Text>

          {/* HTML Content Preview */}
          {item.content && (
            <View style={styles.contentPreview}>
              <RenderHtml
                contentWidth={Dimensions.get('window').width - s(140)}
                source={{ html: item.content }}
                {...htmlConfig}
              />
            </View>
          )}

          {/* Meta Info */}
          <View style={styles.metaInfo}>
            <Text style={styles.dateText}>
              {item.standarddate || item.date || ''}
            </Text>
            <Text style={styles.timeText}>
              {item.time || ''}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Render Loading ───────────────────────────────────────────────
  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.footerLoaderTxt}>ஏற்றுகிறது...</Text>
      </View>
    );
  };

  // ─── Render Empty State ───────────────────────────────────────────
  const renderEmptyState = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyState}>
        <Ionicons name="newspaper-outline" size={s(60)} color={COLORS.subtext} />
        <Text style={styles.emptyStateTitle}>தமிழகம் செய்திகள்</Text>
        <Text style={styles.emptyStateSubtitle}>தற்போது செய்திகள் இல்லை</Text>
      </View>
    );
  };

  // ─── Main Render ─────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <UniversalHeaderComponent
        statusBarStyle="light-content"
        statusBarBackgroundColor={COLORS.primary}
        onMenuPress={handleMenuPress}
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
          selectedDistrict=""
        />
      </UniversalHeaderComponent>

      {/* News List */}
      <FlatList
        data={news}
        renderItem={renderNewsItem}
        keyExtractor={(item, index) => `tamilnadu-${item.id || item.newsid || index}`}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>ஏற்றுகிறது...</Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? vs(30) : 0,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: s(12),
    paddingTop: vs(50), // Status bar space
    paddingBottom: vs(12),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: vs(2) },
    shadowOpacity: 0.2,
    shadowRadius: s(4),
  },
  headerButton: {
    padding: s(8),
  },
  headerTitle: {
    flex: 1,
    fontSize: scaledSizes.font.lg,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: s(16),
  },
  headerRight: {
    flexDirection: 'row',
  },

  // List
  listContainer: {
    padding: s(12),
  },

  // News Item
  newsItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: s(12),
    marginBottom: vs(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: s(1) },
    shadowOpacity: 0.1,
    shadowRadius: s(3),
    overflow: 'hidden',
  },
  newsImage: {
    width: s(100),
    height: vs(80),
    backgroundColor: '#f0f0f0',
  },
  videoThumbnail: {
    width: s(100),
    height: vs(80),
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newsContent: {
    flex: 1,
    padding: s(12),
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: s(8),
    paddingVertical: vs(3),
    borderRadius: s(12),
    marginBottom: vs(6),
  },
  categoryText: {
    fontSize: scaledSizes.font.xs,
    fontWeight: '700',
    color: COLORS.primary,
  },
  newsTitle: {
    fontSize: scaledSizes.font.sm,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: scaledSizes.lineHeight.md,
    marginBottom: vs(6),
  },
  contentPreview: {
    marginBottom: vs(6),
    maxHeight: vs(40),
    overflow: 'hidden',
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: scaledSizes.font.xs,
    color: COLORS.subtext,
  },
  timeText: {
    fontSize: scaledSizes.font.xs,
    color: COLORS.subtext,
  },

  // Loading
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: vs(10),
    fontSize: scaledSizes.font.md,
    color: COLORS.subtext,
  },

  // Footer Loader
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: vs(16),
  },
  footerLoaderTxt: {
    marginLeft: s(8),
    fontSize: scaledSizes.font.sm,
    color: COLORS.subtext,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: vs(60),
  },
  emptyStateTitle: {
    fontSize: scaledSizes.font.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: vs(16),
    marginBottom: vs(8),
  },
  emptyStateSubtitle: {
    fontSize: scaledSizes.font.md,
    color: COLORS.subtext,
    textAlign: 'center',
  },
});
