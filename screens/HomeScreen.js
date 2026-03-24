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
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { Comment, Shorts } from '../assets/svg/Icons';
import { useNavigation } from '@react-navigation/native';
import { useFontSize } from '../context/FontSizeContext';
import LocationDrawer from '../components/LocationDrawer';
import TopMenuStrip from '../components/TopMenuStrip';
import AppHeaderComponent from '../components/AppHeaderComponent';
import DinamalarCalendar from '../components/DinamalarCalendar';
import SimplePodcastPlayer from '../components/SimplePodcastPlayer';
import JoshiyamSection from '../components/JoshiyamSection';
import TodayEventsCard from '../components/TodayEventsCard';
import { titles } from '../utils/textStyles';

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

function GoldSilverCard({ commodity }) {
  const meta = commodity?.data?.[0] || {};
  const gold = commodity?.gold || [];
  const silver = commodity?.silver || [];

  const renderDiff = (diff, change) => {
    if (!diff || diff === '0') return null;
    const isUp = change === 'increase';
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(3), marginTop: vs(2) }}>
        <Text style={{ fontSize: ms(13), fontFamily: FONTS.muktaMalar.bold, color: isUp ? '#dc2626' : '#16a34a' }}>
          {isUp ? '+' : ''}{diff}
        </Text>
        <Ionicons name={isUp ? 'caret-up' : 'caret-down'} size={s(14)} color={isUp ? '#dc2626' : '#16a34a'} />
      </View>
    );
  };

  if (!gold.length && !silver.length) return null;

  return (
    <View style={commoditySt.outerCard}>
      {/* Date header above everything */}
      {!!meta.golddate && (
        <Text style={commoditySt.dateHeader}>{meta.golddate}</Text>
      )}

      {/* Gold section */}
      {gold.length > 0 && (
        <View style={commoditySt.section}>
          <View style={commoditySt.inlineHeader}>
            <Text style={commoditySt.sectionIcon}>🪙</Text>
            <Text style={commoditySt.sectionTitle}>
              {meta.goldtitle || 'தங்கம் விலை நிலவரம் ( ₹ )'}
            </Text>
          </View>
          <View style={commoditySt.dividerH} />
          <View style={commoditySt.valuesRow}>
            {gold.map((item, i) => {
              const labelMap = { G22k: '22 காரட் 1கி', G18k: '18 காரட் 1கி' };
              return (
                <React.Fragment key={i}>
                  {i > 0 && <View style={commoditySt.dividerV} />}
                  <View style={commoditySt.valueCol}>
                    <Text style={commoditySt.valueLabel}>{labelMap[item.gtype] || item.gtype}</Text>
                    <Text style={commoditySt.valueAmount}>{item.rate}</Text>
                    {renderDiff(item.diff, item.change)}
                  </View>
                </React.Fragment>
              );
            })}
          </View>
        </View>
      )}

      {/* Silver section */}
      {silver.length > 0 && (
        <View style={[commoditySt.section,]}>
          <View style={commoditySt.inlineHeader}>
            <Text style={commoditySt.sectionIcon}>🥈</Text>
            <Text style={commoditySt.sectionTitle}>
              {meta.silvertitle || 'வெள்ளி விலை நிலவரம் ( ₹ )'}
            </Text>
          </View>
          <View style={commoditySt.dividerH} />
          <View style={commoditySt.valuesRow}>
            {silver.map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <View style={commoditySt.dividerV} />}
                <View style={commoditySt.valueCol}>
                  <Text style={commoditySt.valueLabel}>வெள்ளி 1கி</Text>
                  <Text style={commoditySt.valueAmount}>{item.rate}</Text>
                  {renderDiff(item.diff, item.change)}
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function FuelCard({ commodity }) {
  const meta = commodity?.data?.[0] || {};
  const fuel = commodity?.fuel?.[0] || {};
  if (!fuel.petrol && !fuel.diesel) return null;

  const fuelChange = fuel.petrolchange || fuel.change || '';
  const isUp = fuelChange === 'increase';

  return (
    <View style={[commoditySt.outerCard, { marginTop: vs(8) }]}>
      <View style={commoditySt.inlineHeader}>
        <Text style={commoditySt.sectionIcon}>⛽</Text>
        <View>
          <Text style={commoditySt.sectionTitle}>
            {meta.fueltitle || 'பெட்ரோல் & டீசல் விலை ( ₹ )'}
          </Text>
          <Text style={commoditySt.sectionDate}>
            {`Updated : ${fuel.date || meta.fueldate || ''}`}
          </Text>
        </View>
      </View>
      <View style={commoditySt.dividerH} />
      <View style={commoditySt.valuesRow}>
        <View style={commoditySt.valueCol}>
          <Text style={commoditySt.valueLabel}>பெட்ரோல்</Text>
          <Text style={commoditySt.valueAmount}>{fuel.petrol} ₹</Text>
          <Text style={commoditySt.noChange}>no change</Text>
        </View>
        <View style={commoditySt.dividerV} />
        <View style={commoditySt.valueCol}>
          <Text style={commoditySt.valueLabel}>டீசல்</Text>
          <Text style={commoditySt.valueAmount}>{fuel.diesel} ₹</Text>
          <Text style={commoditySt.noChange}>no change</Text>
        </View>
      </View>
    </View>
  );
}

function ShareMarketCard({ commodity }) {
  const markets = commodity?.sharemarket || [];
  if (!markets.length) return null;

  return (
    <View style={[commoditySt.outerCard, { marginTop: vs(8) }]}>
      <View style={commoditySt.inlineHeader}>
        <Text style={commoditySt.sectionIcon}>📈</Text>
        <View>
          <Text style={commoditySt.sectionTitle}>பங்குச் சந்தை</Text>
          {markets[0]?.date && (
            <Text style={commoditySt.sectionDate}>{`Updated : ${markets[0].date}`}</Text>
          )}
        </View>
      </View>
      <View style={commoditySt.dividerH} />
      <View style={commoditySt.valuesRow}>
        {markets.map((m, i) => {
          const isUp = m.change !== 'down';
          return (
            <React.Fragment key={i}>
              {i > 0 && <View style={commoditySt.dividerV} />}
              <View style={commoditySt.valueCol}>
                <Text style={commoditySt.valueLabel}>{m.stype?.toUpperCase()}</Text>
                <Text style={commoditySt.valueAmount}>{m.value}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(3), marginTop: vs(2) }}>
                  <Text style={{ fontSize: ms(14), fontFamily: FONTS.muktaMalar.bold, color: isUp ? '#16a34a' : '#dc2626' }}>
                    {m.diff}
                  </Text>
                  <Ionicons name={isUp ? 'caret-up' : 'caret-down'} size={s(12)} color={isUp ? '#16a34a' : '#dc2626'} />
                </View>
                <Text style={commoditySt.sectionDate}>{`Updated : ${m.date || ''}`}</Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const commoditySt = StyleSheet.create({
  outerCard: {
    backgroundColor: PALETTE.white,
    borderWidth: 1,
    borderColor: PALETTE.grey300,
    marginBottom: vs(2),
  },

  // Date shown above card — matches target "23-Mar (சென்னை)"
  dateHeader: {
    textAlign: 'center',
    fontSize: ms(18),
    fontFamily: FONTS.muktaMalar.regular,
    color: PALETTE.grey600,
    paddingVertical: vs(6),
    backgroundColor: PALETTE.white,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.grey200,
  },

  section: {
    backgroundColor: PALETTE.white,
    // borderWidth:1,
    // borderColor: PALETTE.grey300,
  },

  // Inline header — icon + title on same row, NO background tint
  inlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(10),
    paddingVertical: vs(10),
    gap: s(8),
    backgroundColor: PALETTE.grey200,   // ← white, not grey
  },

  sectionIcon: {
    fontSize: ms(20),
  },

  sectionTitle: {
    fontSize: ms(14),
    fontFamily: FONTS.muktaMalar.regular,
    color: PALETTE.grey800,
    fontWeight: 'bold',
    // textAlign: 'center',
  },

  sectionDate: {
    fontSize: ms(12),
    fontFamily: FONTS.muktaMalar.regular,
    color: PALETTE.grey500,
    marginTop: vs(1),
  },

  dividerH: {
    height: 1,
    backgroundColor: PALETTE.grey200,
  },

  dividerV: {
    width: 1,
    backgroundColor: PALETTE.grey200,
  },

  valuesRow: {
    flexDirection: 'row',
    backgroundColor: PALETTE.white,
    borderWidth: 1,
    borderColor: PALETTE.grey300,
  },

  valueCol: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: vs(12),
    paddingHorizontal: s(8),
  },

  valueLabel: {
    fontSize: ms(15),
    fontFamily: FONTS.muktaMalar.regular,
    color: PALETTE.grey500,
    marginBottom: vs(4),
    textAlign: 'center',
  },

  valueAmount: {
    fontSize: ms(20),
    fontFamily: FONTS.muktaMalar.bold,
    color: PALETTE.grey800,
  },

  noChange: {
    fontSize: ms(14),
    fontFamily: FONTS.muktaMalar.regular,
    color: PALETTE.grey500,
    marginTop: vs(2),
  },
});

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Taboola publisher ID for mobile (from your website TaboolaScript.js) ──────
const TABOOLA_PUBLISHER_ID = 'mdinamalarcom';

// ─── Play Icon (same as VideosScreen) ───────────────────────────────────────────
const PlayIcon = ({ size = 52 }) => (
  <View style={[tvCardSt.playCircle, { width: size, height: size, borderRadius: size / 2 }]} >
    <View style={[tvCardSt.playTriangle, {
      borderTopWidth: size * 0.22,
      borderBottomWidth: size * 0.22,
      borderLeftWidth: size * 0.36,
      marginLeft: size * 0.07
    }]} />
  </View>
);





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

// --- District Dropdown Component -----------------------------------------------------------
function DistrictDropdown({ districts, onDistrictSelect }) {
  const { sf } = useFontSize();
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!districts || districts.length === 0) return null;

  return (
    <View style={districtDropdownSt.container}>
      <TouchableOpacity
        style={districtDropdownSt.dropdownButton}
        onPress={() => setIsDropdownOpen(!isDropdownOpen)}
        activeOpacity={0.8}
      >
        <Text style={[districtDropdownSt.dropdownText, { fontSize: sf(12) }]}>
          {selectedDistrict ? selectedDistrict.TName : 'மாவட்டம் தேர்ந்தெடுக'}
        </Text>
        <Ionicons
          name={isDropdownOpen ? "chevron-up" : "chevron-down"}
          size={s(16)}
          color={PALETTE.grey600}
        />
      </TouchableOpacity>

      {isDropdownOpen && (
        <View style={districtDropdownSt.dropdownList}>
          {districts.map((district, index) => (
            <TouchableOpacity
              key={district.id || index}
              style={districtDropdownSt.dropdownItem}
              onPress={() => {
                setSelectedDistrict(district);
                setIsDropdownOpen(false);
                onDistrictSelect?.(district);
              }}
              activeOpacity={0.8}
            >
              <Text style={[districtDropdownSt.dropdownItemText, { fontSize: sf(12) }]}>
                {district.TName}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const districtDropdownSt = StyleSheet.create({
  container: {
    paddingHorizontal: s(12),
    paddingTop: vs(8),
    paddingBottom: vs(4),
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.grey100,
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
    borderRadius: s(6),
    borderWidth: 1,
    borderColor: PALETTE.grey300,
  },
  dropdownText: {
    fontFamily: FONTS.muktaMalar.regular,
    color: PALETTE.grey800,
    flex: 1,
  },
  dropdownList: {
    backgroundColor: PALETTE.white,
    borderRadius: s(6),
    borderWidth: 1,
    borderColor: PALETTE.grey300,
    marginTop: vs(4),
    maxHeight: vs(200),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  dropdownItem: {
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.grey200,
  },
  dropdownItemText: {
    fontFamily: FONTS.muktaMalar.regular,
    color: PALETTE.grey800,
  },
});

// --- Section Header -----------------------------------------------------------
function SectionHeader({ title }) {
  const { sf } = useFontSize();

  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { fontSize: sf(18) }]}>{title}</Text>
      <View style={styles.sectionUnderline} />
    </View>
  );
}

// --- Shorts Section ------------------------------------------------------------
function ShortsSection({ title, data, onPress }) {
  if (!data || data.length === 0) return null;

  // Split data into 2 columns with 2 items each
  const column1Data = data.slice(0, 2);
  const column2Data = data.slice(2, 4);

  return (
    <View style={shortsSectionSt.container}>
      <SectionHeader title={title} />
      <View style={shortsSectionSt.columnsContainer}>
        {/* Column 1 */}
        <View style={shortsSectionSt.column}>
          {column1Data.map((item, index) => (
            <ShortsCard
              key={`shorts-col1-${index}-${item.newsid || item.id || index}`}
              item={item}
              onPress={() => onPress(item)}
            />
          ))}
        </View>

        {/* Column 2 */}
        <View style={shortsSectionSt.column}>
          {column2Data.map((item, index) => (
            <ShortsCard
              key={`shorts-col2-${index}-${item.newsid || item.id || index}`}
              item={item}
              onPress={() => onPress(item)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const shortsSectionSt = StyleSheet.create({
  container: {
    backgroundColor: PALETTE.white,
    marginBottom: vs(8),
  },
  columnsContainer: {
    flexDirection: 'row',
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    marginHorizontal: s(2),
  },
});

// --- Shorts Card ----------------------------------------------------------------
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

        {/* Shorts icon in right corner */}
        <View style={shortsSt.shortsIconOverlay}>
          <Shorts size={s(15)} color="#fff" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const shortsSt = StyleSheet.create({
  card: {
    width: s(150),
    marginRight: s(12),
  },
  imageContainer: {
    width: '100%',
    height: vs(250),
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
  shortsIconOverlay: {
    position: 'absolute',
    top: s(8),
    right: s(8),
    backgroundColor: '#000',
    borderRadius: s(12),
    padding: s(4),
    justifyContent: 'center',
    alignItems: 'center',

  },
});

// --- News Card ----------------------------------------------------------------
function NewsCard({ item, onPress, isSocialMedia = false, isPremium = false, hideCategory = false, isCartoon = false, sectionTitle = '', is360Degree = false, hideImage = false, hideDescription = false, isIPaper = false }) {
  const { sf } = useFontSize();

  console.log('NewsCard hideDescription:', hideDescription, 'Title:', item.newstitle || item.title);

  const imageUri =
    item.largeimages || item.images || item.image || item.thumbnail || item.thumb ||
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';

  const title = decodeHtml(item.newstitle || item.title || item.videotitle || item.name || '');
  const category = item.maincat || item.categrorytitle || item.ctitle || item.maincategory || '';
  const ago = item.ago || item.time_ago || '';
  const newscomment =
    item.newscomment ||
    item.newscomments ||
    item.commentcount ||
    item.nmcomment ||
    item.nmcomments ||
    item.comments?.total ||
    (typeof item.comments === 'number' ? item.comments : null) ||
    '';
  const hasAudio = item.audio === 1 || item.audio === '1' || item.audio === true ||
    (typeof item.audio === 'string' && item.audio.length > 1 && item.audio !== '0');

  return (
    <View style={isSocialMedia ? NewsCardStyles.socialMediaWrap : NewsCardStyles.wrap}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
        {/* Image Container - Only show if hideImage is false */}
        {!hideImage && (
          <View style={isCartoon ? [NewsCardStyles.imageWrap, { marginHorizontal: 12, paddingHorizontal: 0, padding: 0 }] : NewsCardStyles.imageWrap}>
            <Image
              source={{ uri: imageUri }}
              style={
                isSocialMedia
                  ? [NewsCardStyles.image, { height: 400, borderRadius: ms(18) }]
                  : isCartoon
                    ? [NewsCardStyles.image, { height: 400, width: '100%' }]
                    : isIPaper
                      ? [NewsCardStyles.image, { height: vs(430) }]
                      : item.isBanner
                        ? [NewsCardStyles.image, { height: vs(430) }]
                        : [NewsCardStyles.image]
              }
              resizeMode={isCartoon ? "contain" : isSocialMedia ? "contain" : isIPaper ? "contain" : "contain"}
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

            {/* 360° Tag */}
            {is360Degree && (
              <View style={NewsCardStyles.degree360Tag}>
                <Text style={NewsCardStyles.degree360TagText}>360° கோயில்கள் (தமிழ்)</Text>
              </View>
            )}

            {/* Section Title */}
            {sectionTitle && (
              <View style={NewsCardStyles.sectionTitleContainer}>
                <Text style={[NewsCardStyles.sectionTitle, { fontSize: sf(12) }]}>{sectionTitle}</Text>
              </View>
            )}
          </View>
        )}

        {/* Tags for cards without images */}
        {hideImage && (
          <View style={{ position: 'relative', paddingHorizontal: s(12), paddingTop: vs(10) }}>
            {/* Premium Tag */}
            {isPremium && (
              <View style={[NewsCardStyles.premiumTag, { position: 'absolute', right: s(12), top: vs(10) }]}>
                <Text style={NewsCardStyles.premiumTagText}>பிரீமியம்</Text>
              </View>
            )}

            {/* 360° Tag */}
            {is360Degree && (
              <View style={[NewsCardStyles.degree360Tag, { position: 'absolute', right: s(12), top: vs(10) }]}>
                <Text style={NewsCardStyles.degree360TagText}>360° கோயில்கள் (தமிழ்)</Text>
              </View>
            )}
          </View>
        )}

        <View style={NewsCardStyles.contentContainer}>
          {/* Banner Title and Date - Show below image for banner items */}
          {item.isBanner && item.showCenteredTitle && (
            <View style={NewsCardStyles.bannerContentContainer}>
              {!!title && (
                <Text style={NewsCardStyles.bannerTitle}>{title}</Text>
              )}
              {!!item.standarddate && (
                <Text style={NewsCardStyles.bannerDate}>{item.standarddate}</Text>
              )}
            </View>
          )}

          {/* Regular title for non-banner items */}
          {!!title && !isSocialMedia && !item.isBanner && (
            <Text style={[NewsCardStyles.title, { fontSize: sf(13), lineHeight: sf(22) }]} numberOfLines={3}>
              {title}
            </Text>
          )}

          {/* Show description for temple items and Dinam Dinam */}
          {!!item.newsdescription && !isSocialMedia && !hideDescription && (
            <>
              {console.log('Rendering description for:', item.newstitle, 'hideDescription:', hideDescription)}
              <Text style={[NewsCardStyles.description, { fontSize: sf(12), lineHeight: sf(18), color: PALETTE.grey600, marginTop: vs(4) }]} numberOfLines={4}>
                {decodeHtml(item.newsdescription)}
              </Text>
            </>
          )}

          {!!category && !isSocialMedia && !hideCategory && !isPremium && (
            <View style={NewsCardStyles.catPill}>
              <Text style={[NewsCardStyles.catText, { fontSize: sf(12) }]}>
                {category}
              </Text>
            </View>
          )}

          <View style={NewsCardStyles.metaRow}>
            <Text style={[NewsCardStyles.timeText, { fontSize: sf(13) }]}>
              {ago}
            </Text>
            <View style={NewsCardStyles.metaRight}>
              {hasAudio && (
                <View style={NewsCardStyles.audioIcon}>
                  <Ionicons name="volume-high" size={s(14)} color={PALETTE.grey700} />
                </View>
              )}

              {!!newscomment && newscomment !== '0' && (
                <View style={NewsCardStyles.commentRow}>
                  <Comment size={s(15)} color={PALETTE.grey700} style={{ marginRight: 2 }} />
                  <Text style={[NewsCardStyles.commentText, { fontSize: sf(12) }]}> {newscomment}</Text>
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

function ShortNewsSection({ title, data, onPress, onSeeMore }) {
  const { sf } = useFontSize();
  if (!data || data.length === 0) return null;

  const item = data[0];
  const imageUri =
    item.largeimages || item.images || item.image || item.thumbnail ||
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';
  const title2 = decodeHtml(item.newstitle || item.title || item.videotitle || '');
  const category = item.maincat || item.ctitle || item.categrorytitle || '';
  const ago = item.ago || item.time_ago || '';
  const description = item.newsdescription || item.description || item.shortdescription || item.body || '';

  return (
    <View style={shortNewsSt.wrapper}>
      <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.88}>

        {/* Outer container — holds image + overlapping title card */}
        <View style={shortNewsSt.imageSection}>

          {/* Image with side margins */}
          <Image
            source={{ uri: imageUri }}
            style={shortNewsSt.image}
            resizeMode="cover"
          />

          {/* White title card — absolutely positioned, overlaps bottom of image */}
          {!!title2 && (
            <View style={shortNewsSt.titleCard}>
              <Text
                style={[shortNewsSt.titleText, { fontSize: sf(15), lineHeight: sf(22) }]}
                numberOfLines={3}
              >
                {title2}
              </Text>

              {/* Category pill + time */}
              <View style={shortNewsSt.metaRow}>
                {!!category && (
                  <View style={shortNewsSt.catPill}>
                    <Text style={[shortNewsSt.catText, { fontSize: sf(12) }]}>{category}</Text>
                  </View>
                )}
                {!!ago && (
                  <Text style={[shortNewsSt.agoText, { fontSize: sf(12) }]}>{ago}</Text>
                )}
              </View>

              {/* Description */}
              {!!description && (
                <Text
                  style={[shortNewsSt.description, { fontSize: sf(13), lineHeight: sf(22) }]}
                  numberOfLines={6}
                >
                  {description}
                </Text>
              )}

              {/* See more button */}
              <TouchableOpacity style={shortNewsSt.seeMoreBtn} onPress={onSeeMore} activeOpacity={0.85}>
                <Text style={[shortNewsSt.seeMoreText, { fontSize: sf(14) }]}>
                  மேலும் {title} &gt;&gt;
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const shortNewsSt = StyleSheet.create({
  wrapper: {
    backgroundColor: PALETTE.white,
    marginBottom: vs(8),
    // NO paddingHorizontal, NO borderRadius
  },

  imageSection: {
    // This container holds both image and the overlapping title card
    // paddingBottom makes room for the title card that hangs below
    paddingBottom: vs(0),
    paddingHorizontal: ms(20)
  },

  image: {
    width: '100%',
    height: vs(220),
    // NO borderRadius — full width flush image
  },

  // White card that overlaps the bottom of the image
  titleCard: {
    marginHorizontal: s(14),         // side margins so it doesn't touch screen edges
    marginTop: vs(-20),              // negative margin pulls it UP over the image
    backgroundColor: PALETTE.white,
    paddingHorizontal: s(14),
    paddingVertical: vs(12),
    // Subtle shadow to lift it above the image
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: vs(2) },
    shadowOpacity: 0.12,
    shadowRadius: s(4),
  },

  titleText: {
    fontFamily: FONTS.muktaMalar.bold,
    color: PALETTE.grey800,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: vs(10),
    paddingBottom: vs(4),
    gap: s(10),
  },

  catPill: {
    borderWidth: 1,
    borderColor: PALETTE.grey300,
    borderRadius: s(4),
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
  },

  catText: {
    fontFamily: FONTS.muktaMalar.regular,
    color: PALETTE.grey600,
  },

  agoText: {
    fontFamily: FONTS.muktaMalar.regular,
    color: PALETTE.grey500,
  },

  description: {
    fontFamily: FONTS.muktaMalar.regular,
    color: PALETTE.grey800,
    paddingTop: vs(4),
    paddingBottom: vs(8),
  },

  seeMoreBtn: {
    backgroundColor: PALETTE.primary,
    paddingVertical: vs(4),
    alignItems: 'center',
    borderRadius: s(6),
  },

  seeMoreText: {
    fontFamily: FONTS.muktaMalar.bold,
    color: '#fff',
  },
});


// NewsCard-style layout with play button overlay   tapping opens VideoPlayerModal
function DinaMalarTVCard({ item, onVideoPress }) {
  const { sf } = useFontSize();

  const imageUri =
    item.largeimages || item.images || item.image || item.thumbnail || item.thumb ||
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';

  const title = item.newstitle || item.title || item.videotitle || item.name || '';
  const category = item.maincat || item.categrorytitle || item.ctitle || item.maincategory || '';
  const ago = item.ago || item.time_ago || '';
  const newscomment = item.newscomment || item.commentcount || item.nmcomment || item.comments?.total || '';
  return (
    <View style={NewsCardStyles.wrap}>
      <TouchableOpacity onPress={onVideoPress} activeOpacity={0.88}>

        {/* Thumbnail with play-button overlay */}
        <View style={NewsCardStyles.imageWrap}>
          <Image source={{ uri: imageUri }} style={[NewsCardStyles.image, { height: ms(200) }]} resizeMode="contain" />

          {/* Semi-transparent scrim + centred play circle */}
          <View style={tvCardSt.playOverlay}>
            <PlayIcon size={36} />
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
            <Text style={[NewsCardStyles.timeText, { fontSize: sf(13) }]}>{ago}</Text>
            <View style={NewsCardStyles.metaRight}>
              {!!newscomment && newscomment !== '0' && (
                <View style={NewsCardStyles.commentRow}>
                  <Comment size={s(14)} color={PALETTE.grey700} style={{ marginRight: 2 }} />
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
        
        <View style={tvStyles.container}>
          {/* YouTube Red Box */}
          <View style={tvStyles.youtubeBox}>

            {/* Play Icon */}
            <View style={tvStyles.playBox}>
              <Ionicons name="play" size={s(16)} color="#FFFFFF" />
            </View>

            {/* YouTube Text */}
            <Text style={tvStyles.youtubeText}>YouTube</Text>
            {/* <View style={tvStyles.subscriberBox}> */}
              <Text style={tvStyles.subscriberText}>3M</Text>
            {/* </View> */}
          </View>

          {/* Subscribers Badge */}


        </View>
      </View>

      {/* Tabs — UI only, navigate to VideosScreen on press */}
      <View style={tvSecSt.tabBar}>
        {TV_TABS.map((tab, index) => (
          <React.Fragment key={tab.key}>
            <TouchableOpacity
              style={tvSecSt.tab}
              onPress={() => navigation?.navigate('VideosScreen', { initialTabKey: tab.key })}
              activeOpacity={0.7}
            >
              <Text style={[tvSecSt.tabText, { fontSize: sf(13) }]}>
                {tab.ta}
              </Text>
            </TouchableOpacity>
            {/* Add vertical separator except for last tab */}
            {index < TV_TABS.length - 1 && (
              <View style={{
                width: 1,
                height: vs(20),
                backgroundColor: PALETTE.grey300,
                marginHorizontal: s(4),
              }} />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Category separator line below tabs */}
      <View style={{
        height: 1,
        backgroundColor: PALETTE.grey300,
        marginHorizontal: s(12),
        marginVertical: vs(2),
      }} />

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

const tvSecSt = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: s(12),
    paddingTop: vs(14),
    paddingBottom: vs(4),
  },
  titleWrap: {},
  sectionTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    color: PALETTE.textDark,
  },
  titleUnderline: {
    height: vs(3),
    width: s(40),
    backgroundColor: PALETTE.primary,
    // borderRadius: 2,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: s(12),
    paddingBottom: vs(6),
    gap: s(8),
    justifyContent: "center",
    alignItems: "center",
    paddingTop:ms(8)
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(12),
    paddingVertical: vs(2),
    borderRadius: s(5),
    // borderWidth: 1,
    // borderColor: PALETTE.grey200 || '#e0e0e0',
    // backgroundColor: '#f5f5f5',
    // gap: s(4),
  },
  tabActive: {
    // backgroundColor: PALETTE.primary,
    // borderColor: PALETTE.primary,
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
    position: 'absolute',
    bottom: s(8), left: s(8),
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
  playTriangle: {
    width: 0, height: 0, borderStyle: 'solid',
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderLeftColor: '#FFFFFF',
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

// --- Skeleton Card ------------------------------------------------------------
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
// Add this helper at the top of HomeScreen.js
const decodeHtml = (str) => {
  if (!str) return '';
  return str
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
};
function DistrictNewsSection({ districts, onPress, districtTabData }) {
  const { sf } = useFontSize();
  if (!districts || districts.length === 0) return null;

  // Use districtTabData from API, or fallback to empty array
  const districtsToShow = districtTabData || [];

  return (
    <View style={districtSt.wrapper}>
      {districts.map((district, idx) => {
        const firstNews = district.data?.[0];
        if (!firstNews) return null;

        const imageUri =
          firstNews.images || firstNews.largeimages || firstNews.image || firstNews.thumbnail ||
          'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';
        const newsTitle = decodeHtml(firstNews.newstitle || firstNews.title || '');
        const ago = firstNews.ago || firstNews.standarddate || firstNews.time || '';
        const newscomment = firstNews.newscomment || firstNews.commentcount || firstNews.nmcomment || firstNews.comments?.total || '';

        return (
          <TouchableOpacity
            key={`district-${idx}-${district.id}`}
            style={districtSt.card}
            onPress={() => onPress(district)}
            activeOpacity={0.88}
          >
            {/* Header row: name + chevron (NO icon here) */}
            <View style={districtSt.headerRow}>
              {/* Empty space on left to offset for the overlapping icon */}
              <View style={districtSt.iconPlaceholder} />
              <Text style={[districtSt.districtName, { fontSize: sf(15) }]}>
                {district.title}
              </Text>
              <Ionicons name="chevron-forward" size={s(18)} color={PALETTE.grey800} />
            </View>

            {/* Image container — icon overlaps top-left of this */}
            <View style={districtSt.imageContainer}>
              <Image
                source={{ uri: imageUri }}
                style={districtSt.newsImage}
                resizeMode="cover"
              />

              {/* Icon absolutely positioned — overlaps top-left corner of image */}
              <View style={districtSt.iconOverlay}>
                {district.icon ? (
                  <Image
                    source={{ uri: district.icon }}
                    style={districtSt.iconCircle}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[districtSt.iconCircle, districtSt.iconFallback]}>
                    <Text style={[districtSt.iconFallbackText, { fontSize: sf(16) }]}>
                      {district.title?.charAt(0) || '?'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* News title + time */}
            <View style={districtSt.newsContent}>
              {!!newsTitle && (
                <Text style={[NewsCardStyles.title, { fontSize: sf(14), lineHeight: sf(22) }]} numberOfLines={2}>
                  {newsTitle}
                </Text>
              )}
              <View style={districtSt.metaRow}>
                <Text style={[NewsCardStyles.timeText, { fontSize: sf(13) }]}>{ago}</Text>
                <View style={NewsCardStyles.metaRight}>
                  {!!newscomment && newscomment !== '0' && (
                    <View style={NewsCardStyles.commentRow}>
                      <Comment size={s(15)} color={PALETTE.grey700} style={{ marginRight: 2 }} />
                      <Text style={[NewsCardStyles.commentText, { fontSize: sf(12) }]}> {newscomment}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* All Districts Horizontal Scroll */}
      {districtsToShow && districtsToShow.length > 0 && (
        <View style={districtSt.districtTabsContainer}>
          <ScrollView
            horizontal
            contentContainerStyle={districtSt.districtTabsScroll}
          >
            {districtsToShow.map((district, index) => (
              <TouchableOpacity
                key={`district-tab-${district.id || index}`}
                style={districtSt.districtTab}
                onPress={() => onPress(district)}
                activeOpacity={0.8}
              >
                <Text style={[districtSt.districtTabText, { fontSize: sf(13) }]}>
                  {district.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View >
  );
}

const tvStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  youtubeBox: {
    backgroundColor: '#FF0000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(8),
    paddingVertical: s(4),
    borderRadius: s(4),
    justifyContent:"center"
  },
  playBox: {
    marginRight: s(4),
  },
  playIcon: {
    color: '#FFFFFF',
    fontSize: sf(12),
  },
  youtubeText: {
    color: '#FFFFFF',
    fontSize: ms(12),
    fontFamily: FONTS.anek.semiBold,
    fontWeight:"600"
  },
  subscriberBox: {
    backgroundColor: PALETTE.grey200,
    paddingHorizontal: s(6),
    paddingVertical: s(2),
    borderRadius: s(4),
  },
  subscriberText: {
    color: PALETTE.white,
    fontSize: ms(15),
    fontFamily: FONTS.muktaMalar.bold,
    marginLeft:ms(5)
  },
});

const districtSt = StyleSheet.create({
  wrapper: {
    backgroundColor: PALETTE.grey100,
    marginBottom: vs(8),
    paddingHorizontal: ms(12)
  },

  card: {
    backgroundColor: PALETTE.white,
    marginBottom: vs(8),
    borderWidth: 1,
    borderColor: PALETTE.grey200,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    overflow: 'visible',   // ← allows icon to overflow outside card bounds
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(25),
    paddingVertical: vs(7),
    backgroundColor: PALETTE.white,
    gap: ms(8)
  },

  // Blank space on left matching icon width so text doesn't go under icon
  iconPlaceholder: {
    width: s(52),
    height: s(30),
  },

  districtName: {
    // flex: 1,
    fontFamily: FONTS.muktaMalar.bold,
    color: PALETTE.grey800,
  },

  // Container for image + overlapping icon
  imageContainer: {
    width: '100%',
    position: 'relative',   // ← needed for absolute child

  },

  newsImage: {
    width: '100%',
    height: vs(220),
  },

  // Icon sits at top-left, overlapping the image
  iconOverlay: {
    position: 'absolute',
    top: vs(-40),           // ← pulls icon UP into the header row area
    // left: s(12),   
    // ← aligns with header padding
  },

  iconCircle: {
    width: s(68),
    height: s(68),
    borderRadius: s(34),
    borderWidth: 3,
    borderColor: PALETTE.grey300,  // golden border
    backgroundColor: PALETTE.white,
  },

  iconFallback: {
    backgroundColor: PALETTE.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconFallbackText: {
    fontFamily: FONTS.muktaMalar.bold,
    color: PALETTE.white,
  },

  newsContent: {
    paddingHorizontal: s(12),
    paddingTop: vs(10),
    paddingBottom: vs(12),
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: vs(4),
  },

  newsTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    color: PALETTE.grey800,
    marginBottom: vs(4),
  },

  newsAgo: {
    fontFamily: FONTS.muktaMalar.regular,
    color: PALETTE.grey500,
    fontSize: ms(14)
  },

  // District tabs container
  districtTabsContainer: {
    // backgroundColor: PALETTE.white,
    marginTop: vs(8),
    paddingVertical: vs(12),
    borderTopWidth: 1,
    borderTopColor: PALETTE.grey200,
  },

  districtTabsScroll: {
    // paddingHorizontal: s(12),
  },

  districtTab: {
    backgroundColor: PALETTE.grey300,
    paddingHorizontal: s(16),
    paddingVertical: vs(6),
    // borderRadius: s(20),
    marginRight: s(20),
    borderWidth: 1,
    borderColor: PALETTE.grey300,
  },

  districtTabText: {
    fontFamily: FONTS.muktaMalar.semibold,
    color: PALETTE.grey800,

  },
});

// --- HomeScreen ---------------------------------------------------------------
export default function HomeScreen() {
  const navigation = useNavigation();

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
  const [podcastData, setPodcastData] = useState([]);
  const [sections, setSections] = useState([]);

  const flatListRef = useRef(null);

  const handleScroll = useCallback((e) => {
    setShowScrollTop(e.nativeEvent.contentOffset.y > 300);
  }, []);

  const scrollToTop = () =>
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });

  const handleSelectDistrict = useCallback((district) => {
    if (!district) return;
    setSelectedDistrict(district.title);
    setIsLocationDrawerVisible(false);
    if (district.id) {
      navigation?.navigate('DistrictNewsScreen', {
        districtId: district.id,
        districtTitle: district.title,
      });
    }
  }, []);

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
      const [
        homeRes, shortRes, shortsRes, varthagamRes, varavaramRes,
        joshiyamRes, districtRes, premiumRes, cinemaRes, cinemaRes2,
        photosRes, // Add photos API call
      ] = await Promise.allSettled([
        fetchHomeData(),
        fetchShortNews(),
        CDNApi.get(API_ENDPOINTS.SHORTS),
        CDNApi.get(API_ENDPOINTS.VARthagam),
        axios.get('https://u38.dinamalar.com/varavaram'),
        CDNApi.get(API_ENDPOINTS.JOSHIYAM),
        CDNApi.get(API_ENDPOINTS.DISTRICT),
        api.getPremium(),
        axios.get('https://cinema.dinamalar.com/api/cinema'),
        CDNApi.get('/movies'),
        CDNApi.get('/photos'), // Add photos API call
      ]);

      // ── Get commodity data locally (don't rely on state) ──────────────────
      const commodityData = varthagamRes.status === 'fulfilled'
        ? (varthagamRes.value?.data?.commodity || null)
        : null;

      // Update state for render usage
      if (commodityData) setCommodity(commodityData);

      // Initialize cinema variables
      let cinemaNews = [];
      let cinemaVideos = [];

      if (homeRes.status === 'fulfilled') {
        const d = homeRes.value?.data;

        setBreakingNews(
          d?.breaking_news || d?.breakingnews || d?.ticker_text || d?.ticker || ''
        );
        // ... (rest of the code remains the same)
        setTaboolaAds(d?.taboola_ads?.mobile || null);

        const sections = [];

        // ── தற்போதைய செய்திகள் ─────────────────────────────────────────────
        const originalTharpothaiyaData = d?.tharpothaiya_seithigal?.[0]?.data || [];
        const tharpothaiyaData = originalTharpothaiyaData.slice(0, 14);
        if (tharpothaiyaData.length > 0) {
          sections.push({
            title: d.tharpothaiya_seithigal[0].title || 'தற்போதைய செய்திகள்',
            data: tharpothaiyaData
          });
        }

        // ── Editor Choice ──────────────────────────────────────────────────
        if (d?.editorchoice?.data?.length > 0) {
          sections.push({
            title: d.editorchoice.title || 'எடிட்டர் லைக்ஸ்',
            data: d.editorchoice.data.slice(0, 1)
          });
        }

        // ── Social Media Cards ─────────────────────────────────────────────
        if (d?.socialmedia?.data?.length > 0) {
          sections.push({
            title: d.socialmedia.title || 'கார்ட்ஸ்',
            data: d.socialmedia.data.slice(0, 3),
            isSocialMedia: true
          });
        }

        // ── Banner News ────────────────────────────────────────────────────
        if (d?.bannernews?.[0]?.data?.length > 0) {
          sections.push({
            title: d.bannernews[0].title || 'தலைப்பு செய்தி',
            data: d.bannernews[0].data.slice(0, 1),
            isBanner: true
          });
        }

        // ── Cartoons ───────────────────────────────────────────────────────
        if (d?.catroons?.[0]?.data?.length > 0) {
          sections.push({
            title: d.catroons[0].title || 'கார்ட்டூன்ஸ்',
            data: d.catroons[0].data.slice(0, 3),
            isCartoons: true
          });
        }

        // ── Premium Stories ────────────────────────────────────────────────
        if (d?.premium_stories?.data?.length > 0) {
          sections.push({
            title: d.premium_stories.title || 'பிரீமியம் ஸ்டோரி',
            data: d.premium_stories.data.slice(0, 3),
            isPremium: true,
            hideDescription: true
          });
        }

        // ── Shorts / Reels ─────────────────────────────────────────────────
        if (d?.reels?.data?.length > 0) {
          sections.push({
            title: 'ஷார்ட்ஸ்',
            data: d.reels.data.slice(0, 4),
            type: 'shorts'
          });
        }

        // ── Dinamalar TV ───────────────────────────────────────────────────
        if (d?.dinamalartv?.length > 0) {
          const liveItems = (d?.live || []).map(item => ({ ...item, maincat: 'live' }));
          sections.push({
            title: 'தினமலர் டிவி',
            data: [...liveItems, ...d.dinamalartv],
            type: 'video',
          });
        }

        // ── Mixed Content ──────────────────────────────────────────────────
        if (d?.mixedcontent) {
          d.mixedcontent.forEach((sec) => {
            if (sec?.data?.length > 0)
              sections.push({ title: sec.title, data: sec.data.slice(0, 5) });
          });
        }

        // ── தினம் தினம் ────────────────────────────────────────────────────
        if (d?.dinamdinam) {
          const combined = [];
          d.dinamdinam.forEach((sec) => { if (sec?.data) combined.push(...sec.data); });
          if (combined.length > 0)
            sections.push({ title: 'தினம் தினம்', data: combined.slice(0, 2) });
        }

        // ── Short News ─────────────────────────────────────────────────────
        if (d?.shortnews?.data?.length > 0) {
          sections.push({
            title: d.shortnews.title || 'ஷார்ட் நியூஸ்',
            data: d.shortnews.data.slice(0, 5),
            type: 'shortnews'
          });
        }

        // ── Sports ─────────────────────────────────────────────────────────
        if (d?.sports?.data?.length > 0) {
          sections.push({ title: d.sports.title || 'விளையாட்டு', data: d.sports.data.slice(0, 3) });
        }

        // ── District News ──────────────────────────────────────────────────
        if (d?.district?.data?.length > 0) {
          sections.push({
            title: d.district.title || 'உள்ளூர் செய்திகள்',
            data: d.district.data,
            type: 'district',
            districtTabData: d?.districttab?.data || []
          });
        }

        // ── Varthagam News ─────────────────────────────────────────────────
        if (d?.varthagam?.varthagam1?.data?.length > 0) {
          const flattenedData = [];
          d.varthagam.varthagam1.data.forEach((array) => {
            if (Array.isArray(array)) flattenedData.push(...array);
          });
          if (flattenedData.length > 0) {
            sections.push({
              title: d.varthagam.varthagam1.title || 'வர்த்தகம்',
              data: flattenedData.slice(0, 3)
            });
          }
        }

        // ── Commodity Cards (Gold/Silver + Fuel + ShareMarket) ─────────────
        // Uses commodityData local variable — NOT the state variable
        if (commodityData) {
          if (commodityData.gold?.length > 0 || commodityData.silver?.length > 0) {
            sections.push({ title: 'தங்கம் & வெள்ளி விலை', data: [], isCommodity: true });
          }
          if (commodityData.fuel?.length > 0) {
            sections.push({ title: 'பெட்ரோல் டீசல் விலை', data: [], isFuel: true });
          }
          if (commodityData.sharemarket?.length > 0) {
            sections.push({ title: 'பங்குச் சந்தை', data: [], isShareMarket: true });
          }
        }

        // ── Joshiyam ──────────────────────────────────────────────────────────────
        if (d?.josiyam) {
          sections.push({ title: 'ஜோசியம்', data: [], type: 'josiyam', josiyamRaw: d.josiyam });
        }

        // ── கோயில்கள் (from home data) ──────────────────────────────────────
        const kovilgalData = d?.kovilgal; // Temple data is in kovilgal array
        if (kovilgalData && Array.isArray(kovilgalData) && kovilgalData.length > 1) {
          let templeItems = [];

          // Process second section: "கோயில்கள்" - kovil array (index 1)
          const kovilSection = kovilgalData[1];
          if (kovilSection?.kovil && Array.isArray(kovilSection.kovil)) {
            kovilSection.kovil.slice(0, 3).forEach(item => {
              if (item?.newstitle && item?.images) {
                templeItems.push({
                  newsid: item.newsid,
                  newstitle: item.newstitle,
                  images: item.images,
                  largeimages: item.images,
                  maincat: '', // No category for kovil items
                  ago: item.standarddate || item.ago || '', // Use actual date
                  slug: item.link || '',
                  external_link: item.link,
                  newsdescription: (item.newsdescription || '')
                });
              }
            });
          }

          // Process third section: "தினம் ஒரு கோயில்" - Dinamorukovil array (index 2)
          const dinamoruSection = kovilgalData[2];
          if (dinamoruSection?.Dinamorukovil && Array.isArray(dinamoruSection.Dinamorukovil)) {
            dinamoruSection.Dinamorukovil.slice(0, 2).forEach(item => {
              if (item?.newstitle) {
                templeItems.push({
                  newsid: item.newsid,
                  newstitle: item.newstitle,
                  images: item.largeimage || item.images,
                  largeimages: item.largeimage || item.images,
                  maincat: 'தினம் ஒரு கோயில்', // Show category for Dinamoru kovil
                  ago: item.standarddate || item.ago || '', // Use actual date
                  slug: item.link || '',
                  external_link: item.link,
                  newsdescription: (item.newsdescription || 'தினம் ஒரு கோயில் செய்தி விளக்கம் - இது ஒரு சோதனை விளக்கம்')
                    .replace(/<br\s*\/?>/gi, '\n')
                    .replace(/<[^>]+>/g, '')
                });
              }
            });
          }

          // Process fourth section: "360° கோயில்கள் (தமிழ்)" - temple array (index 3)
          const temple360Section = kovilgalData[3];
          if (temple360Section?.temple && Array.isArray(temple360Section.temple)) {
            temple360Section.temple.slice(0, 3).forEach(item => {
              if (item?.tname && item?.images) {
                templeItems.push({
                  newsid: item.newsid,
                  newstitle: item.tname, // Use tname as title since newstitle is null
                  images: item.images,
                  largeimages: item.images,
                  maincat: '', // No category for kovil items
                  ago: item.standarddate || item.ago || '', // Use actual date
                  slug: item.link || '',
                  external_link: item.link,
                  // No newsdescription for 360° temples
                  hideCategory: true, // Hide category in UI
                  is360Degree: true // Add flag for 360° tag
                });
              }
            });
          }

          if (templeItems.length > 0) {
            sections.push({ title: 'கோயில்கள்', data: templeItems });
          }
        }

        // ── Divider before Today Events ────────────────────────────────────
        sections.push({ title: '', data: [], isDivider: true });

        // ── Today Events (from kovilgal) ────────────────────────────────────────
        const todayEventsSection = kovilgalData?.find(section => section.title === 'இன்றைய நிகழ்ச்சிகள்');
        // Find district array - it's the array that contains objects with TName, EName, id
        const districtData = kovilgalData?.find(section =>
          Array.isArray(section) &&
          section.length > 0 &&
          section[0]?.TName &&
          section[0]?.EName &&
          section[0]?.id
        );

        // ADD THIS LOG:
        console.log('[kovilgal] districtData sample:', JSON.stringify(districtData?.[0], null, 2));
        console.log('[kovilgal] todayEventsSection:', JSON.stringify(todayEventsSection?.data?.[0], null, 2));

        // In loadAll, replace the today events push:
        if (todayEventsSection?.data && Array.isArray(todayEventsSection.data)) {
          const firstEvent = todayEventsSection.data[0];
          if (firstEvent) {
            sections.push({
              title: 'இன்றைய நிகழ்ச்சிகள்',
              data: [{
                ...firstEvent,
                // DON'T pre-clean here — let TodayEventsCard.cleanHtml handle it
                // so the same function applies to both initial and fetched content
                districts: districtData || []
              }],
              showDistrictDropdown: true
            });
          }
        }

        // ── Aanmegam ──────────────────────────────────────────────────────────
        const allAnmegamNews = [];
        console.log('Aanmegam raw data:', d.anmegam);

        // Add regular Aanmegam content (handle nested structure)
        if (d?.anmegam?.data?.length > 0) {
          // Define item counts for each section
          const sectionItemCounts = {
            'கோயில்கள்': 2,
            'ஆன்மிக சிந்தனை': 1,
            'சத்குருவின் ஆன்ந்த அலை': 1
          };

          // Reorder: கோயில்கள் first, then ஆன்மிக சிந்தனை
          const priority = ['கோயில்கள்', 'ஆன்மிக சிந்தனை', 'சத்குருவின் ஆன்ந்த அலை'];
          const reorderedData = priority
            .map(title => d.anmegam.data.find(item => item.title === title))
            .filter(Boolean);

          // Add remaining items in original order
          const remainingItems = d.anmegam.data.filter(item =>
            !priority.includes(item.title)
          );
          const finalOrder = [...reorderedData, ...remainingItems];

          finalOrder.forEach(category => {
            if (category?.data?.length > 0) {
              // Get the specific count for this section, default to all if not specified
              const itemCount = sectionItemCounts[category.title] || category.data.length;
              // Transform data to ensure image fields are properly mapped
              const transformedData = category.data.slice(0, itemCount).map(item => ({
                ...item,
                // Ensure image fields are mapped correctly for NewsCard
                largeimages: (item.largeimages || item.largeimage || item.images || item.image || item.thumbnail || item.thumb || '').trim(),
                images: (item.images || item.largeimage || item.image || item.thumbnail || item.thumb || '').trim(),
                image: (item.image || item.largeimage || item.thumbnail || item.thumb || '').trim(),
                thumbnail: (item.thumbnail || item.thumb || '').trim(),
                thumb: (item.thumb || '').trim()
              }));
              // Add only the specified number of items
              allAnmegamNews.push(...transformedData);
            }
          });
        }

        if (allAnmegamNews.length > 0) {
          console.log('All aanmegam news items:', allAnmegamNews);
          // Get the wrapperimage from the "ஆன்மிக சிந்தனை" category (which should be the 5th item in your data)
          const anmegaSinthanaiCategory = d.anmegam?.data?.find(item => item.title === 'ஆன்மிக சிந்தனை');
          const wrapperImage = anmegaSinthanaiCategory?.wrapperimage || '';
          console.log('Wrapper image found:', wrapperImage);

          // Create the final data array with wrapper image in 5th position
          const finalAnmegamData = [...allAnmegamNews];

          // Insert wrapper image at 5th position (index 4)
          if (wrapperImage && finalAnmegamData.length >= 4) {
            const wrapperItem = {
              newsid: 'wrapper-image',
              newstitle: anmegaSinthanaiCategory?.wrappertitle || 'ஆன்மிக மலர்',
              largeimages: wrapperImage,
              images: wrapperImage,
              image: wrapperImage,
              isBanner: true,
              link: anmegaSinthanaiCategory?.link || '',
              slug: anmegaSinthanaiCategory?.slug || '',
              standarddate: anmegaSinthanaiCategory?.standarddate || '',
              showCenteredTitle: true
            };

            // Replace the 5th item with wrapper image
            finalAnmegamData[4] = wrapperItem;
          }

          console.log('Final aanmegam data with wrapper at 5th:', finalAnmegamData);
          sections.push({
            title: d.anmegam?.title || 'ஆன்மிகம்',
            data: finalAnmegamData.slice(0, 5),
            hideDescription: true // Add flag to hide descriptions
          });
        }

        // ── iPaper ────────────────────────────────────────────────────────────
        if (d?.ipaper?.data?.length > 0) {
          console.log('iPaper raw data:', d.ipaper.data[0]);
          // Transform iPaper data to match NewsCard expected format
          const ipaperItems = d.ipaper.data.slice(0, 1).map(city => ({
            newsid: city.data?.[0]?.id || city.data?.[0]?.newsid,
            newstitle: '', // Hide headline for iPaper
            images: city.data?.[0]?.images,
            largeimages: city.data?.[0]?.images,
            maincat: '', // Hide category for iPaper
            ago: '', // Hide ago for iPaper
            slug: city.data?.[0]?.link || '',
            external_link: city.data?.[0]?.link || '',
            newsdescription: '',// iPaper typically doesn't have descriptions
            title: city.data?.[0]?.title || ''
          }));

          console.log('iPaper transformed item:', ipaperItems[0]);
          sections.push({
            title: d.ipaper.title || 'ஐ - பேப்பர்',
            data: ipaperItems,
            hideDescription: true // Hide descriptions for iPaper
          });
        }

        // ── Ulnga Thamizhar Seidhigal ─────────────────────────────────────────
        if (d?.ullagathamilarseithigal?.data?.length > 0) {
          // Transform data to ensure image fields are properly mapped and trimmed
          const ulngaThamizharItems = d.ullagathamilarseithigal.data.slice(0, 2).map(item => ({
            ...item,
            // Ensure image fields are mapped correctly for NewsCard and trim whitespace
            largeimages: (item.largeimages || item.images || item.image || item.thumbnail || item.thumb || '').trim(),
            images: (item.images || item.image || item.thumbnail || item.thumb || '').trim(),
            image: (item.image || item.thumbnail || item.thumb || '').trim(),
            thumbnail: (item.thumbnail || item.thumb || '').trim(),
            thumb: (item.thumb || '').trim()
          }));
          sections.push({
            title: d.ullagathamilarseithigal.title || 'உலக தமிழர் செய்திகள்',
            data: ulngaThamizharItems
          });
        }

        // ── Photo Gallery ─────────────────────────────────────────────
        console.log('Photos raw data from home API:', d?.photos);
        console.log('Photos response from separate API:', photosRes);
        console.log('All available keys in home data:', Object.keys(d || {}));

        // Use photos from home API based on your provided data structure
        let photoItems = [];

        if (d?.photos?.data?.length > 0) {
          d.photos.data.forEach(photoSection => {
            if (photoSection?.data?.length > 0) {
              photoSection.data.forEach(item => {
                // Handle different field names for each photo type
                let photoItem = {
                  newsid: item.eventid || item.id,
                  newstitle: item.newstitle || item.title || item.phototitle,
                  images: item.largeimages || item.images,
                  largeimages: item.largeimages || item.images,
                  maincat: photoSection.title || item.maincat,
                  ago: item.standarddate || item.ago || '',
                  slug: item.slug || item.link || '',
                  external_link: item.link || item.slug || '',
                  newsdescription: item.newsdescription || item.footnote || ''
                };
                photoItems.push(photoItem);
              });
            }
          });
        }

        // Also try separate API as backup
        if (photosRes?.status === 'fulfilled' && photosRes.value?.data?.length > 0) {
          photosRes.value.data.forEach(item => {
            if (item?.eventid || item?.id) {
              photoItems.push({
                newsid: item.eventid || item.id,
                newstitle: item.newstitle || item.title,
                images: item.largeimages || item.images,
                largeimages: item.largeimages || item.images,
                maincat: item.maincat || 'Photos',
                ago: item.standarddate || item.ago || '',
                slug: item.link || '',
                external_link: item.link,
                newsdescription: item.newsdescription || item.footnote || ''
              });
            }
          });
        }

        console.log('Total photo items collected:', photoItems.length);
        console.log('Sample photo item:', photoItems[0]);

        if (photoItems.length > 0) {
          sections.push({
            title: 'புகைகள்',
            data: photoItems.slice(0, 6),
            hideDescription: true,
            type: 'photos'
          });
        }

        // ── Books ─────────────────────────────────────────────────────
        console.log('Books raw data:', d?.books);
        if (d?.books?.data?.length > 0) {
          console.log('Books data array:', d.books.data);
          console.log('Sample book item:', d.books.data[0]);
          // Transform books data to match NewsCard expected format


          const booksItems = d.books.data.slice(0, 4).map(item => ({  // ← slice 4 instead of 2
            newsid: item.bookid || item.id,
            newstitle: item.bookname || item.title || '',
            images: item.Timages || item.images || '',  // ← Timages first!
            largeimages: item.Timages || item.images || '',
            maincat: 'புத்தகங்கள்',
            ago: '',
            slug: item.link || item.oldlink || '',
            external_link: item.link || item.oldlink || '',
            price: item.price || '',
            authorname: item.authorname || '',
            publish: item.publish || '',
            bookname: item.bookname || ''
          }));

          sections.push({
            title: d.books.title || 'புத்தகங்கள்',
            data: booksItems,
            isBooksSection: true,
            type: 'books'  // ← add type
          });
        }

        // ... (rest of the code remains the same)
        if (cinemaRes.status === 'fulfilled' && cinemaRes.value?.data) {
          cinemaNews = cinemaRes.value.data?.slice(0, 2) || [];
          cinemaVideos = cinemaRes.value.video?.slice(0, 2) || [];
        } else if (cinemaRes2.status === 'fulfilled' && cinemaRes2.value?.data) {
          cinemaNews = cinemaRes2.value.data?.slice(0, 2) || [];
          cinemaVideos = cinemaRes2.value.video?.slice(0, 2) || [];
        }
        if (cinemaNews.length === 0 && cinemaVideos.length === 0) {
          if (d?.cinema?.data) cinemaNews = d.cinema.data.slice(0, 2);
          if (d?.cinema?.video) cinemaVideos = d.cinema.video.slice(0, 2);
        }

        if (cinemaNews.length > 0 || cinemaVideos.length > 0) {
          sections.push({
            title: 'சினிமா',
            data: [...cinemaNews, ...cinemaVideos],
            hideDescription: true // Hide descriptions like Aanmegam
          });
        }

        if (cinemaNews.length > 0 || cinemaVideos.length > 0) {
          const cinemaVimarsanam = cinemaRes.status === 'fulfilled'
            ? (cinemaRes.value?.data?.vimarsanam || [])
            : (cinemaRes2.status === 'fulfilled'
              ? (cinemaRes2.value?.data?.vimarsanam || [])
              : (d?.cinema?.vimarsanam || []));

          sections.push({
            title: 'சினிமா',
            data: [...cinemaNews, ...cinemaVideos],
            vimarsanam: cinemaVimarsanam.slice(0, 5), // ← add this
            hideDescription: true
          });
        }

        // ── Weekly Malar ───────────────────────────────────────────────────
        const weeklyMalarData =
          d?.varamalar?.data ||
          d?.weeklymal?.data ||
          d?.weekmal?.data ||
          d?.weekly_malar?.data ||
          d?.weekmalar?.data || null;
        if (weeklyMalarData?.length > 0) {
          sections.push({
            title: 'வாரமலர்',
            data: weeklyMalarData.slice(0, 1),
            hideDescription: true // Hide descriptions like Aanmegam
          });
        }


        // ── Inappu Malar ─────────────────────────────────────────────────────
        if (d?.varavaram?.length > 0) {
          const inappuItems = d.varavaram.filter(item =>
            item.title && (item.title.includes('சித்ரா') || item.title.includes('செல்லமே') || item.title.includes('விருந்தினர்'))
          ).flatMap(item => item.data || []).slice(0, 1);

          if (inappuItems.length > 0) {
            sections.push({
              title: 'இணைப்பு மலர்',
              data: inappuItems
            });
          }
        }

        // ── Varavaram ───────────────────────────────────────────────────────
        if (d?.varavaram?.length > 0) {
          const varavaramItems = d.varavaram.filter(item =>
            item.title && !item.title.includes('நலம்') && !item.title.includes('டெக்') &&
            !item.title.includes('சித்ரா') && !item.title.includes('செல்லமே') && !item.title.includes('விருந்தினர்')
          ).flatMap(item => item.data || []).slice(0, 1);

          if (varavaramItems.length > 0) {
            sections.push({
              title: 'வாராவாரம்',
              data: varavaramItems
            });
          }
        }

        //------Special-----
        if (d?.special?.data?.length > 0) {
          const allSpecialNews = [];
          d.special.data.forEach(category => {
            if (category?.data?.length > 0) allSpecialNews.push(...category.data);
          });
          if (allSpecialNews.length > 0) {
            sections.push({ title: d.special.title || 'ஸ்பெஷல்', data: allSpecialNews.slice(0, 1) });
          }
        }

        // ── Web Stories ──────────────────────────────────────────────────────
        console.log('Available data keys:', Object.keys(d || {}));
        console.log('Web stories data:', d?.webstories);
        console.log('Web stories data (alt):', d?.web_stories);

        if (d?.webstories?.[0]?.data?.length > 0) {
          sections.push({
            title: d.webstories[0].title || 'வெப் ஸ்டோரிஸ்',
            data: d.webstories[0].data.slice(0, 2),
            hideDescription: true,
            type: 'webstories'
          });
        } else if (d?.web_stories?.[0]?.data?.length > 0) {
          sections.push({
            title: d.web_stories[0].title || 'வெப் ஸ்டோரிஸ்',
            data: d.web_stories[0].data.slice(0, 2),
            hideDescription: true,
            type: 'webstories'
          });
        } else {
          // Check if there are any other possible web story related fields
          const possibleKeys = Object.keys(d || {}).filter(key =>
            key.toLowerCase().includes('web') ||
            key.toLowerCase().includes('story') ||
            key.toLowerCase().includes('stories')
          );
          console.log('Possible web/story keys:', possibleKeys);
        }



        // ── Aanmigam ───────────────────────────────────────────────────────
        if (d?.anmegasinthanai?.data?.length > 0) {
          sections.push({
            title: d.anmegasinthanai.title || 'பாங்கு சன்னை',
            data: d.anmegasinthanai.data
          });
        }

        // ── Short News (from CDN) ──────────────────────────────────────────
        if (shortsRes.status === 'fulfilled' && shortsRes.value?.data?.length > 0) {
          sections.push({ title: 'சிறுசெய்திகள்', data: shortsRes.value.data, type: 'shorts' });
        }

        // ── Varthagam News (from CDN) ──────────────────────────────────────
        if (varthagamRes.status === 'fulfilled') {
          const varthagamData = [];
          const newlist = varthagamRes.value?.newlist || [];
          newlist.forEach((item) => {
            if (Array.isArray(item?.data)) varthagamData.push(...item.data);
          });
          if (varthagamData.length > 0) {
            sections.push({ title: 'வர்த்தகம்', data: varthagamData, hideDescription: true });
          }
        }



        // ── Varavaram ──────────────────────────────────────────────────────
        if (varavaramRes.status === 'fulfilled' && varavaramRes.value?.data?.length > 0) {
          sections.push({ title: 'வாராவாரம்', data: varavaramRes.value.data });
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

    if (categoryLower.includes('ஆன்மிகம்') || categoryLower.includes('anmegam') ||
      categoryLower.includes('ஆண்மேகம்')) {
      navigation?.navigate('CommonSectionScreen', {
        screenTitle: 'ஆன்மிகம்',
        apiEndpoint: 'https://u38.dinamalar.com/anmegam',
        allTabLink: 'https://u38.dinamalar.com/anmegam'
      });
      return;
    }

    // Check for iPaper items by link structure (since maincat is now empty)
    if ((item.external_link && item.external_link.includes('ipaper.dinamalar.com')) ||
      (item.slug && item.slug.includes('ipaper.dinamalar.com')) ||
      (item.link && item.link.includes('ipaper.dinamalar.com')) ||
      categoryLower.includes('ஐ பேப்பர்') || categoryLower.includes('ipaper') ||
      categoryLower.includes('ஐபேப்பர்') || categoryLower.includes('ஐ - பேப்பர்')) {
      const link = item.external_link || item.slug || item.link || 'https://ipaper.dinamalar.com/';
      Linking.openURL(link).catch(() => {
        console.log('Failed to open iPaper URL:', link);
      });
      return;
    }

    if (categoryLower.includes('உலக தமிழர்') || categoryLower.includes('ulnga thamizhar') ||
      categoryLower.includes('தமிழர் செய்திகள்') || categoryLower.includes('thamizhar seidhigal') ||
      categoryLower.includes('உலகத் தமிழர்')) {
      navigation?.navigate('CommonSectionScreen', {
        screenTitle: 'உலக தமிழர் செய்திகள்',
        apiEndpoint: 'https://u38.dinamalar.com/ulnga-thamizhar-seidhigal',
        allTabLink: 'https://u38.dinamalar.com/ulnga-thamizhar-seidhigal'
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
            // -- Divider ---------------------------------------------------------
            section.isDivider ? (
              <View key={`divider-${si}`} style={{ height: vs(8), backgroundColor: '#F4F6F8', marginVertical: vs(4) }} />
            ) :

              // -- Short News (horizontal scroll) ----------------------------------
              section.type === 'shorts' ? (
                section.title === 'ஷார்ட் நியூஸ்' ? (
                  <ShortsSection
                    key={`sec-${si}`}
                    title={section.title}
                    data={section.data}
                    onPress={goToShort}
                  />
                ) : (
                  <ShortsSection
                    key={`sec-${si}`}
                    title={section.title}
                    data={section.data}
                    onPress={goToShort}
                  />
                )

                // -- Video (Dinamalar TV) ? tabbed DinaMalarTVSection -----------
              ) : section.type === 'shortnews' ? (
                <View key={`sec-${si}`}>
                  <SectionHeader title={section.title} />   {/* ← header lives HERE, outside */}
                  <ShortNewsSection
                    title={section.title}
                    data={section.data}
                    onPress={goToShort}
                    onSeeMore={() => navigation?.navigate('ShortNewsSwiperScreen')}
                  />
                </View>
              ) : section.type === 'webstories' ? (
                <View key={`sec-${si}`}>
                  <SectionHeader title={section.title} />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: s(12), paddingVertical: vs(8) }}
                  >
                    {section.data?.map((item, i) => {
                      const { sf } = useFontSize();
                      const imageUri = item.images || item.largeimages || item.image || item.thumbnail || item.thumb || 'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';
                      const title = item.newstitle || item.title || '';

                      return (
                        <TouchableOpacity
                          key={`webstory-${i}-${item.newsid || item.id || i}`}
                          style={{
                            width: s(156),
                            marginRight: s(12),
                            backgroundColor: PALETTE.white,
                            borderRadius: s(8),
                            overflow: 'hidden'
                          }}
                          onPress={() => {
                            const link = item.link || item.slug || '';
                            if (link && (link.startsWith('http://') || link.startsWith('https://'))) {
                              Linking.openURL(link).catch(() => console.log('Failed to open link'));
                            }
                          }}
                          activeOpacity={0.85}
                        >
                          <View style={{ position: 'relative' }}>
                            <Image
                              source={{ uri: imageUri }}
                              style={{
                                width: '100%',
                                height: vs(250),
                                resizeMode: 'cover',
                              }}
                            />
                            {/* Full image overlay */}
                            {/* <View style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundColor: 'rgba(0,0,0,0.3)',
                            }} /> */}
                            {/* Title overlay at bottom */}
                            <View style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              paddingVertical: vs(10),
                              paddingHorizontal: s(8),
                              backgroundColor: 'rgba(0,0,0,0.5)',
                            }}>
                              <Text
                                style={[{
                                  fontFamily: FONTS.muktaMalar.semibold,
                                  fontSize: ms(14),
                                  color: '#FFFFFF',
                                  lineHeight: ms(18),
                                }]}
                              >
                                {title}
                              </Text>
                              {/* Horizontal lines below title */}
                              {[...Array(8)].map((_, index) => (
                                <View
                                  key={`line-${index}`}
                                  style={{
                                    position: 'absolute',
                                    bottom: vs(8),
                                    left: s(8 + (index * 16)),
                                    height: 1,
                                    backgroundColor: 'rgba(255,255,255,0.3)',
                                  }}
                                />
                              ))}
                            </View>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : section.type === 'books' ? (
                <View key={`sec-${si}`}>
                  <SectionHeader title={section.title} />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: s(12), paddingVertical: vs(8), gap: s(12) }}
                  >
                    {section.data?.map((item, i) => {
                      const imageUri = item.images || item.largeimages ||
                        'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=300';
                      const bookTitle = item.bookname || item.newstitle || '';
                      const price = item.price || '';

                      return (
                        <TouchableOpacity
                          key={`book-${i}-${item.newsid || i}`}
                          style={{
                            width: s(160),
                            alignItems: 'center',
                            // backgroundColor: PALETTE.white,
                            // borderWidth: 1,
                            // borderColor: PALETTE.grey200,
                            // padding: s(8),
                            borderRadius: s(4),
                          }}
                          onPress={() => {
                            const link = item.external_link || item.slug || '';
                            if (link.startsWith('http')) {
                              Linking.openURL(link).catch(console.warn);
                            }
                          }}
                          activeOpacity={0.85}
                        >
                          <Image
                            source={{ uri: imageUri }}
                            style={{ width: s(180), height: vs(200), borderRadius: s(4) }}
                            resizeMode="contain"
                          />
                          <Text
                            style={{
                              fontFamily: FONTS.muktaMalar.semibold,
                              fontSize: ms(14),
                              color: PALETTE.grey800,
                              textAlign: 'center',
                              marginTop: vs(8),
                            }}
                            numberOfLines={2}
                          >
                            {bookTitle}
                          </Text>
                          {!!price && (
                            <Text
                              style={{
                                fontFamily: FONTS.muktaMalar.semibold,
                                fontSize: ms(15),
                                color: PALETTE.grey600,
                                marginTop: vs(4),
                              }}
                            >
                              {price}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>) : section.type === 'photos' ? (
                  <View key={`sec-${si}`}>
                    <SectionHeader title={section.title} />
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingHorizontal: s(12), paddingVertical: vs(8) }}
                    >
                      {section.data?.map((item, i) => {
                        const imageUri = item.images || item.largeimages || item.image || item.thumbnail || item.thumb || 'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';
                        const title = item.newstitle || item.title || '';

                        return (
                          <TouchableOpacity
                            key={`photo-${i}-${item.newsid || item.id || i}`}
                            style={{
                              width: s(156),
                              marginRight: s(12),
                              backgroundColor: PALETTE.white,
                              borderRadius: s(8),
                              overflow: 'hidden'
                            }}
                            onPress={() => {
                              const link = item.link || item.slug || '';
                              if (link && (link.startsWith('http://') || link.startsWith('https://'))) {
                                Linking.openURL(link).catch(() => console.log('Failed to open link'));
                              }
                            }}
                            activeOpacity={0.85}
                          >
                            <View style={{ position: 'relative' }}>
                              <Image
                                source={{ uri: imageUri }}
                                style={{
                                  width: '100%',
                                  height: vs(250),
                                  resizeMode: 'cover',
                                }}
                              />
                              <View
                                style={{
                                  position: 'absolute',
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  paddingVertical: vs(10),
                                  paddingHorizontal: s(8),
                                  backgroundColor: 'rgba(0,0,0,0.5)',
                                }}
                              >
                                <Text
                                  style={{
                                    fontFamily: FONTS.muktaMalar.semibold,
                                    fontSize: ms(14),
                                    color: '#FFFFFF',
                                    lineHeight: ms(18),
                                  }}
                                >
                                  {title}
                                </Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                ) : section.type === 'video' ? (
                  <DinaMalarTVSection
                    key={`sec-${si}`}
                    data={section.data}
                    onVideoPress={(item) => {
                      // Check if this is a live item and navigate to VideosScreen with live tab
                      if (item.maincat === 'live') {
                        navigation?.navigate('VideosScreen', {
                          initialTabKey: 'live'
                        });
                      } else {
                        navigation?.navigate('VideoDetailScreen', {
                          videoId: item.videoid || item.id || item.newsid,
                          video: item,
                        });
                      }
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
                  <TouchableOpacity key={`sec-${si}`}
                    onPress={() => navigation?.navigate('CommodityScreen')}
                    activeOpacity={0.9}
                  >
                    <View style={{ paddingHorizontal: s(12), marginTop: vs(10) }}>
                      <GoldSilverCard commodity={commodity} />
                    </View>
                  </TouchableOpacity>

                ) : section.isFuel ? (
                  <TouchableOpacity key={`sec-${si}`}
                    onPress={() => navigation?.navigate('CommodityScreen')}
                    activeOpacity={0.9}
                  >
                    <View style={{ paddingHorizontal: s(12), marginTop: vs(4) }}>
                      <FuelCard commodity={commodity} />
                    </View>
                  </TouchableOpacity>

                ) : section.isShareMarket ? (
                  <TouchableOpacity key={`sec-${si}`}
                    onPress={() => navigation?.navigate('CommodityScreen')}
                    activeOpacity={0.9}
                  >
                    <View style={{ paddingHorizontal: s(12), marginTop: vs(4), marginBottom: vs(10) }}>
                      <ShareMarketCard commodity={commodity} />
                    </View>
                  </TouchableOpacity>
                ) : section.type === 'district' ? (
                  <View key={`sec-${si}`}>
                    <SectionHeader title={section.title} />
                    <DistrictNewsSection
                      districts={section.data}
                      districtTabData={section.districtTabData}
                      onPress={(district) => {
                        navigation?.navigate('DistrictNewsScreen', {
                          districtId: district.id,
                          districtName: district.title,
                          districtData: district
                        });
                      }}
                      sectionTitle={section.title}
                    />
                  </View>

                  // -- Banner News ----------------------------------------------
                ) : section.isBanner ? (
                  <View key={`sec-${si}`}  >
                    <SectionHeader title={section.title} />
                    {section.data?.map((item, i) => {
                      const isPremiumStory = section.title?.toLowerCase().includes('பிரத்யேகச் செய்திகள்') || section.title?.toLowerCase().includes('premium') || section.title?.toLowerCase().includes('பிரீமியம்');

                      return (
                        <NewsCard
                          key={`banner-${si}-${i}-${item.newsid || item.id || i}`}
                          item={item}
                          isPremium={isPremiumStory}
                          hideCategory={true}
                          hideDescription={true}
                          onPress={() => {
                            const link = item.slug || item.link || item.url || item.weburl;
                            if (link && (link.startsWith('http://') || link.startsWith('https://'))) {
                              Linking.openURL(link).catch(() => goToArticle(item));
                            } else if (item.newsid) {
                              goToArticle(item);
                            } else {
                              console.log('No valid navigation target for banner item');
                            }
                          }}
                        />
                      );
                    })}
                  </View>

                  // -- Cartoons ----------------------------------------------
                ) : section.isCartoons ? (
                  <View key={`sec-${si}`}>
                    <SectionHeader title={section.title} />
                    {section.data?.map((item, i) => {
                      return (
                        <NewsCard
                          key={`cartoon-${si}-${i}-${item.eventid || item.id || i}`}
                          item={{
                            ...item,
                            newscomment: typeof item.comments === 'number' ? item.comments : item.newscomment,
                          }}
                          hideCategory={true}
                          isCartoon={true}
                          hideDescription={true}
                          onPress={() => {
                            const link = item.slug || item.link || item.url || item.weburl;
                            if (link && (link.startsWith('http://') || link.startsWith('https://'))) {
                              Linking.openURL(link).catch(() => goToArticle(item));
                            } else if (item.eventid || item.newsid) {
                              goToArticle(item);
                            }
                          }}
                        />
                      );
                    })}
                  </View>

                  // -- Premium Stories ----------------------------------------------
                ) : section.isPremium ? (
                  <View key={`sec-${si}`}  >
                    <SectionHeader title={section.title} />
                    {section.data?.map((item, i) => {
                      const isPremiumStory = section.title?.toLowerCase().includes('பிரத்யேகச் செய்திகள்') || section.title?.toLowerCase().includes('premium') || section.title?.toLowerCase().includes('பிரீமியம்');

                      return (
                        <NewsCard
                          key={`premium-${si}-${i}-${item.newsid || item.id || i}`}
                          item={{
                            ...item,
                            newscomment: typeof item.newscomments === 'number' ? item.newscomments : item.newscomment,
                          }}
                          isPremium={isPremiumStory}
                          hideCategory={false}
                          hideDescription={true}
                          onPress={() => {
                            const link = item.slug || item.link || item.url || item.weburl;
                            if (link && (link.startsWith('http://') || link.startsWith('https://'))) {
                              Linking.openURL(link).catch(() => goToArticle(item));
                            } else if (item.newsid) {
                              goToArticle(item);
                            } else {
                              console.log('No valid navigation target for premium item');
                            }
                          }}
                        />
                      );
                    })}
                  </View>

                  // -- Regular news ------------------------------------------------
                ) : section.type === 'josiyam' ? (
                  <JoshiyamSection
                    key={`sec-${si}`}
                    josiyamData={section.josiyamRaw}
                    onSeeMore={() => navigation?.navigate('JoshiyamScreen')}
                  />
                ) : section.showDistrictDropdown ? (
                  <TodayEventsCard
                    key={`sec-${si}`}
                    section={section}
                    navigation={navigation}
                  />
                ) : (
                <View key={`sec-${si}`}>
                  <SectionHeader title={section.title} />
                  {section.data?.map((item, i) => {
                    const isPremiumStory = section.title?.toLowerCase().includes('பிரத்யேகச் செய்திகள்') || section.title?.toLowerCase().includes('premium') || section.title?.toLowerCase().includes('பிரீமியம்');
                    const isVideoItem = item.video || item.videoid || item.videotitle || item.y_path;
                    const isCinemaSection = section.title?.toLowerCase().includes('சினிமா');
                    const isVaramalarSection = section.title?.toLowerCase().includes('வாரமலர்');
                    // const isBooksSection = section.isBooksSection || section.title?.toLowerCase().includes('புத்தகங்கள்');

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
                                <Text style={[NewsCardStyles.timeText, { fontSize: sf(13) }]}>{date}</Text>
                              )}
                              {/* Divider after date */}
                              <View style={[NewsCardStyles.divider, { marginVertical: vs(8) }]} />
                              {!!description && (
                                <Text style={[NewsCardStyles.title, { fontSize: sf(12), lineHeight: sf(18), color: PALETTE.grey800, fontFamily: FONTS.muktaMalar.regular }]} numberOfLines={2}>{description}</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                          <View style={NewsCardStyles.divider} />
                        </View>
                      );
                    }

                    // Custom books card with special layout
                    // if (isBooksSection) {
                    //   const { sf } = useFontSize();
                    //   const imageUri = item.images || item.Timages || item.largeimages || item.image || item.thumbnail || item.thumb || 'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';
                    //   const bookTitle = item.bookname || item.title || item.newstitle || '';
                    //   const author = item.authorname || '';
                    //   const publisher = item.publish || '';
                    //   const price = item.price || '';

                    //   return (
                    //     <View key={`books-${si}-${i}-${item.bookid || item.id || i}`} style={[NewsCardStyles.wrap,]}>
                    //       <TouchableOpacity onPress={() => {
                    //         const link = item.link || item.oldlink || '';
                    //         if (link && (link.startsWith('http://') || link.startsWith('https://'))) {
                    //           Linking.openURL(link).catch(() => console.log('Failed to open link'));
                    //         }
                    //       }} activeOpacity={0.88}>
                    //         <View style={NewsCardStyles.imageWrap}>
                    //           <Image
                    //             source={{ uri: imageUri }}
                    //             style={NewsCardStyles.image}
                    //             resizeMode="contain"
                    //           />
                    //         </View>
                    //         <View style={NewsCardStyles.contentContainer}>
                    //           {!!bookTitle && (
                    //             <Text style={[NewsCardStyles.title, { fontSize: sf(14), lineHeight: sf(22), marginBottom: 5, textAlign: "center" }]} numberOfLines={2}>{bookTitle}</Text>
                    //           )}
                    //           {!!price && (
                    //             <Text style={[NewsCardStyles.title, { fontSize: sf(14), color: PALETTE.grey600, fontFamily: FONTS.muktaMalar.bold, marginBottom: 0, textAlign: "center" }]}>{price}</Text>
                    //           )}
                    //         </View>
                    //       </TouchableOpacity>
                    //       <View style={NewsCardStyles.divider} />
                    //     </View>
                    //   );
                    // }


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
                    const shouldHideDescription = section.hideDescription ||
                      section.title?.includes('ஆன்மிகம்') ||
                      section.title?.includes('வர்த்தகம்') ||
                      section.title?.includes('பிரீமியம்') ||
                      section.title?.includes('பிரத்யேகச் செய்திகள்') ||
                      section.title?.includes('உலக தமிழர் செய்திகள்') ||
                      section.title?.includes('ஸ்பெஷல்') ||
                      section.title?.includes('வாரமலர்') ||
                      section.title?.includes('எடிட்டர் லைக்ஸ்')
                    section.isPremium;

                    console.log('Section:', section.title, 'shouldHideDescription:', shouldHideDescription);

                    return (
                      <NewsCard
                        key={`${si}-${i}-${item.newsid || item.id || i}`}
                        item={item}
                        isSocialMedia={section.isSocialMedia || false}
                        // isPremium={isPremiumStory}
                        is360Degree={item.is360Degree || false}
                        hideImage={item.hideImage || false}
                        hideDescription={shouldHideDescription}
                        isIPaper={section.title?.includes('ஐ - பேப்பர்') || section.title?.includes('iPaper') || section.title?.includes('ஐ பேப்பர்') || section.title?.includes('ஐபேப்பர்')}
                        // sectionTitle={section.title || ''}
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

                          if (sectionTitle.includes('வாராவாரம்') || sectionTitle.includes('varavaram')) {
                            navigation?.navigate('CommonSectionScreen', {
                              screenTitle: 'வாராவாரம்',
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

                          // if (sectionTitle.includes('பிரத்யேகச் செய்திகள்') || sectionTitle.includes('premium')) {
                          //   navigation?.navigate('CommonSectionScreen', {
                          //     screenTitle: 'பிரத்யேகச் செய்திகள்',
                          //     apiEndpoint: 'https://api-st-cdn.dinamalar.com/newsdata?cat=651',
                          //     allTabLink: 'https://api-st-cdn.dinamalar.com/newsdata?cat=651',
                          //   });
                          //   return;
                          // }

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
  const { sf } = useFontSize();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
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
        onSelectDistrict={(district) => {
          try {
            if (!district) return;
            setSelectedDistrict(district.title);
            setIsLocationDrawerVisible(false);
            if (district.id) {
              navigation?.navigate('DistrictNewsScreen', {
                districtId: district.id,
                districtTitle: district.title,
              });
            }
          } catch (error) {
            console.error('Error in handleSelectDistrict:', error);
          }
        }}
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
      <SimplePodcastPlayer data={podcastData} />

      {showScrollTop && (
        <TouchableOpacity style={styles.scrollTopBtn} onPress={scrollToTop} activeOpacity={0.85}>
          <Ionicons name="arrow-up" size={s(20)} color={PALETTE.white} />
        </TouchableOpacity>
      )}

    </SafeAreaView>
  );
}

// --- Main Styles --------------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.grey100,
    paddingTop: Platform.OS === 'android' ? vs(0) : 20,
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

  // Taboola ads container (ready for implementation)
  taboolaAdContainer: {
    height: vs(200),
    marginVertical: vs(10),
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
    // backgroundColor: PALETTE.white,
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
    color: PALETTE.grey800,
    marginBottom: vs(3),
  },
  newsItemTime: {
    fontFamily: FONTS.muktaMalar.regular,
    color: PALETTE.grey500,
  },
});
