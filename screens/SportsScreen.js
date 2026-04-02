// SportsScreen.js
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
  Linking,
  PanResponder,        // ← NEW: for swipe gesture detection
} from 'react-native';
import { SpeakerIcon } from '../assets/svg/Icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CDNApi } from '../config/api';
import { s, vs, ms, scaledSizes } from '../utils/scaling';
import { COLORS, FONTS, NewsCard } from '../utils/constants';
import UniversalHeaderComponent from '../components/UniversalHeaderComponent';
import AppHeaderComponent from '../components/AppHeaderComponent';
import { mvs } from 'react-native-size-matters';
import TEXT_STYLES from '../utils/textStyles';
import { useFontSize } from '../context/FontSizeContext';
import { Ionicons } from '@expo/vector-icons';

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

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <View style={sk.card}>
      <View style={sk.image} />
      <View style={sk.body}>
        <View style={sk.line} />
        <View style={[sk.line, { width: '70%' }]} />
        <View style={[sk.line, { width: '40%', marginTop: vs(4) }]} />
      </View>
    </View>
  );
}
const sk = StyleSheet.create({
  card: { backgroundColor: '#fff', marginBottom: vs(8) },
  image: { width: '100%', height: vs(190), backgroundColor: '#e8e8e8' },
  body: { padding: s(10) },
  line: { height: vs(12), backgroundColor: '#e8e8e8', borderRadius: s(4), marginBottom: vs(6), width: '90%' },
});

// ─── Section Title ────────────────────────────────────────────────────────────
function SectionTitle({ title }) {
  const { sf } = useFontSize();
  return (
    <View style={st.wrap}>
      <Text style={[st.text, { fontSize: sf(16) }]}>{title}</Text>
      <View style={st.underline} />
    </View>
  );
}
const st = StyleSheet.create({
  wrap: { 
    paddingTop: vs(14), 
    paddingBottom: vs(10),
  },

  text: {
    fontFamily: FONTS.muktaMalar.bold,
    color: COLORS.text,
  },

  underline: {
    height: vs(3),
    width: s(60),
    backgroundColor: COLORS.primary,
   },
});

