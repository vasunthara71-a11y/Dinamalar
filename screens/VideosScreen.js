import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import RenderHtml from 'react-native-render-html';
import AppHeaderComponent from '../components/AppHeaderComponent';
import TopMenuStrip from '../components/TopMenuStrip';
import CommentsModal from '../components/CommentsModal';
import DrawerMenu from '../components/DrawerMenu';
import LocationDrawer from '../components/LocationDrawer';
import { ms, s, vs } from '../utils/scaling';
import { CDNApi, API_ENDPOINTS } from '../config/api';
import { FONTS } from '../utils/constants';
import { useFontSize } from '../context/FontSizeContext';
import WebView from 'react-native-webview';

// ─── Palette ────────────────────────────────────────────────────────────────────
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

// ─── Constants ────────────────────────────────────────────────────────────────────
const AD_INTERVAL = 4; // Insert ad after every 4 videos

// ─── Helpers ────────────────────────────────────────────────────────────────────
const getTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) { const m = Math.floor(diff / 60); return `${m} minute${m > 1 ? 's' : ''} ago`; }
  if (diff < 86400) { const h = Math.floor(diff / 3600); return `${h} hour${h > 1 ? 's' : ''} ago`; }
  return dateStr.split(' ')[0];
};

// ─── Play Icon ──────────────────────────────────────────────────────────────────
const PlayIcon = ({ size = 28 }) => (
  <View style={[styles.playCircle, { width: size, height: size, borderRadius: size / 2 }]}>
    <View style={[styles.playTriangle, {
      borderTopWidth: size * 0.22,
      borderBottomWidth: size * 0.22,
      borderLeftWidth: size * 0.36,
      marginLeft: size * 0.07,
    }]} />
  </View>
);

