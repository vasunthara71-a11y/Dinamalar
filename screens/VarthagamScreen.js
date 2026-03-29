// VarthagamScreen.js
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { CDNApi, mainApi } from '../config/api';
import { s, vs, ms, scaledSizes } from '../utils/scaling';
import { COLORS, FONTS } from '../utils/constants';
import { TEXT_STYLES } from '../utils/textStyles';
import { useFontSize } from '../context/FontSizeContext';
import UniversalHeaderComponent from '../components/UniversalHeaderComponent';
import AppHeaderComponent from '../components/AppHeaderComponent';
import { mvs } from 'react-native-size-matters';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <View style={sk.card}>
      <View style={sk.image} />
      <View style={sk.body}>
        <View style={sk.line} />
        <View style={[sk.line, { width: '65%' }]} />
        <View style={[sk.line, { width: '40%', marginTop: vs(4) }]} />
      </View>
    </View>
  );
}
const sk = StyleSheet.create({
  card: { backgroundColor: COLORS.white, marginBottom: vs(8) },
  image: { width: '100%', height: vs(160), backgroundColor: COLORS.border },
  body: { padding: s(10) },
  line: { height: vs(12), backgroundColor: COLORS.border, borderRadius: s(4), marginBottom: vs(6), width: '90%' },
});

// ─── Section Title ────────────────────────────────────────────────────────────
function SectionTitle({ title }) {
  const { sf } = useFontSize();
  return (
    <View style={st.wrap}>
      <Text style={[st.text, { fontSize: sf(18) }]}>{title}</Text>
      <View style={st.line} />
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

  line: {
    height: vs(3),
    width: s(60),
    backgroundColor: COLORS.primary,
  },
});

// ─── Gold / Silver Card ───────────────────────────────────────────────────────
function GoldSilverCard({ commodity }) {
  const { sf } = useFontSize();
  const meta = commodity?.data?.[0] || {};
  const gold = commodity?.gold || [];
  const silver = commodity?.silver || [];
  const all = [...gold, ...silver];
  const labelMap = { G22k: '22 காரட் 1கி', G18k: '18 காரட் 1கி', Silv: 'வெள்ளி 1கி' };

  const renderDiff = (diff, change) => {
    if (!diff || diff === '0') return null;
    const isUp = change === 'increase';
    return (
      <View style={gc.diffRow}>
        <Text style={[gc.diffText, { color: isUp ? '#16a34a' : '#dc2626', fontSize: sf(11) }]}>
          {isUp ? '+' : ''}{diff}
        </Text>
        <Ionicons
          name={isUp ? 'caret-up' : 'caret-down'}
          size={s(10)}
          color={isUp ? '#16a34a' : '#dc2626'}
        />
      </View>
    );
  };

  return (
    <View style={gc.wrap}>
      <View style={gc.header}>
        <Text style={gc.icon}>🪙</Text>
        <View>
          <Text style={[gc.title, { fontSize: sf(13) }]}>{meta.goldtitle || ''}</Text>
          <Text style={[gc.date, { fontSize: sf(11) }]}>{meta.golddate || ''}</Text>
        </View>
      </View>
      <View style={gc.row}>
        {all.map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 && <View style={gc.divider} />}
            <View style={gc.col}>
              <Text style={[gc.label, { fontSize: sf(11) }]}>{labelMap[item.gtype] || item.gtype}</Text>
              <Text style={[gc.value, { fontSize: sf(14) }]}>{item.rate}</Text>
              {renderDiff(item.diff, item.change)}
            </View>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}
const gc = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: vs(10),
    overflow: 'hidden',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: s(12),
    gap: s(10),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background || '#f8f8f8',
  },

  icon: { fontSize: s(22) },

  title: {
    fontSize: ms(13),
    color: COLORS.text,
    fontFamily: FONTS.muktaMalar.semibold,
  },

  date: {
    fontSize: ms(11),
    color: COLORS.subtext,
    marginTop: vs(2),
    fontFamily: FONTS.muktaMalar.regular,
  },

  row: { flexDirection: 'row', padding: s(12), backgroundColor: COLORS.white },

  col: { flex: 1, alignItems: 'center' },

  divider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: vs(2),
  },

  label: {
    fontSize: ms(11),
    color: COLORS.subtext,
    marginBottom: vs(4),
    textAlign: 'center',
    fontFamily: FONTS.muktaMalar.regular,
  },

  value: {
    fontSize: ms(14),
    color: COLORS.text,
    fontFamily: FONTS.muktaMalar.bold,
  },

  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(2),
    marginTop: vs(2),
  },

  diffText: {
    fontSize: ms(11),
    fontFamily: FONTS.muktaMalar.medium,
  },
});

