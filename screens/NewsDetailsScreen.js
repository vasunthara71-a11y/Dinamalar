// NewsDetailsScreen.js
//
// Taboola integration for Expo (WebView-based, no native SDK needed).
//
// Publisher IDs taken from your existing website TaboolaScript.js:
//   Mobile  → mdinamalarcom   ← used here (React Native = always mobile)
//   Desktop → dinamalarcom    ← ignored in this app
//
// Install (if not already):
//   npx expo install react-native-webview

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, Platform, Share, Linking, Dimensions,
  Animated, PanResponder,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { FacebookIcon, TwitterIcon, WhatsAppIcon, TelegramIcon, ShareIcon } from '../assets/svg/Icons';
import { Comment, Bookmark, BookmarkSaved, Editor } from '../assets/svg/Icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import RenderHtml from 'react-native-render-html';
import { mainApi } from '../config/api';
import { COLORS, FONTS, NewsCard } from '../utils/constants';
import { s, vs, scaledSizes } from '../utils/scaling';
import { ms } from 'react-native-size-matters';
import UniversalHeaderComponent from '../components/UniversalHeaderComponent';
import { addBookmark, removeBookmark, isBookmarked } from '../utils/storage';
import AppHeaderComponent from '../components/AppHeaderComponent';
import CommentsModal from '../components/CommentsModal';
import { useFontSize } from '../context/FontSizeContext';
import { Ionicons } from '@expo/vector-icons';
import AudioPlayerCard from '../components/AudioPlayerCard';
import ShareInfo from '../components/ShareInfo';
import IPaperSubscription from '../components/IPaperSubscription';
import FeedbackCard from '../components/FeedbackCard';
import TrendingTags from '../components/TrendingTags';
import DinamalarChannelSubscription from '../components/DinamalarChannelSubscription';
import MetaTags from '../components/MetaTags';
import SpecialToday from '../components/SpecialToday';
import Shorts from '../components/Shorts';
import MoreNews from '../components/MoreNews';
import AlsoSeeThis from '../components/AlsoSeeThis';

const { width: SCREEN_W } = Dimensions.get('window');

const SWIPE_THRESHOLD = 60;
const SWIPE_VELOCITY = 0.3;

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
  buttonBackground: '#e5eef5',
};


// ── Taboola publisher ID for mobile (from your website TaboolaScript.js) ──────
const TABOOLA_PUBLISHER_ID = 'mdinamalarcom';

const SYSTEM_FONTS = [
  'MuktaMalar', 'MuktaMalar-Regular', 'MuktaMalar-Bold',
  'MuktaMalar-Medium', 'MuktaMalar-SemiBold',
];

const LINE_HEIGHT_RATIO = 1.6;

const sanitizeHtml = (html) => {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();
};

const buildTagsStyles = (fontSize, textColor = COLORS.text) => {
  const lh = Math.round(fontSize * LINE_HEIGHT_RATIO);
  return {
    p: { margin: 0, marginBottom: vs(12), fontSize, color: textColor, lineHeight: lh, textAlign: 'left', fontFamily: FONTS?.muktaMalar?.medium || undefined },
    strong: { fontWeight: '700', color: textColor },
    b: { fontWeight: '700', color: textColor },
    em: { fontStyle: 'italic', color: textColor },
    i: { fontStyle: 'italic', color: textColor },
    h1: { fontSize: fontSize + 6, fontWeight: '800', color: textColor, marginBottom: vs(16), marginTop: vs(8), lineHeight: Math.round((fontSize + 6) * LINE_HEIGHT_RATIO) },
    h2: { fontSize: fontSize + 4, fontWeight: '700', color: textColor, marginBottom: vs(12), marginTop: vs(8), lineHeight: Math.round((fontSize + 4) * LINE_HEIGHT_RATIO) },
    h3: { fontSize: fontSize + 2, fontWeight: '700', color: textColor, marginBottom: vs(10), marginTop: vs(8), lineHeight: Math.round((fontSize + 2) * LINE_HEIGHT_RATIO) },
    h4: { fontSize, fontWeight: '700', color: textColor, marginBottom: vs(8), marginTop: vs(6), lineHeight: lh },
    ul: { margin: 0, marginLeft: s(20), marginBottom: vs(12) },
    ol: { margin: 0, marginLeft: s(20), marginBottom: vs(12) },
    li: { fontSize, color: textColor, marginBottom: vs(6), lineHeight: lh },
    a: { color: COLORS.primary, textDecorationLine: 'underline', fontWeight: '600' },
    blockquote: { backgroundColor: COLORS.primary + '10', borderLeftWidth: 4, borderLeftColor: COLORS.primary, paddingLeft: s(12), paddingVertical: vs(8), marginVertical: vs(12), fontStyle: 'italic' },
    br: { margin: 0, height: vs(8) },
    div: { marginBottom: vs(8) },
    span: { fontSize, color: textColor },
  };
};

const buildBaseStyle = (fontSize, textColor = COLORS.text) => ({
  fontSize,
  color: textColor,
  lineHeight: Math.round(fontSize * LINE_HEIGHT_RATIO),
  fontFamily: FONTS?.muktaMalar?.medium || undefined,
});

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ContentLoader() {
  return (
    <View style={styles.loaderContainer}>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonTitleShort} />
      <View style={styles.skeletonMeta}>
        <View style={styles.skeletonChip} /><View style={styles.skeletonChip} />
      </View>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonContent}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <View key={`sk-${i}`} style={[styles.skeletonLine, { width: i === 8 ? '75%' : '100%' }]} />
        ))}
      </View>
      <View style={styles.skeletonTags}>
        <View style={styles.skeletonTag} />
        <View style={styles.skeletonTag} />
        <View style={styles.skeletonTag} />
      </View>
      <View style={styles.skeletonShare} />
    </View>
  );
}