// ─── Short Card (HomeScreen ShortsCard style) ───────────────────────────────────
const ShortCard = ({ video, onPress }) => {
  const { sf } = useFontSize();
  const title = video.title || video.videotitle || '';
  const hasImage = !!video.images;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress?.(video)}
      style={styles.shortCard}
    >
      <View style={styles.shortCardImageContainer}>
        <Image
          source={{
            uri: hasImage
              ? video.images
              : 'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400',
          }}
          style={styles.shortCardImage}
          resizeMode="cover"
        />
        {/* Play overlay */}
        <View style={styles.shortCardPlayOverlay}>
          <View style={styles.shortCardPlayButton}>
            <Ionicons name="videocam" size={s(12)} color="#fff" />
          </View>
        </View>
        {/* Title at bottom */}
        {!!title && (
          <View style={styles.shortCardTitleOverlay}>
            <Text style={[styles.shortCardBottomTitle, { fontSize: sf(10) }]} numberOfLines={2}>
              {title}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─── Shorts Section Row (horizontal scroll strip) ───────────────────────────────
// Now receives `items` (the grouped reels for this strip) instead of all shorts
const ShortsSectionRow = ({ items, onPress }) => {
  const { sf } = useFontSize();
  if (!items || items.length === 0) return null;

  return (
    <View style={styles.shortsSectionContainer}>
      {/* <View style={styles.shortsSectionHeader}>
        <View style={styles.shortsSectionTitleWrap}>
          <Text style={[styles.shortsSectionTitle, { fontSize: sf(14) }]}>Shorts</Text>
          <View style={styles.shortsSectionUnderline} />
        </View>
      </View> */}
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

// ─── Video Card ─────────────────────────────────────────────────────────────────
const VideoCard = ({ video, onPress, onCommentsPress, districtLabel }) => {
  const { sf } = useFontSize();

  // Skip reels — they render in the shorts strip
  if (video.type === 'reels') return null;

  // Skip ads mixed into videomix.data
  if (video.type === 'googlead') return null;

  const timeAgo = getTimeAgo(video.videodate);
  const commentCount = parseInt(video.nmcomment || 0);

  // If a district is selected, show the district name as the pill label
  // Otherwise show the video's own category title
  const pillLabel = districtLabel || video.ctitle || video.maincat || '';

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={() => onPress?.(video)} style={styles.card}>
      <View style={styles.thumbWrap}>
        {video.images ? (
          <Image source={{ uri: video.images }} style={[styles.thumbnail,]} resizeMode="cover" />
        ) : (
          <View style={[styles.thumbnail, styles.thumbPlaceholder]}>
            <Text style={styles.thumbPlaceholderIcon}>🎬</Text>
          </View>
        )}
        <View style={styles.thumbOverlay} />
        <View style={styles.thumbPlayBtn}>
          <PlayIcon size={28} />
        </View>
        {!!video.duration && (
          <View style={styles.durationBadge}>
            <Text style={[styles.durationText, { fontSize: sf(11) }]}>{video.duration}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={[styles.videoTitle, { fontSize: sf(14), lineHeight: sf(20) }]}>{video.videotitle}</Text>
        <Text style={[styles.metaDate, { fontSize: sf(12) }]}>{timeAgo || video.standarddate}</Text>
        <View style={styles.cardMeta}>
          <View style={styles.cardMetaLeft}>
            {!!pillLabel && (
              <View style={[styles.categoryPill]}>
                {/* {districtLabel && (
                  <Ionicons name="location" size={s(10)} color={PALETTE.primary} style={{ marginRight: s(3) }} />
                )} */}
                <Text style={[styles.categoryPillText, { fontSize: sf(12) }]}>
                  {pillLabel}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.cardMetaRight}>
            <TouchableOpacity style={styles.commentBtn} onPress={() => onCommentsPress?.(video)} activeOpacity={0.8}>
              <Ionicons name="chatbox" size={ms(20)} color={PALETTE.grey600} />
              {commentCount > 0 && (
                <Text style={[styles.commentCount, { fontSize: sf(12) }]}>{commentCount}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Chip ────────────────────────────────────────────────────────────────────────
const Chip = ({ label, active, onPress }) => {
  const { sf } = useFontSize();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      activeOpacity={0.8}
    >
      {active && <Ionicons name="checkmark" size={13} color={PALETTE.white} style={{ marginRight: 4, }} />}
      <Text style={[styles.chipText, active && styles.chipTextActive, { fontSize: sf(13) }]}>{label}</Text>
    </TouchableOpacity>
  );
};

// ─── Filter Sheet ────────────────────────────────────────────────────────────────
const FilterSheet = ({
  visible, onClose,
  filterOptions, selectedFilter, onSelectFilter,
  districtOptions, selectedDistrict, onSelectDistrict,
  onClearAll,
}) => {
  const { sf } = useFontSize();
  const hasActive = !!selectedFilter || !!selectedDistrict;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.filterSheet}>
          {/* Drag handle */}
          <View style={styles.sheetHandle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            contentContainerStyle={{ paddingBottom: vs(20) }}
          >
            {/* Header */}
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { fontSize: sf(16) }]}>Video Filters</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(8) }}>
                {/* {hasActive && (
                  <TouchableOpacity onPress={onClearAll} style={styles.clearBtn} activeOpacity={0.8}>
                    <Text style={[styles.clearBtnTxt, { fontSize: sf(12) }]}>நீக்கு</Text>
                  </TouchableOpacity>
                )} */}
                <TouchableOpacity onPress={onClose} style={styles.sheetCloseBtn}>
                  <Ionicons name="close" size={s(22)} color={PALETTE.grey700} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Active selection summary */}
            {/* {hasActive && (
              <View style={styles.activeSummary}>
                <Ionicons name="funnel" size={s(13)} color={PALETTE.primary} />
                <Text style={[styles.activeSummaryTxt, { fontSize: sf(12) }]} numberOfLines={1}>
                  {[
                    filterOptions.find(f => f.ename === selectedFilter)?.name,
                    districtOptions.find(d => String(d.id) === selectedDistrict)?.title,
                  ].filter(Boolean).join('  •  ')}
                </Text>
              </View>
            )} */}

            {/* ── Date filter section ── */}
            {filterOptions.length > 0 && (
              <View style={[styles.filterSection, { paddingBottom: vs(12) }]}>
                <View style={styles.filterSectionRow}>
                  <Text style={[styles.filterSectionLabel, { fontSize: sf(14) }]}>பதிவேற்றம் :  ( All )</Text>
                  {/* {!!selectedFilter && (
                    <TouchableOpacity onPress={() => onSelectFilter(selectedFilter)}>
                      <Text style={[styles.sectionClearTxt, { fontSize: sf(11) }]}>நீக்கு</Text>
                    </TouchableOpacity>
                  )} */}
                </View>
                <View style={styles.chipRow}>
                  {filterOptions.map((item) => (
                    <Chip
                      key={`filter_${item.id}`}
                      label={item.name}
                      active={selectedFilter === item.ename}
                      onPress={() => onSelectFilter(item.ename)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* ── District section — horizontally scrollable, no wrap ── */}
            {districtOptions.length > 0 && (
              <>
                <View style={styles.sheetDivider} />
                <View style={[styles.filterSection, { paddingBottom: vs(12) }]}>
                  <View style={styles.filterSectionRow}>
                    <Text style={[styles.filterSectionLabel, { fontSize: sf(14) }]}>மாவட்ட வீடியோக்கள் :</Text>
                    {/* {!!selectedDistrict && (
                      <TouchableOpacity onPress={() => onSelectDistrict(selectedDistrict)}>
                        <Text style={[styles.sectionClearTxt, { fontSize: sf(11) }]}>நீக்கு</Text>
                      </TouchableOpacity>
                    )} */}
                  </View>
                  <ScrollView
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                    style={{ maxHeight: vs(250) }}
                    contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: s(8), paddingBottom: vs(4) }}
                  >
                    {districtOptions
                      .filter((d) => !!d.id)
                      .map((item) => (
                        <Chip
                          key={`district_${item.id}`}
                          label={item.title}
                          active={selectedDistrict === String(item.id)}
                          onPress={() => onSelectDistrict(String(item.id))}
                        />
                      ))}
                  </ScrollView>
                </View>
              </>
            )}

            {/* Apply button */}
            {/* <View style={styles.sheetFooter}>
              <TouchableOpacity style={styles.applyBtn} onPress={onClose} activeOpacity={0.88}>
                <Text style={[styles.applyBtnTxt, { fontSize: sf(14) }]}>முடிந்தது</Text>
              </TouchableOpacity>
            </View> */}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ─── Taboola Widget ───────────────────────────────────────────────────────────
const TABOOLA_PUBLISHER_ID = 'mdinamalarcom';

function TaboolaWidget({ pageUrl, mode, container, placement, pageType = 'homepage', targetType = 'mix' }) {
  const [height, setHeight] = useState(1);
  if (!mode || !container || !placement || !pageUrl) return null;
  const safe = (str) => String(str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"><style>*{margin:0;padding:0;box-sizing:border-box}html,body{background:#fff;overflow-x:hidden;width:100%}#${safe(container)}{width:100%;min-height:1px}img{max-width:100%!important;width:100%!important;height:auto!important;display:block!important;object-fit:cover!important;object-position:center center!important}</style></head><body><div id="${safe(container)}"></div><script>window._taboola=window._taboola||[];_taboola.push({${safe(pageType)}:'auto'});_taboola.push({mode:'${safe(mode)}',container:'${safe(container)}',placement:'${safe(placement)}',target_type:'${safe(targetType)}'});</script><script>(function(){var s=document.createElement('script');s.type='text/javascript';s.async=true;s.src='https://cdn.taboola.com/libtrc/${TABOOLA_PUBLISHER_ID}/loader.js';s.id='tb_loader_script';s.onload=function(){_taboola.push({flush:true});};if(!document.getElementById('tb_loader_script')){document.head.appendChild(s);}else{_taboola.push({flush:true});}})();</script><script>var lH=0;function gH(){return Math.max(document.body.scrollHeight,document.body.offsetHeight,document.documentElement.scrollHeight);}function sH(){setTimeout(function(){var h=gH();if(h>50&&h>lH){lH=h;window.ReactNativeWebView.postMessage(JSON.stringify({type:'height',value:h}));}},200);}function wI(){var imgs=document.querySelectorAll('img');if(!imgs.length){sH();return;}var p=0;imgs.forEach(function(img){if(!img.complete){p++;img.addEventListener('load',function(){if(!--p)sH();});img.addEventListener('error',function(){if(!--p)sH();});}});if(!p)sH();}var pc=0;function poll(){wI();if(pc++<75)setTimeout(poll,400);}setTimeout(poll,500);if(typeof MutationObserver!=='undefined'){new MutationObserver(function(){wI();}).observe(document.body,{childList:true,subtree:true,attributes:false});}</script></body></html>`;
  return (
    <View style={{ width: '100%', height, backgroundColor: '#fff', overflow: 'hidden', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F4F6F8' }}>
      <WebView
        source={{ html, baseUrl: 'https://www.dinamalar.com' }}
        style={{ width: '100%', height }}
        scrollEnabled={false} javaScriptEnabled domStorageEnabled
        thirdPartyCookiesEnabled mixedContentMode="always"
        originWhitelist={['*']} allowsInlineMediaPlayback
        onMessage={(e) => {
          try {
            const m = JSON.parse(e.nativeEvent.data);
            if (m.type === 'height' && m.value > 50) setHeight(p => Math.max(p, m.value));
          } catch {
            const h = parseInt(e.nativeEvent.data, 10);
            if (!isNaN(h) && h > 50) setHeight(p => Math.max(p, h));
          }
        }}
        nestedScrollEnabled={false}
      />
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────────
const VideosScreen = ({ navigation, route }) => {
  const { sf } = useFontSize();

  const initialTabKey = route?.params?.initialTabKey || '';

  // Add this ref to track if we've applied the initial tab
  const initialTabApplied = useRef(false);

  // Map tab key to Tamil/English keywords to match against API category titles
  const TAB_KEY_KEYWORDS = {
    'live': ['live', 'நேரலை', 'லைவ்'],
    'விளையாட்டு': ['விளையாட்டு', 'sport', 'Sports'],
    'சினிமா': ['சினிமா', 'cinema', 'Cinema'],
  };

  // Add this after your existing useState declarations:
  const initialCategory = route?.params?.initialCategory || '';
  const hasFetchedOnce = useRef(false);

  // ── API data ──────────────────────────────────────────────────────────────────
  const [allVideos, setAllVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterOptions, setFilterOptions] = useState([]);   // api.filter
  const [districtOptions, setDistrictOptions] = useState([]);   // api.districtlist.data

  // ── Pagination state ────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [taboolaAds, setTaboolaAds] = useState(null);

  // ── UI state ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('');   // ename: weekly/monthly/yearly
  const [selectedDistrict, setSelectedDistrict] = useState('');   // district id string
  const [selectedDistrictLabel, setSelectedDistrictLabel] = useState('உள்ளூர்');
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isLocDrawerOpen, setIsLocDrawerOpen] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const flatListRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // ── Fetch: CDNApi + API_ENDPOINTS.VIDEO_MAIN (/videomain) ────────────────────
  const fetchVideos = useCallback(async ({ cat = '', date = '', district = '', page = 1, append = false } = {}) => {
    console.log('[VideosScreen] fetchVideos called with params:', { cat, date, district, page, append }); // Debug all params

    if (!append) {
      setLoading(true);
      setCurrentPage(1);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    let endpoint = '';

    try {
      const params = new URLSearchParams();

      if (district) {
        // District filter — use VIDEO_MAIN with cat=1585&districtid=xxx
        params.append('cat', '1585');
        params.append('districtid', district);
        if (date) params.append('date', date);
        if (page > 1) params.append('page', String(page));

        const query = params.toString();
        endpoint = `${API_ENDPOINTS.VIDEO_MAIN}?${query}`;
      } else {
        if (cat === 'shorts') {
          endpoint = API_ENDPOINTS.SHORTS;
          if (page > 1) {
            setHasMore(false);
            return;
          }
        } else {
          if (cat) params.append('cat', cat);
          if (date) params.append('date', date);
          if (page > 1) params.append('page', String(page));

          const query = params.toString();
          endpoint = query
            ? `${API_ENDPOINTS.VIDEO_MAIN}?${query}`
            : API_ENDPOINTS.VIDEO_MAIN;
        }
      }

      console.log('[VideosScreen] fetching:', endpoint); // ← helps debug

      const response = await CDNApi.get(endpoint);
      const data = response.data;

      console.log('[VideosScreen] API response received, data keys:', Object.keys(data || {}));
      console.log('[VideosScreen] Current category:', cat || 'All');
      console.log('[VideosScreen] Endpoint used:', endpoint.includes('videomain') ? 'VIDEO_MAIN' : 'VIDEO_DATA');

      if (cat === '5050') {
        console.log('[VideosScreen] LIVE TAB API response structure:', JSON.stringify(data, null, 2));
      } else if (cat === '') {
        console.log('[VideosScreen] ALL TAB API response structure:', JSON.stringify(data, null, 2));
      } else if (cat) {
        console.log('[VideosScreen] CATEGORY TAB API response for cat=' + cat + ':', JSON.stringify(data, null, 2));
      }

      let raw = [];
      let pagination = {};

      if (cat === 'shorts') {
        raw = Array.isArray(data) ? data : [];
        pagination = {};
      } else {
        // Both regular and district filtered requests use videomix.data
        raw = data?.videomix?.data ?? [];
        pagination = data?.videomix || {};
      }

      let newsVideos;
      if (cat === 'shorts') {
        newsVideos = raw;
      } else {
        // For district filter (cat=1585) and all others, use all items as-is
        // API already filters by district server-side via districtid param
        newsVideos = raw;
      }

      console.log('[VideosScreen] Total videos received:', raw.length);
      console.log('[VideosScreen] Videos after type filter:', newsVideos.length);
      console.log('[VideosScreen] Raw data sample:', raw.slice(0, 2));

      // API handles district filtering server-side — no client-side filtering needed
      let finalVideos = newsVideos;

      if (append) {
        setAllVideos(prev => {
          const existingIds = new Set(prev.map(v => v.videoid).filter(Boolean));
          const newItems = finalVideos.filter(v => !v.videoid || !existingIds.has(v.videoid));
          return [...prev, ...newItems];
        });
      } else {
        setAllVideos(finalVideos);
      }
      if (data?.taboola_ads?.mobile) {
        setTaboolaAds(prev => prev ?? data.taboola_ads.mobile);
      }

      setCurrentPage(pagination.current_page || page);
      setLastPage(pagination.last_page || 1);
      setHasMore((pagination.current_page || page) < (pagination.last_page || 1));

      if (data?.category?.length) {
        setCategories(prev => {
          if (prev.length > 0) return prev;
          const seen = new Set();
          return data.category.filter((c) => {
            const k = String(c.value ?? '');
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          });
        });
      }

      if (data?.filter?.length) {
        setFilterOptions(prev => prev.length > 0 ? prev : data.filter);
      }

      if (data?.districtlist?.data?.length) {
        setDistrictOptions(prev => prev.length > 0 ? prev : data.districtlist.data);
      }

    } catch (err) {
      console.error('VideosScreen fetch error:', err?.message);
      console.error('VideosScreen fetch error details:', err);
      console.error('VideosScreen fetch error code:', err?.code);
      console.error('VideosScreen fetch error status:', err?.response?.status);
      console.error('VideosScreen endpoint:', endpoint);

      if (err?.code === 'ERR_NETWORK' || err?.message?.includes('Network Error')) {
        setError('இணைப்பு பிழை. இணைய இணைப்பை சரிபார்க்கவும்.');
      } else {
        setError(err?.message || 'பிழை ஏற்பட்டது');
      }
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  }, []);

  const handleScroll = useCallback((e) => {
    setShowScrollTop(e.nativeEvent.contentOffset.y > 300);
  }, []);

  useEffect(() => {
    if (!initialTabKey || initialTabApplied.current) return;
    if (categories.length === 0) return;  // wait for categories to load

    const keywords = TAB_KEY_KEYWORDS[initialTabKey] || [];
    const matched = categories.find(cat =>
      keywords.some(kw =>
        (cat.title || '').toLowerCase().includes(kw.toLowerCase())
      )
    );

    if (matched) {
      initialTabApplied.current = true;
      const catValue = String(matched.value ?? '');
      setActiveCategory(catValue);
      fetchVideos({ cat: catValue });
    }
  }, [categories, initialTabKey]);
  useEffect(() => {
    if (!initialTabKey) {
      fetchVideos();
    }
  }, [fetchVideos]);

  useEffect(() => {
    if (initialCategory) {
      setActiveCategory(initialCategory);
      fetchVideos({ cat: initialCategory });
    } else {
      fetchVideos();
    }
  }, [fetchVideos, initialCategory]);
  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!hasFetchedOnce.current) {
        hasFetchedOnce.current = true;
        // Initial fetch — don't override, let the initialTabKey effect handle it
        if (!initialTabKey) {
          fetchVideos();
        }
      }
    }, [fetchVideos, initialTabKey])
  );

  // ── Category tab press ────────────────────────────────────────────────────────
  const handleCategoryPress = (value) => {
    setActiveCategory(value);
    setSelectedFilter('');
    setSelectedDistrict('');

    if (value === '1585' || value?.toString() === '1585') {
      fetchVideos({ cat: value, date: '', district: selectedDistrict || '' });
    } else {
      fetchVideos({ cat: value, date: '', district: '' });
    }
  };

  // ── Date filter press — keeps district selection ──────────────────────────────
  const handleSelectFilter = (ename) => {
    const nextFilter = selectedFilter === ename ? '' : ename;
    setSelectedFilter(nextFilter);
    setActiveCategory('');
    // Keep selectedDistrict — if district is also selected, filter by both
    fetchVideos({
      cat: '',
      date: nextFilter,
      district: selectedDistrict, // keep current district
    });
    setFilterVisible(false);
  };

  // ── District press — keeps date filter selection ──────────────────────────────
  const handleSelectDistrict = (id) => {
    const nextDistrict = selectedDistrict === id ? '' : id;
    setSelectedDistrict(nextDistrict);
    setActiveCategory('');
    // Keep selectedFilter — if date is also selected, filter by both
    fetchVideos({
      cat: '',
      date: selectedFilter, // keep current date filter
      district: nextDistrict,
    });
    setFilterVisible(false);
  };

  // ── District selection for LocationDrawer (matches VideoDetailScreen) ──────
  const handleLocationSelectDistrict = (district) => {
    setSelectedDistrictLabel(district.title);
    setIsLocDrawerOpen(false);
    if (district.id) {
      setSelectedDistrict(String(district.id));
      // Fetch videos for selected district
      fetchVideos({ cat: '1585', date: '', district: String(district.id) });
    }
  };

  // ── Nav ───────────────────────────────────────────────────────────────────────
  const handleMenuPress = (menuItem) => {
    // Debug: Log the menu item structure
    console.log('TopMenuStrip menu item clicked:', menuItem);

    // Handle menu item navigation based on menu item properties
    if (menuItem?.screen_name) {
      console.log('Navigating to screen:', menuItem.screen_name);
      navigation?.navigate?.(menuItem.screen_name);
    } else if (menuItem?.url) {
      // Handle URL navigation if needed
      console.log('Navigate to URL:', menuItem.url);
    } else if (menuItem?.Title || menuItem?.title) {
      // Try to navigate based on title
      const title = menuItem.Title || menuItem.title;
      console.log('Menu title:', title);

      // Map common titles to screen names
      const screenMapping = {
        'Home': 'HomeScreen',
        'Videos': 'VideosScreen',
        'News': 'NewsScreen',
        'Cinema': 'CinemaScreen',
        'Sports': 'SportsScreen',
        'Business': 'BusinessScreen',
        'Technology': 'TechnologyScreen',
        'Health': 'HealthScreen',
        'Education': 'EducationScreen',
        'வீடியோ': 'VideosScreen',
        'செய்திகள்': 'NewsScreen',
        'சினிமா': 'CinemaScreen',
        'விளையாடம்': 'SportsScreen',
      };

      const targetScreen = screenMapping[title];
      if (targetScreen) {
        console.log('Mapped title to screen:', targetScreen);
        navigation?.navigate?.(targetScreen);
      } else {
        console.log('No screen mapping found for title:', title);
        // Fallback to opening drawer
        navigation?.openDrawer?.();
      }
    } else {
      console.log('No navigation info found, opening drawer');
      // Fallback to opening drawer if no specific navigation is defined
      navigation?.openDrawer?.();
    }
  };
  const handleSearch = () => navigation?.navigate?.('Search');
  const handleNotification = () => console.log('Notifications');

  // ── Comment press handler ─────────────────────────────────────────────────────
  const handleCommentsPress = (video) => {
    setSelectedVideo(video);
    setCommentsVisible(true);
  };

  const hasActiveFilter = !!selectedFilter || !!selectedDistrict;

  const activeFilterLabel =
    filterOptions.find((f) => f.ename === selectedFilter)?.name;
  const activeDistrictLabel =
    districtOptions.find((d) => String(d.id) === selectedDistrict)?.title;

  // ── Build listData preserving API order ───────────────────────────────────────
  // Walks allVideos in original order.
  // Consecutive reels get buffered and flushed as a single shorts_strip item.
  // Result: [video, video, shorts_strip([r,r,r]), video, shorts_strip([r]), video...]
  const listData = useMemo(() => {
    if (allVideos.length === 0) return [];

    const result = [];
    let reelsBuffer = [];
    let adCounter = 0;
    let stripIndex = 0;

    const flushReels = () => {
      if (reelsBuffer.length === 0) return;
      result.push({
        _type: 'shorts_strip',
        _key: `shorts_strip_${stripIndex++}`,
        items: [...reelsBuffer],
      });
      reelsBuffer = [];
    };

    allVideos.forEach((video) => {
      if (video.type === 'reels') {
        // Accumulate consecutive reels together
        reelsBuffer.push(video);
      } else if (video.type === 'googlead') {
        // Skip googleads
        flushReels();
      } else {
        // Regular video — flush any buffered reels first
        flushReels();

        result.push({ ...video, _type: 'video' });
        adCounter++;

        // Insert taboola ad every AD_INTERVAL regular videos
        if (taboolaAds?.midmain && adCounter % AD_INTERVAL === 0) {
          result.push({
            _type: 'taboola_ad',
            _key: `taboola_${adCounter}`,
            ...taboolaAds.midmain,
          });
        }
      }
    });

    // Flush any remaining reels at the end
    flushReels();

    return result;
  }, [allVideos, taboolaAds]);

  // ── List header ───────────────────────────────────────────────────────────────
  const ListHeader = () => {
    if (loading) {
      return <VideoSkeletonLoader />;
    }

    return (
      <View>
        {/* Category tabs + Filter icon */}
        <View style={styles.catRow}>
          <TouchableOpacity
            style={[styles.filterIconBtn, hasActiveFilter && styles.filterIconBtnActive]}
            onPress={() => setFilterVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons
              name="filter"
              size={20}
              color={hasActiveFilter ? PALETTE.primary : PALETTE.grey600}
            />
            {hasActiveFilter && <View style={styles.filterDot} />}
          </TouchableOpacity>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catTabsContent}
            style={{ flex: 1 }}
          >
            {categories.map((cat, idx) => {
              const isActive = activeCategory === String(cat.value ?? '') && !selectedFilter;
              return (
                <TouchableOpacity
                  key={`cat_${cat.value ?? idx}`}
                  onPress={() => handleCategoryPress(String(cat.value ?? ''))}
                  style={[styles.catTab, isActive && styles.catTabActive]}
                  activeOpacity={0.8}
                >
                  {String(cat.value) === '5050' && (
                    <View style={[styles.liveDot, isActive && { backgroundColor: PALETTE.white }]} />
                  )}
                  <Text style={[styles.catTabText, isActive && styles.catTabTextActive, { fontSize: sf(12) }]}>
                    {cat.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Active filter bar — shown when a date filter is selected */}
        {/* {!!selectedFilter && (
          <View style={styles.activeFilterBar}>
            <Ionicons name="calendar-outline" size={s(14)} color={PALETTE.primary} />
            <Text style={[styles.activeFilterBarText, { fontSize: sf(12) }]}>
              {filterOptions.find(f => f.ename === selectedFilter)?.name || selectedFilter}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSelectedFilter('');
                fetchVideos({ cat: activeCategory, date: '', district: selectedDistrict });
              }}
              style={styles.activeFilterClearBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle" size={s(16)} color={PALETTE.primary} />
            </TouchableOpacity>
          </View>
        )} */}
      </View>
    );
  };

  // ── Load more handler ───────────────────────────────────────────────────────────
  const handleLoadMore = () => {
    if (!hasMore || loadingMore || loading) return;

    // Disable pagination for shorts tab only
    if (activeCategory === 'shorts') {
      console.log('[VideosScreen] Pagination disabled for shorts tab');
      setHasMore(false);
      return;
    }

    // Allow pagination for all other cases including date filters and category tabs
    fetchVideos({
      cat: activeCategory,
      date: selectedFilter,
      district: selectedDistrict,
      page: currentPage + 1,
      append: true,
    });
  };

  // ── Footer component ───────────────────────────────────────────────────────────
  const ListFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={PALETTE.primary} />
      </View>
    );
  };

  // ── Empty state component ───────────────────────────────────────────────────────
  const ListEmpty = () => {
    if (loading) return null;

    return (
      <View style={styles.centeredState}>
        <Text style={styles.stateIcon}>📭</Text>
        <Text style={[styles.stateText, { fontSize: sf(14) }]}>தகவல் இல்லை</Text>
        <Text style={[styles.stateSubText, { fontSize: sf(12) }]}>
          {selectedDistrict
            ? `${districtOptions.find(d => String(d.id) === selectedDistrict)?.title || ''} மாவட்டத்தில் இல்லை`
            : 'தகவல் இல்லை'
          }
        </Text>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.white} />

      <TopMenuStrip
        onMenuPress={handleMenuPress}
        onNotification={handleNotification}
        notifCount={3}
      />

      <AppHeaderComponent
        onSearch={() => navigation?.navigate('Search')}
        onMenu={() => setIsDrawerVisible(true)}
        onLocation={() => setIsLocDrawerOpen(true)}
        selectedDistrict={selectedDistrictLabel}
      />

      <FlatList
        ref={flatListRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        data={loading ? [] : listData}
        keyExtractor={(item, idx) => {
          if (item._type === 'shorts_strip') return item._key || `shorts_strip_${idx}`;
          if (item._type === 'taboola_ad') return item._key || `taboola_${idx}`;
          return item.videoid || item.id || `video_${idx}`;
        }}
        renderItem={({ item, index }) => {
          // ── Shorts strip ───────────────────────────────────────────────
          if (item._type === 'shorts_strip') {
            return (
              <ShortsSectionRow
                items={item.items}
                onPress={(v) => {
                  // Open shorts link in Chrome instead of VideoDetailScreen
                  const shortsLink = v.link || v.slug || `https://www.dinamalar.com/shorts/${v.id || v.videoid}`;
                  console.log('Opening shorts in Chrome:', shortsLink);
                  Linking.openURL(shortsLink).catch(err => console.error('Failed to open URL:', err));
                }}
              />
            );
          }
          // ── Taboola ad slot ──────────────────────────────────────────────
          if (item._type === 'taboola_ad') {
            return (
              <View style={{ paddingHorizontal: s(12), marginTop: vs(10) }}>
                <TaboolaWidget
                  pageUrl="https://www.dinamalar.com/videos"
                  mode={item.mode}
                  container={item.container}
                  placement={item.placement}
                  targetType={item.target_type}
                  pageType="video"
                />
              </View>
            );
          }
          // ── Regular video card ───────────────────────────────────────────
          return (
            <VideoCard
              video={item}
              onPress={(v) => navigation?.navigate?.('VideoDetailScreen', { video: v })}
              onCommentsPress={handleCommentsPress}
              districtLabel={selectedDistrict
                ? districtOptions.find(d => String(d.id) === selectedDistrict)?.title || ''
                : ''
              }
            />
          );
        }}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={ListEmpty}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
      />

      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        filterOptions={filterOptions}
        selectedFilter={selectedFilter}
        onSelectFilter={handleSelectFilter}
        districtOptions={districtOptions}
        selectedDistrict={selectedDistrict}
        onSelectDistrict={handleSelectDistrict}
        onClearAll={() => {
          setSelectedFilter('');
          setSelectedDistrict('');
          setActiveCategory('');
          fetchVideos({ cat: '', date: '', district: '' });
          setFilterVisible(false);
        }}
      />
      {/* Comments Modal */}
      <CommentsModal
        visible={commentsVisible}
        onClose={() => setCommentsVisible(false)}
        newsId={selectedVideo?.videoid}
        newsTitle={selectedVideo?.videotitle}
        commentCount={parseInt(selectedVideo?.nmcomment || 0)}
      />

      {/* Drawer Menu */}
      <DrawerMenu
        isVisible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
        onMenuPress={(menuItem) => {
          console.log('Drawer menu item clicked:', menuItem);
          // Handle drawer menu navigation
          if (menuItem?.screen_name) {
            navigation?.navigate?.(menuItem.screen_name);
          } else if (menuItem?.Title || menuItem?.title) {
            const title = menuItem.Title || menuItem.title;
            const screenMapping = {
              'Home': 'HomeScreen',
              'Videos': 'VideosScreen',
              'News': 'NewsScreen',
              'Cinema': 'CinemaScreen',
              'Sports': 'SportsScreen',
              'Business': 'BusinessScreen',
              'Technology': 'TechnologyScreen',
              'Health': 'HealthScreen',
              'Education': 'EducationScreen',
              'வீடியோ': 'VideosScreen',
              'செய்திகள்': 'NewsScreen',
              'சினிமா': 'CinemaScreen',
              'விளையாடம்': 'SportsScreen',
            };
            const targetScreen = screenMapping[title];
            if (targetScreen) {
              navigation?.navigate?.(targetScreen);
            }
          }
          setIsDrawerVisible(false);
        }}
        navigation={navigation}
      />

      {/* Location Drawer - matches VideoDetailScreen exactly */}
      <LocationDrawer
        isVisible={isLocDrawerOpen}
        onClose={() => setIsLocDrawerOpen(false)}
        onSelectDistrict={handleLocationSelectDistrict}
        selectedDistrict={selectedDistrictLabel}
      />

      {showScrollTop && (
        <TouchableOpacity
          style={styles.scrollTopBtn}
          onPress={() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true })}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-up" size={s(20)} color={PALETTE.white} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PALETTE.grey100,
    paddingTop: Platform.OS === 'android' ? vs(30) : 0,
  },

  // Category row
  catRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: PALETTE.white,
    borderBottomWidth: 1, borderBottomColor: PALETTE.grey300,
    paddingVertical: vs(8),
  },
  filterIconBtn: {
    marginHorizontal: s(10),
    width: s(36), height: s(36), borderRadius: s(8),
    backgroundColor: PALETTE.grey300,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: PALETTE.grey700
  },
  filterIconBtnActive: { backgroundColor: '#EBF5FF', borderWidth: 1, borderColor: PALETTE.primary },
  filterDot: {
    position: 'absolute', top: s(5), right: s(5),
    width: s(7), height: s(7), borderRadius: s(4),
    backgroundColor: PALETTE.primary,
    borderWidth: 1.5, borderColor: PALETTE.white,
  },
  catTabsContent: {
    paddingHorizontal: s(4), paddingRight: s(12),
    flexDirection: 'row', alignItems: 'center', gap: s(6),
  },
  catTab: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: s(14), paddingVertical: vs(7),
    borderRadius: s(20), borderWidth: 1.5,
    borderColor: PALETTE.grey300, backgroundColor: PALETTE.grey100, gap: s(4),
  },
  catTabActive: { backgroundColor: PALETTE.primary, },
  catTabText: { fontSize: ms(16), color: PALETTE.grey700, fontWeight: '500', fontFamily: FONTS.muktaMalar.semibold },
  catTabTextActive: { color: PALETTE.white, fontWeight: '700', fontFamily: FONTS.muktaMalar.bold },
  liveDot: { width: s(6), height: s(6), borderRadius: s(3), backgroundColor: PALETTE.red },

  // Active filter bar
  activeFilters: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: s(12), paddingVertical: vs(6),
    flexWrap: 'wrap', gap: s(6),
    backgroundColor: PALETTE.grey100,
    borderBottomWidth: 1, borderBottomColor: PALETTE.grey300,
  },
  activeFiltersLabel: { fontSize: 11, color: PALETTE.grey600 },
  activeTag: {
    backgroundColor: '#FFF0F0', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: '#FFD0D0',
  },
  activeTagText: { fontSize: ms(11), color: PALETTE.red, fontWeight: '700' },
  clearFilter: { fontSize: ms(11), color: PALETTE.red, fontWeight: '700' },

  // List
  listContent: { backgroundColor: PALETTE.grey200, paddingBottom: vs(80) },
  divider: { height: vs(6), backgroundColor: PALETTE.grey200 },

  // Active filter bar
  activeFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
    backgroundColor: '#EBF5FF',
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.primary + '30',
  },
  activeFilterBarText: {
    flex: 1,
    color: PALETTE.primary,
    fontFamily: FONTS.muktaMalar.semibold,
    fontWeight: '600',
  },
  activeFilterClearBtn: {
    padding: s(2),
  },

  // Card
  card: { backgroundColor: PALETTE.white, paddingHorizontal: ms(14) },
  thumbWrap: { width: '100%', aspectRatio: 16 / 9, backgroundColor: PALETTE.dark, position: 'relative' },
  thumbnail: { width: '100%', height: '100%' },
  thumbPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#2A2A2A' },
  thumbPlaceholderIcon: { fontSize: ms(40) },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbPlayBtn: { position: 'absolute', bottom: vs(8), left: s(10) },
  playCircle: {
    width: s(48),
    height: s(48),
    borderRadius: s(24),
    backgroundColor: 'rgba(9, 109, 210, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: s(3),
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  playTriangle: {
    width: 0, height: 0, borderStyle: 'solid',
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderLeftColor: PALETTE.white,
  },
  durationBadge: {
    position: 'absolute', bottom: 0, right: s(5),
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: s(7), paddingVertical: vs(2),
  },
  durationText: { color: PALETTE.white, fontSize: ms(15), fontWeight: '700' },
  commentIndicator: {
    position: 'absolute', top: s(8), right: s(8),
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: s(12),
    paddingHorizontal: s(6),
    paddingVertical: vs(3),
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(3),
  },
  commentCount: {
    color: PALETTE.grey600,
    fontWeight: '600',
    fontSize: ms(10),
  },
  watermarkWrap: { position: 'absolute', bottom: vs(10), left: s(46), flexDirection: 'row' },
  watermarkRed: { fontSize: ms(9), color: '#FF4444', fontWeight: '800', opacity: 0.85 },
  watermarkYellow: { fontSize: ms(9), color: '#FFD700', fontWeight: '800', opacity: 0.85 },
  cardBody: { gap: ms(5), marginVertical: ms(10) },
  videoTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    color: PALETTE.grey800,
    marginTop: vs(10),
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    flex: 1,
  },
  cardMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  commentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(3),
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
    borderRadius: s(4),
    backgroundColor: PALETTE.grey200,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(10),
    paddingVertical: vs(2),
    borderWidth: 1,
    borderColor: PALETTE.grey400,
  },
  categoryPillDistrict: {
    borderColor: PALETTE.primary,
    backgroundColor: '#EBF5FF',
  },
  categoryPillText: { fontSize: ms(11), color: PALETTE.grey600, fontWeight: '600', fontFamily: FONTS.muktaMalar.semibold },
  categoryPillTextDistrict: { color: PALETTE.primary },
  metaDate: {
    fontFamily: FONTS.muktaMalar.regular,
    color: PALETTE.grey600,
  },

  // Empty / error
  centeredState: { alignItems: 'center', paddingTop: vs(80), paddingBottom: vs(40), backgroundColor: PALETTE.grey200 },
  stateIcon: { fontSize: ms(48), marginBottom: vs(12) },
  stateText: { fontSize: ms(14), color: PALETTE.grey500, marginTop: vs(8), fontFamily: FONTS.muktaMalar.regular },
  stateSubText: { fontSize: ms(12), color: PALETTE.grey400, marginTop: vs(4), fontFamily: FONTS.muktaMalar.regular },
  retryBtn: { marginTop: vs(16), backgroundColor: PALETTE.red, borderRadius: s(8), paddingHorizontal: s(20), paddingVertical: vs(10) },
  retryBtnText: { color: PALETTE.white, fontWeight: '700', fontSize: ms(14), fontFamily: FONTS.muktaMalar.bold },

  // Filter sheet
  modalContainer: { flex: 1, position: 'relative' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  filterSheet: {
    backgroundColor: PALETTE.white,
    borderTopLeftRadius: s(22), borderTopRightRadius: s(22),
    paddingBottom: Platform.OS === 'ios' ? vs(36) : vs(24),
    maxHeight: '80%',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15, shadowRadius: 12,
  },
  sheetHandle: {
    width: s(36), height: vs(4), borderRadius: s(2),
    backgroundColor: PALETTE.grey300,
    alignSelf: 'center', marginTop: vs(10), marginBottom: vs(4),
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: s(20), paddingVertical: vs(8),
    borderBottomWidth: 1, borderBottomColor: PALETTE.grey300,
  },
  sheetTitle: { fontSize: ms(17), fontWeight: '700', color: PALETTE.grey600, fontFamily: FONTS.muktaMalar.bold },
  sheetCloseBtn: {
    // width: s(32), height: s(32), borderRadius: s(16),
    // backgroundColor: PALETTE.grey200,
    justifyContent: 'center', alignItems: 'center',
  },
  scrollTopBtn: {
    position: 'absolute',
    bottom: vs(24), right: s(16),
    width: s(48), height: s(48), borderRadius: s(24),
    backgroundColor: PALETTE.primary,
    justifyContent: 'center', alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: vs(2) },
    shadowOpacity: 0.22, shadowRadius: s(4),
    zIndex: 100,
  },
  clearBtn: {
    paddingHorizontal: s(12), paddingVertical: vs(5),
    borderRadius: s(14), borderWidth: 1, borderColor: PALETTE.red,
  },
  clearBtnTxt: { color: PALETTE.red, fontWeight: '700', fontFamily: FONTS.muktaMalar.bold },
  activeSummary: {
    flexDirection: 'row', alignItems: 'center', gap: s(6),
    paddingHorizontal: s(20), paddingVertical: vs(10),
    backgroundColor: PALETTE.primary + '12',
    borderBottomWidth: 1, borderBottomColor: PALETTE.primary + '30',
  },
  activeSummaryTxt: {
    color: PALETTE.primary, fontWeight: '600',
    fontFamily: FONTS.muktaMalar.semibold, flex: 1,
  },
  filterSectionRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: vs(12),
  },
  sectionClearTxt: { color: PALETTE.red, fontWeight: '600' },
  sheetDivider: {
    height: 1, backgroundColor: PALETTE.grey300,
    marginVertical: vs(4),
  },
  sheetFooter: {
    paddingHorizontal: s(20), paddingVertical: vs(12),
    borderTopWidth: 1, borderTopColor: PALETTE.grey200,
  },
  applyBtn: {
    backgroundColor: PALETTE.primary, borderRadius: s(10),
    paddingVertical: vs(13), alignItems: 'center',
  },
  applyBtnTxt: { color: PALETTE.white, fontWeight: '700', fontFamily: FONTS.muktaMalar.bold },

  // Filter sections
  filterSection: { paddingHorizontal: s(20), paddingTop: vs(18), paddingBottom: vs(4) },
  filterSectionLabel: {
    fontSize: ms(14), fontWeight: '700', color: PALETTE.grey800,
    fontFamily: FONTS.muktaMalar.bold,
  },

  // Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: s(10) },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: s(12), paddingVertical: vs(4),
    borderRadius: s(22), borderWidth: 1.5,
    borderColor: PALETTE.grey300, backgroundColor: PALETTE.white,
  },
  chipActive: { borderColor: PALETTE.primary, backgroundColor: PALETTE.primary },
  chipText: { fontSize: ms(13), color: PALETTE.grey800, fontWeight: '500', fontFamily: FONTS.muktaMalar.semibold },
  chipTextActive: { color: PALETTE.white, fontWeight: '700', fontFamily: FONTS.muktaMalar.bold },

  // Loading footer
  loadingFooter: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: vs(20), backgroundColor: PALETTE.grey200,
  },
  loadingText: {
    marginLeft: s(8), color: PALETTE.grey600, fontFamily: FONTS.muktaMalar.regular,
  },

  // ─── Short Card (HomeScreen ShortsCard style) ────────────────────────────────
  shortCard: {
    width: s(120),
    marginRight: s(12),
    flexShrink: 0,
  },
  shortCardImageContainer: {
    width: s(120),
    height: vs(200),
    borderRadius: s(8),
    overflow: 'hidden',
    backgroundColor: PALETTE.grey200,
  },
  shortCardImage: {
    width: s(120),
    height: vs(200),
  },
  shortCardPlayOverlay: {
    position: 'absolute',
    top: 0, left: 0,
    width: s(120),
    height: vs(200),
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.3)',
  },
  shortCardPlayButton: {
    position: 'absolute',
    top: s(8),
    right: s(8),
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: s(2),
  },
  shortCardTitleOverlay: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: vs(6),
    paddingHorizontal: s(8),
  },
  shortCardBottomTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
  },

  // ─── Shorts Section Row ──────────────────────────────────────────────────────
  shortsSectionContainer: {
    backgroundColor: PALETTE.white,
    paddingTop: vs(12),
    paddingBottom: vs(14),
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.grey300,
  },
  shortsSectionHeader: {
    paddingHorizontal: s(14),
    marginBottom: vs(10),
  },
  shortsSectionTitleWrap: {
    gap: vs(3),
  },
  shortsSectionTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    color: PALETTE.grey800,
    fontWeight: '700',
  },
  shortsSectionUnderline: {
    height: vs(3),
    width: s(36),
    backgroundColor: PALETTE.primary,
    borderRadius: s(2),
  },
  shortsSectionScrollView: {
    height: vs(200),
    flexGrow: 0,
    flexShrink: 0,
  },
  shortsSectionScroll: {
    paddingHorizontal: s(14),
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});

// ─── Video Skeleton Card ─────────────────────────────────────────────────────────
const VideoSkeletonCard = () => (
  <View style={styles.card}>
    <View style={styles.thumbWrap}>
      <View style={[styles.thumbnail, { backgroundColor: PALETTE.grey200 }]} />
      <View style={styles.thumbOverlay} />
      <View style={[styles.thumbPlayBtn, { backgroundColor: PALETTE.grey300 }]} />
      <View style={[styles.durationBadge, { backgroundColor: PALETTE.grey300 }]}>
        <View style={{ width: s(30), height: vs(10), backgroundColor: PALETTE.grey400, borderRadius: s(2) }} />
      </View>
    </View>
    <View style={styles.cardBody}>
      <View style={[styles.videoTitle, { height: vs(20), backgroundColor: PALETTE.grey200, borderRadius: s(4), marginBottom: vs(5) }]} />
      <View style={[styles.metaDate, { height: vs(14), backgroundColor: PALETTE.grey200, borderRadius: s(4), width: s(80), marginBottom: vs(8) }]} />
      <View style={styles.cardMeta}>
        <View style={styles.cardMetaLeft}>
          <View style={[styles.categoryPill, { backgroundColor: PALETTE.grey200, borderColor: PALETTE.grey300 }]}>
            <View style={{ width: s(40), height: vs(12), backgroundColor: PALETTE.grey300, borderRadius: s(2) }} />
          </View>
        </View>
        <View style={styles.cardMetaRight}>
          <View style={[styles.commentBtn, { backgroundColor: PALETTE.grey200 }]}>
            <View style={{ width: s(20), height: s(20), backgroundColor: PALETTE.grey300, borderRadius: s(10) }} />
          </View>
        </View>
      </View>
    </View>
  </View>
);

// ─── Enhanced Video Skeleton Loader ─────────────────────────────────────────────────
const VideoSkeletonLoader = () => (
  <View style={{ backgroundColor: PALETTE.white }}>
    {/* Category tabs skeleton */}
    <View style={styles.catRow}>
      <View style={[styles.filterIconBtn, { backgroundColor: PALETTE.grey200 }]} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catTabsContent}
        style={{ flex: 1 }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={[styles.catTab, { backgroundColor: PALETTE.grey200, borderColor: PALETTE.grey300, width: s(80) }]}
          />
        ))}
      </ScrollView>
    </View>

    {/* Loading indicator */}
    <View style={{ alignItems: 'center', paddingVertical: vs(20), backgroundColor: PALETTE.grey100 }}>
      <ActivityIndicator size="small" color={PALETTE.primary} />
      <Text style={[{ fontSize: sf(12), color: PALETTE.grey600, marginTop: vs(8) }]}>
        Loading videos...
      </Text>
    </View>

    {/* Video cards skeleton with better spacing */}
    <View style={{ paddingHorizontal: s(12) }}>
      {[1, 2, 3].map((i) => (
        <View key={i} style={{ marginBottom: vs(12) }}>
          <VideoSkeletonCard />
        </View>
      ))}
    </View>
  </View>
);

export default VideosScreen;