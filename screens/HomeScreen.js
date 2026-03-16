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
import { CDNApi, API_ENDPOINTS } from '../config/api';
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
 import { useFontSize } from '../context/FontSizeContext';
 
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
  const { sf } = useFontSize();

  return (
    <View style={styles.appHeader}>
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
        <TouchableOpacity onPress={onSearch} style={styles.headerIconBtn}>
          <Ionicons name="search" size={s(18)} color={PALETTE.primary} />
        </TouchableOpacity>

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
    fontFamily: FONTS.muktaMalar.bold,
  },
});

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title }) {
  const { sf } = useFontSize();

  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { fontSize: sf(18) }]}>{title}</Text>
      <View style={styles.sectionUnderline} />
    </View>
  );
}

// ─── Shorts Section ────────────────────────────────────────────────────────────
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
function ShortsCard({ item, onPress }) {
  const { sf } = useFontSize();

  const imageUri =
    item.thumbnail || item.largeimages || item.images || item.image ||
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';
  const title = item.newstitle || item.title || item.videotitle || item.name || '';
  const hasVideo = item.video && item.video !== '0';

  return (
    <TouchableOpacity style={shortsSt.card} onPress={onPress} activeOpacity={0.85}>
      <View style={shortsSt.imageContainer}>
        <Image source={{ uri: imageUri }} style={shortsSt.image} resizeMode="cover" />

        {title && (
          <View style={shortsSt.titleOverlay}>
            <Text style={[shortsSt.bottomTitle, { fontSize: sf(10) }]}>{title}</Text>
          </View>
        )}

        {hasVideo && (
          <View style={shortsSt.playOverlay}>
            <View style={shortsSt.playButton}>
              <Ionicons name="play" size={s(12)} color="#fff" />
            </View>
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
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: vs(6),
    paddingHorizontal: s(8),
  },
  bottomTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
  },
  overlayTitle: {
    position: 'absolute',
    bottom: vs(8),
    left: s(8),
    right: s(8),
    fontFamily: FONTS.muktaMalar.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
  },
});

// ─── News Card ────────────────────────────────────────────────────────────────
function NewsCard({ item, onPress, isSocialMedia = false }) {
  const { sf } = useFontSize();

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
        <View style={NewsCardStyles.imageWrap}>
          <Image
            source={{ uri: imageUri }}
            style={
              isSocialMedia
                ? [NewsCardStyles.image, { height: 400 }]
                : NewsCardStyles.image
            }
            resizeMode={isSocialMedia ? "cover" : "contain"}
          />
        </View>

        <View style={NewsCardStyles.contentContainer}>
          {!!title && (
            <Text style={[NewsCardStyles.title, { fontSize: sf(15), lineHeight: sf(22) }]} numberOfLines={3}>{title}</Text>
          )}

          {!!category && (
            <View style={NewsCardStyles.catPill}>
              <Text style={[NewsCardStyles.catText, { fontSize: sf(11) }]}>{category}</Text>
            </View>
          )}

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

      <View style={NewsCardStyles.divider} />
    </View>
  );
}

