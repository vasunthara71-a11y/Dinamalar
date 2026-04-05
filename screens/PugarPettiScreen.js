import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { mainApi, CDNApi } from '../config/api';
import { COLORS, FONTS, NewsCard as NewsCardStyles } from '../utils/constants';
import { s, vs, ms } from '../utils/scaling';
import { useFontSize } from '../context/FontSizeContext';
import UniversalHeaderComponent from '../components/UniversalHeaderComponent';
import AppHeaderComponent from '../components/AppHeaderComponent';
import NewsCard from '../components/NewsCard';
import CustomCalendarModal from '../components/Customcalendarmodal';
import { TaboolaAdSection } from '../components/TaboolaComponent';
  
// ─── Skeleton Card ────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <View style={sk.card}>
      <View style={sk.body}>
        <View style={sk.line} />
        <View style={[sk.line, { width: '60%' }]} />
        <View style={[sk.line, { width: '35%', marginTop: vs(4) }]} />
      </View>
    </View>
  );
}
const sk = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: s(12),
    marginBottom: vs(8),
    borderRadius: s(6),
    overflow: 'hidden',
  },
  body: { flex: 1, padding: s(10), gap: vs(6), justifyContent: 'center' },
  line: { height: vs(11), backgroundColor: '#e8e8e8', borderRadius: s(4), width: '90%' },
});

// ─── Section Date Header ──────────────────────────────────────────────
function DateGroupHeader({ date }) {
  return (
    <View style={dg.wrap}>
      <Ionicons name="calendar-outline" size={s(13)} color="#888" />
      <Text style={dg.text}>{date}</Text>
    </View>
  );
}
const dg = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(6),
    paddingHorizontal: s(12),
    backgroundColor: '#f8f9fa',
    borderRadius: s(4),
    marginTop: vs(8),
    marginBottom: vs(4),
  },
  text: {
    fontSize: ms(13),
    fontFamily: FONTS.muktaMalar.medium,
    color: '#666',
    marginLeft: s(8),
  },
});

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ sf }) {
  return (
    <View style={em.wrap}>
      <Image 
        source={{ uri: 'https://stat.dinamalar.com/new/2025/images/dinamalar-pavala-vizha-logo-day.png' }}
        style={em.placeholderImage}
        resizeMode="contain"
      />
      <Text style={[em.text, { fontSize: sf(15) }]}>செய்திகள் இல்லை</Text>
    </View>
  );
}
const em = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: vs(80), gap: vs(12) },
  text: { fontFamily: FONTS.muktaMalar.medium, color: '#aaa' },
  placeholderImage: {
    width: s(120),
    height: s(120),
    opacity: 0.3,
  },
});

