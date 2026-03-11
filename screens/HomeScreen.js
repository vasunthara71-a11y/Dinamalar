// HomeScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Platform,
  Animated,
  Linking,
} from 'react-native';
import { u38Api, API_ENDPOINTS } from '../config/api';
import axios from 'axios';
import { COLORS, FONTS, NewsCard as NewsCardStyles } from '../utils/constants';
import { ms, s, vs } from '../utils/scaling';
import { fetchHomeData, fetchShortNews } from '../api/news';
import DrawerMenu from '../components/DrawerMenu';
import CategoryTab from '../components/CategoryTab';
import { SvgUri } from 'react-native-svg';
import FooterMenu from '../components/FooterMenu';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import LocationDrawer from '../components/LocationDrawer';
import TopMenuStrip from '../components/TopMenuStrip';
import AppHeaderComponent from '../components/AppHeaderComponent';
import { useFontSize } from '../context/FontSizeContext'; // ← ADDED

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Palette ──────────────────────────────────────────────────────────────────
const PALETTE = {
  primary: '#096dd2',
  grey100: '#F9FAFB',
  grey200: '#F4F6F8',
  grey300: '#DFE3E8',
  grey400: '#C4CDD5',
  grey500: '#919EAB',
  grey600: '#637381',
  grey700: '#637381',
  grey800: '#212B36',
  white: '#FFFFFF',
};



// ─── Menu Icon ────────────────────────────────────────────────────────────────
function MenuIcon({ uri }) {
  if (uri && uri.startsWith('http') && !uri.endsWith('.svg'))
    return <Image source={{ uri }} style={{ width: s(16), height: s(16), marginRight: s(4) }} resizeMode="contain" />;
  if (uri && uri.endsWith('.svg'))
    return <SvgUri uri={uri} width={s(16)} height={s(16)} style={{ marginRight: s(4) }} />;
  return null;
}

// ─── Breaking News Ticker ─────────────────────────────────────────────────────
function BreakingNewsTicker({ text }) {
  const scrollX = useRef(new Animated.Value(SCREEN_WIDTH)).current;
  const textWidth = useRef(SCREEN_WIDTH * 3);

  useEffect(() => {
    if (!text) return;
    let anim;
    const start = () => {
      scrollX.setValue(SCREEN_WIDTH);
      anim = Animated.timing(scrollX, {
        toValue: -textWidth.current,
        duration: 16000,
        useNativeDriver: true,
      });
      anim.start(({ finished }) => { if (finished) start(); });
    };
    start();
    return () => anim?.stop();
  }, [text]);

  if (!text) return null;

  return (
    <View style={tickerSt.container}>
      <Animated.Text
        style={[tickerSt.text, { transform: [{ translateX: scrollX }] }]}
        onLayout={(e) => { textWidth.current = e.nativeEvent.layout.width; }}
        numberOfLines={1}
      >
        {text}
      </Animated.Text>
    </View>
  );
}

// const tickerSt = StyleSheet.create({
//   container: {

// ─── Route Map ────────────────────────────────────────────────────────────────
const LINK_ROUTE_MAP = [
  { match: ['dinamalartv', 'videodata'], screen: 'VideoScreen' },
  { match: ['podcast'], screen: 'PodcastScreen' },
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

// ─── App Header Component ────────────────────────────────────────────────────────
function AppHeader({ onSearch, onMenu, onLocation, selectedDistrict = 'உள்ளூர்' }) {
  const { sf } = useFontSize(); // ← ADDED

  return (
    <View style={styles.appHeader}>
      {/* Left side */}
      <View style={styles.appHeaderLeft}>
        <TouchableOpacity onPress={onMenu} style={styles.headerIconBtn}>
          <Ionicons name="menu" size={s(24)} color={PALETTE.grey800} />
        </TouchableOpacity>
        <Image
          source={{ uri: 'https://stat.dinamalar.com/new/2025/images/dinamalar-pavala-vizha-logo-day.png' }}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.appHeaderRight}>
        {/* Search — filled icon, dark gray, NO border */}
        <TouchableOpacity onPress={onSearch} style={styles.headerIconBtn}>
          <Ionicons name="search" size={s(18)} color={PALETTE.primary} />
        </TouchableOpacity>

        {/* Location — pin + text + chevron, all blue, NO border box */}
        <TouchableOpacity style={styles.locationBtn} onPress={onLocation} activeOpacity={0.7}>
          <Ionicons name="location" size={s(15)} color={PALETTE.primary} />
          <Text style={[styles.locationText, { fontSize: sf(13) }]}>{selectedDistrict}</Text>
          <Ionicons name="chevron-down" size={s(13)} color={PALETTE.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const menuSt = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.white,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.grey200,
  },
  menuLabel: {
    // fontSize: scaleFont(12), ← REMOVED, now inline sf()
    color: PALETTE.grey600,
    fontFamily: FONTS.muktaMalar.regular,
  },
  menuLabelActive: {
    color: PALETTE.primary,
    fontFamily: FONTS.muktaMalar.bold,
  },
  notifButton: {
    paddingHorizontal: s(12),
    paddingVertical: s(6),
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: s(2),
    right: s(6),
    backgroundColor: PALETTE.primary,
    borderRadius: s(8),
    minWidth: s(16),
    height: s(16),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s(3),
    borderWidth: 1.5,
    borderColor: PALETTE.white,
  },
  notifBadgeText: {
    color: PALETTE.white,
    // fontSize: scaleFont(9), ← REMOVED, now inline sf()
    fontFamily: FONTS.muktaMalar.bold,
  },
});

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title }) {
  const { sf } = useFontSize(); // ← ADDED

  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { fontSize: sf(18) }]}>{title}</Text>
      <View style={styles.sectionUnderline} />
    </View>
  );
}

