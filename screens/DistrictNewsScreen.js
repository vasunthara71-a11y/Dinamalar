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
  StatusBar,
} from 'react-native';
import { SpeakerIcon } from '../assets/svg/Icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CDNApi, mainApi, u38Api, testNetworkConnectivity, getCachedData, setCachedData } from '../config/api';
import { s, vs, ms, scaledSizes } from '../utils/scaling';
import { COLORS, FONTS, NewsCard as NewsCardStyles } from '../utils/constants';
import UniversalHeaderComponent from '../components/UniversalHeaderComponent';
import AppHeaderComponent from '../components/AppHeaderComponent';
import { useFontSize } from '../context/FontSizeContext';
import TEXT_STYLES from '../utils/textStyles';
import { Ionicons } from '@expo/vector-icons';
import CustomCalendarModal from '../components/Customcalendarmodal';
import { TaboolaAdSection } from '../components/TaboolaComponent';
import TopMenuStrip from '../components/TopMenuStrip';
import { SafeAreaView } from 'react-native-safe-area-context';

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

// ─── Helper: is this the "All" tab? ──────────────────────────────────────────
const isAllDistrict = (d) => !d || !d.id || d.title === 'All';

// ─── Group news by date ───────────────────────────────────────────────────────
function groupByDate(items) {
  const flat = [];
  let currentDate = null;
  let isFirstDate = true;

  items.forEach(item => {
    const rawDate = item.ago || item.date || item.time_date || '';
    const dateKey = rawDate.split(' ')[0] || rawDate;

    if (dateKey && dateKey !== currentDate) {
      currentDate = dateKey;
      flat.push({ type: 'dateHeader', date: rawDate, dateKey, isClickable: isFirstDate });
      isFirstDate = false;
    }
    flat.push({ type: 'item', item });
  });

  return flat;
}

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
  image: { width: '100%', height: vs(200), backgroundColor: '#e8e8e8' },
  body: { padding: s(12) },
  line: { height: vs(12), backgroundColor: '#e8e8e8', borderRadius: s(4), marginBottom: vs(6), width: '90%' },
});

