import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  Dimensions, PanResponder, Animated, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer from 'react-native-youtube-iframe';
import { WebView } from 'react-native-webview';
import { s, vs, ms } from '../utils/scaling';
import { COLORS, FONTS } from '../utils/constants';
import { useFontSize } from '../context/FontSizeContext';

const { width: SW, height: SH } = Dimensions.get('window');
const VH = (SW * 9) / 16;   // full player height
const PW = SW * 0.58;        // PIP width
const PH = (PW * 9) / 16;   // PIP height
const PM = s(12);            // PIP margin
const PIP_X = SW - PW - PM; // PIP default X
const PIP_Y = SH * 0.52;    // PIP default Y

// ─── Helpers (same as VideoDetailScreen) ─────────────────────────────────────
function getYouTubeId(url) {
  if (!url) return null;
  const str = String(url).trim();
  for (const re of [
    /youtu\.be\/([^?&\s]+)/,
    /youtube\.com\/watch\?v=([^&\s]+)/,
    /youtube\.com\/embed\/([^?&\s]+)/,
    /youtube\.com\/shorts\/([^?&\s]+)/,
  ]) {
    const m = str.match(re);
    if (m?.[1]) return m[1];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
  return null;
}

function buildIframeHtml(url = '') {
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;background:#000;overflow:hidden}iframe{width:100%;height:100%;border:none;display:block}</style></head><body><iframe src="${url}" frameborder="0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture;fullscreen" allowfullscreen></iframe></body></html>`;
}

function SectionHeader({ title }) {
  const { sf } = useFontSize();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { fontSize: sf(18) }]}>{title}</Text>
      <View style={styles.sectionUnderline} />
    </View>
  );
}

