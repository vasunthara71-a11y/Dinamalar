import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { s, vs } from '../utils/scaling';

// ─── MANUAL TEST DATA (hardcoded URL — bypasses API issues) ──────────────────
const MANUAL_TEST_DATA = [
  {
    newsid: 58927,
    newstitle: 'தினமலர் மாலை 5 மணி செய்திகள் - 21 March 2026',
    audio: 'https://d.dinamalar.com/sm/upload/alexa/Podcast_05_21032026.mp3',
    standarddate: 'மார் 21, 2026',
    ago: '12 minutes ago',
  },
];

export default function SimplePodcastPlayer({ data }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Always use manual test data to verify playback works
  const currentPodcast = MANUAL_TEST_DATA[0];
  const audioUrl = currentPodcast.audio;

  // useAudioPlayer from expo-audio — pass URI object
  const player = useAudioPlayer({ uri: audioUrl });
  const status = useAudioPlayerStatus(player);

  // Setup audio mode once on mount
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,        // critical for iOS silent switch
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    })
      .then(() => {
        console.log('SimplePodcastPlayer: Audio mode configured');
        setIsReady(true);
      })
      .catch((e) => {
        console.warn('SimplePodcastPlayer: setAudioModeAsync error:', e);
        setIsReady(true); // still attempt playback
      });
  }, []);

  const handlePlayPause = () => {
    if (!player) return;
    if (status.playing) {
      console.log('SimplePodcastPlayer: Pausing');
      player.pause();
    } else {
      console.log('SimplePodcastPlayer: Playing:', audioUrl);
      // If track ended, seek to start before replaying
      if (status.didJustFinish) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const handleStop = () => {
    if (player) {
      player.pause();
      player.seekTo(0);
    }
    setIsVisible(false);
  };

  const handleSeekForward = () => {
    if (!player || !status.duration) return;
    const newTime = Math.min((status.currentTime || 0) + 15, status.duration);
    player.seekTo(newTime);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = status.duration > 0 ? status.currentTime / status.duration : 0;

  return (
    <>
      {/* Floating podcast button */}
      <TouchableOpacity
        style={[styles.floatingButton, status.playing && styles.floatingButtonActive]}
        onPress={() => setIsVisible(true)}
        activeOpacity={0.9}
      >
        <Ionicons name="musical-notes" size={s(20)} color="#fff" />
        <Text style={styles.buttonText}>Podcast</Text>
        {status.playing && <View style={styles.playingDot} />}
      </TouchableOpacity>

      {/* Player modal */}
      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalContainer}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setIsVisible(false)} style={styles.closeBtn}>
              <Ionicons name="chevron-down" size={s(28)} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerLabel}>PODCAST</Text>
            <View style={{ width: s(40) }} />
          </View>

          {/* Art */}
          <View style={styles.artContainer}>
            <View style={[styles.artCircle, status.playing && styles.artCircleActive]}>
              <Ionicons name="radio" size={s(64)} color="#096dd2" />
            </View>
          </View>

          {/* Info */}
          <Text style={styles.title}>{currentPodcast.newstitle}</Text>
          <Text style={styles.subtitle}>{currentPodcast.standarddate}</Text>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <Text style={styles.timeText}>{formatTime(status.currentTime)}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.timeText}>{formatTime(status.duration)}</Text>
          </View>

          {/* Controls */}
          <View style={styles.controlsRow}>
            {/* Stop */}
            <TouchableOpacity style={styles.controlBtn} onPress={handleStop}>
              <Ionicons name="stop" size={s(22)} color="#fff" />
            </TouchableOpacity>

            {/* Play / Pause */}
            <TouchableOpacity
              style={styles.playBtn}
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
          </View>

          {/* Debug panel */}
          <View style={styles.debugBox}>
            <Text style={styles.debugLabel}>🔗 URL:</Text>
            <Text style={styles.debugUrl} numberOfLines={2}>{audioUrl}</Text>
            <Text style={styles.debugLabel}>
              Status:{' '}
              {status.isBuffering ? '⏳ Buffering' :
               status.playing    ? '▶️ Playing' :
               status.didJustFinish ? '✅ Finished' : '⏸ Paused'}
            </Text>
            <Text style={styles.debugLabel}>
              Time: {formatTime(status.currentTime)} / {formatTime(status.duration)}
            </Text>
          </View>

        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    right: s(10),
    top: '45%',
    backgroundColor: '#096dd2',
    width: s(60),
    height: s(60),
    borderRadius: s(30),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: vs(4) },
    shadowOpacity: 0.3,
    shadowRadius: s(8),
    elevation: 10,
    zIndex: 1000,
  },
  floatingButtonActive: {
    backgroundColor: '#0a56a8',
  },
  buttonText: {
    color: '#fff',
    fontSize: s(10),
    fontWeight: 'bold',
    marginTop: vs(2),
  },
  playingDot: {
    position: 'absolute',
    top: s(8),
    right: s(8),
    width: s(8),
    height: s(8),
    borderRadius: s(4),
    backgroundColor: '#22c55e',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0d1b2a',
    paddingHorizontal: s(24),
    paddingBottom: vs(40),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: vs(60),
    paddingBottom: vs(20),
  },
  closeBtn: { padding: s(4) },
  headerLabel: {
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
  title: {
    fontSize: s(16),
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: vs(8),
    lineHeight: s(24),
  },
  subtitle: {
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
    gap: s(32),
    marginBottom: vs(32),
  },
  controlBtn: {
    width: s(48),
    height: s(48),
    borderRadius: s(24),
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playBtn: {
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
  debugBox: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: s(8),
    padding: s(12),
    gap: vs(4),
  },
  debugLabel: {
    color: '#aaa',
    fontSize: s(11),
    fontWeight: '600',
  },
  debugUrl: {
    color: '#64b5f6',
    fontSize: s(10),
  },
});