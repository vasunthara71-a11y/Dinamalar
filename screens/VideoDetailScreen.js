// screens/VideoDetailScreen.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator, Share,
  Dimensions, PanResponder, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RenderHtml from 'react-native-render-html';
import { WebView } from 'react-native-webview';
import YoutubePlayer from 'react-native-youtube-iframe';
import { ms, s, vs } from '../utils/scaling';
import { CDNApi } from '../config/api';
import { FONTS } from '../utils/constants';
import { useFontSize } from '../context/FontSizeContext';
import AppHeaderComponent from '../components/AppHeaderComponent';
import DrawerMenu from '../components/DrawerMenu';
import LocationDrawer from '../components/LocationDrawer';
import CommentsModal from '../components/CommentsModal';

const { width: SW, height: SH } = Dimensions.get('window');
const VH  = (SW * 9) / 16;
const PW  = SW * 0.58;
const PH  = (PW * 9) / 16;
const PM  = s(12);

// PiP resting position (top-left corner of the pip box)
const PIP_X = SW - PW - PM;
const PIP_Y = SH * 0.52;

const PALETTE = {
  grey100:'#F9FAFB', grey200:'#F4F6F8', grey300:'#DFE3E8',
  grey400:'#C4CDD5', grey500:'#919EAB', grey600:'#637381',
  grey700:'#637381', grey800:'#212B36',
  white:'#FFFFFF', red:'#E63946', dark:'#1A1A1A', primary:'#096dd2',
};

function getYouTubeId(url) {
  if (!url) return null;
  const str = String(url).trim();
  for (const re of [
    /youtu\.be\/([^?&\s]+)/,
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtube\.com\/embed\/([^?&\s]+)/,
    /youtube\.com\/shorts\/([^?&\s]+)/,
    /youtube-nocookie\.com\/embed\/([^?&\s]+)/,
  ]) { const m = str.match(re); if (m?.[1]) return m[1]; }
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
  return null;
}

function buildIframeHtml(url = '') {
  if (/\.(mp4|webm|ogg|m3u8)(\?|$)/i.test(url))
    return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;background:#000;overflow:hidden}video{width:100%;height:100%;object-fit:contain}</style></head><body><video src="${url}" autoplay controls playsinline preload="auto"></video></body></html>`;
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;background:#000;overflow:hidden}iframe{width:100%;height:100%;border:none;display:block}</style></head><body><iframe src="${url}" frameborder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture;fullscreen" allowfullscreen></iframe></body></html>`;
}

const getTimeAgo = (d) => {
  if (!d) return '';
  const diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return String(d).split(' ')[0];
};

const PlayIcon = ({ size = 52 }) => (
  <View style={[S.playCircle, { width:size, height:size, borderRadius:size/2 }]}>
    <View style={[S.playTriangle, { borderTopWidth:size*.22, borderBottomWidth:size*.22, borderLeftWidth:size*.36, marginLeft:size*.07 }]} />
  </View>
);

const SectionHeader = ({ title, sf }) => (
  <View style={S.secHeader}>
    <View style={S.secAccent} />
    <Text style={[S.secTitle, { fontSize:sf(15) }]}>{title}</Text>
  </View>
);

