// TharpothaiyaSeithigalScreen.js - Updated with HomeScreen NewsCard UI
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { u38Api, CATEGORY_MAP, SPECIAL_ENDPOINTS } from '../config/api';
import { COLORS, FONTS, NewsCard } from '../utils/constants';
import { s, vs, ms, scaledSizes } from '../utils/scaling';
import UniversalHeaderComponent from '../components/UniversalHeaderComponent';
import LocationDrawer from '../components/LocationDrawer';
import DrawerMenu from '../components/DrawerMenu';
import AppHeaderComponent from '../components/AppHeaderComponent';
import { mvs } from 'react-native-size-matters';
import TEXT_STYLES from '../utils/textStyles';
import { useFontSize } from '../context/FontSizeContext';

const PALETTE = {
  primary: '#096dd2',
  grey100: '#F9FAFB',
  grey200: '#F4F6F8',
  grey300: '#DFE3E8',
  grey400: '#C4CDD5',
  grey500: '#919EAB',
  grey600: '#637381',
  grey700: '#454F5B',
  grey800: '#212B36',
  white: '#FFFFFF',
};

const { width: SCREEN_W } = Dimensions.get('window');

// These tabs have their own dedicated screens — tap navigates away
const NAV_ONLY_TABS = [
  { id: 'varthagam', title: 'வர்த்தகம்',  screen: 'VarthagamScreen'    },
  { id: 'district',  title: 'உள்ளூர்',    screen: 'DistrictNewsScreen' },
  { id: 'sports',    title: 'விளையாட்டு', screen: 'SportsScreen'       },
];

// These tabs fetch news inline
const TOP_TABS = [
  { id: 'tharpothaiya', title: 'தற்போதைய',  endpoint: '/newsdata?cat=5010' },
  { id: 'tamilagam',   title: 'தமிழகம்',    endpoint: '/newsdata?cat=89'   },
  { id: 'india',       title: 'இந்தியா',     endpoint: '/newsdata?cat=100'  },
  { id: 'world',       title: 'உலகம்',       endpoint: '/newsdata?cat=34'   },
  { id: 'premium',     title: 'பிரீமியம்',   endpoint: '/newsdata?cat=651'  },
];

// All tabs shown in the horizontal scroll bar (fetch tabs + nav-only tabs)
const ALL_DISPLAY_TABS = [
  ...TOP_TABS,
  ...NAV_ONLY_TABS,
];

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <View style={sk.card}>
      <View style={sk.image} />
      <View style={sk.body}>
        <View style={sk.line} />
        <View style={[sk.line, { width: '70%' }]} />
        <View style={[sk.line, { width: '40%', marginTop: vs(6) }]} />
      </View>
    </View>
  );
}

const sk = StyleSheet.create({
  card:  { backgroundColor: '#fff', marginBottom: vs(8) },
  image: { width: '100%', height: vs(190), backgroundColor: '#e8e8e8' },
  body:  { padding: s(10) },
  line:  {
    height: vs(12),
    backgroundColor: '#e8e8e8',
    borderRadius: s(4),
    marginBottom: vs(6),
    width: '90%',
  },
});

