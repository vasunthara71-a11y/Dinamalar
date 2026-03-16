// screens/VideoDetailScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Share,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RenderHtml from 'react-native-render-html';
import { WebView } from 'react-native-webview';
import YoutubePlayer from 'react-native-youtube-iframe';
import { ms, s, vs } from '../utils/scaling';
import { u38Api } from '../config/api';
import { FONTS } from '../utils/constants';
import { useFontSize } from '../context/FontSizeContext';
import AppHeaderComponent from '../components/AppHeaderComponent';
import DrawerMenu from '../components/DrawerMenu';
import LocationDrawer from '../components/LocationDrawer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIDEO_HEIGHT = (SCREEN_WIDTH * 9) / 16;

const PALETTE = {
  grey100: '#F9FAFB', grey200: '#F4F6F8', grey300: '#DFE3E8',
  grey400: '#C4CDD5', grey500: '#919EAB', grey600: '#637381',
  grey700: '#637381', grey800: '#212B36',
  white: '#FFFFFF', red: '#E63946', dark: '#1A1A1A', primary: '#096dd2',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getYouTubeId(url) {
  if (!url) return null;
  const str = String(url).trim();
  const patterns = [
    /youtu\.be\/([^?&\s]+)/,
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtube\.com\/embed\/([^?&\s]+)/,
    /youtube\.com\/shorts\/([^?&\s]+)/,
    /youtube-nocookie\.com\/embed\/([^?&\s]+)/,
  ];
  for (const re of patterns) {
    const m = str.match(re);
    if (m?.[1]) return m[1];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
  return null;
}

// ─── Non-YouTube inline player (vidgyor / mp4 / etc.) ────────────────────────
function buildIframeHtml(url = '', video = null) {
  let iframeSrc = url;

  const isDirectVideo = /\.(mp4|webm|ogg|m3u8)(\?|$)/i.test(url);
  if (isDirectVideo) {
    return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
      video { width: 100%; height: 100%; object-fit: contain; }
    </style>
  </head>
  <body>
    <video src="${url}" autoplay controls playsinline preload="auto"></video>
  </body>
</html>`;
  }

  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
      iframe { width: 100%; height: 100%; border: none; display: block; }
    </style>
  </head>
  <body>
    <iframe
      src="${iframeSrc}"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowfullscreen
    ></iframe>
  </body>
</html>`;
}

const getTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) { const m = Math.floor(diff / 60); return `${m}m ago`; }
  if (diff < 86400) { const h = Math.floor(diff / 3600); return `${h}h ago`; }
  return dateStr.split(' ')[0];
};

const PlayIcon = ({ size = 52 }) => (
  <View style={[styles.playCircle, { width: size, height: size, borderRadius: size / 2 }]}>
    <View style={[styles.playTriangle, {
      borderTopWidth: size * 0.22, borderBottomWidth: size * 0.22,
      borderLeftWidth: size * 0.36, marginLeft: size * 0.07,
    }]} />
  </View>
);

const SectionHeader = ({ title, sf }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionAccent} />
    <Text style={[styles.sectionTitle, { fontSize: sf(15) }]}>{title}</Text>
  </View>
);