// ─── News Card (same as HomeScreen) ────────────────────────────────────────────────────────
function SportsNewsCard({ item, onPress }) {
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
        </View>

        {/* Content */}
        <View style={NewsCard.contentContainer}>
          {!!title && (
            <Text style={[NewsCard.title, { fontSize: sf(14), lineHeight: sf(22) }]} numberOfLines={3}>{title}</Text>
          )}

          {/* Meta row */}
          <View style={NewsCard.metaRow}>
            <Text style={[NewsCard.timeText, { fontSize: sf(12) }]}>{ago}</Text>
            <View style={NewsCard.metaRight}>
              
              {!!newscomment && newscomment !== '0' && (
                <View style={NewsCard.commentRow}>
                  <Ionicons name="chatbox" size={s(14)} color={PALETTE.grey700} />
                  <Text style={[NewsCard.commentText, { fontSize: sf(12) }]}> {newscomment}</Text>
                </View>
              )}
              {hasAudio && (
                <View style={NewsCard.audioIcon}>
                  <SpeakerIcon size={s(14)} color={PALETTE.grey700} />
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
export default function SportsScreen() {
  const { sf } = useFontSize();
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get initial tab parameters from navigation
  const { initialTabId, initialTabTitle } = route?.params || {};

  const [subTabs, setSubTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);

  // All tab → newlist sections: [{title, id, link, data:[...newsItems]}]
  const [allSections, setAllSections] = useState([]);

  // Sub tab → flat paginated news
  const [tabNews, setTabNews] = useState([]);
  const [tabPage, setTabPage] = useState(1);
  const [tabLastPage, setTabLastPage] = useState(1);
  const [tabLoading, setTabLoading] = useState(false);
  const [tabLoadMore, setTabLoadMore] = useState(false);

  const [initLoading, setInitLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isLocationDrawerVisible, setIsLocationDrawerVisible] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('உள்ளூர்');

  const flatListRef = useRef(null);
  const tabScrollRef = useRef(null);   // ref for horizontal tab ScrollView
  const tabLayoutsRef = useRef({});   // stores {[tabKey]: {x, width}} after layout

  // ── Refs to keep latest values accessible inside PanResponder ────────────
  const subTabsRef = useRef([]);
  const activeTabRef = useRef(null);

  // Keep refs in sync with state
  useEffect(() => { subTabsRef.current = subTabs; }, [subTabs]);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  // Auto-scroll tab bar so active tab is always fully visible
  useEffect(() => {
    if (!activeTab || !tabScrollRef.current) return;
    const key = activeTab.title === 'All' ? 'All' : String(activeTab.id);
    const layout = tabLayoutsRef.current[key];
    if (!layout) return;
    
    // Use requestAnimationFrame to prevent conflicts
    requestAnimationFrame(() => {
      if (tabScrollRef.current) {
        // Centre the active tab: scroll so tab sits in middle of scroll view
        const scrollX = Math.max(0, layout.x - layout.width);
        tabScrollRef.current.scrollTo({ x: scrollX, animated: true });
      }
    });
  }, [activeTab]);

  const handleScroll = useCallback((e) => {
    setShowScrollTop(e.nativeEvent.contentOffset.y > 300);
  }, []);
  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  // ── Fetch /sports → All tab data ─────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      console.log('SportsScreen: fetching /sports');
      const res = await CDNApi.get('/sports');
      const d = res?.data;

      // subcatlist → tabs
      const tabs = d?.subcatlist || [];
      setSubTabs(tabs);
      
      // Handle initial tab selection
      let selectedTab = null;
      if (initialTabId) {
        selectedTab = tabs.find(t => String(t.id) === String(initialTabId));
        console.log('SportsScreen: Looking for tab by ID', initialTabId, 'found:', selectedTab);
      }
      if (!selectedTab && initialTabTitle) {
        selectedTab = tabs.find(t => t.title === initialTabTitle || t.title.toLowerCase().includes(initialTabTitle.toLowerCase()));
        console.log('SportsScreen: Looking for tab by title', initialTabTitle, 'found:', selectedTab);
      }
      if (!selectedTab) {
        selectedTab = tabs[0];
        console.log('SportsScreen: Defaulting to first tab');
      }
      
      if (selectedTab) {
        setActiveTab(selectedTab);
        if (selectedTab.title !== 'All') {
          setTabLoading(true);
          fetchTabNews(selectedTab, 1, false);
        }
      }

      const sections = (d?.newlist || []).filter(
        section => Array.isArray(section?.data) && section.data.length > 0
      );
      setAllSections(sections);
    } catch (e) {
      console.error('SportsScreen fetchAll error:', e?.message);
    } finally {
      setInitLoading(false);
      setRefreshing(false);
    }
  }, [initialTabId, initialTabTitle, fetchTabNews]);

  useEffect(() => { fetchAll(); }, []);

  // ── Fetch paginated news for a sub tab ────────────────────────────────────
  const fetchTabNews = useCallback(async (tab, pg, append = false) => {
    if (!tab?.link || tab.title === 'All') return;
    try {
      const sep = tab.link.includes('?') ? '&' : '?';
      const url = `${tab.link}${sep}page=${pg}`;
      console.log('SportsScreen tab fetch:', url);
      const res = await CDNApi.get(url);
      const d = res?.data;

      const list = (
        d?.newlist?.data ||
        d?.newslist?.data ||
        d?.data ||
        d?.list ||
        []
      ).filter(Boolean);

      const lp =
        d?.newlist?.last_page ||
        d?.newslist?.last_page ||
        d?.last_page ||
        1;

      setTabLastPage(lp);
      setTabNews(prev => append ? [...prev, ...list] : list);
      setTabPage(pg);
    } catch (e) {
      console.error('SportsScreen tab fetch error:', e?.message);
    } finally {
      setTabLoading(false);
      setTabLoadMore(false);
      setRefreshing(false);
    }
  }, []);

  // ── Tab press ─────────────────────────────────────────────────────────────
  const handleTabPress = useCallback((tab) => {
    const alreadyActive = activeTab
      ? (tab.title === 'All'
        ? activeTab.title === 'All'
        : String(activeTab.id) === String(tab.id))
      : false;
    if (alreadyActive) return;

    setActiveTab(tab);

    if (tab.title === 'All') {
      setTabNews([]);
      return;
    }

    setTabLoading(true);
    setTabNews([]);
    setTabPage(1);
    setTabLastPage(1);
    fetchTabNews(tab, 1, false);
  }, [activeTab, fetchTabNews]);

  // ── Swipe to next / previous tab ─────────────────────────────────────────
  //
  //  Swipe LEFT  → go to NEXT tab  (e.g. All → Cricket → Tennis →…)
  //  Swipe RIGHT → go to PREV tab  (e.g. Tennis → Cricket → All)
  //
  //  Thresholds:
  //    dx >  50 px  AND velocity > 0.3  → right-swipe  (go prev)
  //    dx < -50 px  AND velocity > 0.3  → left-swipe   (go next)
  //
  const SWIPE_THRESHOLD = 50;   // minimum horizontal distance (px)
  const SWIPE_VELOCITY  = 0.3;  // minimum velocity

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
        const tabs     = subTabsRef.current;
        const curTab   = activeTabRef.current;
        if (!tabs.length) return;

        // Find the index of the current tab
        const curIndex = curTab
          ? tabs.findIndex(t =>
              curTab.title === 'All'
                ? t.title === 'All'
                : String(t.id) === String(curTab.id)
            )
          : 0;

        const isRightSwipe = gs.dx > SWIPE_THRESHOLD && Math.abs(gs.vx) > SWIPE_VELOCITY;
        const isLeftSwipe  = gs.dx < -SWIPE_THRESHOLD && Math.abs(gs.vx) > SWIPE_VELOCITY;

        if (isRightSwipe && curIndex > 0) {
          // Go to previous tab
          const prevTab = tabs[curIndex - 1];
          // Use setActiveTab + fetchTabNews directly (avoid stale closure in handleTabPress)
          setActiveTab(prevTab);
          if (prevTab.title === 'All') {
            setTabNews([]);
          } else {
            setTabLoading(true);
            setTabNews([]);
            setTabPage(1);
            setTabLastPage(1);
          }
        } else if (isLeftSwipe && curIndex < tabs.length - 1) {
          // Go to next tab
          const nextTab = tabs[curIndex + 1];
          setActiveTab(nextTab);
          if (nextTab.title === 'All') {
            setTabNews([]);
          } else {
            setTabLoading(true);
            setTabNews([]);
            setTabPage(1);
            setTabLastPage(1);
          }
        }
      },
    })
  ).current;

  // Whenever activeTab changes via swipe, fetch news for the new tab
  // (We can't call fetchTabNews inside PanResponder due to stale closures,
  //  so we watch activeTab here instead.)
  const prevActiveTabRef = useRef(null);
  useEffect(() => {
    if (!activeTab) return;
    const prev = prevActiveTabRef.current;
    // Skip on first mount (fetchAll already handles it)
    if (!prev) { prevActiveTabRef.current = activeTab; return; }
    // Check if tab actually changed
    const changed = prev.title !== activeTab.title || String(prev.id) !== String(activeTab.id);
    if (changed && activeTab.title !== 'All') {
      fetchTabNews(activeTab, 1, false);
    }
    prevActiveTabRef.current = activeTab;
  }, [activeTab]);

  const handleRefresh = () => {
    setRefreshing(true);
    if (!activeTab || activeTab.title === 'All') fetchAll();
    else fetchTabNews(activeTab, 1, false);
  };

  const handleLoadMore = () => {
    if (!activeTab || activeTab.title === 'All') return;
    if (tabLoadMore || tabPage >= tabLastPage) return;
    setTabLoadMore(true);
    fetchTabNews(activeTab, tabPage + 1, true);
  };

  const goToArticle = (item) => {
    navigation.navigate('NewsDetailsScreen', {
      newsId: item.newsid || item.id,
      newsItem: item,
      slug: item.slug || '',
    });
  };

  const goToSearch = () => navigation.navigate('SearchScreen');

  const handleMenuPress = (menuItem) => {
    const link = menuItem?.Link || menuItem?.link || '';
    const title = menuItem?.Title || menuItem?.title || '';
    if (link && (link.startsWith('http://') || link.startsWith('https://'))) {
      console.log('External menu link:', link);
    } else {
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

  const isAllTab = !activeTab || activeTab.title === 'All';

  // ── Build flat list ───────────────────────────────────────────────────────
  const buildFlatData = () => {
    if (isAllTab) {
      const flat = [];
      allSections.forEach((section) => {
        flat.push({ type: 'section', title: section.title, id: section.id });
        (section.data || []).forEach((item) => {
          flat.push({ type: 'news', item });
        });
      });
      return flat;
    }
    return tabNews.map((item) => ({ type: 'news', item }));
  };

  const flatData = buildFlatData();
  const isLoading = initLoading || tabLoading;

  const renderItem = ({ item: row }) => {
    if (row.type === 'section') {
      return (
        <View style={styles.sectionWrap}>
          <SectionTitle title={row.title} />
        </View>
      );
    }
    return <SportsNewsCard item={row.item} onPress={() => goToArticle(row.item)} />;
  };

  return (
    <View style={styles.container}>
      <UniversalHeaderComponent
        showMenu
        showSearch
        showNotifications
        showLocation
        onMenuPress={handleMenuPress}
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

      {/* ── Page Title ── */}
      <View style={styles.pageTitleWrap}>
        <Text style={[styles.pageTitle, { fontSize: sf(16) }]}>
          {isAllTab ? 'விளையாட்டு' : (activeTab?.title || 'விளையாட்டு')}
        </Text>
      </View>
      
      {/* ── Tabs from subcatlist ── */}
      {subTabs.length > 0 && (
        <View style={styles.tabsWrap}>
          <ScrollView
            ref={tabScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {subTabs.map((tab, index) => {
              const isActive = activeTab
                ? (tab.title === 'All'
                  ? activeTab.title === 'All'
                  : String(activeTab.id) === String(tab.id))
                : index === 0;
              return (
                <TouchableOpacity
                  key={`tab-${tab.id || tab.title || index}-${index}`}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => handleTabPress(tab)}
                  activeOpacity={0.8}
                  onLayout={(e) => {
                    const tabKey = tab.title === 'All' ? 'All' : String(tab.id);
                    tabLayoutsRef.current[tabKey] = {
                      x: e.nativeEvent.layout.x,
                      width: e.nativeEvent.layout.width,
                    };
                  }}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive, { fontSize: ms(16) }]}>
                    {tab.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.tabsBottomLine} />
        </View>
      )}

      {/* ── Content — wrapped with panResponder for swipe detection ── */}
      <View style={styles.swipeArea} {...panResponder.panHandlers}>
        {isLoading ? (
          <FlatList
            data={[1, 2, 3, 4]}
            keyExtractor={i => `sk-${i}`}
            renderItem={() => <SkeletonCard />}
            contentContainerStyle={styles.listContent}
            style={styles.list}
          />
        ) : (
          <FlatList
            ref={flatListRef}
            data={flatData}
            keyExtractor={(row, i) =>
              row.type === 'section'
                ? `sec-${row.id || i}-${row.title}`
                : `news-${i}-${row.item?.newsid || row.item?.id || i}`
            }
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            style={styles.list}
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
                <Ionicons name="football-outline" size={s(48)} color="#ccc" />
                <Text style={[styles.emptyText, { fontSize: sf(14) }]}>செய்திகள் இல்லை</Text>
              </View>
            }
            ListFooterComponent={
              tabLoadMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
              ) : <View style={{ height: vs(40) }} />
            }
          />
        )}
      </View>

      {/* ── Scroll To Top ── */}
      {showScrollTop && (
        <TouchableOpacity style={styles.scrollTopBtn} onPress={scrollToTop} activeOpacity={0.8}>
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

  pageTitleWrap: {
    paddingHorizontal: s(14),
    paddingTop: vs(14),
    paddingBottom: vs(6),
    backgroundColor: '#fff',
  },
  pageTitle: TEXT_STYLES.titles.large,

  // ── Tabs ──
  tabsWrap: {
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: vs(1) },
    shadowOpacity: 0.08,
    shadowRadius: s(2),
  },
  tabsContent: { paddingHorizontal: s(20), alignItems: 'center' },
  tab: {
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
    marginHorizontal: s(2),
    borderBottomWidth: vs(3),
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: {
    fontSize: ms(16),
    fontFamily: FONTS.muktaMalar.medium,
    color: COLORS.black,
  },
  tabTextActive: {
    fontSize: ms(13),
    fontFamily: FONTS.muktaMalar.bold,
    color: COLORS.primary,
  },
  tabsBottomLine: { height: StyleSheet.hairlineWidth, backgroundColor: '#e0e0e0' },

  // ── Swipe area wraps the entire content below tabs ──
  swipeArea: { flex: 1 },

  list: { flex: 1 },
  listContent: { paddingTop: vs(6), paddingBottom: vs(30) },

  sectionWrap: {
    paddingHorizontal: s(14),
    paddingBottom: vs(4),
    backgroundColor: '#ffffff',
  },

  emptyWrap: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: vs(80), gap: vs(12),
  },
  emptyText: { fontSize: ms(15), color: '#aaa', fontWeight: '600' },
  footerLoader: { paddingVertical: vs(20), alignItems: 'center' },

  scrollTopBtn: {
    position: 'absolute',
    bottom: vs(20), right: s(16),
    backgroundColor: COLORS.primary,
    padding: s(10),
    borderRadius: s(30),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: vs(2) },
    shadowOpacity: 0.2,
    shadowRadius: s(4),
  },
});