const getYouTubeId = (url = '') => {
  const match = url.match(/(?:embed\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

// ─── Taboola Widget ───────────────────────────────────────────────────────────
//
// Mirrors the exact pattern from your website's TaboolaScript.js:
//   _taboola.push({ article: 'auto' })
//   script.src = "//cdn.taboola.com/libtrc/mdinamalarcom/loader.js"
//
// The only additions needed for a WebView embed:
//   • viewport meta tag so Taboola renders at mobile width
//   • postMessage height reporting so the wrapper resizes to fit the ads
//
// Props come from data.taboola_ads.mobile.midarticle / .belowarticle:
//   mode      → e.g. "thumbnails-b-amp"
//   container → e.g. "taboola-mobile-mid-article-thumbnails-2"
//   placement → e.g. "Mobile Mid Article Thumbnails 2"
//   pageUrl   → canonical article URL (Taboola uses this for ad targeting)
function TaboolaWidget({ pageUrl, mode, container, placement }) {
  const [height, setHeight] = useState(1);

  if (!mode || !container || !placement || !pageUrl) return null;

  // Safely escape values injected into the HTML string
  const safe = (str) => String(str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  // ── Root cause fixes for ads not showing ────────────────────────────────
  //
  // Fix 1: baseUrl — when source={{ html }} has no baseUrl, the WebView
  //   origin is "null" or "about:blank". Taboola's script checks the
  //   document.referrer / origin and refuses to serve ads to unknown origins.
  //   Setting baseUrl: 'https://www.dinamalar.com' gives it the real domain.
  //
  // Fix 2: https:// protocol — protocol-relative URLs (//cdn.taboola.com)
  //   fail inside WebViews on Android because there is no inherited protocol.
  //   Must use explicit https://.
  //
  // Fix 3: Place the widget push BEFORE the loader script, not after.
  //   Taboola's loader reads _taboola on startup — if the placement config
  //   is pushed after the loader runs it is sometimes missed.

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    html, body {
      background: #fff;
      overflow-x: hidden;
      width: 100%;
      /* Horizontal padding around the whole widget */
      padding: 0;
   
    }

    #${safe(container)} {
      width: 100%;
      min-height: 1px;
    }

    /* ── Ad card images ─────────────────────────────────────────────────────
       Taboola renders images inside anchor > div > img or similar wrappers.
       The image is often absolutely positioned or uses object-fit:cover but
       defaults to top-align, causing the head/top of the subject to be cut.
       We force object-fit:cover + object-position:center so the image is
       always centred rather than top-cropped.
    */
    img {
      max-width: 100% !important;
      width: 100% !important;
      height: auto !important;
      display: block !important;
      object-fit: cover !important;
      object-position: center center !important;
    }

    /* Taboola wraps each card thumbnail in a div with fixed height.
       Allow it to grow naturally so the full image shows. */
    .videoCard-imageContainer,
    .videoCTA-imageContainer,
    [class*="imageContainer"],
    [class*="thumbnail"],
    [class*="image-container"] {
      height: auto !important;
      max-height: none !important;
      overflow: visible !important;
    }
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
      target_type: 'mix'
    });
  </script>

  <script type="text/javascript">
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

  <script>
    // ── Height reporter ────────────────────────────────────────────────────
    // Fix for cut-off bottom and partial last image:
    //   We now wait for ALL images to finish loading before measuring height.
    //   sendHeight() is called continuously — height only sent when it grows,
    //   so React Native always receives the final fully-rendered height.

    var lastReportedHeight = 0;

    function getFullHeight() {
      return Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.scrollHeight
      );
    }

    function sendHeight() {
      // 200ms reflow buffer after image paint completes
      setTimeout(function() {
        // Add 24px to account for body padding (12px top + 12px bottom)
        // and an 8px safety margin so the last item never clips
        var h = getFullHeight()  ;
        if (h > 50 && h > lastReportedHeight) {
          lastReportedHeight = h;
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', value: h }));
        }
      }, 200);
    }

    function waitForImagesAndReport() {
      var images = document.querySelectorAll('img');
      if (images.length === 0) { sendHeight(); return; }

      var pending = 0;
      images.forEach(function(img) {
        if (!img.complete) {
          pending++;
          img.addEventListener('load',  function() { if (--pending === 0) sendHeight(); });
          img.addEventListener('error', function() { if (--pending === 0) sendHeight(); });
        }
      });
      // All already loaded from cache
      if (pending === 0) sendHeight();
    }

    // Poll every 400ms for 30 seconds — covers late-loading ad slots
    var pollCount = 0;
    function poll() {
      waitForImagesAndReport();
      if (pollCount++ < 75) setTimeout(poll, 400);
    }
    setTimeout(poll, 500);

    // Also trigger immediately on any DOM change
    if (typeof MutationObserver !== 'undefined') {
      new MutationObserver(function() {
        waitForImagesAndReport();
      }).observe(document.body, { childList: true, subtree: true, attributes: false });
    }
  </script>

</body>
</html>`;

  return (
    <View style={[styles.taboolaWrap, { height }]}>
      <WebView
        // FIX 1: baseUrl gives the WebView the real dinamalar.com origin
        // so Taboola's domain check passes and ads are served
        source={{ html, baseUrl: 'https://www.dinamalar.com' }}
        style={{ width: '100%', height }}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        mixedContentMode="always"
        originWhitelist={['*']}
        allowsInlineMediaPlayback
        onMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data);
            // Always update height when it grows — never shrink
            // This ensures the bottom cut-off / partial image is fixed
            // as late-loading ad images push the height up further
            if (msg.type === 'height' && msg.value > 50) {
              setHeight(prev => Math.max(prev, msg.value));
            }
          } catch {
            const h = parseInt(e.nativeEvent.data, 10);
            if (!isNaN(h) && h > 50) setHeight(prev => Math.max(prev, h));
          }
        }}
        onError={(e) => console.warn('[Taboola WebView error]', e.nativeEvent)}
        nestedScrollEnabled={false}
      />
    </View>
  );
}

// ─── Google News Widget ───────────────────────────────────────────────────────────
function GoogleNewsWidget() {
  const [height, setHeight] = useState(300);
  // add state


  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      background: #fff; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 12px;
    }
    .google-news-container {
      width: 100%;
      min-height: 300px;
    }
    .news-item {
      border-bottom: 1px solid #f0f0f0;
      padding: 12px 0;
      display: flex;
      gap: 12px;
    }
    .news-item:last-child {
      border-bottom: none;
    }
    .news-image {
      width: 80px;
      height: 60px;
      background: #f5f5f5;
      border-radius: 4px;
      object-fit: cover;
    }
    .news-content {
      flex: 1;
    }
    .news-title {
      font-size: 14px;
      font-weight: 600;
      color: #1a73e8;
      margin-bottom: 4px;
      line-height: 1.3;
    }
    .news-source {
      font-size: 12px;
      color: #5f6368;
      margin-bottom: 2px;
    }
    .news-time {
      font-size: 11px;
      color: #9aa0a6;
    }
    .google-news-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid #1a73e8;
    }
    .google-logo {
      width: 24px;
      height: 24px;
      background: #4285f4;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      font-size: 14px;
    }
    .google-news-title {
      font-size: 16px;
      font-weight: 700;
      color: #202124;
    }
  </style>
</head>
<body>
  <div class="google-news-container">
    <div class="google-news-header">
      <div class="google-logo">G</div>
      <div class="google-news-title">Google News</div>
    </div>
    
    <div class="news-item">
      <img class="news-image" src="https://picsum.photos/seed/news1/80/60.jpg" alt="News image">
      <div class="news-content">
        <div class="news-title">Breaking: Latest Technology Updates</div>
        <div class="news-source">Tech News</div>
        <div class="news-time">2 hours ago</div>
      </div>
    </div>
    
    <div class="news-item">
      <img class="news-image" src="https://picsum.photos/seed/news2/80/60.jpg" alt="News image">
      <div class="news-content">
        <div class="news-title">Market Updates: Stocks Rise Today</div>
        <div class="news-source">Financial Times</div>
        <div class="news-time">4 hours ago</div>
      </div>
    </div>
    
    <div class="news-item">
      <img class="news-image" src="https://picsum.photos/seed/news3/80/60.jpg" alt="News image">
      <div class="news-content">
        <div class="news-title">Sports: Championship Finals This Weekend</div>
        <div class="news-source">Sports Daily</div>
        <div class="news-time">6 hours ago</div>
      </div>
    </div>
    
    <div class="news-item">
      <img class="news-image" src="https://picsum.photos/seed/news4/80/60.jpg" alt="News image">
      <div class="news-content">
        <div class="news-title">Weather: Clear Skies Expected Tomorrow</div>
        <div class="news-source">Weather Channel</div>
        <div class="news-time">8 hours ago</div>
      </div>
    </div>
  </div>

  <script>
    function sendHeight() {
      setTimeout(function() {
        var h = document.body.scrollHeight;
        if (h > 100) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', value: h }));
        }
      }, 100);
    }
    
    sendHeight();
    setTimeout(sendHeight, 1000);
  </script>
</body>
</html>`;

  return (
    <View style={[styles.googleNewsWrap, { height }]}>
      <WebView
        source={{ html, baseUrl: 'https://www.google.com' }}
        style={{ width: '100%', height }}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        onMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data);
            if (msg.type === 'height' && msg.value > 100) {
              setHeight(prev => Math.max(prev, msg.value));
            }
          } catch {
            const h = parseInt(e.nativeEvent.data, 10);
            if (!isNaN(h) && h > 100) setHeight(prev => Math.max(prev, h));
          }
        }}
        onError={(e) => console.warn('[Google News WebView error]', e.nativeEvent)}
      />
    </View>
  );
}

