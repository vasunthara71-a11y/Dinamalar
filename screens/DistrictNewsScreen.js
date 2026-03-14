// DistrictNewsScreen.js
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
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CDNApi } from '../config/api';
import { s, vs, ms, scaledSizes } from '../utils/scaling';
import { COLORS, FONTS, NewsCard as NewsCardStyles } from '../utils/constants';
import UniversalHeaderComponent from '../components/UniversalHeaderComponent';
import AppHeaderComponent from '../components/AppHeaderComponent';
import { mvs } from 'react-native-size-matters';
import TEXT_STYLES from '../utils/textStyles';

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

// ─── Helper: strip HTML tags ─────────────────────────────────────
const stripHtml = (html) => {
  if (!html || typeof html !== 'string') return '';
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
};

// ─── Helper: is this the "All" tab? ──────────────────────────────────────────
// The All tab has no `id` field and link === '/district'
const isAllDistrict = (d) => !d || !d.id || d.title === 'All';

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
  card:  { backgroundColor: '#fff', marginBottom: vs(8) },
  image: { width: '100%', height: vs(200), backgroundColor: '#e8e8e8' },
  body:  { padding: s(12) },
  line:  { height: vs(12), backgroundColor: '#e8e8e8', borderRadius: s(4), marginBottom: vs(6), width: '90%' },
});

// ─── Section Title ─────────────────────────────────────────────────────────────
function SectionTitle({ title }) {
  return (
    <View style={st.wrap}>
      <Text style={st.text}>{title}</Text>
      <View style={st.underline} />
    </View>
  );
}
const st = StyleSheet.create({
  wrap:      { marginBottom: vs(8), marginTop: vs(2) },
  text:      { fontSize: scaledSizes.font.lg, fontFamily: FONTS.muktaMalar.bold, color: '#1a1a1a', marginBottom: vs(4) },
  underline: { height: vs(2), width: s(40), backgroundColor: COLORS.primary },
});

// ─── News Card ────────────────────────────────────────────────────────
// News Card (sub-tab full-width — image 3 style)
// ─────────────────────────────────────────────────────────────────────
function NewsCard({ item, onPress }) {
  const imageUri =
    item.largeimages || item.images || item.image || item.thumbnail || item.thumb ||
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';

  const title = item.newstitle || item.title || item.videotitle || item.name || '';
  const category = item.maincat || item.categrorytitle || item.ctitle || item.maincategory || '';
  const ago = item.ago || item.time_ago || '';
  const newscomment = item.newscomment || item.commentcount || '';
  const hasAudio = item.audio === 1 || item.audio === '1' || item.audio === true ||
    (typeof item.audio === 'string' && item.audio.length > 1 && item.audio !== '0');

  return (
    <View style={NewsCardStyles.wrap}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.88}>

        {/* Image with horizontal padding */}
        <View style={NewsCardStyles.imageWrap}>
          <Image source={{ uri: imageUri }} style={NewsCardStyles.image} resizeMode="contain" />
        </View>

        {/* Content */}
        <View style={NewsCardStyles.contentContainer}>
          {!!title && (
            <Text style={NewsCardStyles.title} numberOfLines={3}>{title}</Text>
          )}

          {/* Category pill — gray, matches screenshot */}
          {!!category && (
            <View style={NewsCardStyles.catPill}>
              <Text style={NewsCardStyles.catText}>{category}</Text>
            </View>
          )}

          {/* Meta row */}
          <View style={NewsCardStyles.metaRow}>
            <Text style={NewsCardStyles.timeText}>{ago}</Text>
            <View style={NewsCardStyles.metaRight}>
              
              {!!newscomment && newscomment !== '0' && (
                <View style={NewsCardStyles.commentRow}>
                  <Ionicons name="chatbox" size={s(14)} color={PALETTE.grey700} />
                  <Text style={NewsCardStyles.commentText}> {newscomment}</Text>
                </View>
              )}
              {hasAudio && (
                <View style={NewsCardStyles.audioIcon}>
                  <Ionicons name="volume-high" size={s(14)} color={PALETTE.grey700} />
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Divider */}
      <View style={NewsCardStyles.divider} />
    </View>
  );
}

