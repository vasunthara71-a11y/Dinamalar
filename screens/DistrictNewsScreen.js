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
import { mvs } from 'react-native-size-matters';
import TEXT_STYLES from '../utils/textStyles';
import { Ionicons } from '@expo/vector-icons';
import CustomCalendarModal from '../components/Customcalendarmodal';
import { TaboolaAdSection } from '../components/TaboolaComponent';

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

// ─── Group news by date ───────────────────────────────────────────────────────
function groupByDate(items) {
  const flat = [];
  let currentDate = null;
  let isFirstDate = true; // Track if this is the first (latest) date

  items.forEach(item => {
    const rawDate = item.ago || item.date || item.time_date || '';
    // Normalize date to a comparable key
    const dateKey = rawDate.split(' ')[0] || rawDate; // Take just the date part

    if (dateKey && dateKey !== currentDate) {
      currentDate = dateKey;
      flat.push({ type: 'dateHeader', date: rawDate, dateKey, isClickable: isFirstDate });
      isFirstDate = false; // Only the first date is clickable
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

// ─── Section Title ─────────────────────────────────────────────────────────────
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
  wrap: { marginBottom: vs(8), marginTop: vs(2) },
  text: { fontSize: scaledSizes.font.lg, fontFamily: FONTS.muktaMalar.bold, color: '#1a1a1a', marginBottom: vs(4) },
  underline: { height: vs(5), width: s(40), backgroundColor: COLORS.primary },
});

// ─── News Card ────────────────────────────────────────────────────────
// News Card (sub-tab full-width — image 3 style)
// ─────────────────────────────────────────────────────────────────────
function NewsCard({ item, onPress }) {
  const { sf } = useFontSize();
  const [imageError, setImageError] = useState(false);

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
          {imageError ? (
            <View style={[NewsCardStyles.image, NewsCardStyles.imageErrorContainer]}>
              <Image
                source={{ uri: 'https://stat.dinamalar.com/new/2025/images/dinamalar-pavala-vizha-logo-day.png' }}
                style={[NewsCardStyles.placeholderImage]}
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

        {/* Content */}
        <View style={NewsCardStyles.contentContainer}>
          {!!title && (
            <Text style={[NewsCardStyles.title, { fontSize: sf(14), lineHeight: sf(22) }]} numberOfLines={3}>{title}</Text>
          )}

          {/* Category pill — gray, matches screenshot */}
          {/* {!!category && (
            <View style={NewsCardStyles.catPill}>
              <Text style={[NewsCardStyles.catText, { fontSize: sf(12) }]}>{category}</Text>
            </View>
          )} */}

          {/* Meta row */}
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

      {/* Divider */}
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
    paddingHorizontal: s(12),
    paddingVertical: vs(14),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: TEXT_STYLES.titles.sectionTitles,
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  rowActive: { backgroundColor: '#cae9ff' },
  rowText: {
    fontFamily: FONTS.muktaMalar.medium,
    color: COLORS.text,
    lineHeight: ms(22),
  },
  rowTextActive: { fontFamily: FONTS.muktaMalar.bold, color: COLORS.primary },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DistrictNewsScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const initialDistrictId = route?.params?.districtId || null;
  const initialDistrictTitle = route?.params?.districtTitle || null;
  const fromPugarPetti = route?.params?.fromPugarPetti || false;
  const showAllTab = route?.params?.showAllTab || false;

  console.log('[DistrictNews] Route params debug:', {
    initialDistrictId,
    initialDistrictTitle,
    fromPugarPetti,
    showAllTab
  });

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
  const [allDistrictNews, setAllDistrictNews] = useState([]); // keep original unfiltered
  const [taboolaAds, setTaboolaAds] = useState(null); // Taboola ads state

  const flatListRef = useRef(null);
  const { sf } = useFontSize();

  const handleScroll = useCallback((e) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    setShowScrollTop(offsetY > 300);
  }, []);

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  // ── Fetch /district (All tab) ─────────────────────────────────────
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

      // 1. Try match by numeric ID first
      if (initialDistrictId) {
        const found = tabs.find(t => String(t.id) === String(initialDistrictId));
        if (found) {
          setActiveDistrict(found);
          return;
        }
      }

      // 2. Try match by title (from LocationDrawer which gives string IDs)
      if (initialDistrictTitle) {
        const found = tabs.find(t => t.title === initialDistrictTitle);
        if (found) {
          setActiveDistrict(found);
          return;
        }
      }

      // 3. Default to Chennai
      const chennaiDistrict = tabs.find(
        t => t.title && (t.title.includes('சென்னை') || t.title.toLowerCase().includes('chennai'))
      );
      setActiveDistrict(chennaiDistrict || tabs[0] || null);

      // Set Taboola ads from API response
      if (d?.taboola_ads?.mobile) {
        setTaboolaAds(d.taboola_ads.mobile);
      }

    } catch (e) {
      console.error('DistrictNewsScreen fetchAll error:', e?.message);
      
      // Fallback: Try alternative API if CDN fails
      if (e?.code === 'NETWORK_ERROR' || e?.message?.includes('Network Error')) {
        console.log('🔄 CDN API failed, trying main API fallback...');
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
          
          // Strategy 3: Show user-friendly error with retry option
          console.log('❌ All API endpoints failed');
          setInitLoading(false);
          setRefreshing(false);
          
          // Set empty state to prevent crashes
          setDistricts([]);
          setAllSections([]);
          setActiveDistrict(null);
          setDistrictNews([]);
          
          // Show error message to user with retry option
          setTimeout(() => {
            // In a real app, you'd show a proper error message here
            console.log('📱 All district news APIs are currently unavailable');
            console.log('📱 Please check your internet connection');
            console.log('📱 Try again in a few minutes');
          }, 1000);
          
          return;
        } else {
          console.error('❌ No network connectivity');
          setInitLoading(false);
          setRefreshing(false);
          return;
        }
      }
    } finally {
      setInitLoading(false);
      setRefreshing(false);
    }
  }, [initialDistrictId, initialDistrictTitle]); // ← add initialDistrictTitle to deps

  useEffect(() => { fetchAll(); }, []);

  // ── Extract news list from ANY response shape ─────────────────────────────
  const extractList = (d) => (
    d?.districtlisting?.data ||   // Chennai, Namakkal, most districts
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
    d?.news?.last_page ||
    d?.data?.last_page ||
    d?.last_page ||
    1
  );

  // ── Fetch specific district news ──────────────────────────────────────────
  const fetchDistrictNews = useCallback(async (district, pg, append = false) => {
    if (isAllDistrict(district)) return;
    try {
      const sep = district.link.includes('?') ? '&' : '?';
      const url = `${district.link}${sep}page=${pg}`;
      const res = await CDNApi.get(url);
      const d = res?.data;
      const list = extractList(d);
      const lp = extractLastPage(d);

      setLastPage(lp);
      setPage(pg);
      // ✅ Store original unfiltered list
      setAllDistrictNews(prev => append ? [...prev, ...list] : list);
      setDistrictNews(prev => append ? [...prev, ...list] : list);
      // ✅ Clear date filter when new district loads
      setSelectedDate(null);
    } catch (e) {
      console.error('DistrictNews fetch error:', e?.message);
    } finally {
      setTabLoading(false);
      setLoadMore(false);
      setRefreshing(false);
    }
  }, []);


  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setShowCalendar(false);

    if (!date) {
      // Clear filter — restore full list
      setDistrictNews(allDistrictNews);
      return;
    }

    // Format selected date to match item.ago format: "05-Apr-2026"
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = date.getDate().toString().padStart(2, '0');
    const m = months[date.getMonth()];
    const y = date.getFullYear();
    const formattedDate = `${d}-${m}-${y}`;

    console.log('[DistrictNews] Filtering by date:', formattedDate);

    const filtered = allDistrictNews.filter(item => {
      const itemDate = item.ago || item.date || '';
      return itemDate === formattedDate;
    });

    console.log('[DistrictNews] Filtered count:', filtered.length);
    setDistrictNews(filtered);
  };

  const handleDateHeaderPress = (dateStr) => {
    // Parse the date string to set initial date for picker
    let parsedDate = new Date();
    if (dateStr) {
      // Handle formats: "2025-08-06", "06-Aug-2025", "06/08/2025"
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
        const [year, month, day] = dateStr.split('T')[0].split('-');
        parsedDate = new Date(year, month - 1, day);
      } else if (dateStr.match(/^\d{2}-[A-Za-z]{3}-\d{4}/)) {
        const parts = dateStr.split('-');
        const day = parts[0];
        const engMonths = {
          Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
          Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
        };
        const month = engMonths[parts[1]] || '01';
        const year = parts[2];
        parsedDate = new Date(year, month - 1, day);
      } else if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}/)) {
        const [day, month, year] = dateStr.split('/');
        parsedDate = new Date(year, month - 1, day);
      }
    }
    setSelectedDate(parsedDate);
    setShowCalendar(true);
  };

  // Extract available dates from current news list
  const availableDates = React.useMemo(() => {
    const dateSet = new Set();
    allDistrictNews.forEach(item => {
      const rawDate = item.ago || item.date || '';
      if (!rawDate) return;
      let isoDate = null;
      if (rawDate.match(/^\d{2}-[A-Za-z]{3}-\d{4}/)) {
        const ENG = {
          Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
          Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
        };
        const [d, m, y] = rawDate.split('-');
        isoDate = `${y}-${ENG[m] || '01'}-${d.padStart(2, '0')}`;
      } else if (rawDate.match(/^\d{2}-\d{2}-\d{4}/)) {
        const [d, m, y] = rawDate.split('-');
        isoDate = `${y}-${m}-${d}`;
      } else if (rawDate.match(/^\d{4}-\d{2}-\d{2}/)) {
        isoDate = rawDate.substring(0, 10);
      }
      if (isoDate) dateSet.add(isoDate);
    });
    return Array.from(dateSet).sort((a, b) => new Date(b) - new Date(a));
  }, [allDistrictNews]);


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
      newsId: item.newsid || item.id,
      newsItem: item,
    });
  };

  const goToSearch = () => navigation.navigate('SearchScreen');

  const handleSelectDistrict = (district) => {
    setIsLocationDrawerVisible(false);

    // Match by title against the districts array loaded from /district API
    // (which has proper numeric id + link fields needed for fetching)
    const matched = districts.find(
      d => d.title === district.title ||
        (district.id && String(d.id) === String(district.id))
    );

    if (!matched) {
      console.warn('[DistrictNews] No match found for:', district.title);
      return;
    }

    // Skip if same district already active
    if (String(matched.id) === String(activeDistrict?.id)) return;

    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    setActiveDistrict(matched);
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
    // Group district news by date for clickable date filtering
    return groupByDate(districtNews);
  };

  const flatData = buildFlatData();
  const isLoading = initLoading || tabLoading;
  const headerTitle = (!isAllTab && activeDistrict?.title) ? activeDistrict.title : 'உள்ளூர்';

  const renderItem = ({ item: row }) => {
    if (row.type === 'section') {
      return (
        <View style={styles.sectionWrap}>
          <SectionTitle title={row.title} />
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
              <Ionicons name="calendar-outline" size={s(15)} color="#555" style={styles.dateHeaderIcon} />
              <Text style={styles.dateHeaderText}>{row.date}</Text>
            </View>
          </TouchableOpacity>
        );
      } else {
        // Non-clickable date header - left aligned without TouchableOpacity
        return (
          <View style={styles.dateHeaderWrapLeft}>
            <View style={[styles.dateHeaderInner,{borderTopRightRadius: s(8), borderBottomRightRadius: s(8)}]}>
              <Ionicons name="calendar-outline" size={s(15)} color="#555" style={styles.dateHeaderIcon} />
              <Text style={styles.dateHeaderText}>{row.date}</Text>
            </View>
          </View>
        );
      }
    }
    if (row.type === 'item') {
      return <NewsCard item={row.item} onPress={() => goToArticle(row.item)} />;
    }
    return <NewsCard item={row.item} onPress={() => goToArticle(row.item)} />;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

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
          selectedDistrict={"உள்ளூர்"}
        />
      </UniversalHeaderComponent>

      <View style={styles.pageTitleRow}>
        <View style={styles.pageTitleLeft}>
          <Text style={[styles.pageTitle, { fontSize: sf(16) }]}>{headerTitle}</Text>
          <View style={styles.pageTitleUnderline} />
        </View>

        {/* All tab flow: show district picker */}
        {showAllTab && (
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setPickerVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={[styles.pickerBtnText, { fontSize: sf(10) }]}>உள்ளூர் செய்திகள்</Text>
            <Ionicons name="chevron-down" size={s(14)} color={COLORS.text} />
          </TouchableOpacity>
        )}

        {/* Specific district flow: show புகார் பெட்டி back button */}
        {fromPugarPetti && !showAllTab && (
          <TouchableOpacity
            style={styles.seithigalBox}
            onPress={() => navigation.navigate('PugarPettiScreen', {
              initialDistrictId: activeDistrict?.id,
            })}
            activeOpacity={0.8}
          >
            <Text style={styles.seithigalText}>புகார் பெட்டி</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── District Tabs (horizontal view like PugarPetti) - only show when from PugarPetti and not All tab ── */}
      {fromPugarPetti && !showAllTab && districts.length > 0 && (
        <View style={styles.tabsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {districts.map((district, index) => {
              const isActive = activeDistrict?.id
                ? String(district.id) === String(activeDistrict.id)
                : activeDistrict === null && index === 0;
              const tabKey = String(district.id || index);
              return (
                <TouchableOpacity
                  key={`tab-${tabKey}-${index}`}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => handleDistrictSelect(district)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive, { fontSize: ms(15) }]}>
                    {district.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.tabsBottomLine} />
        </View>
      )}

      {isLoading ? (
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={i => `sk-${i}`}
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
        />
      )}

      {/* ── Taboola Ads ── */}
      {!isAllTab && taboolaAds && (
        <>
          {/* Mid-content Taboola ad */}
          {taboolaAds.midmain && (
            <TaboolaAdSection
              taboolaAds={taboolaAds}
              position="midmain"
              pageUrl="https://www.dinamalar.com/district"
              pageType="article"
            />
          )}
          
          {/* Bottom Taboola ad */}
          {taboolaAds.bottom && (
            <TaboolaAdSection
              taboolaAds={taboolaAds}
              position="bottom"
              pageUrl="https://www.dinamalar.com/district"
              pageType="article"
            />
          )}
        </>
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

      {/* ── Calendar Modal ── */}
      <CustomCalendarModal
        visible={showCalendar}
        selectedDate={selectedDate}
        availableDates={availableDates}
        onDateSelect={handleDateSelect}
        onClose={() => setShowCalendar(false)}
      />

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
  pageTitle: {
    fontSize: sf(16),
    fontFamily: FONTS.muktaMalar.bold,
    color: '#1a1a1a',
    // marginBottom: vs(3),
  },
  pageTitleUnderline: {
    height: vs(3),
    width: '50%',
    backgroundColor: COLORS.primary,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    // borderWidth: 1,
    borderColor: COLORS.text,
    // borderRadius: s(4),
    paddingHorizontal: s(5),
    paddingVertical: vs(5),
    backgroundColor: '#e9e9e9',
  },
  pickerBtnText: {
    fontSize: ms(12),
    fontFamily: FONTS.muktaMalar.regular,
    color: COLORS.text,
    fontWeight: '700'
  },
  list: { flex: 1 },
  listContent: { paddingTop: vs(6), paddingBottom: vs(30) },
  sectionWrap: {
    paddingHorizontal: s(12),
    paddingTop: vs(16),
    paddingBottom: vs(4),
    backgroundColor: '#f2f2f2',
  },
  emptyWrap: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: vs(80), gap: vs(12),
  },
  emptyText: { fontSize: ms(15), fontFamily: FONTS.muktaMalar.semibold, color: '#aaa' },
  placeholderImage: {
    width: s(120),
    height: s(120),
    opacity: 0.3,
  },
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
  seithigalContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  seithigalBox: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: s(4),
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
    alignSelf: 'flex-start',
  },
  seithigalText: {
    fontSize: ms(13),
    fontFamily: FONTS.muktaMalar.medium,
    color: COLORS.primary,
    fontWeight: '600',
  },
  tabsWrap: {
    backgroundColor: COLORS.white,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: vs(1) },
    shadowOpacity: 0.08,
    shadowRadius: s(2),
  },
  tabsContent: { paddingHorizontal: s(14), alignItems: 'center' },
  tab: { paddingHorizontal: s(12), paddingVertical: vs(12), marginHorizontal: s(2), borderBottomWidth: vs(3), borderBottomColor: 'transparent' },
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
  dateHeaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: vs(2),
    gap: s(6),
    paddingHorizontal: ms(12),
    justifyContent: "flex-end"
  },
  dateHeaderWrapLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: vs(2),
    gap: s(6),
    paddingHorizontal: ms(12),
    justifyContent: "flex-start"
  },
  dateHeaderInner: {
    borderWidth: 1,
    flexDirection: "row",
    paddingVertical: ms(3),
    paddingHorizontal: ms(8),
    alignItems: "center",
    borderColor: '#6c757d',
    // borderRadius: s(8),
  },
  dateHeaderIcon: {
    marginRight: s(3),
    color: '#6c757d',
  },
  dateHeaderText: {
    fontSize: ms(14),
    fontFamily: FONTS.muktaMalar.medium,
    color: '#6c757d',
    fontWeight: '600',
  },
});