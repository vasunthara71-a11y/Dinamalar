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
  PanResponder,        // ← NEW: for swipe gesture detection
} from 'react-native';
import { SpeakerIcon } from '../assets/svg/Icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CDNApi, CATEGORY_MAP, SPECIAL_ENDPOINTS } from '../config/api';
import { COLORS, FONTS, NewsCard } from '../utils/constants';
import { s, vs, ms, scaledSizes } from '../utils/scaling';
import UniversalHeaderComponent from '../components/UniversalHeaderComponent';
import LocationDrawer from '../components/LocationDrawer';
import DrawerMenu from '../components/DrawerMenu';
import AppHeaderComponent from '../components/AppHeaderComponent';
import { mvs } from 'react-native-size-matters';
import TEXT_STYLES from '../utils/textStyles';
import { useFontSize } from '../context/FontSizeContext';
import { Ionicons } from '@expo/vector-icons';
import AdvertisementBanner from '../components/AdvertisementBanner';
 
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
  { id: 'varthagam', title: 'வர்த்தகம்', screen: 'VarthagamScreen' },
  { id: 'district', title: 'உள்ளூர்', screen: 'DistrictNewsScreen' },
  {
    id: 'kalvimalar', title: 'கல்விமலர்', screen: 'CommonSectionScreen', params: {
      screenTitle: 'கல்விமலர்',
      apiEndpoint: '/kalvimalarhome',
      allTabLink: '/kalvimalarhome'
    }
  },
  { id: 'sports', title: 'விளையாட்டு', screen: 'SportsScreen' },
];

// These tabs fetch news inline
const TOP_TABS = [
  { id: 'all', title: 'All', endpoint: '/seithigal' },
  { id: 'tharpothaiya', title: 'தற்போதைய செய்தி', endpoint: '/newsdata?cat=5010' },
  { id: 'tamilagam', title: 'தமிழகம்', endpoint: '/newsdata?cat=89' },
  { id: 'india', title: 'இந்தியா', endpoint: '/newsdata?cat=100' },
  { id: 'world', title: 'உலகம்', endpoint: '/newsdata?cat=34' },
  { id: 'premium', title: 'பிரீமியம்', endpoint: '/newsdata?cat=651' },
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
  card: { backgroundColor: '#fff', marginBottom: vs(8) },
  image: { width: '100%', height: vs(190), backgroundColor: '#e8e8e8' },
  body: { padding: s(10) },
  line: {
    height: vs(12),
    backgroundColor: '#e8e8e8',
    borderRadius: s(4),
    marginBottom: vs(6),
    width: '90%',
  },
});