const RelatedCard = ({ video, onPress, sf }) => {
  if (!video || video.type==='reels' || video.type==='googlead') return null;
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => onPress?.(video)} style={S.relCard}>
      <View style={S.relThumb}>
        {video.images
          ? <Image source={{ uri:video.images }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          : <View style={[StyleSheet.absoluteFill, S.thumbPh]}><Text style={{ fontSize:ms(22) }}>🎬</Text></View>}
        <View style={S.relOverlay} />
        <View style={S.relPlay}><PlayIcon size={24} /></View>
        {!!video.duration && <View style={S.durBadge}><Text style={[S.durTxt, { fontSize:sf(10) }]}>{video.duration}</Text></View>}
      </View>
      <View style={S.relInfo}>
        <Text style={[S.relTitle, { fontSize:sf(13), lineHeight:sf(18) }]} numberOfLines={2}>{video.videotitle}</Text>
        <View style={S.relMeta}>
          {!!video.ctitle && <View style={S.catPill}><Text style={[S.catTxt, { fontSize:sf(10) }]}>{video.ctitle}</Text></View>}
          <Text style={[S.metaDate, { fontSize:sf(11) }]}>{video.standarddate || getTimeAgo(video.videodate)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const VideoDetailScreen = ({ navigation, route }) => {
  const { sf } = useFontSize();
  const passedVideo = route?.params?.video ?? null;
  const videoId     = passedVideo?.videoid ?? route?.params?.videoId ?? null;

  const [latestvideo,  setLatestvideo]  = useState(null);
  const [relatedVideos,setRelatedVideos]= useState([]);
  const [videoComments, setVideoComments] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [bookmarked,   setBookmarked]   = useState(false);
  const [isDrawerOpen,    setIsDrawerOpen]    = useState(false);
  const [isLocDrawerOpen, setIsLocDrawerOpen] = useState(false);
  const [district,        setDistrict]        = useState('உள்ளூர்');
  const [isCommentsOpen,  setIsCommentsOpen]  = useState(false);
  const [activeYtId,   setActiveYtId]   = useState(null);
  const [activeRawUrl, setActiveRawUrl] = useState(null);
  const [pip,          setPip]          = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const pipRef    = useRef(false);
  const scrollRef = useRef(null);
  const slotY     = useRef(0);
  const headerH   = useRef(0);
  useEffect(() => { pipRef.current = pip; }, [pip]);

  // ── The TRICK: player is always SW×VH, absolutely placed.
  //    Full  → left=0,     top=headerH  (no transform needed)
  //    PiP   → left=PIP_X, top=PIP_Y   (animated via left/top, useNativeDriver:false
  //                                      but ONLY left/top change — not width/height)
  //
  //    During drag we use translateX/translateY (useNativeDriver:true) for 60fps feel.
  //    On release we flatten offset back into left/top.

  const aLeft = useRef(new Animated.Value(0)).current;
  const aTop  = useRef(new Animated.Value(0)).current;
  // For drag only — translate on top of left/top
  const aDX   = useRef(new Animated.Value(0)).current;
  const aDY   = useRef(new Animated.Value(0)).current;

  // Current resting position of pip box (top-left corner)
  const restPos = useRef({ x: PIP_X, y: PIP_Y });

  // ── PanResponder ──────────────────────────────────────────────────────────
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => pipRef.current,
    onMoveShouldSetPanResponder:  () => pipRef.current,
    onPanResponderGrant: () => {
      aDX.setValue(0);
      aDY.setValue(0);
    },
    onPanResponderMove: Animated.event(
      [null, { dx: aDX, dy: aDY }],
      { useNativeDriver: false }   // must be false because it drives layout left/top indirectly
    ),
    onPanResponderRelease: (_, g) => {
      const nx  = restPos.current.x + g.dx;
      const ny  = Math.min(Math.max(restPos.current.y + g.dy, vs(60)), SH - PH - vs(40));
      const sx  = nx + PW / 2 < SW / 2 ? PM : SW - PW - PM;
      restPos.current = { x: sx, y: ny };
      // Reset drag delta
      aDX.setValue(0);
      aDY.setValue(0);
      // Snap left/top to new resting position
      Animated.parallel([
        Animated.spring(aLeft, { toValue: sx, useNativeDriver: false, friction: 6, tension: 50 }),
        Animated.spring(aTop,  { toValue: ny, useNativeDriver: false, friction: 6, tension: 50 }),
      ]).start();
    },
  })).current;

  // ── Go to PiP ─────────────────────────────────────────────────────────────
  const goPip = useCallback(() => {
    restPos.current = { x: PIP_X, y: PIP_Y };
    aDX.setValue(0); aDY.setValue(0);
    Animated.parallel([
      Animated.spring(aLeft, { toValue: PIP_X, useNativeDriver: false, friction: 8, tension: 70 }),
      Animated.spring(aTop,  { toValue: PIP_Y, useNativeDriver: false, friction: 8, tension: 70 }),
    ]).start();
  }, []);

  // ── Go to Full ────────────────────────────────────────────────────────────
  const goFull = useCallback(() => {
    aDX.setValue(0); aDY.setValue(0);
    Animated.parallel([
      Animated.spring(aLeft, { toValue: 0,               useNativeDriver: false, friction: 8, tension: 70 }),
      Animated.spring(aTop,  { toValue: headerH.current, useNativeDriver: false, friction: 8, tension: 70 }),
    ]).start();
  }, []);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchDetail = useCallback(async (id) => {
    if (!id) { setError('Video ID not found'); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      console.log('[VideoDetail] fetching video with ID:', id);
      const res  = await CDNApi.get(`/videodetail?id=${id}`);
      const data = res.data;
      console.log('[VideoDetail] full API response:', JSON.stringify(data, null, 2));
      console.log('[VideoDetail] latestvideo keys:', data?.latestvideo ? Object.keys(data.latestvideo) : 'no latestvideo');
      
      if (data?.latestvideo) setLatestvideo(data.latestvideo);
      if (data?.comments?.data) setVideoComments(data.comments.data);
      console.log('[VideoDetail] comments structure:', data?.comments);
      console.log('[VideoDetail] comments data:', data?.comments?.data);
      console.log('[VideoDetail] alternative comment paths:', {
        'data.comments': data?.comments,
        'data.comments.data': data?.comments?.data,
        'data.latestvideo.comments': data?.latestvideo?.comments,
        'data.latestvideo.comments.data': data?.latestvideo?.comments?.data,
        'data.data': data?.data,
        'data.result': data?.result,
        'data.items': data?.items,
      });
      setRelatedVideos((data?.videomix?.data ?? []).filter(v =>
        v?.type !== 'reels' && v?.type !== 'googlead' && String(v?.videoid) !== String(id)
      ));
    } catch (err) { setError(err?.message || 'பிழை ஏற்பட்டது'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    setLatestvideo(null); setRelatedVideos([]);
    setActiveYtId(null); setActiveRawUrl(null);
    setPip(false);
    setVideoComments([]);
    fetchDetail(videoId);
  }, [videoId]);

  const video    = latestvideo ?? passedVideo;
  const rawUrl   = video?.videopath ?? video?.y_path ?? video?.vidg_path ?? null;
  const ytId     = getYouTubeId(rawUrl);
  const bodyText = video?.videodescription ?? '';
  const timeAgo  = getTimeAgo(video?.videodate);
  const commentCount = parseInt(video?.nmcomment || 0);
  const shareUrl = video?.slug ? `https://www.dinamalar.com${video.slug}` : `https://www.dinamalar.com/video/${videoId}`;
  const isPlayerActive = !!(activeYtId || activeRawUrl);

  // Extract comments from the API response that's already loaded
  const comments = latestvideo ? [] : (passedVideo?.comments?.data || []);

  // ── Start video ────────────────────────────────────────────────────────────
  const startVideo = useCallback((yId, rUrl) => {
    if (yId) { setActiveRawUrl(null); setActiveYtId(yId); }
    else if (rUrl) { setActiveYtId(null); setActiveRawUrl(rUrl); }
    else return;
    setPip(false);
    aDX.setValue(0); aDY.setValue(0);
    aLeft.setValue(0);
    aTop.setValue(headerH.current);
  }, []);

  // Log video object keys to find the correct ID for comments
  useEffect(() => {
    if (video) {
      console.log('[VideoDetail] video keys:', Object.keys(video));
      console.log('[VideoDetail] IDs:', { videoid: video.videoid, newsid: video.newsid, id: video.id, nmcomment: video.nmcomment });
    }
  }, [video]);

  const handlePlayVideo = () => startVideo(ytId, rawUrl);

  // ── Scroll: two-way pip/full ───────────────────────────────────────────────
  const onScroll = useCallback((e) => {
    if (!isPlayerActive) return;
    const past = e.nativeEvent.contentOffset.y > slotY.current + VH - s(20);
    if (past && !pipRef.current)  { setPip(true);  goPip();  }
    if (!past && pipRef.current)  { setPip(false); goFull(); }
  }, [isPlayerActive, goPip, goFull]);

  const expandPip = () => { setPip(false); goFull(); scrollRef.current?.scrollTo({ y:0, animated:true }); };
  const closePip  = () => { setActiveYtId(null); setActiveRawUrl(null); setPip(false); aDX.setValue(0); aDY.setValue(0); };

  const handleRelatedPress = async (v) => {
    if (!v?.videoid) return;
    try {
      const res  = await CDNApi.get(`/videodetail?id=${v.videoid}`);
      const data = res.data;
      if (data?.latestvideo) {
        setLatestvideo(data.latestvideo);
        setRelatedVideos((data?.videomix?.data ?? []).filter(item =>
          item?.type !== 'reels' && item?.type !== 'googlead' && String(item?.videoid) !== String(v.videoid)
        ));
        const relRaw  = data.latestvideo?.videopath ?? data.latestvideo?.y_path ?? data.latestvideo?.vidg_path ?? null;
        const relYtId = getYouTubeId(relRaw);
        startVideo(relYtId, relRaw);
        scrollRef.current?.scrollTo({ y:0, animated:true });
      }
    } catch (e) { console.error(e); }
  };

  const handleShare    = async () => { try { await Share.share({ message:`${video?.videotitle??'Dinamalar Video'}\n${shareUrl}` }); } catch {} };
  const handleSelectDistrict = (d) => {
    setDistrict(d.title); setIsLocDrawerOpen(false);
    if (d.id) navigation?.navigate('DistrictNewsScreen', { districtId:d.id, districtTitle:d.title });
  };

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (loading && !video) return (
    <SafeAreaView style={S.safe} edges={['top','bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.white} />
      <View style={S.center}><ActivityIndicator size="large" color={PALETTE.primary} /><Text style={{ color:PALETTE.grey600, marginTop:vs(8), fontSize:sf(14) }}>ஏற்றுகிறது...</Text></View>
    </SafeAreaView>
  );
  if (error && !video) return (
    <SafeAreaView style={S.safe} edges={['top','bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.white} />
      <View style={S.center}>
        <Text style={{ fontSize:ms(40), marginBottom:vs(12) }}>😕</Text>
        <Text style={{ color:PALETTE.grey800, fontSize:sf(15) }}>வீடியோ ஏற்ற முடியவில்லை</Text>
        <TouchableOpacity style={S.retryBtn} onPress={() => fetchDetail(videoId)}><Text style={{ color:PALETTE.white, fontWeight:'700' }}>மீண்டும் முயற்சி</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={S.safe} edges={['top','bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.white} />

      <View onLayout={e => { headerH.current = e.nativeEvent.layout.y + e.nativeEvent.layout.height; }}>
        <AppHeaderComponent
          onSearch={() => navigation?.navigate('Search')}
          onMenu={() => setIsDrawerOpen(true)}
          onLocation={() => setIsLocDrawerOpen(true)}
          selectedDistrict={district}
        />
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom:vs(80) }}
        onScroll={onScroll}
        scrollEventThrottle={100}
      >
        {/* Video slot — always reserves VH space, shows thumbnail */}
        <View style={S.slot} onLayout={e => { slotY.current = e.nativeEvent.layout.y; }}>
          {video?.images
            ? <Image source={{ uri:video.images }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            : <View style={[StyleSheet.absoluteFill, S.thumbPh]} />}
          <View style={S.grad} />

          {!isPlayerActive && (
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={0.92} onPress={handlePlayVideo}>
              <View style={S.centerPlay}><PlayIcon size={s(62)} /></View>
              {!!video?.duration && <View style={S.durBadge}><Text style={{ color:'#fff', fontWeight:'700', fontSize:sf(12) }}>{video.duration}</Text></View>}
              {loading && <View style={S.loadBadge}><ActivityIndicator size="small" color="#fff" /></View>}
            </TouchableOpacity>
          )}

          {pip && (
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={0.9} onPress={expandPip}>
              <View style={S.pipHint}>
                <Ionicons name="play-circle" size={ms(13)} color="#fff" />
                <Text style={{ color:'#fff', fontWeight:'600', fontSize:sf(11) }}>  Playing in mini — tap to expand</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Article */}
        <View style={S.articleBody}>
          <Text style={[S.articleTitle, { fontSize:sf(18), lineHeight:sf(27) }]}>{video?.videotitle??''}</Text>
          {loading && !latestvideo ? (
            <View style={{ gap:vs(10), marginVertical:vs(10) }}>
              {[1,.9,.75].map((w,i) => <View key={i} style={[S.skelLine, { width:`${w*100}%` }]} />)}
            </View>
          ) : !!bodyText ? (
            <View style={{ marginVertical:vs(4) }}>
              <RenderHtml
                contentWidth={SW}
                source={{ html:bodyText }}
                baseStyle={{ fontSize:sf(15), lineHeight:sf(28), color:PALETTE.grey800, fontFamily:FONTS.muktaMalar.regular }}
                tagsStyles={{ p:{ marginVertical:vs(6) }, strong:{ fontWeight:'700' }, a:{ color:PALETTE.primary }, li:{ marginVertical:vs(4) } }}
              />
              <Text style={[S.metaDate, { fontSize:sf(14) }]}>{video?.standarddate||timeAgo||''}</Text>
              <View style={[S.metaRow, { marginTop:vs(5) }]}>
                <View style={S.metaLeft}>
                  {!!video?.ctitle && <View style={S.catPill}><Text style={[S.catTxt, { fontSize:sf(11) }]}>{video.ctitle}</Text></View>}
                </View>
                <View style={S.metaRight}>
                  {commentCount > 0 && (
                    <TouchableOpacity style={S.metaBtn} onPress={() => setIsCommentsOpen(true)} activeOpacity={0.8}>
                      <Ionicons name="chatbox" size={ms(20)} color={PALETTE.grey600} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={S.metaBtn} onPress={() => setBookmarked(b=>!b)} activeOpacity={0.8}>
                    <Ionicons name={bookmarked?'bookmark':'bookmark-outline'} size={ms(20)} color={bookmarked?PALETTE.primary:PALETTE.grey600} />
                  </TouchableOpacity>
                  <TouchableOpacity style={S.metaBtn} onPress={handleShare} activeOpacity={0.8}>
                    <Ionicons name="share-social-outline" size={ms(20)} color={PALETTE.grey600} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : null}
          <View style={S.divider} />
        </View>

        {relatedVideos.length > 0 && (
          <View style={S.relSec}>
            <SectionHeader title="மேலும் வீடியோக்கள்" sf={sf} />
            {relatedVideos.map((v,i) => (
              <React.Fragment key={v?.videoid??i}>
                <RelatedCard video={v} onPress={handleRelatedPress} sf={sf} />
                {i < relatedVideos.length-1 && <View style={S.relDiv} />}
              </React.Fragment>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={S.fab} onPress={() => scrollRef.current?.scrollTo({ y:0, animated:true })}>
        <Ionicons name="arrow-up" size={22} color={PALETTE.white} />
      </TouchableOpacity>

      {/* ═══════════════════════════════════════════════════════════════════
          SINGLE FLOATING PLAYER
          ─ Full mode  : left=0,     top=headerH, width=SW,  height=VH
          ─ PiP mode   : left=PIP_X, top=PIP_Y,   width=PW,  height=PH (clipped by style)
          ─ Drag       : aDX/aDY translate ON TOP of left/top via transform
          ─ Width/height NEVER animate → no layout recalc → smooth!
         ═══════════════════════════════════════════════════════════════════ */}
      {isPlayerActive && (
        <Animated.View
          style={[
            S.floatFull,                  // SW × VH, absolute
            pip ? S.floatPip : null,      // clip to PW × PH when in pip
            {
              left: aLeft,
              top:  aTop,
              transform: [
                { translateX: aDX },
                { translateY: aDY },
              ],
            },
          ]}
          {...(pip ? pan.panHandlers : {})}
        >
          {activeYtId ? (
            <YoutubePlayer
              height={VH}
              width={SW}
              videoId={activeYtId}
              play={true}
              onReady={() => {}}
              onChangeState={() => {}}
              webViewStyle={{ backgroundColor:'#000', opacity:0.99 }}
              webViewProps={{ androidLayerType:'hardware' }}
              initialPlayerParams={{ rel:false, modestbranding:true, controls:true, autoplay:1 }}
            />
          ) : (
            <WebView
              source={{ html:buildIframeHtml(activeRawUrl) }}
              style={{ flex:1, backgroundColor:'#000' }}
              allowsFullscreenVideo javaScriptEnabled domStorageEnabled
              mediaPlaybackRequiresUserAction={false} allowsInlineMediaPlayback
              scrollEnabled={false} originWhitelist={['*']}
              backgroundColor="#000" mixedContentMode="always" allowsProtectedMedia
            />
          )}

          {pip && (
            <>
              <View style={S.pipBar} pointerEvents="none"><View style={S.pipBarLine} /></View>
              <View style={S.pipCtrl} pointerEvents="box-none">
                <TouchableOpacity style={S.pipBtn} onPress={expandPip} activeOpacity={0.8}>
                  <Ionicons name="expand" size={s(13)} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={S.pipBtn} onPress={closePip} activeOpacity={0.8}>
                  <Ionicons name="close" size={s(13)} color="#fff" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </Animated.View>
      )}

      <DrawerMenu isVisible={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} onMenuPress={() => {}} navigation={navigation} />
      <LocationDrawer isVisible={isLocDrawerOpen} onClose={() => setIsLocDrawerOpen(false)} onSelectDistrict={handleSelectDistrict} selectedDistrict={district} />
            <CommentsModal visible={isCommentsOpen} onClose={() => setIsCommentsOpen(false)} newsId={video?.videoid || videoId} newsTitle={video?.videotitle} commentCount={commentCount} preloadedComments={videoComments} />
      {console.log('[VideoDetail] passing to CommentsModal:', { videoComments, commentCount, videoid: video?.videoid })}
    </SafeAreaView>
  );
};

const S = StyleSheet.create({
  safe:   { flex:1, backgroundColor:PALETTE.grey100 },
  center: { flex:1, justifyContent:'center', alignItems:'center', gap:vs(12) },
  retryBtn: { marginTop:vs(16), backgroundColor:PALETTE.primary, borderRadius:s(8), paddingHorizontal:s(20), paddingVertical:vs(10) },

  slot:      { width:SW, height:VH, backgroundColor:'#000', overflow:'hidden' },
  grad:      { ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,.28)' },
  thumbPh:   { flex:1, backgroundColor:'#2A2A2A', justifyContent:'center', alignItems:'center' },
  centerPlay:{ position:'absolute', top:'50%', left:'50%', transform:[{translateX:-s(31)},{translateY:-s(31)}] },
  playCircle:{ backgroundColor:'rgba(9,109,210,.88)', justifyContent:'center', alignItems:'center', borderWidth:2.5, borderColor:'rgba(255,255,255,.65)' },
  playTriangle:{ width:0, height:0, borderStyle:'solid', borderTopColor:'transparent', borderBottomColor:'transparent', borderLeftColor:PALETTE.white },
  durBadge:  { position:'absolute', bottom:0, right:s(5), backgroundColor:'rgba(0,0,0,.75)', paddingHorizontal:s(7), paddingVertical:vs(2) },
  durTxt:    { color:PALETTE.white, fontWeight:'700', fontFamily:FONTS.muktaMalar.bold },
  loadBadge: { position:'absolute', bottom:vs(10), left:s(10), backgroundColor:'rgba(0,0,0,.45)', borderRadius:s(12), padding:s(6) },
  pipHint:   { position:'absolute', bottom:vs(10), alignSelf:'center', flexDirection:'row', alignItems:'center', backgroundColor:'rgba(0,0,0,.55)', paddingHorizontal:s(10), paddingVertical:vs(3), borderRadius:s(12) },

  // ── Floating player ──────────────────────────────────────────────────────
  floatFull: {
    position:'absolute',
    width:SW, height:VH,          // always full size — never changes
    backgroundColor:'#000',
    overflow:'hidden',
    elevation:25, zIndex:9999,
    shadowColor:'#000', shadowOffset:{ width:0, height:4 }, shadowOpacity:0.4, shadowRadius:8,
  },
  floatPip: {
    width:PW, height:PH,          // clip to pip size when in pip mode
    borderRadius:s(10),
  },
  pipCtrl:   { position:'absolute', top:s(8), right:s(8), flexDirection:'row', gap:s(6), zIndex:10 },
  pipBtn:    { width:s(28), height:s(28), borderRadius:s(14), backgroundColor:'rgba(0,0,0,.75)', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'rgba(255,255,255,.3)' },
  pipBar:    { position:'absolute', bottom:0, left:0, right:0, height:s(16), justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,.3)' },
  pipBarLine:{ width:s(28), height:s(3), borderRadius:s(2), backgroundColor:'rgba(255,255,255,.55)' },

  articleBody: { backgroundColor:PALETTE.white, paddingHorizontal:s(14), paddingTop:vs(14) },
  articleTitle:{ fontFamily:FONTS.muktaMalar.bold, color:PALETTE.grey800, fontWeight:'800', marginBottom:vs(10) },
  metaRow:   { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:vs(5) },
  metaLeft:  { flexDirection:'row', alignItems:'center', gap:s(8), flex:1 },
  metaRight: { flexDirection:'row', alignItems:'center', gap:s(8) },
  metaBtn:   { padding:s(6), borderRadius:s(4), backgroundColor:PALETTE.grey100, borderWidth:1, borderColor:PALETTE.grey400 },
  catPill:   { paddingHorizontal:s(10), paddingVertical:vs(2), borderWidth:1, borderColor:PALETTE.grey400 },
  catTxt:    { color:PALETTE.grey600, fontWeight:'600', fontFamily:FONTS.muktaMalar.semibold },
  metaDate:  { color:PALETTE.grey600, fontFamily:FONTS.muktaMalar.regular },
  divider:   { height:1, backgroundColor:PALETTE.grey300, marginVertical:vs(10) },
  skelLine:  { height:vs(14), backgroundColor:PALETTE.grey300, borderRadius:s(4) },

  relSec:    { backgroundColor:PALETTE.white, marginTop:vs(6), paddingBottom:vs(8) },
  secHeader: { flexDirection:'row', alignItems:'center', paddingHorizontal:s(14), paddingVertical:vs(12), borderBottomWidth:1, borderBottomColor:PALETTE.grey300 },
  secAccent: { width:s(4), height:vs(18), backgroundColor:PALETTE.primary, borderRadius:s(2), marginRight:s(8) },
  secTitle:  { fontFamily:FONTS.muktaMalar.bold, fontWeight:'800', color:PALETTE.grey800 },
  relCard:   { flexDirection:'row', paddingHorizontal:s(14), paddingVertical:vs(10), backgroundColor:PALETTE.white },
  relThumb:  { width:s(120), height:vs(72), backgroundColor:PALETTE.dark, overflow:'hidden', borderRadius:s(4), flexShrink:0 },
  relOverlay:{ ...StyleSheet.absoluteFillObject, backgroundColor:'rgba(0,0,0,.22)' },
  relPlay:   { position:'absolute', bottom:vs(5), left:s(5) },
  relInfo:   { flex:1, marginLeft:s(10), justifyContent:'space-between' },
  relTitle:  { fontFamily:FONTS.muktaMalar.semibold, color:PALETTE.grey800, fontWeight:'600' },
  relMeta:   { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:vs(4) },
  relDiv:    { height:1, backgroundColor:PALETTE.grey200, marginHorizontal:s(14) },

  fab: { position:'absolute', bottom:vs(24), right:s(20), width:s(48), height:s(48), borderRadius:s(24), backgroundColor:PALETTE.primary, alignItems:'center', justifyContent:'center', elevation:10, shadowColor:'#000', shadowOffset:{ width:0, height:3 }, shadowOpacity:0.25, shadowRadius:6 },
});

export default VideoDetailScreen;