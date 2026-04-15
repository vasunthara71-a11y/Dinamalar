import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  StatusBar,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shorts, FacebookIcon, TwitterIcon, WhatsAppIcon, TelegramIcon } from '../assets/svg/Icons';
import RenderHtml from 'react-native-render-html';
import AppHeaderComponent from '../components/AppHeaderComponent';
import TopMenuStrip from '../components/TopMenuStrip';
import DrawerMenu from '../components/DrawerMenu';
import LocationDrawer from '../components/LocationDrawer';
import { ms, s, vs } from '../utils/scaling';
import { CDNApi, API_ENDPOINTS } from '../config/api';
import { COLORS, FONTS, NewsCard } from '../utils/constants';
import { useFontSize } from '../context/FontSizeContext';
import WebView from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
 
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
const PlayIcon = ({ size = 52 }) => (
  <View style={[styles.playCircle, { width: size, height: size, borderRadius: size / 2 }]}>
    <View style={[styles.playTriangle, {
      borderTopWidth: size * 0.22,
      borderBottomWidth: size * 0.22,
      borderLeftWidth: size * 0.36,
      marginLeft: size * 0.07
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
            <Shorts size={s(15)} color="#fff" />
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

// ─── Shorts Section Grid (2-column grid like HomeScreen) ────────────────────────
const ShortsSectionGrid = ({ items, onPress }) => {
  const { sf } = useFontSize();
  if (!items || items.length === 0) return null;

  // Split data into 2 columns
  const column1Data = items.filter((_, index) => index % 2 === 0);
  const column2Data = items.filter((_, index) => index % 2 === 1);

  return (
    <View style={styles.shortsGridContainer}>
      <View style={styles.shortsColumnsContainer}>
        {/* Column 1 */}
        <View style={styles.shortsColumn}>
          {column1Data.map((video, index) => (
            <ShortCard
              key={`shorts-col1-${index}-${video.videoid || video.id || index}`}
              video={video}
              onPress={onPress}
            />
          ))}
        </View>

        {/* Column 2 */}
        <View style={styles.shortsColumn}>
          {column2Data.map((video, index) => (
            <ShortCard
              key={`shorts-col2-${index}-${video.videoid || video.id || index}`}
              video={video}
              onPress={onPress}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

// ─── Image with Fallback ─────────────────────────────────────────────────────
function ImageWithFallback({ source, style, resizeMode = 'cover', iconSize = 40 }) {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setLoading(false);
  };

  const handleImageLoad = () => {
    setImageError(false);
    setLoading(false);
  };

  if (imageError || !source?.uri) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }]}>
        <Image
          source={{ uri: 'https://stat.dinamalar.com/new/2025/images/dinamalar-pavala-vizha-logo-day.png' }}
          style={{ width: s(iconSize * 2), height: s(iconSize), resizeMode: 'contain' }}
        />
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={style}
      resizeMode={resizeMode}
      onError={handleImageError}
      onLoad={handleImageLoad}
    />
  );
}



// ─── Video Card ─────────────────────────────────────────────────────────────────
const VideoCard = ({ video, onPress, districtLabel, index, onCategoryPress }) => { 
   const { sf } = useFontSize();

  if (video.type === 'reels') return null;
  if (video.type === 'googlead') return null;

  const timeAgo = getTimeAgo(video.videodate);
  const pillLabel = districtLabel || video.ctitle || video.maincat || '';
  const shareUrl = encodeURIComponent(video.link || video.url || '');
 
  return (
    <View style={NewsCard.wrap}>
      {index === 0 && (
        <View style={shareStyles.shareRow}>
          <TouchableOpacity
            style={shareStyles.shareBtn}
            onPress={() => Linking.openURL(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`)}
            activeOpacity={0.7}
          >
            <FacebookIcon size={ms(25)} color="#1877F2" />
          </TouchableOpacity>

          <TouchableOpacity
            style={shareStyles.shareBtn}
            onPress={() => Linking.openURL(`https://twitter.com/intent/tweet?url=${shareUrl}`)}
            activeOpacity={0.7}
          >
            <TwitterIcon size={ms(25)} color="#000000" />
          </TouchableOpacity>

          <TouchableOpacity
            style={shareStyles.shareBtn}
            onPress={() => {
            // console.log('WhatsApp share URL:', shareUrl); // Debug log
            // console.log('Share URL type:', typeof shareUrl); // Debug URL type
            // console.log('Share URL length:', shareUrl?.length); // Debug URL length
            
            // Handle different URL types
            let urlToShare = shareUrl;
            if (typeof shareUrl !== 'string') {
              urlToShare = String(shareUrl);
            }
            
            const encodedUrl = encodeURIComponent(urlToShare);
            const whatsappUrl = `https://wa.me/?text=${encodedUrl}`;
            // console.log('Opening WhatsApp URL:', whatsappUrl); // Debug log
            
            // Linking.openURL(whatsappUrl).catch(err => {
            //   console.log('WhatsApp error:', err);
            //   console.log('Original URL:', shareUrl);
            //   console.log('Encoded URL:', encodedUrl);
            // });
          }}
            activeOpacity={0.7}
          >
            <WhatsAppIcon size={ms(25)} color="#25D366" />
          </TouchableOpacity>

          <TouchableOpacity
            style={shareStyles.shareBtn}
            onPress={() => Linking.openURL(`https://t.me/share/url?url=${shareUrl}`)}
            activeOpacity={0.7}
          >
            <TelegramIcon size={ms(25)} color="#229ED9" />
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity activeOpacity={0.88} onPress={() => onPress?.(video)}>
        <View style={NewsCard.imageWrap}>
          <ImageWithFallback
            source={{ uri: video.images }}
            style={[NewsCard.image, { height: ms(200) }]}
            resizeMode="cover"
            iconSize={40}
          />
          <View style={styles.playButtonOverlay}>
            <PlayIcon size={36} />
          </View>
          {!!video.duration && (
            <View style={styles.durationBadge}>
              <Text style={[styles.durationText, { fontSize: ms(14) }]}>{video.duration}</Text>
            </View>
          )}
        </View>

        <View style={NewsCard.contentContainer}>
          <Text style={[NewsCard.title, {
            fontSize: sf(13), lineHeight: sf(22), marginBottom: vs(5),
          }]} numberOfLines={3}>
            {video.videotitle}
          </Text>

          <View style={[NewsCard.metaRow, { marginTop: vs(8) }]}>
            {!!pillLabel && (
              <TouchableOpacity
                onPress={() => onCategoryPress?.(video.ctitle || video.maincat || '')}
                activeOpacity={0.7}
                style={NewsCard.catPill}
              >
                <Text style={[NewsCard.catText, { fontSize: sf(12) }]}>
                  {pillLabel}
                </Text>
              </TouchableOpacity>
            )}
            <Text style={[NewsCard.timeText, { fontSize: sf(12), marginLeft: 'auto' }]}>
              {timeAgo || video.standarddate}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
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
    'அரசியல்': ['அரசியல்', 'politics', 'Politics'],
    'பொது': ['பொது', 'general', 'General'],
    'சம்பவம்': ['சம்பவம்', 'event', 'Event'],
    'சினிமா': ['சினிமா', 'cinema', 'Cinema'],
    'டிரைலர்': ['டிரைலர்', 'trailer', 'Trailer'],
    'செய்திச்சுருக்கம்': ['செய்திச்சுருக்கம்', 'short news', 'Short News'],
    'விளையாட்டு': ['விளையாட்டு', 'sport', 'Sports'],
    'சிறப்பு தொகுப்புகள்': ['சிறப்பு தொகுப்புகள்', 'exclusive videos', 'Exclusive'],
    'ஆன்மிகம்': ['ஆன்மிகம்', 'spiritual', 'Spiritual'],
    'மாவட்ட செய்திகள்': ['மாவட்ட செய்திகள்', 'district news', 'District'],
    'shorts': ['shorts', 'ஷார்ட்ஸ்', 'ஷார்ட்'],
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // const [activeCategory, setActiveCategory] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  // const [selectedFilter, setSelectedFilter] = useState('');   // ename: weekly/monthly/yearly
  // const [selectedDistrict, setSelectedDistrict] = useState('');   // district id string
  const [selectedDistrictLabel, setSelectedDistrictLabel] = useState('உள்ளூர்');
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isLocDrawerOpen, setIsLocDrawerOpen] = useState(false);
  // const [selectedVideo, setSelectedVideo] = useState(null);
  const flatListRef = useRef(null);
  const categoryScrollRef = useRef(null);
  const tabLayoutsRef = useRef({});   // stores {[tabKey]: {x, width}} after layout
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [webViewVisible, setWebViewVisible] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState('');
  const [filters, setFilters] = useState({ category: '', date: '', district: '', districtSlug: '' });
  const [initialLoad, setInitialLoad] = useState(true);
  const [cachedData, setCachedData] = useState(null);
  // Add these after your existing useRef declarations
const fetchControllerRef = useRef(null);   // AbortController for cancelling in-flight requests
const debounceTimerRef = useRef(null);     // Debounce timer
const isFetchingRef = useRef(false);       // Prevents duplicate concurrent calls
const lastFetchParamsRef = useRef('');     // Prevents identical consecutive calls

  // ── Fetch: CDNApi + API_ENDPOINTS.VIDEO_MAIN (/videomain) ────────────────────
// In fetchVideos, replace the entire params building logic with this simpler version:

// Add this inside VideosScreen, near your other handlers:
const handleCategoryPillPress = useCallback((ctitle) => {
  if (!ctitle || categories.length === 0) return;
  const matched = categories.find(
    c => (c.title || '').toLowerCase() === ctitle.toLowerCase()
  );
  if (!matched) return;
  const catValue = String(matched.value ?? '');
  const updated = { ...filters, category: catValue };
  setFilters(updated);
  flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  debouncedFetch({ cat: catValue, date: updated.date, district: updated.district });
}, [categories, filters, debouncedFetch]);



const fetchVideos = useCallback(async ({
  cat = '',
  date = '',
  district = '',
  districtSlug = '',
  page = 1,
  append = false,
} = {}) => {

  // ── Dedupe: skip if exact same params already in-flight ──────────────────
  const paramsKey = JSON.stringify({ cat, date, district, page, append });
  if (isFetchingRef.current && paramsKey === lastFetchParamsRef.current) {
    console.log('[fetchVideos] Skipping duplicate call');
    return;
  }

  // ── Cancel any previous in-flight request ────────────────────────────────
  if (fetchControllerRef.current) {
    fetchControllerRef.current.abort();
  }
  fetchControllerRef.current = new AbortController();
  const signal = fetchControllerRef.current.signal;

  isFetchingRef.current = true;
  lastFetchParamsRef.current = paramsKey;

  // ── State updates ─────────────────────────────────────────────────────────
  if (!append) {
    setLoading(true);
    setAllVideos([]);       // Clear stale data immediately — prevents old list flash
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
  } else {
    setLoadingMore(true);
  }

  try {
    // ── Shorts path ───────────────────────────────────────────────────────
    if (cat === 'shorts') {
      // Use smaller page size for shorts too - 8 items per page for faster loading
      const endpoint = API_ENDPOINTS.SHORTS + (page > 1 ? `?page=${page}&limit=8` : '?limit=8');
      const response = await CDNApi.get(endpoint, { signal });
      const data = response.data;

      const raw = data?.newlist?.data ?? [];
      const pagination = data?.newlist?.pagination ?? {};

      const processed = raw.map(item => ({
        ...item,
        videoid: item.newsid || item.id,
        title: item.newstitle || item.title,
        image: item.images || item.image,
        type: 'reels',
        duration: null,
      }));

      if (append) {
        setAllVideos(prev => {
          const ids = new Set(prev.map(v => v.videoid).filter(Boolean));
          return [...prev, ...processed.filter(v => !v.videoid || !ids.has(v.videoid))];
        });
      } else {
        setAllVideos(processed);
      }

      const cp = pagination.current_page ?? page;
      const lp = pagination.last_page ?? 1;
      setCurrentPage(cp);
      setLastPage(lp);
      setHasMore(cp < lp);
      return;
    }

    // ── Build endpoint with smaller page size for faster loading ─────────────────
    const params = new URLSearchParams();
    if (cat)      params.append('cat', cat);
    if (date)     params.append('date', date);
    if (district) params.append('district', district);
    if (page > 1) params.append('page', String(page));
    
    // Load smaller chunks for faster response - 4 sets of ~8 videos each
    params.append('limit', '8');  // Load 8 videos per page instead of default
    
    const query = params.toString();
    const endpoint = query
      ? `${API_ENDPOINTS.VIDEO_MAIN}?${query}`
      : `${API_ENDPOINTS.VIDEO_MAIN}?limit=8`;  // Default limit for first page

    console.log('[fetchVideos] →', endpoint);

    const response = await CDNApi.get(endpoint, { signal });

    // Guard: ignore if this request was aborted mid-flight
    if (signal.aborted) return;

    const data = response.data;

    // ── Extract videos ────────────────────────────────────────────────────
    let raw = data?.videomix?.data ?? data?.districtnews ?? [];
    const pagination = data?.videomix ?? {};

    // ── Client-side district filtering (strict match) ─────────────────────
    if (district && raw.length > 0) {
      const distObj = districtOptions.find(d => String(d.id) === String(district));
      const distName = distObj?.title;
      if (distName) {
        raw = raw.filter(v => {
          if (v.districtid && String(v.districtid) === String(district)) return true;
          if (v.districttag === distName) return true;
          if (v.districtengtag && distObj?.districtname &&
              v.districtengtag === distObj.districtname) return true;
          return false;
        });
      }
    }

    // ── Update videos list ────────────────────────────────────────────────
    if (append) {
      setAllVideos(prev => {
        const ids = new Set(prev.map(v => v.videoid).filter(Boolean));
        return [...prev, ...raw.filter(v => !v.videoid || !ids.has(v.videoid))];
      });
    } else {
      setAllVideos(raw);
    }

    // ── Pagination ────────────────────────────────────────────────────────
    const cp = pagination.current_page ?? page;
    const lp = pagination.last_page ?? 1;
    setCurrentPage(cp);
    setLastPage(lp);
    setHasMore(cp < lp);

    // ── One-time metadata (categories, filters, districts) ────────────────
    if (data?.category?.length) {
      setCategories(prev => {
        if (prev.length > 0) return prev;
        const seen = new Set();
        return data.category.filter(c => {
          const k = String(c.value ?? '');
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
      });
    }
    if (data?.filter?.length)
      setFilterOptions(prev => prev.length > 0 ? prev : data.filter);
    if (data?.districtlist?.data?.length)
      setDistrictOptions(prev => prev.length > 0 ? prev : data.districtlist.data);
    if (data?.taboola_ads?.mobile)
      setTaboolaAds(prev => prev ?? data.taboola_ads.mobile);

  } catch (err) {
    if (err?.name === 'AbortError' || err?.name === 'CanceledError') {
      console.log('[fetchVideos] Request cancelled — new filter applied');
      return; // Silent — expected when user switches filter quickly
    }
    console.error('[fetchVideos] Error:', err?.message);
    setError(err?.message || 'பிழை ஏற்பட்டது');
    if (!append) setAllVideos([]);
  } finally {
    isFetchingRef.current = false;
    if (!append) {
      setLoading(false);
      setInitialLoad(false);
    } else {
      setLoadingMore(false);
    }
  }
}, [districtOptions]); // only districtOptions needed — everything else via params


// Debounced fetch — 300ms delay, cancels previous pending call
const debouncedFetch = useCallback((params) => {
  if (debounceTimerRef.current) {
    clearTimeout(debounceTimerRef.current);
  }
  debounceTimerRef.current = setTimeout(() => {
    fetchVideos(params);
  }, 300);
}, [fetchVideos]);


  const handleScroll = useCallback((e) => {
    setShowScrollTop(e.nativeEvent.contentOffset.y > 300);
  }, []);

useEffect(() => {
  if (!initialTabKey || initialTabApplied.current) return;
  if (categories.length === 0) return;
  const keywords = TAB_KEY_KEYWORDS[initialTabKey] || [];
  const matched = categories.find(cat =>
    keywords.some(kw => (cat.title || '').toLowerCase().includes(kw.toLowerCase()))
  );
  if (matched) {
    initialTabApplied.current = true;
    const catValue = String(matched.value ?? '');
    setFilters(prev => ({ ...prev, category: catValue }));
    fetchVideos({ cat: catValue });
  }
}, [categories, initialTabKey]);

// Add this useEffect near your other effects
useEffect(() => {
  return () => {
    // Cancel in-flight requests and timers when screen unmounts
    fetchControllerRef.current?.abort();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
  };
}, []);

useEffect(() => {
  if (!initialCategory) {
    if (!initialTabKey && !initialTabApplied.current) {
      fetchVideos();
    }
    return;
  }

  initialTabApplied.current = true;
  setFilters(prev => ({ ...prev, category: initialCategory }));

  // Fetch filtered videos AND base data (for categories/tabs) in parallel with timeout
  const parallelRequests = [
    fetchVideos({ cat: initialCategory }),  // filtered videos
    // Also fetch base to populate category tabs
    CDNApi.get(API_ENDPOINTS.VIDEO_MAIN).then(res => {
      const data = res?.data;
      if (data?.category?.length) {
        setCategories(prev => {
          if (prev.length > 0) return prev;
          const seen = new Set();
          return data.category.filter(c => {
            const k = String(c.value ?? '');
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          });
        });
      }
      if (data?.filter?.length) setFilterOptions(prev => prev.length > 0 ? prev : data.filter);
      if (data?.districtlist?.data?.length) setDistrictOptions(prev => prev.length > 0 ? prev : data.districtlist.data);
    }).catch(() => {})  // silent fail - categories are non-critical
  ];

  // Add timeout to prevent hanging
  Promise.race([
    Promise.allSettled(parallelRequests),
    new Promise(resolve => setTimeout(() => resolve([{ status: 'timeout' }]), 5000))
  ]).then(results => {
    if (results[0]?.status === 'timeout') {
      console.warn('[VideosScreen] Initial data fetch timeout - proceeding with available data');
    }
  });
}, [fetchVideos, initialCategory, initialTabKey]);

useEffect(() => {
  if (!filters.category || !categoryScrollRef.current) return;
  const layout = tabLayoutsRef.current[filters.category];
  if (!layout) return;

  // Use requestAnimationFrame to prevent conflicts
  requestAnimationFrame(() => {
    if (categoryScrollRef.current) {
      // Centre the active tab: scroll so tab sits in middle of scroll view
      const scrollX = Math.max(0, layout.x - layout.width);
      categoryScrollRef.current.scrollTo({ x: scrollX, animated: true });
    }
  });
}, [filters.category]);

  // Add this useEffect to respond to navigation params from VideoDetailScreen
  useEffect(() => {
    const catId = route?.params?.catId ?? '';
    const catTitle = route?.params?.catTitle ?? '';
    const timestamp = route?.params?.timestamp;
    
    if (catId !== undefined && catId !== '') {
      // console.log('[VideosScreen] Setting category from navigation params:', { catId, catTitle, timestamp });
      
      // Set the active category to match the passed catId
      const updated = { ...filters, category: String(catId) };
      setFilters(updated);
      fetchVideos({ cat: String(catId), date: updated.date, district: updated.district });
      
      // Scroll to top
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }, [route?.params?.catId, route?.params?.timestamp]); // timestamp triggers re-run

const handleCategoryPress = useCallback((value) => {
  const newCat = filters.category === value ? '' : value;
  const updated = { ...filters, category: newCat };
  setFilters(updated);
  flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  debouncedFetch({ cat: newCat, date: updated.date, district: updated.district });
}, [filters, debouncedFetch]);

// ── Date filter press — keeps district and category selection ──────────────────
const handleSelectFilter = useCallback((ename) => {
  const newDate = filters.date === ename ? '' : ename;
  const updated = { ...filters, date: newDate };
  setFilters(updated);
  setFilterVisible(false);
  flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  debouncedFetch({ cat: updated.category, date: newDate, district: updated.district });
}, [filters, debouncedFetch]);

const handleSelectDistrict = useCallback((id) => {
  const newDistrict = filters.district === id ? '' : id;
  const distObj = districtOptions.find(d => String(d.id) === id);
  
  // Find district news category (ID '1585' based on TimelineScreen)
  const districtNewsCategory = categories.find(c => String(c.value) === '1585');
  const districtCatValue = districtNewsCategory ? String(districtNewsCategory.value) : '';
  
  const updated = {
    ...filters,
    category: newDistrict ? districtCatValue : '', // Set district news category when district is selected, clear when deselected
    district: newDistrict,
    districtSlug: newDistrict ? distObj?.slug || '' : '',
  };
  setFilters(updated);
  setFilterVisible(false);
  flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  debouncedFetch({ cat: updated.category, date: updated.date, district: newDistrict });
}, [filters, districtOptions, categories, debouncedFetch]);

const handleLocationSelectDistrict = useCallback((district) => {
  setSelectedDistrictLabel(district.title);
  setIsLocDrawerOpen(false);
  if (!district.id) return;
  const id = String(district.id);
  const updated = { ...filters, district: id };
  setFilters(updated);
  flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  debouncedFetch({ cat: updated.category, date: updated.date, district: id });
}, [filters, debouncedFetch]);


// ── Nav ───────────────────────────────────────────────────────────────────────
const handleMenuPress = (menuItem) => {
  // Debug: Log the menu item structure
  // console.log('TopMenuStrip menu item clicked:', menuItem);
    // console.log('TopMenuStrip menu item clicked:', menuItem);

    // Handle menu item navigation based on menu item properties
    if (menuItem?.screen_name) {
      // console.log('Navigating to screen:', menuItem.screen_name);
      navigation?.navigate?.(menuItem.screen_name);
    } else if (menuItem?.url) {
      // Handle URL navigation if needed
      // console.log('Navigate to URL:', menuItem.url);
    } else if (menuItem?.Title || menuItem?.title) {
      // Try to navigate based on title
      const title = menuItem.Title || menuItem.title;
      // console.log('Menu title:', title);

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
        // console.log('Mapped title to screen:', targetScreen);
        navigation?.navigate?.(targetScreen);
      } else {
        // console.log('No screen mapping found for title:', title);
        // Fallback to opening drawer
        navigation?.openDrawer?.();
      }
    } else {
      // console.log('No navigation info found, opening drawer');
      // Fallback to opening drawer if no specific navigation is defined
      navigation?.openDrawer?.();
    }
  };
  const handleSearch = () => navigation?.navigate?.('Search');
  const handleNotification = () => console.log('Notifications');

  // const activeFilterLabel =
  //   filterOptions.find((f) => f.ename === selectedFilter)?.name;

  // ── Build listData preserving API order ───────────────────────────────────────
  // Walks allVideos and prioritizes regular videos over shorts
  // Result: [video, video, video, shorts_strip([r,r,r]), video, shorts_strip([r]), video...]
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

    // Separate regular videos and shorts
    const regularVideos = allVideos.filter(video => video.type !== 'reels' && video.type !== 'googlead');
    const shortsVideos = allVideos.filter(video => video.type === 'reels');

    // console.log('[listData] regular videos:', regularVideos.length, 'shorts:', shortsVideos.length);

    // Check if any filters are active (district, date, category)
    const hasActiveFilters = !!filters.district || !!filters.date || !!filters.category;
    
    // Show shorts only when no filters are active OR when shorts category is explicitly selected
    const shouldShowShorts = !hasActiveFilters || filters.category === 'shorts';

    // console.log('[listData] hasActiveFilters:', hasActiveFilters, 'shouldShowShorts:', shouldShowShorts);

    // Process regular videos first
    regularVideos.forEach((video) => {
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
    });

    // Then process shorts only if we should show them
    if (shouldShowShorts) {
      shortsVideos.forEach((video) => {
        reelsBuffer.push(video);
      });

      // Flush all shorts at the end
      flushReels();
    }

    return result;
  }, [allVideos, taboolaAds, filters]);

  // ── List header ───────────────────────────────────────────────────────────────
const ListHeader = () => {
  // Only show skeleton when no data exists AND we're loading
  if (loading && allVideos.length === 0) return <VideoSkeletonLoader />;

  // Build active pills
  const activePills = [];
  if (filters.date) {
    const label = filterOptions.find(f => f.ename === filters.date)?.name || filters.date;
    activePills.push({ key: 'date', label, onRemove: () => {
      const updated = { ...filters, date: '' };
      setFilters(updated);
      fetchVideos({ cat: updated.category, date: '', district: updated.district });
    }});
  }
  if (filters.district) {
    const label = 'மாவட்ட செய்திகள்';
    activePills.push({ key: 'district', label, onRemove: () => {
      const updated = { ...filters, district: '' };
      setFilters(updated);
      fetchVideos({ cat: updated.category, date: updated.date, district: '' });
    }});
  }
// if (filters.category && filters.category !== 'shorts') {
//   const label = categories.find(c => String(c.value) === filters.category)?.title || filters.category;
//   activePills.push({ key: 'category', label, onRemove: () => {
//     const updated = { ...filters, category: '' };
//     setFilters(updated);
//     fetchVideos({ cat: '', date: updated.date, district: updated.district });
//   }});
// }

  return (
    <View>
      {/* Category tabs + Filter icon */}
      <View style={styles.catRow}>
        <TouchableOpacity
          style={[styles.filterIconBtn, (filters.date || filters.district) && styles.filterIconBtnActive]}
          onPress={() => setFilterVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="filter"
            size={20}
            color={(filters.date || filters.district) ? PALETTE.primary : PALETTE.grey600}
          />
          {(filters.date || filters.district) && <View style={styles.filterDot} />}
        </TouchableOpacity>

        <ScrollView
          ref={categoryScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catTabsContent}
          style={{ flex: 1 }}
        >
          {categories.map((cat, idx) => {
            const isActive = filters.category === String(cat.value ?? '') || 
  (filters.category === '' && initialCategory === String(cat.value ?? ''));
            return (
              <TouchableOpacity
                key={`cat_${cat.value ?? idx}`}
                onPress={() => handleCategoryPress(String(cat.value ?? ''))}
                style={[styles.catTab, isActive && styles.catTabActive]}
                activeOpacity={0.8}
                onLayout={(e) => {
                  tabLayoutsRef.current[String(cat.value ?? '')] = {
                    x: e.nativeEvent.layout.x,
                    width: e.nativeEvent.layout.width,
                  };
                }}
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

      {/* ── Active filter pills ── */}
      {activePills.length > 0 && (
        <View style={styles.activePillsRow}>
          {activePills.map(pill => (
            <View key={pill.key} style={styles.activePill}>
              <Text style={styles.activePillText}>{pill.label}</Text>
              <TouchableOpacity
                onPress={pill.onRemove}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={s(16)} color={PALETTE.grey500} />
              </TouchableOpacity>
            </View>
          ))}
          {/* Clear all button — only show when 2+ filters active */}
          {activePills.length > 1 && (
            <TouchableOpacity
              onPress={() => {
                setFilters({ category: '', date: '', district: '' });
                fetchVideos({});
              }}
              style={styles.clearAllBtn}
              activeOpacity={0.8}
            >
              <Text style={styles.clearAllText}>அனைத்தும் நீக்கு</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

 
    </View>
  );
};

  // ── Load more handler ───────────────────────────────────────────────────────────
const handleLoadMore = useCallback(() => {
  if (loadingMore || loading || !hasMore || isFetchingRef.current) return;
  fetchVideos({
    cat: filters.category,
    date: filters.date,
    district: filters.district,
    districtSlug: filters.districtSlug,
    page: currentPage + 1,
    append: true,
  });
}, [loadingMore, loading, hasMore, filters, currentPage, fetchVideos]);

  // ── Footer component ───────────────────────────────────────────────────────────
// Replace your existing ListFooter
const ListFooter = useCallback(() => (
  <View style={{ height: vs(60), justifyContent: 'center', alignItems: 'center' }}>
    {loadingMore && <ActivityIndicator size="small" color={PALETTE.primary} />}
  </View>
), [loadingMore]);
// Always render a fixed-height footer → eliminates the jump

  // ── Empty state component ───────────────────────────────────────────────────────
const ListEmpty = () => {
  if (loading) return null;
  
  const isDistrictFiltered = !!filters.district;
  const districtName = districtOptions.find(d => String(d.id) === filters.district)?.title;
  
  return (
    <View style={styles.centeredState}>
      <Text style={styles.stateIcon}>📭</Text>
      <Text style={[styles.stateText, { fontSize: sf(14) }]}>
        {isDistrictFiltered 
          ? `${districtName} மாவட்டத்திற்கு தகவல்கள் இல்லை` 
          : 'தகவல் இல்லை'
        }
      </Text>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
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
        onSearch={() => navigation?.navigate('Search')}
        onMenu={() => setIsDrawerVisible(true)}
        onLocation={() => setIsLocDrawerOpen(true)}
        selectedDistrict={selectedDistrictLabel}
      />
      

      <FlatList
        ref={flatListRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        data={listData}
        
        keyExtractor={(item, idx) => {
          if (item._type === 'shorts_strip') return item._key || `shorts_strip_${idx}`;
          if (item._type === 'taboola_ad') return item._key || `taboola_${idx}`;
          return item.videoid || item.id || `video_${idx}`;
        }}
        renderItem={({ item, index }) => {
          // ── Shorts grid ───────────────────────────────────────────────
          if (item._type === 'shorts_strip') {
            return (
              <ShortsSectionGrid
                items={item.items}
                onPress={(v) => {
                  // Open shorts in WebView instead of browser
                  const shortsLink = v.link || v.slug || `https://www.dinamalar.com/shorts/${v.id || v.videoid}`;
                  // console.log('Opening shorts in WebView:', shortsLink);
                  setWebViewUrl(shortsLink);
                  setWebViewVisible(true);
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
    index={index}
    onPress={(v) => navigation?.navigate?.('VideoDetailScreen', { video: v })}
    districtLabel={filters.district
      ? districtOptions.find(d => String(d.id) === filters.district)?.title || ''
      : ''
    }
    onCategoryPress={handleCategoryPillPress}
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
  selectedFilter={filters.date}          // ← was selectedFilter
  onSelectFilter={handleSelectFilter}
  districtOptions={districtOptions}
  selectedDistrict={filters.district}    // ← was selectedDistrict
  onSelectDistrict={handleSelectDistrict}
  onClearAll={() => {
    setFilters({ category: '', date: '', district: '', districtSlug: '' });
    fetchVideos({});
    setFilterVisible(false);
  }}
/>
      {/* Drawer Menu */}
      <DrawerMenu
        isVisible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
        onMenuPress={(menuItem) => {
          // console.log('Drawer menu item clicked:', menuItem);
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
      
      {/* WebView Modal for Shorts */}
      <Modal
        visible={webViewVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setWebViewVisible(false);
          setWebViewUrl('');
        }}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          {/* <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end' }}>
            <TouchableOpacity
              style={{ 
                backgroundColor: PALETTE.primary, 
                padding: s(10), 
                borderRadius: s(20),
                margin: s(10),
                // marginTop: Platform.OS === 'ios' ? 40 : 20
              }}
              onPress={() => {
                setWebViewVisible(false);
                setWebViewUrl('');
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={s(24)} color="#fff" />
            </TouchableOpacity>
          </View> */}
          
          <WebView
            source={{ uri: webViewUrl }}
            style={{ flex: 1 }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            onLoadStart={() => console.log('WebView load start')}
            onLoadEnd={() => console.log('WebView load end')}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
};
const shareStyles = StyleSheet.create({
  shareRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: s(12),
    paddingVertical: vs(8),
    // borderBottomWidth: 1,
    borderBottomColor: PALETTE.grey300,
    backgroundColor: PALETTE.white,
  },
  shareBtn: {
    width: s(38),
    height: s(38),
    // borderRadius: s(19),
    borderWidth: 1.5,
    borderColor: PALETTE.grey300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PALETTE.white,
  },
  shareBtnText: {
    fontSize: ms(16),
    fontWeight: '700',
  },
});

// ─── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PALETTE.grey100,
    paddingTop: Platform.OS === 'android' ? vs(0) : 0,
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
    borderColor: PALETTE.grey600
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
    paddingHorizontal: s(12),
    borderRadius: s(20),
    borderWidth: 1,
    height: ms(30),
    borderColor: PALETTE.grey300, backgroundColor: PALETTE.grey100, gap: s(4),
  },
  catTabActive: { backgroundColor: PALETTE.primary, },
  catTabText: { fontSize: ms(16), color: PALETTE.grey700, fontWeight: '500', fontFamily: FONTS.muktaMalar.semibold },
  catTabTextActive: { color: PALETTE.white, fontWeight: '500', fontFamily: FONTS.muktaMalar.bold },
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
  // Add these to StyleSheet.create({...})
activePillsRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: s(8),
  paddingHorizontal: s(12),
  paddingVertical: vs(8),
  // backgroundColor: '#EBF5FF',
  // borderBottomWidth: 1,
  borderBottomColor: PALETTE.primary + '25',
  alignItems: 'center',
},
activePill: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: s(4),
  backgroundColor: PALETTE.white,
  borderWidth: 1,
  borderColor: PALETTE.grey500,
  borderRadius: s(16),
  paddingHorizontal: s(10),
  paddingVertical: vs(4),
},
activePillText: {
  fontSize: ms(13),
  color: PALETTE.grey600,
  fontFamily: FONTS.muktaMalar.semibold,
  fontWeight: '600',
},
clearAllBtn: {
  paddingHorizontal: s(10),
  paddingVertical: vs(4),
  borderRadius: s(16),
  backgroundColor: PALETTE.primary,
},
clearAllText: {
  fontSize: ms(12),
  color: PALETTE.white,
  fontFamily: FONTS.muktaMalar.semibold,
  fontWeight: '600',
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
  thumbPlayBtn: { position: 'absolute', bottom: vs(5), left: s(5) },
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
    position: 'absolute', bottom: 4, right: s(2),
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: s(7), paddingVertical: vs(2),
  },
  durationText: { color: PALETTE.white, fontSize: ms(13), fontWeight: '700' ,fontFamily:FONTS.muktaMalar.semibold},
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
  playButtonOverlay: {
    position: 'absolute',
    bottom: s(5), left: s(5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: s(48),
    height: s(48),
    borderRadius: s(24),
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
 
 
  commentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(2),
    paddingHorizontal: s(4),
    paddingVertical: vs(2),
    borderRadius: s(4),
    backgroundColor: PALETTE.grey200,
  },
  commentCount: {
    color: PALETTE.grey600,
    fontWeight: '600',
    fontSize: ms(10),
    fontFamily: FONTS.muktaMalar.medium,
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

  // ─── Shorts Section Grid ──────────────────────────────────────────────────────
  shortsGridContainer: {
    backgroundColor: PALETTE.white,
    paddingVertical: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.grey300,
  },
  shortsColumnsContainer: {
    flexDirection: 'row',
    paddingHorizontal: s(12),
    justifyContent: 'space-between',
  },
  shortsColumn: {
    flex: 1,
    marginHorizontal: s(2),
  },

  // ─── Short Card (HomeScreen ShortsCard style) ────────────────────────────────
  shortCard: {
    width: '100%',
    marginBottom: vs(8),
  },
  shortCardImageContainer: {
    width: '100%',
    height: vs(270),
    borderRadius: s(8),
    overflow: 'hidden',
    backgroundColor: PALETTE.grey200,
  },
  shortCardImage: {
    width: '100%',
    height: '100%',
  },
  shortCardPlayOverlay: {
    position: 'absolute',
    top: 0, left: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.3)',
  },
  shortCardPlayButton: {
    position: 'absolute',
    top: s(8),
    right: s(8),
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    backgroundColor: 'rgba(0,0,0,0.7)',
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
    fontSize: ms(10),
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
      <View style={[styles.filterIconBtn, { backgroundColor: PALETTE.grey200, borderColor: PALETTE.grey200 }]} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catTabsContent}
        style={{ flex: 1 }}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <View
            key={i}
            style={[styles.catTab, { backgroundColor: PALETTE.grey200, borderColor: PALETTE.grey100, width: s(80) }]}
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