// ─── Shorts Section ────────────────────────────────────────────────────────────
// Horizontal scrolling section for shorts/reels
function ShortsSection({ title, data, onPress }) {
  if (!data || data.length === 0) return null;

  return (
    <View style={shortsSectionSt.container}>
      <SectionHeader title={title} />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={shortsSectionSt.scrollContent}
      >
        {data.map((item, index) => (
          <ShortsCard
            key={`shorts-${index}-${item.newsid || item.id || index}`}
            item={item}
            onPress={() => onPress(item)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const shortsSectionSt = StyleSheet.create({
  container: {
    backgroundColor: PALETTE.white,
    marginBottom: vs(8),
  },
  scrollContent: {
    paddingHorizontal: s(14),
    paddingVertical: vs(12),
  },
});

// ─── Shorts Card ────────────────────────────────────────────────────────────────
// For shorts/reels with vertical layout, play button overlay, and compact design
function ShortsCard({ item, onPress }) {
  const { sf } = useFontSize(); // ← ADDED

  const imageUri =
    item.thumbnail || item.largeimages || item.images || item.image ||
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';
  const title = item.newstitle || item.title || item.videotitle || item.name || '';
  const hasVideo = item.video && item.video !== '0';

  return (
    <TouchableOpacity style={shortsSt.card} onPress={onPress} activeOpacity={0.85}>
      <View style={shortsSt.imageContainer}>
        <Image source={{ uri: imageUri }} style={shortsSt.image} resizeMode="cover" />
        {hasVideo && (
          <View style={shortsSt.playOverlay}>
            <View style={shortsSt.playButton}>
              <Ionicons name="play" size={s(12)} color="#fff" />
            </View>
            {/* Title in overlay */}
            {title && (
              <Text style={[shortsSt.overlayTitle, { fontSize: sf(12) }]} numberOfLines={2}>
                {title}
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const shortsSt = StyleSheet.create({
  card: {
    width: s(120),
    marginRight: s(12),
  },
  imageContainer: {
    width: '100%',
    height: vs(200),
    borderRadius: s(8),
    overflow: 'hidden',
    backgroundColor: PALETTE.grey200,
    marginBottom: vs(8),
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playButton: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: s(2),
  },
  overlayTitle: {
    position: 'absolute',
    bottom: vs(8),
    left: s(8),
    right: s(8),
    // fontSize: scaleFont(12), ← REMOVED, now inline sf()
    fontFamily: FONTS.muktaMalar.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: vs(4),
    paddingHorizontal: s(6),
    borderRadius: s(4),
  },
  title: {
    // fontSize: scaleFont(12), ← REMOVED, now inline sf()
    fontFamily: FONTS.muktaMalar.regular,
    color: PALETTE.grey800,
    lineHeight: ms(16),
  },
});

// ─── News Card ────────────────────────────────────────────────────────────────
// • Image with s(12) horizontal padding
// • MuktaMalar-Bold title, dark #212B36
// • Category pill: gray bg #F4F6F8, gray border #DFE3E8, gray text #454F5B
// • Time left (#637381) | comment + audio right
// • Audio = floating blue circle badge on right edge
function NewsCard({ item, onPress }) {
  const { sf } = useFontSize(); // ← ADDED

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
        
        {/* TopMenuStrip and AppHeaderComponent */}
        {/* Image with horizontal padding */}
        <View style={NewsCardStyles.imageWrap}>
          <Image source={{ uri: imageUri }} style={NewsCardStyles.image} resizeMode="contain" />
        </View>

        {/* Content */}
        <View style={NewsCardStyles.contentContainer}>
          {!!title && (
            <Text style={[NewsCardStyles.title, { fontSize: sf(15), lineHeight: sf(22) }]} numberOfLines={3}>{title}</Text>
          )}

          {/* Category pill — gray, matches screenshot */}
          {!!category && (
            <View style={NewsCardStyles.catPill}>
              <Text style={[NewsCardStyles.catText, { fontSize: sf(11) }]}>{category}</Text>
            </View>
          )}

          {/* Meta row */}
          <View style={NewsCardStyles.metaRow}>
            <Text style={[NewsCardStyles.timeText, { fontSize: sf(11) }]}>{ago}</Text>
            <View style={NewsCardStyles.metaRight}>
              {hasAudio && (
                <View style={NewsCardStyles.audioIcon}>
                  <Ionicons name="volume-high" size={s(14)} color={PALETTE.grey700} />
                </View>
              )}

              {!!newscomment && newscomment !== '0' && (
                <View style={NewsCardStyles.commentRow}>
                  <Ionicons name="chatbox" size={s(14)} color={PALETTE.grey700} />
                  <Text style={[NewsCardStyles.commentText, { fontSize: sf(11) }]}> {newscomment}</Text>
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

// ─── District News Section ────────────────────────────────────────────────────────
function DistrictNewsSection({ districts, onPress }) {
  const { sf } = useFontSize(); // ← ADDED

  return (
    <View style={styles.districtSection}>
      <FlatList
        data={districts}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id?.toString() || item.title}
        scrollEnabled={false}
        renderItem={({ item, index }) => {
          // Debug: Log the icon URL for all items
          console.log(`Item ${index}:`, item.title, 'Icon URL:', item.icon);
          if (item.originalIcon) {
            console.log('Original icon URL:', item.originalIcon);
          }

          return (
            <TouchableOpacity
              style={styles.districtCard}
              onPress={() => onPress(item)}
              activeOpacity={0.8}
            >
              {/* District Header with Icon and Name */}
              <View style={styles.districtHeader}>
                {/* District Icon */}
                <View style={styles.districtIconContainer}>
                  {item.icon && item.icon.trim() !== '' ? (
                    <Image
                      source={{ uri: item.icon }}
                      style={styles.districtIcon}
                      resizeMode="contain"
                      onError={(error) => {
                        console.warn('❌ Failed to load icon:', item.title);
                        console.warn('URL:', item.icon);
                        console.warn('Original URL:', item.originalIcon);
                        console.warn('Error:', error.nativeEvent?.error);
                      }}
                      onLoad={() => {
                        console.log('✅ Successfully loaded icon:', item.title);
                      }}
                    />
                  ) : (
                    <View style={styles.defaultIconContainer}>
                      <Text style={[styles.defaultIconText, { fontSize: sf(16) }]}>
                        {item.title ? item.title.charAt(0).toUpperCase() : '?'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* District Name */}
                <View style={styles.districtNameContainer}>
                  <Text style={[styles.districtName, { fontSize: sf(12), lineHeight: sf(15) }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={s(18)}
                    color={PALETTE.grey700}
                    style={styles.forwardIcon}
                  />
                </View>
              </View>

              {/* Divider */}
              <View style={styles.districtDivider} />

              {/* Latest News Items */}
              {item.data && item.data.length > 0 && (
                <View style={styles.newsItemsContainer}>
                  {item.data.slice(0, 1).map((newsItem, idx) => (
                    <View key={`${item.id}-news-${idx}`} style={styles.newsItemRow}>
                      {/* News Image */}
                      <Image
                        source={{ uri: newsItem.image || newsItem.largeimages || newsItem.images || newsItem.thumbnail || 'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400' }}
                        style={styles.newsItemImage}
                        resizeMode="cover"
                        onError={() => console.log('Failed to load news image')}
                      />

                      {/* News Info */}
                      <View style={styles.newsItemInfo}>
                        <Text style={[styles.newsItemTitle, { fontSize: sf(10), lineHeight: sf(12) }]} numberOfLines={2}>
                          {newsItem.newstitle || newsItem.title}
                        </Text>
                        <Text style={[styles.newsItemTime, { fontSize: sf(9) }]}>
                          {newsItem.ago || newsItem.time}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.districtListContainer}
      />
    </View>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <View style={{ backgroundColor: PALETTE.white, marginBottom: vs(2) }}>
      <View style={{ paddingHorizontal: s(12), paddingTop: vs(8) }}>
        <View style={{ width: '100%', height: vs(200), backgroundColor: PALETTE.grey200 }} />
      </View>
      <View style={{ padding: s(12) }}>
        <View style={{ height: vs(14), backgroundColor: PALETTE.grey200, borderRadius: s(4), marginBottom: vs(8), width: '92%' }} />
        <View style={{ height: vs(14), backgroundColor: PALETTE.grey200, borderRadius: s(4), marginBottom: vs(8), width: '68%' }} />
        <View style={{ height: vs(22), backgroundColor: PALETTE.grey200, borderRadius: s(4), marginBottom: vs(8), width: s(70) }} />
        <View style={{ height: vs(10), backgroundColor: PALETTE.grey100, borderRadius: s(4), width: '30%' }} />
      </View>
      <View style={{ height: vs(6), backgroundColor: PALETTE.grey200 }} />
    </View>
  );
}

function SkeletonLoader() {
  return (
    <>
      <View style={{ height: vs(200), backgroundColor: PALETTE.grey200 }} />
      {/* <View style={{ height: vs(40), backgroundColor: '#f5e84a' }} /> */}
      <View style={{ backgroundColor: PALETTE.white, paddingVertical: vs(8) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: s(10), marginBottom: vs(6) }}>
          <View style={{ width: s(32), height: s(32), backgroundColor: PALETTE.grey200, marginRight: s(8), borderRadius: s(4) }} />
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={{ height: vs(28), width: s(80), backgroundColor: PALETTE.grey200, borderRadius: s(14), marginRight: s(6) }} />
          ))}
        </View>
        <View style={{ height: 1, backgroundColor: PALETTE.grey200, marginHorizontal: s(10), marginBottom: vs(6) }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: s(10) }}>
          <View style={{ width: s(32), height: s(32), backgroundColor: PALETTE.grey200, marginRight: s(8), borderRadius: s(4) }} />
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={{ height: vs(28), width: s(80), backgroundColor: PALETTE.grey200, borderRadius: s(14), marginRight: s(6) }} />
          ))}
        </View>
      </View>
      <View style={{ backgroundColor: PALETTE.white, paddingHorizontal: s(12), paddingVertical: vs(14) }}>
        <View style={{ width: s(140), height: vs(16), backgroundColor: PALETTE.grey200, borderRadius: s(4), marginBottom: vs(6) }} />
        <View style={{ width: s(44), height: vs(2), backgroundColor: PALETTE.grey300 }} />
      </View>
      {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
    </>
  );
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const navigation = useNavigation();

  const [selectedCategory, setSelectedCategory] = useState('latest');
  const [trendingTags, setTrendingTags] = useState([]);
  const [allNewsSections, setAllNewsSections] = useState([]);
  const [breakingNews, setBreakingNews] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isLocationDrawerVisible, setIsLocationDrawerVisible] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('உள்ளூர்');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const flatListRef = useRef(null);

  const handleScroll = useCallback((e) => {
    setShowScrollTop(e.nativeEvent.contentOffset.y > 300);
  }, []);

  const scrollToTop = () =>
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });

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

  // ── Rasi Icon Mapping ───────────────────────────────────────────────────────
  const getRasiIconUrl = (rasiId, title) => {
    // Try to use original icon URL first, fallback to mapped URL
    const rasiIconMap = {
      'mesham': 'https://images.dinamalar.com/2024/josiyam/rasi/mesham.png',
      'rishabam': 'https://images.dinamalar.com/2024/josiyam/rasi/rishbam.png',
      'mithunam': 'https://images.dinamalar.com/2024/josiyam/rasi/mithunam.png',
      'kadakam': 'https://images.dinamalar.com/2024/josiyam/rasi/kadagam.png',
      'simmam': 'https://images.dinamalar.com/2024/josiyam/rasi/simam.png',
      'kanni': 'https://images.dinamalar.com/2024/josiyam/rasi/kani.png',
      'thulam': 'https://images.dinamalar.com/2024/josiyam/rasi/tulam.png',
      'viruchigam': 'https://images.dinamalar.com/2024/josiyam/rasi/viruchagam.png',
      'thanusu': 'https://images.dinamalar.com/2024/josiyam/rasi/dhanush.png',
      'makaram': 'https://images.dinamalar.com/2024/josiyam/rasi/maragam.png',
      'kumbam': 'https://images.dinamalar.com/2024/josiyam/rasi/kubakam.png',
      'meenam': 'https://images.dinamalar.com/2024/josiyam/rasi/meenam.png'
    };

    // Return mapped URL or fallback
    return rasiIconMap[rasiId] || `https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=100`;
  };

  // ─── Load Data ─────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      const [homeRes, shortRes, shortsRes, varthagamRes, varavaramRes, joshiyamRes, districtRes, premiumRes] = await Promise.allSettled([
        fetchHomeData(),
        fetchShortNews(),
        u38Api.get(API_ENDPOINTS.SHORTS),
        u38Api.get(API_ENDPOINTS.VARthagam),
        axios.get('https://u38.dinamalar.com/varavaram'), // Use full URL for varavaram
        u38Api.get(API_ENDPOINTS.JOSHIYAM),
        u38Api.get(API_ENDPOINTS.DISTRICT),
        u38Api.get(`/newsdata?cat=651`), // Premium API - NEWS_CATS.PREMIUM
      ]);

      if (homeRes.status === 'fulfilled') {
        const d = homeRes.value?.data;

        setBreakingNews(
          d?.breaking_news || d?.breakingnews || d?.ticker_text || d?.ticker || ''
        );

        const sections = [];
        const tharpothaiyaData = d?.tharpothaiya_seithigal?.[0]?.data || [];

        if (tharpothaiyaData.length > 0)
          sections.push({ title: d.tharpothaiya_seithigal[0].title || 'தற்போதைய செய்தி', data: tharpothaiyaData });
        if (d?.editorchoice?.data?.length > 0)
          sections.push({ title: d.editorchoice.title, data: d.editorchoice.data });
        if (d?.socialmedia?.data?.length > 0)
          sections.push({ title: d.socialmedia.title, data: d.socialmedia.data });
        if (d?.reels?.data?.length > 0)
          sections.push({ title: d.reels.title, data: d.reels.data, type: 'shorts' });
        if (d?.dinamalartv?.length > 0)
          sections.push({
            title: d.dinamalartv[0]?.ctitle || d.dinamalartv[0]?.title || 'டினமலர் டிவி',
            data: d.dinamalartv,
          });
        if (Array.isArray(d?.webstories) && d.webstories[0]?.data?.length > 0)
          sections.push({ title: d.webstories[0].title || 'வெப் ஸ்டோரிஸ்', data: d.webstories[0].data, type: 'shorts' });
        else if (d?.webstories?.data?.length > 0)
          sections.push({ title: d.webstories.title || 'வெப் ஸ்டோரிஸ்', data: d.webstories.data, type: 'shorts' });
        if (d?.kalvimalar?.data?.length > 0)
          sections.push({ title: d.kalvimalar.title || 'கல்வி மலர்', data: d.kalvimalar.data });
        if (d?.mixedcontent)
          d.mixedcontent.forEach((sec) => {
            if (sec?.data?.length > 0) sections.push({ title: sec.title, data: sec.data });
          });
        if (d?.dinamdinam) {
          const combined = []; let dynTitle = 'தினம் தினம்';
          d.dinamdinam.forEach((sec) => {
            if (sec?.data) {
              combined.push(...sec.data);
              if (sec.title && dynTitle === 'தினம் தினம்') dynTitle = sec.title;
            }
          });
          if (combined.length > 0) sections.push({ title: dynTitle, data: combined });
        }

        // Add dedicated shorts section if available
        if (shortsRes.status === 'fulfilled' && shortsRes.value?.data?.length > 0) {
          sections.push({
            title: 'ஷார்ட்ஸ்',
            data: shortsRes.value.data,
            type: 'shorts'
          });
        }

        // Add varthagam (business) section
        if (varthagamRes.status === 'fulfilled') {
          console.log('Varthagam API status: fulfilled');
          const varthagamData = [];
          const newlist = varthagamRes.value?.newlist || [];
          newlist.forEach((item, index) => {
            if (Array.isArray(item?.data)) {
              varthagamData.push(...item.data);
            }
          });
          if (varthagamData.length > 0) {
            sections.push({
              title: 'வர்த்தகம்',
              data: varthagamData
            });
          }
        }

        // Add varavaram section
        if (varavaramRes.status === 'fulfilled') {
          console.log('Varavaram API status: fulfilled');
          console.log('Varavaram raw response:', varavaramRes.value);
          console.log('Varavaram response keys:', Object.keys(varavaramRes.value || {}));

          const varavaramData = [];
          const newlist = varavaramRes.value?.newlist || [];
          console.log('Varavaram newlist length:', newlist.length);

          newlist.forEach((item, index) => {
            console.log(`Varavaram item ${index}:`, item);
            if (Array.isArray(item?.data)) {
              console.log(`Varavaram item ${index} data length:`, item.data.length);
              varavaramData.push(...item.data);
            }
          });

          console.log('Final varavaramData length:', varavaramData.length);
          if (varavaramData.length > 0) {
            console.log('Adding Varavaram section to sections array');
            sections.push({
              title: 'வரவரம்',
              data: varavaramData
            });
          } else {
            console.log('No varavaram data found');
          }
        } else {
          console.log('Varavaram API failed:', varavaramRes.reason);
        }

        // Add joshiyam (astrology) section  
        if (joshiyamRes.status === 'fulfilled') {
          const joshiyamData = [];
          const newlist = joshiyamRes.value?.newlist || [];
          newlist.forEach((item, index) => {
            if (Array.isArray(item?.data)) {
              console.log('Joshiyam item data:', item.data[0]); // Debug first item
              // Map icon URLs to reliable domain
              const mappedData = item.data.map(rasiItem => ({
                ...rasiItem,
                icon: getRasiIconUrl(rasiItem.id, rasiItem.title),
                originalIcon: rasiItem.icon // Keep original for debugging
              }));
              joshiyamData.push(...mappedData);
            }
          });
          console.log('Final joshiyamData with mapped icons:', joshiyamData); // Debug final array
          if (joshiyamData.length > 0) {
            sections.push({
              title: 'ஜோசியம்',
              data: joshiyamData
            });
          }
        }

        // Add premium section
        if (premiumRes.status === 'fulfilled') {
          console.log('Premium API status: fulfilled');
          console.log('Premium raw response:', premiumRes.value);

          const premiumData = premiumRes.value?.data || premiumRes.value?.newlist?.[0]?.data || [];
          console.log('Premium data length:', premiumData.length);

          if (premiumData.length > 0) {
            console.log('Adding Premium section to sections array');
            sections.push({
              title: 'பிரீமியம்',
              data: premiumData
            });
          } else {
            console.log('No Premium data to display');
          }
        } else {
          console.log('Premium error:', premiumRes.reason);
        }

        // Add district news section
        if (districtRes.status === 'fulfilled') {
          console.log('District API status: fulfilled');
          console.log('District raw response keys:', Object.keys(districtRes.value || {}));

          // District API has icons in district.data structure
          const districtData = [];

          // Check if data is in district.data (the correct structure with icons)
          const districtSection = districtRes.value?.district || {};
          const districtsList = districtSection?.data || [];
          console.log('District districtsList length:', districtsList.length);

          if (districtsList.length > 0) {
            // Filter out Ariyalur and ensure Madurai is included, then limit to top 5
            const filteredDistricts = districtsList
              .filter(district => district.title && !district.title.toLowerCase().includes('அரியலூர்') && !district.title.toLowerCase().includes('ariyalur'))
              .sort((a, b) => {
                // Prioritize Madurai to be in top 5
                const aIsMadurai = a.title && (a.title.toLowerCase().includes('மதுரை') || a.title.toLowerCase().includes('madurai'));
                const bIsMadurai = b.title && (b.title.toLowerCase().includes('மதுரை') || b.title.toLowerCase().includes('madurai'));

                if (aIsMadurai && !bIsMadurai) return -1;
                if (!aIsMadurai && bIsMadurai) return 1;
                return 0; // Keep original order for others
              })
              .slice(0, 5);

            const districtsData = filteredDistricts.map(district => ({
              title: district.title,
              etitle: district.etitle,
              id: district.id,
              slug: district.slug,
              icon: district.icon,
              data: Array.isArray(district?.data) ? district.data.slice(0, 3) : [] // Take first 3 news items
            }));

            // Show districts even if no news items - they can navigate to district news page
            console.log('Adding District section to sections array (filtered top 5)');
            console.log('All districts with icons:', districtsData.map(d => ({ title: d.title, icon: d.icon })));
            sections.push({
              title: 'மாவட்ட செய்திகள்',
              data: districtsData,
              type: 'district'
            });
          } else {
            // Fallback: check other locations
            console.log('Trying fallback locations...');

            // Check response.data.newlist (old structure)
            const responseData = districtRes.value?.data || {};
            const newlist = responseData?.newlist || [];
            if (newlist.length > 0) {
              console.log('Found newlist fallback:', newlist.length);
              const filteredDistricts = newlist
                .filter(district => district.title && !district.title.toLowerCase().includes('அரியலூர்') && !district.title.toLowerCase().includes('ariyalur'))
                .sort((a, b) => {
                  // Prioritize Madurai to be in top 5
                  const aIsMadurai = a.title && (a.title.toLowerCase().includes('மதுரை') || a.title.toLowerCase().includes('madurai'));
                  const bIsMadurai = b.title && (b.title.toLowerCase().includes('மதுரை') || b.title.toLowerCase().includes('madurai'));

                  if (aIsMadurai && !bIsMadurai) return -1;
                  if (!aIsMadurai && bIsMadurai) return 1;
                  return 0; // Keep original order for others
                })
                .slice(0, 5);

              const districtsData = filteredDistricts.map(district => ({
                title: district.title,
                etitle: district.etitle,
                id: district.id,
                slug: district.slug,
                icon: district.icon,
                data: Array.isArray(district?.data) ? district.data.slice(0, 3) : []
              }));

              // Show districts even if no news items
              if (districtsData.length > 0) {
                console.log('Adding District section from fallback (filtered top 5)');
                sections.push({
                  title: 'மாவட்ட செய்திகள்',
                  data: districtsData,
                  type: 'district'
                });
              }
            } else {
              console.log('No district data found in any location');
            }
          }
        } else {
          console.log('District error:', districtRes.reason);
        }

        console.log('Final sections array length:', sections.length);
        console.log('Section titles:', sections.map(s => s.title));

        setAllNewsSections(sections);
        setTrendingTags(
          d?.trending?.data?.length > 0 ? d.trending.data :
            d?.trending_tags?.length > 0 ? d.trending_tags :
              d?.subcatlist?.length > 0 ? d.subcatlist :
                d?.trending || []
        );
      }
    } catch (e) {
      console.error('HomeScreen loadAll error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const onRefresh = useCallback(() => { setRefreshing(true); loadAll(); }, [loadAll]);

  // ─── Navigation ────────────────────────────────────────────────────────────
  const goToArticle = (item) => {
    const category = item.maincat || item.categrorytitle || item.ctitle || item.maincategory || '';
    const districtId = item.districtid || item.district_id;
    const districtTitle = item.districttitle || item.district_title;

    // Debug: Log all available category fields
    console.log('=== goToArticle DEBUG ===');
    console.log('Item:', item);
    console.log('maincat:', item.maincat);
    console.log('categrorytitle:', item.categrorytitle);
    console.log('ctitle:', item.ctitle);
    console.log('maincategory:', item.maincategory);
    console.log('Final category:', category);
    console.log('========================');

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

    // Handle district-specific navigation
    if (districtId && districtTitle) {
      console.log('🎯 MATCH: District - Navigating to DistrictNewsScreen for district:', districtTitle);
      navigation?.navigate('DistrictNewsScreen', {
        districtId: districtId,
        districtTitle: districtTitle,
      });
      return;
    }

    // Joshiam - expanded variations
    if (categoryLower.includes('ஜோசியம்') || categoryLower.includes('joshiyam') ||
      categoryLower.includes('ஜோஷியம்') || categoryLower.includes('ராசி') ||
      categoryLower.includes('rasi') || categoryLower.includes('astrology')) {
      console.log('🎯 MATCH: Joshiam - Navigating to CommonSectionScreen');
      navigation?.navigate('CommonSectionScreen', {
        screenTitle: 'ஜோசியம்',
        apiEndpoint: '/joshiyam',
        allTabLink: '/joshiyam'
      });
      return;
    }

    // Default to NewsDetailsScreen for regular news
    console.log('❌ NO MATCH: Default navigation to NewsDetailsScreen');
    navigation?.navigate('NewsDetailsScreen', {
      newsId: item.id || item.newsid,
      newsItem: item,
    });
  };

  const goToShort = (item) => {
    // Try different possible link fields for shorts
    const link = item.link || item.url || item.weburl || item.share_url || item.external_url;

    if (link && (link.startsWith('http://') || link.startsWith('https://'))) {
      console.log('Opening short in Chrome:', link);
      Linking.openURL(link).catch(err => {
        console.error('Failed to open URL:', err);
        // Fallback to NewsDetailsScreen if link fails
        goToArticle(item);
      });
    } else {
      // Fallback to NewsDetailsScreen if no external link
      console.log('No external link found, falling back to NewsDetailsScreen');
      goToArticle(item);
    }
  };

  const goToSearch = () => navigation?.navigate('SearchScreen');
  const goToNotifs = () => navigation?.navigate('NotificationScreen');

  const handleMenuPress = (menuItem) => {
    const link = menuItem?.Link || menuItem?.link || '';
    const title = menuItem?.Title || menuItem?.title || '';
    const resolved = resolveScreenFromLink(link);
    if (!resolved) { navigation?.navigate('TimelineScreen', { catName: title }); return; }
    if (resolved.screen === '__external__') return;
    navigation?.navigate(
      resolved.screen,
      resolved.params ? { catName: title, ...resolved.params } : { catName: title }
    );
  };

  // ─── List Header ───────────────────────────────────────────────────────────
  const ListHeader = (
    <>
      {loading ? (
        <SkeletonLoader />
      ) : (
        <>
          {/* Advertisement placeholder */}
          <View style={styles.adBanner}>
            <Text style={styles.adLabel}>Advertisement</Text>
          </View>

          {/* Yellow breaking news ticker */}
          {/* <BreakingNewsTicker text={breakingNews} /> */}

          {/* Two-row category tabs */}
          <CategoryTab
            selectedCategory={selectedCategory}
            onCategoryPress={setSelectedCategory}
            trendingTags={trendingTags}
          />

          {/* News sections */}
          {allNewsSections.map((section, si) => (
            section.type === 'shorts' ? (
              <ShortsSection
                key={`sec-${si}`}
                title={section.title}
                data={section.data}
                onPress={goToShort}
              />
            ) : section.type === 'district' ? (
              // <View key={`sec-${si}`}>
              //   <SectionHeader title={section.title} />
              //   <DistrictNewsSection
              //     districts={section.data}
              //     onPress={(district) => {
              //       // Navigate to CommonSectionScreen with district parameters
              //       navigation?.navigate('CommonSectionScreen', {
              //         screenTitle: 'மாவட்ட செய்திகள்',
              //         apiEndpoint: '/district',
              //         allTabLink: '/district'
              //       });
              //     }}
              //   />
              // </View>
              null // District section hidden
            ) : (
              <View key={`sec-${si}`}>
                <SectionHeader title={section.title} />
                {section.data?.map((item, i) => (
                  <NewsCard
                    key={`${si}-${i}-${item.newsid || item.id || i}`}
                    item={item}
                    onPress={() => {
                      // Check if this is from a specific section by title
                      const sectionTitle = section.title?.toLowerCase() || '';
                      console.log('Section-based navigation check:', sectionTitle);

                      // Tharpothaiya section - go to NewsDetailsScreen instead
                      if (sectionTitle.includes('தர்போதைய') || sectionTitle.includes('tharpothaiya') ||
                        sectionTitle.includes('தற்போதைய') || sectionTitle.includes('தர்போதையா')) {
                        console.log('🎯 SECTION MATCH: Tharpothaiya - Navigating to NewsDetailsScreen');
                        navigation?.navigate('NewsDetailsScreen', {
                          newsId: item.newsid || item.id,
                          newsItem: item,
                          slug: item.slug || '',
                        });
                        return;
                      }

                      // Varavaram section
                      if (sectionTitle.includes('வரவரம்') || sectionTitle.includes('varavaram')) {
                        console.log('🎯 SECTION MATCH: Varavaram - Navigating to CommonSectionScreen');
                        navigation?.navigate('CommonSectionScreen', {
                          screenTitle: 'வரவரம்',
                          apiEndpoint: 'https://u38.dinamalar.com/varavaram',
                          allTabLink: 'https://u38.dinamalar.com/varavaram'
                        });
                        return;
                      }

                      // Varthagam/Business section
                      if (sectionTitle.includes('வர்த்தகம்') || sectionTitle.includes('varthagam') ||
                        sectionTitle.includes('business') || sectionTitle.includes('வணிகம்')) {
                        console.log('🎯 SECTION MATCH: Varthagam - Navigating to VarthagamScreen');
                        navigation?.navigate('VarthagamScreen');
                        return;
                      }

                      // Dinam Dinam section
                      if (sectionTitle.includes('தினம் தினம்') || sectionTitle.includes('dinamdinam') ||
                        sectionTitle.includes('தினம்தினம்')) {
                        console.log('🎯 SECTION MATCH: Dinam Dinam - Navigating to DinamDinamScreen');
                        navigation?.navigate('DinamDinamScreen');
                        return;
                      }

                      // Sports section
                      if (sectionTitle.includes('விளையாட்டு') || sectionTitle.includes('sports') ||
                        sectionTitle.includes('விளையாட்டுகள்')) {
                        console.log('🎯 SECTION MATCH: Sports - Navigating to SportsScreen');
                        navigation?.navigate('SportsScreen');
                        return;
                      }

                      // Tamil Nadu section
                      if (sectionTitle.includes('தமிழ்நாடு') || sectionTitle.includes('tamil nadu') ||
                        sectionTitle.includes('tamilnadu')) {
                        console.log('🎯 SECTION MATCH: Tamil Nadu - Navigating to TamilNaduScreen');
                        navigation?.navigate('TamilNaduScreen');
                        return;
                      }

                      // Joshiam section
                      if (sectionTitle.includes('ஜோசியம்') || sectionTitle.includes('joshiyam') ||
                        sectionTitle.includes('ஜோஷியம்')) {
                        console.log('🎯 SECTION MATCH: Joshiam - Navigating to CommonSectionScreen');
                        navigation?.navigate('CommonSectionScreen', {
                          screenTitle: 'ஜோசியம்',
                          apiEndpoint: '/joshiyam',
                          allTabLink: '/joshiyam'
                        });
                        return;
                      }

                      // Premium section
                      if (sectionTitle.includes('பிரீமியம்') || sectionTitle.includes('premium')) {
                        console.log('🎯 SECTION MATCH: Premium - Navigating to CommonSectionScreen');
                        navigation?.navigate('CommonSectionScreen', {
                          screenTitle: 'பிரீமியம்',
                          apiEndpoint: 'https://u38.dinamalar.com/newsdata?cat=651',
                          allTabLink: 'https://u38.dinamalar.com/newsdata?cat=651',
                        });
                        return;
                      }

                      // Fall back to item-based category detection
                      goToArticle(item);
                    }}
                  />
                ))}
              </View>
            )
          ))}
        </>
      )}
    </>
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.white} />

      <TopMenuStrip
        onMenuPress={handleMenuPress}
        onNotification={goToNotifs}
        notifCount={3}
      />

      <AppHeaderComponent
        onSearch={goToSearch}
        onMenu={() => setIsDrawerVisible(true)}
        onLocation={() => setIsLocationDrawerVisible(true)}
        selectedDistrict={selectedDistrict}
      />

      <DrawerMenu
        isVisible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
        onMenuPress={handleMenuPress}
        navigation={navigation}
      />

      <LocationDrawer
        isVisible={isLocationDrawerVisible}
        onClose={() => setIsLocationDrawerVisible(false)}
        onSelectDistrict={handleSelectDistrict}
        selectedDistrict={selectedDistrict}
      />

      <FlatList
        ref={flatListRef}
        data={[]}
        renderItem={null}
        keyExtractor={(_, i) => `empty-${i}`}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={!loading ? <FooterMenu /> : null}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PALETTE.primary]}
            tintColor={PALETTE.primary}
          />
        }
      />

      {showScrollTop && (
        <TouchableOpacity style={styles.scrollTopBtn} onPress={scrollToTop} activeOpacity={0.85}>
          <Ionicons name="arrow-up" size={s(20)} color={PALETTE.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Main Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.grey100,
    paddingTop: Platform.OS === 'android' ? vs(30) : 0,
  },

  // ── App Header ──────────────────────────────────────────────────────────────
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.white,
    paddingTop: Platform.OS === 'android' ? vs(10) : vs(50),
    paddingBottom: vs(10),
    paddingHorizontal: s(14),
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.grey200,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  appHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  appHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(14),
  },
  logoImage: {
    width: s(130),
    height: vs(32),
  },

  // Plain touch target for icon buttons — no border, no background
  headerIconBtn: {
    padding: s(2),
  },

  // Location — NO border box, just inline icon+text+chevron all blue
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(3),
  },
  locationText: {
    // fontSize: scaleFont(13), ← REMOVED, now inline sf()
    color: PALETTE.primary,
    fontFamily: FONTS.muktaMalar.bold,
  },

  // ── Feed ────────────────────────────────────────────────────────────────────
  feedContent: { paddingBottom: vs(30) },

  // ── Ad Banner ───────────────────────────────────────────────────────────────
  adBanner: {
    height: vs(200),
    backgroundColor: PALETTE.grey200,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.grey300,
  },
  adLabel: {
    fontSize: ms(14),
    color: PALETTE.grey400,
    fontFamily: FONTS.muktaMalar.regular,
    letterSpacing: 0.5,
  },

  // ── Section Header ──────────────────────────────────────────────────────────
  sectionHeader: {
    backgroundColor: PALETTE.white,
    paddingHorizontal: s(12),
    paddingTop: vs(14),
    paddingBottom: vs(10),
  },
  sectionTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    // fontSize: scaleFont(18), ← REMOVED, now inline sf()
    color: PALETTE.grey800,
    marginBottom: vs(2),
  },
  sectionUnderline: {
    height: vs(4),
    width: s(45),
    backgroundColor: PALETTE.primary,
  },

  // ── Scroll Top Button ────────────────────────────────────────────────────────
  scrollTopBtn: {
    position: 'absolute',
    bottom: vs(50),
    right: s(16),
    width: s(42),
    height: s(42),
    borderRadius: s(21),
    backgroundColor: PALETTE.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: vs(2) },
    shadowOpacity: 0.22,
    shadowRadius: s(4),
    zIndex: 100,
  },

  // ── District News Section ───────────────────────────────────────────────────────
  districtSection: {
    backgroundColor: PALETTE.white,
    marginBottom: vs(8),
  },
  districtListContainer: {
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
  },
  districtCard: {
    backgroundColor: PALETTE.white,
    // borderRadius: s(8),
    borderWidth: 1,
    borderColor: PALETTE.grey200,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    marginBottom: s(12),
  },
  districtHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(12),
    paddingHorizontal: s(8),
    backgroundColor: PALETTE.grey50,
  },
  districtIconContainer: {
    width: s(50),
    height: s(50),
    backgroundColor: PALETTE.white,
    borderRadius: s(25),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: s(10),
    borderWidth: 1,
    borderColor: PALETTE.grey300,
    flexShrink: 0,
  },
  districtIcon: {
    width: s(36),
    height: s(36),
  },
  defaultIconContainer: {
    width: s(36),
    height: s(36),
    backgroundColor: PALETTE.primary,
    borderRadius: s(18),
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultIconText: {
    fontFamily: FONTS.muktaMalar.bold,
    // fontSize: scaleFont(16), ← REMOVED, now inline sf()
    color: PALETTE.white,
    textAlign: 'center',
  },
  districtName: {
    fontFamily: FONTS.muktaMalar.bold,
    // fontSize: scaleFont(12), ← REMOVED, now inline sf()
    color: PALETTE.grey800,
    textAlign: 'left',
    // lineHeight: scaleFont(15), ← REMOVED, now inline sf()
    flex: 1,
  },
  districtNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  forwardIcon: {
    marginLeft: s(6),
  },
  districtDivider: {
    height: 1,
    backgroundColor: PALETTE.grey200,
  },
  newsItemsContainer: {
    paddingVertical: vs(8),
  },
  newsItemRow: {
    flexDirection: 'column',
    // paddingHorizontal: s(8),
    paddingVertical: vs(6),
    alignItems: 'stretch',
  },
  newsItemImage: {
    width: '100%',
    height: vs(80),
    // borderRadius: s(4),
    backgroundColor: PALETTE.grey200,
    marginBottom: vs(8),
  },
  newsItemInfo: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: s(8)
  },
  newsItemTitle: {
    fontFamily: FONTS.muktaMalar.regular,
    // fontSize: scaleFont(10), ← REMOVED, now inline sf()
    color: PALETTE.grey800,
    // lineHeight: scaleFont(12), ← REMOVED, now inline sf()
    marginBottom: vs(3),
  },
  newsItemTime: {
    fontFamily: FONTS.muktaMalar.regular,
    // fontSize: scaleFont(9), ← REMOVED, now inline sf()
    color: PALETTE.grey500,
  },
});