// screens/VideoDetailScreen.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, ActivityIndicator, Share,
  Dimensions, PanResponder, Animated, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import RenderHtml from 'react-native-render-html';
import { WebView } from 'react-native-webview';
import YoutubePlayer from 'react-native-youtube-iframe';
import { ms, s, vs } from '../utils/scaling';
import { CDNApi } from '../config/api';
import { COLORS, FONTS } from '../utils/constants';
import { useFontSize } from '../context/FontSizeContext';
import AppHeaderComponent from '../components/AppHeaderComponent';
import DrawerMenu from '../components/DrawerMenu';
import LocationDrawer from '../components/LocationDrawer';
import CommentsModal from '../components/CommentsModal';
import LazyImage from '../components/LazyImage';
import { dataPreloader } from '../utils/preloader';
import { backgroundRefresh } from '../utils/backgroundRefresh';

const { width: SW, height: SH } = Dimensions.get('window');
const VH = (SW * 9) / 16;
const PW = SW * 0.58;
const PH = (PW * 9) / 16;
const PM = s(12);
const PIP_X = SW - PW - PM;
const PIP_Y = SH * 0.52;

const PALETTE = {
  grey100: '#F9FAFB', grey200: '#F4F6F8', grey300: '#DFE3E8',
  grey400: '#C4CDD5', grey500: '#919EAB', grey600: '#637381',
  grey700: '#637381', grey800: '#212B36',
  white: '#FFFFFF', red: '#E63946', dark: '#1A1A1A', primary: '#096dd2',
};

// ─── Taboola ──────────────────────────────────────────────────────────────────
const TABOOLA_PUBLISHER_ID = 'mdinamalarcom';