function GoogleFollowBanner({ data }) {
  const link = data?.link ||
    'https://news.google.com/publications/CAAqKAgKIiJDQklTRXdnTWFnOEtEV1JwYm1GdFlXeGhjaTVqYjIwb0FBUAE?hl=ta&gl=IN&ceid=IN%3Ata';

  const iconUrl = 'https://stat.dinamalar.com/new/2024/images/follow-icons/google_news.png';
  const shareUrl = /* pass this as a prop or get from context */ 'https://www.dinamalar.com';
  const shareTitle = '';

  const handleSocialShare = async (platform) => {
    const url = shareUrl;
    const text = encodeURIComponent(shareTitle);
    const encodedUrl = encodeURIComponent(url);

    

    const links = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${text}`,
      whatsapp: `https://wa.me/?text=${text}%20${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${text}`,
    };

    if (platform === 'share') {
      await Share.share({ title: shareTitle, message: `${shareTitle}\n\n${url}`, url });
    } else {
      Linking.openURL(links[platform]);
    }
  };

  return (
    <View style={styles.gnFollowWrap}>
      {/* Google News Follow button */}
      <TouchableOpacity
        style={styles.gnFollowBtn}
        onPress={() => Linking.openURL(link)}
        activeOpacity={0.85}
      >
        <Image
          source={{ uri: iconUrl }}
          style={styles.gnFollowIcon}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.gnDivider} />

      {/* Social icons */}
      <TouchableOpacity style={styles.gnSocialBtn} onPress={() => handleSocialShare('facebook')}>
        <FacebookIcon size={s(20)} color="#1877F2" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.gnSocialBtn} onPress={() => handleSocialShare('twitter')}>
        <TwitterIcon size={s(20)} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.gnSocialBtn} onPress={() => handleSocialShare('whatsapp')}>
        <WhatsAppIcon size={s(20)} color="#25D366" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.gnSocialBtn} onPress={() => handleSocialShare('telegram')}>
        <TelegramIcon size={s(20)} color="#229ED9" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.gnSocialBtn} onPress={() => handleSocialShare('share')}>
        <ShareIcon size={s(20)} color="#555" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Swipe Hint ───────────────────────────────────────────────────────────────
function SwipeHint({ direction }) {
  return (
    <View
      pointerEvents="none"
      style={[
        swipeHintSt.container,
        direction === 'left' && swipeHintSt.left,
        direction === 'right' && swipeHintSt.right,
      ]}
    >
      <Ionicons
        name={direction === 'left' ? 'chevron-back' : 'chevron-forward'}
        size={s(22)}
        color="#fff"
      />
      <Text style={swipeHintSt.text}>
        {direction === 'left' ? 'முந்தைய' : 'அடுத்த'}
      </Text>
    </View>
  );
}

const swipeHintSt = StyleSheet.create({
  container: {
    position: 'absolute', top: '40%', zIndex: 999,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: s(10),
    paddingHorizontal: s(12), paddingVertical: vs(10),
    alignItems: 'center', gap: vs(2),
  },
  left: { left: s(10) },
  right: { right: s(10) },
  text: { color: '#fff', fontSize: ms(10), fontWeight: '700' },
});