// ─── Fuel Card ────────────────────────────────────────────────────────────────
function FuelCard({ commodity }) {
  const { sf } = useFontSize();
  const meta = commodity?.data?.[0] || {};
  const fuel = commodity?.fuel?.[0] || {};
  if (!fuel.petrol && !fuel.diesel) return null;

  return (
    <View style={fc.wrap}>
      <View style={fc.header}>
        <Text style={fc.icon}>⛽</Text>
        <View>
          <Text style={[fc.title, { fontSize: sf(13) }]}>{meta.fueltitle || 'பெட்ரோல் & டீசல் விலை ( ₹ )'}</Text>
          <Text style={[fc.date, { fontSize: sf(11) }]}>{fuel.date || meta.fueldate || ''}</Text>
        </View>
      </View>
      <View style={fc.row}>
        <View style={fc.col}>
          <Text style={[fc.label, { fontSize: sf(11) }]}>பெட்ரோல்</Text>
          <Text style={[fc.value, { fontSize: sf(20) }]}>{fuel.petrol}</Text>
        </View>
        <View style={fc.divider} />
        <View style={fc.col}>
          <Text style={[fc.label, { fontSize: sf(11) }]}>டீசல்</Text>
          <Text style={[fc.value, { fontSize: sf(20) }]}>{fuel.diesel}</Text>
        </View>
      </View>
    </View>
  );
}
const fc = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: vs(10),
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: s(12), gap: s(10),
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background || '#f8f8f8',
  },
  icon: { fontSize: s(22) },
  title: { fontSize: ms(13), color: COLORS.text, fontWeight: '700' },
  date: { fontSize: ms(11), color: COLORS.subtext, marginTop: vs(2) },
  row: { flexDirection: 'row', padding: s(12), backgroundColor: COLORS.white },
  col: { flex: 1, alignItems: 'center' },
  divider: { width: 1, backgroundColor: COLORS.border, marginVertical: vs(2) },
  label: { fontSize: ms(11), color: COLORS.subtext, marginBottom: vs(4) },
  value: { fontSize: ms(20), color: COLORS.text, fontWeight: '800' },
});