function TaboolaWidget({ pageUrl, mode, container, placement, pageType = 'video', targetType = 'mix' }) {
  const [height, setHeight] = useState(1);
  if (!mode || !container || !placement || !pageUrl) return null;
  const safe = (str) => String(str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"><style>*{margin:0;padding:0;box-sizing:border-box}html,body{background:#fff;overflow-x:hidden;width:100%}#${safe(container)}{width:100%;min-height:1px}img{max-width:100%!important;width:100%!important;height:auto!important;display:block!important;object-fit:cover!important;object-position:center center!important}</style></head><body><div id="${safe(container)}"></div><script>window._taboola=window._taboola||[];_taboola.push({${safe(pageType)}:'auto'});_taboola.push({mode:'${safe(mode)}',container:'${safe(container)}',placement:'${safe(placement)}',target_type:'${safe(targetType)}'});</script><script>(function(){var s=document.createElement('script');s.type='text/javascript';s.async=true;s.src='https://cdn.taboola.com/libtrc/${TABOOLA_PUBLISHER_ID}/loader.js';s.id='tb_loader_script';s.onload=function(){_taboola.push({flush:true});};if(!document.getElementById('tb_loader_script')){document.head.appendChild(s);}else{_taboola.push({flush:true});}})();</script><script>var lH=0;function gH(){return Math.max(document.body.scrollHeight,document.body.offsetHeight,document.documentElement.scrollHeight);}function sH(){setTimeout(function(){var h=gH();if(h>50&&h>lH){lH=h;window.ReactNativeWebView.postMessage(JSON.stringify({type:'height',value:h}));}},200);}function wI(){var imgs=document.querySelectorAll('img');if(!imgs.length){sH();return;}var p=0;imgs.forEach(function(img){if(!img.complete){p++;img.addEventListener('load',function(){if(!--p)sH();});img.addEventListener('error',function(){if(!--p)sH();});}});if(!p)sH();}var pc=0;function poll(){wI();if(pc++<75)setTimeout(poll,400);}setTimeout(poll,500);if(typeof MutationObserver!=='undefined'){new MutationObserver(function(){wI();}).observe(document.body,{childList:true,subtree:true,attributes:false});}</script></body></html>`;
  return (
    <View style={{ width: '100%', height, backgroundColor: '#fff', overflow: 'hidden', marginVertical: vs(8), borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#F4F6F8' }}>
      <WebView source={{ html, baseUrl: 'https://www.dinamalar.com' }} style={{ width: '100%', height }}
        scrollEnabled={false} javaScriptEnabled domStorageEnabled thirdPartyCookiesEnabled
        mixedContentMode="always" originWhitelist={['*']} allowsInlineMediaPlayback
        onMessage={(e) => { try { const m = JSON.parse(e.nativeEvent.data); if (m.type === 'height' && m.value > 50) setHeight(p => Math.max(p, m.value)); } catch { const h = parseInt(e.nativeEvent.data, 10); if (!isNaN(h) && h > 50) setHeight(p => Math.max(p, h)); } }}
        nestedScrollEnabled={false} />
    </View>
  );
}

function ReadMoreContent({ html, contentWidth, sf }) {
  const [expanded, setExpanded] = useState(false);
  const truncated = html.length > 400 ? html.slice(0, 400) : html;
  const lineHeight = Math.round(sf(16) * 1.6);
const maxHeight = lineHeight * 3;

return (
  <View style={{ marginVertical: vs(4) }}>
    
    <View style={{ height: expanded ? undefined : maxHeight, overflow: 'hidden' }}>
      <RenderHtml
        contentWidth={contentWidth}
        source={{ html }}
        baseStyle={{
          fontSize: sf(13),
          lineHeight: lineHeight,
          color: PALETTE.grey800,
          fontFamily: FONTS?.muktaMalar?.regular || undefined
        }}
        tagsStyles={{
          p: {
            margin: 0,
            marginBottom: vs(12),
            fontSize: sf(13),
            color: PALETTE.grey800,
            lineHeight: lineHeight,
            fontFamily: FONTS?.muktaMalar?.medium || undefined
          },
          strong: { fontWeight: '700', color: PALETTE.grey800 },
          b: { fontWeight: '700', color: PALETTE.grey800 },
          a: {
            color: PALETTE.primary,
            textDecorationLine: 'underline',
            fontWeight: '600'
          },
        }}
      />
    </View>

    <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
      <Text style={{
        color: PALETTE.primary,
        fontWeight: '700',
        fontSize: sf(13),
        marginTop: vs(4)
      }}>
        {expanded ? '<< Read Less' : 'Read More >>'}
      </Text>
    </TouchableOpacity>

  </View>
);
}

// ─── Google Ad Banner ─────────────────────────────────────────────────────────
function GoogleAdBanner({ slotId, adUnit, adSize, adSize1 }) {
  if (!slotId || !adUnit) return null;
  const adW = adSize || 300;
  const adH = adSize1 || 250;
  const containerW = Math.min(adW, SW - s(32));
  const adHtml = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#f9fafb;display:flex;justify-content:center;align-items:center;min-height:${adH}px;width:100%}</style><script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script><script>window.googletag=window.googletag||{cmd:[]};googletag.cmd.push(function(){googletag.defineSlot('/${adUnit}',[${adW},${adH}],'${slotId}').addService(googletag.pubads());googletag.pubads().enableSingleRequest();googletag.enableServices();});googletag.cmd.push(function(){googletag.display('${slotId}');});</script></head><body><div id="${slotId}" style="width:${adW}px;height:${adH}px;margin:auto"></div></body></html>`;
  return (
    <View style={{ width: '100%', alignItems: 'center', backgroundColor: '#f9fafb', borderTopWidth: 1, borderBottomWidth: 1, borderColor: PALETTE.grey200, marginVertical: vs(6), paddingVertical: vs(8) }}>
      <Text style={{ fontSize: ms(9), color: PALETTE.grey400, marginBottom: vs(4), letterSpacing: 0.5 }}>ADVERTISEMENT</Text>
      <View style={{ width: containerW, height: adH }}>
        <WebView
          source={{ html: adHtml, baseUrl: 'https://www.dinamalar.com' }}
          style={{ width: containerW, height: adH }}
          scrollEnabled={false}
          javaScriptEnabled
          domStorageEnabled
          thirdPartyCookiesEnabled
          mixedContentMode="always"
          originWhitelist={['*']}
          nestedScrollEnabled={false}
        />
      </View>
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getYouTubeId(url) {
  if (!url) return null;
  const str = String(url).trim();
  for (const re of [/youtu\.be\/([^?&\s]+)/, /youtube\.com\/watch\?v=([^&\s]+)/, /youtube\.com\/embed\/([^?&\s]+)/, /youtube\.com\/shorts\/([^?&\s]+)/, /youtube-nocookie\.com\/embed\/([^?&\s]+)/]) {
    const m = str.match(re); if (m?.[1]) return m[1];
  }
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
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return String(d).split(' ')[0];
};

// ─── Play Icon ────────────────────────────────────────────────────────────────
const PlayIcon = ({ size = 52 }) => (
  <View style={[S.playCircle, { width: size, height: size, borderRadius: size / 2 }]}>
    <View style={[S.playTriangle, { borderTopWidth: size * .22, borderBottomWidth: size * .22, borderLeftWidth: size * .36, marginLeft: size * .07 }]} />
  </View>
);

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title }) {
  const { sf } = useFontSize();
  const [titleWidth, setTitleWidth] = useState(0);

  return (
    <View style={S.sectionHeader}>
      <Text
        style={[S.sectionTitle, { fontSize: sf(16) }]}
        onLayout={(e) => setTitleWidth(e.nativeEvent.layout.width)}
      >
        {title}
      </Text>
      {titleWidth > 0 && (
        <View style={[S.sectionUnderline, { width: titleWidth * 0.15 }]} />
      )}
    </View>
  );
}

// ─── Video List Card — matches Screenshot 1 layout ────────────────────────────
// Full-width image, play button bottom-left, duration badge bottom-right,
// title + category + time below
const VideoListCard = ({ video, onPress, onCatPress, sf }) => {
    if (!video) return null;
  const img = video.images || video.largeimages || video.thumbnail || '';
  const title = video.videotitle || video.newstitle || video.title || '';
  const duration = video.duration || '';
  const date = video.standarddate || video.ago || '';
  const cat = video.ctitle || video.categrorytitle || video.maincat || '';
  return (
    <TouchableOpacity activeOpacity={0.88} onPress={() => onPress?.(video)} style={S.vidListCard}>
      <View style={S.vidListThumb}>
        {img
          ? <Image source={{ uri: img }} style={S.vidThumnail} resizeMode="cover" />
          : <View style={[S.vidThumnail, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }]}>
            <Image
              source={{ uri: 'https://stat.dinamalar.com/new/2025/images/dinamalar-pavala-vizha-logo-day.png' }}
              style={{ width: s(60), height: s(30), resizeMode: 'contain' }}
            />
          </View>}
        {/* <View style={S.vidListOverlay} /> */}
        <View style={S.vidListPlayWrap}><PlayIcon size={s(30)} /></View>
        {!!duration && (
          <View style={S.vidDurBadge}><Text style={[S.vidDurTxt, { fontSize: sf(11) }]}>{duration}</Text></View>
        )}
      </View>
      <View style={S.vidListInfo}>
        <Text style={[S.vidListTitle, { fontSize: sf(12), lineHeight: sf(19) }]}  >
          {title}
        </Text>
       <View style={S.vidListMeta}>
          {!!cat && (
            <TouchableOpacity
              style={S.catPill}
              onPress={() => onCatPress?.(cat)}   // ← tap the pill
              activeOpacity={0.75}
            >
              <Text style={[S.catTxt, { fontSize: sf(10) }]}>{cat}</Text>
            </TouchableOpacity>
          )}
          {!!date && <Text style={[S.metaDate, { fontSize: sf(12) }]}>{date}</Text>}
        </View>
      </View>
      <View style={S.cardDivider} />
    </TouchableOpacity>
  );
};

// ─── Reel Card (vertical, for horizontal scroll) ──────────────────────────────
const ReelCard = ({ item, onPress, sf }) => {
  const img = item.images || '';
  const title = item.title || item.videotitle || '';
  return (
    <TouchableOpacity style={S.reelCard} onPress={() => onPress?.(item)} activeOpacity={0.85} >
      <View style={S.reelThumb}>
        {img ? (
          <Image source={{ uri: img }} style={S.image} resizeMode="cover" />
        ) : (
          <View style={[S.reelThumb, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }]}>
            <Image
              source={{ uri: 'https://stat.dinamalar.com/new/2025/images/dinamalar-pavala-vizha-logo-day.png' }}
              style={{ width: s(40), height: s(20), resizeMode: 'contain' }}
            />
          </View>
        )}

        {/* <View style={S.vidListOverlay} /> */}
      </View>
      {!!title && (
        <View style={S.titleOverlay}>
          <Text style={[S.bottomTitle, { fontSize: sf(10) }]}>{title}</Text>
        </View>
      )}
      {/* {hasVideo && ( */}
      {/* <View style={S.playOverlay}>
        <View style={S.playButton}>
          <Ionicons name="play" size={s(12)} color="#fff" />
        </View>
      </View> */}
      {/* )} */}
    </TouchableOpacity>
  );
};

// ─── District Tag Pill ────────────────────────────────────────────────────────
const DistrictTagList = ({ districts, onPress, sf }) => {
  if (!districts?.length) return null;
  return (
    <View style={S.distTagSec}>
      <SectionHeader title="மாவட்டங்கள்" sf={sf} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: s(12), paddingVertical: vs(10), gap: s(8) }}>
        {districts.map((d, i) => (
          <TouchableOpacity key={`dt-${d.id || i}`} style={S.distTag} onPress={() => onPress?.(d)} activeOpacity={0.8}>
            <Ionicons name="location" size={s(12)} color={PALETTE.primary} />
            <Text style={[S.distTagTxt, { fontSize: sf(12) }]}>{d.districtname || d.title || ''}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// ─── News Card — full-width image style (matches Screenshot 2) ────────────────
const NewsCard = ({ item, onPress, sf }) => {
  const img = item.images || item.largeimages || item.thumbnail || item.image || '';
  const title = item.newstitle || item.title || '';
  const ago = item.ago || item.standarddate || '';
  const cat = item.categrorytitle || item.ctitle || item.maincat || item.districttitle || '';
  const commentCount = parseInt(item.nmcomment || item.newscomment || 0);

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress?.(item)}
      style={S.newsCard}
    >
      {/* Full-width image */}
      <View style={S.newsCardThumb}>
        {img
          ? <Image
            source={{ uri: img }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          : <View style={[StyleSheet.absoluteFill, S.newsCardPlaceholder]}>
            <Image
              source={{ uri: 'https://stat.dinamalar.com/new/2025/images/dinamalar-pavala-vizha-logo-day.png' }}
              style={S.newsCardPlaceholderLogo}
              resizeMode="contain"
            />
          </View>
        }
      </View>

      {/* Content below image */}
      <View style={S.newsCardInfo}>
        {/* Title */}
        <Text
          style={[S.newsCardTitle, { fontSize: sf(12), lineHeight: sf(21) }]}

        >
          {title}
        </Text>

        {/* Category pill */}
        {!!cat && (
          <View style={S.newsCardCatWrap}>
            <View style={S.newsCardCatPill}>
              <Text style={[S.newsCardCatTxt, { fontSize: sf(10) }]}>{cat}</Text>
            </View>
          </View>
        )}

        {/* Meta row: comment + time */}
        <View style={S.newsCardMetaRow}>
          {/* {commentCount > 0 && (
            <View style={S.newsCardCommentRow}>
              <Ionicons name="chatbubble-outline" size={s(13)} color={PALETTE.grey500} />
              <Text style={[{ fontSize: sf(11), color: PALETTE.grey500, marginLeft: s(3) }]}>
                {commentCount}
              </Text>
            </View>
          )} */}
          {!!ago && (
            <Text style={[S.newsCardAgo, { fontSize: sf(12) }]}>{ago}</Text>
          )}
        </View>
      </View>

      {/* Bottom divider */}
      <View style={S.cardDivider} />
    </TouchableOpacity>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════════════════════
const VideoDetailScreen = ({ navigation, route }) => {
  const { sf } = useFontSize();
  const passedVideo = route?.params?.video ?? null;
  
  // Debug: Log what video data we received
  console.log('VideoDetailScreen - Received video data:', {
    passedVideo: passedVideo,
    videoId: passedVideo?.videoid || passedVideo?.videoId || passedVideo?.video_id || route?.params?.videoId,
    title: passedVideo?.videotitle || passedVideo?.newstitle || passedVideo?.title,
    path: passedVideo?.videopath || passedVideo?.path || passedVideo?.y_path,
    allFields: Object.keys(passedVideo || {})
  });
  
  const videoId =
    passedVideo?.videoid ??
    passedVideo?.videoId ??
    passedVideo?.video_id ??
    route?.params?.videoId ??
    null;
  const [latestvideo, setLatestvideo] = useState(null);
  // data.relatedvideos — fresh related videos (main list, screenshot 1 style)
  const [relatedVideos, setRelatedVideos] = useState([]);
  // data.relatedreels — SEPARATE reels (horizontal scroll, labelled "ரீல்ஸ்")
  const [relatedReels, setRelatedReels] = useState([]);
  // data.videoreels.data type=news → separate "மேலும் வீடியோக்கள்" list
  const [videoReelNews, setVideoReelNews] = useState([]);
  // data.videoreels.data type=reels → separate "ஷார்ட்ஸ்" horizontal scroll
  const [videoReelReels, setVideoReelReels] = useState([]);
  // data.videomix.data — older related (secondary list)
  const [videomixData, setVideomixData] = useState([]);
  // data.videodistrict — district tag list
  const [videoDistrict, setVideoDistrict] = useState([]);
  // data.morerelated — endpoint for loading more
  const [moreRelated, setMoreRelated] = useState(null);
  const [moreRelatedData, setMoreRelatedData] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  // data.googleads.mobileads
  const [mobileAds, setMobileAds] = useState(null);
  // data.taboola_ads.mobile
  const [taboolaAds, setTaboolaAds] = useState(null);

  const [newsList, setNewsList] = useState([]);

  const [videoComments, setVideoComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLocDrawerOpen, setIsLocDrawerOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [district, setDistrict] = useState('உள்ளூர்');
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [activeYtId, setActiveYtId] = useState(null);
  const [activeRawUrl, setActiveRawUrl] = useState(null);
  const [pip, setPip] = useState(false);
  const [embedFailed, setEmbedFailed] = useState(false);
  const [playing, setPlaying] = useState(true);

  const pipRef = useRef(false);
  const scrollRef = useRef(null);
  const slotY = useRef(0);
  const headerH = useRef(0);
  useEffect(() => { pipRef.current = pip; }, [pip]);

  const aLeft = useRef(new Animated.Value(0)).current;
  const aTop = useRef(new Animated.Value(0)).current;
  const aDX = useRef(new Animated.Value(0)).current;
  const aDY = useRef(new Animated.Value(0)).current;
  const restPos = useRef({ x: PIP_X, y: PIP_Y });

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => pipRef.current,
    onMoveShouldSetPanResponder: () => pipRef.current,
    onPanResponderGrant: () => { aDX.setValue(0); aDY.setValue(0); },
    onPanResponderMove: Animated.event([null, { dx: aDX, dy: aDY }], { useNativeDriver: false }),
    onPanResponderRelease: (_, g) => {
      const nx = restPos.current.x + g.dx;
      const ny = Math.min(Math.max(restPos.current.y + g.dy, vs(60)), SH - PH - vs(40));
      const sx = nx + PW / 2 < SW / 2 ? PM : SW - PW - PM;
      restPos.current = { x: sx, y: ny };
      aDX.setValue(0); aDY.setValue(0);
      Animated.parallel([
        Animated.spring(aLeft, { toValue: sx, useNativeDriver: false, friction: 6, tension: 50 }),
        Animated.spring(aTop, { toValue: ny, useNativeDriver: false, friction: 6, tension: 50 }),
      ]).start();
    },
  })).current;

  const goPip = useCallback(() => {
    restPos.current = { x: PIP_X, y: PIP_Y };
    aDX.setValue(0); aDY.setValue(0);
    Animated.parallel([
      Animated.spring(aLeft, { toValue: PIP_X, useNativeDriver: false, friction: 8, tension: 70 }),
      Animated.spring(aTop, { toValue: PIP_Y, useNativeDriver: false, friction: 8, tension: 70 }),
    ]).start();
  }, []);

  const goFull = useCallback(() => {
    aDX.setValue(0); aDY.setValue(0);
    Animated.parallel([
      Animated.spring(aLeft, { toValue: 0, useNativeDriver: false, friction: 8, tension: 70 }),
      Animated.spring(aTop, { toValue: headerH.current, useNativeDriver: false, friction: 8, tension: 70 }),
    ]).start();
  }, []);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchDetail = useCallback(async (id) => {
    if (!id) { setError('Video ID not found'); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      // Main video detail fetch
      const res = await CDNApi.get(`/videodetail?id=${id}`);
      const data = res.data;

      if (data?.latestvideo) setLatestvideo(data.latestvideo);
      if (data?.comments?.data) setVideoComments(data.comments.data);

      // Taboola & ads (non-critical, can be set async)
      setTaboolaAds(data?.taboola_ads?.mobile ?? null);
      setMobileAds(data?.googleads?.mobileads ?? null);

      // ── Parallel fetch of related content ───────────────────────────────
      const relatedEndpoint = data?.morerelated ?? `/relatedmost?videoid=${id}`;

      // Create array of parallel requests
      const parallelRequests = [
        // Related videos, reels, and news
        CDNApi.get(relatedEndpoint).catch(e => {
          console.warn('relatedmost fetch error', e);
          return { data: { videos: { data: data?.relatedvideos || [] }, reels: { data: data?.relatedreels || [] }, newlist: { data: [] } } };
        }),
      ];

      // Add morerelated fetch if endpoint exists
      if (data?.morerelated) {
        parallelRequests.push(
          CDNApi.get(data.morerelated).catch(e => {
            console.warn('morerelated fetch error', e);
            return { data: { data: [] } };
          })
        );
      }

      Promise.allSettled(parallelRequests).then(results => {
        // Process related content
        const relatedResult = results[0];
        if (relatedResult.status === 'fulfilled') {
          const relatedApiData = relatedResult.value.data;

          // data.videos.data → தொடர்புடையவை section
          const videosData = relatedApiData?.videos?.data ?? [];
          setRelatedVideos(videosData.filter(v => v && v.videoid));

          // data.reels.data → ஷார்ட்ஸ் section
          const reelsData = relatedApiData?.reels?.data ?? [];
          setRelatedReels(reelsData.filter(r => r && r.id));

          // data.newlist.data → செய்திகள் section
          const newsListData = relatedApiData?.newlist?.data ?? [];
          setNewsList(newsListData.filter(n => n && (n.newsid || n.id)));
        }

        // Process morerelated if exists
        if (data?.morerelated && results[1]?.status === 'fulfilled') {
          const moreData = results[1].value.data?.data ?? results[1].value.data ?? [];
          setVideoReelNews(Array.isArray(moreData) ? moreData.filter(v => v && v.videoid) : []);
          setMoreRelated(data.morerelated);
        }

        // Process other data (non-blocking)
        const vrData = data?.videoreels?.data ?? [];
        const relatedReelIds = new Set((data?.relatedreels ?? []).map(r => String(r.id || '')));
        setVideoReelReels(vrData.filter(v => v && v.type === 'reels' && !relatedReelIds.has(String(v.id || ''))));

        // Use morerelated or fallback to videoreels type=news
        if (!data?.morerelated) {
          setVideoReelNews(vrData.filter(v => v && (v.type === 'news' || (v.videoid && !v.type))));
        }

        setVideomixData((data?.videomix?.data ?? []).filter(v => v && v.type !== 'googlead' && v.type !== 'reels'));
        setVideoDistrict(Array.isArray(data?.videodistrict) ? data.videodistrict : []);
      }).catch(err => {
        console.warn('Error loading related content:', err);
      });

    } catch (err) {
      console.error('Error fetching video details:', err);
      setError(err?.message || 'பிழை ஏற்பட்டது');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLatestvideo(null);
    setEmbedFailed(false);
    setRelatedVideos([]); setRelatedReels([]);
    setVideoReelNews([]); setVideoReelReels([]); setVideomixData([]);
    setVideoDistrict([]); setMobileAds(null); setTaboolaAds(null);
    setMoreRelated(null); setMoreRelatedData([]); setVideoComments([]);
    setActiveYtId(null); setActiveRawUrl(null); setPip(false);
    setNewsList([]);
    fetchDetail(videoId);
  }, [videoId]);

  useEffect(() => {
    if (ytId) {
      setPlaying(true);
    }
  }, [ytId]);

  const video = latestvideo ?? passedVideo;
  // Enhanced URL detection to handle both mapped and raw video data
  const rawUrl =
    video?.videopath ??
    video?.y_path ??
    video?.vidg_path ??
    video?.video ??        // HomeScreen/SearchScreen mapped field
    video?.videourl ??     // fallback mapped field
    video?.path ??         // Raw VideosScreen field
    video?.videopath ??    // Raw VideosScreen field
    video?.videourl ??     // Raw VideosScreen field
    null;
  const ytId = getYouTubeId(rawUrl);
  const bodyText = video?.videodescription ?? '';
  const timeAgo = getTimeAgo(video?.videodate);
  const commentCount = parseInt(video?.nmcomment || 0);
  const shareUrl = video?.slug ? `https://www.dinamalar.com${video.slug}` : `dinamalar://video/${videoId}`;
  const isPlayerActive = !!(activeYtId || activeRawUrl);

  const startVideo = useCallback((yId, rUrl) => {
    if (yId) { setActiveRawUrl(null); setActiveYtId(yId); }
    else if (rUrl) { setActiveYtId(null); setActiveRawUrl(rUrl); }
    else return;
    setPip(false); aDX.setValue(0); aDY.setValue(0);
    aLeft.setValue(0); aTop.setValue(headerH.current);
  }, []);

  const handlePlayVideo = () => startVideo(ytId, rawUrl);

  const onScroll = useCallback((e) => {
    setShowScrollTop(e.nativeEvent.contentOffset.y > 300);
    if (!isPlayerActive) return;
    const past = e.nativeEvent.contentOffset.y > slotY.current + VH - s(20);
    if (past && !pipRef.current) { setPip(true); goPip(); }
    if (!past && pipRef.current) { setPip(false); goFull(); }
  }, [isPlayerActive, goPip, goFull]);

  const expandPip = () => { setPip(false); goFull(); scrollRef.current?.scrollTo({ y: 0, animated: true }); };
  const closePip = () => { setActiveYtId(null); setActiveRawUrl(null); setPip(false); aDX.setValue(0); aDY.setValue(0); };

  const handleVideoPress = (v) => {
    if (!v?.videoid) return;
    navigation?.push('VideoDetailScreen', { videoId: v.videoid, video: v });
  };

  const handleReelPress = (item) => {
    const link = item.link || item.url || '';
    if (link) Linking.openURL(link).catch(() => { });
  };

  const handleNewsPress = (item) => {
    navigation?.navigate('NewsDetailsScreen', {
      newsId: item.newsid || item.id,
      newsItem: item,
    });
  };

  const handleLoadMore = async () => {
    if (!moreRelated || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await CDNApi.get(moreRelated);
      const more = res.data?.data ?? res.data ?? [];
      if (Array.isArray(more) && more.length > 0) {
        setMoreRelatedData(prev => [...prev, ...more]);
        setMoreRelated(null);
      }
    } catch (e) { console.error('morerelated error', e); }
    finally { setLoadingMore(false); }
  };

  const handleShare = async () => {
    try { await Share.share({ message: `${video?.videotitle ?? 'Dinamalar Video'}\n${shareUrl}` }); } catch { }
  };

  // Test deep links in Expo Go
  const testDeepLinks = async () => {
    try {
      console.log('Testing deep links in Expo Go...');
      // Test with Expo Go URL scheme
      const expoUrl = `exp://192.168.1.100:8081/--/video/336048`; // Replace with your IP
      await Linking.openURL(expoUrl);
      
      setTimeout(async () => {
        await Linking.openURL('dinamalar://video/336048');
      }, 2000);
    } catch (error) {
      console.error('Deep link test failed:', error);
    }
  };
  // Add this category lookup near the top of VideoDetailScreen component
const CATEGORIES = [
  { title: "All", value: "" },
  { title: "Live", value: "5050" },
  { title: "அரசியல்", value: "31" },
  { title: "பொது", value: "32" },
  { title: "சம்பவம்", value: "33" },
  { title: "சினிமா", value: "435" },
  { title: "டிரைலர்", value: "436" },
  { title: "செய்திச்சுருக்கம்", value: "594" },
  { title: "விளையாட்டு", value: "464" },
  { title: "சிறப்பு தொகுப்புகள்", value: "1238" },
  { title: "ஆன்மிகம்", value: "1316" },
  { title: "மாவட்ட செய்திகள்", value: "1585" },
  { title: "ஷார்ட்ஸ்", value: "shorts" },
];

// Add this handler inside VideoDetailScreen
const handleCatPillPress = useCallback((catTitle) => {
  const match = CATEGORIES.find(c => c.title === catTitle);
  if (!match) return;
  navigation?.navigate('VideoScreen', {
    catId: match.value,
    catTitle: match.title,
    timestamp: Date.now(), // <- forces VideoScreen to re-read params even if already mounted
  });
}, [navigation]);

  const handleSelectDistrict = (d) => {
    setDistrict(d.title); setIsLocDrawerOpen(false);
    if (d.id) navigation?.navigate('DistrictNewsScreen', { districtId: d.id, districtTitle: d.title });
  };
  const handleDistrictTagPress = (d) => {
    navigation?.navigate('VideoScreen', { catId: d.id, catTitle: d.districtname || d.title });
  };

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (loading && !video) return (
    <SafeAreaView style={S.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={S.center}>
        <ActivityIndicator size="large" color={PALETTE.primary} />
        {/* <Text style={{ color: PALETTE.grey600, marginTop: vs(8), fontSize: sf(14) }}>ஏற்றுகிறது...</Text> */}
        </View>
    </SafeAreaView>
  );
  if (error && !video) return (
    <SafeAreaView style={S.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={S.center}>
        <Text style={{ fontSize: ms(40), marginBottom: vs(12) }}>😕</Text>
        <Text style={{ color: PALETTE.grey800, fontSize: sf(15) }}>வீடியோ ஏற்ற முடியவில்லை</Text>
        <TouchableOpacity style={S.retryBtn} onPress={() => fetchDetail(videoId)}><Text style={{ color: PALETTE.white, fontWeight: '700' }}>மீண்டும் முயற்சி</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={S.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View onLayout={e => { headerH.current = e.nativeEvent.layout.y + e.nativeEvent.layout.height; }}>
        <AppHeaderComponent
          onSearch={() => navigation?.navigate('SearchScreen')}
          onMenu={() => setIsDrawerOpen(true)}
          onLocation={() => setIsLocDrawerOpen(true)}
          selectedDistrict={district}
        />
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: vs(80), paddingHorizontal: ms(12), paddingTop: ms(20) }}
        onScroll={onScroll} scrollEventThrottle={100}>

        {/* ── Video slot ─────────────────────────────────────────── */}
        {/* ── Video slot — autoplay, no manual button ── */}
        <View style={S.slot} onLayout={e => { slotY.current = e.nativeEvent.layout.y; }}>
          {ytId && !embedFailed ? (
            <YoutubePlayer
              height={VH}
              width={SW}
              videoId={ytId}
              play={true}
              forceAndroidAutoplay={true}
              allowWebViewZoom={false}
              allowFullscreen={false}
              onReady={() => {
                console.log('YT ready, playing:', ytId);
                // Force play again after ready
                setTimeout(() => {
                  console.log('Force playing after timeout');
                }, 500);
              }}
              onError={(e) => {
                console.log('YT error:', e);
                setEmbedFailed(true);
              }}
              webViewStyle={{ backgroundColor: '#000', opacity: 0.99 }}
              webViewProps={{ 
                androidLayerType: 'hardware',
                allowsInlineMediaPlayback: true,
                mediaPlaybackRequiresUserAction: false
              }}
              initialPlayerParams={{
                autoplay: 1,
                controls: 1,
                modestbranding: 1,
                rel: 0,
                mute: 0,
                showinfo: 0,
                iv_load_policy: 3,
                start: 0
              }}
            />
          ) : embedFailed ? (
            <TouchableOpacity
              style={[StyleSheet.absoluteFill, S.thumbPh, { justifyContent: 'center', alignItems: 'center', gap: vs(8) }]}
              onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${ytId}`)}
              activeOpacity={0.85}
            >
              <Ionicons name="logo-youtube" size={s(48)} color="#FF0000" />
              <Text style={{ color: '#fff', fontSize: sf(13), fontWeight: '700' }}>YouTube-ல் பார்க்க</Text>
            </TouchableOpacity>
          ) : rawUrl ? (
            <WebView
              source={{ html: buildIframeHtml(rawUrl) }}
              style={{ flex: 1 }}
              javaScriptEnabled
              domStorageEnabled
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              allowsFullscreenVideo
              mixedContentMode="always"
              originWhitelist={['*']}
              scrollEnabled={false}
            />
          ) : (
            // Show loading indicator while video data is loading
            <View style={[StyleSheet.absoluteFill, S.thumbPh]}>
              {loading || (!video && !latestvideo) ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                  <ActivityIndicator size="large" color={PALETTE.primary} />
                  <Text style={{ color: '#fff', marginTop: vs(12), fontSize: sf(14) }}>Loading video...</Text>
                </View>
              ) : !rawUrl ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
                  <Ionicons name="play-circle" size={s(60)} color="#666" />
                  <Text style={{ color: '#666', marginTop: vs(8), fontSize: sf(14) }}>No video available</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>

        {/* ── Article body ──────────────────────────────────────────────── */}
        <View style={S.articleBody}>
          <Text style={[S.articleTitle, { fontSize: sf(14), lineHeight: sf(22) }]}>
            {video?.videotitle ?? ''}
          </Text>
          {loading && !latestvideo ? (
            <View style={{ gap: vs(10), marginVertical: vs(10) }}>
              {[1, .9, .75].map((w, i) => <View key={i} style={[S.skelLine, { width: `${w * 100}%` }]} />)}
            </View>
          ) : !!bodyText ? (
            <View>
              <ReadMoreContent html={bodyText} contentWidth={SW - s(28)} sf={sf} />
              <Text style={[S.metaDate, { fontSize: sf(14), marginTop: vs(6) }]}>{video?.standarddate || timeAgo || ''}</Text>
            </View>
          ) : null}
          <View style={[S.metaRow, { marginTop: vs(8) }]}>
          <View style={S.metaLeft}>
  {!!video?.ctitle && (
    <TouchableOpacity
      style={S.catPill}
      onPress={() => handleCatPillPress(video.ctitle)}
      activeOpacity={0.75}
    >
      <Text style={[S.catTxt, { fontSize: sf(10) }]}>{video.ctitle}</Text>
    </TouchableOpacity>
  )}
</View>
            <View style={S.metaRight}>
              {/* {commentCount > 0 && ( */}
              <TouchableOpacity style={S.metaBtn} onPress={() => setIsCommentsOpen(true)} activeOpacity={0.8}>
                <Ionicons name="chatbox" size={ms(18)} color={PALETTE.grey600} />
                {/* <Text style={{ fontSize: sf(11), color: PALETTE.grey600, marginLeft: s(3) }}>{commentCount}</Text> */}
              </TouchableOpacity>
              {/* )} */}
              <TouchableOpacity style={S.metaBtn} onPress={() => setBookmarked(b => !b)} activeOpacity={0.8}>
                <Ionicons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={ms(18)} color={bookmarked ? PALETTE.primary : PALETTE.grey600} />
              </TouchableOpacity>
              <TouchableOpacity style={S.metaBtn} onPress={handleShare} activeOpacity={0.8}>
                <Ionicons name="share-social-outline" size={ms(18)} color={PALETTE.grey600} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={S.divider} />
        </View>

        {/* Deep Link Test Button (Expo Go) */}
        {/* <TouchableOpacity 
          style={{
            backgroundColor: PALETTE.primary,
            padding: s(12),
            borderRadius: s(8),
            marginVertical: vs(10),
            alignItems: 'center'
          }}
          onPress={testDeepLinks}
          activeOpacity={0.8}
        >
          <Text style={{ color: '#fff', fontSize: sf(14), fontWeight: '700' }}>
            Test Deep Links (Expo Go)
          </Text>
        </TouchableOpacity> */}

        {/* ── Taboola mid ───────────────────────────────────────────────── */}
        {taboolaAds?.midmain && (
          <TaboolaWidget pageUrl={shareUrl} mode={taboolaAds.midmain.mode}
            container={taboolaAds.midmain.container} placement={taboolaAds.midmain.placement}
            targetType={taboolaAds.midmain.target_type} pageType="video" />
        )}

        {/* ── Google Ad ATF ─────────────────────────────────────────────── */}
        {/* {mobileAds?.top_300X250 && (
          <GoogleAdBanner slotId={mobileAds.top_300X250.slotId} adUnit={mobileAds.top_300X250.ad_unit}
            adSize={mobileAds.top_300X250.ad_size} adSize1={mobileAds.top_300X250.ad_size1} />
        )} */}
        {/* ──மேலும் வீடியோக்கள் — data.videomix (secondary list) ─────────── */}
        {videomixData.length > 0 && (
          <View style={S.section}>
            <SectionHeader title="மேலும் வீடியோக்கள்" sf={sf} />
            {videomixData.slice(0, 6).map((v, i) => (
              <VideoListCard key={`vm-${i}-${v?.videoid || ''}`} video={v} onPress={handleVideoPress} sf={sf} onCatPress={handleCatPillPress} />
            ))}
          </View>
        )}



        {/* ── morerelated load more button ──────────────────────────────── */}
        {/* {!!moreRelated && (
          <TouchableOpacity style={S.loadMoreBtn} onPress={handleLoadMore} activeOpacity={0.8} disabled={loadingMore}>
            {loadingMore
              ? <ActivityIndicator size="small" color={PALETTE.primary} />
              : <><Text style={[S.loadMoreTxt, { fontSize:sf(13) }]}>மேலும் வீடியோக்கள்</Text><Ionicons name="chevron-down" size={s(16)} color={PALETTE.primary} /></>}
          </TouchableOpacity>
        )} */}

        {/* ── morerelated loaded data ────────────────────────────────────── */}
        {/* {moreRelatedData.length > 0 && (
          <View style={S.section}>
            {moreRelatedData.map((v, i) => (
              <VideoListCard key={`mrd-${i}-${v?.videoid || ''}`} video={v} onPress={handleVideoPress} sf={sf} />
            ))}
          </View>
        )} */}

        {/* ── Google Ad MTF ─────────────────────────────────────────────── */}
        {/* {mobileAds?.mid_300x250 && relatedVideos.length > 3 && (
          <GoogleAdBanner slotId={mobileAds.mid_300x250.slotId} adUnit={mobileAds.mid_300x250.ad_unit}
            adSize={mobileAds.mid_300x250.ad_size} adSize1={mobileAds.mid_300x250.ad_size1} />
        )} */}

        {/* ── ரீல்ஸ் — data.relatedreels ONLY (separate, horizontal) ─────── */}
        {relatedReels.length > 0 && (
          <View style={S.section}>
            <SectionHeader title="ஷார்ட்ஸ்" sf={sf} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: s(12), paddingVertical: vs(10), gap: s(10) }}>
              {relatedReels.map((item, i) => (
                <ReelCard key={`rr-${i}-${item?.id || ''}`} item={item} sf={sf} onPress={handleReelPress} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── தொடர்புடையவை — data.relatedvideos (Screenshot 1 style) ─────── */}
        {relatedVideos.length > 0 && (
          <View style={S.section}>
            <SectionHeader title="தொடர்புடையவை" sf={sf} />
            {relatedVideos.map((v, i) => (
              <VideoListCard key={`rv-${i}-${v?.videoid || ''}`} video={v} onPress={handleVideoPress} sf={sf} />
            ))}
          </View>
        )}

        {/* ── செய்திகள் — data.newlist from relatedmost ─────────────────── */}
        {newsList.length > 0 && (
          <View style={S.section}>
            <SectionHeader title="செய்திகள்" sf={sf} />
            {newsList.map((item, i) => (
              <View key={`news-${i}-${item?.newsid || item?.id || ''}`}>
                <NewsCard item={item} onPress={handleNewsPress} sf={sf} />
                {i < newsList.length - 1 && (
                  <View style={S.newsCardDivider} />
                )}
              </View>
            ))}
          </View>
        )}
        {/* ── மேலும் வீடியோக்கள் — data.videoreels type=news (separate) ─── */}
        {/* {videoReelNews.length > 0 && (
          <View style={S.section}>
            <SectionHeader title="மேலும் வீடியோக்கள்" sf={sf} />
            {videoReelNews.map((v, i) => (
              <VideoListCard key={`vrn-${i}-${v?.videoid || ''}`} video={v} onPress={handleVideoPress} sf={sf} />
            ))}
          </View>
        )} */}

        {/* ── ஷார்ட்ஸ் — data.videoreels type=reels (separate, horizontal) ─ */}
        {/* {videoReelReels.length > 0 && (
          <View style={S.section}>
            <SectionHeader title="ஷார்ட்ஸ்" sf={sf} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: s(12), paddingVertical: vs(10), gap: s(10) }}>
              {videoReelReels.map((item, i) => (
                <ReelCard key={`vrs-${i}-${item?.id || ''}`} item={item} sf={sf} onPress={handleReelPress} />
              ))}
            </ScrollView>
          </View>
        )} */}



        {/* ── மாவட்டங்கள் tag row — data.videodistrict ─────────────────── */}
        {/* <DistrictTagList districts={videoDistrict} onPress={handleDistrictTagPress} sf={sf} /> */}

        {/* ── Google Ad BTF ─────────────────────────────────────────────── */}
        {/* {mobileAds?.bottom_300x250 && (
          <GoogleAdBanner slotId={mobileAds.bottom_300x250.slotId} adUnit={mobileAds.bottom_300x250.ad_unit}
            adSize={mobileAds.bottom_300x250.ad_size} adSize1={mobileAds.bottom_300x250.ad_size1} />
        )} */}

      </ScrollView>

      {showScrollTop && (
        <TouchableOpacity style={S.scrollTopBtn} onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}>
          <Ionicons name="arrow-up" size={s(20)} color={PALETTE.white} />
        </TouchableOpacity>
      )}

      {/* ── Floating Player ───────────────────────────────────────────────── */}
      {isPlayerActive && (
        <Animated.View
          style={[S.floatFull, pip ? S.floatPip : null, { left: aLeft, top: aTop, transform: [{ translateX: aDX }, { translateY: aDY }] }]}
          {...(pip ? pan.panHandlers : {})}>
          {activeYtId ? (
            <YoutubePlayer height={VH} width={SW} videoId={activeYtId} play={true}forceAndroidAutoplay={true}
              onReady={() => { }} onChangeState={() => { }}
              webViewStyle={{ backgroundColor: '#000', opacity: 0.99 }}
              webViewProps={{ androidLayerType: 'hardware' }}
              initialPlayerParams={{ rel: false, modestbranding: true, controls: true, autoplay: 1 }} />
          ) : (
            <WebView source={{ html: buildIframeHtml(activeRawUrl) }} style={{ flex: 1, backgroundColor: '#000' }}
              allowsFullscreenVideo javaScriptEnabled domStorageEnabled
              mediaPlaybackRequiresUserAction={false} allowsInlineMediaPlayback
              scrollEnabled={false} originWhitelist={['*']}
              backgroundColor="#000" mixedContentMode="always" allowsProtectedMedia />
          )}
          {pip && (
            <>
              <View style={S.pipBar} pointerEvents="none"><View style={S.pipBarLine} /></View>
              <View style={S.pipCtrl} pointerEvents="box-none">
                <TouchableOpacity style={S.pipBtn} onPress={expandPip} activeOpacity={0.8}><Ionicons name="expand" size={s(13)} color="#fff" /></TouchableOpacity>
                <TouchableOpacity style={S.pipBtn} onPress={closePip} activeOpacity={0.8}><Ionicons name="close" size={s(13)} color="#fff" /></TouchableOpacity>
              </View>
            </>
          )}
        </Animated.View>
      )}

      <DrawerMenu isVisible={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} onMenuPress={() => { }} navigation={navigation} />
      <LocationDrawer isVisible={isLocDrawerOpen} onClose={() => setIsLocDrawerOpen(false)} onSelectDistrict={handleSelectDistrict} selectedDistrict={district} />
      <CommentsModal visible={isCommentsOpen} onClose={() => setIsCommentsOpen(false)}
        newsId={video?.videoid || videoId} newsTitle={video?.videotitle}
        commentCount={commentCount} preloadedComments={videoComments} />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.grey100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: vs(12) },
  retryBtn: { marginTop: vs(16), backgroundColor: PALETTE.primary, borderRadius: s(8), paddingHorizontal: s(20), paddingVertical: vs(10) },

  slot: { width: '100%', height: VH, backgroundColor: '#000', overflow: 'hidden',justifyContent:"center",alignItems:"center",},
  grad: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,.28)' },
  thumbPh: { flex: 1, backgroundColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center' },
  centerPlay: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -s(31) }, { translateY: -s(31) }] },
  playCircle: { backgroundColor: 'rgba(9,109,210,.88)', justifyContent: 'center', alignItems: 'center', borderWidth: 2.5, borderColor: 'rgba(255,255,255,.65)' },
  playTriangle: { width: 0, height: 0, borderStyle: 'solid', borderTopColor: 'transparent', borderBottomColor: 'transparent', borderLeftColor: PALETTE.white },
  durBadge: { position: 'absolute', bottom: 0, right: s(5), backgroundColor: 'rgba(0,0,0,.75)', paddingHorizontal: s(7), paddingVertical: vs(2) },
  loadBadge: { position: 'absolute', bottom: vs(10), left: s(10), backgroundColor: 'rgba(0,0,0,.45)', borderRadius: s(12), padding: s(6) },
  pipHint: { position: 'absolute', bottom: vs(10), alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,.55)', paddingHorizontal: s(10), paddingVertical: vs(3), borderRadius: s(12) },

  floatFull: { position: 'absolute', width: SW, height: VH, backgroundColor: '#000', overflow: 'hidden', elevation: 25, zIndex: 9999, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  floatPip: { width: PW, height: PH, borderRadius: s(10) },
  pipCtrl: { position: 'absolute', top: s(8), right: s(8), flexDirection: 'row', gap: s(6), zIndex: 10 },
  pipBtn: { width: s(28), height: s(28), borderRadius: s(14), backgroundColor: 'rgba(0,0,0,.75)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.3)' },
  pipBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: s(16), justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,.3)' },
  pipBarLine: { width: s(28), height: s(3), borderRadius: s(2), backgroundColor: 'rgba(255,255,255,.55)' },

  articleBody: {  paddingTop: vs(12), paddingBottom: vs(4) },
  articleTitle: { fontFamily: FONTS.muktaMalar.semibold, color: COLORS.text, marginBottom: vs(8) },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: vs(4) },
  metaLeft: { flexDirection: 'row', alignItems: 'center', gap: s(8), flex: 1 },
  metaRight: { flexDirection: 'row', alignItems: 'center', gap: s(6) },
  metaBtn: { flexDirection: 'row', alignItems: 'center', padding: s(6), borderRadius: s(4), backgroundColor: PALETTE.grey100, borderWidth: 1, borderColor: PALETTE.grey300 },
  catPill: { paddingHorizontal: s(8), paddingVertical: vs(2), borderWidth: 1, borderColor: PALETTE.grey400, fontFamily: FONTS.muktaMalar.regular },
  catTxt: { color: PALETTE.grey600, fontWeight: '600', fontFamily: FONTS.muktaMalar.regular },
  metaDate: { color: PALETTE.grey500, fontFamily: FONTS.muktaMalar.regular },
  divider: { height: 1, backgroundColor: PALETTE.grey300, marginTop: vs(10) },
  skelLine: { height: vs(14), backgroundColor: PALETTE.grey300, borderRadius: s(4) },

  section: { backgroundColor: PALETTE.white, marginTop: vs(6) },
  newsCardDivider: {
    height: vs(8),
    backgroundColor: PALETTE.grey200,
  },

  sectionHeader: {
    backgroundColor: PALETTE.white,
    // paddingHorizontal: s(12),
    paddingTop: vs(14),
    paddingBottom: vs(10),
  },
  sectionTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    color: PALETTE.grey800,
    marginBottom: vs(2),
  },
  sectionUnderline: {
    height: vs(4.5),
    // width: s(60),
    backgroundColor: PALETTE.primary,
  },

  // VideoListCard — full-width thumb + info below (matches Screenshot 1)
  vidListCard: { backgroundColor: PALETTE.white, marginTop: ms(10) },
  vidListThumb: { width: '100%', aspectRatio: 16 / 9, backgroundColor: PALETTE.dark, position: 'relative' },
  vidThumnail: { width: '100%', height: '100%' },
  vidListOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: vs(4),
    paddingHorizontal: s(8),
    borderRadius: ms(8)
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.3)',
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
  vidListPlayWrap: { position: 'absolute', bottom: vs(8), left: s(8) },
  vidDurBadge: { position: 'absolute', bottom: vs(6), right: s(8), backgroundColor: 'rgba(0,0,0,.75)', paddingHorizontal: s(6), paddingVertical: vs(2), borderRadius: s(3) },
  vidDurTxt: { color: PALETTE.white, fontWeight: '700', fontFamily: FONTS.muktaMalar.regular },
  vidListInfo: { paddingVertical: vs(8), paddingHorizontal: ms(12) },
  vidListTitle: { fontFamily: FONTS.muktaMalar.bold, color: PALETTE.grey800, fontWeight: '700', marginBottom: vs(4) },
  vidListMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: ms(7) },
  cardDivider: { height: vs(6), backgroundColor: PALETTE.grey200 },

  // ReelCard
  reelCard: {
    width: s(120),
    marginRight: s(12),
  },
  image: {
    width: '100%',
    height: '100%',
  },
  reelThumb: {
    width: '100%',
    height: vs(200),
    borderRadius: s(8),
    overflow: 'hidden',
    backgroundColor: PALETTE.grey200,
    // marginBottom: vs(8),
  },
  reelPlayWrap: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -s(14) }, { translateY: -s(14) }] },
  reelTitle: { color: PALETTE.grey800, marginTop: vs(4), paddingHorizontal: s(2) },

  // District tags
  distTagSec: { backgroundColor: PALETTE.white, marginTop: vs(6) },
  distTag: { flexDirection: 'row', alignItems: 'center', gap: s(4), paddingHorizontal: s(12), paddingVertical: vs(7), borderRadius: s(20), borderWidth: 1, borderColor: PALETTE.primary, backgroundColor: PALETTE.primary + '12' },
  distTagTxt: { color: PALETTE.primary, fontWeight: '600' },

  // News Card
  newsCard: { backgroundColor: PALETTE.white, },
  newsCardThumb: { width: '100%', height: vs(200), backgroundColor: PALETTE.grey200, overflow: 'hidden' },
  newsCardPlaceholder: { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  newsCardPlaceholderLogo: { width: s(140), height: vs(60), opacity: 0.25 },
  newsCardInfo: {
    // paddingHorizontal:ms(12),
    margin: ms(12),
    // paddingTop: ms(7),
    gap: ms(7)
  },
  newsCardTitle: { fontFamily: FONTS.muktaMalar.bold, color: PALETTE.grey800, fontWeight: '700', marginBottom: vs(8) },
  newsCardCatWrap: { marginBottom: vs(6) },
  newsCardCatPill: { alignSelf: 'flex-start', borderWidth: 1, borderColor: PALETTE.grey400, paddingHorizontal: s(10), paddingVertical: vs(3) },
  newsCardCatTxt: { color: PALETTE.grey600, fontWeight: '600', fontFamily: FONTS.muktaMalar.regular },
  newsCardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: s(8), marginTop: vs(2) },
  newsCardCommentRow: { flexDirection: 'row', alignItems: 'center' },
  newsCardAgo: { color: PALETTE.primary, fontFamily: FONTS.muktaMalar.regular },

  // Load more
  loadMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: s(6), marginHorizontal: s(14), marginVertical: vs(4), paddingVertical: vs(12), borderWidth: 1, borderColor: PALETTE.primary, borderRadius: s(8), backgroundColor: PALETTE.white },
  loadMoreTxt: { color: PALETTE.primary, fontWeight: '700' },

  fab: { position: 'absolute', bottom: vs(24), right: s(20), width: s(48), height: s(48), borderRadius: s(24), backgroundColor: PALETTE.primary, alignItems: 'center', justifyContent: 'center', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6 },
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
});

export default VideoDetailScreen;