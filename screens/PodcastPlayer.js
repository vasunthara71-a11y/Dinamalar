import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Share,
  Animated,
  Easing,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome, Feather } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { useNavigation } from '@react-navigation/native';
import { ms, vs } from 'react-native-size-matters';
import UniversalHeaderComponent from '../components/UniversalHeaderComponent';
import AppHeaderComponent from '../components/AppHeaderComponent';

const { width: SW } = Dimensions.get('window');

function fmt(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];
const BLUE = '#1a6fc4';
const PILL_BG = '#ebebeb';
const ACTIVE_BG = '#dde8f8';
const BORDER = '#e2e2e2';
const T_DARK = '#111';
const T_MID = '#444';
const T_MUTED = '#888';
const T_LIGHT = '#aaa';

// ── Animated wave bars (shown for active + playing row) ──────────────────────
function WaveBars() {
  const bars = [useRef(new Animated.Value(0.4)).current,
  useRef(new Animated.Value(0.8)).current,
  useRef(new Animated.Value(0.5)).current];

  useEffect(() => {
    bars.forEach((bar, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(bar, { toValue: 1, duration: 300 + i * 80, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(bar, { toValue: 0.3, duration: 300 + i * 80, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 18, gap: 2 }}>
      {bars.map((bar, i) => (
        <Animated.View
          key={i}
          style={{
            width: 3,
            height: 18,
            borderRadius: 2,
            backgroundColor: BLUE,
            transform: [{ scaleY: bar }],
          }}
        />
      ))}
    </View>
  );
}

export default function PodcastPlayer() {
  const navigation = useNavigation();
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [curIdx, setCurIdx] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const [speedMenu, setSpeedMenu] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isLocationDrawerVisible, setIsLocationDrawerVisible] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('உள்ளூர்');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const flatListRef = useRef(null);
  const pbW = useRef(SW - 32 - 80);
  const prevIdx = useRef(0);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true, interruptionMode: 'doNotMix' })
      .then(() => setIsReady(true)).catch(() => setIsReady(true));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('https://dmrapi.dinamalar.com/audio');
        const j = await r.json();
        setEpisodes(j?.newlist?.[0]?.data ?? []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const cur = episodes[curIdx];
  const player = useAudioPlayer(cur ? { uri: cur.audio } : null);
  const st = useAudioPlayerStatus(player);

  const playing = st?.playing ?? false;
  const buffering = st?.isBuffering ?? false;
  const pos = st?.currentTime ?? 0;
  const dur = st?.duration ?? 0;
  const pct = dur > 0 ? Math.min(pos / dur, 1) : 0;

  useEffect(() => {
    if (st?.didJustFinish && curIdx < episodes.length - 1) setCurIdx(i => i + 1);
  }, [st?.didJustFinish]);

  useEffect(() => {
    if (prevIdx.current !== curIdx && player) {
      prevIdx.current = curIdx;
      const t = setTimeout(() => { try { player.play(); } catch (_) { } }, 400);
      return () => clearTimeout(t);
    }
  }, [curIdx]);

  const togglePlay = () => {
    if (!player || !isReady) return;
    if (playing) player.pause();
    else { if (st?.didJustFinish) player.seekTo(0); player.play(); }
  };
  const playNext = () => { if (curIdx < episodes.length - 1) setCurIdx(i => i + 1); };
  const playPrev = () => { if (curIdx > 0) setCurIdx(i => i - 1); };
  const seek = e => {
    if (!player || !dur) return;
    player.seekTo(Math.max(0, Math.min((e.nativeEvent.locationX / pbW.current) * dur, dur)));
  };
  const pickSpeed = sp => {
    setSpeed(sp); setSpeedMenu(false);
    try { player?.setRate?.(sp); } catch (_) { }
  };
  const doShare = async () => {
    if (!cur) return;
    try { await Share.share({ message: `${cur.newstitle}\n${cur.audio}` }); } catch (_) { }
  };

  // Header handlers
  const handleMenuPress = () => setIsDrawerVisible(true);
  const handleSearch = () => navigation.navigate('SearchScreen');
  const handleLocation = () => setIsLocationDrawerVisible(true);
  const handleNotification = () => console.log('Notification pressed');
  const onSelectDistrict = (district) => setSelectedDistrict(district);

  // Scroll handlers
  const handleScroll = (event) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    setShowScrollTop(scrollY > 300);
  };

  const scrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  // ── Episode row ───────────────────────────────────────────────────────────
  const renderItem = ({ item, index }) => {
    const active = index === curIdx;
    return (
      <TouchableOpacity
        style={[S.epRow, active && S.epRowActive]}
        onPress={() => setCurIdx(index)}
        activeOpacity={0.75}
      >
        {/* Icon: animated wave bars when active+playing, music note otherwise */}
        <View style={S.epIconWrap}>
          {active && playing
            ? <WaveBars />
            : <Ionicons name="musical-note" size={18} color={active ? BLUE : '#c8c8c8'} />
          }
        </View>

        {/* Text */}
        <View style={S.epTextWrap}>
          <Text style={[S.epTitle, active && S.epTitleActive]} numberOfLines={2}>
            {item.newstitle}
          </Text>
          <View style={S.epMetaRow}>
             <Ionicons name="calendar-outline" size={11} color={T_LIGHT} />
            <Text style={S.epMeta}> {item.standarddate}</Text>
            <Text style={S.epMetaSep}>  |  </Text>
            <Ionicons name="time-outline" size={11} color={T_LIGHT} />
            <Text style={S.epMeta}> {item.time}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return (
    <SafeAreaView style={S.centered}>
      <ActivityIndicator size="large" color={BLUE} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={S.container}>
      <UniversalHeaderComponent
        statusBarStyle="dark-content"
        statusBarBackgroundColor="#fff"
        onMenuPress={handleMenuPress}
        onNotification={handleNotification}
        isDrawerVisible={isDrawerVisible}
        setIsDrawerVisible={setIsDrawerVisible}
        navigation={navigation}
        isLocationDrawerVisible={isLocationDrawerVisible}
        setIsLocationDrawerVisible={setIsLocationDrawerVisible}
        onSelectDistrict={onSelectDistrict}
        selectedDistrict={selectedDistrict}
      >
        <AppHeaderComponent
          onSearch={handleSearch}
          onMenu={handleMenuPress}
          onLocation={handleLocation}
          selectedDistrict={selectedDistrict}
        />
      </UniversalHeaderComponent>

      <FlatList
        ref={flatListRef}
        data={episodes}
        keyExtractor={item => String(item.newsid)}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={() => (
          <View>

            {/* ── SECTION LABEL ─────────────────────────────────────────── */}
            <View style={S.sectionWrap}>
              <Text style={S.sectionTxt}>Podcast</Text>
              <View style={S.sectionLine} />
            </View>

            {cur && (
              <View style={S.playerWrap}>

                {/* ── CARD: image + title ──────────────────────────────── */}
                {/*
                  Screenshot shows:
                  - image ~110x110, border-radius ~4, subtle shadow/elevation
                  - white card background, no outer card border
                  - title 14px semibold, 2-3 lines
                  - date|time row 12px grey below title
                  - gap between image and text ~12
                */}
                <View style={S.card}>
                  {/* Image with shadow wrapper */}
                  <View style={S.thumbShadow}>
                    <Image
                      source={{ uri: cur.images }}
                      style={S.thumb}
                      resizeMode="cover"
                    />
                  </View>
                  <View style={S.cardInfo}>
                    <Text style={S.cardTitle}>{cur.newstitle}</Text>
                    <View style={S.cardMetaRow}>
                      <Ionicons name="calendar-outline" size={12} color={T_MUTED} />
                      <Text style={S.cardMetaTxt}> {cur.standarddate}</Text>
                      <Text style={S.cardMetaSep}>  |  </Text>
                      <Ionicons name="time-outline" size={12} color={T_MUTED} />
                      <Text style={S.cardMetaTxt}> {cur.time}</Text>
                    </View>
                  </View>

                </View>

                {/* ── CONTROLS: ⏮  [● 0:05 ── ⏸]  🔊  1X▾  ⏭ ─────────── */}
                {/*
                  Screenshot shows:
                  - ⏮ and ⏭ solid blue, skip-back / skip-forward style
                  - pill: grey #ebebeb, large rounded, blue dot ●, time, pause/play icon
                  - 🔊 volume blue outline
                  - [1X ▾] white box with border
                  - all items vertically centered
                */}
                <View style={S.ctrlRow}>

                  {/* ⏮ */}
                  <TouchableOpacity onPress={playPrev} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="play-skip-back" size={26} color={BLUE} />
                  </TouchableOpacity>

                  {/* PILL */}
                  <TouchableOpacity
                    style={S.pill}
                    onPress={togglePlay}
                    disabled={!isReady}
                    activeOpacity={0.85}
                  >
                    {/* <View style={S.pillDot} /> */}
                    {/* <Text style={S.pillTime}>{fmt(pos)}</Text> */}
                    {buffering
                      ? <ActivityIndicator size="small" color={BLUE} style={{ marginRight: 12 }} />
                      : <Ionicons
                        name={playing ? 'pause' : 'play'}
                        size={24}
                        color={BLUE}
                        style={{ marginRight: 12 }}
                      />
                    }
                    {/* 🔊 volume */}
                    <View style={S.progressRow}>
                      {/* <Text style={S.timeTxt}>{fmt(pos)}</Text> */}
                      <View
                        style={S.trackWrap}
                        onLayout={e => { pbW.current = e.nativeEvent.layout.width; }}
                        onTouchEnd={seek}
                      >
                        <View style={S.trackBg} />
                        <View style={[S.trackFill, { width: `${pct * 100}%` }]} />
                        <View style={[S.trackThumb, { left: `${pct * 100}%` }]} />
                      </View>
                      {/* <Text style={S.timeTxt}>{fmt(dur)}</Text> */}
                    </View>
                    <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
                      <Ionicons name="volume-medium-outline" size={24} color={BLUE} />
                    </TouchableOpacity>
                  </TouchableOpacity>



                  {/* SPEED */}
                  <View>
                    <TouchableOpacity style={S.speedBox} onPress={() => setSpeedMenu(v => !v)}>
                      <Text style={S.speedTxt}>{speed}X</Text>
                      <Ionicons name="chevron-down" size={13} color={T_MID} style={{marginLeft:ms(20)}} />
                    </TouchableOpacity>
                    {speedMenu && (
                      <View style={S.speedMenu}>
                        {SPEEDS.map(sp => (
                          <TouchableOpacity
                            key={sp}
                            style={[S.speedItem, speed === sp && S.speedItemOn]}
                            onPress={() => pickSpeed(sp)}
                          >
                            <Text style={[S.speedItemTxt, speed === sp && S.speedItemTxtOn]}>
                              {sp}x
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* ⏭ */}
                  <TouchableOpacity onPress={playNext} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons name="play-skip-forward" size={26} color={BLUE} />
                  </TouchableOpacity>

                </View>

                
                <View style={S.shareRow}>
                  <TouchableOpacity style={S.shareBtn} onPress={doShare}>
                    <FontAwesome name="facebook" size={18} color="#1877F2" />
                  </TouchableOpacity>
                  <TouchableOpacity style={S.shareBtn} onPress={doShare}>
                    <FontAwesome name="twitter" size={17} color="#1DA1F2" />
                  </TouchableOpacity>
                  <TouchableOpacity style={S.shareBtn} onPress={doShare}>
                    <FontAwesome name="whatsapp" size={19} color="#25D366" />
                  </TouchableOpacity>
                  <TouchableOpacity style={S.shareBtn} onPress={doShare}>
                    <Ionicons name="send" size={16} color="#229ED9" />
                  </TouchableOpacity>
                  <TouchableOpacity style={S.shareBtn} onPress={doShare}>
                    <Feather name="share" size={17} color={T_MID} />
                  </TouchableOpacity>
                  <TouchableOpacity style={S.shareBtn} onPress={doShare}>
                    <Feather name="bookmark" size={17} color={T_MID} />
                  </TouchableOpacity>
                </View>

              </View>
            )}
          </View>
        )}
      />

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <TouchableOpacity 
          style={S.scrollTopBtn} 
          onPress={scrollToTop} 
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-up" size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: "#fff", paddingTop: Platform.OS === 'android' ? vs(30) : 0 },
  
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  logoTxt: { fontSize: 18, fontWeight: '700', color: T_DARK },
  logoSub: { fontSize: 10, color: T_MUTED },

  // Section
  sectionWrap: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 4 },
  sectionTxt: { fontSize: 20, fontWeight: '700', color: T_DARK },
  sectionLine: { marginTop: 4, height: 2.5, width: 55, backgroundColor: BLUE, borderRadius: 2 },

  // Player area
  playerWrap: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 4 },

  // Card
  card: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    alignItems: 'flex-start',
  },

  // Image wrapper — gives shadow on Android via elevation
  thumbShadow: {
    borderRadius: 6,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    backgroundColor: '#fff',
  },
  thumb: {
    width: 110,
    height: 110,
    borderRadius: 6,         // matches screenshot — soft radius
    backgroundColor: '#eee',
  },

  cardInfo: { flex: 1, paddingTop: 2 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: T_DARK, lineHeight: 21, marginBottom: 8 },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  cardMetaTxt: { fontSize: 12, color: T_MUTED },
  cardMetaSep: { fontSize: 12, color: '#ccc' },

  // Controls
  ctrlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },

  // Pill
  pill: {
    flex: 1,
    height: 42,
    backgroundColor: PILL_BG,
    borderRadius: 21,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
     maxWidth: 220,
     justifyContent:"space-around"
  },
  pillDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: BLUE,
    // marginRight: 8,
    flexShrink: 0,
  },
  pillTime: {
    flex: 1, fontSize: 14, fontWeight: '500', color: T_MID,
  },

  // Speed
  speedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    // borderWidth: 1,
    // borderColor: '#bbb',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  speedTxt: { fontSize: 13, fontWeight: '700', color: T_DARK },

  speedMenu: {
    position: 'absolute',
    bottom: 42,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: BORDER,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    zIndex: 999,
    minWidth: 84,
    overflow: 'hidden',
  },
  speedItem: { paddingHorizontal: 14, paddingVertical: 9 },
  speedItemOn: { backgroundColor: ACTIVE_BG },
  speedItemTxt: { fontSize: 13, color: T_MID, textAlign: 'center' },
  speedItemTxtOn: { color: BLUE, fontWeight: '700' },

  // Progress
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap: 6,
    marginBottom: 16,
    justifyContent: "space-around",
  },
  timeTxt: { fontSize: 12, color: T_MUTED, width: 36, textAlign: 'center' },
  trackWrap: {
    flex: 1, height: 5, justifyContent: 'space-between', position: 'relative',
    maxWidth: 100
  },
  trackBg: {
    position: 'absolute', left: 0, right: 0,
    height: 5, backgroundColor: '#bababa', borderRadius: 2, top: 8,

  },
  trackFill: {
    position: 'absolute', left: 0,
    height: 3, backgroundColor: BLUE, borderRadius: 2, top: 8,
  },
  trackThumb: {
    position: 'absolute',
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: BLUE,
    top: 3, 
  },

  // Share
  shareRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 10,
    borderTopWidth: 0.5,
    borderTopColor: '#f0f0f0',
    justifyContent:"center"
  },
  shareBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 0.5,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },

  // Episode rows
  epRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    // paddingHorizontal: 14,
    paddingVertical: 13,
    borderTopWidth: 0.5,
    borderTopColor: '#efefef',
    gap: 10,
    backgroundColor: '#fff',
    padding:ms(45)
  },
  epRowActive: { backgroundColor: ACTIVE_BG },
  epIconWrap: { width: 24, alignItems: 'center', paddingTop: 1 },
  epTextWrap: { flex: 1 },
  epTitle: { fontSize: 13, fontWeight: '400', color: T_DARK, lineHeight: 19, marginBottom: 3 },
  epTitleActive: { fontWeight: '700' },
  epMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  epDash: { fontSize: 11, color: T_LIGHT },
  epMeta: { fontSize: 11, color: T_LIGHT },
  epMetaSep: { fontSize: 11, color: '#ddd' },

  // Scroll to top button
  scrollTopBtn: {
    position: 'absolute',
    bottom: vs(50),
    right: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: BLUE,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
  },
});