// ─── District Picker Modal ────────────────────────────────────────────────────
function DistrictPicker({ visible, districts, selectedId, onSelect, onClose }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableOpacity style={dp.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={dp.sheet}>
          <View style={dp.header}>
            <Text style={dp.headerTitle}>மாவட்டம் தேர்வு செய்க</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={s(20)} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {districts.map((d, i) => {
              const isSelected = String(d.id) === String(selectedId);
              return (
                <TouchableOpacity
                  key={`d-${d.id || i}`}
                  style={[dp.row, isSelected && dp.rowActive]}
                  onPress={() => onSelect(d)}
                  activeOpacity={0.7}
                >
                  <Text style={[dp.rowText, isSelected && dp.rowTextActive]}>
                    {d.title}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={s(16)} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
            <View style={{ height: vs(30) }} />
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
const dp = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: s(16),
    borderTopRightRadius: s(16),
    maxHeight: '75%',
    paddingBottom: vs(20),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    paddingVertical: vs(14),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: TEXT_STYLES.titles.sectionTitles,
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(16),
    paddingVertical: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  rowActive:    { backgroundColor: '#c7e8ff' },
  rowText:     TEXT_STYLES.body.large,
  rowTextActive:{ fontFamily: FONTS.muktaMalar.bold, color: COLORS.primary },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DistrictNewsScreen() {
  const navigation = useNavigation();
  const route      = useRoute();

  const initialDistrictId    = route?.params?.districtId    || null;
  const initialDistrictTitle = route?.params?.districtTitle || null;

  const [districts,      setDistricts]      = useState([]);
  const [activeDistrict, setActiveDistrict] = useState(null);
  const [pickerVisible,  setPickerVisible]  = useState(false);

  const [allSections,  setAllSections]  = useState([]);
  const [districtNews, setDistrictNews] = useState([]);
  const [page,         setPage]         = useState(1);
  const [lastPage,     setLastPage]     = useState(1);
  const [tabLoading,   setTabLoading]   = useState(false);
  const [loadMore,     setLoadMore]     = useState(false);

  const [initLoading,   setInitLoading]   = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [isDrawerVisible,         setIsDrawerVisible]         = useState(false);
  const [isLocationDrawerVisible, setIsLocationDrawerVisible] = useState(false);

  const flatListRef = useRef(null);

  const handleScroll = useCallback((e) => {
    setShowScrollTop(e.nativeEvent.contentOffset.y > 300);
  }, []);

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  // ── Fetch /district (All tab) ─────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const res  = await CDNApi.get('/district');
      const d    = res?.data;
      const tabs = d?.subcatlist || [];
      setDistricts(tabs);

      // Always store All sections regardless of which district is active
      const sections = (d?.newlist || []).filter(
        sec => Array.isArray(sec?.data) && sec.data.length > 0
      );
      setAllSections(sections);

      if (initialDistrictId) {
        // Pre-select district passed via navigation params (e.g. from DistrictDrawer)
        const found = tabs.find(t => String(t.id) === String(initialDistrictId));
        if (found) {
          setActiveDistrict(found);
          // fetchDistrictNews will be triggered by the useEffect below
          // initLoading will be cleared after district news loads
          return;
        }
      }

      // Default: All tab (tabs[0] has no id)
      setActiveDistrict(tabs[0] || null);
    } catch (e) {
      console.error('DistrictNewsScreen fetchAll error:', e?.message);
    } finally {
      setInitLoading(false);
      setRefreshing(false);
    }
  }, [initialDistrictId]);

  useEffect(() => { fetchAll(); }, []);

  // ── Extract news list from ANY response shape ─────────────────────────────
  const extractList = (d) => (
    d?.districtlisting?.data ||   // Chennai, Namakkal, most districts
    d?.newlist?.data         ||
    d?.newslist?.data        ||
    d?.districtlist?.data    ||
    d?.districtNews?.data    ||
    d?.news?.data            ||
    d?.data?.data            ||
    d?.data                  ||
    d?.list                  ||
    []
  ).filter(Boolean);

  const extractLastPage = (d) => (
    d?.districtlisting?.last_page ||
    d?.newlist?.last_page         ||
    d?.newslist?.last_page        ||
    d?.districtlist?.last_page    ||
    d?.districtNews?.last_page    ||
    d?.news?.last_page            ||
    d?.data?.last_page            ||
    d?.last_page                  ||
    1
  );

  // ── Fetch specific district news ──────────────────────────────────────────
  const fetchDistrictNews = useCallback(async (district, pg, append = false) => {
    // Skip if no district or it's the All tab (no id)
    if (isAllDistrict(district)) return;

    try {
      // district.link is like "/districtdata?cat=267" — always has a ?
      const sep = district.link.includes('?') ? '&' : '?';
      const url = `${district.link}${sep}page=${pg}`;
      console.log('DistrictNews fetch:', url);

      const res  = await CDNApi.get(url);
      const d    = res?.data;
      const list = extractList(d);
      const lp   = extractLastPage(d);

      console.log(`District ${district.title}: found ${list.length} items`);

      setLastPage(lp);
      setDistrictNews(prev => append ? [...prev, ...list] : list);
      setPage(pg);
    } catch (e) {
      console.error('DistrictNews fetch error:', e?.message);
    } finally {
      setTabLoading(false);
      setLoadMore(false);
      setRefreshing(false);
    }
  }, []);

  // ── Re-fetch when district changes ───────────────────────────────────────
  useEffect(() => {
    if (!activeDistrict) return;
    // Skip All tab — already loaded by fetchAll
    if (isAllDistrict(activeDistrict)) return;

    setDistrictNews([]);
    setPage(1);
    setLastPage(1);
    // Use tabLoading (not initLoading) so skeleton shows while news loads
    setTabLoading(true);
    // Also clear initLoading in case we arrived here via navigation params
    setInitLoading(false);
    fetchDistrictNews(activeDistrict, 1, false);
  }, [activeDistrict?.id]);

  const handleDistrictSelect = (district) => {
    setPickerVisible(false);
    // Skip if same district re-selected
    const isSame = district.id
      ? String(district.id) === String(activeDistrict?.id)
      : isAllDistrict(activeDistrict);
    if (isSame) return;

    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    setActiveDistrict(district);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    if (isAllDistrict(activeDistrict)) fetchAll();
    else fetchDistrictNews(activeDistrict, 1, false);
  };

  const handleLoadMore = () => {
    if (isAllDistrict(activeDistrict)) return;
    if (loadMore || page >= lastPage) return;
    setLoadMore(true);
    fetchDistrictNews(activeDistrict, page + 1, true);
  };

  const goToArticle = (item) => {
    const category = item.maincat || item.categrorytitle || item.ctitle || item.maincategory || '';
    
    // Debug: Log all available category fields
    console.log('=== DistrictNews goToArticle DEBUG ===');
    console.log('Item:', item);
    console.log('maincat:', item.maincat);
    console.log('categrorytitle:', item.categrorytitle);
    console.log('ctitle:', item.ctitle);
    console.log('maincategory:', item.maincategory);
    console.log('Final category:', category);
    console.log('===================================');
    
    // Handle special category navigation - more flexible matching
    const categoryLower = category.toLowerCase().trim();
    
    // Tharpothaiya - expanded with all possible variations
    if (categoryLower.includes('தர்போதைய') || categoryLower.includes('tharpothaiya') || 
        categoryLower.includes('தர்போதைய செய்திகள்') || categoryLower.includes('தர்போதையா') ||
        categoryLower.includes('தற்போதைய') || categoryLower.includes('தற்போதைய செய்தி') ||
        categoryLower.includes('தர்போதையா') || categoryLower.includes('தர்போதையா செய்தி')) {
      console.log('🎯 MATCH: Tharpothaiya - Navigating to TharpothaiyaSeithigalScreen');
      navigation?.navigate('TharpothaiyaSeithigalScreen');
      return;
    }
    
    // Varthagam/Business - expanded variations
    if (categoryLower.includes('வர்த்தகம்') || categoryLower.includes('varthagam') || 
        categoryLower.includes('business') || categoryLower.includes('வணிகம்') ||
        categoryLower.includes('வர்த்தகம்') || categoryLower.includes('வணிகம்')) {
      console.log('🎯 MATCH: Varthagam - Navigating to VarthagamScreen');
      navigation?.navigate('VarthagamScreen');
      return;
    }
    
    // Dinam Dinam - expanded variations
    if (categoryLower.includes('தினம் தினம்') || categoryLower.includes('dinamdinam') || 
        categoryLower.includes('தினம்தினம்') || categoryLower.includes('தினம் தினம்')) {
      console.log('🎯 MATCH: Dinam Dinam - Navigating to DinamDinamScreen');
      navigation?.navigate('DinamDinamScreen');
      return;
    }
    
    // Sports - expanded variations
    if (categoryLower.includes('விளையாட்டு') || categoryLower.includes('sports') || 
        categoryLower.includes('விளையாட்டுகள்') || categoryLower.includes('sport') ||
        categoryLower.includes('விளையாட்டு') || categoryLower.includes('விளையாட்டுகள்')) {
      console.log('🎯 MATCH: Sports - Navigating to SportsScreen');
      navigation?.navigate('SportsScreen');
      return;
    }
    
    // Tamil Nadu - expanded variations
    if (categoryLower.includes('தமிழ்நாடு') || categoryLower.includes('tamil nadu') || 
        categoryLower.includes('tamilnadu') || categoryLower.includes('தமிழ்நாடு') ||
        categoryLower.includes('தமிழ்நாடு') || categoryLower.includes('தமிழ்நாடு')) {
      console.log('🎯 MATCH: Tamil Nadu - Navigating to TamilNaduScreen');
      navigation?.navigate('TamilNaduScreen');
      return;
    }
    
    // Default to NewsDetailsScreen for regular news
    console.log('❌ NO MATCH: Default navigation to NewsDetailsScreen');
    navigation.navigate('NewsDetailsScreen', {
      newsId:   item.newsid || item.id,
      newsItem: item,
    });
  };

  const goToSearch = () => navigation.navigate('SearchScreen');

  const handleSelectDistrict = (district) => {
    console.log('DistrictNews district selected from location drawer:', district);
    if (district?.title) {
      // If the same district is selected, just close drawer
      if (district.title === headerTitle) {
        setIsLocationDrawerVisible(false);
        return;
      }
      
      // Navigate to DistrictNewsScreen with the selected district
      // This will work whether we're on DistrictNewsScreen or another screen
      navigation.navigate('DistrictNewsScreen', {
        districtId: district.id,
        districtTitle: district.title
      });
    }
  };

  const isAllTab = isAllDistrict(activeDistrict);

  // ── Build flat list ───────────────────────────────────────────────────────
  const buildFlatData = () => {
    if (isAllTab) {
      const flat = [];
      allSections.forEach((section) => {
        flat.push({ type: 'section', title: section.title, id: section.id });
        (section.data || []).forEach((item) => flat.push({ type: 'news', item }));
      });
      return flat;
    }
    return districtNews.map((item) => ({ type: 'news', item }));
  };

  const flatData    = buildFlatData();
  const isLoading   = initLoading || tabLoading;
  const headerTitle = (!isAllTab && activeDistrict?.title)
    ? activeDistrict.title
    : 'உள்ளூர்';

  const renderItem = ({ item: row }) => {
    if (row.type === 'section') {
      return (
        <View style={styles.sectionWrap}>
          <SectionTitle title={row.title} />
        </View>
      );
    }
    return <NewsCard item={row.item} onPress={() => goToArticle(row.item)} />;
  };

  return (
    <View style={styles.container}>

      <UniversalHeaderComponent
        showMenu showSearch showNotifications showLocation
        onSearch={goToSearch}
        onLocation={() => setIsLocationDrawerVisible(true)}
        selectedDistrict={headerTitle}
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
          selectedDistrict={headerTitle}
        />
      </UniversalHeaderComponent>

      {/* ── Page Title Row ── */}
      <View style={styles.pageTitleRow}>
        <View style={styles.pageTitleLeft}>
          <Text style={styles.pageTitle}>{headerTitle}</Text>
          <View style={styles.pageTitleUnderline} />
        </View>

        <TouchableOpacity
          style={styles.pickerBtn}
          onPress={() => setPickerVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.pickerBtnText}>உள்ளூர் செய்திகள்</Text>
          <Ionicons name="chevron-down" size={s(14)} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

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
              <Ionicons name="location-outline" size={s(48)} color="#ccc" />
              <Text style={styles.emptyText}>செய்திகள் இல்லை</Text>
            </View>
          }
          ListFooterComponent={
            loadMore ? (
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

      {/* ── District Picker Modal ── */}
      <DistrictPicker
        visible={pickerVisible}
        districts={districts}
        selectedId={activeDistrict?.id}
        onSelect={handleDistrictSelect}
        onClose={() => setPickerVisible(false)}
      />

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
  pageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(14),
    paddingTop: vs(14),
    paddingBottom: vs(10),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pageTitleLeft: {},
  pageTitle: {
    fontSize: scaledSizes.font.lg,
    fontFamily: FONTS.muktaMalar.bold,
    color: '#1a1a1a',
    marginBottom: vs(3),
  },
  pageTitleUnderline: {
    height: vs(2),
    width: s(40),
    backgroundColor: COLORS.primary,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    borderWidth: 1,
    borderColor: COLORS.primary,
    // borderRadius: s(4),
    paddingHorizontal: s(5),
    paddingVertical: vs(5),
  },
  pickerBtnText: {
    fontSize: ms(10),
    fontFamily: FONTS.muktaMalar.regular,
    color: COLORS.primary,
  },
  list:        { flex: 1 },
  listContent: { paddingTop: vs(6), paddingBottom: vs(30) },
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
  emptyText:    { fontSize: ms(15), fontFamily: FONTS.muktaMalar.semiBold, color: '#aaa' },
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