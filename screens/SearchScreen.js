import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  FlatList, ActivityIndicator, StyleSheet, StatusBar,
  Platform, Image, Keyboard,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { s, vs } from '../utils/scaling';
import { ms } from 'react-native-size-matters';
import { FONTS, getFontFamily } from '../utils/fonts';
import { COLORS, NewsCard as NewsCardStyles } from '../utils/constants';
import { useFontSize } from '../context/FontSizeContext';
import UniversalHeaderComponent from '../components/UniversalHeaderComponent';
import AppHeaderComponent from '../components/AppHeaderComponent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import VoiceSearchModal from '../components/VoiceSearchModal';
import { SpeakerIcon } from '../assets/svg/Icons';
import TopMenuStrip from '../components/TopMenuStrip';
import { SafeAreaView } from 'react-native-safe-area-context';
 
const SEARCH_API = 'https://api-st.dinamalar.com/searchfilter?search=';
const INITIAL_API = 'https://api-st.dinamalar.com/search';
const RECENT_KEY = 'dm_recent_searches';
const MAX_RECENT = 8;
const DEBOUNCE_MS = 200;
const CACHE_TTL = 5 * 60 * 1000;

const searchCache = new Map();

const PALETTE = {
  grey100: '#F9FAFB',
  grey200: '#F4F6F8',
  grey300: '#DFE3E8',
  grey400: '#C4CDD5',
  grey500: '#919EAB',
  grey600: '#637381',
  grey700: '#637381',
  grey800: '#212B36',
  white: '#FFFFFF',
  red: '#E63946',
  dark: '#1A1A1A',
  blue: '#003580',
  primary: '#096dd2',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getFromCache(key) {
  const hit = searchCache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data;
  return null;
}
function setToCache(key, data) {
  searchCache.set(key, { data, ts: Date.now() });
}

// ─── NewsCard ─────────────────────────────────────────────────────────────────
function NewsCard({ item, onPress, onCategoryPress }) {
  const { sf } = useFontSize();
  const imageUri =
    item.largeimages || item.images || item.image ||
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';
  const title = item.newstitle || item.title || '';
  const category = item.maincat || item.categrorytitle || '';
  const ago = item.ago || item.standarddate || '';
  const comments = item.newscomment || 0;
  const hasAudio = item.audio === 1 || item.audio === '1';
  const isVideo = item.video === 1 || item.video === '1';

  return (
    <View style={NewsCardStyles.wrap}>
      <TouchableOpacity onPress={() => onPress?.(item)} activeOpacity={0.88}>
        <Image
          source={{ uri: imageUri }}
          style={[NewsCardStyles.image, { height: isVideo ? vs(160) : vs(200) }]}
          resizeMode="cover"
        />
        <View style={NewsCardStyles.contentContainer}>
          {!!title && (
            <Text style={[NewsCardStyles.title, { fontSize: sf(13), lineHeight: sf(22) }]} numberOfLines={3}>
              {title}
            </Text>
          )}
          {!!category && (
            <TouchableOpacity
              style={NewsCardStyles.catPill}
              onPress={() => onCategoryPress?.(category, item)}
              activeOpacity={0.7}
            >
              <Text style={[NewsCardStyles.catText, { fontSize: sf(12) }]}>{category}</Text>
            </TouchableOpacity>
          )}
          <View style={NewsCardStyles.metaRow}>
            <Text style={[NewsCardStyles.timeText, { fontSize: sf(12) }]}>{ago}</Text>
            <View style={NewsCardStyles.metaRight}>
              {hasAudio && <SpeakerIcon size={s(14)} color={COLORS.text} />}
              {!!comments && comments !== '0' && comments !== 0 && (
                <View style={NewsCardStyles.commentRow}>
                  <Ionicons name="chatbox" size={s(14)} color={COLORS.subtext} />
                  <Text style={[NewsCardStyles.commentText, { fontSize: sf(12) }]}> {comments}</Text>
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

// ─── SearchResultItem ─────────────────────────────────────────────────────────
const SearchResultItem = React.memo(({ item, onPress }) => {
  const title = item.newstitle || item.title || '';
  const imageUrl = item.images || item.largeimages || '';
  const pubDate = item.ago || item.standarddate || '';
  const catLabel = item.maincat || '';
  const comments = parseInt(item.newscomment || 0);
  const isVideo = item.type === 'video' || item.type === 'reels' || item.video == 1;
  const isPhoto = item.type === 'photo';
  const hasAudio = item.audio === '1' || item.audio === 1;

  const imageSource = imageUrl
    ? { uri: imageUrl }
    : require('../assets/images/videoPlaceHolder.png');

  return (
    <TouchableOpacity style={styles.resultCard} onPress={() => onPress?.(item)} activeOpacity={0.88}>
      <View style={[styles.resultImageWrap, isPhoto && styles.resultImageWrapPhoto]}>
        <Image source={imageSource} style={styles.resultImage} resizeMode="cover" />
        {isVideo && (
          <View style={styles.playOverlay}>
            <View style={styles.playCircle}>
              <Ionicons name="play" size={ms(16)} color="#fff" />
            </View>
          </View>
        )}
        {isPhoto && (
          <View style={styles.imageOverlay}>
            <Ionicons name="image" size={ms(18)} color="#fff" />
          </View>
        )}
      </View>
      <View style={styles.resultBody}>
        <Text style={[NewsCardStyles.title, { fontSize: ms(13) }]} numberOfLines={3}>{title}</Text>
        {!!catLabel && (
          <View style={NewsCardStyles.catPill}>
            <Text style={NewsCardStyles.catText}>{catLabel}</Text>
          </View>
        )}
        <View style={NewsCardStyles.metaRow}>
          <Text style={[NewsCardStyles.timeText, { fontSize: ms(12) }]}>{pubDate}</Text>
          <View style={NewsCardStyles.metaRight}>
            {hasAudio && <SpeakerIcon size={ms(14)} color="#555" />}
            {comments > 0 && (
              <View style={styles.commentWrap}>
                <Ionicons name="chatbox" size={ms(14)} color="#555" />
                <Text style={styles.commentCount}> {comments}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ─── TrendingChip ─────────────────────────────────────────────────────────────
function TrendingChip({ topic, rank, onPress }) {
  const isTop3 = rank <= 3;
  return (
    <TouchableOpacity style={styles.trendChip} onPress={() => onPress(topic.key)} activeOpacity={0.75}>

      <Text style={styles.trendChipText}>{topic.key}</Text>
    </TouchableOpacity>
  );
}

// ─── RecentChip ───────────────────────────────────────────────────────────────
function RecentChip({ query, onPress, onRemove }) {
  return (
    <View style={styles.recentChip}>
      <TouchableOpacity style={styles.recentChipBody} onPress={() => onPress(query)} activeOpacity={0.75}>
        <Ionicons name="time-outline" size={ms(13)} color="#888" />
        <Text style={styles.recentChipText}>{query}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onRemove(query)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={ms(13)} color="#aaa" />
      </TouchableOpacity>
    </View>
  );
}

// Top10Item Component for most viewed articles using NewsCard
const Top10Item = ({ item, index, onPress, onCategoryPress }) => {
  return (
    <View style={styles.top10Item}>

      <View style={styles.top10CardWrap}>
        <NewsCard item={item} onPress={onPress} onCategoryPress={onCategoryPress} />
      </View>
    </View>
  );
};

// ─── SectionHeader ────────────────────────────────────────────────────────────
function SectionHeader({ title, onSeeMore }) {
  const { sf } = useFontSize();

  return (
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={onSeeMore}
      activeOpacity={0.8}
      disabled={!onSeeMore}
    >
      <Text style={[styles.sectionTitle, { fontSize: sf(16) }]}>{title}</Text>
      <View style={styles.sectionUnderline} />
      <View style={styles.greyLine} />
    </TouchableOpacity>
  );
}

// ShortCard Component for Shorts UI
const ShortCard = ({ video, onPress }) => {
  const title = video.newstitle || video.title || video.videotitle || '';
  const imageUri = video.images || video.largeimages || video.image || '';
  const duration = video.duration || '';
  const catLabel = video.maincat || video.CatName || '';
  const pubDate = video.ago || video.standarddate || '';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress?.(video)}
      style={styles.shortCard}
    >
      {/* Landscape thumbnail with 16:9 ratio */}
      <View style={styles.shortCardThumb}>
        <Image
          source={{
            uri: imageUri ||
              'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400',
          }}
          style={styles.shortCardImage}
          resizeMode="cover"
        />

        {/* Centered play button */}
        <View style={styles.shortCardPlayWrap}>
          <View style={styles.shortCardPlayBtn}>
            <Ionicons name="play" size={s(20)} color="#fff" />
          </View>
        </View>

        {/* Duration badge bottom-right */}
        {!!duration && (
          <View style={styles.shortCardDuration}>
            <Text style={styles.shortCardDurationText}>{duration}</Text>
          </View>
        )}

        {/* Title overlay at bottom */}
        {!!title && (
          <View style={styles.shortCardTitleOverlay}>
            <Text style={styles.shortCardTitle} numberOfLines={2}>{title}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// Shorts Section Row (horizontal scroll strip)
const ShortsSectionRow = ({ items, onPress }) => {
  if (!items || items.length === 0) return null;

  return (
    <View style={styles.shortsSectionContainer}>
      <View style={styles.shortsSectionHeader}>
        <View style={styles.shortsSectionTitleWrap}>
          <Text style={styles.shortsSectionTitle}>Shorts</Text>
          <View style={styles.shortsSectionUnderline} />
        </View>
      </View>
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        contentContainerStyle={styles.shortsSectionScroll}
        style={styles.shortsSectionScrollView}
      >
        {items.map((video, index) => (
          <ShortCard
            key={`short-${index}-${video.videoid || video.id || index}`}
            video={video}
            onPress={onPress}
          />
        ))}
      </ScrollView>
    </View>
  );
};

function CategoryTabs({ tabs, active, onSelect }) {
  // Filter out "all" tab and only show specific category tabs
  const filteredTabs = tabs.filter(t => t.ename && t.name && t.ename !== 'all');
  if (filteredTabs.length === 0) return null;

  return (
    <View style={styles.tabsWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
        bounces={false}
      >
        {filteredTabs.map(t => {
          const isActive = active === t.ename;
          return (
            <TouchableOpacity
              key={t.ename}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => onSelect(t.ename)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {t.name}{t.count ? ` (${t.count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SearchScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [top10Data, setTop10Data] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [trendLoading, setTrendLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [voiceModal, setVoiceModal] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isLocationDrawerVisible, setIsLocationDrawerVisible] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('உள்ளூர்');

  const debounceRef = useRef(null);
  const currentQuery = useRef('');
  const flatListRef = useRef(null);
  const inputRef = useRef(null);

  // ── Load recent searches ──────────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem(RECENT_KEY)
      .then(v => { if (v) setRecentSearches(JSON.parse(v)); })
      .catch(() => { });
  }, []);

  // ── Fetch trending on mount ───────────────────────────────────────────────
  useEffect(() => {
    const cached = getFromCache('__initial__');
    if (cached) {
      setTrendingTopics(cached);
      setTrendLoading(false);
      return;
    }
    axios.get(INITIAL_API, { timeout: 10000 })
      .then(res => {
        const data = res.data || {};
        let topics = [];
        // Correct key: trendingkeywords[0].data
        if (Array.isArray(data.trendingkeywords) && data.trendingkeywords.length > 0) {
          const first = data.trendingkeywords[0];
          if (Array.isArray(first.data)) topics = first.data;
        }
        const top10 = topics.slice(0, 10);
        setToCache('__initial__', top10);
        setTrendingTopics(top10);

        // Extract top10 most viewed data
        const top10Data = Array.isArray(data.top10?.data) ? data.top10.data : [];
        console.log('Initial API top10 data:', top10Data.length);
        setTop10Data(top10Data);
      })
      .catch(() => { })
      .finally(() => setTrendLoading(false));
  }, []);

  // ── Route param search ────────────────────────────────────────────────────
  useEffect(() => {
    const term = route.params?.searchTerm;
    if (term) { setQuery(term); triggerSearch(term); }
  }, [route.params?.searchTerm]);

  // ── Save / clear recent ───────────────────────────────────────────────────
  const saveRecent = useCallback(async (q) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setRecentSearches(prev => {
      const updated = [trimmed, ...prev.filter(x => x !== trimmed)].slice(0, MAX_RECENT);
      AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated)).catch(() => { });
      return updated;
    });
  }, []);

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
  const handleSearch = () => navigation?.navigate?.('Search');
  const handleNotification = () => console.log('Notifications');

  const removeRecent = useCallback(async (q) => {
    setRecentSearches(prev => {
      const updated = prev.filter(x => x !== q);
      AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated)).catch(() => { });
      return updated;
    });
  }, []);

  const clearRecent = useCallback(async () => {
    setRecentSearches([]);
    AsyncStorage.removeItem(RECENT_KEY).catch(() => { });
  }, []);

  // ── Core search ───────────────────────────────────────────────────────────
  const triggerSearch = useCallback((q) => {
    const trimmed = (q || '').trim();
    if (!trimmed) {
      setHasSearched(false);
      setResults([]);
      return;
    }

    currentQuery.current = trimmed;
    saveRecent(trimmed);

    const cacheKey = trimmed + '_p1';
    const cached = getFromCache(cacheKey);
    if (cached) {
      setResults(cached.results);
      setCategoryFilter(cached.tabs);
      setCurrentPage(1);
      setLastPage(cached.lastPage);
      setHasSearched(true);
      // Set first tab as active by default (excluding 'all' tab)
      const firstTab = cached.tabs.find(t => t.ename && t.ename !== 'all');
      setActiveTab(firstTab?.ename || '');
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setActiveTab('all');
    setCurrentPage(1);

    axios.get(SEARCH_API + encodeURIComponent(trimmed) + '&page=1', {
      timeout: 10000,
      headers: { Accept: 'application/json' },
    })
      .then(res => {
        const data = res.data?.original || res.data || {};

        const list = Array.isArray(data.detail) ? data.detail
          : Array.isArray(data) ? data
            : [];
        const tabs = Array.isArray(data.categoryfilter) ? data.categoryfilter : [];
        const lp = data.pagination?.last_page || 1;
        const cp = data.pagination?.current_page || 1;
        const total = data.pagination?.total || 0;
        const top10 = Array.isArray(data.top10?.data) ? data.top10.data : [];

        setResults(list);
        setCategoryFilter(tabs);
        setTop10Data(top10);
        setLastPage(lp);
        setCurrentPage(cp);
        // Set first tab as active by default (excluding 'all' tab)
        const firstTab = tabs.find(t => t.ename && t.ename !== 'all');
        setActiveTab(firstTab?.ename || '');
        setToCache(cacheKey, { results: list, tabs, lastPage: lp });
      })
      .catch(err => {
        console.error('Search API Error:', err);
        setError('Search failed. Please try again.');
      })
      .finally(() => setIsLoading(false));
  }, [saveRecent]);

  // -- Debounced input --
  const onChangeText = useCallback((text) => {
    setQuery(text);
    clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setHasSearched(false);
      setResults([]);
      setCategoryFilter([]);
      return;
    }
    debounceRef.current = setTimeout(() => triggerSearch(text), DEBOUNCE_MS);
  }, [triggerSearch]);

  // ── Load more ─────────────────────────────────────────────────────────────
  const loadMore = useCallback(() => {
    if (isLoadingMore || isLoading || currentPage >= lastPage || !currentQuery.current) return;
    const next = currentPage + 1;

    setIsLoadingMore(true);
    axios.get(SEARCH_API + encodeURIComponent(currentQuery.current) + '&page=' + next, { timeout: 5000 })
      .then(res => {
        const data = res.data || {};
        const list = Array.isArray(data.detail) ? data.detail : [];
        const newPage = data.pagination?.current_page || next;

        setResults(prev => [...prev, ...list]);
        setCurrentPage(newPage);
      })
      .catch(() => { })
      .finally(() => setIsLoadingMore(false));
  }, [isLoadingMore, isLoading, currentPage, lastPage]);

  // Handle tab selection with API calls for specific types
  const handleTabSelect = useCallback((ename) => {
    setActiveTab(ename);
    if (!currentQuery.current) return;
    if (ename === 'all' || ename === '') return; // already loaded

    setIsLoading(true);
    const url = SEARCH_API + encodeURIComponent(currentQuery.current) + `&page=1&type=${ename}`;
    axios.get(url, { timeout: 10000, headers: { Accept: 'application/json' } })
      .then(res => {
        const data = res.data || {};
        const list = Array.isArray(data.detail) ? data.detail
          : Array.isArray(data) ? data
            : [];
        const lp = data.pagination?.last_page || 1;
        setResults(list);
        setLastPage(lp);
        setCurrentPage(data.pagination?.current_page || 1);
      })
      .catch(() => { })
      .finally(() => setIsLoading(false));
  }, []);

  // ── Filter by tab ─────────────────────────────────────────────────────────
  const filteredResults = React.useMemo(() => {
    // If no active tab or 'all', return all results
    if (!activeTab || activeTab === 'all' || activeTab === '') {
      return results;
    }

    const filtered = results.filter(item => {
      const t = (item.type || '').toLowerCase();
      const maincat = (item.maincat || '').toLowerCase();
      const categoryTitle = (item.categrorytitle || '').toLowerCase();
      const categoryName = (item.categoryname || '').toLowerCase();
      const isVideo = item.video == 1 || item.video === '1';

      // Specific tab logic - optimized
      if (activeTab === 'video') return t === 'video' || t === 'reels' || isVideo;
      if (activeTab === 'photo') return t === 'photo';
      if (activeTab === 'news') return t === 'news' || t === '' || !t;
      if (activeTab === 'education' || activeTab === 'kalvi') {
        return t === 'education' || t === 'kalvi' ||
          maincat.includes('education') || maincat.includes('kalvi') ||
          categoryTitle.includes('education') || categoryTitle.includes('kalvi') ||
          categoryName.includes('education') || categoryName.includes('kalvi');
      }
      if (activeTab === 'inaippu' || activeTab === 'inaippumalar' || activeTab === 'weekly') {
        return t === 'inaippu' || t === 'inaippumalar' || t === 'weekly' ||
          maincat.includes('inaippu') || maincat.includes('inaippumalar') || maincat.includes('weekly') ||
          categoryTitle.includes('inaippu') || categoryTitle.includes('inaippumalar') || categoryTitle.includes('weekly') ||
          categoryName.includes('inaippu') || categoryName.includes('weekly');
      }
      if (activeTab === 'kavi' || activeTab === 'kavimalar' || activeTab === 'kalvimalar') {
        return t === 'kavi' || t === 'kavimalar' || t === 'kalvimalar' ||
          maincat.includes('kavi') || maincat.includes('kavimalar') || maincat.includes('kalvimalar') ||
          categoryTitle.includes('kavi') || categoryTitle.includes('kavimalar') || categoryTitle.includes('kalvimalar') ||
          categoryName.includes('kavi') || categoryName.includes('kavimalar') || categoryName.includes('kalvimalar');
      }
      if (activeTab === 'general') return t === 'general' || t === '' || !t;

      // Fallback: return item if any field matches activeTab
      return t === activeTab || maincat === activeTab || categoryTitle === activeTab || categoryName === activeTab;
    });

    return filtered;
  }, [results, activeTab]);

  // Navigation 
  const handleItemPress = useCallback((item) => {
    const id = item.id || item.newsid;
    // ... (rest of the code remains the same)
    const type = (item.type || '').toLowerCase();
    const isNewsTab = activeTab === 'news' || activeTab === 'seithigal';
    const isVideoTab = activeTab === 'video';
    const isPhotoTab = activeTab === 'photo';

    // For videos tab, always go to VideoDetailScreen
    if (isVideoTab) {
      const normalizedVideo = {
        ...item,
        videoid: item.videoid || item.videoId || item.video_id || item.id || item.newsid,
        videopath: item.videopath || item.path || item.y_path || item.videourl,
        videotitle: item.videotitle || item.newstitle || item.title || '',
        videodescription: item.videodescription || item.description || item.content || '',
        videodate: item.videodate || item.date || item.created_at || '',
        images: item.images || item.largeimages || item.image || item.thumbnail || '',
        largeimages: item.largeimages || item.images || item.image || item.thumbnail || '',
        video: item.video || 1,
        type: 'video'
      };

      navigation.navigate('VideoDetailScreen', { video: normalizedVideo });
      return;
    }

    // For photo tab, go to CommonSectionScreen with specific tab detection
    if (isPhotoTab) {
      let initialTabId = null;
      let targetScreenTitle = 'போட்டோ';

      // Check for specific photo categories
      const maincatLower = (item.maincat || '').toLowerCase();
      const categorynameLower = (item.categoryname || '').toLowerCase();
      const categrorytitleLower = (item.categrorytitle || '').toLowerCase();
      const catnameLower = (item.catname || '').toLowerCase();
      const sectionLower = (item.section || '').toLowerCase();
      const newstitleLower = (item.newstitle || '').toLowerCase();

      // Cards detection
      if (maincatLower.includes('card') || maincatLower.includes('cards') ||
        categorynameLower.includes('card') || categorynameLower.includes('cards') ||
        categrorytitleLower.includes('card') || categrorytitleLower.includes('cards') ||
        catnameLower.includes('card') || catnameLower.includes('cards') ||
        sectionLower.includes('card') || sectionLower.includes('cards') ||
        newstitleLower.includes('card') || newstitleLower.includes('cards') ||
        item.maincatid === 'socialcards' || item.scatid === 'socialcards' || item.subcatid === 'socialcards') {
        initialTabId = 'socialcards';
      }
      // Cartoons detection
      else if (maincatLower.includes('cartoon') || maincatLower.includes('caricature') ||
        categorynameLower.includes('cartoon') || categorynameLower.includes('caricature') ||
        categrorytitleLower.includes('cartoon') || categrorytitleLower.includes('caricature') ||
        catnameLower.includes('cartoon') || catnameLower.includes('caricature') ||
        sectionLower.includes('cartoon') || sectionLower.includes('caricature') ||
        newstitleLower.includes('cartoon') || newstitleLower.includes('caricature') ||
        item.maincatid === '5002' || item.scatid === '5002' || item.subcatid === '5002') {
        initialTabId = '5002';
      }
      // Today Photos detection
      else if (maincatLower.includes('today') || maincatLower.includes('innrai') ||
        categorynameLower.includes('today') || categorynameLower.includes('innrai') ||
        categrorytitleLower.includes('today') || categrorytitleLower.includes('innrai') ||
        catnameLower.includes('today') || catnameLower.includes('innrai') ||
        sectionLower.includes('today') || sectionLower.includes('innrai') ||
        newstitleLower.includes('today') || newstitleLower.includes('innrai') ||
        item.maincatid === '81' || item.scatid === '81' || item.subcatid === '81') {
        initialTabId = '81';
      }
      // Photo Album detection
      else if (maincatLower.includes('album') || maincatLower.includes('pugai') ||
        categorynameLower.includes('album') || categorynameLower.includes('pugai') ||
        categrorytitleLower.includes('album') || categrorytitleLower.includes('pugai') ||
        catnameLower.includes('album') || catnameLower.includes('pugai') ||
        sectionLower.includes('album') || sectionLower.includes('pugai') ||
        newstitleLower.includes('album') || newstitleLower.includes('pugai') ||
        item.maincatid === '5001' || item.scatid === '5001' || item.subcatid === '5001') {
        initialTabId = '5001';
      }
      // NRI Album detection
      else if (maincatLower.includes('nri') ||
        categorynameLower.includes('nri') ||
        categrorytitleLower.includes('nri') ||
        catnameLower.includes('nri') ||
        sectionLower.includes('nri') ||
        newstitleLower.includes('nri') ||
        item.maincatid === '5003' || item.scatid === '5003' || item.subcatid === '5003') {
        initialTabId = '5003';
      }
      // Web Stories detection
      else if (maincatLower.includes('webstory') || maincatLower.includes('web story') ||
        categorynameLower.includes('webstory') || categorynameLower.includes('web story') ||
        categrorytitleLower.includes('webstory') || categrorytitleLower.includes('web story') ||
        catnameLower.includes('webstory') || catnameLower.includes('web story') ||
        sectionLower.includes('webstory') || sectionLower.includes('web story') ||
        newstitleLower.includes('webstory') || newstitleLower.includes('web story') ||
        item.maincatid === 'webstoriesupdate' || item.scatid === 'webstoriesupdate' || item.subcatid === 'webstoriesupdate') {
        initialTabId = 'webstoriesupdate';
        targetScreenTitle = 'Web Stories';
      }

      const navigationParams = {
        screenTitle: targetScreenTitle,
        apiEndpoint: 'https://api-st.dinamalar.com/photodata',
        allTabLink: 'https://api-st.dinamalar.com/photodata',
        item: item
      };

      // Add initialTabId only if detected
      if (initialTabId) {
        navigationParams.initialTabId = initialTabId;
      }

      // Add selectedNewsId for exact news item targeting
      const newsId = item.id || item.newsid;
      if (newsId) {
        navigationParams.selectedNewsId = String(newsId);
        navigationParams.selectedNewsItem = item;
      }

      navigation.navigate('CommonSectionScreen', navigationParams);
      return;
    }

    // For other tabs (except news), check video type for navigation
    if (!isNewsTab && (type === 'video' || type === 'reels' || item.video == 1)) {
      navigation.navigate('VideoDetailScreen', { video: item });
    } else if (id) {
      navigation.navigate('NewsDetailsScreen', { newsId: id, newsItem: item, slug: item.slug || '' });
    }
  }, [navigation, activeTab]);

  const handleClear = useCallback(() => {
    setQuery('');
    setHasSearched(false);
    setResults([]);
    setError(null);
    setActiveTab('all');
    currentQuery.current = '';
    clearTimeout(debounceRef.current);
  }, []);

  const handleTrendingPress = useCallback((key) => {
    setQuery(key);
    triggerSearch(key);
  }, [triggerSearch]);

  const handleRecentPress = useCallback((key) => {
    setQuery(key);
    triggerSearch(key);
  }, [triggerSearch]);

  const handleScroll = (e) => setShowScrollTop(e.nativeEvent.contentOffset.y > 300);

  const scrollToTop = () => flatListRef.current?.scrollToOffset({ offset: 0, animated: true });

  // Category navigation handler
  const handleCategoryPress = useCallback((category, item) => {
    const categoryLower = category.toLowerCase().trim();

    // Map categories to screen names and tabs (including Tamil variations)
    const categoryMappings = {
      // English variations
      'india': { screen: 'TharpothaiyaSeithigalScreen', tabId: 'india', initialTabTitle: 'India' },
      'tamil nadu': { screen: 'TharpothaiyaSeithigalScreen', tabId: 'tamilagam', initialTabTitle: 'Tamil Nadu' },
      'tamilnadu': { screen: 'TharpothaiyaSeithigalScreen', tabId: 'tamilagam', initialTabTitle: 'Tamil Nadu' },
      'tamilagam': { screen: 'TharpothaiyaSeithigalScreen', tabId: 'tamilagam', initialTabTitle: 'Tamil Nadu' },
      'world': { screen: 'TharpothaiyaSeithigalScreen', tabId: 'world', initialTabTitle: 'World' },
      'cinema': { screen: 'TharpothaiyaSeithigalScreen', tabId: 'cinema', initialTabTitle: 'Cinema' },
      'sports': { screen: 'TharpothaiyaSeithigalScreen', tabId: 'sports', initialTabTitle: 'Sports' },
      'business': { screen: 'TharpothaiyaSeithigalScreen', tabId: 'business', initialTabTitle: 'Business' },
      'varthagam': { screen: 'TharpothaiyaSeithigalScreen', tabId: 'business', initialTabTitle: 'Business' },
      'politics': { screen: 'TharpothaiyaSeithigalScreen', tabId: 'politics', initialTabTitle: 'Politics' },
      'education': { screen: 'TharpothaiyaSeithigalScreen', tabId: 'education', initialTabTitle: 'Education' },
      'premium': { screen: 'TharpothaiyaSeithigalScreen', tabId: 'premium', initialTabTitle: 'Premium' },

      // Tamil variations
      'இந்தியா': { screen: 'TharpothaiyaSeithigalScreen', tabId: 'india', initialTabTitle: 'இந்தியா' },
      'தமிழ்நாடு': { screen: 'TharpothaiyaSeithigalScreen', tabId: 'tamilagam', initialTabTitle: 'தமிழ்நாடு' },
      'உலகம்': { screen: 'TharpothaiyaSeithigalScreen', tabId: 'world', initialTabTitle: 'உலகம்' },
      'சினிமா': { screen: 'TharpothaiyaSeithigalScreen', tabId: 'cinema', initialTabTitle: 'சினிமா' },
      'விளையாட்டு': { screen: 'TharpothaiyaSeithigalScreen', tabId: 'sports', initialTabTitle: 'விளையாட்டு' },
      'வணிகம்': { screen: 'TharpothaiyaSeithigalScreen', tabId: 'business', initialTabTitle: 'வணிகம்' },
      'அரசியல்': { screen: 'TharpothaiyaSeithigalScreen', tabId: 'politics', initialTabTitle: 'அரசியல்' },
      'கல்வி': { screen: 'TharpothaiyaSeithigalScreen', tabId: 'education', initialTabTitle: 'கல்வி' },
      'பிரீமியம்': { screen: 'TharpothaiyaSeithigalScreen', tabId: 'premium', initialTabTitle: 'பிரீமியம்' },
    };

    const mapping = categoryMappings[categoryLower];

    if (mapping) {
      navigation.navigate(mapping.screen, {
        tabId: mapping.tabId,
        initialTabTitle: mapping.initialTabTitle
      });
    } else {
      // For unmapped categories, navigate to CommonSectionScreen
      navigation.navigate('CommonSectionScreen', {
        screenTitle: category,
        apiEndpoint: 'https://api-st.dinamalar.com/photodata',
        allTabLink: 'https://api-st.dinamalar.com/photodata',
        categoryFilter: category
      });
    }
  }, [navigation]);

  // ── Pre-search view ───────────────────────────────────────────────────────
  const renderPreSearch = () => (
    <ScrollView style={styles.preWrap} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

      {/* Trending Topics */}
      <SectionHeader title="TRENDING TOPICS" />
      {trendLoading ? (
        <ActivityIndicator size="small" color="#1565C0" style={{ marginVertical: vs(16) }} />
      ) : trendingTopics.length === 0 ? (
        <Text style={styles.emptyHint}>No trending topics</Text>
      ) : (
        <View style={styles.chipRow}>
          {trendingTopics.map((t, i) => (
            <TrendingChip key={i} topic={t} rank={i + 1} onPress={handleTrendingPress} />
          ))}
        </View>
      )}

      <View style={styles.sectionDivider} />

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <>
          <View style={styles.sectionHeaderWithClear}>
            <Text style={[styles.sectionTitle, { fontSize: ms(17) }]}>RECENT SEARCHES</Text>
            <TouchableOpacity onPress={clearRecent} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>
          {/* <View style={styles.sectionUnderline} /> */}
          {/* <View style={styles.greyLine} /> */}
          <View style={styles.chipRow}>
            {recentSearches.map((q, i) => (
              <RecentChip key={i} query={q} onPress={handleRecentPress} onRemove={removeRecent} />
            ))}
          </View>
        </>
      )}

      <View style={styles.sectionDivider} />

      {/* Top10 Most Viewed */}
      <View>
        <SectionHeader title="அதிகம் பார்த்தவைகள்" />
        <View style={styles.top10Container}>
          {top10Data.slice(0, 5).map((item, index) => (
            <Top10Item
              key={item.id || item.newsid || index}
              item={item}
              index={index}
              onPress={handleItemPress}
              onCategoryPress={handleCategoryPress}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <TopMenuStrip
        onMenuPress={handleMenuPress}
        onNotification={handleNotification}
        notifCount={3}
        navigation={navigation}
      />

      <AppHeaderComponent
        onMenu={() => setIsDrawerVisible(true)}
        onLocation={() => setIsLocationDrawerVisible(true)}
        selectedDistrict={selectedDistrict}
      />

      {/* ── Search Bar ── */}
      <View style={styles.searchBar}>
        <View style={styles.inputWrap}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="தேடுக..."
            placeholderTextColor="#999"
            value={query}
            onChangeText={onChangeText}
            onSubmitEditing={() => { clearTimeout(debounceRef.current); triggerSearch(query); }}
            returnKeyType="search"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={() => setVoiceModal(true)} style={styles.micBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="mic-outline" size={ms(20)} color="#1565C0" />
          </TouchableOpacity>
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={ms(18)} color="#aaa" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={() => { clearTimeout(debounceRef.current); triggerSearch(query); }} activeOpacity={0.85}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* ── Voice Modal ── */}
      <VoiceSearchModal
        visible={voiceModal}
        onClose={() => setVoiceModal(false)}
        onResult={(text) => { setQuery(text); triggerSearch(text); }}
      />

      {/* ── Pre-search ── */}
      {!hasSearched && renderPreSearch()}

      {/* Category Tabs */}
      {hasSearched && categoryFilter.length > 0 && (
        <CategoryTabs tabs={categoryFilter} active={activeTab} onSelect={handleTabSelect} />
      )}

      {/* ── Results ── */}
      {hasSearched && (
        isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#1565C0" />
            <Text style={styles.loadingText}>தேடுகிறோம்...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={ms(40)} color="#e53935" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => triggerSearch(query)}>
              <Text style={styles.retryBtnText}>மீண்டும் முயற்சி</Text>
            </TouchableOpacity>
          </View>
        ) : filteredResults.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="search-outline" size={ms(48)} color="#ccc" />
            <Text style={styles.emptyText}>முடிவுகள் எதுவும் இல்லை</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredResults}
            keyExtractor={(item, i) => String(item.id || item.newsid || i)}
            renderItem={({ item }) => <SearchResultItem item={item} onPress={handleItemPress} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() =>
              isLoadingMore ? (
                <View style={styles.loadMoreFooter}>
                  <ActivityIndicator size="small" color="#1565C0" />
                </View>
              ) : null
            }
          />
        )
      )}

      {/* ── Scroll to top ── */}
      {showScrollTop && (
        <TouchableOpacity style={styles.scrollTopBtn} onPress={scrollToTop} activeOpacity={0.85}>
          <Ionicons name="arrow-up" size={s(20)} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PALETTE.grey100,
    paddingTop: Platform.OS === 'android' ? vs(0) : 0,
  },

  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e5e5',
    gap: s(8),
    backgroundColor: '#fff',
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: ms(6),
    paddingHorizontal: s(10),
    height: vs(38),
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    fontSize: ms(14),
    color: '#111',
    paddingVertical: 0,
    fontFamily: getFontFamily(400),
  },
  micBtn: { paddingHorizontal: s(4) },
  clearBtn: { paddingLeft: s(4) },
  searchBtn: {
    backgroundColor: '#1565C0',
    paddingHorizontal: s(18),
    height: vs(38),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: ms(6),
  },
  searchBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: ms(13),
    fontFamily: getFontFamily(700),
  },

  // Pre-search
  preWrap: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: s(14),
  },

  // Section
  sectionHeader: {
    paddingVertical: vs(12),
  },
  sectionHeaderWithClear: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vs(12),
  },
  sectionTitle: {
    fontSize: ms(17),
     color: '#111',
    fontFamily: FONTS.muktaMalar.bold,
  },
  clearAllText: {
    fontSize: ms(13),
    color: '#1565C0',
    fontFamily: getFontFamily(400),
  },
  sectionUnderline: {
    height: 3,
    backgroundColor: '#1565C0',
    width: s(40),
    marginTop: vs(4),
    borderRadius: s(2),
  },
  greyLine: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginTop: vs(8),
  },
  sectionDivider: {
    height: 0.5,
    backgroundColor: '#eee',
    marginVertical: vs(6),
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(8),
    paddingBottom: vs(10),
  },

  // Trending chip
  trendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#ccc',
    borderRadius: ms(20),
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
    backgroundColor: '#fff',
    gap: s(6),
  },
  trendChipText: {
    fontSize: ms(13),
    color: '#333',
    fontFamily: getFontFamily(400),
  },
  rankBadge: {
    width: s(18),
    height: s(18),
    borderRadius: s(9),
    backgroundColor: '#e8eaf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadgeTop: { backgroundColor: '#1565C0' },
  rankText: {
    fontSize: ms(10),
    fontWeight: '700',
    color: '#3949ab',
  },
  rankTextTop: { color: '#fff' },

  // Recent chip
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#ddd',
    borderRadius: ms(20),
    paddingHorizontal: s(12),
    paddingVertical: vs(5),
    backgroundColor: '#fafafa',
    gap: s(4),
  },
  recentChipBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(5),
  },
  recentChipText: {
    fontSize: ms(13),
    color: '#444',
    fontFamily: getFontFamily(400),
  },

  // Category tabs — update these existing keys in styles
  tabsWrap: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    height: vs(44),           // ← add this
  },
  tabsContent: {
    paddingHorizontal: s(8),
    alignItems: 'center',
    flexDirection: 'row',
    height: vs(44),           // ← add this
  },
  tab: {
    paddingHorizontal: s(14),
    height: vs(44),           // ← change from paddingVertical to height
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
    marginRight: s(2),
  },
  tabActive: { borderBottomColor: '#1565C0' },
  tabText: { fontSize: ms(13), color: '#666', fontFamily: getFontFamily(400) },
  tabTextActive: { color: '#1565C0', fontWeight: '700', fontFamily: getFontFamily(700) },

  // Result card
  resultCard: {
    backgroundColor: '#fff',
    marginHorizontal: s(12),
    marginBottom: vs(10),
    // borderRadius: ms(6),
    overflow: 'hidden',
  },
  resultImageWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  resultImageWrapPhoto: { aspectRatio: 1 },
  resultImage: { width: '100%', height: '100%' },
  playOverlay: {
    position: 'absolute',
    bottom: vs(8),
    left: s(8),
  },
  playCircle: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    backgroundColor: 'rgba(9,109,210,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: s(2),
  },
  imageOverlay: {
    position: 'absolute',
    bottom: vs(6),
    left: s(6),
    backgroundColor: 'rgba(9,109,210,0.8)',
    borderRadius: s(4),
    padding: s(4),
  },
  resultBody: { padding: vs(10) },
  commentWrap: { flexDirection: 'row', alignItems: 'center' },
  commentCount: { fontSize: ms(12), color: '#555', fontFamily: getFontFamily(400) },

  // States
  listContent: { paddingBottom: vs(30), backgroundColor: '#f2f2f2', paddingTop: vs(8) },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: vs(10), padding: s(24) },
  loadingText: { fontSize: ms(13), color: '#666', fontFamily: getFontFamily(400) },
  errorText: { fontSize: ms(14), color: '#c62828', textAlign: 'center', fontFamily: getFontFamily(400) },
  emptyText: { fontSize: ms(14), color: '#999', fontFamily: getFontFamily(400) },
  emptyHint: { fontSize: ms(13), color: '#bbb', paddingVertical: vs(8), fontFamily: getFontFamily(400) },
  retryBtn: {
    backgroundColor: '#1565C0',
    paddingHorizontal: s(24),
    paddingVertical: vs(8),
    borderRadius: ms(20),
    marginTop: vs(4),
  },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: ms(13), fontFamily: getFontFamily(700) },
  loadMoreFooter: { paddingVertical: vs(16), alignItems: 'center' },
  scrollTopBtn: {
    position: 'absolute',
    bottom: vs(50),
    right: s(16),
    width: s(42),
    height: s(42),
    borderRadius: s(21),
    backgroundColor: '#096dd2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: vs(2) },
    shadowOpacity: 0.22,
    shadowRadius: s(4),
  },

  // Top10 Most Viewed Styles
  top10Container: {
    paddingBottom: vs(8),
  },
  top10Item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  top10Rank: {
    width: s(24),
    height: s(24),
    borderRadius: s(12),
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: s(10),
    marginTop: vs(8),
  },
  top10RankText: {
    fontSize: ms(12),
    fontWeight: '700',
    color: '#fff',
    fontFamily: getFontFamily(700),
  },
  top10CardWrap: {
    flex: 1,
  },
});