// ══════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════════════════════
export default function NewsDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { sf } = useFontSize();

  const {
    newsId,
    newsItem,
    newsList = [],
    disableComments = false,
  } = route.params || {};

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isLocationDrawerVisible, setIsLocationDrawerVisible] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('உள்ளூர்');
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [contentWidth, setContentWidth] = useState(SCREEN_W - s(32));
  const [scrollLocked, setScrollLocked] = useState(false);
  const [hintDir, setHintDir] = useState(null);
  const [newsComments, setNewsComments] = useState([]);
  const [nextNews, setNextNews] = useState(null);
  const [prevNews, setPrevNews] = useState(null);
  const [relatedNewsData, setRelatedNewsData] = useState([]);
  const [commentTotal, setCommentTotal] = useState(0);
  const [shortsData, setShortsData] = useState([]);
  const [authorId, setAuthorId] = useState(null);
  const [morenewsLink, setMorenewsLink] = useState(null);
  const [googleFollowData, setGoogleFollowData] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [trendingData, setTrendingData] = useState(null);
  const [specialData, setSpecialData] = useState(null);
  const [mdescription, setMdescription] = useState(null);

  const handleScroll = useCallback((e) => {
    setShowScrollTop(e.nativeEvent.contentOffset.y > 300);
  }, []);

  // ... (rest of the code remains the same)
  const scrollToTop = () =>
    scrollRef.current?.scrollTo({ x: 0, y: 0, animated: true });

  const [taboolaAds, setTaboolaAds] = useState(null);

  const translateX = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);
  const isHorizontalDrag = useRef(false);
  const scrollRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const hasPrev = !!prevNews?.newsid;
  const hasNext = !!nextNews?.newsid;

  const triggerPulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
  };

  const navigateToNews = useCallback((direction) => {
    if (isAnimating.current) return;
    const targetNews = direction === 'next' ? nextNews : prevNews;
    if (!targetNews?.newsid) {
      // Smooth bounce back animation when no next/prev
      Animated.spring(translateX, { 
        toValue: direction === 'next' ? -60 : 60, 
        useNativeDriver: true, 
        tension: 120, 
        friction: 10,
        overshootClamping: false
      }).start(() => {
        Animated.spring(translateX, { 
          toValue: 0, 
          useNativeDriver: true, 
          tension: 180, 
          friction: 14,
          overshootClamping: true
        }).start();
      });
      return;
    }
    isAnimating.current = true;
    const exitTo = direction === 'next' ? -SCREEN_W : SCREEN_W;
    
    // Ultra-smooth slide out animation with custom easing
    Animated.timing(translateX, { 
      toValue: exitTo, 
      duration: 300, 
      useNativeDriver: true,
      easing: (t) => {
        // Custom easing function for smooth acceleration/deceleration
        return t < 0.5 
          ? 2 * t * t 
          : 1 - Math.pow(-2 * t + 2, 2) / 2;
      }
    }).start(() => {
      isAnimating.current = false;
      navigation.replace('NewsDetailsScreen', {
        newsId: targetNews.newsid,
        newsItem: targetNews,
        newsList,
      });
    });
  }, [nextNews, prevNews, newsList, navigation, translateX]);

  // ── PanResponder ───────────────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (_, g) =>
        Math.abs(g.dx) > Math.abs(g.dy) * 2.5 && Math.abs(g.dx) > 15,
      onMoveShouldSetPanResponder: (_, g) => {
        const isH = Math.abs(g.dx) > Math.abs(g.dy) * 1.8 && Math.abs(g.dx) > 10;
        if (isH) { isHorizontalDrag.current = true; setScrollLocked(true); }
        return isH;
      },
      onPanResponderGrant: () => { 
        isHorizontalDrag.current = false; 
      },
      onPanResponderMove: (_, g) => {
        if (!isHorizontalDrag.current) return;
        // Smooth resistance with better feedback
        const resistance = g.dx > 0 ? Math.min(g.dx * 0.5, 100) : Math.max(g.dx * 0.5, -100);
        translateX.setValue(resistance);
        setHintDir(g.dx < 0 ? 'right' : 'left');
      },
      onPanResponderRelease: (_, g) => {
        setScrollLocked(false);
        isHorizontalDrag.current = false;
        setHintDir(null);
        if (isAnimating.current) return;
        
        const swipedLeft = g.dx < -SWIPE_THRESHOLD || g.vx < -SWIPE_VELOCITY;
        const swipedRight = g.dx > SWIPE_THRESHOLD || g.vx > SWIPE_VELOCITY;
        
        if (swipedLeft) navigateToNews('next');
        else if (swipedRight) navigateToNews('prev');
        else {
          // Smooth return animation with better spring physics
          Animated.spring(translateX, { 
            toValue: 0, 
            useNativeDriver: true, 
            tension: 160, 
            friction: 12,
            overshootClamping: true,
            restDisplacementThreshold: 0.1
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        setScrollLocked(false);
        isHorizontalDrag.current = false;
        setHintDir(null);
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  const handleMenuPress = (menuItem) => {
    const link = menuItem?.Link || menuItem?.link || '';
    if (link.startsWith('http') || link.startsWith('www.')) Linking.openURL(link);
  };
  const goToSearch = () => navigation?.navigate('SearchScreen');
  const goToNotifs = () => navigation?.navigate('NotificationScreen');
  const handleSelectDistrict = (district) => setSelectedDistrict(district.title);

  // Handle author navigation
  const handleAuthorPress = () => {
    // console.log('handleAuthorPress called');
    // console.log('authorId:', authorId);
    // console.log('Author name:', Author);

    if (authorId) {
      // console.log('Navigating to AuthorScreen with authorId:', authorId);
      navigation.navigate('AuthorScreen', { authorId, authorName: Author });
    } else {
      console.log('No authorId available for navigation');
      // For testing, you could navigate with a dummy ID or show an alert
      // alert('Author information not available');
    }
  };

  // ── Fetch shorts data ───────────────────────────────────────────────────────
  const fetchShorts = useCallback(async () => {
    try {
      const id = newsId || newsItem?.id || newsItem?.newsid || detail?.newsid;
      if (!id) {
        console.log('No news ID available for shorts');
        setShortsData([]);
        return;
      }
      
      console.log('Fetching shorts data for news ID:', id);
      const res = await mainApi.get(`/recentreels?newsid=${id}`);
      if (res.data && res.data.newlist && res.data.newlist.data && Array.isArray(res.data.newlist.data)) {
        // console.log('Shorts data fetched:', res.data.newlist.data.length, 'items');
        setShortsData(res.data.newlist.data);
      } else {
        console.log('No shorts data available for this news');
        setShortsData([]);
      }
    } catch (error) {
      console.error('Error fetching shorts:', error);
      setShortsData([]);
    }
  }, [newsId, newsItem]);

  // ── Fetch detail ───────────────────────────────────────────────────────────
  const fetchDetail = useCallback(async () => {
    const id = newsId || newsItem?.id || newsItem?.newsid;

    console.log('🔍 NewsDetailsScreen fetchDetail called');
    console.log('🔍 newsId:', newsId);
    console.log('🔍 newsItem:', newsItem);
    console.log('🔍 Extracted ID:', id);
    console.log('🔍 newsItem keys:', newsItem ? Object.keys(newsItem) : 'no newsItem');

    // Check if this is flash news - if so, don't fetch API, just show the flash news data
    const isFlashNews = newsItem && (
      newsItem.clr === 'flashnews_Y' || 
      newsItem.target === '' ||
      (newsItem.link && newsItem.link.includes('latestmain'))
    );

    console.log('🔍 Is flash news:', isFlashNews);

    // Immediately show available data without waiting for API
    if (newsItem && !detail) {
      console.log('🔍 Showing newsItem immediately:', newsItem.title || newsItem.newstitle);
      setDetail(newsItem);
      setLoading(false);
      
      // If it's flash news, don't fetch API - we already have complete data
      if (isFlashNews) {
        console.log('🔍 Flash news detected - skipping API fetch');
        return;
      }
    }

    if (!id) {
      if (newsItem) { setDetail(newsItem); setLoading(false); return; }
      setError('செய்தி ID கிடைக்கவில்லை');
      setLoading(false);
      return;
    }

    // Only fetch if we don't have complete data or need fresh data
    try {
      if (!newsItem) setLoading(true);
      setError(null);

      // Add timeout to prevent hanging - increased for NRI content
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 15000) // Increased to 15 seconds
      );

      // Try different endpoints for NRI content
      let res;
      try {
        res = await Promise.race([
          mainApi.get(`/detaildata?newsid=${id}`),
          timeoutPromise
        ]);
      } catch (error) {
        // If main endpoint fails, try NRI-specific endpoint
        console.log('Main endpoint failed, trying NRI endpoint for ID:', id);
        res = await Promise.race([
          mainApi.get(`/nridetail?cat=${id}&lang=ta`),
          timeoutPromise
        ]);
      }

      const data = res.data;

      console.log('🔍 API Response data structure:', data);
      console.log('🔍 API Response keys:', Object.keys(data));

      const article =
        data?.detailnews?.detailpage?.[0] ||
        data?.detailpage?.[0] ||
        data?.newsdetail?.[0] ||
        data?.detail?.[0] ||
        (Array.isArray(data) ? data[0] : null) ||
        null;

      console.log('🔍 Extracted article:', article);
      console.log('🔍 Article keys:', article ? Object.keys(article) : 'no article');

      // Update state in batches to reduce re-renders
      const updates = {};

      if (data?.comments?.data && Array.isArray(data.comments.data)) {
        updates.newsComments = data.comments.data;
      } else if (Array.isArray(data?.comments)) {
        updates.newsComments = data.comments;
      } else if (article?.comments?.data) {
        updates.newsComments = article.comments.data;
      } else if (Array.isArray(article?.comments)) {
        updates.newsComments = article.comments;
      } else {
        updates.newsComments = [];
      }

      updates.commentTotal = parseInt(data?.comments?.total, 10) || 0;
      updates.nextNews = data?.detailnews?.nextnews || null;
      updates.prevNews = data?.detailnews?.previousnews || null;
      updates.relatedNewsData = data?.detailnews?.relatednews || [];
      updates.detail = article || newsItem || null;
      updates.taboolaAds = data?.taboola_ads?.mobile || null;
      updates.googleFollowData = data?.googlefollowus?.[0] || null;
      updates.trendingData = data?.trending || null;
      updates.specialData = data?.specialtoday || null;
      updates.mdescription = article?.mdescription || null;
      updates.morenewsLink = data?.morenewslink || null;

      // Debug logging for morenewslink extraction
      // console.log('fetchDetail - data.morenewslink:', data?.morenewslink);
      // console.log('fetchDetail - updates.morenewsLink:', updates.morenewsLink);

      // Apply all updates at once
      Object.entries(updates).forEach(([key, value]) => {
        switch (key) {
          case 'newsComments': setNewsComments(value); break;
          case 'commentTotal': setCommentTotal(value); break;
          case 'nextNews': setNextNews(value); break;
          case 'prevNews': setPrevNews(value); break;
          case 'relatedNewsData': setRelatedNewsData(value); break;
          case 'detail': setDetail(value); break;
          case 'taboolaAds': setTaboolaAds(value); break;
          case 'googleFollowData': setGoogleFollowData(value); break;
          case 'trendingData': setTrendingData(value); break;
          case 'specialData': setSpecialData(value); break;
          case 'mdescription': setMdescription(value); break;
          case 'morenewsLink': setMorenewsLink(value); break;
        }
      });

      // Fetch shorts data after detail is loaded
      fetchShorts();

      // Extract author ID from the article data
      const authorIdToSet = article?.author_id || article?.authorid;
      if (authorIdToSet) {
        setAuthorId(authorIdToSet);
      }

    } catch (err) {
      console.error('Detail fetch error:', err?.message);
      if (!detail) {
        setDetail(newsItem || null);
        if (!newsItem) setError('செய்தியை ஏற்ற முடியவில்லை.');
      }
    } finally {
      setLoading(false);
    }
  }, [newsId, newsItem]);

  // Check bookmark status when detail changes
  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (detail) {
        const isSaved = await isBookmarked(detail);
        setBookmarked(isSaved);
      }
    };
    checkBookmarkStatus();
  }, [detail]);

  // Handle bookmark toggle
  const handleBookmarkToggle = async () => {
    if (!detail) return;

    if (bookmarked) {
      const success = await removeBookmark(detail);
      if (success) {
        setBookmarked(false);
        alert('புக்மார்க் நீக்கப்பட்டது');
      }
    } else {
      const success = await addBookmark(detail);
      if (success) {
        setBookmarked(true);
      }
    }
  };

  useEffect(() => { fetchDetail(); }, [fetchDetail]);
  
  // Combined effect to reduce re-renders when detail changes
  useEffect(() => {
    if (detail) {
      triggerPulse();
      // fetchShorts is already called in fetchDetail, so no need to call it here
    }
  }, [detail]);

  const getShareUrl = () => {
    const slug = detail?.slug || newsItem?.slug || '';
    const shareUrl = detail?.shareurl || newsItem?.shareurl || '';
    return shareUrl || (slug ? `https://www.dinamalar.com${slug}` : 'https://www.dinamalar.com');
  };

  const handleShare = async () => {
    try {
      const url = getShareUrl(); // call fresh each time
      const ttl = detail?.newstitle || newsItem?.newstitle || 'தினமலர் செய்தி';
      await Share.share({ title: ttl, message: `${ttl}\n\n${url}`, url });
    } catch (err) { console.error('Share error:', err); }
  };

  const handleOpenBrowser = () => Linking.openURL(getShareUrl());

  const d = detail || {};
  const ni = newsItem || {};

