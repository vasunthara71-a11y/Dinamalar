// HomeScreen.js
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { WebView } from 'react-native-webview';
import { CDNApi, mainApi, API_ENDPOINTS } from '../config/api';
import axios from 'axios';
import { COLORS, FONTS, NewsCard as NewsCardStyles } from '../utils/constants';
import { ms, s, vs } from '../utils/scaling';
import { fetchHomeData, fetchShortNews } from '../api/news';
import { api } from '../config/api';
import DrawerMenu from '../components/DrawerMenu';
import CategoryTab from '../components/CategoryTab';
import { SvgUri } from 'react-native-svg';
import FooterMenu from '../components/FooterMenu';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useFontSize } from '../context/FontSizeContext';
import LocationDrawer from '../components/LocationDrawer';
import TopMenuStrip from '../components/TopMenuStrip';
import AppHeaderComponent from '../components/AppHeaderComponent';
import DinamalarCalendar from '../components/DinamalarCalendar';

// ─── Share Market Card ────────────────────────────────────────────────
function ShareMarketCard({ commodity }) {
  const markets = commodity?.sharemarket || [];
  if (!markets.length) return null;

  return (
    <View style={shareMarketStyles.wrap}>
      <View style={shareMarketStyles.header}>
        <Text style={shareMarketStyles.icon}>📈</Text>
        <Text style={shareMarketStyles.title}>பங்கு சந்தை</Text>
      </View>
      <View style={shareMarketStyles.row}>
        {markets.map((m, i) => {
          const isUp = m.change !== 'down';
          return (
            <React.Fragment key={i}>
              {i > 0 && <View style={shareMarketStyles.divider} />}
              <View style={shareMarketStyles.col}>
                <Text style={shareMarketStyles.label}>{m.stype?.toUpperCase()}</Text>
                <Text style={shareMarketStyles.value}>{m.value}</Text>
                <View style={shareMarketStyles.diffRow}>
                  <Text style={[shareMarketStyles.diffText, { color: isUp ? '#16a34a' : '#dc2626' }]}>
                    {m.diff}
                  </Text>
                  <Ionicons
                    name={isUp ? 'caret-up' : 'caret-down'}
                    size={s(10)}
                    color={isUp ? '#16a34a' : '#dc2626'}
                  />
                </View>
                <Text style={shareMarketStyles.dateText}>{m.date}</Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const shareMarketStyles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.cardBackground,
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
    backgroundColor: colors.background || '#f8f8f8',
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

// ─── Gold / Silver Card ───────────────────────────────────────────────────────
function GoldSilverCard({ commodity }) {
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
        <Text style={[gc.diffText, { color: isUp ? '#16a34a' : '#dc2626' }]}>
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
          <Text style={gc.title}>{meta.goldtitle || ''}</Text>
          <Text style={gc.date}>{meta.golddate || ''}</Text>
        </View>
      </View>
      <View style={gc.row}>
        {all.map((item, i) => (
          <React.Fragment key={i}>
            {i > 0 && <View style={gc.divider} />}
            <View style={gc.col}>
              <Text style={gc.label}>{labelMap[item.gtype] || item.gtype}</Text>
              <Text style={gc.value}>{item.rate}</Text>
              {renderDiff(item.diff, item.change)}
            </View>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

// ─── Fuel Card ────────────────────────────────────────────────────────────────
function FuelCard({ commodity }) {
  const meta = commodity?.data?.[0] || {};
  const fuel = commodity?.fuel?.[0] || {};
  if (!fuel.petrol && !fuel.diesel) return null;

  return (
    <View style={fc.wrap}>
      <View style={fc.header}>
        <Text style={fc.icon}>⛽</Text>
        <View>
          <Text style={fc.title}>{meta.fueltitle || 'பெட்ரோல் & டீசல் விலை ( ₹ )'}</Text>
          <Text style={fc.date}>{fuel.date || meta.fueldate || ''}</Text>
        </View>
      </View>
      <View style={fc.row}>
        <View style={fc.col}>
          <Text style={fc.label}>பெட்ரோல்</Text>
          <Text style={fc.value}>{fuel.petrol}</Text>
        </View>
        <View style={fc.divider} />
        <View style={fc.col}>
          <Text style={fc.label}>டீசல்</Text>
          <Text style={fc.value}>{fuel.diesel}</Text>
        </View>
      </View>
    </View>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Taboola publisher ID for mobile (from your website TaboolaScript.js) ──────
const TABOOLA_PUBLISHER_ID = 'mdinamalarcom';

// ─── Styles for Gold/Silver and Fuel Cards ──────────────────────────────
const gc = StyleSheet.create({
  wrap: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: vs(10),
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    // padding: s(12),
    gap: s(10),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: colors.background || '#f8f8f8',
    margin:ms(5)
  },
  icon: { fontSize: s(22) },
  title: {
    fontSize: ms(16),
    color: COLORS.text,
    fontFamily: FONTS.muktaMalar.semibold,
  },
  date: {
    fontSize: ms(14),
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
    fontSize: ms(14),
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
    fontSize: ms(14),
    fontFamily: FONTS.muktaMalar.medium,
  },
});

const fc = StyleSheet.create({
  wrap: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: vs(10),
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: s(12), gap: s(10),
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: colors.background || '#f8f8f8',
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

// --- Palette ------------------------------------------------------------------
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

// --- Menu Icon ----------------------------------------------------------------
function MenuIcon({ uri }) {
  if (uri && uri.startsWith('http') && !uri.endsWith('.svg'))
    return <Image source={{ uri }} style={{ width: s(16), height: s(16), marginRight: s(4) }} resizeMode="contain" />;
  if (uri && uri.endsWith('.svg'))
    return <SvgUri uri={uri} width={s(16)} height={s(16)} style={{ marginRight: s(4) }} />;
  return null;
}

// ─── Taboola Widget ───────────────────────────────────────────────────────────
function TaboolaWidget({ pageUrl, mode, container, placement, pageType = 'homepage', targetType = 'mix' }) {
  const [height, setHeight] = useState(1);
  if (!mode || !container || !placement || !pageUrl) return null;
  const safe = (str) => String(str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    #${safe(container)} { width: 100%; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  <div id="${safe(container)}"></div>
  <script type="text/javascript">
    window._taboola = window._taboola || [];
    _taboola.push({ article: 'auto' });
    _taboola.push({
      mode:        '${safe(mode)}',
      container:   '${safe(container)}',
      placement:   '${safe(placement)}',
      target_type: '${safe(targetType)}'
    });
    (function() {
      var script   = document.createElement('script');
      script.type  = 'text/javascript';
      script.async = true;
      script.src   = 'https://cdn.taboola.com/libtrc/${TABOOLA_PUBLISHER_ID}/loader.js';
      script.id    = 'tb_loader_script';
      script.onload = function() {
        _taboola.push({ flush: true });
      };
      if (!document.getElementById('tb_loader_script')) {
        document.head.appendChild(script);
      } else {
        _taboola.push({ flush: true });
      }
    })();
  </script>
  <script type="text/javascript">
    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'taboola_height') {
        var height = parseInt(event.data.height, 10);
        if (height && height > 50) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ height: height }));
        }
      }
    });
    setTimeout(function() {
      var container = document.getElementById('${safe(container)}');
      if (container) {
        var height = container.offsetHeight || 0;
        if (height > 50) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ height: height }));
        }
      }
    }, 2000);
  </script>
</body>
</html>`;

  return (
    <View style={{ width: '100%', height, backgroundColor: '#fff', overflow: 'hidden' }}>
      <WebView
        source={{ html, baseUrl: 'https://www.dinamalar.com' }}
        style={{ width: '100%', height }}
        scrollEnabled={false}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.height && !isNaN(data.height) && data.height > 50) {
              setHeight(prev => Math.max(prev, data.height));
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }}
        onError={(e) => console.warn('[Taboola WebView error]', e.nativeEvent)}
        nestedScrollEnabled={false}
      />
    </View>
  );
}

// --- Breaking News Ticker -----------------------------------------------------
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

// --- Route Map ----------------------------------------------------------------
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

// --- App Header Component --------------------------------------------------------
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
    backgroundColor: colors.cardBackground,
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

// --- Section Header -----------------------------------------------------------
function SectionHeader({ title }) {
  const { sf } = useFontSize();
  const { colors } = useTheme();

  return (
    <View style={[styles.sectionHeader, { backgroundColor: colors.cardBackground }]}>
      <Text style={[styles.sectionTitle, { fontSize: sf(18), color: colors.text }]}>{title}</Text>
      <View style={[styles.sectionUnderline, { backgroundColor: colors.primary }]} />
    </View>
  );
}

// --- Shorts Section ------------------------------------------------------------
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
    backgroundColor: colors.cardBackground,
    marginBottom: vs(8),
  },
  scrollContent: {
    paddingHorizontal: s(14),
    paddingVertical: vs(12),
  },
});

// --- Shorts Card ----------------------------------------------------------------
function ShortsCard({ item, onPress }) {
  const { sf } = useFontSize();
  const { colors } = useTheme();

  const imageUri =
    item.thumbnail || item.largeimages || item.images || item.image ||
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';
  const title = item.newstitle || item.title || item.videotitle || item.name || '';
  const hasVideo = item.video && item.video !== '0';

  return (
    <TouchableOpacity style={[shortsSt.card, { backgroundColor: colors.cardBackground }]} onPress={onPress} activeOpacity={0.85}>
      <View style={shortsSt.imageContainer}>
        <Image source={{ uri: imageUri }} style={shortsSt.image} resizeMode="cover" />
        {hasVideo && (
          <View style={shortsSt.playButton}>
            <Ionicons name="play" size={s(16)} color="#fff" />
          </View>
        )}
      </View>
      <View style={shortsSt.content}>
        <Text style={[shortsSt.title, { fontSize: sf(14), color: colors.text }]} numberOfLines={2}>
          {title}
        </Text>
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
    // backgroundColor: PALETTE.grey200,
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

// --- News Card ----------------------------------------------------------------
function NewsCard({ item, onPress, isSocialMedia = false, isPremium = false }) {
  const { sf } = useFontSize();
  const { colors } = useTheme();
  
  console.log('NewsCard isPremium:', isPremium, 'Title:', item.newstitle || item.title);

  const imageUri =
    item.largeimages || item.images || item.image || item.thumbnail || item.thumb ||
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';

  const title = item.newstitle || item.title || item.videotitle || item.name || '';
  const category = item.maincat || item.categrorytitle || item.ctitle || item.maincategory || '';
  const ago = item.ago || item.time_ago || '';
  const newscomment = item.newscomment || item.commentcount || item.nmcomment || item.comments?.total || ''; const hasAudio = item.audio === 1 || item.audio === '1' || item.audio === true ||
    (typeof item.audio === 'string' && item.audio.length > 1 && item.audio !== '0');

  return (
    <View style={[isSocialMedia ? NewsCardStyles.socialMediaWrap : NewsCardStyles.wrap, { backgroundColor: colors.cardBackground }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
        <View style={NewsCardStyles.imageWrap}>
          <Image
            source={{ uri: imageUri }}
            style={
              isSocialMedia
                ? [NewsCardStyles.image, { height: 400, borderRadius: ms(18) }]
                : [NewsCardStyles.image,]
            }
            resizeMode={isSocialMedia ? "contain" : "contain"}
          />
          {/* Premium Tag */}
          {isPremium && (
            <>
              {console.log('Rendering premium tag for:', title)}
              <View style={NewsCardStyles.premiumTag}>
                <Text style={NewsCardStyles.premiumTagText}>பிரீமியம்</Text>
              </View>
            </>
          )}
        </View>

        <View style={NewsCardStyles.contentContainer}>
          {!!title && !isSocialMedia && (
            <Text style={[NewsCardStyles.title, { fontSize: sf(14), lineHeight: sf(22), color: colors.text }]} numberOfLines={3}>{title}</Text>
          )}

          {!!category && !isSocialMedia && (
            <View style={NewsCardStyles.catPill}>
              <Text style={[NewsCardStyles.catText, { fontSize: sf(12), color: colors.textSecondary }]}>{category}</Text>
            </View>
          )}

          <View style={NewsCardStyles.metaRow}>
            <Text style={[NewsCardStyles.timeText, { fontSize: sf(12), color: colors.textSecondary }]}>{ago}</Text>
            <View style={NewsCardStyles.metaRight}>
              {hasAudio && (
                <View style={NewsCardStyles.audioIcon}>
                  <Ionicons name="volume-high" size={s(14)} color={colors.textSecondary} />
                </View>
              )}

              {!!newscomment && newscomment !== '0' && (
                <View style={NewsCardStyles.commentRow}>
                  <Ionicons name="chatbox" size={s(15)} color={colors.textSecondary} />
                  <Text style={[NewsCardStyles.commentText, { fontSize: sf(12), color: colors.textSecondary }]}> {newscomment}</Text>
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
// NewsCard-style layout with play button overlay   tapping opens VideoPlayerModal
function DinaMalarTVCard({ item, onVideoPress }) {
  const { sf } = useFontSize();
  const { colors } = useTheme();

  const imageUri =
    item.largeimages || item.images || item.image || item.thumbnail || item.thumb ||
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';

  const title = item.newstitle || item.title || item.videotitle || item.name || '';
  const category = item.maincat || item.categrorytitle || item.ctitle || item.maincategory || '';
  const ago = item.ago || item.time_ago || '';
  const newscomment = item.newscomment || item.commentcount || item.nmcomment || item.comments?.total || '';
  return (
    <View style={[NewsCardStyles.wrap, { backgroundColor: colors.cardBackground }]}>
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

          {/* "TV" badge   top-left corner */}
          {/* <View style={tvCardSt.badge}>
            <Ionicons name="videocam" size={s(10)} color="#fff" style={{ marginRight: s(3) }} />
            <Text style={tvCardSt.badgeText}>TV</Text>
          </View> */}
        </View>

        {/* Text content   identical structure to NewsCard */}
        <View style={NewsCardStyles.contentContainer}>
          {!!title && (
            <Text
              style={[NewsCardStyles.title, { fontSize: sf(15), lineHeight: sf(22), color: colors.text }]}
              numberOfLines={3}
            >
              {title}
            </Text>
          )}

          {!!category && (
            <View style={NewsCardStyles.catPill}>
              <Text style={[NewsCardStyles.catText, { fontSize: sf(11), color: colors.textSecondary }]}>{category}</Text>
            </View>
          )}

          <View style={NewsCardStyles.metaRow}>
            <Text style={[NewsCardStyles.timeText, { fontSize: sf(11), color: colors.textSecondary }]}>{ago}</Text>
            <View style={NewsCardStyles.metaRight}>
              {!!newscomment && newscomment !== '0' && (
                <View style={NewsCardStyles.commentRow}>
                  <Ionicons name="chatbox" size={s(14)} color={colors.textSecondary} />
                  <Text style={[NewsCardStyles.commentText, { fontSize: sf(11), color: colors.textSecondary }]}> {newscomment}</Text>
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

// --- Dinamalar TV Section (with Live / Sports / Cinema tabs) -----------------
const TV_TABS = [
  { key: 'live', label: 'Live', ta: 'Live', vCategory: '5050', slug: '/videos/live-and-recorded' },
  { key: 'விளையாட்டு', label: 'விளையாட்டு', ta: 'விளையாட்டு', vCategory: '594', slug: '/videos/sports-tamil-videos' },
  { key: 'சினிமா', label: 'சினிமா', ta: 'சினிமா', vCategory: '594', slug: '/videos/tamil-cinema-videos' },
];

// Map API maincat values ? tab key
function getTabKey(item) {
  // First check by VCategory (actual field from API)
  const vCategory = String(item.VCategory || item.maincatid || item.vcategory || '');
  const maincat = (item.maincat || '').toLowerCase();
  const ctitle = (item.ctitle || '').toLowerCase();

  // Debug logging
  console.log('getTabKey item:', {
    vCategory,
    maincat,
    ctitle,
    title: item.title,
    category: item.category
  });

  if (vCategory === '5050') return 'live';

  // For VCategory 594, differentiate by category name
  if (vCategory === '594') {
    if (ctitle.includes('சினிமா') || maincat.includes('cinema')) return 'cinema';
    if (ctitle.includes('விளையாட்டு') || maincat.includes('sport')) return 'sports';
    // Default to sports if unclear
    return 'sports';
  }

  // Fallback to category name matching
  const cat = (item.maincat || item.categrorytitle || item.maincategory || item.category || '').toLowerCase();

  if (cat.includes('live') || cat.includes('நேரலை') || cat.includes('live')) return 'live';
  if (cat.includes('sport') || cat.includes('விளையாட்டு') || cat.includes('cricket') || cat.includes('football')) return 'sports';
  if (cat.includes('cinema') || cat.includes('சினிமா') || cat.includes('movie') || cat.includes('film')) return 'cinema';

  return 'live'; // default
}

function DinaMalarTVSection({ data, onVideoPress }) {
  const { sf } = useFontSize();
  const navigation = useNavigation();

  // Separate live and regular videos
  const liveItems = (data || []).filter(item => 
    String(item.VCategory || item.maincatid || '') === '5050' || 
    (item.maincat || '').toLowerCase() === 'live'
  );
  const tvItems = (data || []).filter(item => 
    String(item.VCategory || item.maincatid || '') !== '5050' && 
    (item.maincat || '').toLowerCase() !== 'live'
  );

  // All items to display: live first, then tv videos
  const allItems = [...liveItems, ...tvItems];

  return (
    <View>
      <View style={tvSecSt.headerRow}>
        <View style={tvSecSt.titleWrap}>
          <Text style={[tvSecSt.sectionTitle, { fontSize: sf(16) }]}>தினமலர் டிவி</Text>
          <View style={tvSecSt.titleUnderline} />
        </View>
      </View>

      {/* Tabs — UI only, navigate to VideosScreen on press */}
      <View style={tvSecSt.tabBar}>
        {TV_TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={tvSecSt.tab}
            onPress={() => navigation?.navigate('VideosScreen', { initialTabKey: tab.key })}
            activeOpacity={0.7}
          >
            <Text style={[tvSecSt.tabText, { fontSize: sf(13) }]}>
              {tab.ta}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Show all videos below tabs */}
      {allItems.length > 0
        ? allItems.map((item, i) => (
          <DinaMalarTVCard
            key={`tv-${i}-${item.newsid || item.videoid || i}`}
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

function SkeletonLoader() {
  const { colors } = useTheme();
  
  return (
    <>
      <View style={{ height: vs(200), backgroundColor: PALETTE.grey200 }} />
      <View style={{ backgroundColor: colors.cardBackground, paddingVertical: vs(8) }}>
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
      <View style={{ backgroundColor: colors.cardBackground, paddingHorizontal: s(12), paddingVertical: vs(14) }}>
        <View style={{ width: s(140), height: vs(16), backgroundColor: PALETTE.grey200, borderRadius: s(4), marginBottom: vs(6) }} />
        <View style={{ width: s(44), height: vs(2), backgroundColor: PALETTE.grey300 }} />
      </View>
      {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
    </>
  );
}

// --- HomeScreen ---------------------------------------------------------------
export default function HomeScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const [selectedCategory, setSelectedCategory] = useState('latest');
  const [trendingTags, setTrendingTags] = useState([]);
  const [allNewsSections, setAllNewsSections] = useState([]);
  const [breakingNews, setBreakingNews] = useState('');
  const [taboolaAds, setTaboolaAds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isLocationDrawerVisible, setIsLocationDrawerVisible] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('உள்ளூர்');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [commodity, setCommodity] = useState(null);

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

  // -- Rasi Icon Mapping -------------------------------------------------------
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

  // --- Load Data -------------------------------------------------------------
  const loadAll = useCallback(async () => {
    try {
      const [homeRes, shortRes, shortsRes, varthagamRes, varavaramRes, joshiyamRes, districtRes, premiumRes, cinemaRes, cinemaRes2, panguRes, aanmigamRes, templeRes] = await Promise.allSettled([
        fetchHomeData(),
        fetchShortNews(),
        CDNApi.get(API_ENDPOINTS.SHORTS),
        CDNApi.get(API_ENDPOINTS.VARthagam),
        axios.get('https://api-st-cdn.dinamalar.com/varavaram'),
        CDNApi.get(API_ENDPOINTS.JOSHIYAM),
        CDNApi.get(API_ENDPOINTS.DISTRICT),
        api.getPremium(),
        axios.get('https://cinema.dinamalar.com/api/cinema'), // Try actual cinema API
        CDNApi.get('/movies'), // Try movies endpoint
        api.getTempleMain(), // aanmigam API using temple data
        api.getTempleListing(1), // temple API for listing
      ]);

      console.log('=== API RESPONSES DEBUG ===');
      console.log('AANMIGAM API ENDPOINT:', API_ENDPOINTS.TEMPLE_MAIN);
      console.log('Aanmigam response exists:', !!aanmigamRes);
      console.log('Aanmigam response:', aanmigamRes);
      if (aanmigamRes) {
        console.log('Aanmigam status:', aanmigamRes.status);
        console.log('Aanmigam value:', aanmigamRes.value);
        console.log('Aanmigam data:', aanmigamRes.value?.data);
      } else {
        console.log('Aanmigam response is undefined');
      }
      console.log('=== API RESPONSES DEBUG END ===');

      if (varthagamRes.status === 'fulfilled') {
          setCommodity(varthagamRes.value?.data?.commodity || null);
        }

        if (panguRes.status === 'fulfilled') {
          const d = homeRes.value?.data;
          if (panguRes.value?.data?.length > 0) {
            sections.push({ title: panguRes.value?.data?.[0]?.title || 'பாங்கு சன்னை', data: panguRes.value.data });
          }
        }

        if (homeRes.status === 'fulfilled') {
        const d = homeRes.value?.data;
        console.log('Home data keys:', Object.keys(d || {}));
        console.log('Premium stories in home data:', d?.premium_stories);
        console.log('Looking for cinema data:', d?.cinema, d?.movies, d?.film, d?.cinemanews);
        console.log('Looking for weekly malar data:', d?.varamalar, d?.weeklymal, d?.weekmal, d?.weekly_malar, d?.weekmalar);
        console.log('Looking for aanmigam data in home API:', d?.anmegam, d?.aanmigam, d?.anmegasinthanai, d?.anmigasinthanai);

        setBreakingNews(
          d?.breaking_news || d?.breakingnews || d?.ticker_text || d?.ticker || ''
        );

        // Store mobile Taboola placements from the API
        setTaboolaAds(d?.taboola_ads?.mobile || null);

        const sections = [];
        const tharpothaiyaData = d?.tharpothaiya_seithigal?.[0]?.data || [];

        if (tharpothaiyaData.length > 0)
          sections.push({ title: d.tharpothaiya_seithigal[0].title || 'தற்போதைய செய்திகள்', data: tharpothaiyaData });

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

        // Add commodity rate cards section after varthagam
        if (commodity) {
          sections.push({ 
            title: 'வரத்தகம் விலை', 
            data: [],
            isCommodity: true 
          });
        }

        // Add Share Market section after commodity
        if (commodity && commodity.sharemarket && commodity.sharemarket.length > 0) {
          sections.push({ 
            title: 'பங்கு சந்தை', 
            data: [],
            isShareMarket: true 
          });
        }



        if (Array.isArray(d?.webstories) && d.webstories[0]?.data?.length > 0)
          sections.push({ title: d.webstories[0].title || 'வெப் ஸ்டோரிகள்', data: d.webstories[0].data, type: 'shorts' });
        else if (d?.webstories?.data?.length > 0)
          sections.push({ title: d.webstories.title || 'வெப் ஸ்டோரிகள்', data: d.webstories.data, type: 'shorts' });

        if (d?.kalvimalar?.data?.length > 0)
          sections.push({ title: d.kalvimalar.title || 'கால்விமார்', data: d.kalvimalar.data.slice(0, 1) });

        if (d?.special?.data?.length > 0) {
          console.log('Special section found with', d.special.data.length, 'categories');
          const allSpecialNews = [];
          d.special.data.forEach(category => {
            if (category?.data?.length > 0) {
              console.log('Category:', category.title, 'has', category.data.length, 'items');
              allSpecialNews.push(...category.data);
            }
          });
          if (allSpecialNews.length > 0) {
            console.log('Total special news items:', allSpecialNews.length);
            sections.push({ title: d.special.title || 'சிறப்புச்', data: allSpecialNews });
          }
        }

        if (d?.premium_stories?.data?.length > 0) {
          const premiumTitle = d.premium_stories.title || 'பிரத்யேகச் செய்திகள்';
          console.log('Premium section from home data:', premiumTitle, 'Items:', d.premium_stories.data.length);
          sections.push({ title: premiumTitle, data: d.premium_stories.data });
        }

        if (d?.audio?.[0]?.data?.length > 0)
          sections.push({ title: d.audio[0].title || 'ஆடியே', data: d.audio[0].data });

        // -- Pangu Sannathai Section ---------------------------------
        if (d?.anmegasinthanai?.data?.length > 0)
          sections.push({ title: d.anmegasinthanai.title || 'பாங்கு சன்னை', data: d.anmegasinthanai.data });

        // -- Live   merged into Dinamalar TV section above --



        if (shortsRes.status === 'fulfilled' && shortsRes.value?.data?.length > 0) {
          sections.push({
            title: 'சிறுசெய்திகள்',
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
              title: 'மாவட்டச் செய்திகள்',
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
                  title: 'மாவட்டச் செய்திகள்',
                  data: districtsData,
                  type: 'district'
                });
              }
            }
          }
        }

        // Add premium stories section
        console.log('Premium response status:', premiumRes.status);
        console.log('Premium response data:', premiumRes.value?.data);
        if (premiumRes.status === 'fulfilled' && premiumRes.value?.data?.length > 0) {
          console.log('Adding premium stories section with data:', premiumRes.value.data.length, 'items');
          sections.push({ title: 'பிரத்யேகச் செய்திகள்', data: premiumRes.value.data });
        } else {
          console.log('Premium stories not available or empty');
        }

        // Add cinema section
        console.log('Cinema response status:', cinemaRes.status);
        console.log('Cinema response data:', cinemaRes.value?.data);
        console.log('Cinema2 response status:', cinemaRes2.status);
        console.log('Cinema2 response data:', cinemaRes2.value?.data);
        
        let cinemaNews = [];
        let cinemaVideos = [];
        
        // Process cinema data from first API
        if (cinemaRes.status === 'fulfilled' && cinemaRes.value?.data) {
          cinemaNews = cinemaRes.value.data?.slice(0, 2) || [];
          cinemaVideos = cinemaRes.value.video?.slice(0, 2) || [];
          console.log('Cinema - News:', cinemaNews.length, 'Videos:', cinemaVideos.length);
        } 
        // Process cinema data from second API
        else if (cinemaRes2.status === 'fulfilled' && cinemaRes2.value?.data) {
          cinemaNews = cinemaRes2.value.data?.slice(0, 2) || [];
          cinemaVideos = cinemaRes2.value.video?.slice(0, 2) || [];
          console.log('Cinema2 - News:', cinemaNews.length, 'Videos:', cinemaVideos.length);
        }
        
        // If no external cinema data, check home API for cinema data
        if (cinemaNews.length === 0 && cinemaVideos.length === 0) {
          console.log('Trying home API for cinema data...');
          if (d?.cinema?.data) {
            cinemaNews = d.cinema.data.slice(0, 2);
            console.log('Found cinema news in home API:', cinemaNews.length);
          }
          if (d?.cinema?.video) {
            cinemaVideos = d.cinema.video.slice(0, 2);
            console.log('Found cinema videos in home API:', cinemaVideos.length);
          }
        }
        
        // Add cinema section with both news and videos
        if (cinemaNews.length > 0 || cinemaVideos.length > 0) {
          const allCinemaContent = [...cinemaNews, ...cinemaVideos];
          console.log('Adding cinema section with total items:', allCinemaContent.length);
          sections.push({ title: 'சினிமா', data: allCinemaContent, hasVideos: cinemaVideos.length > 0 });
        }

        // Add varavaram section
        if (varavaramRes.status === 'fulfilled' && varavaramRes.value?.data?.length > 0) {
          console.log('Adding varavaram section with data:', varavaramRes.value.data.length, 'items');
          sections.push({ title: 'வரவரம்', data: varavaramRes.value.data });
        } else {
          console.log('Varavaram data not available or empty');
        }

        // Add weekly malar section
        if (d?.varamalar?.data?.length > 0) {
          console.log('Varamalar section found:', 'வாரமலர்', 'Items:', d.varamalar.data.length);
          sections.push({ title: 'வாரமலர்', data: d.varamalar.data.slice(0, 1) });
        } else if (d?.weeklymal?.data?.length > 0) {
          console.log('Weekly malar section found:', 'வாரமலர்', 'Items:', d.weeklymal.data.length);
          sections.push({ title: 'வாரமலர்', data: d.weeklymal.data.slice(0, 1) });
        } else if (d?.weekmal?.data?.length > 0) {
          console.log('Week mal section found:', 'வாரமலர்', 'Items:', d.weekmal.data.length);
          sections.push({ title: 'வாரமலர்', data: d.weekmal.data.slice(0, 1) });
        } else if (d?.weekly_malar?.data?.length > 0) {
          console.log('Weekly malar section found:', 'வாரமலர்', 'Items:', d.weekly_malar.data.length);
          sections.push({ title: 'வாரமலர்', data: d.weekly_malar.data.slice(0, 1) });
        } else if (d?.weekmalar?.data?.length > 0) {
          console.log('Week malar section found:', 'வாரமலர்', 'Items:', d.weekmalar.data.length);
          sections.push({ title: 'வாரமலர்', data: d.weekmalar.data.slice(0, 1) });
        } else {
          console.log('Weekly malar data not found in home API');
        }

        // Add joshiyam section
        console.log('=== JOSHIYAM DEBUG START ===');
        console.log('joshiyamRes exists:', !!joshiyamRes);
        console.log('joshiyamRes.status:', joshiyamRes?.status);
        console.log('joshiyamRes.value?.data exists:', !!joshiyamRes?.value?.data);
        
        let joshiyamData = [];
        let hasValidData = false;
        
        if (joshiyamRes && joshiyamRes.status === 'fulfilled' && joshiyamRes.value?.data) {
          console.log('Joshiyam data type:', typeof joshiyamRes.value.data);
          console.log('Joshiyam data structure:', JSON.stringify(joshiyamRes.value.data, null, 2));
          
          // Handle the specific joshiyam data structure
          if (Array.isArray(joshiyamRes.value.data)) {
            // Find the item with title "ஜோசியம்" which contains the actual data
            const joshiyamSection = joshiyamRes.value.data.find(item => item.title === 'ஜோசியம்');
            console.log('joshiyamSection found:', !!joshiyamSection);
            
            if (joshiyamSection) {
              console.log('joshiyamSection.data type:', typeof joshiyamSection.data);
              console.log('joshiyamSection.data length:', joshiyamSection.data?.length);
              
              if (Array.isArray(joshiyamSection.data) && joshiyamSection.data.length > 0) {
                // Check if items have valid data (title, image, etc.)
                const validItems = joshiyamSection.data.filter(item => 
                  item.title && (item.image || item.link || item.id)
                );
                console.log('validItems count:', validItems.length);
                
                if (validItems.length > 0) {
                  hasValidData = true;
                  // Transform joshiyam data to match NewsCard expected format
                  joshiyamData = validItems.slice(0, 3).map(item => ({
                    ...item,
                    newstitle: item.title,        // Map title to newstitle
                    images: item.image,           // Map image to images
                    largeimages: item.image,      // Map image to largeimages
                    thumbnail: item.image,        // Map image to thumbnail
                    maincat: 'ஜோசியம்',          // Set category
                    ctitle: 'ஜோசியம்',            // Set category title
                    link: item.link ? `https://www.dinamalar.com${item.link}` : '', // Transform to full URL
                    slug: item.slug,              // Keep slug
                    id: item.id,                  // Keep id
                    description: item.etitle || item.title, // Add description
                    standarddate: '',             // No date for joshiyam items
                    ago: '',                       // No ago for joshiyam items
                    newsid: item.id,              // Add newsid for navigation
                    external_link: item.link ? `https://www.dinamalar.com${item.link}` : '' // Add external link
                  }));
                  console.log('Found and transformed joshiyam section with items:', joshiyamData.length);
                } else {
                  console.log('Joshiyam section found but no valid items (missing title/image/link)');
                }
              } else {
                console.log('joshiyamSection.data is not array or is empty');
              }
            } else {
              console.log('Joshiyam section with title "ஜோசியம்" not found');
            }
          } else {
            console.log('joshiyamRes.value.data is not an array');
          }
        } else {
          console.log('Joshiyam data not available or not fulfilled');
        }
        
        // Only add section if we have valid data
        console.log('Final check - hasValidData:', hasValidData, 'joshiyamData.length:', joshiyamData.length);
        if (hasValidData && joshiyamData.length > 0) {
          console.log('✅ ADDING joshiyam section:', 'ஜோசியம்', 'Items:', joshiyamData.length);
          sections.push({ title: 'ஜோசியம்', data: joshiyamData });
        } else {
          console.log('❌ NOT ADDING joshiyam section - no valid data');
        }
        console.log('=== JOSHIYAM DEBUG END ===');

        // Add temple section
        if (templeRes && templeRes.status === 'fulfilled' && templeRes.value?.data) {
          console.log('=== TEMPLE DEBUG START ===');
          console.log('Temple data type:', typeof templeRes.value.data);
          console.log('Temple data structure:', templeRes.value.data);
          
          let templeData = [];
          
          // Handle the temple data structure
          if (Array.isArray(templeRes.value.data)) {
            // Find temple-related items in the data
            const templeItems = templeRes.value.data.filter(item => 
              item.kovil || item.Dinamorukovil || item.temple || item.title?.includes('கோயில்')
            );
            
            console.log('Found temple items:', templeItems.length);
            
            if (templeItems.length > 0) {
              // Process different temple sections
              templeItems.forEach(templeSection => {
                // Process "கோயில்கள்" section
                if (templeSection.kovil && Array.isArray(templeSection.kovil)) {
                  const validKovilItems = templeSection.kovil.filter(item => 
                    item.newstitle && (item.images || item.largeimage)
                  );
                  templeData.push(...validKovilItems.slice(0, 2));
                }
                
                // Process "தினம் ஒரு கோயில்" section
                if (templeSection.Dinamorukovil && Array.isArray(templeSection.Dinamorukovil)) {
                  const validDailyItems = templeSection.Dinamorukovil.filter(item => 
                    item.newstitle && (item.images || item.largeimage)
                  );
                  templeData.push(...validDailyItems.slice(0, 2));
                }
                
                // Process "360° கோயில்கள்" section
                if (templeSection.temple && Array.isArray(templeSection.temple)) {
                  const valid360Items = templeSection.temple.filter(item => 
                    item.tname && item.images
                  );
                  templeData.push(...valid360Items.slice(0, 1));
                }
              });
              
              // Transform temple data to match NewsCard expected format
              templeData = templeData.slice(0, 3).map(item => ({
                ...item,
                newstitle: item.newstitle || item.tname || item.title,
                images: item.images || item.largeimage,
                largeimages: item.largeimage || item.images,
                thumbnail: item.images || item.largeimage,
                maincat: 'கோயில்கள்',
                ctitle: 'கோயில்கள்',
                link: item.link ? `https://temple.dinamalar.com${item.link.startsWith('/') ? '' : '/'}${item.link}` : item.link,
                slug: item.link,
                id: item.newsid || item.id,
                description: item.newsdescription || item.newstitle || item.tname,
                standarddate: item.standarddate || item.date || '',
                ago: item.ago || '',
                newsid: item.newsid || item.id,
                external_link: item.link
              }));
              
              console.log('Found and transformed temple section with items:', templeData.length);
            } else {
              console.log('No temple items found in the data');
            }
          }
          
          if (templeData.length > 0) {
            console.log('Temple section found:', 'கோயில்கள்', 'Items:', templeData.length);
            sections.push({ title: 'கோயில்கள்', data: templeData });
          } else {
            console.log('Temple data is empty or not in expected format - not adding section');
          }
          console.log('=== TEMPLE DEBUG END ===');
        } else {
          console.log('Temple data not available');
        }

        // Add ullagathamilarseithigal (World Tamil News) section
        if (templeRes && templeRes.status === 'fulfilled' && templeRes.value?.data) {
          console.log('=== ULLAGA TAMILAR DEBUG START ===');
          console.log('Checking for ullagathamilarseithigal data...');
          
          let ullagaTamilData = [];
          
          // Look for ullagathamilarseithigal in the temple data
          if (Array.isArray(templeRes.value.data)) {
            const ullagaSection = templeRes.value.data.find(item => 
              item.etitle === 'ullaga thamilar seithigal' || item.title?.includes('உலக தமிழர்')
            );
            
            if (ullagaSection && Array.isArray(ullagaSection.data) && ullagaSection.data.length > 0) {
              console.log('Found ullagathamilarseithigal section with items:', ullagaSection.data.length);
              
              // Transform data to match NewsCard expected format
              ullagaTamilData = ullagaSection.data.slice(0, 3).map(item => ({
                ...item,
                newstitle: item.newstitle,
                images: item.images,
                largeimages: item.images,
                thumbnail: item.images,
                maincat: 'உலக தமிழர் செய்திகள்',
                ctitle: 'உலக தமிழர் செய்திகள்',
                link: item.link ? `https://www.dinamalar.com${item.link}` : item.link,
                slug: item.slug,
                id: item.News_ID || item.id,
                description: item.newsdescription,
                standarddate: item.ago || item.date || '',
                ago: item.ago || '',
                newsid: item.News_ID || item.id,
                external_link: item.link
              }));
              
              console.log('Transformed ullagathamilarseithigal items:', ullagaTamilData.length);
            } else {
              console.log('ullagathamilarseithigal section not found or empty');
            }
          }
          
          if (ullagaTamilData.length > 0) {
            console.log('Ullaga Tamilar section found:', 'உலக தமிழர் செய்திகள்', 'Items:', ullagaTamilData.length);
            sections.push({ title: 'உலக தமிழர் செய்திகள்', data: ullagaTamilData });
          } else {
            console.log('Ullaga Tamilar data is empty - not adding section');
          }
          console.log('=== ULLAGA TAMILAR DEBUG END ===');
        }

        // Add aanmigam section with nested data processing
        console.log('=== AANMIGAM DEBUG START ===');
        console.log('Aanmigam response exists:', !!aanmigamRes);
        
        if (aanmigamRes && aanmigamRes.status === 'fulfilled') {
          console.log('aanmigamRes.status is fulfilled');
          if (aanmigamRes.value?.data) {
            console.log('aanmigamRes.value.data exists:', aanmigamRes.value.data);
            if (Array.isArray(aanmigamRes.value.data)) {
              console.log('aanmigamRes.value.data is array with length:', aanmigamRes.value.data.length);
              if (aanmigamRes.value.data.length > 0) {
                console.log('Adding aanmigam section with data:', aanmigamRes.value.data.length, 'categories');
                
                // Process nested aanmigam data
                const allAanmigamNews = [];
                aanmigamRes.value.data.forEach((category, index) => {
                  console.log(`Category ${index}:`, category);
                  if (category?.data?.length > 0) {
                    console.log('Aanmigam category:', category.title, 'has', category.data.length, 'items');
                    allAanmigamNews.push(...category.data);
                  } else {
                    console.log('Category has no data or data is empty:', category);
                  }
                });
                
                console.log('Total aanmigam news items collected:', allAanmigamNews.length);
                if (allAanmigamNews.length > 0) {
                  console.log('Pushing aanmigam section to sections array');
                  sections.push({ title: 'ஆன்மிகம்', data: allAanmigamNews });
                } else {
                  console.log('No aanmigam news items to display');
                }
              } else {
                console.log('aanmigamRes.value.data is empty array');
              }
            } else {
              console.log('aanmigamRes.value.data is not an array:', typeof aanmigamRes.value.data);
            }
          } else {
            console.log('aanmigamRes.value.data does not exist');
          }
        } else {
          console.log('aanmigamRes does not exist or status is not fulfilled:', aanmigamRes?.status);
          console.log('Aanmigam data not available or empty');
        }
        console.log('=== AANMIGAM DEBUG END ===');
        
        if (cinemaNews.length === 0 && cinemaVideos.length === 0) {
          console.log('Cinema data not available from any source');
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

  useEffect(() => { loadAll(); }, []);

  const onRefresh = useCallback(() => { setRefreshing(true); loadAll(); }, [loadAll]);

  // --- Navigation ------------------------------------------------------------
  const goToArticle = (item) => {
    const category = item.maincat || item.categrorytitle || item.ctitle || item.maincategory || '';
    const districtId = item.districtid || item.district_id;
    const districtTitle = item.districttitle || item.district_title;
    const categoryLower = category.toLowerCase().trim();

    if (categoryLower.includes('தற்போதைய செய்திகள்') || categoryLower.includes('tharpothaiya') ||
      categoryLower.includes('தற்போதைய செய்திகள்') || categoryLower.includes('தற்போதைய') ||
      categoryLower.includes('தற்போதைய') || categoryLower.includes('தற்போதைய செய்திகள்') ||
      categoryLower.includes('தற்போதைய') || categoryLower.includes('தற்போதைய செய்திகள்')) {
      navigation?.navigate('TharpothaiyaSeithigalScreen');
      return;
    }

    if (categoryLower.includes('வர்த்தகம்') || categoryLower.includes('varthagam') ||
      categoryLower.includes('business') || categoryLower.includes('வர்த்தகம்') ||
      (item.maincategory === 'varthagam' || item.maincat === 'varthagam')) {
      navigation?.navigate('VarthagamScreen');
      return;
    }

    if (categoryLower.includes('தினம் தினம்') || categoryLower.includes('dinamdinam') ||
      categoryLower.includes('தினம் தினம்')) {
      navigation?.navigate('DinamDinamScreen');
      return;
    }

    if (categoryLower.includes('விளையாட்டு') || categoryLower.includes('sports') ||
      categoryLower.includes('விளையாட்டு') || categoryLower.includes('sport')) {
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
      categoryLower.includes('ஜோசியம்') || categoryLower.includes('ராசி') ||
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

  // --- List Header -----------------------------------------------------------
  const ListHeader = (
    <>
      {loading ? (
        <SkeletonLoader />
      ) : (
        <>
          {/* Taboola Ad */}
          {taboolaAds?.midmain && (
            <TaboolaWidget
              pageUrl="https://www.dinamalar.com"
              mode={taboolaAds.midmain.mode}
              container={taboolaAds.midmain.container}
              placement={taboolaAds.midmain.placement}
              targetType="mix"
            />
          )}

          {/* Two-row category tabs */}
          <CategoryTab
            selectedCategory={selectedCategory}
            onCategoryPress={setSelectedCategory}
            trendingTags={trendingTags}
          />

          {/* News sections */}
          {allNewsSections.map((section, si) => (
            // -- Shorts (horizontal scroll) ----------------------------------
            section.type === 'shorts' ? (
              <ShortsSection
                key={`sec-${si}`}
                title={section.title}
                data={section.data}
                onPress={goToShort}
              />

              // -- Video (Dinamalar TV) ? tabbed DinaMalarTVSection -----------
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

              // -- Cinema Videos (simple video cards) ---------------------------
            ) : section.type === 'cinema-video' ? (
              <View key={`sec-${si}`} style={{ paddingHorizontal: s(12), marginTop: vs(10) }}>
                <SectionHeader title={section.title} />
                {section.data?.map((item, i) => (
                  <DinaMalarTVCard
                    key={`cinema-video-${i}-${item.id || item.videoid || i}`}
                    item={item}
                    onVideoPress={() => {
                      navigation?.navigate('VideoDetailScreen', {
                        videoId: item.videoid || item.id || item.newsid,
                        video: item,
                      });
                    }}
                  />
                ))}
              </View>

              // -- Commodity (Gold/Silver/Fuel) ------------------------------
            ) : section.isCommodity ? (
              <View key={`sec-${si}`} style={{ paddingHorizontal: s(12), marginTop: vs(10) }}>
                <GoldSilverCard commodity={commodity} />
                <FuelCard commodity={commodity} />
              </View>

              // -- Share Market (Stock Market) ------------------------------
            ) : section.isShareMarket ? (
              <View key={`sec-${si}`} style={{ paddingHorizontal: s(12), marginTop: vs(10) }}>
                <ShareMarketCard commodity={commodity} />
              </View>

              // -- District (hidden) -------------------------------------------
            ) : section.type === 'district' ? (
              null

              // -- Regular news ------------------------------------------------
            ) : (
              <View key={`sec-${si}`}>
                <SectionHeader title={section.title} />
                {section.data?.map((item, i) => {
                  const isPremiumStory = section.title?.toLowerCase().includes('பிரத்யேகச் செய்திகள்') || section.title?.toLowerCase().includes('premium') || section.title?.toLowerCase().includes('பிரீமியம்');
                  const isVideoItem = item.video || item.videoid || item.videotitle || item.y_path;
                  const isCinemaSection = section.title?.toLowerCase().includes('சினிமா');
                  const isVaramalarSection = section.title?.toLowerCase().includes('வாரமலர்');
                  console.log('Section title:', section.title, 'Is premium:', isPremiumStory, 'Is video:', isVideoItem, 'Is varamalar:', isVaramalarSection);
                  
                  // Custom varamalar card with title below category
                  if (isVaramalarSection) {
                    const { sf } = useFontSize();
                    const imageUri = item.images || item.largeimages || item.image || item.thumbnail || item.thumb || 'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';
                    const bookTitle = item.booktitle || item.title || item.newstitle || '';
                    const category = item.maincat || 'வாரமலர்';
                    const date = item.standarddate || item.date || item.ago || '';
                    const description = item.bookdescription || item.newsdescription || item.description || '';
                    
                    return (
                      <View key={`varamalar-${si}-${i}-${item.id || i}`} style={NewsCardStyles.wrap}>
                        <TouchableOpacity onPress={() => goToArticle(item)} activeOpacity={0.88}>
                          <View style={NewsCardStyles.imageWrap}>
                            <Image
                              source={{ uri: imageUri }}
                              style={NewsCardStyles.image}
                              resizeMode="contain"
                            />
                          </View>
                          <View style={NewsCardStyles.contentContainer}>
                            {!!bookTitle && (
                              <Text style={[NewsCardStyles.title, { fontSize: sf(14), lineHeight: sf(22) }]} numberOfLines={2}>{bookTitle}</Text>
                            )}
                            <View style={NewsCardStyles.catPill}>
                              <Text style={[NewsCardStyles.catText, { fontSize: sf(12) }]}>{category}</Text>
                            </View>
                            {!!date && (
                              <Text style={[NewsCardStyles.timeText, { fontSize: sf(12) }]}>{date}</Text>
                            )}
                            {/* Divider after date */}
                            <View style={[NewsCardStyles.divider, { marginVertical: vs(8) }]} />
                            {!!description && (
                              <Text style={[NewsCardStyles.title, { fontSize: sf(12), lineHeight: sf(18), color: colors.text,fontFamily:FONTS.muktaMalar.regular }]} numberOfLines={2}>{description}</Text>
                            )}
                          </View>
                        </TouchableOpacity>
                        <View style={NewsCardStyles.divider} />
                      </View>
                    );
                  }

                
                  
                  // Render video card for cinema videos
                  if (isCinemaSection && isVideoItem) {
                    return (
                      <DinaMalarTVCard
                        key={`cinema-${si}-${i}-${item.id || item.videoid || i}`}
                        item={item}
                        onVideoPress={() => {
                          navigation?.navigate('VideoDetailScreen', {
                            videoId: item.videoid || item.id || item.newsid,
                            video: item,
                          });
                        }}
                      />
                    );
                  }
                  
                  
                  // Render regular news card
                  return (
                  <NewsCard
                    key={`${si}-${i}-${item.newsid || item.id || i}`}
                    item={item}
                    isSocialMedia={section.isSocialMedia || false}
                    isPremium={isPremiumStory}
                    onPress={() => {
                      const sectionTitle = section.title?.toLowerCase() || '';

                      if (sectionTitle.includes('தற்போதைய செய்திகள்') || sectionTitle.includes('tharpothaiya') ||
                        sectionTitle.includes('தற்போதைய') || sectionTitle.includes('தற்போதைய செய்திகள்')) {
                        navigation?.navigate('NewsDetailsScreen', {
                          newsId: item.newsid || item.id,
                          newsItem: item,
                          slug: item.slug || '',
                          newsList: section.data,
                        });
                        return;
                      }

                      if (sectionTitle.includes('வரவரம்') || sectionTitle.includes('varavaram')) {
                        navigation?.navigate('CommonSectionScreen', {
                          screenTitle: 'வரவரம்',
                          apiEndpoint: 'https://api-st-cdn.dinamalar.com/varavaram',
                          allTabLink: 'https://api-st-cdn.dinamalar.com/varavaram'
                        });
                        return;
                      }

                      if (sectionTitle.includes('வர்த்தகம்') || sectionTitle.includes('varthagam') ||
                        sectionTitle.includes('business') || sectionTitle.includes('வர்த்தகம்')) {
                        navigation?.navigate('VarthagamScreen');
                        return;
                      }

                      if (sectionTitle.includes('தினம் தினம்') || sectionTitle.includes('dinamdinam') ||
                        sectionTitle.includes('தினம் தினம்')) {
                        navigation?.navigate('DinamDinamScreen');
                        return;
                      }

                      if (sectionTitle.includes('விளையாட்டு') || sectionTitle.includes('sports') ||
                        sectionTitle.includes('விளையாட்டு')) {
                        navigation?.navigate('SportsScreen');
                        return;
                      }

                      if (sectionTitle.includes('தமிழ்நாடு') || sectionTitle.includes('tamil nadu') ||
                        sectionTitle.includes('tamilnadu')) {
                        navigation?.navigate('TamilNaduScreen');
                        return;
                      }

                      if (sectionTitle.includes('ஜோசியம்') || sectionTitle.includes('joshiyam') ||
                        sectionTitle.includes('ஜோசியம்')) {
                        navigation?.navigate('CommonSectionScreen', {
                          screenTitle: 'ஜோசியம்',
                          apiEndpoint: '/joshiyam',
                          allTabLink: '/joshiyam'
                        });
                        return;
                      }

                      if (sectionTitle.includes('பிரத்யேகச் செய்திகள்') || sectionTitle.includes('premium')) {
                        navigation?.navigate('CommonSectionScreen', {
                          screenTitle: 'பிரத்யேகச் செய்திகள்',
                          apiEndpoint: 'https://api-st-cdn.dinamalar.com/newsdata?cat=651',
                          allTabLink: 'https://api-st-cdn.dinamalar.com/newsdata?cat=651',
                        });
                        return;
                      }

                      goToArticle(item);
                    }}
                  />
                  );
                })}
              </View>
            )
          ))}

          <DinamalarCalendar />
        </>
        
      )}
    </>
  );

  // --- Render ----------------------------------------------------------------
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.text === '#ffffff' ? "light-content" : "dark-content"} backgroundColor={colors.cardBackground} />

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

// --- Main Styles --------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? vs(30) : 0,
  },

  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.cardBackground,
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

  // Taboola ads container (ready for implementation)
  taboolaAdContainer: {
    height: vs(200),
    marginVertical: vs(10),
  },

  sectionHeader: {
    backgroundColor: colors.cardBackground,
    paddingHorizontal: s(12),
    paddingTop: vs(14),
    paddingBottom: vs(10),
  },
  sectionTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    color: colors.text,
    // marginBottom: vs(2),
  },
  sectionUnderline: {
    height: vs(3),
    width: s(40),
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
    backgroundColor: colors.cardBackground,
    marginBottom: vs(8),
  },
  districtListContainer: {
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
  },
  districtCard: {
    backgroundColor: colors.cardBackground,
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
    // backgroundColor: colors.cardBackground,
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
    color: colors.text,
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
    // backgroundColor: PALETTE.grey200,
    marginBottom: vs(8),
  },
  newsItemInfo: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: s(8)
  },
  newsItemTitle: {
    fontFamily: FONTS.muktaMalar.regular,
    color: colors.text,
    marginBottom: vs(3),
  },
  newsItemTime: {
    fontFamily: FONTS.muktaMalar.regular,
    color: PALETTE.grey500,
  },
});