// ─── News Card (same as HomeScreen) ────────────────────────────────────────────────────────
// Fixed naming conflict - using TharpothaiyaNewsCard
function TharpothaiyaNewsCard({ item, onPress }) {
  const { sf } = useFontSize();
  const imageUri =
    item.images ||
    item.largeimages ||
    item.image ||
    item.thumbnail ||
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';
  const title = item.newstitle || item.title || item.maincat || item.heading || '';
  const category = item.categorytitle || item.categrorytitle || item.maincat || item.ctitle || item.cattitle || '';
  const ago = item.ago || item.time_ago || '';
  const newscomment = item.newscomment || item.commentcount || '';
  const hasAudio = item.audio === 1 || item.audio === '1' || item.audio === true ||
    (typeof item.audio === 'string' && item.audio.length > 1 && item.audio !== '0');
  
  return (
    <View style={NewsCard.wrap}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.88}>

        {/* Image with horizontal padding */}
        <View style={NewsCard.imageWrap}>
          <Image source={{ uri: imageUri }} style={NewsCard.image} resizeMode="cover" />
        </View>

        {/* Content */}
        <View style={NewsCard.contentContainer}>
          {!!title && (
            <Text style={[NewsCard.title, { fontSize: sf(16), lineHeight: sf(22) }]} numberOfLines={3}>{title}</Text>
          )}

          {/* Category pill — gray, matches screenshot */}
          {!!category && (
            <View style={NewsCard.catPill}>
              <Text style={[NewsCard.catText, { fontSize: sf(11) }]}>{category}</Text>
            </View>
          )}

          {/* Meta row */}
          <View style={NewsCard.metaRow}>
            <Text style={[NewsCard.timeText, { fontSize: sf(12) }]}>{ago}</Text>
            <View style={NewsCard.metaRight}>
              
              {!!newscomment && newscomment !== '0' && (
                <View style={NewsCard.commentRow}>
                  <Ionicons name="chatbox" size={sf(14)} color={PALETTE.grey700} />
                  <Text style={[NewsCard.commentText, { fontSize: sf(12) }]}> {newscomment}</Text>
                </View>
              )}
              {hasAudio && (
                <View style={NewsCard.audioIcon}>
                  <Ionicons name="volume-high" size={sf(14)} color={PALETTE.grey700} />
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Divider */}
      <View style={NewsCard.divider} />
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function TharpothaiyaSeithigalScreen({ route }) {
  const { sf } = useFontSize();
  const navigation = useNavigation();

  const initialTabId = route?.params?.tabId || 'tharpothaiya';
  const initialTabTitle = route?.params?.initialTabTitle;
  
  // Map tab titles to tab IDs
  const getTabIdFromTitle = (title) => {
    const titleToIdMap = {
      'தற்போதைய': 'tharpothaiya',
      'தமிழகம்': 'tamilagam',
      'இந்தியா': 'india',
      'உலகம்': 'world',
      'பிரீமியம்': 'premium',
    };
    return titleToIdMap[title] || 'tharpothaiya';
  };
  
  // Use initialTabTitle if provided, otherwise use tabId
  const resolvedTabId = initialTabTitle ? getTabIdFromTitle(initialTabTitle) : initialTabId;
  
  // Only fetchable tabs can be the initial active tab
  const initialTab   = TOP_TABS.find(t => t.id === resolvedTabId) || TOP_TABS[0];

  const [activeTopTab,            setActiveTopTab]            = useState(initialTab);
  const [subTabs,                 setSubTabs]                 = useState([]);
  const [activeSubTab,            setActiveSubTab]            = useState(null);
  const [news,                    setNews]                    = useState([]);
  const [page,                    setPage]                    = useState(1);
  const [lastPage,                setLastPage]                = useState(1);
  const [loading,                 setLoading]                 = useState(true);
  const [loadingMore,             setLoadingMore]             = useState(false);
  const [refreshing,              setRefreshing]              = useState(false);
  const [showScrollTop,           setShowScrollTop]           = useState(false);
  const [isDrawerVisible,         setIsDrawerVisible]         = useState(false);
  const [isLocationDrawerVisible, setIsLocationDrawerVisible] = useState(false);
  const [selectedDistrict,        setSelectedDistrict]        = useState('உள்ளூர்');

  const topTabScrollRef = useRef(null);
  const subTabScrollRef = useRef(null);
  const flatListRef     = useRef(null);

  // ✅ On every focus: if tabId is a nav-only tab, redirect immediately
  useEffect(() => {
    const newTabId = route?.params?.tabId;
    const newTabTitle = route?.params?.initialTabTitle;
    
    // Handle tabId parameter
    if (newTabId) {
      const navOnly = NAV_ONLY_TABS.find(t => t.id === newTabId);
      if (navOnly) {
        navigation.navigate(navOnly.screen);
        return;
      }

      const newTab = TOP_TABS.find(t => t.id === newTabId);
      if (newTab && newTab.id !== activeTopTab.id) {
        setActiveTopTab(newTab);
      }
    }
    
    // Handle initialTabTitle parameter
    if (newTabTitle) {
      const resolvedTabId = getTabIdFromTitle(newTabTitle);
      const newTab = TOP_TABS.find(t => t.id === resolvedTabId);
      if (newTab && newTab.id !== activeTopTab.id) {
        setActiveTopTab(newTab);
      }
    }
  }, [route?.params?.tabId, route?.params?.initialTabTitle]);

  const handleScroll = useCallback((event) => {
    setShowScrollTop(event.nativeEvent.contentOffset.y > 300);
  }, []);

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const buildUrl = useCallback((topTab, subTab, pg) => {
    const ep  = subTab?.link || topTab.endpoint;
    const sep = ep.includes('?') ? '&' : '?';
    return `${ep}${sep}page=${pg}`;
  }, []);

  const fetchNews = useCallback(async (topTab, subTab, pg, append = false) => {
    try {
      const url = buildUrl(topTab, subTab, pg);
      console.log('Fetching:', url);
      const res = await u38Api.get(url);
      const d   = res?.data;

      if (!append && !subTab) {
        setSubTabs(d?.subcatlist || []);
      }

      const list = (
        d?.newlist?.data  ||
        d?.newslist?.data ||
        d?.data           ||
        d?.list           ||
        []
      ).filter(Boolean);

      const lp =
        d?.newlist?.last_page  ||
        d?.newslist?.last_page ||
        d?.last_page           ||
        1;

      setLastPage(lp);
      setNews(prev => append ? [...prev, ...list] : list);
      setPage(pg);
    } catch (e) {
      console.error('TharpothaiyaSeithigal fetch error:', e?.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [buildUrl]);

  // Fetch on tab change
  useEffect(() => {
    setLoading(true);
    setNews([]);
    setSubTabs([]);
    setActiveSubTab(null);
    setPage(1);
    fetchNews(activeTopTab, null, 1, false);
  }, [activeTopTab]);

  // Tab press — nav-only tabs navigate away, fetchable tabs load news
  const handleTopTabPress = (tab) => {
    const navOnly = NAV_ONLY_TABS.find(t => t.id === tab.id);
    if (navOnly) {
      navigation.navigate(navOnly.screen);
      return;
    }
    if (activeTopTab.id === tab.id) return;
    setActiveTopTab(tab);
  };

  const handleSubTabPress = (tab) => {
    if (activeSubTab?.id === tab.id) {
      setActiveSubTab(null);
      setLoading(true);
      setNews([]);
      setPage(1);
      fetchNews(activeTopTab, null, 1, false);
      return;
    }
    setActiveSubTab(tab);
    setLoading(true);
    setNews([]);
    setPage(1);
    fetchNews(activeTopTab, tab, 1, false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchNews(activeTopTab, activeSubTab, 1, false);
  };

  const handleLoadMore = () => {
    if (loadingMore || page >= lastPage) return;
    setLoadingMore(true);
    fetchNews(activeTopTab, activeSubTab, page + 1, true);
  };

  const goToArticle = (item) => {
    navigation.navigate('NewsDetailsScreen', {
      newsId:   item.newsid || item.id,
      newsItem: item,
      slug:     item.slug || '',
    });
  };

  const handleMenuPress = (menuItem) => {
    const link = menuItem?.Link || menuItem?.link || '';
    if (link === 'home' || link === '/') { navigation.navigate('HomeScreen'); return; }
    if (link.startsWith('http')) return;
    if (link.includes('tharpothaiyaseithigal') || link.includes('5010')) return;
    if (link.includes('timeline') || link.includes('latestmain')) navigation.navigate('TimelineScreen');
    else if (link.includes('cinema')) navigation.navigate('CategoryNewsScreen', { catId: 'cinema', catName: 'சினிமா' });
    else if (link.includes('temple') || link.includes('kovilgal')) navigation.navigate('CategoryNewsScreen', { catId: 'temple', catName: 'கோவில்கள்' });
    else navigation.navigate('HomeScreen');
  };

  const goToSearch = () => navigation.navigate('SearchScreen');
  const goToNotifs = () => console.log('Tharpothaiya: Notifications clicked');

  const handleSelectDistrict = (district) => {
    setSelectedDistrict(district.title);
    if (district.id) navigation?.navigate('DistrictNewsScreen', { 
      districtId: district.id, 
      districtTitle: district.title 
    });
  };

  return (
    <View style={styles.container}>

      <UniversalHeaderComponent
        showMenu={true}
        showSearch={true}
        showNotifications={true}
        showLocation={true}
        onMenuPress={handleMenuPress}
        onSearch={goToSearch}
        onNotification={goToNotifs}
        onLocation={() => setIsLocationDrawerVisible(true)}
        selectedDistrict={selectedDistrict}
        onSelectDistrict={handleSelectDistrict}
        navigation={navigation}
        isDrawerVisible={isDrawerVisible}
        setIsDrawerVisible={setIsDrawerVisible}
        isLocationDrawerVisible={isLocationDrawerVisible}
        setIsLocationDrawerVisible={setIsLocationDrawerVisible}
      >
        <AppHeaderComponent
          onSearch={goToSearch}
          onMenu={() => setIsDrawerVisible(true)}
          onLocation={() => setIsLocationDrawerVisible(true)}
          selectedDistrict="உள்ளூர்"
        />
      </UniversalHeaderComponent>

      {/* ── Top Tabs ── */}
      <View style={styles.topTabsWrapper}>
        <ScrollView
          ref={topTabScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {ALL_DISPLAY_TABS.map((tab) => {
              // Nav-only tabs are never shown as active
              const isNavOnly = NAV_ONLY_TABS.some(t => t.id === tab.id);
              const isActive  = !isNavOnly && activeTopTab.id === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => handleTopTabPress(tab)}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive, { fontSize: sf(14) }]}>
                  {tab.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={styles.tabsBottomLine} />
      </View>

      {/* ── News List ── */}
      {loading ? (
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={i => `sk-${i}`}
          renderItem={() => <SkeletonCard />}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <FlatList
          ref={flatListRef}
          data={news}
          keyExtractor={(item, i) =>
            `news-${activeTopTab.id}-${i}-${item?.newsid || item?.id || i}`
          }
          renderItem={({ item }) => (
            <TharpothaiyaNewsCard item={item} onPress={() => goToArticle(item)} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="newspaper-outline" size={s(48)} color="#ccc" />
              <Text style={styles.emptyText}>செய்திகள் இல்லை</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : (
              <View style={{ height: vs(40) }} />
            )
          }
        />
      )}

      {/* ── Scroll To Top ── */}
      {showScrollTop && (
        <TouchableOpacity
          style={styles.scrollTopBtn}
          onPress={scrollToTop}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-up" size={s(20)} color="#fff" />
        </TouchableOpacity>
      )}

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    paddingTop: Platform.OS === 'android' ? vs(28) : 0,
  },

  topTabsWrapper: {
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: vs(1) },
    shadowOpacity: 0.08,
    shadowRadius: s(2),
  },

  tabsContent: {
    paddingHorizontal: s(4),
    alignItems: 'center',
  },

  tab: {
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
    marginHorizontal: s(2),
    borderBottomWidth: vs(3),
    borderBottomColor: 'transparent',
  },

  tabActive: {
    borderBottomColor: COLORS.primary,
  },

  tabText: TEXT_STYLES.tabs.small,

  tabTextActive: TEXT_STYLES.tabs.smallActive,

  tabsBottomLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e0e0e0',
  },

  subTabsWrapper: {
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#ececec',
  },

  subTabsContent: {
    paddingHorizontal: s(8),
    paddingVertical: vs(6),
    gap: s(6),
  },

  subTab: {
    paddingHorizontal: s(12),
    paddingVertical: vs(5),
    borderRadius: s(16),
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: 'transparent',
  },

  subTabActive: {
    backgroundColor: '#fdecea',
    borderColor: COLORS.primary,
  },

  subTabText: {
    fontSize: ms(12),
    color: '#555',
    fontFamily: FONTS.muktaMalar.medium,
  },

  subTabTextActive: {
    color: COLORS.primary,
    fontFamily: FONTS.muktaMalar.bold,
  },

  listContent: {
    paddingTop: vs(6),
    paddingBottom: vs(30),
  },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(120),
    gap: vs(12),
  },

  emptyText: {
    fontSize: ms(15),
    color: '#aaa',
    fontFamily: FONTS.muktaMalar.medium,
  },

  footerLoader: {
    paddingVertical: vs(20),
    alignItems: 'center',
  },

  scrollTopBtn: {
    position: 'absolute',
    bottom: vs(20),
    right: s(16),
    backgroundColor: COLORS.primary,
    padding: s(8),
    borderRadius: s(30),
    elevation: 2,
  },
});