const title = d.newstitle || ni.newstitle || ni.title || '';
const image = d.largeimages || d.images || ni.largeimages || ni.images || '';
const catKey = d.maincat || ni.maincat || '';
const ago = d.ago || ni.ago || '';
const date = d.standarddate || ni.standarddate || '';
const content = d.newsdescription || d.content || ni.content || '';
const videoPath = d.path || ni.path || '';
const AddedDate = d.adddate;
const UpdateDate = d.updateddate;

const isVideo = catKey === 'video' || videoPath?.includes('youtube');
const isPodcast = catKey === 'podcast' || d.audio === '1' || d.audio === 1;
const Author = d.authorname;

const comments = commentTotal > 0
  ? commentTotal
  : parseInt(d.newscomment || d.nmcomment || ni.newscomment || ni.nmcomment || 0, 10) || 0;

const tags = Array.isArray(d.tags) ? d.tags : [];
const ytId = getYouTubeId(videoPath);
const ytThumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '';
const currentNewsId = newsId || newsItem?.id || newsItem?.newsid;
const podcastAudioUrl = videoPath || d.audiofile || d.audiourl || null;
const articlePageUrl = getShareUrl();

// Extract shorts link from API response
const shortsLink = d.shortslink || d.reelslink || null;

const BASE_FONT = sf(13);
const tagsStyles = React.useMemo(() => buildTagsStyles(BASE_FONT, COLORS.text), [BASE_FONT]);
const baseStyle = React.useMemo(() => buildBaseStyle(BASE_FONT, COLORS.text), [BASE_FONT]);
const safeContent = sanitizeHtml(content);

// Extract morenews data (moved outside return to fix scope)
// morenewslink is at root level of API response, not in detail object

// Debug logging
// console.log('NewsDetailsScreen - morenewsLink (state):', morenewsLink);
// console.log('NewsDetailsScreen - morenews data available:', !!morenewsLink);
// console.log('NewsDetailsScreen - detail state:', !!detail);
// console.log('NewsDetailsScreen - detail object keys:', detail ? Object.keys(detail) : 'no detail');

// Extract "இதையும் பாருங்க" item from descriptions
const alsoSeeThisItem = detail?.descriptions?.find(item => 
  item.title === 'இதையும் பாருங்க' || 
  item.title === 'இதையும் படிங்க'
);

// console.log('NewsDetailsScreen - alsoSeeThisItem found:', !!alsoSeeThisItem);