const RelatedCard = ({ video, onPress, sf }) => {
  if (!video || video.type === 'reels' || video.type === 'googlead') return null;
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => onPress?.(video)} style={styles.relatedCard}>
      <View style={styles.relatedThumb}>
        {video.images
          ? <Image source={{ uri: video.images }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : <View style={[StyleSheet.absoluteFill, styles.thumbPlaceholder]}>
            <Text style={{ fontSize: ms(22) }}>🎬</Text>
          </View>
        }
        <View style={styles.relatedOverlay} />
        <View style={styles.relatedPlay}><PlayIcon size={24} /></View>
        {!!video.duration && (
          <View style={styles.durationBadge}>
            <Text style={[styles.durationText, { fontSize: sf(10) }]}>{video.duration}</Text>
          </View>
        )}
      </View>
      <View style={styles.relatedInfo}>
        <Text style={[styles.relatedTitle, { fontSize: sf(13), lineHeight: sf(18) }]} numberOfLines={2}>
          {video.videotitle}
        </Text>
        <View style={styles.relatedMeta}>
          {!!video.ctitle && (
            <View style={styles.categoryPill}>
              <Text style={[styles.categoryPillText, { fontSize: sf(10) }]}>{video.ctitle}</Text>
            </View>
          )}
          <Text style={[styles.metaDate, { fontSize: sf(11) }]}>
            {video.standarddate || getTimeAgo(video.videodate)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const SocialBtn = ({ icon, color, bg, onPress }) => (
  <TouchableOpacity style={[styles.socialBtn, { backgroundColor: bg }]} onPress={onPress} activeOpacity={0.8}>
    <Text style={[styles.socialBtnIcon, { color }]}>{icon}</Text>
  </TouchableOpacity>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────
const VideoDetailScreen = ({ navigation, route }) => {
  const { sf } = useFontSize();

  const passedVideo = route?.params?.video ?? null;
  const videoId = passedVideo?.videoid ?? route?.params?.videoId ?? null;

  const [latestvideo, setLatestvideo] = useState(null);
  const [relatedVideos, setRelatedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isLocationDrawerVisible, setIsLocationDrawerVisible] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('உள்ளூர்');

  // ── Player state ────────────────────────────────────────────────────────────
  // activeYtId   → non-null means YouTube player is showing
  // activeRawUrl → non-null means WebView iframe player is showing
  const [activeYtId, setActiveYtId] = useState(null);
  const [activeRawUrl, setActiveRawUrl] = useState(null);
  const [ytPlaying, setYtPlaying] = useState(false);

  const scrollRef = useRef(null);

  const fetchDetail = useCallback(async (id) => {
    if (!id) { setError('Video ID not found'); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await u38Api.get(`/videodetail?id=${id}`);
      const data = res.data;
      if (data?.latestvideo) setLatestvideo(data.latestvideo);
      const related = data?.videomix?.data ?? [];
      setRelatedVideos(
        related.filter(v =>
          v?.type !== 'reels' &&
          v?.type !== 'googlead' &&
          String(v?.videoid) !== String(id)
        )
      );
    } catch (err) {
      console.error('VideoDetailScreen:', err?.message);
      setError(err?.message || 'பிழை ஏற்பட்டது');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLatestvideo(null);
    setRelatedVideos([]);
    setActiveYtId(null);
    setActiveRawUrl(null);
    setYtPlaying(false);
    fetchDetail(videoId);
  }, [videoId]);

  const video = latestvideo ?? passedVideo;
  const rawUrl = video?.videopath ?? video?.y_path ?? video?.vidg_path ?? null;
  const ytId = getYouTubeId(rawUrl);
  const bodyText = video?.videodescription ?? '';
  const timeAgo = getTimeAgo(video?.videodate);
  const shareUrl = video?.slug
    ? `https://www.dinamalar.com${video.slug}`
    : `https://www.dinamalar.com/video/${videoId}`;

  // ── Play main video ────────────────────────────────────────────────────────
  const handlePlayVideo = () => {
    if (!rawUrl) return;
    if (ytId) {
      // Use react-native-youtube-iframe → plays in same screen, bypasses Error 153
      setActiveRawUrl(null);
      setActiveYtId(ytId);
      setYtPlaying(true);
    } else {
      // Non-YouTube → WebView iframe
      setActiveYtId(null);
      setActiveRawUrl(rawUrl);
    }
  };

  // ── Related video tap ──────────────────────────────────────────────────────
  const handleRelatedPress = (v) => {
    const relRaw = v?.videopath ?? v?.y_path ?? v?.vidg_path ?? null;
    const relYtId = getYouTubeId(relRaw);
    if (relYtId) {
      setActiveRawUrl(null);
      setActiveYtId(relYtId);
      setYtPlaying(true);
    } else if (relRaw) {
      setActiveYtId(null);
      setActiveRawUrl(relRaw);
    }
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleShare = async () => {
    try { await Share.share({ message: `${video?.videotitle ?? 'Dinamalar Video'}\n${shareUrl}` }); } catch { }
  };

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

  const isPlayerActive = !!activeYtId || !!activeRawUrl;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading && !video) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={PALETTE.white} />
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.navBtn}>
            <Ionicons name="arrow-back" size={22} color={PALETTE.grey800} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { fontSize: sf(15) }]}>வீடியோ</Text>
          <View style={{ width: s(36) }} />
        </View>
        <View style={styles.centeredState}>
          <ActivityIndicator size="large" color={PALETTE.primary} />
          <Text style={[styles.stateText, { fontSize: sf(14) }]}>ஏற்றுகிறது...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !video) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={PALETTE.white} />
        <View style={styles.navbar}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.navBtn}>
            <Ionicons name="arrow-back" size={22} color={PALETTE.grey800} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { fontSize: sf(15) }]}>வீடியோ</Text>
          <View style={{ width: s(36) }} />
        </View>
        <View style={styles.centeredState}>
          <Text style={{ fontSize: ms(40), marginBottom: vs(12) }}>😕</Text>
          <Text style={[styles.stateText, { fontSize: sf(15), color: PALETTE.grey800 }]}>
            வீடியோ ஏற்ற முடியவில்லை
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchDetail(videoId)}>
            <Text style={[styles.retryBtnText, { fontSize: sf(14) }]}>மீண்டும் முயற்சி</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.white} />

      <AppHeaderComponent
        onSearch={() => navigation?.navigate('Search')}
        onMenu={() => setIsDrawerVisible(true)}
        onLocation={() => setIsLocationDrawerVisible(true)}
        selectedDistrict={selectedDistrict}
      />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: vs(80) }}
      >
        {/* ── Video Area ───────────────────────────────────────────────────── */}
        <View style={styles.videoWrapper}>

          {/* ── 1. YouTube player (react-native-youtube-iframe) ─────────────
                   Uses the native YouTube SDK — plays ALL videos including
                   those with embedding disabled (Error 153) ────────────── */}
          {activeYtId ? (
            <YoutubePlayer
              height={VIDEO_HEIGHT}
              width={SCREEN_WIDTH}
              videoId={activeYtId}
              play={ytPlaying}
              onChangeState={(state) => {
                if (state === 'ended') setYtPlaying(false);
              }}
              webViewStyle={{ backgroundColor: '#000' }}
              webViewProps={{
                androidLayerType: 'hardware',
              }}
              initialPlayerParams={{
                preventFullScreen: false,
                rel: false,
                modestbranding: true,
              }}
            />

            /* ── 2. Non-YouTube inline WebView player ──────────────────────── */
          ) : activeRawUrl ? (
            <WebView
              source={{ html: buildIframeHtml(activeRawUrl, video) }}
              style={styles.inlinePlayer}
              allowsFullscreenVideo={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              mediaPlaybackRequiresUserAction={false}
              allowsInlineMediaPlayback={true}
              scrollEnabled={false}
              originWhitelist={['*']}
              backgroundColor="#000000"
              mixedContentMode="always"
              allowsProtectedMedia={true}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.playerLoading}>
                  <ActivityIndicator size="large" color={PALETTE.white} />
                </View>
              )}
            />

            /* ── 3. Thumbnail with play button ─────────────────────────────── */
          ) : (
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={handlePlayVideo}
              style={StyleSheet.absoluteFill}
            >
              {video?.images
                ? <Image source={{ uri: video.images }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                : <View style={[StyleSheet.absoluteFill, styles.thumbPlaceholder]}>
                  <Text style={{ fontSize: ms(52) }}>🎬</Text>
                </View>
              }
              <View style={styles.heroGradient} />
              <View style={styles.heroCenterPlay}><PlayIcon size={s(62)} /></View>

              {!!video?.duration && (
                <View style={styles.heroDuration}>
                  <Text style={[styles.durationText, { fontSize: sf(12) }]}>{video.duration}</Text>
                </View>
              )}
              {/* {!!video?.ctitle && (
                <View style={styles.heroCatBadge}>
                  <Text style={[styles.heroCatText, { fontSize: sf(11) }]}>{video.ctitle}</Text>
                </View>
              )} */}
              {loading && (
                <View style={styles.heroLoadingBadge}>
                  <ActivityIndicator size="small" color={PALETTE.white} />
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* ── Article Body ─────────────────────────────────────────────────── */}
        <View style={styles.articleBody}>
          <Text style={[styles.articleTitle, { fontSize: sf(18), lineHeight: sf(27) }]}>
            {video?.videotitle ?? ''}
          </Text>

          <View style={styles.metaRow}>
            {!!video?.ctitle && (
              <View style={styles.categoryPill}>
                <Text style={[styles.categoryPillText, { fontSize: sf(11) }]}>{video.ctitle}</Text>
              </View>
            )}
            <Text style={[styles.metaDate, { fontSize: sf(12) }]}>
              {video?.standarddate || timeAgo || ''}
            </Text>
          </View>

          {/* <View style={styles.thinDivider} /> */}

          {/* <View style={styles.socialRow}>
            <View style={styles.socialIcons}>
              <SocialBtn icon="f" color="#1877F2" bg="#E7F0FF" onPress={handleShare} />
              <SocialBtn icon="𝕏" color="#000" bg="#F0F0F0" onPress={handleShare} />
              <SocialBtn icon="📱" color="#25D366" bg="#E6F9EE" onPress={handleShare} />
              <SocialBtn icon="✈️" color="#229ED9" bg="#E3F3FC" onPress={handleShare} />
            </View>
            {!!ytId && (
              <TouchableOpacity
                style={styles.ytDirectBtn}
                onPress={handlePlayVideo}
                activeOpacity={0.8}
              >
                <Ionicons name="logo-youtube" size={ms(16)} color="#FF0000" />
                <Text style={[styles.ytDirectText, { fontSize: sf(11) }]}>Play Video</Text>
              </TouchableOpacity>
            )}
          </View> */}

          {/* <View style={styles.thinDivider} /> */}

          {loading && !latestvideo ? (
            <View style={styles.descSkeleton}>
              {[1, 0.9, 0.75].map((w, i) => (
                <View key={i} style={[styles.skeletonLine, { width: `${w * 100}%` }]} />
              ))}
            </View>
          ) : !!bodyText ? (
            <View style={styles.bodySection}>
              <RenderHtml
                contentWidth={SCREEN_WIDTH}
                source={{ html: bodyText }}
                baseStyle={{
                  fontSize: sf(15), lineHeight: sf(28),
                  color: PALETTE.grey800, fontFamily: FONTS.muktaMalar.regular,
                }}
                tagsStyles={{
                  p: { marginVertical: vs(6) },
                  strong: { fontWeight: '700', color: PALETTE.grey800 },
                  em: { fontStyle: 'italic', color: PALETTE.grey700 },
                  a: { color: PALETTE.primary, textDecorationLine: 'underline' },
                  li: { marginVertical: vs(4), color: PALETTE.grey700 },
                  blockquote: {
                    borderLeftWidth: s(3), borderLeftColor: PALETTE.grey300,
                    paddingLeft: s(12), marginVertical: vs(8),
                    fontStyle: 'italic', color: PALETTE.grey600,
                  },
                }}
              />
            </View>
          ) : null}

          <View style={styles.thinDivider} />


        </View>

        {relatedVideos.length > 0 && (
          <View style={styles.relatedSection}>
            <SectionHeader title="மேலும் வீடியோக்கள்" sf={sf} />
            {relatedVideos.map((v, i) => (
              <React.Fragment key={v?.videoid ?? i}>
                <RelatedCard video={v} onPress={handleRelatedPress} sf={sf} />
                {i < relatedVideos.length - 1 && <View style={styles.relatedDivider} />}
              </React.Fragment>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fabUp}
        onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
        activeOpacity={0.85}
      >
        <Ionicons name="arrow-up" size={22} color={PALETTE.white} />
      </TouchableOpacity>

      <DrawerMenu
        isVisible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
        onMenuPress={() => { }}
        navigation={navigation}
      />

      <LocationDrawer
        isVisible={isLocationDrawerVisible}
        onClose={() => setIsLocationDrawerVisible(false)}
        onSelectDistrict={handleSelectDistrict}
        selectedDistrict={selectedDistrict}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.grey100,},
  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: s(8), paddingVertical: vs(8),
    backgroundColor: PALETTE.white, borderBottomWidth: 1, borderBottomColor: PALETTE.grey300,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3,
  },
  navBtn: { padding: s(6), borderRadius: s(8) },
  navTitle: { flex: 1, fontFamily: FONTS.muktaMalar.bold, color: PALETTE.grey800, fontWeight: '700', textAlign: 'center', marginHorizontal: s(8) },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: s(4) },
  scroll: { flex: 1, backgroundColor: PALETTE.grey100 ,},

  videoWrapper: {
    width: SCREEN_WIDTH,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  inlinePlayer: {
    flex: 1,
    backgroundColor: '#000',
  },
  playerLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  heroGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.30)' },
  heroCenterPlay: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -s(31) }, { translateY: -s(31) }] },
  playCircle: { backgroundColor: 'rgba(9,109,210,0.88)', justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.65)' },
  playTriangle: { width: 0, height: 0, borderStyle: 'solid', borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: PALETTE.white },
  tapToPlayHint: { position: 'absolute', bottom: vs(10), alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: s(4), backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: s(10), paddingVertical: vs(3), borderRadius: s(12) },
  tapToPlayText: { color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  heroDuration: { position: 'absolute', bottom: 0, right: s(5), backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: s(7), paddingVertical: vs(2) },
  heroCatBadge: { position: 'absolute', top: vs(10), left: s(10), backgroundColor: PALETTE.primary, paddingHorizontal: s(10), paddingVertical: vs(3), borderRadius: s(4) },
  heroCatText: { color: PALETTE.white, fontWeight: '700', fontFamily: FONTS.muktaMalar.semibold },
  heroLoadingBadge: { position: 'absolute', bottom: vs(10), left: s(10), backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: s(12), padding: s(6) },
  durationBadge: { position: 'absolute', bottom: 0, right: s(5), backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: s(7), paddingVertical: vs(2) },
  durationText: { color: PALETTE.white, fontWeight: '700', fontFamily: FONTS.muktaMalar.bold },
  thumbPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#2A2A2A' },

  articleBody: { backgroundColor: PALETTE.white, paddingHorizontal: s(14), paddingTop: vs(14), paddingBottom: vs(4) },
  articleTitle: { fontFamily: FONTS.muktaMalar.bold, color: PALETTE.grey800, fontWeight: '800', marginBottom: vs(10) },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: vs(10) },
  categoryPill: { paddingHorizontal: s(10), paddingVertical: vs(2), borderWidth: 1, borderColor: PALETTE.grey400, },
  categoryPillText: { color: PALETTE.grey600, fontWeight: '600', fontFamily: FONTS.muktaMalar.semibold },
  metaDate: { color: PALETTE.grey500, fontFamily: FONTS.muktaMalar.regular },
  thinDivider: { height: 1, backgroundColor: PALETTE.grey300, marginVertical: vs(10) },
  socialRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: vs(4) },
  socialIcons: { flexDirection: 'row', gap: s(8) },
  socialBtn: { width: s(36), height: s(36), borderRadius: s(18), alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  socialBtnIcon: { fontSize: ms(16), fontWeight: '800' },
  ytDirectBtn: { flexDirection: 'row', alignItems: 'center', gap: s(4), paddingHorizontal: s(10), paddingVertical: vs(6), borderRadius: s(8), borderWidth: 1, borderColor: '#FFD0D0', backgroundColor: '#FFF5F5' },
  ytDirectText: { color: '#CC0000', fontWeight: '700', fontFamily: FONTS.muktaMalar.bold },
  descSkeleton: { marginVertical: vs(10), gap: vs(10) },
  skeletonLine: { height: vs(14), backgroundColor: PALETTE.grey300, borderRadius: s(4) },
  bodySection: { marginVertical: vs(4) },
  relatedSection: { backgroundColor: PALETTE.white, marginTop: vs(6), paddingBottom: vs(8) },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: s(14), paddingVertical: vs(12), borderBottomWidth: 1, borderBottomColor: PALETTE.grey300 },
  sectionAccent: { width: s(4), height: vs(18), backgroundColor: PALETTE.primary, borderRadius: s(2), marginRight: s(8) },
  sectionTitle: { fontFamily: FONTS.muktaMalar.bold, fontWeight: '800', color: PALETTE.grey800 },
  relatedCard: { flexDirection: 'row', paddingHorizontal: s(14), paddingVertical: vs(10), backgroundColor: PALETTE.white },
  relatedThumb: { width: s(120), height: vs(72), backgroundColor: PALETTE.dark, position: 'relative', overflow: 'hidden', borderRadius: s(4), flexShrink: 0 },
  relatedOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.22)' },
  relatedPlay: { position: 'absolute', bottom: vs(5), left: s(5) },
  relatedInfo: { flex: 1, marginLeft: s(10), justifyContent: 'space-between' },
  relatedTitle: { fontFamily: FONTS.muktaMalar.semibold, color: PALETTE.grey800, fontWeight: '600' },
  relatedMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: vs(4) },
  relatedDivider: { height: 1, backgroundColor: PALETTE.grey200, marginHorizontal: s(14) },
  centeredState: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: PALETTE.grey100, gap: vs(12) },
  stateText: { color: PALETTE.grey600, fontFamily: FONTS.muktaMalar.regular },
  retryBtn: { marginTop: vs(16), backgroundColor: PALETTE.primary, borderRadius: s(8), paddingHorizontal: s(20), paddingVertical: vs(10) },
  retryBtnText: { color: PALETTE.white, fontWeight: '700', fontFamily: FONTS.muktaMalar.bold },
  fabUp: { position: 'absolute', bottom: vs(24), right: s(20), width: s(48), height: s(48), borderRadius: s(24), backgroundColor: PALETTE.primary, alignItems: 'center', justifyContent: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6 },
});

export default VideoDetailScreen;