// ─── AlsoSeeThis with PIP ─────────────────────────────────────────────────────
const AlsoSeeThis = ({ item, onPress, scrollY = 0, playerPageY = 0 }) => {
  const { sf } = useFontSize();
  const [playing, setPlaying]   = useState(false);
  const [pip, setPip]           = useState(false);

  // ── PIP animation refs (same as VideoDetailScreen) ───────────────────────
  const pipRef   = useRef(false);
  const aLeft    = useRef(new Animated.Value(0)).current;
  const aTop     = useRef(new Animated.Value(0)).current;
  const aDX      = useRef(new Animated.Value(0)).current;
  const aDY      = useRef(new Animated.Value(0)).current;
  const restPos  = useRef({ x: PIP_X, y: PIP_Y });
  const slotY    = useRef(0); // Y position of player slot on screen

  useEffect(() => { pipRef.current = pip; }, [pip]);

  // ── PanResponder (same as VideoDetailScreen) ─────────────────────────────
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => pipRef.current,
    onMoveShouldSetPanResponder:  () => pipRef.current,
    onPanResponderGrant: () => { aDX.setValue(0); aDY.setValue(0); },
    onPanResponderMove: Animated.event(
      [null, { dx: aDX, dy: aDY }],
      { useNativeDriver: false }
    ),
    onPanResponderRelease: (_, g) => {
      const nx = restPos.current.x + g.dx;
      const ny = Math.min(
        Math.max(restPos.current.y + g.dy, vs(60)),
        SH - PH - vs(40)
      );
      // Snap to nearest edge
      const sx = nx + PW / 2 < SW / 2 ? PM : SW - PW - PM;
      restPos.current = { x: sx, y: ny };
      aDX.setValue(0); aDY.setValue(0);
      Animated.parallel([
        Animated.spring(aLeft, { toValue: sx, useNativeDriver: false, friction: 6, tension: 50 }),
        Animated.spring(aTop,  { toValue: ny, useNativeDriver: false, friction: 6, tension: 50 }),
      ]).start();
    },
  })).current;

  // ── Go PIP ───────────────────────────────────────────────────────────────
  const goPip = useCallback(() => {
    restPos.current = { x: PIP_X, y: PIP_Y };
    aDX.setValue(0); aDY.setValue(0);
    Animated.parallel([
      Animated.spring(aLeft, { toValue: PIP_X, useNativeDriver: false, friction: 8, tension: 70 }),
      Animated.spring(aTop,  { toValue: PIP_Y, useNativeDriver: false, friction: 8, tension: 70 }),
    ]).start();
  }, []);

  // ── Go Full ──────────────────────────────────────────────────────────────
  const goFull = useCallback(() => {
    aDX.setValue(0); aDY.setValue(0);
    Animated.parallel([
      Animated.spring(aLeft, { toValue: 0,           useNativeDriver: false, friction: 8, tension: 70 }),
      Animated.spring(aTop,  { toValue: slotY.current, useNativeDriver: false, friction: 8, tension: 70 }),
    ]).start();
  }, []);

  // ── Expand PIP → full ────────────────────────────────────────────────────
  const expandPip = () => {
    setPip(false);
    goFull();
  };

  // ── Close PIP ────────────────────────────────────────────────────────────
  const closePip = () => {
    setPlaying(false);
    setPip(false);
    aDX.setValue(0); aDY.setValue(0);
  };

  // ── Scroll handler — parent screen must call this ────────────────────────
  // Pass scrollY as a prop OR use the onScroll below with a ref
  const handleScroll = useCallback((e) => {
    if (!playing) return;
    const offsetY = e.nativeEvent.contentOffset.y;
    const past = offsetY > slotY.current + VH - s(20);
    if (past && !pipRef.current) {
      setPip(true);
      goPip();
    }
    if (!past && pipRef.current) {
      setPip(false);
      goFull();
    }
  }, [playing, goPip, goFull]);

  if (!item) return null;

  const sectionTitle = item.title    || 'இதையும் பாருங்க';
  const newsTitle    = item.videotitle || item.newstitle || '';
  const category     = item.maincat  || item.ctitle || '';
  const image        = item.images   || item.largeimages ||
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';
  const ago          = item.ago      || item.standarddate || '';
  const duration     = item.duration || '';
  const videoPath    = item.videopath || '';
  const ytId         = getYouTubeId(videoPath);

  // Check if this is a video section ("இதையும் பாருங்க") and has video content
  const isVideoSection = sectionTitle === 'இதையும் பாருங்க';
  const hasVideoContent = videoPath || ytId;
  const shouldShowVideoPlayer = isVideoSection && hasVideoContent;

  return (
    // ✅ Wrap in ScrollView so we can detect scroll inside this component
    <ScrollView
      scrollEventThrottle={16}
      onScroll={handleScroll}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true}
    >
      <View style={styles.container}>
        <SectionHeader title={sectionTitle} />

        <View style={styles.card}>

          {/* ── Player Slot ─────────────────────────────────────────── */}
          {shouldShowVideoPlayer ? (
            <View
              style={[styles.playerContainer, { height: VH }]}
              onLayout={(e) => {
                // ✅ Record absolute Y of player slot for PIP trigger
                e.target.measure((x, y, w, h, px, py) => {
                  slotY.current = py;
                });
              }}
            >
              {playing ? (
                pip ? (
                  // ✅ When PIP active — show placeholder in slot
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="play-circle-outline" size={s(40)} color="rgba(255,255,255,0.3)" />
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: sf(12), marginTop: vs(6) }}>
                      Mini player இயங்குகிறது
                    </Text>
                  </View>
                ) : (
                  // ✅ Full player
                  ytId ? (
                    <YoutubePlayer
                      height={VH}
                      width={SW}
                      videoId={ytId}
                      play={true}
                      webViewStyle={{ backgroundColor: '#000', opacity: 0.99 }}
                      webViewProps={{ androidLayerType: 'hardware' }}
                      initialPlayerParams={{
                        rel: false,
                        modestbranding: true,
                        controls: true,
                        autoplay: 1,
                      }}
                    />
                  ) : (
                    <WebView
                      source={{ html: buildIframeHtml(videoPath) }}
                      style={{ flex: 1, backgroundColor: '#000' }}
                      allowsFullscreenVideo
                      javaScriptEnabled
                      domStorageEnabled
                      mediaPlaybackRequiresUserAction={false}
                      allowsInlineMediaPlayback
                      scrollEnabled={false}
                      originWhitelist={['*']}
                      mixedContentMode="always"
                    />
                  )
                )
              ) : (
                // ✅ Thumbnail — tap to play
                <TouchableOpacity
                  style={StyleSheet.absoluteFill}
                  onPress={() => setPlaying(true)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: image }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="contain"
                  />
                  <View style={styles.overlay} />
                  <View style={styles.playCenter}>
                    <View style={styles.playBtn}>
                      <Ionicons name="play" size={s(26)} color="#fff" />
                    </View>
                  </View>
                  {!!duration && (
                    <View style={styles.durationBadge}>
                      <Text style={[styles.durationText, { fontSize: sf(11) }]}>
                        {duration}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ) : (
            // ✅ Simple image display for reading sections ("இதையும் படிங்க")
            <TouchableOpacity
              style={[styles.playerContainer, { height: VH }]}
              onPress={() => onPress && onPress(item)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: image }}
                style={StyleSheet.absoluteFill}
                resizeMode="contain"
              />
            </TouchableOpacity>
          )}

          {/* ── Text content ────────────────────────────────────────── */}
          <TouchableOpacity
            style={styles.textContent}
            onPress={() => onPress && onPress(item)}
            activeOpacity={0.9}
          >
            <Text
              style={[styles.newsTitle, { fontSize: sf(14), lineHeight: sf(22) }]}
              numberOfLines={3}
            >
              {newsTitle}
            </Text>
            <View style={styles.metaRow}>
              {!!category && (
                <View style={styles.catPill}>
                  <Text style={[styles.catText, { fontSize: sf(12) }]}>{category}</Text>
                </View>
              )}
              <Text style={[styles.timeText, { fontSize: sf(12) }]}>{ago}</Text>
            </View>
          </TouchableOpacity>

        </View>
      </View>

      {/* ✅ Floating PIP player — same as VideoDetailScreen */}
      {playing && pip && (
        <Animated.View
          style={[
            styles.floatPip,
            {
              left: Animated.add(aLeft, aDX),
              top:  Animated.add(aTop,  aDY),
            },
          ]}
          {...pan.panHandlers}
        >
          {/* Player inside PIP */}
          {ytId ? (
            <YoutubePlayer
              height={PH}
              width={PW}
              videoId={ytId}
              play={true}
              webViewStyle={{ backgroundColor: '#000', opacity: 0.99 }}
              webViewProps={{ androidLayerType: 'hardware' }}
              initialPlayerParams={{ rel: false, controls: true, autoplay: 1 }}
            />
          ) : (
            <WebView
              source={{ html: buildIframeHtml(videoPath) }}
              style={{ flex: 1, backgroundColor: '#000' }}
              allowsFullscreenVideo
              javaScriptEnabled
              domStorageEnabled
              mediaPlaybackRequiresUserAction={false}
              allowsInlineMediaPlayback
              scrollEnabled={false}
              originWhitelist={['*']}
              mixedContentMode="always"
            />
          )}

          {/* PIP drag handle bar */}
          <View style={styles.pipBar} pointerEvents="none">
            <View style={styles.pipBarLine} />
          </View>

          {/* PIP controls */}
          <View style={styles.pipCtrl} pointerEvents="box-none">
            <TouchableOpacity style={styles.pipBtn} onPress={expandPip} activeOpacity={0.8}>
              <Ionicons name="expand" size={s(13)} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.pipBtn} onPress={closePip} activeOpacity={0.8}>
              <Ionicons name="close" size={s(13)} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: vs(10),
    paddingHorizontal:s(12),
    borderWidth:s(1),
    borderColor:COLORS.grey300
  },

  sectionHeader: {
    backgroundColor: COLORS.white,
    // paddingHorizontal: s(12),
    paddingTop: vs(14),
    paddingBottom: vs(10),
  },
  sectionTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    color: COLORS.text || '#212B36',
  },
  sectionUnderline: {
    height: vs(3),
    width: s(40),
    backgroundColor: COLORS.primary,
    marginTop: vs(2),
  },
  card: {
    backgroundColor: COLORS.white,
    overflow: 'hidden',
  },
  playerContainer: {
    width: '100%',
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playCenter: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtn: {
    width: s(56),
    height: s(56),
    borderRadius: s(28),
    backgroundColor: 'rgba(9,109,210,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: s(3),
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.65)',
  },
  durationBadge: {
    position: 'absolute',
    bottom: s(8), right: s(8),
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
    borderRadius: s(3),
  },
  durationText: {
    color: '#fff',
    fontFamily: FONTS.muktaMalar.medium,
    fontWeight: '600',
  },
  textContent: {
    paddingHorizontal: s(12),
    paddingTop: vs(10),
    paddingBottom: vs(14),
  },
  newsTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    color: COLORS.text || '#212B36',
    marginBottom: vs(8),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s(8),
  },
  catPill: {
    borderWidth: 1,
    borderColor: '#DFE3E8',
    paddingHorizontal: s(10),
    paddingVertical: vs(3),
  },
  catText: {
    fontFamily: FONTS.muktaMalar.bold,
    color: '#454F5B',
  },
  timeText: {
    fontFamily: FONTS.muktaMalar.regular,
    color: COLORS.subtext || '#637381',
  },

  // ── Floating PIP (same as VideoDetailScreen) ──────────────────────────────
  floatPip: {
    position: 'absolute',
    width: PW,
    height: PH,
    borderRadius: s(10),
    backgroundColor: '#000',
    overflow: 'hidden',
    elevation: 25,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  pipCtrl: {
    position: 'absolute',
    top: s(6), right: s(6),
    flexDirection: 'row',
    gap: s(6),
    zIndex: 10,
  },
  pipBtn: {
    width: s(26), height: s(26),
    borderRadius: s(13),
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  pipBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: s(14),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  pipBarLine: {
    width: s(24), height: s(3),
    borderRadius: s(2),
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
});

export default AlsoSeeThis;