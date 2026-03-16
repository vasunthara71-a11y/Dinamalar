import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, Platform, Share, Linking, Dimensions,
  Animated, PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import RenderHtml from 'react-native-render-html';

const getAudioPlayer = () => { try { return ExpoAV?.useAudioPlayer || null; } catch { return null; } };

import { mainApi } from '../config/api';
import { COLORS, FONTS } from '../utils/constants';
import { s, vs, scaledSizes } from '../utils/scaling';
import { ms } from 'react-native-size-matters';
import UniversalHeaderComponent from '../components/UniversalHeaderComponent';
import AppHeaderComponent from '../components/AppHeaderComponent';
import CommentsModal from '../components/CommentsModal';
import { useFontSize } from '../context/FontSizeContext';

const { width: SCREEN_W } = Dimensions.get('window');

const SWIPE_THRESHOLD = 60;
const SWIPE_VELOCITY = 0.3;

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

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
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
    position: 'absolute',
    top: '40%',
    zIndex: 999,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: s(10),
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
    alignItems: 'center',
    gap: vs(2),
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

  const translateX = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);
  const isHorizontalDrag = useRef(false);
  const scrollRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── Current index in newsList ──────────────────────────────────────────────
  const currentId = newsId || newsItem?.id || newsItem?.newsid;
  const currentListIndex = useRef(
    newsList.findIndex(n => (n.id || n.newsid)?.toString() === currentId?.toString())
  );
  const idx = currentListIndex.current;
  const hasPrev = idx > 0 && newsList.length > 0;
  const hasNext = idx >= 0 && idx < newsList.length - 1 && newsList.length > 0;

  const triggerPulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
  };

  // ── Navigate to prev/next ──────────────────────────────────────────────────
  const navigateToNews = useCallback((direction) => {
    if (isAnimating.current) return;

    const currentIdx = currentListIndex.current;
    const nextIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;

    if (nextIdx < 0 || nextIdx >= newsList.length) {
      // Bounce back
      Animated.spring(translateX, {
        toValue: 0, useNativeDriver: true, tension: 180, friction: 12,
      }).start();
      return;
    }

    isAnimating.current = true;
    const exitTo = direction === 'next' ? -SCREEN_W : SCREEN_W;

    Animated.timing(translateX, {
      toValue: exitTo,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      translateX.setValue(0);
      isAnimating.current = false;
      currentListIndex.current = nextIdx;

      const nextItem = newsList[nextIdx];
      navigation.replace('NewsDetailsScreen', {
        newsId: nextItem.id || nextItem.newsid,
        newsItem: nextItem,
        newsList,
      });
    });
  }, [newsList, navigation, translateX]);

  // ── PanResponder ───────────────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,

      // Capture from children (ScrollView) when clearly horizontal
      onMoveShouldSetPanResponderCapture: (_, g) => {
        const isH = Math.abs(g.dx) > Math.abs(g.dy) * 2.5 && Math.abs(g.dx) > 15;
        return isH;
      },

      onMoveShouldSetPanResponder: (_, g) => {
        const isH = Math.abs(g.dx) > Math.abs(g.dy) * 1.8 && Math.abs(g.dx) > 10;
        if (isH) {
          isHorizontalDrag.current = true;
          setScrollLocked(true);
        }
        return isH;
      },

      onPanResponderGrant: () => {
        isHorizontalDrag.current = false;
      },

      onPanResponderMove: (_, g) => {
        if (!isHorizontalDrag.current) return;
        // Rubber band resistance
        translateX.setValue(g.dx * 0.38);
        setHintDir(g.dx < 0 ? 'right' : 'left');
      },

      onPanResponderRelease: (_, g) => {
        setScrollLocked(false);
        isHorizontalDrag.current = false;
        setHintDir(null);

        if (isAnimating.current) return;

        const swipedLeft = g.dx < -SWIPE_THRESHOLD || g.vx < -SWIPE_VELOCITY;
        const swipedRight = g.dx > SWIPE_THRESHOLD || g.vx > SWIPE_VELOCITY;

        if (swipedLeft) {
          navigateToNews('next');
        } else if (swipedRight) {
          navigateToNews('prev');
        } else {
          Animated.spring(translateX, {
            toValue: 0, useNativeDriver: true, tension: 200, friction: 15,
          }).start();
        }
      },

      onPanResponderTerminate: () => {
        setScrollLocked(false);
        isHorizontalDrag.current = false;
        setHintDir(null);
        Animated.spring(translateX, {
          toValue: 0, useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleMenuPress = (menuItem) => {
    const link = menuItem?.Link || menuItem?.link || '';
    if (link.startsWith('http') || link.startsWith('www.')) Linking.openURL(link);
  };

  const goToSearch = () => navigation?.navigate('SearchScreen');
  const goToNotifs = () => navigation?.navigate('NotificationScreen');
  const handleSelectDistrict = (district) => setSelectedDistrict(district.title);

  // ── Fetch detail ───────────────────────────────────────────────────────────
  const fetchDetail = useCallback(async () => {
    const id = newsId || newsItem?.id || newsItem?.newsid;
    if (!id) {
      if (newsItem) { setDetail(newsItem); setLoading(false); return; }
      setError('செய்தி ID கிடைக்கவில்லை');
      setLoading(false);
      return;
    }
    try {
      setLoading(true); setError(null);
      console.log('[NewsDetails] fetching news with ID:', id);
      const res = await mainApi.get(`/detaildata?newsid=${id}`);
      const data = res.data;
      console.log('[NewsDetails] full API response:', JSON.stringify(data, null, 2));
      console.log('[NewsDetails] comments structure:', data?.comments);
      console.log('[NewsDetails] comments data:', data?.comments?.data);
      console.log('[NewsDetails] alternative comment paths:', {
        'data.comments': data?.comments,
        'data.comments.data': data?.comments?.data,
        'data.detailnews.comments': data?.detailnews?.comments,
        'data.detailnews.comments.data': data?.detailnews?.comments?.data,
        'data.detailpage.comments': data?.detailpage?.[0]?.comments,
        'data.detailpage[0].comments': data?.detailpage?.[0]?.comments,
        'data.newsdetail.comments': data?.newsdetail?.[0]?.comments,
        'data.detail.comments': data?.detail?.[0]?.comments,
      });
      
      const article =
        data?.detailnews?.detailpage?.[0] ||
        data?.detailpage?.[0] ||
        data?.newsdetail?.[0] ||
        data?.detail?.[0] ||
        (Array.isArray(data) ? data[0] : null) ||
        null;
      
      // Extract comments from the API response
      if (data?.comments?.data) {
        setNewsComments(data.comments.data);
        console.log('[NewsDetails] extracted comments from data.comments.data:', data.comments.data.length);
      } else if (data?.comments) {
        setNewsComments(data.comments);
        console.log('[NewsDetails] extracted comments from data.comments:', data.comments.length);
      } else if (article?.comments?.data) {
        setNewsComments(article.comments.data);
        console.log('[NewsDetails] extracted comments from article.comments.data:', article.comments.data.length);
      } else if (article?.comments) {
        setNewsComments(article.comments);
        console.log('[NewsDetails] extracted comments from article.comments:', article.comments.length);
      } else {
        setNewsComments([]);
        console.log('[NewsDetails] no comments found in any path');
      }
      
      setDetail(article || newsItem || null);
    } catch (err) {
      console.error('Detail fetch error:', err?.message);
      setDetail(newsItem || null);
      if (!newsItem) setError('செய்தியை ஏற்ற முடியவில்லை.');
    } finally {
      setLoading(false);
    }
  }, [newsId, newsItem]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);
  useEffect(() => { if (detail) triggerPulse(); }, [detail]);

  // ── Share ──────────────────────────────────────────────────────────────────
  const getShareUrl = () => {
    const slug = detail?.slug || newsItem?.slug || '';
    const shareUrl = detail?.shareurl || newsItem?.shareurl || '';
    return shareUrl || (slug ? `https://www.dinamalar.com${slug}` : 'https://www.dinamalar.com');
  };

  const handleShare = async () => {
    try {
      const url = getShareUrl();
      const ttl = detail?.newstitle || newsItem?.newstitle || 'தினமலர் செய்தி';
      await Share.share({ title: ttl, message: `${ttl}\n\n${url}`, url });
    } catch (err) { console.error('Share error:', err); }
  };

  const handleOpenBrowser = () => Linking.openURL(getShareUrl());

  // ── Derived ────────────────────────────────────────────────────────────────
  const d = detail || {};
  const ni = newsItem || {};

  const title = d.newstitle || ni.newstitle || ni.title || '';
  const image = d.largeimages || d.images || ni.largeimages || ni.images || '';
  const catKey = d.maincat || ni.maincat || '';
  const ago = d.ago || ni.ago || '';
  const date = d.standarddate || ni.standarddate || '';
  const content = d.newsdescription || d.content || ni.content || '';
  const videoPath = d.path || ni.path || '';

  const isVideo = catKey === 'video' || videoPath?.includes('youtube');
  const isPodcast = catKey === 'podcast' || d.audio === '1' || d.audio === 1;

  const comments = parseInt(d.newscomment || d.nmcomment || 0);
  const relatedNews = Array.isArray(d.relateddata) ? d.relateddata
    : Array.isArray(d.related) ? d.related
      : Array.isArray(d.relatedNews) ? d.relatedNews : [];
  const tags = Array.isArray(d.tags) ? d.tags : [];

  const ytId = getYouTubeId(videoPath);
  const ytThumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '';

  const currentNewsId = newsId || newsItem?.id || newsItem?.newsid;
  const podcastAudioUrl = videoPath || d.audiofile || d.audiourl || null;

  const BASE_FONT = sf(16);
  const tagsStyles = React.useMemo(() => buildTagsStyles(BASE_FONT, COLORS.text), [BASE_FONT]);
  const baseStyle = React.useMemo(() => buildBaseStyle(BASE_FONT, COLORS.text), [BASE_FONT]);
  const safeContent = sanitizeHtml(content);

  // ─── Render ───────────────────────────────────────────────────────────────
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

      {/* ── Pan capture layer ── */}
      <View style={styles.panLayer} {...panResponder.panHandlers}>
        <Animated.View style={[styles.animLayer, { transform: [{ translateX }] }]}>

          {/* Swipe hints */}
          {hintDir === 'left' && <SwipeHint direction="left" />}
          {hintDir === 'right' && <SwipeHint direction="right" />}

          {/* Edge tap buttons */}
          {hasPrev && (
            <TouchableOpacity
              style={styles.edgeBtnLeft}
              onPress={() => navigateToNews('prev')}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={s(20)} color={COLORS.subtext} />
            </TouchableOpacity>
          )}
          {hasNext && (
            <TouchableOpacity
              style={styles.edgeBtnRight}
              onPress={() => navigateToNews('next')}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={s(20)} color={COLORS.subtext} />
            </TouchableOpacity>
          )}

          {/* Loading */}
          {loading && (
            <ScrollView
              scrollEnabled={!scrollLocked}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <ContentLoader />
            </ScrollView>
          )}

          {/* Error */}
          {!loading && !!error && (
            <View style={styles.errorWrap}>
              <Ionicons name="alert-circle-outline" size={s(52)} color="#f44336" />
              <Text style={styles.errorTxt}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchDetail}>
                <Text style={styles.retryBtnTxt}>மீண்டும் முயற்சி</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Content */}
          {!loading && !error && (
            <ScrollView
              ref={scrollRef}
              scrollEnabled={!scrollLocked}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              scrollEventThrottle={16}
            >

              {/* Progress bar */}
              {/* {newsList.length > 1 && (
                <View style={styles.progressWrap}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${((idx + 1) / newsList.length) * 100}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressTxt}>
                    {idx + 1} / {newsList.length}
                  </Text>
                </View>
              )} */}

              {/* Title */}
              <Text style={[styles.title, { fontSize: sf(20), lineHeight: sf(28) }]}>
                {title}
              </Text>

              {/* Meta row */}
              <View style={styles.metaRow}>
                <View style={{ flex: 1 }} />
                {!disableComments && (
                  <TouchableOpacity
                    style={styles.iconAction}
                    onPress={() => setCommentsVisible(true)}
                  >
                    <Ionicons name="chatbox" size={s(20)} color={COLORS.subtext} />
                    {comments > 0 && (
                      <Text style={[styles.iconBadge, { fontSize: sf(10) }]}>{comments}</Text>
                    )}
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.iconAction}
                  onPress={() => setBookmarked(p => !p)}
                >
                  <Ionicons
                    name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                    size={s(20)}
                    color={bookmarked ? COLORS.primary : COLORS.subtext}
                  />
                </TouchableOpacity>
              </View>

              {/* Hero image */}
              {!!image && !isVideo && !isPodcast && (
                <View style={styles.heroWrap}>
                  <Image
                    source={{ uri: image }}
                    style={styles.heroImage}
                    resizeMode="contain"
                  />
                  {!!d.imagecaption && (
                    <Text style={[styles.caption, { fontSize: sf(12) }]}>
                      {d.imagecaption}
                    </Text>
                  )}
                </View>
              )}

              {/* YouTube */}
              {isVideo && (
                <TouchableOpacity
                  style={styles.videoWrap}
                  onPress={() => videoPath && Linking.openURL(videoPath)}
                >
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
              {isPodcast && !!podcastAudioUrl && (
                <View style={styles.podcastSection}>
                  <View style={styles.podcastCard}>
                    <View style={styles.podcastArtwork}>
                      {!!image ? (
                        <Image
                          source={{ uri: image }}
                          style={styles.podcastArtworkImg}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.podcastArtworkFallback}>
                          <Ionicons name="mic-circle" size={s(48)} color="#9c27b0" />
                        </View>
                      )}
                    </View>
                    <View style={styles.podcastInfo}>
                      <View style={styles.podcastBadge}>
                        <Ionicons name="mic" size={s(9)} color="#fff" />
                        <Text style={styles.podcastBadgeTxt}>PODCAST</Text>
                      </View>
                      <Text style={styles.podcastCardTitle} numberOfLines={3}>{title}</Text>
                      {!!(date || ago) && (
                        <Text style={styles.podcastCardDate}>{date || ago}</Text>
                      )}
                    </View>
                  </View>
                </View>
              )}

              {/* HTML content */}
              {!!safeContent && (
                <Animated.View
                  style={[styles.contentSection, { opacity: pulseAnim }]}
                  onLayout={(e) => {
                    const w = e.nativeEvent.layout.width;
                    if (w > 0) setContentWidth(w);
                  }}
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

              {/* Share bar */}
              <View style={styles.shareBar}>
                <Text style={[styles.shareBarTitle, { fontSize: sf(14) }]}>பகிரவும்</Text>
                <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                  <Ionicons name="share-social-outline" size={s(16)} color={COLORS.primary} />
                  <Text style={[styles.shareBtnTxt, { fontSize: sf(12) }]}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.shareBtn} onPress={handleOpenBrowser}>
                  <Ionicons name="globe-outline" size={s(16)} color={COLORS.primary} />
                  <Text style={[styles.shareBtnTxt, { fontSize: sf(12) }]}>Browser</Text>
                </TouchableOpacity>
              </View>

              {/* Swipe nav row */}
              {newsList.length > 1 && (
                <View style={styles.swipeNavRow}>
                  <TouchableOpacity
                    style={[styles.swipeNavBtn, !hasPrev && styles.swipeNavBtnDisabled]}
                    onPress={() => hasPrev && navigateToNews('prev')}
                    disabled={!hasPrev}
                  >
                    <Ionicons name="arrow-back" size={s(15)} color={hasPrev ? COLORS.primary : '#ccc'} />
                    <Text style={[styles.swipeNavTxt, !hasPrev && styles.swipeNavTxtDisabled]}>
                      முந்தைய
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.swipeNavCount}>{idx + 1} / {newsList.length}</Text>

                  <TouchableOpacity
                    style={[styles.swipeNavBtn, !hasNext && styles.swipeNavBtnDisabled]}
                    onPress={() => hasNext && navigateToNews('next')}
                    disabled={!hasNext}
                  >
                    <Text style={[styles.swipeNavTxt, !hasNext && styles.swipeNavTxtDisabled]}>
                      அடுத்த
                    </Text>
                    <Ionicons name="arrow-forward" size={s(15)} color={hasNext ? COLORS.primary : '#ccc'} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Related news */}
              {relatedNews.length > 0 && (
                <View style={styles.relatedSection}>
                  <Text style={[styles.relatedTitle, { fontSize: sf(18) }]}>
                    தொடர்புடைய செய்திகள்
                  </Text>
                  {relatedNews.map((rel, i) => {
                    const relId = rel.id || rel.newsid;
                    return (
                      <TouchableOpacity
                        key={`related-${i}-${relId || i}`}
                        style={styles.relatedCard}
                        onPress={() => navigation.push('NewsDetailsScreen', {
                          newsId: relId,
                          newsItem: rel,
                          newsList,
                        })}
                      >
                        {!!rel.images && (
                          <Image
                            source={{ uri: rel.images }}
                            style={styles.relatedImg}
                            resizeMode="cover"
                          />
                        )}
                        <View style={styles.relatedBody}>
                          <Text style={[styles.relatedCat, { fontSize: sf(10) }]}>
                            {rel.categrorytitle || rel.maincat || ''}
                          </Text>
                          <Text
                            style={[styles.relatedItemTitle, { fontSize: sf(13), lineHeight: sf(19) }]}
                            numberOfLines={3}
                          >
                            {rel.newstitle || rel.title || ''}
                          </Text>
                          <Text style={[styles.relatedDate, { fontSize: sf(10) }]}>
                            {rel.standarddate || rel.ago || ''}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <View style={{ height: vs(40) }} />
            </ScrollView>
          )}

        </Animated.View>
      </View>

      {/* Comments Modal */}
      {!disableComments && (
        <CommentsModal
          visible={commentsVisible}
          onClose={() => setCommentsVisible(false)}
          newsId={currentNewsId}
          newsTitle={title}
          commentCount={comments}
          preloadedComments={newsComments}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'android' ? vs(30) : 0,
  },

  // ── Pan + Anim layers ──
  panLayer: {
    flex: 1,
    overflow: 'hidden',
  },
  animLayer: {
    flex: 1,
  },

  // ── Progress ──
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(16),
    paddingTop: vs(8),
    paddingBottom: vs(4),
    gap: s(8),
  },
  progressBar: {
    flex: 1,
    height: vs(3),
    backgroundColor: '#eee',
    borderRadius: vs(2),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: vs(2),
  },
  progressTxt: {
    fontSize: ms(10),
    color: COLORS.subtext,
    fontWeight: '600',
    minWidth: s(36),
    textAlign: 'right',
  },

  // ── Edge buttons ──
  edgeBtnLeft: {
    position: 'absolute',
    left: 0,
    top: '45%',
    zIndex: 10,
    // backgroundColor: COLORS.subtext + '20',
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    justifyContent:"center",
    alignItems:"center",
    backgroundColor:COLORS.white
  },
  edgeBtnRight: {
    position: 'absolute',
    right: 0,
    top: '45%',
    zIndex: 10,
    // backgroundColor: COLORS.primary + '20',
    // borderTopLeftRadius: s(20),
    // borderBottomLeftRadius: s(18),
    // paddingVertical: vs(12),
    // paddingHorizontal: s(5),
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    justifyContent:"center",
    alignItems:"center",
        backgroundColor:COLORS.white

  },

  scrollContent: { paddingBottom: vs(20) },

  title: {
    fontWeight: '800',
    color: COLORS.text,
    paddingHorizontal: s(16),
    paddingTop: vs(12),
    paddingBottom: vs(8),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    paddingHorizontal: s(16),
    marginBottom: vs(12),
  },
  iconAction: { flexDirection: 'row', alignItems: 'center', gap: s(3), padding: s(4) },
  iconBadge: { color: COLORS.subtext, fontWeight: '600' },

  heroWrap: { marginHorizontal: s(16), marginBottom: vs(12) },
  heroImage: { width: '100%', height:ms(230), backgroundColor: '#f0f0f0' },
  caption: { color: COLORS.subtext, fontStyle: 'italic', marginTop: vs(4), textAlign: 'center' },

  videoWrap: {
    marginHorizontal: s(16), height: ms(200), backgroundColor: '#1a1a2e',
    borderRadius: s(10), justifyContent: 'center', alignItems: 'center',
    marginBottom: vs(12), overflow: 'hidden',
  },
  ytThumb: { position: 'absolute', width: '100%', height: "100%" },
  ytPlayOverlay: {
    position: 'absolute', justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)', width: '100%', height: '100%',
  },
  videoTxt: { color: '#fff', fontWeight: '600', marginTop: vs(8) },

  podcastSection: { marginBottom: vs(4) },
  podcastCard: {
    flexDirection: 'row', alignItems: 'center', gap: s(12),
    marginHorizontal: s(16), marginBottom: vs(12),
    backgroundColor: '#faf0ff', borderRadius: s(12),
    padding: s(12), borderWidth: 1, borderColor: '#9c27b025',
  },
  podcastArtwork: {
    width: s(72), height: s(72), borderRadius: s(10),
    overflow: 'hidden', backgroundColor: '#ede0f7',
    justifyContent: 'center', alignItems: 'center',
  },
  podcastArtworkImg: { width: '100%', height: '100%' },
  podcastArtworkFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  podcastInfo: { flex: 1 },
  podcastBadge: {
    flexDirection: 'row', alignItems: 'center', gap: s(4),
    backgroundColor: '#9c27b0', alignSelf: 'flex-start',
    paddingHorizontal: s(7), paddingVertical: vs(2),
    borderRadius: s(8), marginBottom: vs(6),
  },
  podcastBadgeTxt: { color: '#fff', fontSize: ms(8), fontWeight: '800', letterSpacing: 0.5 },
  podcastCardTitle: { fontSize: ms(13), fontWeight: '700', color: COLORS.text, lineHeight: ms(18), marginBottom: vs(4) },
  podcastCardDate: { fontSize: ms(10), color: COLORS.subtext },

  contentSection: { paddingHorizontal: s(16), marginBottom: vs(16) },

  tagsSection: { paddingHorizontal: s(16), marginBottom: vs(16) },
  tagsSectionTitle: { fontWeight: '700', color: COLORS.text, marginBottom: vs(8) },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: s(6) },
  tagChip: {
    backgroundColor: COLORS.primary + '15', paddingHorizontal: s(10),
    paddingVertical: vs(4), borderRadius: s(14),
    borderWidth: 1, borderColor: COLORS.primary + '30',
  },
  tagTxt: { color: COLORS.primary, fontWeight: '600' },

  shareBar: {
    flexDirection: 'row', alignItems: 'center', gap: s(10),
    marginHorizontal: s(16), marginBottom: vs(8),
    paddingVertical: vs(12),
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f0f0f0',
  },
  shareBarTitle: { flex: 1, fontWeight: '700', color: COLORS.text },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: s(4),
    backgroundColor: COLORS.primary + '12',
    paddingHorizontal: s(12), paddingVertical: vs(6), borderRadius: s(16),
  },
  shareBtnTxt: { color: COLORS.primary, fontWeight: '600' },

  // ── Swipe nav row ──
  swipeNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: s(16),
    marginTop: vs(4),
    marginBottom: vs(16),
    paddingVertical: vs(10),
    paddingHorizontal: s(12),
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderRadius: s(10),
    backgroundColor: '#fafafa',
  },
  swipeNavBtn: {
    flexDirection: 'row', alignItems: 'center', gap: s(4), padding: s(6),
  },
  swipeNavBtnDisabled: { opacity: 0.3 },
  swipeNavTxt: { fontSize: ms(13), fontWeight: '700', color: COLORS.primary },
  swipeNavTxtDisabled: { color: '#ccc' },
  swipeNavCount: { fontSize: ms(12), color: COLORS.subtext, fontWeight: '600' },

  relatedSection: { paddingHorizontal: s(16), marginBottom: vs(16) },
  relatedTitle: {
    fontWeight: '700', color: COLORS.text,
    marginBottom: vs(12), paddingBottom: vs(8),
    borderBottomWidth: 2, borderBottomColor: COLORS.primary,
  },
  relatedCard: {
    flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: s(8),
    marginBottom: vs(10), overflow: 'hidden',
    borderWidth: 1, borderColor: '#f0f0f0',
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: s(1) },
    shadowOpacity: 0.05, shadowRadius: s(3),
  },
  relatedImg: { width: s(95), height: vs(72), backgroundColor: '#f0f0f0' },
  relatedBody: { flex: 1, padding: s(10) },
  relatedCat: { color: COLORS.primary, fontWeight: '700', textTransform: 'uppercase', marginBottom: vs(3) },
  relatedItemTitle: { fontWeight: '600', color: COLORS.text, marginBottom: vs(4) },
  relatedDate: { color: COLORS.subtext },

  errorWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: s(32) },
  errorTxt: {
    color: COLORS.subtext, textAlign: 'center',
    marginTop: vs(12), marginBottom: vs(20),
  },
  retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: s(24), paddingVertical: vs(10), borderRadius: s(8) },
  retryBtnTxt: { color: '#fff', fontWeight: '700' },

  loaderContainer: { backgroundColor: COLORS.white, paddingHorizontal: s(16), paddingTop: vs(16) },
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
});