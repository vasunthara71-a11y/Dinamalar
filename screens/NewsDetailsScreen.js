import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, StyleSheet, Platform, Share,
  Linking, StatusBar, Dimensions, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import RenderHtml from 'react-native-render-html';

// ─── Audio: lazy-loaded to avoid "Cannot find native module 'ExponentAV'"
// import * as ExpoAV from 'expo-av';
// import * as ExpoVideo from 'expo-video'; // Temporarily disabled

const getAudioPlayer = () => { try { return ExpoAV?.useAudioPlayer || null; } catch { return null; } };

import { u38Api } from '../config/api';
import { COLORS, FONTS } from '../utils/constants';
import { s, vs, scaledSizes } from '../utils/scaling';
import { ms } from 'react-native-size-matters';
import UniversalHeaderComponent from '../components/UniversalHeaderComponent';
import AppHeaderComponent from '../components/AppHeaderComponent';
import CommentsModal from '../components/CommentsModal';
import { useFontSize } from '../context/FontSizeContext';

const { width: SCREEN_W } = Dimensions.get('window');

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
    p:    { margin: 0, marginBottom: vs(12), fontSize, color: textColor, lineHeight: lh, textAlign: 'left', fontFamily: FONTS?.muktaMalar?.medium || undefined },
    strong: { fontWeight: '700', color: textColor },
    b:    { fontWeight: '700', color: textColor },
    em:   { fontStyle: 'italic', color: textColor },
    i:    { fontStyle: 'italic', color: textColor },
    h1:   { fontSize: fontSize + 6, fontWeight: '800', color: textColor, marginBottom: vs(16), marginTop: vs(8), textAlign: 'left', lineHeight: Math.round((fontSize + 6) * LINE_HEIGHT_RATIO) },
    h2:   { fontSize: fontSize + 4, fontWeight: '700', color: textColor, marginBottom: vs(12), marginTop: vs(8), textAlign: 'left', lineHeight: Math.round((fontSize + 4) * LINE_HEIGHT_RATIO) },
    h3:   { fontSize: fontSize + 2, fontWeight: '700', color: textColor, marginBottom: vs(10), marginTop: vs(8), textAlign: 'left', lineHeight: Math.round((fontSize + 2) * LINE_HEIGHT_RATIO) },
    h4:   { fontSize, fontWeight: '700', color: textColor, marginBottom: vs(8), marginTop: vs(6), textAlign: 'left', lineHeight: lh },
    ul:   { margin: 0, marginLeft: s(20), marginBottom: vs(12) },
    ol:   { margin: 0, marginLeft: s(20), marginBottom: vs(12) },
    li:   { fontSize, color: textColor, marginBottom: vs(6), lineHeight: lh },
    a:    { color: COLORS.primary, textDecorationLine: 'underline', fontWeight: '600' },
    blockquote: { backgroundColor: COLORS.primary + '10', borderLeftWidth: 4, borderLeftColor: COLORS.primary, paddingLeft: s(12), paddingVertical: vs(8), marginVertical: vs(12), fontStyle: 'italic' },
    br:   { margin: 0, height: vs(8) },
    div:  { marginBottom: vs(8) },
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
        <View style={styles.skeletonChip} />
        <View style={styles.skeletonChip} />
      </View>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonContent}>
        {[1,2,3,4,5,6,7,8].map((i) => (
          <View key={`sk-${i}`} style={[styles.skeletonLine, { width: i === 8 ? '75%' : '100%' }]} />
        ))}
      </View>
      <View style={styles.skeletonTags}>
        <View style={styles.skeletonTag} /><View style={styles.skeletonTag} /><View style={styles.skeletonTag} />
      </View>
      <View style={styles.skeletonShare} />
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const CAT_COLORS = { photo: '#e91e8c', video: '#f44336', podcast: '#9c27b0', seithigal: '#1565c0' };
const getCatColor = (cat) => CAT_COLORS[cat] || COLORS.primary;

