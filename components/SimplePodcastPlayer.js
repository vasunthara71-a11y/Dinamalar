import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { s, vs } from '../utils/scaling';
import { ms } from 'react-native-size-matters';
import { FONTS } from '../utils/constants';
import { useNavigation } from '@react-navigation/native';

// ─── MANUAL TEST DATA ──────────────────────────────────────────────────────────
const MANUAL_TEST_DATA = [
  {
    newsid: 58927,
    newstitle: 'தினமலர் மாலை 5 மணி செய்திகள் - 21 March 2026',
    audio: 'https://d.dinamalar.com/sm/upload/alexa/Podcast_05_21032026.mp3',
    standarddate: 'மார் 21, 2026',
    ago: '12 minutes ago',
  },
];

export default function SimplePodcastPlayer({ data, onMorePress }) {
  const [isReady, setIsReady] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const navigation = useNavigation();

  const currentPodcast = MANUAL_TEST_DATA[0];
  const audioUrl = currentPodcast.audio;

  const player = useAudioPlayer({ uri: audioUrl });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    })
      .then(() => setIsReady(true))
      .catch(() => setIsReady(true));
  }, []);

  const handlePlayPause = () => {
    if (!player || !isReady) return;
    if (status.playing) {
      player.pause();
    } else {
      if (status.didJustFinish) player.seekTo(0);
      player.play();
    }
  };

  const handleStop = () => {
    if (player) {
      player.pause();
      player.seekTo(0);
    }
  };

  const handleSeekForward = () => {
    if (!player || !status.duration) return;
    const newTime = Math.min((status.currentTime || 0) + 15, status.duration);
    player.seekTo(newTime);
  };

  const handleSeekBackward = () => {
    if (!player) return;
    const newTime = Math.max((status.currentTime || 0) - 15, 0);
    player.seekTo(newTime);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = status.duration > 0 ? status.currentTime / status.duration : 0;

  // If dismissed, show nothing
  if (isDismissed) return null;

  return (
    <>
      {/* ── Compact Floating Mini-Player (matches Dinamalar website) ── */}
      <View style={styles.miniPlayerContainer}>
        {/* Dismiss (–) button */}
        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={() => {
            handleStop();
            setIsDismissed(true);
          }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.dismissText}>−</Text>
        </TouchableOpacity>

        {/* Label */}
        <Text style={styles.miniLabel}>Podcast</Text>

        {/* Play / Pause button */}
        <TouchableOpacity
          style={styles.miniPlayBtn}
          onPress={handlePlayPause}
          disabled={!isReady}
          activeOpacity={0.8}
        >
          {status.isBuffering ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons
              name={status.playing ? 'pause' : 'play'}
              size={s(20)}
              color="#fff"
            />
          )}
        </TouchableOpacity>

        {/* "மேலும் >>" — navigates to PodcastPlayer screen */}
        <TouchableOpacity
          onPress={() => navigation.navigate('PodcastPlayer')}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={{ flexDirection: "row", alignItems: "center", gap: ms(5) }}
        >
          <Text style={styles.moreText}>மேலும் </Text>
          <Text style={{ color: "#fff", fontSize: ms(15) }}>{'>>'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Full-Screen Player Modal (opened via மேலும்) ── */}
      <Modal
        visible={showFullPlayer}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowFullPlayer(false)}
      >
        <View style={styles.fullPlayerContainer}>

          {/* Header */}
          <View style={styles.fullHeader}>
            <TouchableOpacity
              onPress={() => setShowFullPlayer(false)}
              style={styles.closeBtn}
            >
              <Ionicons name="chevron-down" size={s(28)} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.fullHeaderLabel}>PODCAST</Text>
            <View style={{ width: s(40) }} />
          </View>

          {/* Art circle */}
          <View style={styles.artContainer}>
            <View style={[styles.artCircle, status.playing && styles.artCircleActive]}>
              <Ionicons name="radio" size={s(64)} color="#096dd2" />
            </View>
          </View>

          {/* Title & date */}
          <Text style={styles.fullTitle}>{currentPodcast.newstitle}</Text>
          <Text style={styles.fullSubtitle}>{currentPodcast.standarddate}</Text>

          {/* Progress */}
          <View style={styles.progressContainer}>
            <Text style={styles.timeText}>{formatTime(status.currentTime)}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.timeText}>{formatTime(status.duration)}</Text>
          </View>

          {/* Controls */}
          <View style={styles.controlsRow}>
            {/* –15s */}
            <TouchableOpacity style={styles.controlBtn} onPress={handleSeekBackward}>
              <Ionicons name="play-back" size={s(22)} color="#fff" />
            </TouchableOpacity>

            {/* Stop */}
            <TouchableOpacity style={styles.controlBtn} onPress={handleStop}>
              <Ionicons name="stop" size={s(22)} color="#fff" />
            </TouchableOpacity>

            {/* Play/Pause */}
            <TouchableOpacity
              style={styles.fullPlayBtn}
              onPress={handlePlayPause}
              disabled={!isReady}
            >
              {status.isBuffering ? (
                <ActivityIndicator size="large" color="#fff" />
              ) : (
                <Ionicons
                  name={status.playing ? 'pause' : 'play'}
                  size={s(36)}
                  color="#fff"
                />
              )}
            </TouchableOpacity>

            {/* +15s */}
            <TouchableOpacity style={styles.controlBtn} onPress={handleSeekForward}>
              <Ionicons name="play-forward" size={s(22)} color="#fff" />
            </TouchableOpacity>

            {/* Close full player → back to mini */}
            <TouchableOpacity
              style={styles.controlBtn}
              onPress={() => setShowFullPlayer(false)}
            >
              <Ionicons name="contract" size={s(22)} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Podcast title strip */}
          <View style={styles.titleStrip}>
            <Ionicons name="musical-notes" size={s(14)} color="#096dd2" />
            <Text style={styles.titleStripText} numberOfLines={2}>
              {currentPodcast.newstitle}
            </Text>
          </View>

        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  miniPlayerContainer: {
    position: 'absolute',
    right: s(0),
    top: '42%',
    backgroundColor: 'rgba(99, 115, 131)',
    borderTopLeftRadius: s(10),
    borderBottomLeftRadius: s(10),
    // paddingTop: vs(10),
    paddingBottom: vs(10),
    paddingHorizontal: s(10),
    alignItems: 'center',
    gap: vs(6),
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: s(8),
    elevation: 12,
    zIndex: 1000,
    minWidth: s(90),
    borderWidth: 1,
    borderColor: "#fff"
  },
  dismissBtn: {
    alignSelf: 'flex-start',
    marginLeft: -s(20),
    width: s(35),
    height: s(35),
    borderRadius: s(18),
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: s(8),
    marginTop: -s(10)
  },
  dismissText: {
    fontSize: s(16),
    color: '#444',
    lineHeight: s(18),
    fontWeight: '600',
  },
  miniLabel: {
    fontSize: s(14),
    color: '#fff',
    letterSpacing: 0.3,
    fontFamily: FONTS.muktaMalar.medium
  },
  miniPlayBtn: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    borderWidth: 3,
    borderColor: '#fff',
    // backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    fontSize: s(12),
    color: '#fff',
    // fontWeight: '600',
    textAlign: 'center',
    fontFamily: FONTS.muktaMalar.medium
  },

  fullPlayerContainer: {
    flex: 1,
    backgroundColor: '#0d1b2a',
    paddingHorizontal: s(24),
    paddingBottom: vs(40),
  },
  fullHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: vs(60),
    paddingBottom: vs(20),
  },
  closeBtn: { padding: s(4) },
  fullHeaderLabel: {
    color: '#aaa',
    fontSize: s(12),
    fontWeight: '700',
    letterSpacing: 2,
  },
  artContainer: {
    alignItems: 'center',
    marginVertical: vs(30),
  },
  artCircle: {
    width: s(180),
    height: s(180),
    borderRadius: s(90),
    backgroundColor: 'rgba(9,109,210,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(9,109,210,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artCircleActive: {
    borderColor: '#096dd2',
    backgroundColor: 'rgba(9,109,210,0.25)',
  },
  fullTitle: {
    fontSize: s(16),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: vs(8),
    lineHeight: s(24),
  },
  fullSubtitle: {
    fontSize: s(13),
    color: '#aaa',
    textAlign: 'center',
    marginBottom: vs(24),
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    marginBottom: vs(32),
  },
  timeText: {
    color: '#aaa',
    fontSize: s(12),
    width: s(36),
    textAlign: 'center',
  },
  progressBar: {
    flex: 1,
    height: vs(4),
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: s(2),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#096dd2',
    borderRadius: s(2),
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(16),
    marginBottom: vs(32),
  },
  controlBtn: {
    width: s(44),
    height: s(44),
    borderRadius: s(22),
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPlayBtn: {
    width: s(72),
    height: s(72),
    borderRadius: s(36),
    backgroundColor: '#096dd2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#096dd2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  titleStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: s(8),
    padding: s(12),
  },
  titleStripText: {
    flex: 1,
    color: '#ddd',
    fontSize: s(12),
    lineHeight: s(18),
  },
});