// ─── Dinamalar TV Card ────────────────────────────────────────────────────────
// NewsCard-style layout with play button overlay — tapping opens VideoPlayerModal
function DinaMalarTVCard({ item, onVideoPress }) {
  const { sf } = useFontSize();

  const imageUri =
    item.largeimages || item.images || item.image || item.thumbnail || item.thumb ||
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';

  const title = item.newstitle || item.title || item.videotitle || item.name || '';
  const category = item.maincat || item.categrorytitle || item.ctitle || item.maincategory || '';
  const ago = item.ago || item.time_ago || '';
  const newscomment = item.newscomment || item.commentcount || '';

  return (
    <View style={NewsCardStyles.wrap}>
      <TouchableOpacity onPress={onVideoPress} activeOpacity={0.88}>

        {/* Thumbnail with play-button overlay */}
        <View style={NewsCardStyles.imageWrap}>
          <Image source={{ uri: imageUri }} style={[NewsCardStyles.image, { height: ms(200) }]} resizeMode="contain" />

          {/* Semi-transparent scrim + centred play circle */}
          <View style={tvCardSt.playOverlay}>
            <View style={tvCardSt.playCircle}>
              <Ionicons name="play" size={s(22)} color="#fff" />
            </View>
          </View>

          {/* "TV" badge — top-left corner */}
          {/* <View style={tvCardSt.badge}>
            <Ionicons name="videocam" size={s(10)} color="#fff" style={{ marginRight: s(3) }} />
            <Text style={tvCardSt.badgeText}>TV</Text>
          </View> */}
        </View>

        {/* Text content — identical structure to NewsCard */}
        <View style={NewsCardStyles.contentContainer}>
          {!!title && (
            <Text
              style={[NewsCardStyles.title, { fontSize: sf(15), lineHeight: sf(22) }]}
              numberOfLines={3}
            >
              {title}
            </Text>
          )}

          {!!category && (
            <View style={NewsCardStyles.catPill}>
              <Text style={[NewsCardStyles.catText, { fontSize: sf(11) }]}>{category}</Text>
            </View>
          )}

          <View style={NewsCardStyles.metaRow}>
            <Text style={[NewsCardStyles.timeText, { fontSize: sf(11) }]}>{ago}</Text>
            <View style={NewsCardStyles.metaRight}>
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

// ─── Dinamalar TV Section (with Live / Sports / Cinema tabs) ─────────────────
const TV_TABS = [
  { key: 'live', label: 'Live', ta: 'Live', vCategory: '5050', slug: '/videos/live-and-recorded' },
  { key: 'sports', label: 'விளையாட்டு', ta: 'விளையாட்டு', vCategory: '594', slug: '/videos/sports-tamil-videos' },
  { key: 'cinema', label: 'சினிமா', ta: 'சினிமா', vCategory: '594', slug: '/videos/tamil-cinema-videos' },
];

// Map API maincat values → tab key
function getTabKey(item) {
  // First check by VCategory (actual field from API)
  const vCategory = String(item.VCategory || item.maincatid || '');
  const maincat = (item.maincat || '').toLowerCase();
  const ctitle = (item.ctitle || '').toLowerCase();
  
  if (vCategory === '5050') return 'live';
  
  // For VCategory 594, differentiate by category name
  if (vCategory === '594') {
    if (ctitle.includes('சினிமா') || maincat.includes('cinema')) return 'cinema';
    if (ctitle.includes('விளையாட்டு') || maincat.includes('sport')) return 'sports';
    // Default to sports if unclear
    return 'sports';
  }
  
  // Fallback to category name matching
  const cat = (item.maincat || item.categrorytitle || item.maincategory || '').toLowerCase();
  
  if (cat.includes('live') || cat.includes('நேரலை') || cat.includes('நேரட')) return 'live';
  if (cat.includes('sport') || cat.includes('விளையாட்') || cat.includes('cricket') || cat.includes('football')) return 'sports';
  if (cat.includes('cinema') || cat.includes('சினிமா') || cat.includes('movie') || cat.includes('film')) return 'cinema';
  
  return 'live'; // default
}

function DinaMalarTVSection({ data, onVideoPress }) {
  const { sf } = useFontSize();
  const [activeTab, setActiveTab] = useState('live');

  // Group items by tab
  const grouped = {};
  TV_TABS.forEach(t => { grouped[t.key] = []; });
  (data || []).forEach(item => {
    const key = getTabKey(item);
    grouped[key].push(item);
  });

  // If active tab is empty, fall back to first tab that has items
  const displayTab = grouped[activeTab]?.length > 0
    ? activeTab
    : TV_TABS.find(t => grouped[t.key]?.length > 0)?.key || 'live';

  const displayItems = grouped[displayTab] || [];
  
  return (
    <View>
      {/* Section header row with tabs */}
      <View style={tvSecSt.headerRow}>
        <View style={tvSecSt.titleWrap}>
          <Text style={[tvSecSt.sectionTitle, { fontSize: sf(16) }]}>தினமலர் டிவி</Text>
          <View style={tvSecSt.titleUnderline} />
        </View>
      </View>

      {/* Tab bar */}
      <View style={tvSecSt.tabBar}>
        {TV_TABS.map(tab => {
          const isActive = activeTab === tab.key;
          const hasItems = grouped[tab.key]?.length > 0;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[tvSecSt.tab, isActive && tvSecSt.tabActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.7}
            >
              {tab.key === 'live' && isActive && (
                <View style={tvSecSt.liveDot} />
              )}
              <Text style={[tvSecSt.tabText, { fontSize: sf(13) }, isActive && tvSecSt.tabTextActive]}>
                {tab.ta}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Cards for active tab */}
      {displayItems.length > 0
        ? displayItems.map((item, i) => (
          <DinaMalarTVCard
            key={`tv-${displayTab}-${i}-${item.newsid || i}`}
            item={item}
            onVideoPress={() => onVideoPress(item)}
          />
        ))
        : (
          <View style={{ paddingVertical: s(24), alignItems: 'center' }}>
            <Text style={{ color: PALETTE.grey500, fontSize: sf(13) }}>தகவல் இல்லை</Text>
          </View>
        )
      }
    </View>
  );
}

const tvSecSt = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: s(12),
    paddingTop: vs(14),
    paddingBottom: vs(4),
  },
  titleWrap: { gap: vs(3) },
  sectionTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    color: PALETTE.textDark,
  },
  titleUnderline: {
    height: 3,
    width: s(40),
    backgroundColor: PALETTE.primary,
    borderRadius: 2,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: s(12),
    paddingBottom: vs(6),
    gap: s(8),
    justifyContent: "center",
    alignItems: "center"
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(12),
    paddingVertical: vs(5),
    borderRadius: s(5),
    borderWidth: 1,
    borderColor: PALETTE.grey200 || '#e0e0e0',
    backgroundColor: '#f5f5f5',
    gap: s(4),
  },
  tabActive: {
    backgroundColor: PALETTE.grey300,
    borderBottomColor: PALETTE.grey800,


  },
  tabText: {
    fontFamily: FONTS.muktaMalar.regular,
    color: PALETTE.grey800,
  },
  tabTextActive: {
    color: PALETTE.grey800,
    fontFamily: FONTS.muktaMalar.medium,
  },
  liveDot: {
    width: s(8),
    height: s(8),
    borderRadius: s(4),
    backgroundColor: '#ff3b30',
  },
});