// ─── Extract available dates from news data ─────────────────────────────────────
function extractAvailableDates(items) {
  const dateSet = new Set();
  
  items.forEach(item => {
    // Use 'ago' field (DD-Mon-YYYY) or 'date' field (DD-MM-YYYY) — avoid Tamil standarddate
    const rawDate = item.ago || item.date || '';
    if (!rawDate) return;

    let isoDate = null;
    // "09-Oct-2025" format
    if (rawDate.match(/^\d{2}-[A-Za-z]{3}-\d{4}/)) {
      const ENG = {
        Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',
        Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12',
      };
      const [d, m, y] = rawDate.split('-');
      isoDate = `${y}-${ENG[m] || '01'}-${d.padStart(2,'0')}`;
    }
    // "09-10-2025" format (DD-MM-YYYY)
    else if (rawDate.match(/^\d{2}-\d{2}-\d{4}/)) {
      const [d, m, y] = rawDate.split('-');
      isoDate = `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
    }
    // "2025-10-09" already ISO
    else if (rawDate.match(/^\d{4}-\d{2}-\d{2}/)) {
      isoDate = rawDate.substring(0, 10);
    }

    if (isoDate) dateSet.add(isoDate);
  });

  const sortedDates = Array.from(dateSet).sort((a, b) => new Date(b) - new Date(a));
  const firstDate = sortedDates.length > 0 ? [sortedDates[0]] : [];
  
  console.log('[PugarPetti] All available dates:', sortedDates);
  console.log('[PugarPetti] First clickable date only:', firstDate);
  return firstDate; // Return only the first/latest date
}

// ─── Group news by date ───────────────────────────────────────────────────────
function groupByDate(items) {
  const flat = [];
  let currentDate = null;

  items.forEach(item => {
    const rawDate = item.standarddate || item.date || item.time_date || '';
    // Normalize date to a comparable key
    const dateKey = rawDate.split(' ')[0] || rawDate; // Take just the date part

    if (dateKey && dateKey !== currentDate) {
      currentDate = dateKey;
      flat.push({ type: 'dateHeader', date: rawDate, dateKey });
    }
    flat.push({ type: 'item', item });
  });
  return flat;
}

// ─── Tamil Month Mapping ───────────────────────────────────────────────────────
const TAMIL_MONTHS = {
  '01': 'ஜனவரி', '02': 'பிப்ரவரி', '03': 'மார்ச்', '04': 'சித்திர்',
  '05': 'வைகாசி', '06': 'ஆனி', '07': 'ஆடி', '08': 'ஆகஸ்ட்',
  '09': 'பிரதிபை', '10': 'திசம்பர்', '11': 'ார்த்திகர்', '12': 'டிசம்பர்'
};

// ─── Format Tamil Date ────────────────────────────────────────────────────────
function formatTamilDate(dateStr) {
  if (!dateStr) return '';
  // Handle formats: "2025-08-06", "06-Aug-2025", "06/08/2025"
  let day, month, year;

  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    [year, month, day] = dateStr.split('T')[0].split('-');
  } else if (dateStr.match(/^\d{2}-[A-Za-z]{3}-\d{4}/)) {
    const parts = dateStr.split('-');
    day = parts[0];
    const engMonths = {
      Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
      Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
    };
    month = engMonths[parts[1]] || '01';
    year = parts[2];
  } else if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}/)) {
    [day, month, year] = dateStr.split('/');
  } else {
    return dateStr; // Return as-is if unrecognized
  }

  const tamilMonth = TAMIL_MONTHS[month] || month;
  return `${tamilMonth} ${day}, ${year}`;
}

// ─── Pagination Component ─────────────────────────────────────────────────────
function Pagination({ links, onPress, loading }) {
  if (!links || links.length === 0) return null;

  return (
    <View style={pg.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={pg.scrollContent}
      >
        {links.map((link, index) => {
          if (!link.label) return null;
          
          const isActive = link.active;
          const isDisabled = !link.url;
          const isNavigation = link.label.includes('pagination');
          
          // Skip navigation buttons for now, show only page numbers
          if (isNavigation) return null;
          
          return (
            <TouchableOpacity
              key={`page-${index}`}
              style={[
                pg.pageButton,
                isActive && pg.pageButtonActive,
                isDisabled && pg.pageButtonDisabled
              ]}
              onPress={() => !isDisabled && onPress(link)}
              disabled={isDisabled || loading}
              activeOpacity={0.7}
            >
              <Text style={[
                pg.pageButtonText,
                isActive && pg.pageButtonTextActive,
                isDisabled && pg.pageButtonTextDisabled
              ]}>
                {link.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const pg = StyleSheet.create({
  container: {
    paddingVertical: vs(12),
    paddingHorizontal: s(16),
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  scrollContent: {
    alignItems: 'center',
  },
  pageButton: {
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
    marginHorizontal: s(4),
    borderRadius: s(6),
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    minWidth: s(36),
    alignItems: 'center',
  },
  pageButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pageButtonDisabled: {
    backgroundColor: '#f9f9f9',
    borderColor: '#eee',
  },
  pageButtonText: {
    fontSize: ms(14),
    fontFamily: FONTS.muktaMalar.medium,
    color: '#333',
  },
  pageButtonTextActive: {
    color: '#fff',
    fontFamily: FONTS.muktaMalar.bold,
  },
  pageButtonTextDisabled: {
    color: '#ccc',
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PugarPettiScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { sf } = useFontSize();

  const {
    screenTitle = 'புகார் பெட்டி',
    initialDistrictId,
  } = route.params || {};

  // ── State ──
  const [subTabs, setSubTabs] = useState([]);
  const [activeDistrictId, setActiveDistrictId] = useState(initialDistrictId || null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isLocationDrawerVisible, setIsLocationDrawerVisible] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('');

  // ── Date Picker State ──
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dateSpecificNews, setDateSpecificNews] = useState([]);
  const [showDateModal, setShowDateModal] = useState(false);
  const [loadingDateNews, setLoadingDateNews] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);

  // ── Pagination State ──
  const [paginationLinks, setPaginationLinks] = useState([]);
  const [taboolaAds, setTaboolaAds] = useState(null); // Taboola ads state

  // ── Refs ──
  const listRef = useRef(null);
  const tabScrollRef = useRef(null);
  const tabLayoutsRef = useRef({});
  const activeDistrictIdRef = useRef(activeDistrictId);

  // Keep refs in sync with state
  useEffect(() => {
    activeDistrictIdRef.current = activeDistrictId;
  }, [activeDistrictId]);

  // ── Fetch subcategory tabs first, then news ─────────────────────────────────────────
  const fetchSubTabs = useCallback(async () => {
    try {
      // Fetch with any valid cat to get subcatlist - use 315 as bootstrap
      const bootstrapId = initialDistrictId || 315;
      const res = await CDNApi.get(`/pugarpetti?cat=${bootstrapId}&page=1`);
      const d = res?.data;

      if (Array.isArray(d?.subcatlist) && d.subcatlist.length > 0) {
        setSubTabs(d.subcatlist);

        // Set active district - use initialDistrictId or first in list
        const defaultId = initialDistrictId || d.subcatlist[0]?.id;
        setActiveDistrictId(defaultId);
        activeDistrictIdRef.current = defaultId;

        // Now fetch news for the selected district
        const items = d?.districtlisting?.data || [];
        const lp = d?.districtlisting?.last_page || 1;
        const links = d?.districtlisting?.links || [];
        
        setLastPage(lp);
        setPage(1);
        setNews(items);
        setPaginationLinks(links);
      }
    } catch (e) {
      console.error('[PugarPetti] fetchSubTabs error:', e?.message);
    } finally {
      setLoading(false);
    }
  }, [initialDistrictId]);

  // ── Fetch news for a specific district ─────────────────────────────────────────────
  const fetchNews = useCallback(async (districtId, pg = 1, append = false) => {
    if (!districtId) return;
    try {
      const url = `/pugarpetti?cat=${districtId}&page=${pg}`;
      console.log('[PugarPetti] fetching:', url);
      const res = await CDNApi.get(url);
      const d = res?.data;

      // Debug: Log response structure
      console.log('[PugarPetti] response keys:', Object.keys(d || {}));
      console.log('[PugarPetti] districtlisting count:', d?.districtlisting?.data?.length);

      const items = d?.districtlisting?.data || [];
      const lp = d?.districtlisting?.last_page || 1;
      const links = d?.districtlisting?.links || [];
      
      setLastPage(lp);
      setPage(pg);
      setNews(prev => append ? [...prev, ...items] : items);
      setPaginationLinks(links);
      
      // Set Taboola ads from API response
      if (d?.taboola_ads?.mobile) {
        setTaboolaAds(d.taboola_ads.mobile);
      }
    } catch (e) {
      console.error('[PugarPetti] error:', e?.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  // ── On focus - load subtabs first, then news ──────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setNews([]);
      setPage(1);
      setLastPage(1);
      fetchSubTabs(); // ← fetches tabs + initial news in one go
    }, [fetchSubTabs])
  );

  // Auto-scroll active tab into view
  useEffect(() => {
    if (!tabScrollRef.current) return;
    const key = activeDistrictId == null ? 'all' : String(activeDistrictId);
    const layout = tabLayoutsRef.current[key];
    if (!layout) return;
    requestAnimationFrame(() => {
      tabScrollRef.current?.scrollTo({ x: Math.max(0, layout.x - layout.width), animated: true });
    });
  }, [activeDistrictId]);

  const handleTabPress = (tab) => {
    const newId = tab.id || null;
    if (newId === activeDistrictId) return;
    setActiveDistrictId(newId);
    setLoading(true);
    setNews([]);
    setDateSpecificNews([]); // Clear date-specific news when switching tabs
    setPage(1);
    setLastPage(1);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    fetchNews(newId, 1, false);
  };

  const handleLoadMore = () => {
    if (loadingMore || page >= lastPage) return;
    setLoadingMore(true);
    fetchNews(activeDistrictId, page + 1, true);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setDateSpecificNews([]); // Clear date-specific news when refreshing
    fetchNews(activeDistrictId, 1, false);
  };

  const handleArticlePress = (item) => {
    navigation.navigate('NewsDetailsScreen', {
      newsId: item.newsid || item.id,
      video: item,
      slug: item.slug || item.reacturl || '',
      // Pass the current district ID for potential filtering or back navigation
      districtId: activeDistrictId,
    });
  };

  // ── Date Picker Functions ──
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
          Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
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
    setShowCustomCalendar(true);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
      fetchNewsForDate(selectedDate);
    }
  };

const fetchNewsForDate = async (date) => {
  try {
    setLoadingDateNews(true);
    
    // ← Use REF not state — state is stale inside async callbacks
    const districtId = activeDistrictIdRef.current || initialDistrictId || 315;
    
    // Format date as DD-Mon-YYYY (e.g., "09-Oct-2025") - matches API's searchdate format
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const d = date.getDate().toString().padStart(2, '0');
    const m = months[date.getMonth()];
    const y = date.getFullYear();
    const formattedDate = `${d}-${m}-${y}`;
    
    console.log('[PugarPetti] fetching date news:', formattedDate, 'districtId:', districtId);
    
    if (!districtId) {
      console.error('[PugarPetti] No district ID available');
      setDateSpecificNews([]);
      return;
    }
    
    const response = await CDNApi.get(
      `/pugarpetti?cat=${districtId}&searchdate=${formattedDate}`
    );
    const newsData = response?.data?.districtlisting?.data || [];
    const links = response?.data?.districtlisting?.links || [];
    console.log('[PugarPetti] Total news count from API:', newsData.length);
    
    // Filter news to ensure only the selected date is shown
    const filteredNews = newsData.filter(item => {
      const itemDate = item.ago || item.date || '';
      console.log('[PugarPetti] Filtering item:', itemDate, 'target:', formattedDate, 'match:', itemDate === formattedDate);
      return itemDate === formattedDate;
    });
    
    console.log('[PugarPetti] Filtered news count:', filteredNews.length);
    
    // Show filtered news in main view below active tab
    setNews(filteredNews);
    setPaginationLinks(links);
    setDateSpecificNews(filteredNews); // Keep for reference
  } catch (error) {
    console.error('Error fetching news for date:', error?.response?.status, error?.message);
    setDateSpecificNews([]);
    setNews([]);
  } finally {
    setLoadingDateNews(false);
  }
};

  const closeDateModal = () => {
    setShowDateModal(false);
    setDateSpecificNews([]);
  };

  // ── Pagination Handler ──
  const handlePaginationPress = async (link) => {
    if (!link.url) return;
    
    try {
      setLoading(true);
      
      // Extract page number from URL
      const urlParams = new URLSearchParams(link.url.split('?')[1]);
      const pageNum = parseInt(urlParams.get('page')) || 1;
      
      if (showDateModal) {
        // For date modal, fetch date-specific news for the page
        const response = await CDNApi.get(link.url);
        const newsData = response?.data?.districtlisting?.data || [];
        const links = response?.data?.districtlisting?.links || [];
        
        setDateSpecificNews(newsData);
        setPaginationLinks(links);
      } else {
        // For normal view, fetch news for the page
        await fetchNews(activeDistrictId, pageNum, false);
      }
    } catch (error) {
      console.error('Pagination error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Build flat list data (group by date) ────────────────────────────────────
  // If we have filtered date-specific news, show it directly without date grouping
  const flatData = dateSpecificNews.length > 0 
    ? dateSpecificNews.map((item, index) => ({ type: 'item', item, index }))
    : groupByDate(news);

  // ── Update available dates when news data changes ─────────────────────────────
  useEffect(() => {
    const dates = extractAvailableDates(news);
    console.log('[PugarPetti] Available dates extracted:', dates);
    setAvailableDates(dates);
  }, [news]);

  const activeTab = subTabs.find(t =>
    activeDistrictId == null ? t.id == null : String(t.id) === String(activeDistrictId)
  );

  // ── Page Title ──
  const pageTitle = activeTab?.title && activeTab.title !== 'All'
    ? activeTab.title
    : screenTitle;

  // ── Render Item for FlatList ──
  const renderItem = ({ item }) => {
    if (item.type === 'dateHeader') {
      return (
        <TouchableOpacity 
          style={styles.dateHeaderWrap}
          onPress={() => handleDateHeaderPress(item.date)}
          activeOpacity={0.7}
        >
          <View style={styles.dateHeaderInner}>
            <Ionicons name="calendar-outline" size={s(15)} color="#555" style={styles.dateHeaderIcon} />
            <Text style={styles.dateHeaderText}>{(item.date)}</Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (item.type === 'item') {
      return (
        <NewsCard
          item={item.item}
          onPress={() => handleArticlePress(item.item)}
          sf={sf}
        />
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      <UniversalHeaderComponent
        showMenu showSearch showNotifications showLocation
        onSearch={() => navigation.navigate('SearchScreen')}
        onLocation={() => setIsLocationDrawerVisible(true)}
        selectedDistrict={selectedDistrict}
        navigation={navigation}
        isDrawerVisible={isDrawerVisible}
        setIsDrawerVisible={setIsDrawerVisible}
        isLocationDrawerVisible={isLocationDrawerVisible}
        setIsLocationDrawerVisible={setIsLocationDrawerVisible}
       onSelectDistrict={(district) => {
  setSelectedDistrict(district.title);
  setIsLocationDrawerVisible(false);
  // Navigate to DistrictNewsScreen so it can match by title
  navigation.navigate('DistrictNewsScreen', {
    districtTitle: district.title,
    fromPugarPetti: false,
    showAllTab: false,
  });
}}
      >
        <AppHeaderComponent
          onSearch={() => navigation.navigate('SearchScreen')}
          onMenu={() => setIsDrawerVisible(true)}
          onLocation={() => setIsLocationDrawerVisible(true)}
          selectedDistrict={selectedDistrict}
        />
      </UniversalHeaderComponent>

      {/* ── Page Title ── */}
      <View style={styles.titleWrap}>
        <Text style={[styles.pageTitle, { fontSize: sf(16) }]}>{pageTitle}</Text>
        <TouchableOpacity 
          style={styles.englishVersionBox}
          onPress={() => {
  const currentDistrict = subTabs.find(tab => String(tab.id) === String(activeDistrictId));
  const isAllTab = activeDistrictId == null || !currentDistrict;

  navigation.navigate('DistrictNewsScreen', {
    fromPugarPetti: true,
    showAllTab: isAllTab,
    // When All tab: pass null so DistrictNews defaults to Chennai
    // When specific tab: pass that district's id/title
    districtId: isAllTab ? null : currentDistrict?.id,
    districtTitle: isAllTab ? null : currentDistrict?.title,
  });
}}
          activeOpacity={0.8}
        >
          <Text style={styles.englishVersionText}>செய்திகள்</Text>
        </TouchableOpacity>
      </View>

      {/* ── District Tabs ── */}
      {subTabs.length > 0 && (
        <View style={styles.tabsWrap}>
          <ScrollView
            ref={tabScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {subTabs.map((tab, index) => {
              const isActive = activeDistrictId == null
                ? tab.id == null
                : (tab.id && String(tab.id) === String(activeDistrictId));
              const tabKey = tab.id == null ? 'all' : String(tab.id || '');
              return (
                <TouchableOpacity
                  key={`tab-${tabKey}-${index}`}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => handleTabPress(tab)}
                  activeOpacity={0.8}
                  onLayout={(e) => {
                    tabLayoutsRef.current[tabKey] = {
                      x: e.nativeEvent.layout.x,
                      width: e.nativeEvent.layout.width,
                    };
                  }}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive, { fontSize: ms(15) }]}>
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
      {loading ? (
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          keyExtractor={i => `sk-${i}`}
          renderItem={() => <SkeletonCard />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          ref={listRef}
          data={flatData}
          keyExtractor={(row, i) =>
            row.type === 'dateHeader'
              ? `date-${row.date}-${i}`
              : `item-${row.item?.newsid || row.item?.id || i}`
          }
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
          ListEmptyComponent={<EmptyState sf={sf} />}
          ListFooterComponent={
            loadingMore
              ? <ActivityIndicator size="small" color={COLORS.primary} style={{ margin: vs(16) }} />
              : <View style={{ height: vs(30) }} />
          }
        />
      )}
      
      {/* ── Custom Calendar ── */}
      <CustomCalendarModal
        visible={showCustomCalendar}
        onClose={() => setShowCustomCalendar(false)}
        availableDates={availableDates}
        selectedDate={selectedDate || new Date()}
        onDateSelect={(date) => {
          setSelectedDate(date);
          setShowCustomCalendar(false);
          fetchNewsForDate(date);
        }}
      />
      
      {/* ── Taboola Ads ── */}
      {activeDistrictId && taboolaAds && (
        <>
          {/* Mid-content Taboola ad */}
          {taboolaAds.midmain && (
            <TaboolaAdSection
              taboolaAds={taboolaAds}
              position="midmain"
              pageUrl="https://www.dinamalar.com/pugarpetti"
              pageType="article"
            />
          )}
          
          {/* Bottom Taboola ad */}
          {taboolaAds.bottom && (
            <TaboolaAdSection
              taboolaAds={taboolaAds}
              position="bottom"
              pageUrl="https://www.dinamalar.com/pugarpetti"
              pageType="article"
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    paddingTop: Platform.OS === 'android' ? 0 : vs(20),
  },
  titleWrap: { 
    paddingTop: vs(14), 
    paddingBottom: vs(6), 
    backgroundColor: '#fff', 
    paddingHorizontal: ms(14),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: { fontSize: 18, fontFamily: FONTS.anek.bold, color: '#111', marginBottom: vs(4) },

  activeTabIndicator: {
    marginTop: vs(4),
  },
  activeTabText: {
    fontSize: ms(12),
    fontFamily: FONTS.muktaMalar.regular,
    color: COLORS.primary,
  },
  // ── Date Header ──
  dateHeaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: vs(2),
    gap: s(6),
    paddingHorizontal: ms(12),
    justifyContent: "flex-end"
  },
  dateHeaderInner: {
    borderWidth: 1,
    flexDirection: "row",
    // borderRadius: s(10),
    paddingVertical: ms(3),
    paddingHorizontal: ms(8),
    alignItems: "center",
    borderColor: '#6c757d',
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
  // ── Tabs ──
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
  englishVersionBox: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: s(4),
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
  },
  englishVersionText: {
    fontSize: ms(13),
    fontFamily: FONTS.muktaMalar.medium,
    color: COLORS.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingTop: vs(8),
    paddingBottom: vs(30),
    backgroundColor: '#fff',
  },
  // ── Modal Styles ──
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: s(16),
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: ms(18),
    fontFamily: FONTS.muktaMalar.bold,
    color: '#333',
  },
  closeButton: {
    padding: s(4),
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
    fontFamily: FONTS.muktaMalar.medium,
    color: '#666',
  },
  modalListContent: {
    padding: s(16),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: vs(40),
  },
  emptyText: {
    fontSize: ms(16),
    fontFamily: FONTS.muktaMalar.medium,
    color: '#666',
    textAlign: 'center',
  },
});
