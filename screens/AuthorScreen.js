// AuthorScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Dimensions,
  StatusBar,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { mainApi } from '../config/api';
import { COLORS, FONTS } from '../utils/constants';
import { s, vs, ms } from '../utils/scaling';
import { useFontSize } from '../context/FontSizeContext';
import UniversalHeaderComponent from '../components/UniversalHeaderComponent';
import AppHeaderComponent from '../components/AppHeaderComponent';
import NewsCard from '../components/NewsCard';
import DrawerMenu from '../components/DrawerMenu';
import LocationDrawer from '../components/LocationDrawer';
import ShareComponent from '../components/ShareComponent';
import { Editor } from '../assets/svg/Icons';
import CommentsModal from '../components/CommentsModal';

const { width: SCREEN_W } = Dimensions.get('window');
// --- Palette ------------------------------------------------------------------
const PALETTE = {
  primary: '#096dd2',
  grey100: '#F9FAFB',
  grey200: '#F4F6F8',
  grey300: '#DFE3E8',
  grey400: '#C4CDD5',
  grey500: '#919EAB',
  grey600: '#637381',
  grey700: '#637381',
  grey800: '#212B36',
  white: '#FFFFFF',
};
export default function AuthorScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { authorId, authorName } = route.params || {};
  const { sf } = useFontSize();

  console.log('AuthorScreen - authorName:', authorName);
  console.log('AuthorScreen - authorId:', authorId);

  const [authorNews, setAuthorNews] = useState([]);
  const [authorInfo, setAuthorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isLocationDrawerVisible, setIsLocationDrawerVisible] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('உள்ளூர்');
  const [isCommentsModalVisible, setIsCommentsModalVisible] = useState(false);
  const [selectedNewsItem, setSelectedNewsItem] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const flatListRef = useRef(null);

  const fetchAuthorNews = async (pageNum = 1, refresh = false) => {
    if (!authorId) return;

    try {
      if (refresh) {
        setRefreshing(true);
      } else if (pageNum === 1) {
        setLoading(true);
      }

      console.log('Fetching author news for authorId:', authorId);

      // Always use paginated approach to avoid duplication
      const response = await mainApi.get(`/author?authorid=${authorId}&page=${pageNum}`);
      const data = response.data;
      console.log('Author API response:', data);
      console.log('Author info in response:', data.authorinfo);

      if (data && data.newlist && data.newlist.data) {
        if (pageNum === 1) {
          setAuthorNews(data.newlist.data);
          if (data.authorinfo) {
            console.log('Setting author info:', data.authorinfo);
            setAuthorInfo(data.authorinfo);
          } else {
            console.log('No author info found in response');
          }
        } else {
          setAuthorNews(prev => [...prev, ...data.newlist.data]);
        }
        setHasMore(data.newlist.data.length > 0);

        // If we got data and it's the first page, fetch all remaining pages
        if (pageNum === 1 && data.newlist.data.length > 0) {
          const totalPages = data.newlist.last_page || 117; // Use API's last_page or default to 117
          console.log(`Total pages to fetch: ${totalPages}`);
          
          // Fetch all remaining pages
          for (let nextPage = 2; nextPage <= totalPages; nextPage++) {
            try {
              console.log(`Fetching page ${nextPage} of ${totalPages}`);
              const pageResponse = await mainApi.get(`/author?authorid=${authorId}&page=${nextPage}`);
              const pageData = pageResponse.data;

              if (pageData && pageData.newlist && pageData.newlist.data && pageData.newlist.data.length > 0) {
                setAuthorNews(prev => [...prev, ...pageData.newlist.data]);
                console.log(`Added ${pageData.newlist.data.length} items from page ${nextPage}`);
              } else {
                console.log(`No more data on page ${nextPage}, stopping pagination`);
                break;
              }
            } catch (pageError) {
              console.log(`Failed to fetch page ${nextPage}:`, pageError.message);
              // Don't break on 500 errors, just continue to next page
              if (pageError.response && pageError.response.status === 500) {
                console.log('500 error, continuing to next page');
                continue;
              } else {
                break;
              }
            }
          }
          setHasMore(false); // We've tried to fetch all pages
        }
      } else {
        console.log('No data found in author API response');
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching author news:', error);
      // Don't set hasMore to false on error, allow retry
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAuthorNews(1, true);
  }, [authorId]);

  const onRefresh = () => {
    setPage(1);
    fetchAuthorNews(1, true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchAuthorNews(nextPage, false);
    }
  };

  const handleMenuPress = () => {
    setIsDrawerVisible(true);
  };

  const goToSearch = () => {
    navigation.navigate('SearchScreen');
  };

  const handleLocationSelect = (district) => {
    if (!district) return;
    setSelectedDistrict(district.title);
    setIsLocationDrawerVisible(false);
    if (district.id) {
      navigation.navigate('DistrictNewsScreen', {
        districtId: district.id,
        districtTitle: district.title,
      });
    }
  };

  const goToNotifs = () => {
    navigation?.navigate('NotificationScreen');
  };

  const renderNewsItem = ({ item }) => (
    <NewsCard
      item={item}
      onPress={() => {
        navigation.navigate('NewsDetailsScreen', {
          newsId: item.newsid || item.id,
          newsItem: item,
        });
      }}
      onCommentPress={() => {
        setSelectedNewsItem(item);
        setIsCommentsModalVisible(true);
      }}
    />
  );

  const scrollToTop = () =>
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });

  const handleScroll = useCallback((e) => {
    setShowScrollTop(e.nativeEvent.contentOffset.y > 300);
  }, []);

  const renderFooter = () => {
    if (!hasMore) return null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loadingText}>ஏற்றுகிறது...</Text>
      </View>
    );
  };

  if (loading && authorNews.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
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
        onSelectDistrict={handleLocationSelect}
        selectedDistrict={selectedDistrict}
      >
        <AppHeaderComponent
          onSearch={goToSearch}
          onMenu={() => setIsDrawerVisible(true)}
          onLocation={() => setIsLocationDrawerVisible(true)}
          selectedDistrict={selectedDistrict}
        />
      </UniversalHeaderComponent>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>ஏற்றுகிறது...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

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
        onSelectDistrict={handleLocationSelect}
        selectedDistrict={selectedDistrict}
      >
        <AppHeaderComponent
          onSearch={goToSearch}
          onMenu={() => setIsDrawerVisible(true)}
          onLocation={() => setIsLocationDrawerVisible(true)}
          selectedDistrict={selectedDistrict}
        />
      </UniversalHeaderComponent>
      <FlatList
        ref={flatListRef}
        data={authorNews}
        renderItem={renderNewsItem}
        keyExtractor={(item, index) => `author-news-${item.newsid || item.id || index}`}
        contentContainerStyle={styles.newsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListHeaderComponent={() => (
          <View style={styles.authorInfoContainer}>
            <View style={styles.authorHeader}>
              <View style={styles.authorDetails}>
                <Editor size={30} />
                <Text style={[styles.authorName, { fontSize: sf(18) }]}>
                  {authorName}
                </Text>
              </View>
            </View>

            {/* Share Container */}
            <ShareComponent
              shareUrl={`https://www.dinamalar.com/author/${authorId}`}
              shareTitle={authorName}
              shareText={`${authorName} - தினமலர்`}
              containerStyle={styles.shareRow}
            />

            {/* <Text style={[styles.newsCount, { fontSize: sf(12) }]}>
              {authorNews.length} செய்திகள்
            </Text> */}
          </View>
        )}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      {/* Drawer Menu */}
      <DrawerMenu
        isVisible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
        onMenuPress={handleMenuPress}
        navigation={navigation}
      />

      {/* Location Drawer */}
      <LocationDrawer
        isVisible={isLocationDrawerVisible}
        onClose={() => setIsLocationDrawerVisible(false)}
        onSelectDistrict={handleLocationSelect}
        selectedDistrict={selectedDistrict}
      />

      {/* Comments Modal */}
      <CommentsModal
        visible={isCommentsModalVisible}
        onClose={() => setIsCommentsModalVisible(false)}
        newsId={selectedNewsItem?.newsid || selectedNewsItem?.id}
        newsTitle={selectedNewsItem?.newstitle || selectedNewsItem?.title}
        commentCount={selectedNewsItem?.newscomment || selectedNewsItem?.commentcount || 0}
      />

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <TouchableOpacity style={styles.scrollTopBtn} onPress={scrollToTop} activeOpacity={0.85}>
          <Ionicons name="arrow-up" size={s(20)} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: vs(40),
  },
  loadingText: {
    marginTop: vs(10),
    fontSize: ms(16),
    color: COLORS.text,
    fontFamily: FONTS.muktaMalar.regular,
  },
  authorInfoContainer: {
    // backgroundColor:PALETTE.grey200,
    paddingHorizontal: s(12),
    paddingVertical: vs(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#E5E7EB',
  },
  authorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(12),
    // backgroundColor: PALETTE.grey300,

  },
  authorImage: {
    width: s(60),
    height: s(60),
    borderRadius: s(30),
    backgroundColor: COLORS.grey || '#F3F4F6',
  },
  authorDetails: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
  },
  authorName: {
    fontSize: ms(16),
    color: COLORS.text,
    fontFamily: FONTS.anek.bold,
    // marginBottom: vs(4),
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(12),
    gap: s(12),
  },
  shareCircle: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorDescription: {
    fontSize: ms(14),
    color: COLORS.subtext || '#637381',
    fontFamily: FONTS.muktaMalar.regular,
    lineHeight: vs(20),
    marginBottom: vs(4),
  },
  newsCount: {
    fontSize: ms(12),
    color: COLORS.subtext || '#637381',
    fontFamily: FONTS.muktaMalar.regular,
  },
  newsList: {
    // paddingHorizontal: s(16),
    paddingVertical: vs(8),
  },
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: vs(16),
    gap: s(8),
  },
  scrollTopBtn: {
    position: 'absolute',
    bottom: vs(50),
    right: s(16),
    width: s(42),
    height: s(42),
    borderRadius: s(21),
    backgroundColor: PALETTE.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: vs(2) },
    shadowOpacity: 0.22,
    shadowRadius: s(4),
    zIndex: 100,
  },
});