// ─── News Card ────────────────────────────────────────────────────────────────
function NewsCard({ item, onPress }) {
  const { sf } = useFontSize();
  const [imageError, setImageError] = useState(false);

  const imageUri =
    item.largeimages || item.images || item.image || item.thumbnail || item.thumb ||
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';

  const title = item.newstitle || item.title || item.videotitle || item.name || '';
  const ago = item.ago || item.time_ago || '';
  const newscomment = item.newscomment || item.commentcount || '';
  const hasAudio = item.audio === 1 || item.audio === '1' || item.audio === true ||
    (typeof item.audio === 'string' && item.audio.length > 1 && item.audio !== '0');

  return (
    <View style={NewsCardStyles.wrap}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
        <View style={NewsCardStyles.imageWrap}>
          {imageError ? (
            <View style={[NewsCardStyles.image, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
              <Image
                source={{ uri: 'https://stat.dinamalar.com/new/2025/images/dinamalar-pavala-vizha-logo-day.png' }}
                style={{ width: s(120), height: s(60) }}
                resizeMode="contain"
              />
            </View>
          ) : (
            <Image
              source={{ uri: imageUri }}
              style={NewsCardStyles.image}
              resizeMode="contain"
              onError={() => setImageError(true)}
            />
          )}
        </View>

        <View style={NewsCardStyles.contentContainer}>
          {!!title && (
            <Text style={[NewsCardStyles.title, { fontSize: sf(14), lineHeight: sf(22) }]} numberOfLines={3}>
              {title}
            </Text>
          )}
          <View style={NewsCardStyles.metaRow}>
            <Text style={[NewsCardStyles.timeText, { fontSize: sf(12) }]}>{ago}</Text>
            <View style={NewsCardStyles.metaRight}>
              {!!newscomment && newscomment !== '0' && (
                <View style={NewsCardStyles.commentRow}>
                  <Ionicons name="chatbox" size={s(14)} color={PALETTE.grey700} />
                  <Text style={[NewsCardStyles.commentText, { fontSize: sf(12) }]}> {newscomment}</Text>
                </View>
              )}
              {hasAudio && (
                <View style={NewsCardStyles.audioIcon}>
                  <SpeakerIcon size={s(14)} color={PALETTE.grey700} />
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
      <View style={NewsCardStyles.divider} />
    </View>
  );
}

// ─── District Picker Modal ────────────────────────────────────────────────────
function DistrictPicker({ visible, districts, selectedId, onSelect, onClose }) {
  const { sf } = useFontSize();
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
            <Text style={[dp.headerTitle, { fontSize: sf(16) }]}>மாவட்டம் தேர்வு செய்க</Text>
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
                  <Text style={[dp.rowText, isSelected && dp.rowTextActive, { fontSize: sf(14) }]}>
                    {d.title}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={s(16)} color={COLORS.primary} />}
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: s(16), borderTopRightRadius: s(16), maxHeight: '75%', paddingBottom: vs(20) },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: s(12), paddingVertical: vs(14), borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle: { fontFamily: FONTS.muktaMalar.bold, color: '#1a1a1a' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: s(12), paddingVertical: vs(12), borderBottomWidth: 1, borderBottomColor: '#f8f8f8' },
  rowActive: { backgroundColor: '#cae9ff' },
  rowText: { fontFamily: FONTS.muktaMalar.medium, color: COLORS.text, lineHeight: ms(22) },
  rowTextActive: { fontFamily: FONTS.muktaMalar.bold, color: COLORS.primary },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DistrictNewsScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const initialDistrictId = route?.params?.districtId || null;
  const initialDistrictTitle = route?.params?.districtTitle || null;

  const [districts, setDistricts] = useState([]);
  const [activeDistrict, setActiveDistrict] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  const [allSections, setAllSections] = useState([]);
  const [districtNews, setDistrictNews] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [tabLoading, setTabLoading] = useState(false);
  const [loadMore, setLoadMore] = useState(false);

  const [initLoading, setInitLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isLocationDrawerVisible, setIsLocationDrawerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [allDistrictNews, setAllDistrictNews] = useState([]);
  const [taboolaAds, setTaboolaAds] = useState(null);

  // ── PugarPetti data from API ─────────────────────────────────────────────
  const [pugarPettiLink, setPugarPettiLink] = useState(null);

  // ── Active sub-tab (sub-districts of selected district) ──────────────────
  const [subDistricts, setSubDistricts] = useState([]);   // sub-tabs fetched per district
  const [activeSubTab, setActiveSubTab] = useState(null); // null = "All"

  const flatListRef = useRef(null);
  const { sf } = useFontSize();

  const handleScroll = useCallback((e) => {
    setShowScrollTop(e.nativeEvent.contentOffset.y > 300);
  }, []);

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  // ── Fetch /district (master list) ────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const res = await CDNApi.get('/district');
      const d = res?.data;
      const tabs = d?.subcatlist || [];
      setDistricts(tabs);

      const sections = (d?.newlist || []).filter(
        sec => Array.isArray(sec?.data) && sec.data.length > 0
      );
      setAllSections(sections);

      if (d?.taboola_ads?.mobile) setTaboolaAds(d.taboola_ads.mobile);

      // Resolve which district to activate
      if (initialDistrictId) {
        const found = tabs.find(t => String(t.id) === String(initialDistrictId));
        if (found) { setActiveDistrict(found); return; }
      }
      if (initialDistrictTitle) {
        const found = tabs.find(t => t.title === initialDistrictTitle);
        if (found) { setActiveDistrict(found); return; }
      }

      // Default to Chennai
      const chennai = tabs.find(t => t.title?.includes('சென்னை') || t.title?.toLowerCase().includes('chennai'));
      setActiveDistrict(chennai || tabs[0] || null);
    } catch (e) {
      console.error('fetchAll error:', e?.message);
      
      // ── KEY CHANGE: If we have a district ID, fetch district news directly ──
      if (initialDistrictId) {
        console.log('[DistrictNews] fetchAll failed but have districtId, fetching district news directly...');
        console.log('[DistrictNews] initialDistrictId:', initialDistrictId, 'initialDistrictTitle:', initialDistrictTitle);
        const syntheticDistrict = {
          id: initialDistrictId,
          title: initialDistrictTitle || 'உள்ளூர்',
          link: `/districtdata?cat=${initialDistrictId}`
        };
        console.log('[DistrictNews] Created synthetic district:', syntheticDistrict);
        setActiveDistrict(syntheticDistrict);
        // This will trigger the useEffect that calls fetchDistrictNews
        return;
      }
      
      // Fallback: Try alternative API if CDN fails
      if (e?.code === 'NETWORK_ERROR' || e?.message?.includes('Network Error')) {
        console.log('🔄 CDN API failed, trying main API fallback...');
        console.log('[DistrictNews] Fallback triggered due to:', e?.message);
        try {
          const fallbackRes = await mainApi.get('/district');
          const fallbackData = fallbackRes?.data;
          if (fallbackData) {
            const fallbackTabs = fallbackData?.subcatlist || [];
            setDistricts(fallbackTabs);
            
            const fallbackSections = (fallbackData?.newlist || []).filter(
              sec => Array.isArray(sec?.data) && sec.data.length > 0
            );
            setAllSections(fallbackSections);
            
            if (initialDistrictId) {
              const found = fallbackTabs.find(t => String(t.id) === String(initialDistrictId));
              if (found) setActiveDistrict(found);
            }
            if (initialDistrictTitle) {
              const found = fallbackTabs.find(t => t.title === initialDistrictTitle);
              if (found) setActiveDistrict(found);
            }
            
            const chennaiDistrict = fallbackTabs.find(
              t => t.title && (t.title.includes('சென்னை') || t.title.toLowerCase().includes('chennai'))
            );
            setActiveDistrict(chennaiDistrict || fallbackTabs[0] || null);
            
            if (fallbackData?.taboola_ads?.mobile) {
              setTaboolaAds(fallbackData.taboola_ads.mobile);
            }
          }
        } catch (fallbackError) {
          console.error('Fallback API also failed:', fallbackError?.message);
        }
      } else {
        // General network error - try multiple fallback strategies
        console.log('🌐 Testing network connectivity...');
        const isOnline = await testNetworkConnectivity();
        
        if (isOnline) {
          console.log('✅ Network is online, trying multiple fallback strategies...');
          
          // Strategy 1: Try cached data if available
          const cachedData = getCachedData('district_fallback');
          if (cachedData) {
            console.log('📦 Using cached district data');
            setDistricts(cachedData.districts || []);
            setAllSections(cachedData.sections || []);
            setInitLoading(false);
            setRefreshing(false);
            return;
          }
          
          // Strategy 2: Try alternative endpoints
          const alternativeEndpoints = [
            { name: 'DMR API', url: '/district', api: mainApi },
            { name: 'U38 API', url: '/district', api: u38Api }
          ];
          
          for (const endpoint of alternativeEndpoints) {
            try {
              console.log(`🔄 Trying ${endpoint.name}...`);
              const altRes = await endpoint.api.get(endpoint.url);
              const altData = altRes?.data;
              
              if (altData) {
                console.log(`✅ ${endpoint.name} succeeded!`);
                const altTabs = altData?.subcatlist || [];
                setDistricts(altTabs);
                
                const altSections = (altData?.newlist || []).filter(
                  sec => Array.isArray(sec?.data) && sec.data.length > 0
                );
                setAllSections(altSections);
                
                if (initialDistrictId) {
                  const found = altTabs.find(t => String(t.id) === String(initialDistrictId));
                  if (found) setActiveDistrict(found);
                }
                if (initialDistrictTitle) {
                  const found = altTabs.find(t => t.title === initialDistrictTitle);
                  if (found) setActiveDistrict(found);
                }
                
                const chennaiDistrict = altTabs.find(
                  t => t.title && (t.title.includes('சென்னை') || t.title.toLowerCase().includes('chennai'))
                );
                setActiveDistrict(chennaiDistrict || altTabs[0] || null);
                
                if (altData?.taboola_ads?.mobile) {
                  setTaboolaAds(altData.taboola_ads.mobile);
                }
                
                // Cache successful response for future use
                setCachedData('district_fallback', {
                  districts: altTabs,
                  sections: altSections,
                  timestamp: Date.now()
                });
                
                setInitLoading(false);
                setRefreshing(false);
                return;
              }
            } catch (altError) {
              console.error(`${endpoint.name} failed:`, altError?.message);
            }
          }
        }
      }
    } finally {
      setInitLoading(false);
      setRefreshing(false);
    }
  }, [initialDistrictId, initialDistrictTitle]);

  useEffect(() => { fetchAll(); }, []);

  // ── Extract helpers ───────────────────────────────────────────────────────
  const extractList = (d) => (
    d?.districtlisting?.data ||
    d?.newlist?.data ||
    d?.newslist?.data ||
    d?.districtlist?.data ||
    d?.districtNews?.data ||
    d?.news?.data ||
    d?.data?.data ||
    d?.data ||
    d?.list ||
    []
  ).filter(Boolean);

  const extractLastPage = (d) => (
    d?.districtlisting?.last_page ||
    d?.newlist?.last_page ||
    d?.newslist?.last_page ||
    d?.districtlist?.last_page ||
    d?.districtNews?.last_page ||
    d?.last_page || 1
  );

  // ── Fetch district news ───────────────────────────────────────────────────
  const fetchDistrictNews = useCallback(async (district, subTab, pg, append = false) => {
    if (isAllDistrict(district)) return;
    try {
      let url;
      if (subTab && subTab.id) {
        // sub-tab selected
        const sep = (subTab.link || '').includes('?') ? '&' : '?';
        url = subTab.link ? `${subTab.link}${sep}page=${pg}` : `/districtdata?cat=${subTab.id}&page=${pg}`;
      } else {
        url = `/districtdata?cat=${district.id}&page=${pg}`;
      }

      let d;
      try {
        const res = await CDNApi.get(url);
        d = res?.data;
      } catch {
        try { const res = await mainApi.get(url); d = res?.data; }
        catch { const res = await u38Api.get(url); d = res?.data; }
      }

      // Extract sub-tabs if present (and first load of this district)
      if (!append && !subTab) {
        const subs = d?.subcatlist || d?.subcategories || [];
        console.log('[DistrictNews] Sub-districts from API:', JSON.stringify(subs));
        setSubDistricts(subs);
        // Keep activeSubTab null - district itself is "active" by default
        setActiveSubTab(null);
        
        // ← Key fix: handle both [] (array) and {data:[]} (object) cases
        const districtField = d?.district;
        console.log('🔍 RAW DISTRICT FIELD:', districtField);
        console.log('🔍 DISTRICT FIELD TYPE:', typeof districtField, Array.isArray(districtField));
        
        const pugarData = Array.isArray(districtField)
          ? []                           // district: [] → no pugarpetti
          : (districtField?.data || []); // district: {data:[...]} → check data
        
        console.log('🔍 PUGAR DATA AFTER PROCESSING:', pugarData);
        
        const pugarEntry = pugarData.find(item => item.title === 'புகார் பெட்டி');
        const finalLink = pugarEntry?.link || null;
        
        console.log('🔍 ABOUT TO SET STATE:', {
          districtId: activeDistrict?.id,
          pugarEntry: pugarEntry,
          finalLink: finalLink,
          willSetState: finalLink
        });
        
        setPugarPettiLink(finalLink);
        
        console.log('[DistrictNews] PugarPetti:', pugarEntry ? '✅ found' : '❌ not found');
        console.log('[DistrictNews] PugarPetti extraction:', {
          districtId: activeDistrict?.id,
          districtFieldType: Array.isArray(districtField) ? 'array' : 'object',
          pugarDataLength: pugarData.length,
          pugarEntry: pugarEntry?.title,
          link: finalLink,
          hasData: !!finalLink
        });
      }

      const list = extractList(d);
      const lp = extractLastPage(d);

      setLastPage(lp);
      setPage(pg);
      setAllDistrictNews(prev => append ? [...prev, ...list] : list);
      setDistrictNews(prev => append ? [...prev, ...list] : list);
      setSelectedDate(null);
    } catch (e) {
      console.error('fetchDistrictNews error:', e?.message);
    } finally {
      setTabLoading(false);
      setLoadMore(false);
      setRefreshing(false);
    }
  }, []);

  // ── Re-fetch on district change ───────────────────────────────────────────
  useEffect(() => {
    if (!activeDistrict || isAllDistrict(activeDistrict)) return;
    console.log('[DistrictNews] District changed, resetting PugarPetti link for:', activeDistrict?.id, activeDistrict?.title);
    
    // IMMEDIATE RESET - clear all states before API call
    setDistrictNews([]);
    setSubDistricts([]);
    setActiveSubTab(null);
    setPugarPettiLink(null); // reset immediately
    setPage(1);
    setLastPage(1);
    setTabLoading(true);
    setInitLoading(false);
    
    // Force a small delay to ensure state is reset before API call
    setTimeout(() => {
      fetchDistrictNews(activeDistrict, null, 1, false);
    }, 10);
  }, [activeDistrict?.id]);

  // ── Sub-tab press ─────────────────────────────────────────────────────────
  const handleSubTabPress = (sub) => {
    // Treat tapping the district's own tab as reset to null
    const isSelf = String(sub.id) === String(activeDistrict?.id);
    const targetSubTab = isSelf ? null : sub;

    const isSame = targetSubTab === null
      ? activeSubTab === null
      : String(sub.id) === String(activeSubTab?.id);
    if (isSame) return;

    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    setActiveSubTab(targetSubTab);
    setDistrictNews([]);
    setPage(1);
    setLastPage(1);
    setTabLoading(true);
    fetchDistrictNews(activeDistrict, targetSubTab, 1, false);
  };

  // ── Date filter ───────────────────────────────────────────────────────────
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowCalendar(false);
    if (!date) { setDistrictNews(allDistrictNews); return; }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dd = date.getDate().toString().padStart(2, '0');
    const mm = months[date.getMonth()];
    const yy = date.getFullYear();
    const formatted = `${dd}-${mm}-${yy}`;

    setDistrictNews(allDistrictNews.filter(item => {
      const itemDate = item.ago || item.date || '';
      return itemDate === formatted;
    }));
  };

  const handleDateHeaderPress = (dateStr) => {
    let parsed = new Date();
    if (dateStr) {
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
        const [y, m, d] = dateStr.split('T')[0].split('-');
        parsed = new Date(y, m - 1, d);
      } else if (dateStr.match(/^\d{2}-[A-Za-z]{3}-\d{4}/)) {
        const ENG = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' };
        const [d, m, y] = dateStr.split('-');
        parsed = new Date(y, (ENG[m] || '01') - 1, d);
      }
    }
    setSelectedDate(parsed);
    setShowCalendar(true);
  };

  const availableDates = React.useMemo(() => {
    const set = new Set();
    allDistrictNews.forEach(item => {
      const raw = item.ago || item.date || '';
      if (!raw) return;
      const ENG = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' };
      if (raw.match(/^\d{2}-[A-Za-z]{3}-\d{4}/)) {
        const [d, m, y] = raw.split('-');
        set.add(`${y}-${ENG[m] || '01'}-${d.padStart(2,'0')}`);
      } else if (raw.match(/^\d{4}-\d{2}-\d{2}/)) {
        set.add(raw.substring(0, 10));
      }
    });
    return Array.from(set).sort((a, b) => new Date(b) - new Date(a));
  }, [allDistrictNews]);

  // ── Refresh / Load More ───────────────────────────────────────────────────
  const handleRefresh = () => {
    setRefreshing(true);
    if (isAllDistrict(activeDistrict)) fetchAll();
    else fetchDistrictNews(activeDistrict, activeSubTab, 1, false);
  };

  const handleLoadMore = () => {
    if (isAllDistrict(activeDistrict) || loadMore || page >= lastPage) return;
    setLoadMore(true);
    fetchDistrictNews(activeDistrict, activeSubTab, page + 1, true);
  };

  const goToArticle = (item) => {
    navigation.navigate('NewsDetailsScreen', {
      newsId: item.newsid || item.id,
      newsItem: item,
    });
  };

  const goToSearch = () => navigation.navigate('SearchScreen');

  const goToNotifs = async () => {
    navigation?.navigate('NotificationScreen');
  };

  // ── Route Map for menu navigation (same as HomeScreen) ─────────────────────
  const LINK_ROUTE_MAP = [
    { match: ['dinamalartv', 'videodata'], screen: 'VideoScreen' },
    { match: ['podcast'], screen: 'PodcastPlayer' },
    { match: ['ipaper'], screen: 'IpaperScreen' },
    { match: ['books'], screen: 'BooksScreen' },
    { match: ['subscription'], screen: 'SubscriptionScreen' },
    { match: ['thirukural'], screen: 'ThirukkuralScreen' },
    { match: ['kadal'], screen: 'KadalThamaraiScreen' },
    { match: ['latestmain', 'timeline', 'dinamdinam'], screen: 'TimelineScreen' },
    { match: ['cinema'], screen: 'CategoryNewsScreen' },
    { match: ['temple', 'kovilgal'], screen: 'CategoryNewsScreen' },
  ];

  const resolveScreenFromLink = (link = '') => {
    if (!link) return null;
    const lower = link.toLowerCase();
    for (const { match, screen } of LINK_ROUTE_MAP) {
      if (match.some((kw) => lower.includes(kw))) {
        if (screen === 'CategoryNewsScreen') {
          const m = lower.match(/cat=(\d+)/);
          return { screen, params: m ? { catId: m[1] } : {} };
        }
        return { screen, params: null };
      }
    }
    const m = lower.match(/cat=(\d+)/);
    if (m) return { screen: 'HomeScreen', params: { catId: m[1] } };
    if (link.startsWith('http') || link.startsWith('www.'))
      return { screen: '__external__', params: null };
    return null;
  };

  const handleMenuPress = (menuItem) => {
    const link = menuItem?.Link || menuItem?.link || '';
    const title = menuItem?.Title || menuItem?.title || '';
    const resolved = resolveScreenFromLink(link);
    
    if (!resolved) { 
      navigation?.navigate('TimelineScreen', { catName: title }); 
      return; 
    }
    if (resolved.screen === '__external__') return;
    
    navigation?.navigate(
      resolved.screen,
      resolved.params ? { catName: title, ...resolved.params } : { catName: title }
    );
  };

  const handleSelectDistrict = (district) => {
    setIsLocationDrawerVisible(false);
    
    console.log('[DistrictNews] handleSelectDistrict called with:', district);
    console.log('[DistrictNews] Current activeDistrict:', activeDistrict);
    console.log('[DistrictNews] Current activeSubTab:', activeSubTab);
    
    // Try to match from loaded districts list
    const matched = districts.find(
      d => d.title === district.title || (district.id && String(d.id) === String(district.id))
    );
    
    console.log('[DistrictNews] Matched district:', matched);
    
    // KEY FIX: If districts not loaded yet, use the passed district directly
    const districtToSet = matched || district;
    if (!districtToSet?.id) return;
    if (String(districtToSet.id) === String(activeDistrict?.id)) return;
    
    console.log('[DistrictNews] Setting activeDistrict to:', districtToSet);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    setActiveDistrict(districtToSet);
  };

  const isAllTab = isAllDistrict(activeDistrict);
  // Fix: Show active sub-tab name when sub-tab is selected, otherwise show district name
  const headerTitle = activeSubTab?.title || activeDistrict?.title || initialDistrictTitle || 'உள்ளூர்';
  const isLoading = initLoading || tabLoading;

  // ── Build flat list ───────────────────────────────────────────────────────
  const buildFlatData = () => {
    if (isAllTab) {
      const flat = [];
      allSections.forEach((section) => {
        flat.push({ type: 'section', title: section.title, id: section.id });
        (section.data || []).forEach(item => flat.push({ type: 'news', item }));
      });
      return flat;
    }
    return groupByDate(districtNews);
  };
  const flatData = buildFlatData();

  const renderItem = ({ item: row }) => {
    if (row.type === 'section') {
      return (
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { fontSize: sf(16) }]}>{row.title}</Text>
          <View style={styles.sectionUnderline} />
        </View>
      );
    }
    if (row.type === 'dateHeader') {
      if (row.isClickable) {
        return (
          <TouchableOpacity
            style={styles.dateHeaderWrap}
            onPress={() => handleDateHeaderPress(row.date)}
            activeOpacity={0.7}
          >
            <View style={styles.dateHeaderInner}>
              <Ionicons name="calendar-outline" size={s(14)} color="#6c757d" style={{ marginRight: s(4) }} />
              <Text style={styles.dateHeaderText}>{row.date}</Text>
            </View>
          </TouchableOpacity>
        );
      }
      return (
        <View style={[styles.dateHeaderWrap, { justifyContent: 'flex-start' }]}>
          <View style={[styles.dateHeaderInner, { borderTopRightRadius: s(8), borderBottomRightRadius: s(8) }]}>
            <Ionicons name="calendar-outline" size={s(14)} color="#6c757d" style={{ marginRight: s(4) }} />
            <Text style={styles.dateHeaderText}>{row.date}</Text>
          </View>
        </View>
      );
    }
    return <NewsCard item={row.item || row} onPress={() => goToArticle(row.item || row)} />;
  };

  const ListFooter = () => (
    loadMore ? <ActivityIndicator style={{ paddingVertical: vs(20) }} color={COLORS.primary} /> : null
  );

  return (
<SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* ── Top Menu Strip ── */}
      <TopMenuStrip
        onMenuPress={handleMenuPress}
        onNotification={goToNotifs}
        notifCount={3}
        navigation={navigation}
      />

      <AppHeaderComponent
        onSearch={goToSearch}
        onMenu={() => setIsDrawerVisible(true)}
        onLocation={() => setIsLocationDrawerVisible(true)}
        selectedDistrict="உள்ளூர்"
      />

      {/* ── Page Title Row: District name + புகார் பெட்டி ── */}
      <View style={styles.pageTitleRow}>
        <View style={styles.pageTitleLeft}>
          <Text style={[styles.pageTitle, { fontSize: sf(16) }]}>{headerTitle}</Text>
          {/* <View style={styles.pageTitleUnderline} /> */}
        </View>

        {/* புகார் பெட்டி — only show if API returned pugarpetti data */}
        {(() => {
          const condition = pugarPettiLink && !isAllTab;
          console.log('🚨 ARIYALUR CRITICAL DEBUG:', {
            districtTitle: activeDistrict?.title,
            districtId: activeDistrict?.id,
            pugarPettiLink: pugarPettiLink,
            pugarPettiLinkType: typeof pugarPettiLink,
            pugarPettiLinkValue: JSON.stringify(pugarPettiLink),
            isAllTab: isAllTab,
            condition: condition,
            isAriyalur: activeDistrict?.title === 'அரியலூர்',
            isAriyalurById: activeDistrict?.id === '297'
          });
          
          // Force return false for Ariyalur regardless of state
          if (activeDistrict?.title === 'அரியலூர்' || activeDistrict?.id === '297') {
            console.log('🚨 FORCE HIDING FOR ARIYALUR');
            return false;
          }
          
          return condition;
        })() && (
          <TouchableOpacity
            style={styles.pugarBtn}
            onPress={() => {
              console.log('[DistrictNews] DEBUG: Navigating to PugarPetti with districtId:', activeDistrict?.id, 'district:', activeDistrict);
              console.log('[DistrictNews] District ID details:', {
                districtId: activeDistrict?.id,
                districtIdType: typeof activeDistrict?.id,
                districtTitle: activeDistrict?.title,
                fullDistrict: activeDistrict
              });
              navigation.navigate('PugarPettiScreen', {
                initialDistrictId: String(activeDistrict?.id), // Ensure it's a string
                districtTitle: activeDistrict?.title,
                pugarPettiLink: pugarPettiLink,
              });
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.pugarBtnText, { fontSize: sf(13) }]}>புகார் பெட்டி</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Sub-district tabs ─────────────────────────────────────────────────
          Shows: "All" + sub-districts returned by API for active district.
          Only shown when a specific district is active (not in main All tab).
      ── */}
      {!isAllTab && subDistricts.length > 0 && (
        <View style={styles.tabsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {/* Dynamic sub-tabs from API */}
            {subDistricts.map((tab, index) => {
              // Key fix: highlight district tab when activeSubTab is null, sub-tab when explicitly selected
              const isActive = activeSubTab
                ? String(tab.id) === String(activeSubTab.id)      // sub-tab explicitly selected
                : String(tab.id) === String(activeDistrict?.id);  // default: highlight the district tab
              
              return (
                <TouchableOpacity
                  key={`tab-${tab.id || index}`}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => handleSubTabPress(tab)}
                  activeOpacity={0.8}
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
              : row.type === 'dateHeader'
                ? `date-${row.dateKey}-${i}`
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
          ListFooterComponent={<ListFooter />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}

      {/* ── Taboola Ads ── */}
      {!isAllTab && taboolaAds?.midmain && (
        <TaboolaAdSection
          taboolaAds={taboolaAds}
          position="midmain"
          pageUrl="https://www.dinamalar.com/district"
          pageType="article"
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
        onSelect={(d) => { setPickerVisible(false); handleSelectDistrict(d); }}
        onClose={() => setPickerVisible(false)}
      />

      {/* ── Calendar Modal ── */}
      <CustomCalendarModal
        visible={showCalendar}
        selectedDate={selectedDate}
        availableDates={availableDates}
        onDateSelect={handleDateSelect}
        onClose={() => setShowCalendar(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
   container: {
     flex: 1,
     backgroundColor: PALETTE.grey100,
     paddingTop: Platform.OS === 'android' ? vs(0) : 20,
     // ADD THIS:
     position: 'relative',
   },

  // ── Page title row ──────────────────────────────────────────────────────
  pageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(12),
    paddingTop: vs(14),
    paddingBottom: vs(10),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pageTitleLeft: {
    alignItems: 'flex-start',
  },
   pageTitle: { fontSize: 18, fontFamily: FONTS.anek.bold, color: '#111', marginBottom: vs(4) },

  pageTitleUnderline: {
    height: vs(3),
    width: s(40),
    backgroundColor: COLORS.primary,
    marginTop: vs(3),
  },

  // ── புகார் பெட்டி button ────────────────────────────────────────────────
  pugarBtn: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: s(4),
    paddingHorizontal: s(12),
    paddingVertical: vs(5),
  },
  pugarBtnText: {
    fontFamily: FONTS.muktaMalar.medium,
    color: COLORS.primary,
    fontWeight: '600',
  },

  // ── Sub-tabs ────────────────────────────────────────────────────────────
  tabsWrap: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: vs(1) },
    shadowOpacity: 0.06,
    shadowRadius: s(2),
  },
  tabsContent: {
    paddingHorizontal: s(12),
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: s(14),
    paddingVertical: vs(12),
    marginHorizontal: s(2),
    borderBottomWidth: vs(3),
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontFamily: FONTS.muktaMalar.medium,
    color: '#333',
  },
  tabTextActive: {
    fontFamily: FONTS.muktaMalar.bold,
    color: COLORS.primary,
  },
  tabsBottomLine: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e0e0e0',
  },

  // ── List ────────────────────────────────────────────────────────────────
  list: { flex: 1 },
  listContent: { paddingTop: vs(4), paddingBottom: vs(30) },

  // ── Section header (All tab) ─────────────────────────────────────────────
  sectionWrap: {
    paddingHorizontal: s(12),
    paddingTop: vs(16),
    paddingBottom: vs(4),
    backgroundColor: '#f2f2f2',
  },
  sectionTitle: {
    fontFamily: FONTS.anek.bold,
    color: '#1a1a1a',
    marginBottom: vs(4),
  },
  sectionUnderline: {
    height: vs(4),
    width: s(36),
    backgroundColor: COLORS.primary,
  },

  // ── Date header ──────────────────────────────────────────────────────────
  dateHeaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginVertical: vs(4),
    paddingHorizontal: s(12),
  },
  dateHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#6c757d',
    paddingVertical: vs(3),
    paddingHorizontal: s(8),
    borderRadius: s(4),
  },
  dateHeaderText: {
    fontSize: ms(13),
    fontFamily: FONTS.muktaMalar.medium,
    color: '#6c757d',
    fontWeight: '600',
  },

  // ── Scroll top ───────────────────────────────────────────────────────────
  scrollTopBtn: {
    position: 'absolute',
    bottom: vs(20),
    right: s(16),
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