const getYouTubeId = (url = '') => {
  const match = url.match(/(?:embed\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m   = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// AUDIO PLAYER — shared by podcast and audio fields
// ══════════════════════════════════════════════════════════════════════════════
function AudioPlayer({ audioUrl, label = 'கேளுங்கள்' }) {
  const useAudioPlayer = getAudioPlayer();
  if (!useAudioPlayer) {
    return (
      <TouchableOpacity style={ap.fallback} onPress={() => Linking.openURL(audioUrl)}>
        <Ionicons name="volume-high" size={s(20)} color="#fff" />
        <Text style={ap.fallbackText}>🎧 கேட்க இங்கே தட்டவும்</Text>
        <Ionicons name="open-outline" size={s(16)} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>
    );
  }
  return <ExpoAudioPlayer audioUrl={audioUrl} label={label} />;
}

function ExpoAudioPlayer({ audioUrl, label = 'கேளுங்கள்' }) {
  const useAudioPlayer = getAudioPlayer();
  const player  = useAudioPlayer(audioUrl);
  const [playing, setPlaying]  = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed,    setSpeed]    = useState(1.0);
  const speeds = [1.0, 1.25, 1.5, 2.0];
  const [sound, setSound] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (player) {
        setPosition(player.currentTime || 0);
        setDuration(player.duration    || 0);
        setPlaying(player.playing      || false);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [player]);

  const handlePlayPause = () => {
    if (!player) return;
    playing ? player.pause() : player.play();
  };

  const seek = (sec) => {
    if (!player) return;
    player.seekTo(Math.max(0, Math.min(sec, duration)));
  };

  const changeSpeed = () => {
    if (!player) return;
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    setSpeed(next);
    player.setPlaybackRate(next);
  };

  const progress = duration > 0 ? position / duration : 0;

  return (
    <View style={ap.container}>
      <View style={ap.header}>
        <Ionicons name="headset" size={s(15)} color="#fff" />
        <Text style={ap.headerText}>{label}</Text>
      </View>
      <View style={ap.progressRow}>
        <Text style={ap.timeText}>{formatTime(position)}</Text>
        <View style={ap.trackWrap}>
          <View style={ap.track}>
            <View style={[ap.fill, { width: `${progress * 100}%` }]} />
          </View>
        </View>
        <Text style={ap.timeText}>{formatTime(duration)}</Text>
      </View>
      <View style={ap.controls}>
        <TouchableOpacity style={ap.skipBtn} onPress={() => seek(position - 10)}>
          <Ionicons name="play-back" size={s(20)} color="rgba(255,255,255,0.85)" />
          <Text style={ap.skipLabel}>10</Text>
        </TouchableOpacity>
        <TouchableOpacity style={ap.playBtn} onPress={handlePlayPause}>
          <Ionicons
            name={playing ? 'pause' : 'play'}
            size={s(24)}
            color={COLORS.primary}
            style={!playing ? { marginLeft: s(2) } : undefined}
          />
        </TouchableOpacity>
        <TouchableOpacity style={ap.skipBtn} onPress={() => seek(position + 10)}>
          <Ionicons name="play-forward" size={s(20)} color="rgba(255,255,255,0.85)" />
          <Text style={ap.skipLabel}>10</Text>
        </TouchableOpacity>
        <TouchableOpacity style={ap.speedBtn} onPress={changeSpeed}>
          <Text style={ap.speedText}>{speed}x</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const ap = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary, borderRadius: s(8), padding: s(14),
    marginHorizontal: s(16), marginBottom: vs(16),
    elevation: 4, shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: vs(3) }, shadowOpacity: 0.35, shadowRadius: s(6),
  },
  header:      { flexDirection: 'row', alignItems: 'center', gap: s(6), marginBottom: vs(10) },
  headerText:  { color: '#fff', fontSize: ms(13), fontWeight: '700', letterSpacing: 0.3 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: vs(14) },
  timeText:    { color: 'rgba(255,255,255,0.8)', fontSize: ms(10), minWidth: s(32) },
  trackWrap:   { flex: 1, marginHorizontal: s(8), height: vs(18), justifyContent: 'center' },
  track:       { height: vs(4), backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: s(2) },
  fill:        { height: '100%', backgroundColor: '#fff', borderRadius: s(2) },
  controls:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(20) },
  skipBtn:     { alignItems: 'center', padding: s(6) },
  skipLabel:   { color: '#fff', fontSize: ms(8), fontWeight: '700', marginTop: -vs(2) },
  playBtn:     { width: s(52), height: s(52), borderRadius: s(26), backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  speedBtn:    { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: s(10), paddingVertical: vs(5), borderRadius: s(14), borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  speedText:   { color: '#fff', fontSize: ms(11), fontWeight: '800' },
  fallback:    { flexDirection: 'row', alignItems: 'center', gap: s(10), backgroundColor: COLORS.primary, borderRadius: s(8), padding: s(14), marginHorizontal: s(16), marginBottom: vs(16) },
  fallbackText:{ flex: 1, color: '#fff', fontSize: ms(13), fontWeight: '700' },
});

// ══════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════════════════════
export default function NewsDetailsScreen() {
  const navigation = useNavigation();
  const route      = useRoute();
  const { sf }     = useFontSize();
  const { newsId, newsItem, disableComments = false } = route.params || {};

  const [detail,                  setDetail]                  = useState(null);
  const [loading,                 setLoading]                 = useState(true);
  const [error,                   setError]                   = useState(null);
  const [isDrawerVisible,         setIsDrawerVisible]         = useState(false);
  const [isLocationDrawerVisible, setIsLocationDrawerVisible] = useState(false);
  const [selectedDistrict,        setSelectedDistrict]        = useState('உள்ளூர்');
  const [commentsVisible,         setCommentsVisible]         = useState(false);
  const [bookmarked,              setBookmarked]              = useState(false);
  const [contentWidth,            setContentWidth]            = useState(SCREEN_W - s(32));

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const triggerPulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.96, duration: 80,  useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 160, useNativeDriver: true }),
    ]).start();
  };

  const handleMenuPress = (menuItem) => {
    const link = menuItem?.Link || menuItem?.link || '';
    if (link.startsWith('http://') || link.startsWith('https://') || link.startsWith('www.')) {
      Linking.openURL(link);
    }
  };

  const goToSearch = () => navigation?.navigate('SearchScreen');
  const goToNotifs = () => navigation?.navigate('NotificationScreen');
  const handleSelectDistrict = (district) => setSelectedDistrict(district.title);

  // ─── Fetch ────────────────────────────────────────────────────────────────
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
      const res  = await u38Api.get(`/detaildata?newsid=${id}`);
      const data = res.data;
      const article =
        data?.detailnews?.detailpage?.[0] ||
        data?.detailpage?.[0] ||
        data?.newsdetail?.[0] ||
        data?.detail?.[0] ||
        (Array.isArray(data) ? data[0] : null) ||
        null;
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

  // ─── Share ────────────────────────────────────────────────────────────────
  const getShareUrl = () => {
    const slug     = detail?.slug     || newsItem?.slug     || '';
    const shareUrl = detail?.shareurl || newsItem?.shareurl || '';
    return shareUrl || (slug ? `https://www.dinamalar.com${slug}` : 'https://www.dinamalar.com');
  };

  const handleShare = async () => {
    try {
      const url   = getShareUrl();
      const ttl   = detail?.newstitle || newsItem?.newstitle || 'தினமலர் செய்தி';
      await Share.share({ title: ttl, message: `${ttl}\n\n${url}`, url });
    } catch (err) { console.error('Share error:', err); }
  };

  const handleOpenBrowser = () => Linking.openURL(getShareUrl());

  // ─── Derived values ───────────────────────────────────────────────────────
  const d   = detail   || {};
  const ni  = newsItem || {};

  const title     = d.newstitle       || ni.newstitle    || ni.title   || '';
  const image     = d.largeimages     || d.images        || ni.largeimages || ni.images || '';
  const catKey    = d.maincat         || ni.maincat      || '';
  const ago       = d.ago             || ni.ago          || '';
  const date      = d.standarddate    || ni.standarddate || '';
  const content   = d.newsdescription || d.content       || ni.content || '';
  const videoPath = d.path            || ni.path         || '';

  const isVideo   = catKey === 'video' || videoPath?.includes('youtube');
  // isPodcast: true for podcast category OR when audio flag is set
  const isPodcast = catKey === 'podcast' || d.audio === '1' || d.audio === 1;

  const comments  = parseInt(d.newscomment || d.nmcomment || 0);
  const relatedNews = Array.isArray(d.relateddata) ? d.relateddata
    : Array.isArray(d.related)     ? d.related
    : Array.isArray(d.relatedNews) ? d.relatedNews : [];
  const tags      = Array.isArray(d.tags) ? d.tags : [];

  const ytId    = getYouTubeId(videoPath);
  const ytThumb = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '';

  const currentNewsId = newsId || newsItem?.id || newsItem?.newsid;

  // ── Audio URL for podcast: videoPath is the stream URL
  const podcastAudioUrl = videoPath || d.audiofile || d.audiourl || null;

  // ── Standalone audio (non-podcast articles with audio field)
  const hasAudio  = !isPodcast && d.audio && d.audio !== '0' && d.audio !== 0;
  const audioUrl  = d.audiofile || d.audiourl || d.audio_url ||
    (typeof d.audio === 'string' && d.audio.startsWith('http') ? d.audio : null);

  // ── RenderHtml ────────────────────────────────────────────────────────────
  const BASE_FONT  = sf(16);
  const tagsStyles = React.useMemo(() => buildTagsStyles(BASE_FONT, COLORS.text), [BASE_FONT]);
  const baseStyle  = React.useMemo(() => buildBaseStyle(BASE_FONT, COLORS.text),  [BASE_FONT]);
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

      {/* Loading */}
      {loading && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* Title */}
          <Text style={[styles.title, { fontSize: sf(20), lineHeight: sf(28) }]}>{title}</Text>

          {/* Meta row */}
          <View style={styles.metaRow}>
            {/* {!!ago && (
              <View style={styles.metaChip}>
                <Ionicons name="time-outline" size={11} color={COLORS.subtext} />
                <Text style={[styles.metaChipTxt, { fontSize: sf(10) }]}>{ago}</Text>
              </View>
            )}
            {!!date && !ago && (
              <View style={styles.metaChip}>
                <Ionicons name="calendar-outline" size={11} color={COLORS.subtext} />
                <Text style={[styles.metaChipTxt, { fontSize: sf(10) }]}>{date}</Text>
              </View>
            )} */}
            <View style={{ flex: 1 }} />
            {!disableComments && (
              <TouchableOpacity style={styles.iconAction} onPress={() => setCommentsVisible(true)}>
                <Ionicons name="chatbox" size={s(20)} color={COLORS.subtext} />
                {comments > 0 && <Text style={[styles.iconBadge, { fontSize: sf(10) }]}>{comments}</Text>}
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.iconAction} onPress={() => setBookmarked(p => !p)}>
              <Ionicons
                name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                size={s(20)}
                color={bookmarked ? COLORS.primary : COLORS.subtext}
              />
            </TouchableOpacity>
          </View>

          {/* Hero image — hidden for podcast (artwork shown in podcast card) */}
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

          {/* ── PODCAST — artwork card + inline AudioPlayer (no browser redirect) ── */}
          {isPodcast && !!podcastAudioUrl && (
            <View style={styles.podcastSection}>
              {/* Artwork card */}
              <View style={styles.podcastCard}>
                <View style={styles.podcastArtwork}>
                  {!!image ? (
                    <Image source={{ uri: image }} style={styles.podcastArtworkImg} resizeMode="cover" />
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
              {/* Inline player — plays without leaving the screen */}
              {/* <AudioPlayer audioUrl={podcastAudioUrl} label="Podcast கேளுங்கள்" /> */}
            </View>
          )}

          {/* Standalone audio (non-podcast articles) */}
          {/* {hasAudio && !!audioUrl && (
            <AudioPlayer audioUrl={audioUrl} label="கேளுங்கள்" />
          )} */}

          {/* Article HTML content */}
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
                  a:   { onPress: (_event, href) => { if (href) Linking.openURL(href); } },
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
                  <View key={`tag-${i}-${typeof tag === 'string' ? tag : tag?.title || ''}`} style={styles.tagChip}>
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

          {/* Related news */}
          {relatedNews.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={[styles.relatedTitle, { fontSize: sf(18) }]}>தொடர்புடைய செய்திகள்</Text>
              {relatedNews.map((rel, i) => {
                const relId = rel.id || rel.newsid;
                return (
                  <TouchableOpacity
                    key={`related-${i}-${relId || 'no-id'}`}
                    style={styles.relatedCard}
                    onPress={() => navigation.push('NewsDetailsScreen', { newsId: relId, newsItem: rel })}
                  >
                    {!!rel.images && (
                      <Image source={{ uri: rel.images }} style={styles.relatedImg} resizeMode="cover" />
                    )}
                    <View style={styles.relatedBody}>
                      <Text style={[styles.relatedCat, { fontSize: sf(10) }]}>{rel.categrorytitle || rel.maincat || ''}</Text>
                      <Text style={[styles.relatedItemTitle, { fontSize: sf(13), lineHeight: sf(19) }]} numberOfLines={3}>
                        {rel.newstitle || rel.title || ''}
                      </Text>
                      <Text style={[styles.relatedDate, { fontSize: sf(10) }]}>{rel.standarddate || rel.ago || ''}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={{ height: vs(40) }} />
        </ScrollView>
      )}

      {/* Comments Modal */}
      {!disableComments && (
        <CommentsModal
          visible={commentsVisible}
          onClose={() => setCommentsVisible(false)}
          newsId={currentNewsId}
          newsTitle={title}
          commentCount={comments}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'android' ? vs(30) : 0,
  },
  scrollContent: { paddingBottom: vs(20) },

  title: {
    fontSize: scaledSizes.font.xl, fontWeight: '800', color: COLORS.text,
    lineHeight: scaledSizes.lineHeight.xl,
    paddingHorizontal: s(16), paddingTop: vs(12), paddingBottom: vs(8),
  },

  metaRow: {
    flexDirection: 'row', alignItems: 'center', gap: s(8),
    paddingHorizontal: s(16), marginBottom: vs(12), flexWrap: 'wrap',
  },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: s(3),
    backgroundColor: '#f5f5f5', paddingHorizontal: s(8),
    paddingVertical: vs(3), borderRadius: s(10),
  },
  metaChipTxt: { fontSize: 10, color: COLORS.subtext },
  iconAction:  { flexDirection: 'row', alignItems: 'center', gap: s(3), padding: s(4) },
  iconBadge:   { fontSize: 10, color: COLORS.subtext, fontWeight: '600' },

  heroWrap:  { marginHorizontal: s(16), marginBottom: vs(12) },
  heroImage: { width: '100%', height: ms(210), backgroundColor: '#f0f0f0' },
  caption:   { fontSize: 10, color: COLORS.subtext, fontStyle: 'italic', marginTop: vs(4), textAlign: 'center' },

  videoWrap: {
    marginHorizontal: s(16), height: ms(200), backgroundColor: '#1a1a2e',
    borderRadius: s(10), justifyContent: 'center', alignItems: 'center',
    marginBottom: vs(12), overflow: 'hidden',
  },
  ytThumb:       { position: 'absolute', width: '100%', height: '100%' },
  ytPlayOverlay: { position: 'absolute', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.35)', width: '100%', height: '100%' },
  videoTxt:      { fontSize: scaledSizes.font.sm, color: '#fff', fontWeight: '600', marginTop: vs(8) },

  // ── Podcast ──────────────────────────────────────────────────────────────
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
  podcastArtworkImg:      { width: '100%', height: '100%' },
  podcastArtworkFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  podcastInfo:     { flex: 1 },
  podcastBadge: {
    flexDirection: 'row', alignItems: 'center', gap: s(4),
    backgroundColor: '#9c27b0', alignSelf: 'flex-start',
    paddingHorizontal: s(7), paddingVertical: vs(2),
    borderRadius: s(8), marginBottom: vs(6),
  },
  podcastBadgeTxt:  { color: '#fff', fontSize: ms(8), fontWeight: '800', letterSpacing: 0.5 },
  podcastCardTitle: { fontSize: ms(13), fontWeight: '700', color: COLORS.text, lineHeight: ms(18), marginBottom: vs(4) },
  podcastCardDate:  { fontSize: ms(10), color: COLORS.subtext },

  contentSection: { paddingHorizontal: s(16), marginBottom: vs(16) },

  tagsSection:      { paddingHorizontal: s(16), marginBottom: vs(16) },
  tagsSectionTitle: { fontSize: scaledSizes.font.sm, fontWeight: '700', color: COLORS.text, marginBottom: vs(8) },
  tagsWrap:         { flexDirection: 'row', flexWrap: 'wrap', gap: s(6) },
  tagChip: {
    backgroundColor: COLORS.primary + '15', paddingHorizontal: s(10),
    paddingVertical: vs(4), borderRadius: s(14),
    borderWidth: 1, borderColor: COLORS.primary + '30',
  },
  tagTxt: { fontSize: 10, color: COLORS.primary, fontWeight: '600' },

  shareBar: {
    flexDirection: 'row', alignItems: 'center', gap: s(10),
    marginHorizontal: s(16), marginBottom: vs(20),
    paddingVertical: vs(12), borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f0f0f0',
  },
  shareBarTitle: { flex: 1, fontSize: scaledSizes.font.sm, fontWeight: '700', color: COLORS.text },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: s(4),
    backgroundColor: COLORS.primary + '12', paddingHorizontal: s(12),
    paddingVertical: vs(6), borderRadius: s(16),
  },
  shareBtnTxt: { fontSize: scaledSizes.font.sm, color: COLORS.primary, fontWeight: '600' },

  relatedSection: { paddingHorizontal: s(16), marginBottom: vs(16) },
  relatedTitle: {
    fontSize: scaledSizes.font.lg, fontWeight: '700', color: COLORS.text,
    marginBottom: vs(12), paddingBottom: vs(8),
    borderBottomWidth: 2, borderBottomColor: COLORS.primary,
  },
  relatedCard: {
    flexDirection: 'row', backgroundColor: COLORS.white, borderRadius: s(8),
    marginBottom: vs(10), overflow: 'hidden', borderWidth: 1, borderColor: '#f0f0f0',
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: s(1) },
    shadowOpacity: 0.05, shadowRadius: s(3),
  },
  relatedImg:       { width: s(95), height: vs(72), backgroundColor: '#f0f0f0' },
  relatedBody:      { flex: 1, padding: s(10) },
  relatedCat:       { fontSize: 9, color: COLORS.primary, fontWeight: '700', textTransform: 'uppercase', marginBottom: vs(3) },
  relatedItemTitle: { fontSize: scaledSizes.font.sm, fontWeight: '600', color: COLORS.text, lineHeight: scaledSizes.lineHeight.md, marginBottom: vs(4) },
  relatedDate:      { fontSize: 9, color: COLORS.subtext },

  errorWrap:   { flex: 1, justifyContent: 'center', alignItems: 'center', padding: s(32) },
  errorTxt:    { fontSize: scaledSizes.font.md, color: COLORS.subtext, textAlign: 'center', marginTop: vs(12), marginBottom: vs(20), lineHeight: scaledSizes.lineHeight.lg },
  retryBtn:    { backgroundColor: COLORS.primary, paddingHorizontal: s(24), paddingVertical: vs(10), borderRadius: s(8) },
  retryBtnTxt: { fontSize: scaledSizes.font.md, color: '#fff', fontWeight: '700' },

  loaderContainer:    { flex: 1, backgroundColor: COLORS.white, paddingHorizontal: s(16), paddingTop: vs(16) },
  skeletonTitle:      { height: vs(28), backgroundColor: '#f0f0f0', borderRadius: s(6), marginBottom: vs(8), width: '92%' },
  skeletonTitleShort: { height: vs(28), backgroundColor: '#f0f0f0', borderRadius: s(6), marginBottom: vs(12), width: '75%' },
  skeletonMeta:       { flexDirection: 'row', alignItems: 'center', gap: s(8), marginBottom: vs(16) },
  skeletonChip:       { height: vs(22), backgroundColor: '#f5f5f5', borderRadius: s(10), width: s(80) },
  skeletonImage:      { height: ms(210), backgroundColor: '#f0f0f0', borderRadius: s(8), marginBottom: vs(16) },
  skeletonContent:    { marginBottom: vs(16), gap: vs(8) },
  skeletonLine:       { height: vs(13), backgroundColor: '#f0f0f0', borderRadius: 4 },
  skeletonTags:       { flexDirection: 'row', gap: s(8), marginBottom: vs(16) },
  skeletonTag:        { height: vs(24), backgroundColor: '#f0f0f0', borderRadius: s(12), width: s(60) },
  skeletonShare:      { height: vs(44), backgroundColor: '#f0f0f0', borderRadius: s(8), marginBottom: vs(20) },
});