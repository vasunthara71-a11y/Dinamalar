  // DinamDinamScreen.js
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { CDNApi } from '../config/api';
import { s, vs, ms, scaledSizes } from '../utils/scaling';
import { COLORS, FONTS } from '../utils/constants';
import { mvs } from 'react-native-size-matters';
import { useFontSize } from '../context/FontSizeContext';
import UniversalHeaderComponent from '../components/UniversalHeaderComponent';
import AppHeaderComponent from '../components/AppHeaderComponent';
import TEXT_STYLES from '../utils/textStyles';

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
  body: { padding: s(12) },
  line: { height: vs(12), backgroundColor: '#e8e8e8', borderRadius: s(4), marginBottom: vs(6), width: '90%' },
});

  // ─── Section Title ────────────────────────────────────────────────────────────
function SectionTitle({ title }) {
  const { sf } = useFontSize();

  return (
    <View style={st.wrap}>
      <Text style={[st.title, { fontSize: sf(18) }]}>{title}</Text>
      <View style={st.underline} />
    </View>
  );
}
const st = StyleSheet.create({
  wrap: { marginBottom: vs(10), marginTop: vs(4) },
  title: TEXT_STYLES.titles.sectionTitles,
  underline: { height: vs(2), width: s(60), backgroundColor: COLORS.primary ,marginTop:ms(2)},
});

  // ─── News Card ────────────────────────────────────────────────────────────────