const tvCardSt = StyleSheet.create({
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  badge: {
    position: 'absolute',
    top: s(8),
    left: s(8),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.primary,
    borderRadius: s(4),
    paddingHorizontal: s(6),
    paddingVertical: s(3),
  },
  badgeText: {
    color: '#fff',
    fontSize: ms(9),
    fontFamily: FONTS.muktaMalar.bold,
    letterSpacing: 0.5,
  },
});

// ─── District News Section ────────────────────────────────────────────────────────
function DistrictNewsSection({ districts, onPress }) {
  const { sf } = useFontSize();

  return (
    <View style={styles.districtSection}>
      <FlatList
        data={districts}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id?.toString() || item.title}
        scrollEnabled={false}
        renderItem={({ item, index }) => {
          return (
            <TouchableOpacity
              style={styles.districtCard}
              onPress={() => onPress(item)}
              activeOpacity={0.8}
            >
              <View style={styles.districtHeader}>
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

              <View style={styles.districtDivider} />

              {item.data && item.data.length > 0 && (
                <View style={styles.newsItemsContainer}>
                  {item.data.slice(0, 5).map((newsItem, idx) => (
                    <View key={`${item.id}-news-${idx}`} style={styles.newsItemRow}>
                      <Image
                        source={{ uri: newsItem.image || newsItem.largeimages || newsItem.images || newsItem.thumbnail || 'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400' }}
                        style={styles.newsItemImage}
                        resizeMode="cover"
                        onError={() => console.log('Failed to load news image')}
                      />

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
    return rasiIconMap[rasiId] || `https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=100`;
  };

  // ─── Load Data ─────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      const [homeRes, shortRes, shortsRes, varthagamRes, varavaramRes, joshiyamRes, districtRes, premiumRes] = await Promise.allSettled([
        fetchHomeData(),
        fetchShortNews(),
        CDNApi.get(API_ENDPOINTS.SHORTS),
        CDNApi.get(API_ENDPOINTS.VARthagam),
        axios.get('https://api-st-cdn.dinamalar.com/varavaram'),
        CDNApi.get(API_ENDPOINTS.JOSHIYAM),
        CDNApi.get(API_ENDPOINTS.DISTRICT),
        CDNApi.get(`/newsdata?cat=651`),
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

        if (d?.socialmedia?.data?.length > 0) {
          const socialTitle = d.socialmedia.title || 'Social Media';
          sections.push({ title: socialTitle, data: d.socialmedia.data, isSocialMedia: true });
        }

        if (d?.bannernews?.[0]?.data?.length > 0)
          sections.push({ title: d.bannernews[0].title || 'தலைப்பு செய்தி', data: d.bannernews[0].data });

        if (d?.catroons?.[0]?.data?.length > 0)
          sections.push({ title: d.catroons[0].title || 'கார்ட்டூன்ஸ்', data: d.catroons[0].data });

        if (d?.premium_stories?.data?.length > 0)
          sections.push({ title: d.premium_stories.title || 'பிரீமியம் ஸ்டோரி', data: d.premium_stories.data });

        if (d?.reels?.data?.length > 0)
          sections.push({ title: d.reels.title, data: d.reels.data, type: 'shorts' });

        // ── Dinamalar TV — type: 'video' → renders DinaMalarTVSection ──
        if (d?.dinamalartv?.length > 0) {
          // Tag live items so getTabKey can identify them
          const liveItems = (d?.live || []).map(item => ({ ...item, maincat: 'live' }));
          const tvItems = d.dinamalartv;
          sections.push({
            title: 'தினமலர் டிவி',
            data: [...liveItems, ...tvItems],
            type: 'video',
          });
        } else {
        }

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
        if (d?.sports?.data?.length > 0)
          sections.push({ title: d.sports.title || 'விளையாட்டு', data: d.sports.data.slice(0, 3) });

        if (d?.varthagam?.varthagam1?.data?.length > 0) {
          const flattenedData = [];
          d.varthagam.varthagam1.data.forEach((array) => {
            if (Array.isArray(array)) {
              flattenedData.push(...array);
            }
          });
          if (flattenedData.length > 0) {
            sections.push({ title: d.varthagam.varthagam1.title || 'வர்த்தகம்', data: flattenedData.slice(0, 3) });
          }
        }



        if (Array.isArray(d?.webstories) && d.webstories[0]?.data?.length > 0)
          sections.push({ title: d.webstories[0].title || 'வெப் ஸ்டோரிஸ்', data: d.webstories[0].data, type: 'shorts' });
        else if (d?.webstories?.data?.length > 0)
          sections.push({ title: d.webstories.title || 'வெப் ஸ்டோரிஸ்', data: d.webstories.data, type: 'shorts' });

        // if (d?.kalvimalar?.data?.length > 0)
        //   sections.push({ title: d.kalvimalar.title || 'கல்வி மலர்', data: d.kalvimalar.data });

        // if (d?.special?.data?.length > 0)
        //   sections.push({ title: d.special.title || 'ஸ்பெஷல்', data: d.special.data });

        // if (d?.audio?.[0]?.data?.length > 0)
        //   sections.push({ title: d.audio[0].title || 'பாட்காஸ்ட்', data: d.audio[0].data });

        // ── Live — merged into Dinamalar TV section above ──



        if (shortsRes.status === 'fulfilled' && shortsRes.value?.data?.length > 0) {
          sections.push({
            title: 'ஷார்ட்ஸ்',
            data: shortsRes.value.data,
            type: 'shorts'
          });
        }

        if (varthagamRes.status === 'fulfilled') {
          const varthagamData = [];
          const newlist = varthagamRes.value?.newlist || [];
          newlist.forEach((item) => {
            if (Array.isArray(item?.data)) varthagamData.push(...item.data);
          });
          if (varthagamData.length > 0) {
            sections.push({ title: 'வர்த்தகம்', data: varthagamData });
          }
        }

        if (joshiyamRes.status === 'fulfilled') {
          const joshiyamData = [];
          const newlist = joshiyamRes.value?.newlist || [];
          newlist.forEach((item) => {
            if (Array.isArray(item?.data)) {
              const mappedData = item.data.map(rasiItem => ({
                ...rasiItem,
                icon: getRasiIconUrl(rasiItem.id, rasiItem.title),
                originalIcon: rasiItem.icon
              }));
              joshiyamData.push(...mappedData);
            }
          });
          if (joshiyamData.length > 0) {
            sections.push({ title: 'ஜோசியம்', data: joshiyamData });
          }
        }

        if (districtRes.status === 'fulfilled') {
          const districtSection = districtRes.value?.district || {};
          const districtsList = districtSection?.data || [];

          if (districtsList.length > 0) {
            const filteredDistricts = districtsList
              .filter(district => district.title && !district.title.toLowerCase().includes('அரியலூர்') && !district.title.toLowerCase().includes('ariyalur'))
              .sort((a, b) => {
                const aIsMadurai = a.title && (a.title.toLowerCase().includes('மதுரை') || a.title.toLowerCase().includes('madurai'));
                const bIsMadurai = b.title && (b.title.toLowerCase().includes('மதுரை') || b.title.toLowerCase().includes('madurai'));
                if (aIsMadurai && !bIsMadurai) return -1;
                if (!aIsMadurai && bIsMadurai) return 1;
                return 0;
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

            sections.push({
              title: 'மாவட்ட செய்திகள்',
              data: districtsData,
              type: 'district'
            });
          } else {
            const responseData = districtRes.value?.data || {};
            const newlist = responseData?.newlist || [];
            if (newlist.length > 0) {
              const filteredDistricts = newlist
                .filter(district => district.title && !district.title.toLowerCase().includes('அரியலூர்') && !district.title.toLowerCase().includes('ariyalur'))
                .sort((a, b) => {
                  const aIsMadurai = a.title && (a.title.toLowerCase().includes('மதுரை') || a.title.toLowerCase().includes('madurai'));
                  const bIsMadurai = b.title && (b.title.toLowerCase().includes('மதுரை') || b.title.toLowerCase().includes('madurai'));
                  if (aIsMadurai && !bIsMadurai) return -1;
                  if (!aIsMadurai && bIsMadurai) return 1;
                  return 0;
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

              if (districtsData.length > 0) {
                sections.push({
                  title: 'மாவட்ட செய்திகள்',
                  data: districtsData,
                  type: 'district'
                });
              }
            }
          }
        }

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
    const categoryLower = category.toLowerCase().trim();

    if (categoryLower.includes('தர்போதைய') || categoryLower.includes('tharpothaiya') ||
      categoryLower.includes('தர்போதைய செய்திகள்') || categoryLower.includes('தர்போதையா') ||
      categoryLower.includes('தற்போதைய') || categoryLower.includes('தற்போதைய செய்தி') ||
      categoryLower.includes('தர்போதையா') || categoryLower.includes('தர்போதையா செய்தி')) {
      navigation?.navigate('TharpothaiyaSeithigalScreen');
      return;
    }

    if (categoryLower.includes('வர்த்தகம்') || categoryLower.includes('varthagam') ||
      categoryLower.includes('business') || categoryLower.includes('வணிகம்') ||
      (item.maincategory === 'varthagam' || item.maincat === 'varthagam')) {
      navigation?.navigate('VarthagamScreen');
      return;
    }

    if (categoryLower.includes('தினம் தினம்') || categoryLower.includes('dinamdinam') ||
      categoryLower.includes('தினம்தினம்')) {
      navigation?.navigate('DinamDinamScreen');
      return;
    }

    if (categoryLower.includes('விளையாட்டு') || categoryLower.includes('sports') ||
      categoryLower.includes('விளையாட்டுகள்') || categoryLower.includes('sport')) {
      navigation?.navigate('SportsScreen');
      return;
    }

    if (categoryLower.includes('தமிழ்நாடு') || categoryLower.includes('tamil nadu') ||
      categoryLower.includes('tamilnadu')) {
      navigation?.navigate('TamilNaduScreen');
      return;
    }

    if (districtId && districtTitle) {
      navigation?.navigate('DistrictNewsScreen', { districtId, districtTitle });
      return;
    }

    if (categoryLower.includes('ஜோசியம்') || categoryLower.includes('joshiyam') ||
      categoryLower.includes('ஜோஷியம்') || categoryLower.includes('ராசி') ||
      categoryLower.includes('rasi') || categoryLower.includes('astrology')) {
      navigation?.navigate('CommonSectionScreen', {
        screenTitle: 'ஜோசியம்',
        apiEndpoint: '/joshiyam',
        allTabLink: '/joshiyam'
      });
      return;
    }

    navigation?.navigate('NewsDetailsScreen', {
      newsId: item.id || item.newsid,
      newsItem: item,
    });
  };

  const goToShort = (item) => {
    const link = item.link || item.url || item.weburl || item.share_url || item.external_url;
    if (link && (link.startsWith('http://') || link.startsWith('https://'))) {
      Linking.openURL(link).catch(() => goToArticle(item));
    } else {
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

          {/* Two-row category tabs */}
          <CategoryTab
            selectedCategory={selectedCategory}
            onCategoryPress={setSelectedCategory}
            trendingTags={trendingTags}
          />

          {/* News sections */}
          {allNewsSections.map((section, si) => (
            // ── Shorts (horizontal scroll) ──────────────────────────────────
            section.type === 'shorts' ? (
              <ShortsSection
                key={`sec-${si}`}
                title={section.title}
                data={section.data}
                onPress={goToShort}
              />

              // ── Video (Dinamalar TV) → tabbed DinaMalarTVSection ───────────
            ) : section.type === 'video' ? (
              <DinaMalarTVSection
                key={`sec-${si}`}
                data={section.data}
                onVideoPress={(item) => {
                  navigation?.navigate('VideoDetailScreen', {
                    videoId: item.videoid || item.id || item.newsid,
                    video: item,
                  });
                }}
              />

              // ── District (hidden) ───────────────────────────────────────────
            ) : section.type === 'district' ? (
              null

              // ── Regular news ────────────────────────────────────────────────
            ) : (
              <View key={`sec-${si}`}>
                <SectionHeader title={section.title} />
                {section.data?.map((item, i) => (
                  <NewsCard
                    key={`${si}-${i}-${item.newsid || item.id || i}`}
                    item={item}
                    isSocialMedia={section.isSocialMedia || false}
                    isPremium={section.title?.toLowerCase().includes('பிரீமியம்') || section.title?.toLowerCase().includes('premium')}
                    onPress={() => {
                      const sectionTitle = section.title?.toLowerCase() || '';

                      if (sectionTitle.includes('தர்போதைய') || sectionTitle.includes('tharpothaiya') ||
                        sectionTitle.includes('தற்போதைய') || sectionTitle.includes('தர்போதையா')) {
                        navigation?.navigate('NewsDetailsScreen', {
                          newsId: item.newsid || item.id,
                          newsItem: item,
                          slug: item.slug || '',
                          newsList: section.data,
                        });
                        return;
                      }

                      if (sectionTitle.includes('வாராவாரம்') || sectionTitle.includes('varavaram')) {
                        navigation?.navigate('CommonSectionScreen', {
                          screenTitle: 'வாராவாரம்',
                          apiEndpoint: 'https://api-st-cdn.dinamalar.com/varavaram',
                          allTabLink: 'https://api-st-cdn.dinamalar.com/varavaram'
                        });
                        return;
                      }

                      if (sectionTitle.includes('வர்த்தகம்') || sectionTitle.includes('varthagam') ||
                        sectionTitle.includes('business') || sectionTitle.includes('வணிகம்')) {
                        navigation?.navigate('VarthagamScreen');
                        return;
                      }

                      if (sectionTitle.includes('தினம் தினம்') || sectionTitle.includes('dinamdinam') ||
                        sectionTitle.includes('தினம்தினம்')) {
                        navigation?.navigate('DinamDinamScreen');
                        return;
                      }

                      if (sectionTitle.includes('விளையாட்டு') || sectionTitle.includes('sports') ||
                        sectionTitle.includes('விளையாட்டுகள்')) {
                        navigation?.navigate('SportsScreen');
                        return;
                      }

                      if (sectionTitle.includes('தமிழ்நாடு') || sectionTitle.includes('tamil nadu') ||
                        sectionTitle.includes('tamilnadu')) {
                        navigation?.navigate('TamilNaduScreen');
                        return;
                      }

                      if (sectionTitle.includes('ஜோசியம்') || sectionTitle.includes('joshiyam') ||
                        sectionTitle.includes('ஜோஷியம்')) {
                        navigation?.navigate('CommonSectionScreen', {
                          screenTitle: 'ஜோசியம்',
                          apiEndpoint: '/joshiyam',
                          allTabLink: '/joshiyam'
                        });
                        return;
                      }

                      if (sectionTitle.includes('பிரீமியம்') || sectionTitle.includes('premium')) {
                        navigation?.navigate('CommonSectionScreen', {
                          screenTitle: 'பிரீமியம்',
                          apiEndpoint: 'https://api-st-cdn.dinamalar.com/newsdata?cat=651',
                          allTabLink: 'https://api-st-cdn.dinamalar.com/newsdata?cat=651',
                        });
                        return;
                      }

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
  headerIconBtn: {
    padding: s(2),
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(3),
  },
  locationText: {
    color: PALETTE.primary,
    fontFamily: FONTS.muktaMalar.bold,
  },

  feedContent: { paddingBottom: vs(30) },

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

  sectionHeader: {
    backgroundColor: PALETTE.white,
    paddingHorizontal: s(12),
    paddingTop: vs(14),
    paddingBottom: vs(10),
  },
  sectionTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    color: PALETTE.grey800,
    marginBottom: vs(2),
  },
  sectionUnderline: {
    height: vs(4),
    width: s(45),
    backgroundColor: PALETTE.primary,
  },

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
    color: PALETTE.white,
    textAlign: 'center',
  },
  districtName: {
    fontFamily: FONTS.muktaMalar.bold,
    color: PALETTE.grey800,
    textAlign: 'left',
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
    paddingVertical: vs(6),
    alignItems: 'stretch',
  },
  newsItemImage: {
    width: '100%',
    height: vs(80),
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
    color: PALETTE.grey800,
    marginBottom: vs(3),
  },
  newsItemTime: {
    fontFamily: FONTS.muktaMalar.regular,
    color: PALETTE.grey500,
  },
});