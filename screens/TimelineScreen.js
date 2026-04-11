import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl, Dimensions,
  Animated, StyleSheet, Platform, Linking, AppState,
} from 'react-native';
import {
  SpeakerIcon,
  AudioIcon,
  PhotoIcon,
  FlashIcon,
  DocumentIcon,
  LatestVideoIcon
} from '../assets/svg/Icons';
import { WebView } from 'react-native-webview';
import RenderHtml from 'react-native-render-html';
import axios from 'axios';
import { CDNApi, API_ENDPOINTS, API_BASE_URLS } from '../config/api';
import { COLORS, FONTS, NewsCard } from '../utils/constants';
import { s, vs, scaledSizes } from '../utils/scaling';
import { useNavigation } from '@react-navigation/native';
import { ms, mvs } from 'react-native-size-matters';
import UniversalHeaderComponent from '../components/UniversalHeaderComponent';
import AppHeaderComponent from '../components/AppHeaderComponent';
import TEXT_STYLES from '../utils/textStyles';
import { useFontSize } from '../context/FontSizeContext';
import FontSizeControl from '../components/FontSizeControl';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import {
  pollRealTimeNotifications,
  getBadgeCount,
  saveBadgeCount,
  initializeNotificationService,
  createNotificationAlert
} from '../services/realTimeNotificationService';
import {
  initializePushNotifications,
  getPushNotificationPreferences,
  shouldSendPushNotification,
  createNotificationPayload,
  sendPushNotification,
  handlePushNotification
} from '../services/pushNotificationService';
import RealTimeNotificationPopup from '../components/RealTimeNotificationPopup';
import NotificationCenter from '../components/NotificationCenter';
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
  black: '#0000'
};

const CAT_CONFIG = {
  photo: { label: 'புகைப்படம்', color: '#e91e8c', icon: PhotoIcon },
  video: { label: 'வீடியோ', color: '#f44336', icon: LatestVideoIcon },
  podcast: { label: 'பாட்காஸ்ட்', color: '#9c27b0', icon: AudioIcon },
  seithigal: { label: 'செய்திகள்', color: '#1565c0', icon: DocumentIcon },
  flash: { label: 'ஃபிளாஷ்', color: '#ff6b35', icon: FlashIcon },
  default: { label: 'செய்தி', color: COLORS.primary, icon: FlashIcon },
};
const getCat = (maincat) => CAT_CONFIG[maincat] || CAT_CONFIG.default;

// ─── Video helpers ────────────────────────────────────────────────────
// From API:
//   latestnotify: type="video", reacturl="/dinamalartv/31/VIDEO_ID", slug="/videos/..."
//   latestmain:   video="0"/"1", maincat="video", path may have youtube URL
//
// Detection: type==="video" OR maincat==="video" OR video==="1" OR slug includes /videos/
// For YouTube path: extract ID and embed inline via WebView
// For Dinamalar videos (no youtube path): show thumbnail + play → navigate VideoScreen

const isVideoItem = (item) => {
  const videoPath = item?.videopath || item?.y_path || item?.vidg_path || item?.video || item?.videourl || item?.path;
  return !!videoPath || item?.type === 'video' || item?.maincat === 'video';
};

const isPhotoItem = (item) => {
  return item?.maincat === 'photo' || item?.type === 'photo' || item?.categrorytitle === 'photo' || item?.catengtitle === 'photo';
};

const isSocialMediaCard = (item) => {
  // Check for social media indicators in multiple fields
  const maincat = (item?.maincat || '').toLowerCase();
  const type = (item?.type || '').toLowerCase();
  const categrorytitle = (item?.categrorytitle || '').toLowerCase();
  const catengtitle = (item?.catengtitle || '').toLowerCase();
  const title = (item?.newstitle || '').toLowerCase();

  // Debug logging
  console.log('Checking social media card for item:', {
    maincat, type, categrorytitle, catengtitle, title
  });

  // Check for various social media indicators
  const isSocial = maincat.includes('social') || type.includes('social') ||
    categrorytitle.includes('social') || catengtitle.includes('social') ||
    title.includes('social');

  const isCards = maincat.includes('card') || type.includes('card') ||
    categrorytitle.includes('card') || catengtitle.includes('card') ||
    title.includes('card');

  const result = isSocial || isCards;
  console.log('Social media card detection result:', result);
  return result;
};