return (
  <View style={styles.container}>

    <UniversalHeaderComponent
      statusBarStyle="dark-content"
      statusBarBackgroundColor={COLORS.white}
      onMenuPress={handleMenuPress}
      onNotification={goToNotifs}
      notifCount={0}
      isDrawerVisible={isDrawerVisible}
      setIsDrawerVisible={setIsDrawerVisible}
      navigation={navigation}
      isLocationDrawerVisible={isLocationDrawerVisible}
      setIsLocationDrawerVisible={setIsLocationDrawerVisible}
      onSelectDistrict={handleSelectDistrict}
      selectedDistrict={selectedDistrict}
    >
      <AppHeaderComponent
        onSearch={goToSearch}
        onMenu={() => setIsDrawerVisible(true)}
        onLocation={() => setIsLocationDrawerVisible(true)}
        selectedDistrict="உள்ளூர்"
      />
    </UniversalHeaderComponent>

    <View style={styles.panLayer} {...panResponder.panHandlers}>
      <Animated.View style={[styles.animLayer, { transform: [{ translateX }] }]}>

        {hintDir === 'left' && <SwipeHint direction="left" />}
        {hintDir === 'right' && <SwipeHint direction="right" />}

        {hasNext && (
          <TouchableOpacity style={styles.edgeBtnRight} onPress={() => navigateToNews('next')} activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={s(30)} color={COLORS.white} />
          </TouchableOpacity>
        )}

        {hasPrev && (
          <TouchableOpacity style={styles.edgeBtnLeft} onPress={() => navigateToNews('prev')} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={s(30)} color={COLORS.white} />
          </TouchableOpacity>
        )}

        {loading && (
          <ScrollView scrollEnabled={!scrollLocked} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <ContentLoader />
          </ScrollView>
        )}

        {!loading && !!error && (
          <View style={styles.errorWrap}>
            <Ionicons name="alert-circle-outline" size={s(52)} color="#f44336" />
            <Text style={styles.errorTxt}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchDetail}>
              <Text style={styles.retryBtnTxt}>மீண்டும் முயற்சி</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && (
          <ScrollView
            ref={scrollRef}
            scrollEnabled={!scrollLocked}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            scrollEventThrottle={16}
            onScroll={handleScroll}
          >
            {/* Title */}
            <Text style={[styles.title, { fontSize: sf(17), lineHeight: sf(24) }]}>
              {title}
            </Text>

            {/* Meta row */}
            <View style={styles.metaRow}>

              {/* Only show author container if authorId exists and is not 0 */}
              {authorId && authorId !== 0 && (
                <TouchableOpacity onPress={handleAuthorPress} style={{ flexDirection: "row", alignItems: "center", gap: ms(5) }}>
                  <Editor size={s(20)} color={PALETTE.grey500} />
                  <Text style={styles.authorText}>{Author}</Text>
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />

              {!disableComments && (
                <TouchableOpacity style={styles.iconAction} onPress={() => setCommentsVisible(true)}>
                  <Comment size={s(15)} color={PALETTE.grey600} style={{ marginRight: 2 }} />
                  {comments > 0 && (
                    <Text style={[styles.iconBadge, { fontSize: sf(10) }]}>{comments}</Text>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.iconAction} onPress={handleBookmarkToggle}>
                {bookmarked ? (
                  <BookmarkSaved
                    size={s(20)}
                    color={COLORS.primary}
                  />
                ) : (
                  <Bookmark
                    size={s(20)}
                    color={PALETTE.grey600}
                  />
                )}
              </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: ms(12) }}>
              <Text style={[styles.authorText, { fontSize: ms(13) }]}>{AddedDate}</Text>
              <Text style={[styles.authorText, { fontSize: ms(13) }]}>{UpdateDate}</Text>
            </View>
            <View style={styles.rowDivider} />

            <GoogleFollowBanner
              data={googleFollowData}
              shareUrl={getShareUrl()}
              shareTitle={title}
            />

            {/* Hero image */}
            {!!image && !isVideo && !isPodcast && (
              <View style={styles.heroWrap}>
                <Image source={{ uri: image }} style={styles.heroImage} resizeMode="cover" />
                {!!d.imagecaption && <Text style={[styles.caption, { fontSize: sf(12) }]}>{d.imagecaption}</Text>}
              </View>
            )}

            {/* YouTube */}
            {isVideo && (
              <TouchableOpacity style={styles.videoWrap} onPress={() => videoPath && Linking.openURL(videoPath)}>
                {!!ytThumb ? (
                  <>
                    <Image source={{ uri: ytThumb }} style={styles.ytThumb} resizeMode="cover" />
                    <View style={styles.ytPlayOverlay}>
                      <Ionicons name="play-circle" size={s(56)} color="#fff" />
                    </View>
                  </>
                ) : (
                  <>
                    <Ionicons name="play-circle" size={s(56)} color="#fff" />
                    <Text style={styles.videoTxt}>வீடியோ பார்க்க தட்டவும்</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Podcast */}
            <AudioPlayerCard
              audioUrl={podcastAudioUrl}
              data={{
                spotify: d.spotifylink || d.spotify || null,
                alexa: d.alexalink || d.amazon || null,
              }}
            />

            {/* HTML body */}
            {!!safeContent && (
              <Animated.View
                style={[styles.contentSection, { opacity: pulseAnim }]}
                onLayout={(e) => { const w = e.nativeEvent.layout.width; if (w > 0) setContentWidth(w); }}
              >
                <RenderHtml
                  contentWidth={contentWidth}
                  source={{ html: safeContent }}
                  baseStyle={baseStyle}
                  tagsStyles={tagsStyles}
                  ignoredDomTags={['script', 'style', 'meta', 'head', 'html', 'body', 'subtitle']}
                  enableExperimentalMarginCollapsing
                  systemFonts={SYSTEM_FONTS}
                  renderersProps={{
                    a: { onPress: (_e, href) => { if (href) Linking.openURL(href); } },
                    img: { enableExperimentalPercentWidth: true },
                  }}
                />
              </Animated.View>
            )}

            {/* Share and top elements - only show after data loads */}
            {!loading && !error && detail && (
              <>
                <ShareInfo
                  url="https://www.dinamalar.com/news/123"
                  title="தமிழக செய்தி..."
                />
              </>
            )}

             {/* Also See This */}
            {alsoSeeThisItem && (
              <View style={{ paddingHorizontal: ms(12) }}>
              <AlsoSeeThis 
                item={alsoSeeThisItem}
                onPress={(item) => {
                  // Navigate to NewsDetailsScreen with the news ID
                  if (item.newsid) {
                    navigation.navigate('NewsDetailsScreen', { newsId: item.newsid });
                  } else {
                    console.log('No newsid found for item:', item);
                  }
                }}
              />
              </View>
            )}
            <IPaperSubscription />
            <FeedbackCard newsId={currentNewsId} />
            <MetaTags mdescription={mdescription} />
            <DinamalarChannelSubscription />
            <TrendingTags trendingData={trendingData} />
            <SpecialToday specialData={specialData} />
            
            {/* Shorts */}
            <Shorts shortsData={shortsData} onShortPress={(short) => {
              const url = short.link || short.url || (short.slug ? `https://www.dinamalar.com${short.slug}` : null);
              if (url) {
                Linking.openURL(url);
              }
            }} />

           

            {/* Extract morenews data (moved after detail is set) */}
 
           

            <MoreNews morenewsLink={morenewsLink} />

            {/* ── Taboola Mid-article ─────────────────────────────────────
                After body content. Uses mdinamalarcom / loader.js.
                mode + container + placement from data.taboola_ads.mobile.midarticle */}
            {taboolaAds?.midarticle && (
              <TaboolaWidget
                pageUrl={articlePageUrl}
                mode={taboolaAds.midarticle.mode}
                container={taboolaAds.midarticle.container}
                placement={taboolaAds.midarticle.placement}
              />
            )}

            {/* Related news */}
            {relatedNewsData.length > 0 && (
              <View style={styles.relatedSection}>
                <View style={styles.relatedHeader}>
                  <Text style={[styles.relatedSectionTitle, { fontSize: sf(14) }]}>
                    தொடர்புடையவை
                  </Text>
                  <View style={styles.relatedHeaderLine} />
                </View>

                {relatedNewsData.map((rel, i) => {
                  const relId = rel.id || rel.newsid;
                  const relImage = rel.images || rel.largeimages || rel.image ||
                    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';
                  const relTitle = rel.newstitle || rel.title || '';
                  const relDate = rel.standarddate || rel.ago || '';
                  const relCommentCount = parseInt(rel.nmcomment || rel.newscomment || rel.commentcount || 0, 10) || 0;

                  return (
                    <View key={`related-${i}-${relId || i}`} style={styles.relatedNewsCardWrap}>
                      <TouchableOpacity
                        onPress={() => navigation.push('NewsDetailsScreen', { newsId: relId, newsItem: rel, newsList })}
                        activeOpacity={0.88}
                      >
                        <View style={styles.relatedNewsImageWrap}>
                          <Image source={{ uri: relImage }} style={styles.relatedNewsImage} resizeMode="contain" />
                        </View>
                        <View style={styles.relatedNewsContent}>
                          {!!relTitle && (
                            <Text style={[NewsCard.title, { fontSize: sf(12), lineHeight: sf(20) }]} numberOfLines={3}>
                              {relTitle}
                            </Text>
                          )}
                          <View style={styles.relatedNewsMetaRow}>
                            <Text style={[NewsCard.timeText, { fontSize: sf(10) }]}>{relDate}</Text>
                            {relCommentCount > 0 && (
                              <View style={styles.relatedNewsCommentRow}>
                                <Comment size={s(14)} color="#637381" style={{ marginRight: 2 }} />
                                <Text style={[styles.relatedNewsCommentText, { fontSize: sf(12) }]}> {relCommentCount}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                      <View style={styles.relatedNewsDivider} />
                    </View>
                  );
                })}
              </View>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <View style={styles.tagsSection}>
                <Text style={[styles.tagsSectionTitle, { fontSize: sf(14) }]}>Tags</Text>
                <View style={styles.tagsWrap}>
                  {tags.map((tag, i) => (
                    <View key={`tag-${i}`} style={styles.tagChip}>
                      <Text style={[styles.tagTxt, { fontSize: sf(12) }]}>
                        #{typeof tag === 'string' ? tag : tag?.title || tag?.name || ''}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ── Taboola Below-article ───────────────────────────────────
                After related news + tags. Uses mdinamalarcom / loader.js.
                mode + container + placement from data.taboola_ads.mobile.belowarticle */}
            {taboolaAds?.belowarticle && (
              <TaboolaWidget
                pageUrl={articlePageUrl}
                mode={taboolaAds.belowarticle.mode}
                container={taboolaAds.belowarticle.container}
                placement={taboolaAds.belowarticle.placement}
              />
            )}

            <View style={{ height: vs(40) }} />
          </ScrollView>
        )}

          {/* Scroll to top button */}
          {showScrollTop && (
            <TouchableOpacity
              style={styles.scrollTopBtn}
              onPress={scrollToTop}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-up" size={s(20)} color="#fff" />
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>

      {!disableComments && (
        <CommentsModal
          visible={commentsVisible}
          onClose={() => setCommentsVisible(false)}
          newsId={currentNewsId}
          newsTitle={title}
          commentCount={comments}
          preloadedComments={newsComments}
          idType="newsid"
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white, paddingTop: Platform.OS === 'android' ? vs(0) : 0 },
  panLayer: { flex: 1, overflow: 'hidden' },
  animLayer: { flex: 1 },
  edgeBtnLeft: {
    position: 'absolute', left: 0, top: '45%',
    zIndex: 5,
    width: ms(40),
    height: ms(60),
    borderRadius: ms(10),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  // In StyleSheet.create({...})
  gnFollowWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: s(12),
    marginVertical: vs(10),
    paddingVertical: vs(8),
    // paddingHorizontal: s(12),
    backgroundColor: '#F8F9FA',
    // borderRadius: s(10),
    // borderWidth: 1,
    borderColor: '#E8EAED',
    gap: s(4),
  },
  gnFollowBtn: {
    marginRight: s(4),
  },
  gnFollowIcon: {
    width: s(55),
    height: s(35),
  },
  gnDivider: {
    width: 1,
    height: s(28),
    backgroundColor: '#DDE1E6',
    marginHorizontal: s(6),
  },
  gnSocialBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: s(8),
    backgroundColor: PALETTE.buttonBackground,
    width: 50,
    height: 50,
    borderRadius: 30
  },
  edgeBtnRight: {
    position: 'absolute', right: 0, top: '45%',
    zIndex: 5,
    width: ms(40),
    height: ms(60),
    borderRadius: ms(10),
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  scrollContent: {
    paddingBottom: vs(20),
  },
  title: {
    color: COLORS.text, paddingHorizontal: s(12),
    fontFamily: FONTS.muktaMalar.bold,
    paddingTop: vs(12),
    marginBottom: vs(12)
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: s(8), paddingHorizontal: s(12), marginBottom: vs(12) },
  authorText: { fontFamily: FONTS.muktaMalar.regular, fontSize: ms(14), color: PALETTE.grey600 },
  iconAction: { flexDirection: 'row', alignItems: 'center', gap: s(3), padding: s(4) },
  iconBadge: { color: PALETTE.grey600, fontWeight: '600' },
  heroWrap: { marginHorizontal: s(12), marginBottom: vs(12) },
  rowDivider: {
    height: 1,
    backgroundColor: '#EBEBEB',   // matches screenshot thin gray line
    marginHorizontal: ms(10),
  },
  heroImage: { width: '100%', height: ms(250), backgroundColor: '#f0f0f0' },
  caption: { color: PALETTE.grey600, fontStyle: 'italic', marginTop: vs(4), textAlign: 'center' },
  videoWrap: { marginHorizontal: s(16), height: ms(200), backgroundColor: '#1a1a2e', borderRadius: s(10), justifyContent: 'center', alignItems: 'center', marginBottom: vs(12), overflow: 'hidden' },
  ytThumb: { position: 'absolute', width: '100%', height: '100%' },
  ytPlayOverlay: { position: 'absolute', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.35)', width: '100%', height: '100%' },
  videoTxt: { color: '#fff', fontWeight: '600', marginTop: vs(8) },
  podcastSection: { marginBottom: vs(4) },
  podcastCard: { flexDirection: 'row', alignItems: 'center', gap: s(12), marginHorizontal: s(16), marginBottom: vs(12), backgroundColor: '#faf0ff', borderRadius: s(12), padding: s(12), borderWidth: 1, borderColor: '#9c27b025' },
  podcastArtwork: { width: s(72), height: s(72), borderRadius: s(10), overflow: 'hidden', backgroundColor: '#ede0f7', justifyContent: 'center', alignItems: 'center' },
  podcastArtworkImg: { width: '100%', height: '100%' },
  podcastArtworkFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  podcastInfo: { flex: 1 },
  podcastBadge: { flexDirection: 'row', alignItems: 'center', gap: s(4), backgroundColor: '#9c27b0', alignSelf: 'flex-start', paddingHorizontal: s(7), paddingVertical: vs(2), borderRadius: s(8), marginBottom: vs(6) },
  podcastBadgeTxt: { color: '#fff', fontSize: ms(8), fontWeight: '800', letterSpacing: 0.5 },
  podcastCardTitle: { fontSize: ms(13), fontWeight: '700', color: COLORS.text, lineHeight: ms(18), marginBottom: vs(4) },
  podcastCardDate: { fontSize: ms(10), color: PALETTE.grey600 },
  contentSection: { paddingHorizontal: s(12), marginBottom: vs(16) },

  // Taboola WebView wrapper
  // paddingHorizontal is handled inside the WebView HTML (body padding: 0 12px)
  // so the wrapper just needs vertical breathing room and a top separator line
  taboolaWrap: {
    width: '100%',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    marginTop: vs(8),
    marginBottom: vs(8),
    borderTopWidth: 1,
    borderTopColor: '#F4F6F8',
    borderBottomWidth: 1,
    borderBottomColor: '#F4F6F8',
    paddingTop: vs(4),
    paddingBottom: vs(4),
  },

  tagsSection: { paddingHorizontal: s(12), marginBottom: vs(16) },
  tagsSectionTitle: { fontWeight: '700', color: COLORS.text, marginBottom: vs(8) },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: s(6) },
  tagChip: { backgroundColor: COLORS.primary + '15', paddingHorizontal: s(10), paddingVertical: vs(4), borderRadius: s(14), borderWidth: 1, borderColor: COLORS.primary + '30' },
  tagTxt: { color: COLORS.primary, fontWeight: '600' },
  shareBar: { flexDirection: 'row', alignItems: 'center', gap: s(10), marginHorizontal: s(16), marginBottom: vs(8), paddingVertical: vs(12), borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  shareBarTitle: { flex: 1, fontWeight: '700', color: COLORS.text },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: s(4), backgroundColor: COLORS.primary + '12', paddingHorizontal: s(12), paddingVertical: vs(6), borderRadius: s(16) },
  shareBtnTxt: { color: COLORS.primary, fontWeight: '600' },
  swipeNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: s(16), marginTop: vs(4), marginBottom: vs(16), paddingVertical: vs(10), paddingHorizontal: s(12), borderWidth: 1, borderColor: '#f0f0f0', borderRadius: s(10), backgroundColor: '#fafafa' },
  swipeNavBtn: { flexDirection: 'row', alignItems: 'center', gap: s(4), padding: s(6) },
  swipeNavBtnDisabled: { opacity: 0.3 },
  swipeNavTxt: { fontSize: ms(13), fontWeight: '700', color: COLORS.primary },
  swipeNavTxtDisabled: { color: '#ccc' },
  relatedSection: { marginBottom: vs(10) },
  relatedHeader: { paddingHorizontal: s(12), marginBottom: vs(12) },
  relatedSectionTitle: {
 fontFamily: FONTS.muktaMalar.bold,
    color: PALETTE.grey800,     },
  relatedHeaderLine: { height: vs(2.5), width: s(60), backgroundColor: COLORS.primary },
  relatedNewsCardWrap: { backgroundColor: COLORS.white },
  relatedNewsImageWrap: { paddingHorizontal: s(12), paddingTop: vs(8) },
  relatedNewsImage: { width: '100%', height: vs(200), backgroundColor: '#f0f0f0' },
  relatedNewsContent: { padding: s(12) },
  relatedNewsTitle: { fontWeight: '700', color: COLORS.text, marginBottom: vs(6) },
  relatedNewsMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  relatedNewsTimeText: { color: '#637381' },
  relatedNewsCommentRow: { flexDirection: 'row', alignItems: 'center' },
  relatedNewsCommentText: { color: '#637381' },
  relatedNewsDivider: { height: vs(6), backgroundColor: '#F4F6F8' },
  errorWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: s(32) },
  errorTxt: { color: PALETTE.grey600, textAlign: 'center', marginTop: vs(12), marginBottom: vs(20) },
  retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: s(24), paddingVertical: vs(10), borderRadius: s(8) },
  retryBtnTxt: { color: '#fff', fontWeight: '700' },
  loaderContainer: { backgroundColor: COLORS.white, paddingHorizontal: s(12), paddingTop: vs(16) },
  skeletonTitle: { height: vs(28), backgroundColor: '#f0f0f0', borderRadius: s(6), marginBottom: vs(8), width: '92%' },
  skeletonTitleShort: { height: vs(28), backgroundColor: '#f0f0f0', borderRadius: s(6), marginBottom: vs(12), width: '75%' },
  skeletonMeta: { flexDirection: 'row', alignItems: 'center', gap: s(8), marginBottom: vs(16) },
  skeletonChip: { height: vs(22), backgroundColor: '#f5f5f5', borderRadius: s(10), width: s(80) },
  skeletonImage: { height: ms(210), backgroundColor: '#f0f0f0', borderRadius: s(8), marginBottom: vs(16) },
  skeletonContent: { marginBottom: vs(16), gap: vs(8) },
  skeletonLine: { height: vs(13), backgroundColor: '#f0f0f0', borderRadius: 4 },
  skeletonTags: { flexDirection: 'row', gap: s(8), marginBottom: vs(16) },
  skeletonTag: { height: vs(24), backgroundColor: '#f0f0f0', borderRadius: s(12), width: s(60) },
  skeletonShare: { height: vs(44), backgroundColor: '#f0f0f0', borderRadius: s(8), marginBottom: vs(20) },

  // Scroll to top button
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
    zIndex: 100,
  },

  // Google Follow WebView wrapper
  googleFollowWrap: {
    width: '100%',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    marginTop: vs(8),
    marginBottom: vs(8),
    borderTopWidth: 1,
    borderTopColor: '#F4F6F8',
    borderBottomWidth: 1,
    borderBottomColor: '#F4F6F8',
    paddingTop: vs(4),
    paddingBottom: vs(4),
  },
});