// ─── Share Market Card ────────────────────────────────────────────────────────
function ShareMarketCard({ commodity }) {
  const { sf } = useFontSize();
  const markets = commodity?.sharemarket || [];
  if (!markets.length) return null;

  return (
    <View style={sm.wrap}>
      <View style={sm.header}>
        <Text style={sm.icon}>📈</Text>
        <Text style={[sm.title, { fontSize: sf(13) }]}>பங்கு சந்தை</Text>
      </View>
      <View style={sm.row}>
        {markets.map((m, i) => {
          const isUp = m.change !== 'down';
          return (
            <React.Fragment key={i}>
              {i > 0 && <View style={sm.divider} />}
              <View style={sm.col}>
                <Text style={[sm.label, { fontSize: sf(12) }]}>{m.stype?.toUpperCase()}</Text>
                <Text style={[sm.value, { fontSize: sf(15) }]}>{m.value}</Text>
                <View style={sm.diffRow}>
                  <Text style={[sm.diffText, { color: isUp ? '#16a34a' : '#dc2626', fontSize: sf(11) }]}>
                    {m.diff}
                  </Text>
                  <Ionicons
                    name={isUp ? 'caret-up' : 'caret-down'}
                    size={s(10)}
                    color={isUp ? '#16a34a' : '#dc2626'}
                  />
                </View>
                <Text style={[sm.dateText, { fontSize: sf(10) }]}>{m.date}</Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}
const sm = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: vs(10),
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: s(12), gap: s(10),
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background || '#f8f8f8',
  },
  icon: { fontSize: s(20) },
  title: { fontSize: ms(13), color: COLORS.text, fontWeight: '700' },
  row: { flexDirection: 'row', padding: s(12), backgroundColor: COLORS.white },
  col: { flex: 1, alignItems: 'center' },
  divider: { width: 1, backgroundColor: COLORS.border },
  label: { fontSize: ms(12), color: COLORS.subtext, marginBottom: vs(4), fontWeight: '700' },
  value: { fontSize: ms(15), color: COLORS.text, fontWeight: '800' },
  diffRow: { flexDirection: 'row', alignItems: 'center', gap: s(2), marginTop: vs(2) },
  diffText: { fontSize: ms(11), fontWeight: '700' },
  dateText: { fontSize: ms(10), color: COLORS.subtext, marginTop: vs(4) },
});

// ─── மேலும் Link ──────────────────────────────────────────────────────────────
function MoreLink({ label, onPress }) {
  return (
    <TouchableOpacity style={ml.wrap} onPress={onPress} activeOpacity={0.7}>
      <Text style={ml.text}>{label} {'>'}</Text>
    </TouchableOpacity>
  );
}
function NewsCard({ item, onPress }) {
  const { sf } = useFontSize();
  const [imageError, setImageError] = useState(false);
  
  const imageUri =
    item.images || item.largeimages || item.image || item.thumbnail ||
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';
  const title = item.newstitle || item.title || '';
  const category = item.categorytitle || item.categrorytitle || item.maincat || '';
  const ago = item.ago || item.time_ago || '';
  const hasVideo = item.video && item.video !== '0';

  return (
    <TouchableOpacity style={nc.wrap} onPress={onPress} activeOpacity={0.85}>
      <View style={nc.imageWrap}>
        {imageError ? (
          <View style={[nc.image, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }]}>
            <Image
              source={{ uri: 'https://stat.dinamalar.com/new/2025/images/dinamalar-pavala-vizha-logo-day.png' }}
              style={{ width: s(80), height: s(40), resizeMode: 'contain' }}
            />
          </View>
        ) : (
          <Image 
            source={{ uri: imageUri }} 
            style={nc.image} 
            resizeMode="cover" 
            onError={() => setImageError(true)}
          />
        )}
        {hasVideo && (
          <View style={nc.playOverlay}>
            <View style={nc.playBtn}>
              <Ionicons name="play" size={s(18)} color="#fff" />
            </View>
          </View>
        )}
      </View>
      <View style={nc.content}>
        <Text style={[nc.title, { fontSize: sf(14), lineHeight: sf(22) }]} numberOfLines={3}>{title}</Text>
        {!!category && (
          <View style={nc.catPill}>
            <Text style={[nc.catText, { fontSize: sf(12) }]}>{category}</Text>
          </View>
        )}
        <View style={nc.meta}>
          {/* <Ionicons
            name="time-outline"
            size={s(12)}
            color={COLORS.subtext}
            style={{ marginRight: s(3) }}
          /> */}
          <Text style={[nc.timeText, { fontSize: sf(12) }]}>{ago}</Text>
          {!!item.newscomment && item.newscomment !== '0' && (
            <View style={nc.commentWrap}>
              <Ionicons name="chatbox" size={s(12)} color={COLORS.subtext} />
              <Text style={[nc.timeText, { fontSize: sf(12) }]}> {item.newscomment}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
const nc = StyleSheet.create({
  wrap: {
    // backgroundColor: COLORS.white,
    marginBottom: vs(2),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  imageWrap: {
    width: '100%',
    height: vs(200),
    position: 'relative',
    // padding: s(10),
  },

  image: {
    width: '100%',
    height: '100%',
  },

  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  playBtn: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    paddingHorizontal: s(10),
    paddingTop: vs(10),
    paddingBottom: vs(15),
  },

  title: {
    fontFamily: FONTS.muktaMalar.bold,
    color: COLORS.text,
    lineHeight: ms(23),
    marginBottom: vs(8),
  },

  catPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#DFE3E8',
    paddingHorizontal: s(10),
    paddingVertical: s(3),
    marginBottom: vs(10),
  },

  catText: {
    fontFamily: FONTS.muktaMalar.bold,
    color: '#454F5B',
  },

  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  timeText: {
    fontFamily: FONTS.muktaMalar.regular,
    fontSize: ms(12),
    color: COLORS.subtext,
  },

  commentWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function VarthagamScreen() {
  const { sf } = useFontSize();
  const navigation = useNavigation();
  const route = useRoute();                                    // ← ADD THIS
  const { initialTabId } = route.params || {};                // ← ADD THIS

  const [subTabs, setSubTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [commodity, setCommodity] = useState(null);
  const [allSections, setAllSections] = useState([]);

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

  // ── Fetch /varthagam ──────────────────────────────────────────────────────
const fetchAll = useCallback(async () => {
  try {
    const res = await CDNApi.get('/varthagam');
    const d = res?.data;
    const tabs = (d?.subcatlist || []).filter(t => t.id !== 'commodity');
    setSubTabs(tabs);

    // ── Pick initial tab based on initialTabId param ──
    if (initialTabId) {
      const matchedTab = tabs.find(t => String(t.id) === String(initialTabId));
      if (matchedTab) {
        setActiveTab(matchedTab);
        // Fetch that tab's news immediately
        setTabLoading(true);
        fetchTabNews(matchedTab, 1, false);
      } else {
        setActiveTab(tabs[0]);
      }
    } else {
      if (tabs.length > 0) setActiveTab(tabs[0]);
    }

    setCommodity(d?.commodity || null);

    const newlist = d?.newlist;
    if (Array.isArray(newlist)) {
      setAllSections(newlist);
    } else if (newlist?.data) {
      setAllSections([{ title: '', data: newlist.data }]);
    } else {
      setAllSections([]);
    }
  } catch (e) {
    console.error('VarthagamScreen fetchAll error:', e?.message);
  } finally {
    setInitLoading(false);
    setRefreshing(false);
  }
}, [initialTabId, fetchTabNews]);                             // ← ADD DEPS

  useEffect(() => { fetchAll(); }, []);

  // ── Fetch tab news from tab.link ──────────────────────────────────────────
  const fetchTabNews = useCallback(async (tab, pg, append = false) => {
    if (!tab?.link || tab.title === 'All') return;
    try {
      const sep = tab.link.includes('?') ? '&' : '?';
      const url = `${tab.link}${sep}page=${pg}`;

      console.log('🔵 Fetching tab URL:', url);

      // ✅ Use mainApi instead of CDNApi — /newsdata lives on www.dinamalar.com
      const res = await mainApi.get(url);  // <-- KEY FIX
      const d = res?.data;

      console.log('🟢 Tab response keys:', Object.keys(d || {}));

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
      console.error('Tab fetch error:', e?.message);
      console.error('Tab fetch status:', e?.response?.status);

      // ✅ Show user-friendly message for 500 errors
      if (e?.response?.status === 500) {
        setTabNews([]);  // clear any stale data
        // Optionally set an error state to show UI message
      }
    } finally {
      setTabLoading(false);
      setTabLoadMore(false);
      setRefreshing(false);
    }
  }, []);

  const handleTabPress = (tab) => {
    if (activeTab?.id === tab.id && activeTab?.title === tab.title) return;
    setActiveTab(tab);
    if (tab.title === 'All') { setTabNews([]); return; }
    setTabLoading(true);
    setTabNews([]);
    setTabPage(1);
    fetchTabNews(tab, 1, false);
  };

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
  const isAllTab = !activeTab || activeTab.title === 'All';

  const buildFlatData = () => {
    if (isAllTab) {
      const flat = [];
      allSections.forEach(section => {
        if (section?.data?.length > 0) {
          if (section.title) {  // ✅ Only show title if it exists
            flat.push({ type: 'section', title: section.title });
          }
          section.data.forEach(item => flat.push({ type: 'news', item }));
        }
      });
      return flat;
    }
    return tabNews.map(item => ({ type: 'news', item }));
  };

  const flatData = buildFlatData();
  const isLoading = initLoading || tabLoading;

  const ListHeader = () =>
    isAllTab && commodity ? (
      <View style={styles.listHeader}>
        <SectionTitle title={commodity.title || 'கமாடிட்டி'} />
        <GoldSilverCard commodity={commodity} />
        <FuelCard commodity={commodity} />
        <ShareMarketCard commodity={commodity} />
        {/* <MoreLink label="மேலும் கமாடிட்டி" onPress={() => { }} /> */}
      </View>
    ) : null;

  const renderItem = ({ item: row }) => {
    if (row.type === 'section') {
      return <View style={styles.sectionWrap}><SectionTitle title={row.title} /></View>;
    }
    return <NewsCard item={row.item} onPress={() => goToArticle(row.item)} />;
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
        <Text style={[styles.pageTitle, { fontSize: sf(18) }]}>
          {activeTab && activeTab.title !== 'All' ? activeTab.title : 'வர்த்தகம்'}
        </Text>
      </View>

      {/* ── Sub Tabs ── */}
      {subTabs.length > 0 && (
        <View style={styles.tabsWrap}>
          <ScrollView
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
                  key={`tab-${tab.id || index}-${index}`}
                  style={styles.tab}
                  onPress={() => handleTabPress(tab)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive, { fontSize: sf(13) }]}>
                    {tab.title}
                  </Text>
                  {isActive && <View style={styles.tabUnderline} />}
                </TouchableOpacity>

              );
            })}
          </ScrollView>
          {/* bottom red line same as TharpothaiyaSeithigalScreen */}
          {/* <View style={styles.tabsBottomLine} /> */}
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
              ? `sec-${i}-${row.title}`
              : `news-${i}-${row.item?.newsid || row.item?.id || i}`
          }
          renderItem={renderItem}
          ListHeaderComponent={<ListHeader />}
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
              <Ionicons name="bar-chart-outline" size={s(48)} color={COLORS.subtext} />
              <Text style={[styles.emptyText, { fontSize: sf(15), color: COLORS.subtext }]}>செய்திகள் இல்லை</Text>
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
          <Ionicons name="arrow-up" size={s(20)} color={COLORS.white} />
        </TouchableOpacity>
      )}

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#f2f2f2',
    paddingTop: Platform.OS === 'android' ? vs(28) : 0,
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
  // ── Tabs ──
  tabsWrap: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabsBottomLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.primary,
  },
  tabsContent: { paddingHorizontal: s(8) },
  tab: {
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
    marginHorizontal: s(2),
    borderBottomWidth: vs(3),
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: ms(16),
    color: COLORS.grey700,
    fontWeight: '500',
    fontFamily: FONTS.muktaMalar.regular,
  },
  // tabTextActive: { color: COLORS.text, fontWeight: '700', fontFamily: FONTS.muktaMalar.regular, },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: s(6),
    right: s(6),
    height: vs(4),
    backgroundColor: COLORS.primary,
  },

  list: { flex: 1 },
  listContent: {
    paddingHorizontal: s(12),
    paddingTop: vs(14),
    paddingBottom: vs(30),
    backgroundColor: COLORS.background || '#f2f2f2',
  },
  listHeader: {},
  sectionWrap: { marginTop: vs(16), marginBottom: vs(2) },

  emptyWrap: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: vs(80), gap: vs(12),
  },
  emptyText: { fontSize: ms(15), color: COLORS.subtext, fontWeight: '600' },
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