// Extract YouTube ID from path field (latestmain only)
const getYouTubeId = (item) => {
  const path = item.path || '';
  if (!path) return null;
  const m =
    path.match(/[?&]v=([a-zA-Z0-9_-]{11})/) ||
    path.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/) ||
    path.match(/embed\/([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
};

// Extract Dinamalar video ID from reacturl "/dinamalartv/31/334619" → "334619"
const getDinaVideoId = (item) => {
  const url = item.reacturl || item.slug || '';
  const m = url.match(/\/(\d+)$/);
  return m ? m[1] : null;
};

// ─── Play Icon ──────────────────────────────────────────────────────────────────
const PlayIcon = ({ size = 52 }) => (
  <View style={[vtStyles.playCircle, { width: size, height: size, borderRadius: size / 2 }]}>
    <View style={[vtStyles.playTriangle, {
      borderTopWidth: size * 0.22,
      borderBottomWidth: size * 0.22,
      borderLeftWidth: size * 0.36,
      marginLeft: size * 0.07
    }]} />
  </View>
);

// ─── VideoThumbnailCard ───────────────────────────────────────────────
// Shows video thumbnail with play button overlay.
// Tapping: if YouTube path → embed inline via WebView; else → navigate to VideoScreen
const VideoThumbnailCard = ({ item, onPress }) => {
  const { sf } = useFontSize();
  const [imageError, setImageError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const newsRef = useRef([]);
  const thumbUrl = item.images || item.largeimages || item.thumbnail || '';
  const youtubeId = thumbUrl ? getYouTubeId(thumbUrl) : null;
  const duration = item.duration || '';

  // Fallback: use YouTube thumbnail if YouTube video, else Dinamalar default
  const fallbackUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` :
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';

  const finalThumbUrl = imageError ? fallbackUrl : (thumbUrl || fallbackUrl);

  // If YouTube and user tapped play → show embedded WebView player
  if (playing && youtubeId) {
    const html = `<!DOCTYPE html><html>
      <head><meta name="viewport" content="width=device-width,initial-scale=1">
      <style>*{margin:0;padding:0;background:#000}iframe{width:100%;height:100%;border:none}</style>
      </head><body>
      <iframe src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&playsinline=1&rel=0"
        allow="autoplay;encrypted-media" allowfullscreen></iframe>
      </body></html>`;
    return (
      <View style={vtStyles.container}>
        <WebView
          source={{ html }}
          style={{ flex: 1 }}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
        />
      </View>
    );
  }

  // Thumbnail + play overlay
  return (
    <TouchableOpacity
      style={vtStyles.container}
      activeOpacity={0.88}
      onPress={() => {
        if (youtubeId) {
          setPlaying(true);  // inline playback for YouTube
        } else {
          onPress && onPress(item);  // navigate for Dinamalar videos
        }
      }}
    >
      {imageError && !finalThumbUrl.includes('youtube.com') ? (
        <View style={[vtStyles.thumb, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }]}>
          <Image
            source={{ uri: 'https://stat.dinamalar.com/new/2025/images/dinamalar-pavala-vizha-logo-day.png' }}
            style={{ width: s(60), height: s(30), resizeMode: 'contain' }}
          />
        </View>
      ) : (
        <Image
          source={{ uri: finalThumbUrl }}
          style={vtStyles.thumb}
          resizeMode="contain"
          onError={() => setImageError(true)}
        />
      )}
      {/* Subtle dark overlay */}
      <View style={vtStyles.overlay} />
      {/* LatestVideoIcon in bottom-left corner */}
      <View style={vtStyles.videoIconOverlay}>
        <LatestVideoIcon size={s(24)} color={COLORS.white} />
      </View>
      {/* Duration badge bottom-right */}
      {!!duration && (
        <View style={vtStyles.durationBadge}>
          <Text style={[vtStyles.durationText, { fontSize: sf(12) }]}>{String(duration)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const vtStyles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  thumb: { width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
  playCircle: {
    position: 'absolute',
    top: s(6), left: s(6),  // Top-left corner
    width: s(48), height: s(48), borderRadius: s(24),
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
    borderLeftColor: '#fff',
  },
  durationBadge: {
    position: 'absolute', bottom: s(6), right: s(6),
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: s(3),
    paddingHorizontal: s(6), paddingVertical: s(2),
  },
  durationText: { fontSize: ms(10), color: '#fff', fontFamily: FONTS.muktaMalar.regular },
  videoIconOverlay: {
    position: 'absolute',
    top: s(6), left: s(6),  // Top-left corner
    width: s(28), height: s(28), borderRadius: s(16),
    backgroundColor: PALETTE.primary,  // Primary color background
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// ─── Navigation Route Map ─────────────────────────────────────────────
const LINK_ROUTE_MAP = [
  { match: ['dinamalartv', 'videodata'], screen: 'VideoScreen' },
  { match: ['podcast'], screen: 'PodcastScreen' },
  { match: ['ipaper'], screen: 'IpaperScreen' },
  { match: ['books'], screen: 'BooksScreen' },
  { match: ['subscription'], screen: 'SubscriptionScreen' },
  { match: ['thirukural', '/thirukural'], screen: 'ThirukkuralScreen' },
  { match: ['kadal'], screen: 'KadalThamaraiScreen' },
  { match: ['latestmain'], screen: 'TimelineScreen' },
  { match: ['cinema'], screen: 'CategoryNewsScreen' },
  { match: ['temple', 'kovilgal'], screen: 'CategoryNewsScreen' },
];

const resolveScreenFromLink = (link = '') => {
  if (!link) return null;
  const lower = link.toLowerCase();
  for (const { match, screen } of LINK_ROUTE_MAP) {
    if (match.some((k) => lower.includes(k))) {
      if (screen === 'CategoryNewsScreen') {
        const m = lower.match(/cat=(\d+)/);
        return { screen, params: m ? { catId: m[1] } : null };
      }
      return { screen, params: null };
    }
  }
  const m = lower.match(/cat=(\d+)/);
  if (m) return { screen: 'HomeScreen', params: { catId: m[1] } };
  if (link.startsWith('http://') || link.startsWith('https://') || link.startsWith('www.'))
    return { screen: '__external__', params: null };
  return null;
};

// ─── HTML config ──────────────────────────────────────────────────────
const htmlConfig = {
  baseStyle: { fontSize: scaledSizes.font.sm, color: COLORS.text, lineHeight: scaledSizes.lineHeight.md },
  tagsStyles: {
    p: { margin: 0, marginBottom: vs(4), fontSize: scaledSizes.font.sm, color: COLORS.text, lineHeight: scaledSizes.lineHeight.md },
    strong: { fontWeight: '700', color: COLORS.text },
    b: { fontWeight: '700', color: COLORS.text },
    a: { color: COLORS.primary, textDecorationLine: 'underline' },
    br: { margin: 0 },
  },
  ignoredTags: ['script', 'style'],
  enableUserAgentStyles: false,
  enableExperimentalMarginCollapsing: true,
};

// ─── Pulse animation helper ───────────────────────────────────────────
function usePulse(min = 0.5, max = 1, duration = 800) {
  const anim = useRef(new Animated.Value(max)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: min, duration, useNativeDriver: true }),
      Animated.timing(anim, { toValue: max, duration, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);
  return anim;
}

// ─── Section Header ───────────────────────────────────────────────────
function SectionHeader({ title }) {
  const { sf } = useFontSize();
  return (
    <View style={shStyles.wrap}>
      <Text style={[shStyles.title, { fontSize: sf(16) }]}>{String(title || '')}</Text>
      <View style={shStyles.underline} />
    </View>
  );
}
const shStyles = StyleSheet.create({
  wrap: {
    backgroundColor: PALETTE.white,
    paddingHorizontal: s(14),
    paddingTop: vs(16),
    paddingBottom: vs(12),
  },
  title: {
    fontFamily: FONTS.anek.bold,
    fontSize: ms(18),
    color: PALETTE.grey800,
    marginBottom: vs(2),
  },
  underline: {
    height: vs(4),
    width: s(60),
    backgroundColor: PALETTE.primary,
    // borderRadius: s(2),
  },
});

// Video items (type="video"): show VideoThumbnailCard, tap → VideoScreen
// News items: show padded image with rounded corners
function NotificationCard({ item, onPress, navigation }) {
  const [imageError, setImageError] = useState(false);
  const isVid = isVideoItem(item);
  const category = item.categrorytitle || item.catengtitle || item.maincat || '';
  const ago = item.ago || item.time_ago || '';
  const comment = item.newscomment || '';
  const hasComment = !!comment && String(comment) !== '0';
  const hasAudio = item.audio === 1 || item.audio === '1' ||
    (typeof item.audio === 'string' && item.audio.length > 1 && item.audio !== '0');

  // Category navigation function
  const handleCategoryPress = (category) => {
    console.log('Category pill pressed:', category);
    console.log('Category length:', category.length);
    console.log('Category char codes:', Array.from(category).map(c => c.charCodeAt(0)));
    const normalizedCategory = category.toLowerCase().trim();
    console.log('Normalized category:', normalizedCategory);
    console.log('Normalized length:', normalizedCategory.length);
    console.log('Normalized char codes:', Array.from(normalizedCategory).map(c => c.charCodeAt(0)));
    
    // Video categories - match exact API categories
    if (
      normalizedCategory === 'live' ||
      normalizedCategory === '5050' ||
      normalizedCategory === 'live and recorded'
    ) {
      navigation.navigate('VideosScreen', { 
        initialCategory: '5050',
        initialTabTitle: 'Live'
      });
    }
    else if (
      normalizedCategory === 'political' ||
      normalizedCategory === '31' ||
      normalizedCategory === 'politics tamil videos' ||
      normalizedCategory === 'அரசியல்' ||
      normalizedCategory === 'அரசியல் செய்திகள்'
    ) {
      navigation.navigate('VideosScreen', { 
        initialCategory: '31',
        initialTabTitle: 'Politics'
      });
    }
    else if (
      normalizedCategory === 'general' ||
      normalizedCategory === '32' ||
      normalizedCategory === 'general tamil videos' ||
      normalizedCategory === 'common' ||
      normalizedCategory === 'pothu' ||
      normalizedCategory === 'poguthu' ||
      normalizedCategory === 'பொது'
    ) {
      navigation.navigate('VideosScreen', { 
        initialCategory: '32',
        initialTabTitle: 'General'
      });
    }
    else if (
      normalizedCategory === 'event' ||
      normalizedCategory === '33' ||
      normalizedCategory === 'sambavam event videos' ||
      normalizedCategory === 'sambavam' ||
      normalizedCategory === 'சம்பவம்'
    ) {
      navigation.navigate('VideosScreen', { 
        initialCategory: '33',
        initialTabTitle: 'Event'
      });
    }
    else if (
      normalizedCategory === 'cinema' ||
      normalizedCategory === '435' ||
      normalizedCategory === 'tamil cinema videos' ||
      normalizedCategory === 'Cinema' ||
      normalizedCategory === 'சினிமா'
    ) {
      navigation.navigate('VideosScreen', { 
        initialCategory: '435',
        initialTabTitle: 'Cinema'
      });
    }
    else if (
      normalizedCategory === 'trailer' ||
      normalizedCategory === '436' ||
      normalizedCategory === 'tamil cinema movie trailer' ||
      normalizedCategory === 'டிரைலர்'
    ) {
      navigation.navigate('VideosScreen', { 
        initialCategory: '436',
        initialTabTitle: 'Trailer'
      });
    }
    
   else if (
       normalizedCategory === '594' ||
       normalizedCategory ==='செய்திச்சுருக்கம்'
    ) {
      console.log('Short news category matched!');
      navigation.navigate('VideosScreen', { 
        initialCategory: '594',
        initialTabTitle: 'Short News'
      });
    }
    else if (
      normalizedCategory === 'sports' ||
      normalizedCategory === '464' ||
      normalizedCategory === 'sports tamil videos' ||
      normalizedCategory === 'விளையாட்டு'
    ) {
      navigation.navigate('VideosScreen', { 
        initialCategory: '464',
        initialTabTitle: 'Sports'
      });
    }
    else if (
      normalizedCategory === 'exclusive videos' ||
      normalizedCategory === '1238' ||
      normalizedCategory === 'exclusive tamil videos' ||
      normalizedCategory === 'exclusive' ||
      normalizedCategory === 'சிறப்பு தொகுப்புகள்'
    ) {
      navigation.navigate('VideosScreen', { 
        initialCategory: '1238',
        initialTabTitle: 'Exclusive Videos'
      });
    }
    else if (
      normalizedCategory === 'spiritual video' ||
      normalizedCategory === '1316' ||
      normalizedCategory === 'anmegam videos in tamil' ||
      normalizedCategory === 'spiritual' ||
      normalizedCategory === 'ஆன்மீகம்'
    ) {
      navigation.navigate('VideosScreen', { 
        initialCategory: '1316',
        initialTabTitle: 'Spiritual'
      });
    }
    else if (
      normalizedCategory === 'district news' ||
      normalizedCategory === '1585' ||
      normalizedCategory === 'district news videos' ||
      normalizedCategory === 'மாவட்ட செய்திகள்'
    ) {
      navigation.navigate('VideosScreen', { 
        initialCategory: '1585',
        initialTabTitle: 'District News'
      });
    }
    else if (
      normalizedCategory === 'shorts' ||
      normalizedCategory === 'shorts' ||
      normalizedCategory === 'shorts reels' ||
      normalizedCategory === 'ஷார்ட்ஸ்'
    ) {
      navigation.navigate('VideosScreen', { 
        initialCategory: 'shorts',
        initialTabTitle: 'Shorts'
      });
    }
    // Tharpothaiya Seithigal categories - check after all video categories
    else if (normalizedCategory === 'tamilagam' || normalizedCategory === 'tamil nadu') {
      navigation.navigate('TharpothaiyaSeithigalScreen', {
        tabId: 'tamilagam',
        initialTabTitle: 'தமிழகம்'
      });
    } else if (normalizedCategory === 'india') {
      navigation.navigate('TharpothaiyaSeithigalScreen', {
        tabId: 'india',
        initialTabTitle: 'இந்தியா'
      });
    } else if (normalizedCategory === 'world') {
      navigation.navigate('TharpothaiyaSeithigalScreen', {
        tabId: 'world',
        initialTabTitle: 'உலகம்'
      });
    } else if (normalizedCategory === 'premium') {
      navigation.navigate('TharpothaiyaSeithigalScreen', {
        tabId: 'premium',
        initialTabTitle: 'பிரீமியம்'
      });
    } else if (normalizedCategory === 'sports') {
      navigation.navigate('TharpothaiyaSeithigalScreen', {
        tabId: 'sports',
        initialTabTitle: 'விளையாட்டு'
      });
    } else if (normalizedCategory === 'cinema') {
      navigation.navigate('TharpothaiyaSeithigalScreen', {
        tabId: 'cinema',
        initialTabTitle: 'சினிமா'
      });
    } else if (normalizedCategory === 'business' || normalizedCategory === 'varthagam') {
      navigation.navigate('TharpothaiyaSeithigalScreen', {
        tabId: 'business',
        initialTabTitle: 'வணிகம்'
      });
    } else {
      console.log('Category not matched:', category);
    }
  };

  const imageUrl =
    (item.images && item.images.trim() !== '') ? item.images :
      (item.largeimages && item.largeimages.trim() !== '') ? item.largeimages :
        (item.image && item.image.trim() !== '') ? item.image :
          (item.thumbnail && item.thumbnail.trim() !== '') ? item.thumbnail :
            (item.thumb && item.thumb.trim() !== '') ? item.thumb :
              (item.photo && item.photo.trim() !== '') ? item.photo :
                'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';

  return (
    <View style={ncStyles.wrap}>

      {/* ── Media area ── */}
      {isVid ? (
        // Video: full VideoThumbnailCard inside padded rounded container
        <View style={ncStyles.imageWrap}>
          <VideoThumbnailCard item={item} onPress={onPress} />
        </View>
      ) : (
        // News: tappable padded image
        <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.88}>
          <View style={ncStyles.imageWrap}>
            {imageError ? (
              <View style={[ncStyles.image, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }]}>
                <Image
                  source={{ uri: 'https://stat.dinamalar.com/new/2025/images/dinamalar-pavala-vizha-logo-day.png' }}
                  style={{ width: s(60), height: s(30), resizeMode: 'contain' }}
                />
              </View>
            ) : (
              <>
                <Image
                  source={{ uri: imageUrl }}
                  style={ncStyles.image}
                  resizeMode="cover"
                  onError={() => setImageError(true)}
                />
                {/* Document icon in top-left corner for news items */}
                <View style={ncStyles.documentIconOverlay}>
                  <DocumentIcon size={s(18)} color={COLORS.white} />
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      )}

      {/* ── Text content (always tappable → article/video screen) ── */}
      <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.88}>
        <View style={ncStyles.contentContainer}>
          <Text style={[ncStyles.title, { fontSize: sf(16), lineHeight: sf(26) }]}  >
            {String(item.newstitle || '')}
          </Text>
          {!!category && (
            <TouchableOpacity 
              style={ncStyles.catPill}
              onPress={(e) => {
                e?.stopPropagation?.();
                console.log('Category pill TouchableOpacity pressed');
                handleCategoryPress(category);
              }}
              activeOpacity={0.7}
            >
              <Text style={[ncStyles.catText, { fontSize: sf(12) }]}>{String(category)}</Text>
            </TouchableOpacity>
          )}
          <View style={ncStyles.metaRow}>
            <Text style={[ncStyles.timeText, { fontSize: sf(12) }]}>{String(ago)}</Text>
            <View style={ncStyles.metaRight}>
              {hasComment && (
                <View style={ncStyles.commentRow}>
                  <Ionicons name="chatbox" size={sf(14)} color={PALETTE.grey700} />
                  <Text style={[ncStyles.commentText, { fontSize: sf(12) }]}> {String(comment)}</Text>
                </View>
              )}
              {hasAudio && (
                <SpeakerIcon size={sf(14)} color={PALETTE.grey700} />
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <View style={ncStyles.divider} />
    </View>
  );
}

const ncStyles = StyleSheet.create({
  wrap: { width: '100%', backgroundColor: PALETTE.white },
  imageWrap: {
    marginHorizontal: s(12),
    marginTop: vs(8),
    // borderRadius: s(6),
    overflow: 'hidden',
    backgroundColor: PALETTE.grey200,
  },
  image: { width: '100%', aspectRatio: 16 / 9 },
  contentContainer: { paddingHorizontal: s(12), paddingTop: vs(10), paddingBottom: vs(14) },
  title: {
    fontFamily: FONTS.muktaMalar.bold,
    // fontSize: ms(15),
    color: PALETTE.grey800,
    lineHeight: ms(23),
    marginBottom: vs(8),
  },
  catPill: {
    alignSelf: 'flex-start',
    // backgroundColor: PALETTE.grey200,
    borderWidth: 1,
    borderColor: PALETTE.grey400,
    // borderRadius: s(4),
    paddingHorizontal: s(10),
    paddingVertical: s(3),
    marginBottom: vs(10),
  },
  catText: { fontFamily: FONTS.muktaMalar.bold, color: PALETTE.grey700 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timeText: { fontFamily: FONTS.muktaMalar.regular, color: PALETTE.black },
  metaRight: { flexDirection: 'row', alignItems: 'center', gap: s(8) },
  commentRow: { flexDirection: 'row', alignItems: 'center' },
  commentText: { fontFamily: FONTS.muktaMalar.regular, color: PALETTE.grey700 },
  divider: { height: vs(6), backgroundColor: PALETTE.grey200 },
  documentIconOverlay: {
    position: 'absolute',
    top: s(6), left: s(6),  // Top-left corner
    width: s(28), height: s(28), borderRadius: s(14),
    backgroundColor: PALETTE.primary,  // Primary color background
    justifyContent: 'center',
    alignItems: 'center',
  },
});



const LEFT_W = s(80);
const LINE_LEFT = LEFT_W / 2;  // line runs through CENTER of left col

function TimelineItem({ item, isLast, onPress, navigation, resolvePhotoTab }) {
  const [imgLoad, setImgLoad] = useState(true);
  const [imgErr, setImgErr] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [titleHovered, setTitleHovered] = useState(false);

  if (!item) return null;

  const cat = getCat(item.maincat);

  const imageUrl =
    (item.images && item.images.trim() !== '') ? item.images :
      (item.largeimages && item.largeimages.trim() !== '') ? item.largeimages :
        (item.image && item.image.trim() !== '') ? item.image :
          (item.thumbnail && item.thumbnail.trim() !== '') ? item.thumbnail :
            (item.thumb && item.thumb.trim() !== '') ? item.thumb :
              (item.photo && item.photo.trim() !== '') ? item.photo : null;

  const hasImage = !!imageUrl;
  const isVideo = isVideoItem(item);
  const hasAudio = !!item.audio && String(item.audio) !== '0';
  const hasComment = !!item.newscomment && String(item.newscomment) !== '0';
  const isPodcast = item.maincat === 'podcast' || hasAudio;

  // Debug logging for podcast detection
  if (isPodcast) {
    console.log('Podcast detected:', {
      title: item.newstitle,
      maincat: item.maincat,
      audio: item.audio,
      hasAudio,
      isPodcast
    });
  }

  const categoryLabel = item.categrorytitle || item.catengtitle || cat.label || 'செய்தி';
  const agoLabel = String(item.ago || item.time_ago || '');

  // Icon badge size — sits ON the line
  const ICON_SIZE = s(28);
  const ICON_RADIUS = ICON_SIZE / 2;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onPress(item)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[tlStyles.outerRow, pressed && { backgroundColor: '#F5F8FF' }]}
    >
      {/* ════ LEFT COLUMN ════
          Vertical line centered through column.
          Date + time above. Circular icon badge ON the line. */}
      <View style={tlStyles.leftCol}>

        {/* Vertical grey line — absolute, centered (left = LINE_LEFT - 0.5) */}
        <View style={tlStyles.vertLine} />

        {/* Date text */}
        <View style={{ right: 30 }}>
          {!!item.standarddate && (
            <Text style={[tlStyles.dateText, { fontSize: sf(12) }]} numberOfLines={2}>
              {String(item.standarddate)}
            </Text>
          )}

          {/* Time text */}
          {!!item.time && (
            <Text style={[tlStyles.timeText, { fontSize: sf(12) }]} numberOfLines={1}>
              {String(item.time)}
            </Text>
          )}
        </View>


        {/* Category icon badge — circular, sits ON the centered line */}
        <View style={[tlStyles.iconBadge, {
          width: ICON_SIZE, height: ICON_SIZE, borderRadius: ICON_RADIUS,
          borderColor: COLORS.grey500,
          backgroundColor: PALETTE.white,
        }]}>
          {cat.icon({ size: s(14), color: COLORS.primary })}
        </View>

      </View>

      {/* ════ RIGHT COLUMN ════ */}
      <View style={tlStyles.rightCol}>

        {/* 1. Title */}
        <TouchableOpacity
          onPress={() => onPress(item)}
          onPressIn={() => setTitleHovered(true)}
          onPressOut={() => setTitleHovered(false)}
          activeOpacity={1}
          style={{ alignSelf: 'flex-start' }}
        >
          <Text style={[
            tlStyles.title,
            {
              fontSize: sf(16),
              lineHeight: sf(22),
              color: titleHovered ? PALETTE.primary : PALETTE.grey800
            }
          ]} numberOfLines={4}>
            {String(item.newstitle || '')}
            {isPodcast && (
              <View style={tlStyles.podcastRow}>
                <Ionicons name="volume-medium" size={sf(13)} color={titleHovered ? PALETTE.primary : PALETTE.grey500} />
                {/* <Text style={tlStyles.podcastText}> பாட்காஸ்ட்</Text> */}
              </View>
            )}
          </Text>
        </TouchableOpacity>

        {/* 1b. Podcast/audio icon inline after title */}


        {/* 2. Image */}
        {hasImage ? (
          <TouchableOpacity
            style={tlStyles.imgWrap}
            onPress={() => {
              const tab = resolvePhotoTab(item);
              navigation.navigate('CommonSectionScreen', {
                screenTitle: tab.screenTitle,
                apiEndpoint: 'https://api-st.dinamalar.com/photodata',
                allTabLink: 'https://api-st.dinamalar.com/photodata',
                useFullUrl: true,
                // ── Pass the specific item to open ──
                selectedNewsId: item.newsid || item.id,
                selectedNewsItem: item,          // full item for immediate render
                ...(tab.initialTabId && {
                  initialTabId: tab.initialTabId,
                  initialTabLink: tab.initialTabLink,
                  initialTabTitle: tab.initialTabTitle,
                }),
              });
            }}
            activeOpacity={0.8}
          >
            {(imgLoad || imgErr) && <View style={tlStyles.imgSkeleton} />}
            <Image
              source={{ uri: imageUrl }}
              style={[tlStyles.img, (imgLoad || imgErr) && { opacity: 0, position: 'absolute' }]}
              resizeMode="contain"
              onLoad={() => { setImgLoad(false); setImgErr(false); }}
              onError={() => { setImgLoad(false); setImgErr(true); }}
            />
          </TouchableOpacity>
        ) : null}

        {/* 3. Meta row */}
        <View style={tlStyles.metaRow}>
          {/* <Text style={tlStyles.metaText} numberOfLines={1}>
            {categoryLabel}{agoLabel ? ' · ' + agoLabel : ''}
          </Text> */}
          <View style={{ flex: 1 }} />
          {hasComment && (
            <View style={tlStyles.commentWrap}>
              <Ionicons name="chatbox-outline" size={sf(11)} color={PALETTE.grey500} />
              <Text style={[tlStyles.commentText, { fontSize: sf(12) }]}>{String(item.newscomment)}</Text>
            </View>
          )}
          {/* {hasAudio && (
            <Ionicons name="volume-medium" size={s(13)} color={PALETTE.grey500} style={{ marginLeft: s(4) }} />
          )} */}
        </View>

      </View>
    </TouchableOpacity>
  );
}

const tlStyles = StyleSheet.create({
  outerRow: {
    flexDirection: 'row',
    backgroundColor: PALETTE.white,
    minHeight: vs(60),
  },

  // Left col — line runs through center, icon badge centered on line
  leftCol: {
    width: LEFT_W,
    position: 'relative',
    alignItems: 'center',
    paddingTop: vs(10),
    paddingBottom: vs(10),
    left: 20
  },

  // Vertical line — centered in column
  vertLine: {
    position: 'absolute',
    left: LINE_LEFT - 0.5,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: PALETTE.grey300,
    zIndex: 0,
  },

  dateText: {
    // fontSize: ms(10),
    color: PALETTE.grey600,
    lineHeight: ms(13),
    textAlign: 'center',
    marginBottom: vs(1),
    fontFamily: FONTS.muktaMalar.regular,
    zIndex: 1,
    paddingHorizontal: s(2),
  },

  timeText: {
    // fontSize: ms(9),
    color: PALETTE.grey500,
    textAlign: 'center',
    marginBottom: vs(5),
    fontFamily: FONTS.muktaMalar.regular,
    zIndex: 1,
  },

  // Circular icon badge — sits ON the centered vertical line
  iconBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    zIndex: 2,
    elevation: 1,
    // shadow so it pops over the line
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },

  // Right column
  rightCol: {
    flex: 1,
    paddingLeft: s(8),
    paddingRight: s(12),
    paddingTop: vs(10),
    paddingBottom: vs(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PALETTE.grey200,
  },

  title: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(13),
    fontWeight: '700',
    color: PALETTE.grey800,
    lineHeight: ms(20),
    marginBottom: vs(4),
  },

  // Podcast label inline below title
  podcastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginBottom: vs(6),
  },
  podcastText: {
    fontSize: ms(10),
    color: PALETTE.grey500,
    fontFamily: FONTS.muktaMalar.regular,
  },

  // Image
  imgWrap: {
    width: '100%',

    backgroundColor: PALETTE.grey200,
    // borderRadius: s(3),
    overflow: 'hidden',
    marginBottom: vs(6),
    height: ms(280)
  },
  imgSkeleton: { ...StyleSheet.absoluteFillObject, backgroundColor: '#E0E4EA' },
  img: { width: '100%', height: '100%' },

  // Meta row
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: {
    fontSize: ms(10),
    color: PALETTE.grey600,
    flexShrink: 1,
    fontFamily: FONTS.muktaMalar.regular,
  },
  commentWrap: { flexDirection: 'row', alignItems: 'center', marginLeft: s(6) },
  commentText: { fontSize: ms(10), color: PALETTE.grey500, marginLeft: s(2) },
  audioIcon: { fontSize: ms(11), color: PALETTE.grey500, marginLeft: s(6) },
});

// ─── Date Separator ───────────────────────────────────────────────────
// Screenshot: left col shows a short grey line segment; right side has blue pill
// with calendar icon + date text.
function DateSeparator({ date }) {
  if (!date) return null;
  return (
    <View style={dsStyles.wrap}>
      {/* Left col: just the vertical line segment */}
      {/* <View style={dsStyles.leftCol}>
        <View style={dsStyles.lineSegment} />
      </View> */}
      {/* Blue pill with calendar icon + date */}
      {/* <View style={dsStyles.pill}>
        <Ionicons name="calendar-outline" size={s(13)} color={PALETTE.white} />
        <Text style={dsStyles.pillText}>{' '}{String(date)}</Text>
      </View> */}
    </View>
  );
}
const dsStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.white,
    paddingVertical: vs(8),
  },
  leftCol: {
    width: LEFT_W,
    alignItems: 'center',   // centered like tlStyles.leftCol
  },
  lineSegment: {
    width: 1,
    height: vs(16),
    backgroundColor: PALETTE.grey300,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: s(14),
    paddingVertical: vs(6),
    borderRadius: s(20),
  },
  pillText: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(12),
    color: PALETTE.white,
    fontWeight: '700',
    marginLeft: s(4),
  },
});

// ─── Skeletons ────────────────────────────────────────────────────────
function NotifSkeleton() {
  const pulse = usePulse();
  return (
    <Animated.View style={{ backgroundColor: PALETTE.white, opacity: pulse }}>
      {/* Padded + rounded image skeleton */}
      <View style={{ marginHorizontal: s(12), marginTop: vs(8), borderRadius: s(6), overflow: 'hidden', aspectRatio: 16 / 9, backgroundColor: PALETTE.grey200 }} />
      <View style={{ paddingHorizontal: s(12), paddingTop: vs(10), paddingBottom: vs(14) }}>
        <View style={{ height: vs(14), backgroundColor: PALETTE.grey200, borderRadius: s(4), marginBottom: vs(8), width: '92%' }} />
        <View style={{ height: vs(14), backgroundColor: PALETTE.grey200, borderRadius: s(4), marginBottom: vs(8), width: '70%' }} />
        <View style={{ height: vs(22), backgroundColor: PALETTE.grey200, borderRadius: s(4), marginBottom: vs(10), width: s(70), alignSelf: 'flex-start' }} />
        <View style={{ height: vs(10), backgroundColor: PALETTE.grey200, borderRadius: s(4), width: '30%' }} />
      </View>
      <View style={{ height: vs(6), backgroundColor: PALETTE.grey200 }} />
    </Animated.View>
  );
}

function TimelineSkeleton() {
  const pulse = usePulse();
  return (
    <Animated.View style={{ flexDirection: 'row', backgroundColor: PALETTE.white, minHeight: vs(70), opacity: pulse }}>
      {/* Left col — centered line + icon badge placeholder */}
      <View style={{ width: LEFT_W, position: 'relative', alignItems: 'center', paddingTop: vs(10) }}>
        <View style={{ position: 'absolute', left: LINE_LEFT - 0.5, top: 0, bottom: 0, width: 1, backgroundColor: PALETTE.grey300 }} />
        <View style={{ width: s(46), height: vs(8), backgroundColor: PALETTE.grey300, borderRadius: 3, marginBottom: vs(3) }} />
        <View style={{ width: s(32), height: vs(8), backgroundColor: PALETTE.grey300, borderRadius: 3, marginBottom: vs(5) }} />
        <View style={{ width: s(28), height: s(28), borderRadius: s(14), backgroundColor: PALETTE.grey300, borderWidth: 1.5, borderColor: PALETTE.grey400 }} />
      </View>
      {/* Right col */}
      <View style={{ flex: 1, paddingLeft: s(8), paddingRight: s(12), paddingTop: vs(10), paddingBottom: vs(12) }}>
        {[90, 70, 50].map((w, i) => (
          <View key={i} style={{ width: `${w}%`, height: vs(12), backgroundColor: PALETTE.grey300, borderRadius: s(3), marginBottom: vs(6) }} />
        ))}
        <View style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: PALETTE.grey300, borderRadius: s(3), marginBottom: vs(6) }} />
        <View style={{ width: s(100), height: vs(9), backgroundColor: PALETTE.grey300, borderRadius: s(3) }} />
      </View>
    </Animated.View>
  );
}

// ─── Load More Button Component ───────────────────────────────────────────
function LoadMoreButton({ onPress, loading }) {
  return (
    <View style={loadMoreStyles.container}>
      <TouchableOpacity
        style={loadMoreStyles.button}
        onPress={onPress}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <>
            <Text style={loadMoreStyles.buttonText}>மேலும் பார்க்க</Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.white} style={loadMoreStyles.icon} />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const loadMoreStyles = StyleSheet.create({
  container: {
    paddingHorizontal: s(16),
    paddingVertical: vs(20),
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: s(20),
    paddingVertical: vs(12),
    borderRadius: s(8),
    minWidth: s(120),
    justifyContent: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: ms(14),
    fontFamily: FONTS.muktaMalar.bold,
    marginRight: s(8),
  },
  icon: {
    marginLeft: s(4),
  },
});

export default function TimelineScreen() {
  const { sf } = useFontSize();
  const navigation = useNavigation();

  const [notifications, setNotifications] = useState([]);
  const [notifTitle, setNotifTitle] = useState('');
  const [latestTitle, setLatestTitle] = useState('டைம்லைன் செய்திகள்');
  const [news, setNews] = useState([]);
  const [mostCommented, setMostCommented] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isLocationDrawerVisible, setIsLocationDrawerVisible] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('உள்ளூர்');
  const flatListRef = useRef(null);

  // Real-time notification state
  const [notifBadgeCount, setNotifBadgeCount] = useState(0);
  const [currentNotification, setCurrentNotification] = useState(null);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  // Auto-refresh and notification polling timers
  const refreshIntervalRef = useRef(null);
  const notificationIntervalRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  // Ensure component re-renders when font size changes
  useEffect(() => {
    // Force re-render when font size context changes
    const forceUpdate = Math.random(); // Simple trigger for re-render
    console.log('TimelineScreen font size updated:', sf(16));
  }, [sf]); // Dependency on sf function

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const startAutoRefresh = () => {
      // Clear existing interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }

      // Set new interval for auto-refresh every 2 minutes (120000 ms)
      refreshIntervalRef.current = setInterval(() => {
        console.log('Auto-refreshing TimelineScreen...');
        fetchAll(1, true); // Refresh with isRefresh=true
      }, 120000);
    };

    startAutoRefresh();

    // Handle app state changes (foreground/background)
    const handleAppStateChange = (nextAppState) => {
      console.log('App state changed:', nextAppState);

      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - refresh immediately
        console.log('App came to foreground - refreshing timeline...');
        fetchAll(1, true);
      }

      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      subscription?.remove();
    };
  }, [fetchAll]);

  // Initialize notification service on component mount
  // useEffect(() => {
  //   initializeNotificationService();
  //   loadInitialBadgeCount();
  //   initializePushNotifications(); // Now safe - uses compatibility service
  // }, []);

  // Load initial badge count
  const loadInitialBadgeCount = async () => {
    try {
      const count = await getBadgeCount();
      setNotifBadgeCount(count);
    } catch (error) {
      console.error('Error loading badge count:', error);
    }
  };

  const handleMenuPress = (menuItem) => {
    const link = menuItem?.Link || menuItem?.link || '';
    const title = menuItem?.Title || menuItem?.title || '';
    const resolved = resolveScreenFromLink(link);
    if (!resolved) return;
    if (resolved.screen === '__external__') { Linking.openURL(link); return; }
    const params = resolved.params ? { catName: title, ...resolved.params } : { catName: title };
    navigation?.navigate(resolved.screen, params);
  };

  const goToSearch = () => navigation?.navigate('SearchScreen');
  const goToNotifs = () => navigation?.navigate('NotificationScreen');
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

  // Handle notification popup close
  const handleNotificationPopupClose = () => {
    setShowNotificationPopup(false);
    setCurrentNotification(null);
  };

  // Handle notification press
  const handleNotificationPress = (notification) => {
    handleNotificationPopupClose();

    // Navigate to appropriate screen based on notification type
    if (notification.link) {
      goToArticle(notification);
    }
  };

  // Handle notification center
  const handleNotificationCenterPress = () => {
    setShowNotificationCenter(true);
  };

  const handleNotificationCenterClose = () => {
    setShowNotificationCenter(false);
  };

  const handleNotificationCenterRefresh = async () => {
    try {
      const result = await pollRealTimeNotifications();
      const newCount = await getBadgeCount();
      setNotifBadgeCount(newCount);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  };

  // Test function for manual push notification testing
  const testPushNotification = async () => {
    try {
      console.log('Testing push notification...');

      // Create a test notification payload
      const testPayload = {
        title: 'Test Flash News',
        body: 'This is a test notification from Dinamalar!',
        data: {
          type: 'flash',
          test: true,
          newsId: 'test-123',
          link: '/news/test-123'
        },
        priority: 'high',
        channelId: 'flash-news',
        sound: 'default',
      };

      // Send the test notification
      const result = await sendPushNotifications(['*'], testPayload);
      console.log('Test notification result:', result);

      // Also show the popup for immediate visual feedback
      setCurrentNotification({
        id: 'test-123',
        title: 'Test Flash News',
        category: 'flash',
        priority: 'high',
        time: 'Just now',
        link: '/news/test-123'
      });
      setShowNotificationPopup(true);

    } catch (error) {
      console.error('Test notification failed:', error);
    }
  };

  // ── EXACT same fetchAll as your original working code ──
  const fetchAll = useCallback(async (pageNum = 1, isRefresh = false) => {
    try {
      // ... (rest of the code remains the same)
      if (pageNum === 1) {
        isRefresh ? setRefreshing(true) : setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Add cache-busting timestamp to ensure fresh data
      const cacheBuster = Date.now();
      const requests = [
        CDNApi.get('/latestmain', {
          params: {
            page: pageNum,
            _t: cacheBuster, // Cache-busting parameter
            _refresh: isRefresh ? 1 : 0 // Additional refresh indicator
          }
        })
      ];
      if (pageNum === 1) requests.push(
        CDNApi.get('/latestnotify', { params: { _t: cacheBuster, _refresh: isRefresh ? 1 : 0 } }),
        CDNApi.get('/mostcommented', { params: { _t: cacheBuster, _refresh: isRefresh ? 1 : 0 } })
      );

      console.log('=== Timeline API Attempt ===');
      console.log('Trying CDNApi:', `${API_BASE_URLS.CDN}/latestmain?page=${pageNum}`);

      let results;
      try {
        results = await Promise.allSettled(requests);
      } catch (error) {
        console.log('❌ Network Error during API calls:', error);
        results = [{ status: 'rejected', reason: error }];
      }

      // If CDNApi fails, show error details
      if (results[0].status === 'rejected') {
        console.log('❌ CDNApi failed');
        console.log('Error Details:', results[0].reason);
      } else {
        console.log('✅ CDNApi SUCCESS');
      }

      // mainData.detail — the news items are in the detail array
      const mainData = results[0].status === 'fulfilled' ? results[0].value.data : null;
      const mainItems = (mainData?.detail || []).filter(item => item != null);

      console.log('=== Timeline Data Flow Debug ===');
      console.log('API Result Status:', results[0].status);
      console.log('Main Data:', mainData);
      console.log('Main Data Keys:', mainData ? Object.keys(mainData) : 'No data');
      console.log('Detail Array:', mainData?.detail);
      console.log('Detail Array Length:', mainData?.detail?.length || 0);
      console.log('Filtered Main Items Count:', mainItems.length);
      console.log('Sample Main Item:', mainItems[0]);
      console.log('Current News State Length:', news.length);
      console.log('Page Number:', pageNum);

      if (mainItems.length > 0) {
        console.log('Setting news state with', mainItems.length, 'items');
        setNews(prev => pageNum === 1 ? mainItems : [...prev, ...mainItems]);
        setPage(pageNum);

        // Use pagination info from API response
        const pagination = mainData?.pagination;
        if (pagination) {
          setHasMore(pagination.current_page < pagination.last_page);
          console.log('Pagination info:', pagination);
        } else {
          // Fallback to item count if pagination not available
          setHasMore(mainItems.length >= 10);
        }

        console.log('News state updated for page', pageNum);
      } else {
        console.log('No items found, setting empty news array');
        if (pageNum === 1) setNews([]);
        setHasMore(false);
      }

      console.log('=== End of fetchAll ===');

      if (pageNum === 1) {
        if (results[1]?.status === 'fulfilled') {
          const notifData = results[1].value.data;
          const notifItems = (notifData?.newlist?.data || []).filter(item => item != null);
          setNotifTitle(notifData?.breadcrumb?.[0]?.title || '');
          setNotifications(notifItems);
        } else {
          setNotifications([]);
          setNotifTitle('');
        }

        // Handle most commented data (results[2])
        if (results[2]?.status === 'fulfilled') {
          const mostCommentedData = results[2].value.data;
          const mostCommentedItems = (mostCommentedData?.data || []).filter(item => item != null);
          console.log('Most commented items:', mostCommentedItems.length);
          setMostCommented(mostCommentedItems);
        } else {
          setMostCommented([]);
        }
      }
    } catch (err) {
      console.error('Timeline fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchAll(1); }, [fetchAll]);

  const onRefresh = () => { setHasMore(true); fetchAll(1, true); };
  const onEndReached = () => { if (!loadingMore && hasMore && !loading) fetchAll(page + 1); };

  // ─── resolvePhotoTab — matches exact tab IDs from /photodata API ─────────────
  // Tabs: All | இன்றைய போட்டோ (81) | புகைப்பட ஆல்பம் (5001) | கார்ட்டூன்ஸ் (5002)
  //       NRI ஆல்பம் (5003) | கார்ட்ஸ் (socialcards) | வெப் ஸ்டோரீஸ் (webstoriesupdate)

  const resolvePhotoTab = (item) => {
    const maincat = (item?.maincat || '').toLowerCase();
    const type = (item?.type || '').toLowerCase();
    const catEng = (item?.catengtitle || '').toLowerCase();
    const catTitle = (item?.categrorytitle || '').toLowerCase();
    const catSlug = (item?.catslug || '').toLowerCase();
    const catId = String(item?.maincatid || item?.catid || '');
    const reacturl = (item?.reacturl || '').toLowerCase();
    const slug = (item?.slug || '').toLowerCase();

    // Combine all string fields for keyword matching
    const all = `${maincat} ${type} ${catEng} ${catTitle} ${catSlug} ${reacturl} ${slug}`;

    // ── கார்ட்ஸ் / Social Media Cards (id: "socialcards", link: /getsocialmedia) ──
    if (
      catId === 'socialcards' ||
      all.includes('social') ||
      all.includes('socialcard') ||
      all.includes('social-media-card') ||
      all.includes('getsocialmedia')
    )
      return {
        screenTitle: 'கார்ட்ஸ்',
        initialTabId: 'socialcards',
        initialTabLink: '/getsocialmedia',
        initialTabTitle: 'கார்ட்ஸ்',
      };

    // ── வெப் ஸ்டோரீஸ் (id: "webstoriesupdate", link: /webstoriesupdate) ──
    if (
      catId === 'webstoriesupdate' ||
      all.includes('webstorie') ||
      all.includes('web-storie') ||
      all.includes('web_storie')
    )
      return {
        screenTitle: 'வெப் ஸ்டோரீஸ்',
        initialTabId: 'webstoriesupdate',
        initialTabLink: '/webstoriesupdate',
        initialTabTitle: 'வெப் ஸ்டோரீஸ்',
      };

    // ── கார்ட்டூன்ஸ் (id: "5002", link: /photoitem?cat=5002) ──
    if (
      catId === '5002' ||
      all.includes('cartoon') ||
      all.includes('caricature') ||
      all.includes('dinamalar-cartoon')
    )
      return {
        screenTitle: 'கார்ட்டூன்ஸ்',
        initialTabId: '5002',
        initialTabLink: '/photoitem?cat=5002',
        initialTabTitle: 'கார்ட்டூன்ஸ்',
      };

    // ── NRI ஆல்பம் (id: "5003", link: /photoitem?cat=5003) ──
    if (
      catId === '5003' ||
      all.includes('nri') ||
      all.includes('world-tamilar')
    )
      return {
        screenTitle: 'NRI ஆல்பம்',
        initialTabId: '5003',
        initialTabLink: '/photoitem?cat=5003',
        initialTabTitle: 'NRI ஆல்பம்',
      };

    // ── புகைப்பட ஆல்பம் (id: "5001", link: /photoitem?cat=5001) ──
    if (
      catId === '5001' ||
      all.includes('pugai-pada') ||
      all.includes('pugaipada') ||
      all.includes('album')
    )
      return {
        screenTitle: 'புகைப்பட ஆல்பம்',
        initialTabId: '5001',
        initialTabLink: '/photoitem?cat=5001',
        initialTabTitle: 'புகைப்பட ஆல்பம்',
      };

    // ── இன்றைய போட்டோ (id: "81", link: /photoitem?cat=81) ──
    if (
      catId === '81' ||
      all.includes('today-photo') ||
      all.includes('indraiya') ||
      all.includes('indraya') ||
      all.includes('இன்றைய')
    )
      return {
        screenTitle: 'இன்றைய போட்டோ',
        initialTabId: '81',
        initialTabLink: '/photoitem?cat=81',
        initialTabTitle: 'இன்றைய போட்டோ',
      };

    // ── Default: All photos tab (no initialTabId → CommonSectionScreen loads "All") ──
    return {
      screenTitle: 'போட்டோ',
      initialTabId: null,
      initialTabLink: null,
      initialTabTitle: null,
    };
  };

  const goToArticle = (item) => {
    if (isVideoItem(item)) {
      // Navigate to VideoScreen with the Dinamalar video ID
      const videoId = getDinaVideoId(item) || item.newsid || item.id;
      navigation.navigate('VideoDetailScreen', { videoId, videoItem: item });
    } else if (isPhotoItem(item)) {
      // Use resolvePhotoTab to determine navigation
      const tab = resolvePhotoTab(item);
      console.log('goToArticle — item catId/maincat:', item?.maincatid, item?.maincat, '→ tab:', tab.initialTabId);

      navigation.navigate('CommonSectionScreen', {
        screenTitle: tab.screenTitle,
        apiEndpoint: 'https://api-st.dinamalar.com/photodata',
        allTabLink: 'https://api-st.dinamalar.com/photodata',
        useFullUrl: true,
        // Pass the specific item to open/focus
        selectedNewsId: item.newsid || item.id,
        selectedNewsItem: item,
        ...(tab.initialTabId && {
          initialTabId: tab.initialTabId,
          initialTabLink: tab.initialTabLink,
          initialTabTitle: tab.initialTabTitle,
        }),
      });
    } else {
      const newsId = item.id || item.newsid;
      navigation.navigate('NewsDetailsScreen', { newsId, newsItem: item });
    }
  };

  // ── listData — same structure as your original ──
  const listData = React.useMemo(() => {
    const out = [];

    console.log('=== listData Creation Debug ===');
    console.log('Notifications length:', notifications.length);
    console.log('News length:', news.length);
    console.log('NotifTitle:', notifTitle);

    if (notifications.length > 0) {
      out.push({ _type: 'sectionHeader', _key: 'sh-notif', title: notifTitle });
      notifications.forEach((item, idx) => {
        out.push({ _type: 'notif', _key: `notif-${item.newsid}-${idx}`, ...item });
        if (idx < notifications.length - 1)
          out.push({ _type: 'divider', _key: `nd-${idx}` });
      });
      out.push({ _type: 'thickDivider', _key: 'thick-1' });
    }

    out.push({ _type: 'sectionHeader', _key: 'sh-latest', title: latestTitle });

    let lastDate = null;
    const validNews = news.filter(Boolean);
    console.log('Valid news after filter:', validNews.length);

    validNews.forEach((item, idx) => {
      if (item.date !== lastDate) {
        out.push({ _type: 'date', _key: `date-${item.date}-${idx}`, date: item.standarddate });
        lastDate = item.date;
      }
      const isLast = idx === validNews.length - 1;
      out.push({ _type: 'item', _key: `item-${item.id}-${idx}`, _isLast: isLast, ...item });
    });

    // Add load more button - always visible if there are news items
    if (news.length > 0 && !loading) {
      out.push({ _type: 'loadMore', _key: 'load-more' });
    }

    // Add most commented section if data is available (always show)
    if (mostCommented.length > 0) {
      out.push({ _type: 'thickDivider', _key: 'thick-most-commented' });
      out.push({ _type: 'sectionHeader', _key: 'sh-most-commented', title: 'அதிகம் விமர்ச்சிக்கப்பட்டவை' });

      mostCommented.forEach((item, idx) => {
        // Convert most commented item to timeline item format
        const timelineItem = {
          id: item.newsid,
          newsid: item.newsid,
          newstitle: item.newstitle,
          newsdate: item.newsdate,
          standarddate: item.standarddate,
          date: item.date,
          time: item.time,
          ago: item.ago,
          images: item.images,
          newscomment: item.newscomment,
          maincat: item.maincat,
          maincatid: item.maincatid,
          audio: item.audio,
          video: item.video,
          path: item.path,
          slug: item.slug,
          reacturl: item.reacturl,
          catslug: item.catslug,
        };

        const isLast = idx === mostCommented.length - 1;
        out.push({ _type: 'item', _key: `most-commented-${item.newsid}-${idx}`, _isLast: isLast, ...timelineItem });

        if (idx < mostCommented.length - 1) {
          out.push({ _type: 'divider', _key: `mc-divider-${idx}` });
        }
      });
    }

    console.log('Final listData length:', out.length);
    console.log('=== End listData Creation ===');

    return out;
  }, [notifications, news, notifTitle, latestTitle, mostCommented]);

  const renderItem = ({ item }) => {
    switch (item._type) {
      case 'sectionHeader': return <SectionHeader title={item.title} />;
      case 'notif': return <NotificationCard item={item} onPress={goToArticle} navigation={navigation} />;
      case 'item': return <TimelineItem item={item} isLast={item._isLast} onPress={goToArticle} navigation={navigation} resolvePhotoTab={resolvePhotoTab} />;
      case 'date': return <DateSeparator date={item.date} />;
      case 'divider': return <View style={{ height: vs(1), backgroundColor: PALETTE.grey200 }} />;
      case 'thickDivider': return <View style={{ height: vs(8), backgroundColor: PALETTE.grey200 }} />;
      case 'loadMore': return <LoadMoreButton onPress={() => fetchAll(page + 1)} loading={loadingMore} />;
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <UniversalHeaderComponent
        statusBarStyle="dark-content"
        statusBarBackgroundColor={COLORS.white}
        onMenuPress={handleMenuPress}
        onNotification={handleNotificationCenterPress}
        notifCount={notifBadgeCount}
        hideNotification={false}
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

      {loading ? (
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={i => `sk-${i}`}
          ListHeaderComponent={
            <>
              <SectionHeader title={notifTitle || 'Latest notification'} />
              {[1, 2].map(i => (
                <React.Fragment key={i}>
                  <NotifSkeleton />
                  {i < 2 && <View style={{ height: vs(1), backgroundColor: PALETTE.grey200 }} />}
                </React.Fragment>
              ))}
              <View style={{ height: vs(8), backgroundColor: PALETTE.grey200 }} />
              <SectionHeader title={latestTitle} />
            </>
          }
          renderItem={() => (
            <>
              <TimelineSkeleton />
              <View style={{ height: vs(1), backgroundColor: PALETTE.grey200 }} />
            </>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          ref={flatListRef}
          data={listData}
          keyExtractor={item => item._key}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onScroll={e => setShowScrollTop(e.nativeEvent.contentOffset.y > 400)}
          scrollEventThrottle={16}
          ListFooterComponent={
            loadingMore
              ? <View style={styles.footerLoader}><ActivityIndicator size="small" color={COLORS.primary} /></View>
              : <View style={{ height: vs(40) }} />
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} tintColor={COLORS.primary} />
          }
        />
      )}

      {showScrollTop && (
        <TouchableOpacity
          style={styles.scrollTopBtn}
          onPress={() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true })}
        >
          <Ionicons name="arrow-up" size={20} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Test notification button (for development) - Hidden for testing */}
      {/* <TouchableOpacity
        style={styles.testNotificationBtn}
        onPress={testPushNotification}
      >
        <Ionicons name="notifications" size={s(20)} color="#fff" />
        <Text style={styles.testNotificationText}>Test</Text>
      </TouchableOpacity> */}

      {/* Real-time notification popup */}
      {/* <RealTimeNotificationPopup
        notification={currentNotification}
        visible={showNotificationPopup}
        onClose={handleNotificationPopupClose}
        onPress={handleNotificationPress}
      /> */}

      {/* Notification center modal */}
      {/* <NotificationCenter
        visible={showNotificationCenter}
        onClose={handleNotificationCenterClose}
        onNotificationPress={handleNotificationPress}
        onRefresh={handleNotificationCenterRefresh}
      /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.grey200,
    paddingTop: Platform.OS === 'android' ? vs(0) : 0,
  },
  listContent: { paddingBottom: vs(40) },
  footerLoader: { justifyContent: 'center', alignItems: 'center', paddingVertical: vs(16) },
  scrollTopBtn: {
    position: 'absolute', bottom: vs(24), right: s(16),
    width: s(44), height: s(44), borderRadius: s(22),
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: vs(3) },
    shadowOpacity: 0.25, shadowRadius: s(5),
  },
  testNotificationBtn: {
    position: 'absolute', bottom: vs(24), left: s(16),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
    borderRadius: s(20),
    elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: vs(3) },
    shadowOpacity: 0.25, shadowRadius: s(5),
  },
  testNotificationText: {
    color: '#fff',
    fontSize: ms(12),
    fontFamily: FONTS.muktaMalar.bold,
    marginLeft: s(4),
  },
});