function NewsCard({ item, onPress, sectionTitle = '' }) {
  const imageUri =
    item.images || item.largeimages || item.image || item.thumbnail ||
    'https: images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';
  const title = item.newstitle || item.title || '';
    // Use item's own category fields, fall back to the section/tab title
  const category = item.categorytitle || item.categrorytitle || item.maincat || item.ctitle || sectionTitle;
  const ago = item.ago || item.time_ago || '';
  const hasVideo = item.video && item.video !== '0';
  const comments = item.newscomment || item.commentcount || '';

  return (
    <TouchableOpacity style={nc.wrap} onPress={onPress} activeOpacity={0.85}>
      <View style={nc.imageWrap}>
        <Image source={{ uri: imageUri }} style={nc.image} resizeMode="cover" />
        {hasVideo && (
          <View style={nc.playOverlay}>
            <View style={nc.playBtn}>
              <Ionicons name="play" size={s(18)} color="#fff" />
            </View>
          </View>
        )}
      </View>
      <View style={nc.content}>
        <Text style={nc.title} numberOfLines={3}>{title}</Text>
        {!!category && (
          <View style={nc.catWrap}>
            <Text style={nc.catText}>{category}</Text>
          </View>
        )}
        <View style={nc.meta}>
          <Text style={nc.metaText}>{ago}</Text>
          {!!comments && comments !== '0' && (
            <View style={nc.commentWrap}>
              <Ionicons name="chatbox" size={s(12)} color="#888" />
              <Text style={nc.metaText}> {comments}</Text>
            </View>
          )}
          {!!item.audio && item.audio !== '0' && (
            <Ionicons name="volume-high-outline" size={s(14)} color="#888" style={{ marginLeft: s(4) }} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
const nc = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: vs(2),
  },
  imageWrap: { width: '100%', height: vs(200), position: 'relative', padding: s(12) },
  image: { width: '100%', height: '100%' },
  playOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  playBtn: {
    width: s(44), height: s(44), borderRadius: s(22),
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center', alignItems: 'center', paddingLeft: s(3),
  },
  content: { paddingHorizontal: s(12), paddingTop: vs(6), paddingBottom: vs(12) },
  title: TEXT_STYLES.newsCard.title,
  catWrap: TEXT_STYLES.newsCard.catWrap,
  catText: TEXT_STYLES.newsCard.category,

  meta: TEXT_STYLES.CommentDateContainer,
  metaText: TEXT_STYLES.newsCard.meta,
  commentWrap: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' },
});

  // ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DinamDinamScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { sf } = useFontSize();

  const [subTabs, setSubTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);

    // All tab — newlist sections: [{ title, id, link, data: [...] }]
  const [allSections, setAllSections] = useState([]);

    // Sub tab — flat paginated news
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

  const handleScroll = useCallback((e) => {
    setShowScrollTop(e.nativeEvent.contentOffset.y > 300);
  }, []);

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

    // ── Fetch /dinamdinam → All tab ───────────────────────────────────────────
  const fetchAll = useCallback(async () => {
      // Always read params fresh — handles re-navigation with different tab
    const currentTabId = route.params?.initialTabId;
    const currentTabLink = route.params?.initialTabLink;
    try {
      const res = await CDNApi.get('/dinamdinam');
      const d = res?.data;

      const tabs = d?.subcatlist || [];
      setSubTabs(tabs);

        // Pre-select tab if navigated from DrawerMenu sub-item
      if (currentTabId || currentTabLink) {
        const preselected = tabs.find(t =>
          (currentTabId && String(t.id) === String(currentTabId)) ||
          (currentTabLink && t.link === currentTabLink)
        );
        if (preselected) {
          setActiveTab(preselected);
            // Still load All sections in background
          const sections = (d?.newlist || []).filter(
            sec => Array.isArray(sec?.data) && sec.data.length > 0
          );
          setAllSections(sections);
            // Fetch this tab's news immediately
          if (preselected.link !== '/dinamdinam') {
            setTabLoading(true);
            fetchTabNews(preselected, 1, false);
          }
          return;
        }
      }
        // Default: All tab
      if (tabs.length > 0) setActiveTab(tabs[0]);

        // newlist → sections with data arrays
      const sections = (d?.newlist || []).filter(
        sec => Array.isArray(sec?.data) && sec.data.length > 0
      );
      setAllSections(sections);
    } catch (e) {
      console.error('DinamDinam fetchAll error:', e?.message);
    } finally {
      setInitLoading(false);
      setRefreshing(false);
    }
  }, [route.params?.initialTabId, route.params?.initialTabLink]);

    // Re-run every time screen focuses — catches fresh route.params on re-navigation
  useFocusEffect(
    useCallback(() => {
      setInitLoading(true);
      setTabNews([]);
      setTabPage(1);
      setTabLastPage(1);
      fetchAll();
    }, [route.params?.initialTabId, route.params?.initialTabLink])
  );

    // ── Fetch paginated news for a sub tab ────────────────────────────────────
  const fetchTabNews = useCallback(async (tab, pg, append = false) => {
    if (!tab?.link || tab.link === '/dinamdinam') return;
    try {
      const sep = tab.link.includes('?') ? '&' : '?';
      const url = `${tab.link}${sep}page=${pg}`;
      const res = await CDNApi.get(url);
      const d = res?.data;

        // /newsdata returns: { newlist: { data:[...], last_page:N } }
        // or { newslist: { data:[...] } } or flat { data:[...] }
      const raw =
        d?.newlist?.data ||
        d?.newslist?.data ||
        d?.newdata?.data ||
        d?.data?.data ||
        (Array.isArray(d?.newlist) ? d.newlist : null) ||
        (Array.isArray(d?.data) ? d.data : null) ||
        d?.list ||
        [];
      const list = raw.filter(Boolean);

      const lp =
        d?.newlist?.last_page ||
        d?.newslist?.last_page ||
        d?.newdata?.last_page ||
        d?.data?.last_page ||
        d?.last_page ||
        1;

      setTabLastPage(lp);
      setTabNews(prev => append ? [...prev, ...list] : list);
      setTabPage(pg);
    } catch (e) {
      console.error('DinamDinam tab fetch error:', e?.message);
    } finally {
      setTabLoading(false);
      setTabLoadMore(false);
      setRefreshing(false);
    }
  }, []);

    // ── Tab press ─────────────────────────────────────────────────────────────
  const handleTabPress = (tab) => {
    const alreadyActive = activeTab
      ? (tab.link === '/dinamdinam'
        ? activeTab.link === '/dinamdinam'
        : String(activeTab.id) === String(tab.id))
      : false;
    if (alreadyActive) return;

      // Always update active tab first — UI highlights immediately
    setActiveTab(tab);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });

      // All tab — data already in allSections, just clear sub-tab news
    if (tab.link === '/dinamdinam') {
      setTabNews([]);
      setTabPage(1);
      setTabLastPage(1);
      return;
    }

      // Sub tab — fetch fresh
    setTabLoading(true);
    setTabNews([]);
    setTabPage(1);
    setTabLastPage(1);
    fetchTabNews(tab, 1, false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    if (!activeTab || activeTab.link === '/dinamdinam') fetchAll();
    else fetchTabNews(activeTab, 1, false);
  };

  const handleLoadMore = () => {
    if (!activeTab || activeTab.link === '/dinamdinam') return;
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

    // Identify All tab by its unique link — safest approach
    // "புகார் பெட்டி" also has id:null so we can't use id alone
  const isAllTab = !activeTab || activeTab.link === '/dinamdinam';

    // ── Build flat list data ──────────────────────────────────────────────────
  const buildFlatData = () => {
    if (isAllTab) {
      const flat = [];
      allSections.forEach((section) => {
        flat.push({ type: 'section', title: section.title, id: section.id });
        (section.data || []).forEach((item) => flat.push({ type: 'news', item, sectionTitle: section.title }));
      });
      return flat;
    }
    return tabNews.map((item, i) => ({ type: 'news', item, sectionTitle: activeTab?.title || '', _idx: i }));
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
    return <NewsCard item={row.item} onPress={() => goToArticle(row.item)} sectionTitle={row.sectionTitle || ''} />;
  };

  return (
    <View style={styles.container}>

      <UniversalHeaderComponent
        showMenu showSearch showNotifications showLocation
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
        <Text style={styles.pageTitle}>தினம் தினம்</Text>
      </View>

      {/* ── Tabs from subcatlist ── */}
      {subTabs.length > 0 && (
        <View style={styles.tabsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {subTabs.map((tab, index) => {
              const isActive = activeTab
                ? (tab.link === '/dinamdinam'
                  ? activeTab.link === '/dinamdinam'
                  : String(activeTab.id) === String(tab.id))
                : index === 0;
              return (
                <TouchableOpacity
                  key={`tab-${tab.id != null ? tab.id : 'all-' + index}`}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => handleTabPress(tab)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.tabsBottomLine} />
        </View>
      )}

      {/* ── Content ── */}
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
              <Ionicons name="newspaper-outline" size={s(48)} color="#ccc" />
              <Text style={styles.emptyText}>செய்திகள் இல்லை</Text>
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

    // Page title
  pageTitleWrap: {
    paddingHorizontal: s(14),
    paddingTop: vs(14),
    paddingBottom: vs(6),
    backgroundColor: '#fff',
  },
  pageTitle: TEXT_STYLES.titles.sectionTitles,

    // Tabs — same style as SportsScreen
  tabsWrap: {
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: vs(1) },
    shadowOpacity: 0.08,
    shadowRadius: s(2),
  },
  tabsContent: { paddingHorizontal: s(4), alignItems: 'center' },
  tab: {
    paddingHorizontal: s(14),
    paddingVertical: vs(12),
    marginHorizontal: s(2),
    borderBottomWidth: vs(3),
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: TEXT_STYLES.tabs.small,
  tabTextActive: TEXT_STYLES.tabs.smallActive,
  tabsBottomLine: { height: StyleSheet.hairlineWidth, backgroundColor: '#e0e0e0' },

  list: { flex: 1 },
  listContent: { paddingTop: vs(6), paddingBottom: vs(30) },

    // Section header on grey background
  sectionWrap: {
    paddingHorizontal: s(14),
    paddingTop: vs(16),
    paddingBottom: vs(4),
    backgroundColor: '#f2f2f2',
  },

  emptyWrap: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: vs(80), gap: vs(12),
  },
  emptyText: { fontSize: ms(15), fontFamily: FONTS.semiBold, color: '#aaa' },
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