// ─── News Card (same as HomeScreen) ────────────────────────────────────────────────────────
// Fixed naming conflict - using TharpothaiyaNewsCard
function TharpothaiyaNewsCard({ item, onPress, isPremium = false }) {
  const { sf } = useFontSize();
  const [imageError, setImageError] = useState(false);

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
          {imageError ? (
            <View style={[NewsCard.image, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }]}>
              <Image
                source={{ uri: 'https://stat.dinamalar.com/new/2025/images/dinamalar-pavala-vizha-logo-day.png' }}
                style={{ width: s(80), height: s(40), resizeMode: 'contain' }}
              />
            </View>
          ) : (
            <Image source={{ uri: imageUri }} style={NewsCard.image} resizeMode="cover" onError={() => setImageError(true)} />
          )}
          {/* Premium Tag */}
          {isPremium && (
            <View style={NewsCard.premiumTag}>
              <Text style={NewsCard.premiumTagText}>பிரீமியம்</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={NewsCard.contentContainer}>
          {!!title && (
            <Text style={[NewsCard.title, { fontSize: sf(13), lineHeight: sf(22) }]} numberOfLines={3}>{title}</Text>
          )}

          {/* {!!category && (
            <View style={NewsCard.catPill}>
              <Text style={[NewsCard.catText, { fontSize: sf(12) }]}>{category}</Text>
            </View>
          )} */}

          <View style={NewsCard.metaRow}>
            <Text style={[NewsCard.timeText, { fontSize: sf(13) }]}>{ago}</Text>
            <View style={NewsCard.metaRight}>
              {hasAudio && (
                <View style={NewsCard.audioIcon}>
                  <SpeakerIcon size={s(14)} color={PALETTE.grey700} />
                </View>
              )}

              {!!newscomment && newscomment !== '0' && (
                <View style={NewsCard.commentRow}>
                  <Ionicons name="chatbox" size={s(15)} color={PALETTE.grey700} />
                  <Text style={[NewsCard.commentText, { fontSize: sf(12) }]}> {newscomment}</Text>
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

// ─── Place this OUTSIDE TharpothaiyaSeithigalScreen ───────────────────────

function SectionGroup({ group, onPressItem, onPressViewAll }) {
  const { sf } = useFontSize();

  const getTabIdFromLink = (link) => {
    if (link?.includes('cat=5010')) return 'tharpothaiya';
    if (link?.includes('cat=89')) return 'tamilagam';
    if (link?.includes('cat=100')) return 'india';
    if (link?.includes('cat=34')) return 'world';
    if (link?.includes('cat=651')) return 'premium';
    return null;
  };

  return (
    <View style={sg.wrapper}>
      {/* Section Header — left blue accent bar style */}
      <TouchableOpacity
        style={sg.header}
        onPress={() => {
          const tabId = getTabIdFromLink(group.link);
          if (tabId) onPressViewAll(tabId);
        }}
        activeOpacity={0.7}
      >
        {/* <View style={sg.accentBar} /> */}
        <Text style={[sg.title, { fontSize: sf(16) }]}>{group.title}</Text>
        <View style={sg.sectionUnderline} />
        <View style={sg.greyLine} />

      </TouchableOpacity>

      {/* 3 News Items */}
      {group.data.map((item, index) => (
        <TharpothaiyaNewsCard
          key={`${group.id}-${item?.newsid || index}`}
          item={item}
          onPress={() => onPressItem(item)}
          isPremium={group.id === '651' || group.id === 651}
        />
      ))}
    </View>
  );
}

const sg = StyleSheet.create({
  wrapper: {
    marginBottom: vs(8),
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: PALETTE.white,
    paddingHorizontal: s(12),
    paddingTop: vs(14),
    paddingBottom: vs(10),
  },
  titleRow: {
  },
  accentBar: {
    width: s(4),
    height: vs(18),
    backgroundColor: COLORS.primary,
    borderRadius: s(2),
    marginRight: s(8),
  },
  title: {
    fontFamily: FONTS.muktaMalar.bold,
    color: COLORS.grey800,
    fontSize: ms(16),
  },
  sectionUnderline: {
    height: vs(3),
    width: s(40),
    backgroundColor: PALETTE.primary,

  },
  greyLine: {
    borderBottomWidth: 0.75,
    borderBottomColor: COLORS.grey300
  },
});

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
  const initialTab = TOP_TABS.find(t => t.id === resolvedTabId) || TOP_TABS[0];

  const [activeTopTab, setActiveTopTab] = useState(initialTab);
  const [subTabs, setSubTabs] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState(null);
  const [news, setNews] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isLocationDrawerVisible, setIsLocationDrawerVisible] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('உள்ளூர்');
  const [groupedNews, setGroupedNews] = useState([]); // for All tab
  const topTabScrollRef = useRef(null);
  const subTabScrollRef = useRef(null);
  const flatListRef = useRef(null);
  const tabLayoutsRef = useRef({});   // stores {[tabKey]: {x, width}} after layout

  // ── Refs to keep latest values accessible inside PanResponder ────────────
  const topTabsRef = useRef([]);
  const activeTopTabRef = useRef(null);

  // Keep refs in sync with state
  useEffect(() => { topTabsRef.current = ALL_DISPLAY_TABS; }, []);
  useEffect(() => { activeTopTabRef.current = activeTopTab; }, [activeTopTab]);

  // Auto-scroll tab bar so active tab is always fully visible
  useEffect(() => {
    if (!activeTopTab || !topTabScrollRef.current) return;
    const key = activeTopTab.id;
    const layout = tabLayoutsRef.current[key];
    if (!layout) return;

    // Use requestAnimationFrame to prevent conflicts
    requestAnimationFrame(() => {
      if (topTabScrollRef.current) {
        // Centre the active tab: scroll so tab sits in middle of scroll view
        const scrollX = Math.max(0, layout.x - layout.width);
        topTabScrollRef.current.scrollTo({ x: scrollX, animated: true });
      }
    });
  }, [activeTopTab]);

  // ✅ On every focus: if tabId is a nav-only tab, redirect immediately
  useEffect(() => {
    const newTabId = route?.params?.tabId;
    const newTabTitle = route?.params?.initialTabTitle;

    // Handle tabId parameter
    if (newTabId) {
      const navOnly = NAV_ONLY_TABS.find(t => t.id === newTabId);
      if (navOnly) {
        navigation.navigate(navOnly.screen, navOnly.params || {}); // ← was missing params
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
    const scrollY = event.nativeEvent.contentOffset.y;
    const shouldShow = scrollY > 300;
    console.log('Scroll Y:', scrollY, 'Should show button:', shouldShow);
    setShowScrollTop(shouldShow);
  }, []);

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const buildUrl = useCallback((topTab, subTab, pg) => {
    const ep = subTab?.link || topTab.endpoint;
    const sep = ep.includes('?') ? '&' : '?';
    return `${ep}${sep}page=${pg}`;
  }, []);


  const fetchNews = useCallback(async (topTab, subTab, pg, append = false) => {
    try {
      const url = buildUrl(topTab, subTab, pg);
      const res = await CDNApi.get(url);
      const d = res?.data;

      if (!append && !subTab) {
        setSubTabs(d?.subcatlist || []);
      }

      // All tab — keep grouped structure
      if (topTab.id === 'all' && Array.isArray(d?.newlist)) {
        const groups = d.newlist
          .filter(cat => cat?.data?.length > 0)
          .map(cat => ({
            id: cat.id,
            title: cat.title,
            link: cat.link,
            data: cat.data.slice(0, 3), // only 3 per section
          }));
        setGroupedNews(groups);
        setNews([]); // clear flat list
        setLastPage(1);
        setPage(1);
        return;
      }

      // Other tabs — flat list
      setGroupedNews([]);
      const list = (() => {
        if (d?.newlist?.data) return d.newlist.data;
        if (d?.newslist?.data) return d.newslist.data;
        if (d?.data) return d.data;
        if (d?.list) return d.list;
        return [];
      })().filter(Boolean);

      const lp = d?.newlist?.last_page || d?.newslist?.last_page || d?.last_page || 1;
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
      navigation.navigate(navOnly.screen, navOnly.params || {}); // ← fix
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

  // ── Swipe to next / previous tab ─────────────────────────────────────────
  //
  //  Swipe LEFT  → go to NEXT tab  (e.g. tharpothaiya → tamilagam → india →…)
  //  Swipe RIGHT → go to PREV tab  (e.g. india → tamilagam → tharpothaiya)
  //
  //  Thresholds:
  //    dx >  50 px  AND velocity > 0.3  → right-swipe  (go prev)
  //    dx < -50 px  AND velocity > 0.3  → left-swipe   (go next)
  //
  const SWIPE_THRESHOLD = 50;   // minimum horizontal distance (px)
  const SWIPE_VELOCITY = 0.3;  // minimum velocity

  const panResponder = useRef(
    PanResponder.create({
      // Only claim the gesture when horizontal movement clearly dominates
      onMoveShouldSetPanResponder: (_, gs) => {
        return (
          Math.abs(gs.dx) > Math.abs(gs.dy) &&   // horizontal dominates
          Math.abs(gs.dx) > 10                     // at least 10 px moved
        );
      },
      onPanResponderRelease: (_, gs) => {
        const tabs = topTabsRef.current;
        const curTab = activeTopTabRef.current;
        if (!tabs.length) return;

        // Find the index of the current tab
        const curIndex = curTab
          ? tabs.findIndex(t => t.id === curTab.id)
          : 0;

        const isRightSwipe = gs.dx > SWIPE_THRESHOLD && Math.abs(gs.vx) > SWIPE_VELOCITY;
        const isLeftSwipe = gs.dx < -SWIPE_THRESHOLD && Math.abs(gs.vx) > SWIPE_VELOCITY;

        if (isRightSwipe && curIndex > 0) {
          // Go to previous tab
          const prevTab = tabs[curIndex - 1];
          const navOnly = NAV_ONLY_TABS.find(t => t.id === prevTab.id);
          if (navOnly) {
            navigation.navigate(navOnly.screen, navOnly.params || {}); // ← fix
          } else {
            setActiveTopTab(prevTab);
          }
        } else if (isLeftSwipe && curIndex < tabs.length - 1) {
          // Go to next tab
          const nextTab = tabs[curIndex + 1];
          const navOnly = NAV_ONLY_TABS.find(t => t.id === nextTab.id);
          if (navOnly) {
            navigation.navigate(navOnly.screen, navOnly.params || {}); // ← fix
          } else {
            setActiveTopTab(nextTab);
          }
        }
      },
    })
  ).current;

  const goToArticle = (item) => {
    navigation.navigate('NewsDetailsScreen', {
      newsId: item.newsid || item.id,
      newsItem: item,
      slug: item.slug || '',
      newsList: news,
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
    else if (link.includes('kalvimalar')) navigation.navigate('CommonSectionScreen', { screenTitle: 'கல்விமலர்', apiEndpoint: '/kalvimalarhome', allTabLink: '/kalvimalarhome' });
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

      <ScrollView style={styles.scrollContainer}>
        <AdvertisementBanner width={320} height={300} showLabel={false} />

        {/* ── Page Title ── */}
        <View style={styles.pageTitleWrap}>
          <Text style={[styles.pageTitle, { fontSize: sf(18) }]}>
            {activeTopTab.id === 'all' ? 'செய்திகள்' :
              activeTopTab.title === 'tharpothaiya' ? 'தற்போதைய செய்திகள்' :
                activeTopTab.title === 'tamilagam' ? 'தமிழகம்' :
                  activeTopTab.title === 'india' ? 'இந்தியா' :
                    activeTopTab.title === 'world' ? 'உலகம்' :
                      activeTopTab.title === 'premium' ? 'ப்ரீமியம்' :
                        `${activeTopTab.title} `}
          </Text>
        </View>

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
              const isActive = !isNavOnly && activeTopTab.id === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => handleTopTabPress(tab)}
                  onLayout={(e) => {
                    tabLayoutsRef.current[tab.id] = {
                      x: e.nativeEvent.layout.x,
                      width: e.nativeEvent.layout.width,
                    };
                  }}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive,]}>
                    {tab.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.tabsBottomLine} />
        </View>
        
        {/* ── News List — wrapped with panResponder for swipe detection ── */}
        <View style={styles.swipeArea} {...panResponder.panHandlers}>
          {loading ? (
            <FlatList
              data={[1, 2, 3, 4]}
              keyExtractor={i => `sk-${i}`}
              renderItem={() => <SkeletonCard />}
              contentContainerStyle={styles.listContent}
            />
          ) : activeTopTab.id === 'all' ? (
            // ── All Tab: Grouped Sections ──
            <FlatList
              ref={flatListRef}
              data={groupedNews}
              keyExtractor={(group) => `group-${group.id}`}
              renderItem={({ item: group }) => (
                <SectionGroup
                  group={group}
                  onPressItem={goToArticle}
                  onPressViewAll={(tabId) => {
                    const tab = TOP_TABS.find(t => t.id === tabId);
                    if (tab) setActiveTopTab(tab);
                  }}
                  navigation={navigation}
                />
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[COLORS.primary]}
                  tintColor={COLORS.primary}
                />
              }
              // ListEmptyComponent={
              //   <View style={styles.emptyWrap}>
              //     <Ionicons name="newspaper-outline" size={s(48)} color="#ccc" />
              //     <Text style={styles.emptyText}>செய்திகள் இல்லை</Text>
              //   </View>
              // }
              ListFooterComponent={<View style={{ height: vs(40) }} />}
            />
          ) : (
            // ── Other Tabs: Flat list ──
            <FlatList
              ref={flatListRef}
              data={news}
              keyExtractor={(item, i) =>
                `news-${activeTopTab.id}-${i}-${item?.newsid || item?.id || i}`
              }
              renderItem={({ item }) => (
                <TharpothaiyaNewsCard
                  item={item}
                  onPress={() => goToArticle(item)}
                  isPremium={activeTopTab.id === 'premium'}
                />
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
              // ListEmptyComponent={
              //   <View style={styles.emptyWrap}>
              //     <Ionicons name="newspaper-outline" size={s(48)} color="#ccc" />
              //     <Text style={styles.emptyText}>செய்திகள் இல்லை</Text>
              //   </View>
              // }
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
        </View>
      </ScrollView>
   
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    paddingTop: Platform.OS === 'android' ? vs(0) : 20,
  },

  pageTitleWrap: {
    paddingHorizontal: s(14),
    paddingTop: vs(14),
    paddingBottom: vs(6),
    backgroundColor: COLORS.white,
  },
  pageTitle: {
    fontSize: ms(18),
    color: COLORS.text,
    fontFamily: FONTS.anek.bold,
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

  tabText: {
    fontSize: ms(16),
    fontFamily: FONTS.muktaMalar.medium,
    color: COLORS.black,
  },

  tabTextActive:
  {
    fontSize: ms(16),
    fontFamily: FONTS.muktaMalar.medium,
    color: COLORS.black,
  },

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

  // ── Swipe area wraps the entire content below tabs ──
  swipeArea: { flex: 1 },

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
});