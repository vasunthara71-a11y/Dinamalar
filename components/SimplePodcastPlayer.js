import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { s, vs } from '../utils/scaling';
import { ms } from 'react-native-size-matters';
import { FONTS } from '../utils/constants';
import { useNavigation } from '@react-navigation/native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function SimplePodcastPlayer({ data, onMorePress, onPlayingChange }) {
  const [isReady, setIsReady] = useState(false);
  // 3 states: 'expanded' = mini player, 'collapsed' = tab strip, 'hidden' = fully gone
  const [playerState, setPlayerState] = useState('expanded');
  const [showFullPlayer, setShowFullPlayer] = useState(false);
  const navigation = useNavigation();
  const [isPlaying, setIsPlaying] = useState(false);

  // Fallback test data for debugging
  const testPodcast = {
    newsid: 58927,
    newstitle: 'தினமலர் மாலை 5 மணி செய்திகள் - 21 March 2026',
    audio: 'https://d.dinamalar.com/sm/upload/alexa/Podcast_05_21032026.mp3',
    standarddate: 'மார் 21, 2026',
    ago: '12 minutes ago',
  };

  // Use actual podcast data or fallback to test data
  const podcastData = data && data.length > 0 ? data : [testPodcast];
  
  // Extract the first podcast from the data array (handle nested structure)
  let currentPodcast = null;
  let audioUrl = testPodcast.audio; // fallback to test audio
  
  if (podcastData && podcastData.length > 0) {
    // Handle different data structures
    if (podcastData[0]?.audio) {
      // Direct structure
      currentPodcast = podcastData[0];
      audioUrl = podcastData[0].audio;
    } else if (podcastData[0]?.data && podcastData[0].data[0]?.audio) {
      // Nested structure like API response
      currentPodcast = podcastData[0].data[0];
      audioUrl = podcastData[0].data[0].audio;
    }
  }
  
  console.log('🎙️ SimplePodcastPlayer - audioUrl:', audioUrl);
  console.log('🎙️ SimplePodcastPlayer - data prop:', data);
  console.log('🎙️ SimplePodcastPlayer - podcastData:', podcastData);
  console.log('🎙️ SimplePodcastPlayer - currentPodcast:', currentPodcast);
  console.log('🎙️ SimplePodcastPlayer - data.length:', data?.length);
  console.log('🎙️ SimplePodcastPlayer - podcastData.length:', podcastData?.length);

  // Initialize player with audio URL directly
  const player = useAudioPlayer({ uri: audioUrl || '' });
  const status = useAudioPlayerStatus(player);

  // Setup audio mode once
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
  console.log('🎙️ handlePlayPause called');
  console.log('🎙️ isPlaying:', isPlaying);
  console.log('🎙️ player exists:', !!player);
  console.log('🎙️ isReady:', isReady);
  console.log('🎙️ audioUrl:', audioUrl);
  console.log('🎙️ status:', status);
  
  if (!player || !isReady || !audioUrl) {
    console.log('🎙️ Cannot play: missing player, isReady, or audioUrl');
    return;
  }
  
  if (isPlaying) {
    console.log('🎙️ Pausing player');
    player.pause();
    setIsPlaying(false);
  } else {
    console.log('🎙️ Playing player');
    console.log('🎙️ player methods:', Object.getOwnPropertyNames(player));
    if (status?.didJustFinish) player.seekTo(0);
    try {
      player.play();
      setIsPlaying(true);
      console.log('🎙️ player.play() called successfully');
    } catch (error) {
      console.log('🎙️ Error playing audio:', error);
    }
  }
};

// Sync with real status to handle external stops/errors:
useEffect(() => {
  setIsPlaying(status?.playing ?? false);
  // Notify parent of playing state change
  if (onPlayingChange && status?.playing !== undefined) {
    onPlayingChange(status.playing, currentPodcast);
  }
}, [status?.playing]);

  const handleStop = () => {
    if (player) {
      player.pause();
      player.seekTo(0);
    }
  };

  const handleSeekForward = () => {
    if (!player || !status?.duration) return;
    const newTime = Math.min((status?.currentTime || 0) + 15, status.duration);
    player.seekTo(newTime);
  };

  const handleSeekBackward = () => {
    if (!player) return;
    const newTime = Math.max((status?.currentTime || 0) - 15, 0);
    player.seekTo(newTime);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = (status?.duration ?? 0) > 0 
  ? (status?.currentTime ?? 0) / status.duration 
  : 0;

  // Don't render if no data available
  if (!podcastData || podcastData.length === 0) {
    console.log('🎙️ SimplePodcastPlayer - No data available, not rendering');
    return null;
  }

  // Don't render if no audio URL available
  if (!audioUrl) {
    console.log('🎙️ SimplePodcastPlayer - No audio URL available, not rendering');
    return null;
  }

  // ✅ COLLAPSED TAB — vertical strip shown when mini player is dismissed
  if (playerState === 'collapsed') {
    return (
      <TouchableOpacity
        style={styles.collapsedTab}
        onPress={() => setPlayerState('expanded')}
        activeOpacity={0.85}
      >
        {/* Mic icon */}
        <Ionicons name="mic" size={s(18)} color="#fff" />
        {/* Vertical "OPEN" text */}
        {['O', 'P', 'E', 'N'].map((char, i) => (
          <Text key={i} style={styles.collapsedChar}>{char}</Text>
        ))}
      </TouchableOpacity>
    );
  }

  // ✅ EXPANDED MINI PLAYER
  if (playerState === 'expanded') {
    return (
      <>
        <View style={styles.miniPlayerContainer}>
          {/* Dismiss (–) button → go to collapsed tab */}
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={() => {
              // ✅ Don't stop audio, just collapse the UI
              setPlayerState('collapsed');
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
                name={isPlaying ? 'pause' : 'play'}
                size={s(20)}
                color="#fff"
              />
            )}
          </TouchableOpacity>

          {/* மேலும் >> */}
          <TouchableOpacity
            onPress={() => navigation.navigate('PodcastPlayer')}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: ms(5) }}
          >
            <Text style={styles.moreText}>மேலும் </Text>
            <Text style={{ color: '#fff', fontSize: ms(15) }}>{'>>'}</Text>
          </TouchableOpacity>
        </View>

        {/* Full-Screen Player Modal */}
        <Modal
          visible={showFullPlayer}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setShowFullPlayer(false)}
        >
          <View style={styles.fullPlayerContainer}>
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

            <View style={styles.artContainer}>
              <View style={[styles.artCircle, isPlaying && styles.artCircleActive]}>
                <Ionicons name="radio" size={s(64)} color="#096dd2" />
              </View>
            </View>

            <Text style={styles.fullTitle}>{currentPodcast?.newstitle || 'Podcast'}</Text>
            <Text style={styles.fullSubtitle}>{currentPodcast?.standarddate || ''}</Text>

            <View style={styles.progressContainer}>
              <Text style={styles.timeText}>{formatTime(status?.currentTime)}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={styles.timeText}>{formatTime(status?.duration)}</Text>
            </View>

            <View style={styles.controlsRow}>
              <TouchableOpacity style={styles.controlBtn} onPress={handleSeekBackward}>
                <Ionicons name="play-back" size={s(22)} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlBtn} onPress={handleStop}>
                <Ionicons name="stop" size={s(22)} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.fullPlayBtn}
                onPress={handlePlayPause}
                disabled={!isReady}
              >
                {status?.isBuffering ? (
                  <ActivityIndicator size="large" color="#fff" />
                ) : (
                  <Ionicons
                    name={isPlaying ? 'pause' : 'play'}
                    size={s(36)}
                    color="#fff"
                  />
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlBtn} onPress={handleSeekForward}>
                <Ionicons name="play-forward" size={s(22)} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.controlBtn}
                onPress={() => setShowFullPlayer(false)}
              >
                <Ionicons name="contract" size={s(22)} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.titleStrip}>
              <Ionicons name="musical-notes" size={s(14)} color="#096dd2" />
              <Text style={styles.titleStripText} numberOfLines={2}>
                {currentPodcast?.newstitle || 'Podcast'}
              </Text>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  // ✅ Collapsed vertical tab strip
  collapsedTab: {
    position: 'absolute',
    right: s(0),
    top: SCREEN_HEIGHT * 0.42,   // ← replaces '42%'
    backgroundColor: 'rgba(99, 115, 131, 0.95)',
    borderTopLeftRadius: s(10),
    borderBottomLeftRadius: s(10),
    paddingVertical: vs(10),
    paddingHorizontal: s(8),
    alignItems: 'center',
    gap: vs(3),
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: s(8),
    elevation: 12,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#fff',
    minWidth: s(34),
  },
  collapsedChar: {
    color: '#fff',
    fontSize: s(11),
    fontWeight: '700',
    letterSpacing: 0.5,
    lineHeight: s(14),
  },

  // Mini player
  miniPlayerContainer: {
    position: 'absolute',
    right: s(0),
    top: SCREEN_HEIGHT * 0.42,   // ← replaces '42%'
    backgroundColor: 'rgba(99, 115, 131, 0.95)',
    borderTopLeftRadius: s(10),
    borderBottomLeftRadius: s(10),
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
    borderColor: '#fff',
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
    marginTop: -s(10),
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
    fontFamily: FONTS.muktaMalar.medium,
  },
  miniPlayBtn: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    fontSize: s(12),
    color: '#fff',
    textAlign: 'center',
    fontFamily: FONTS.muktaMalar.medium,
  },

  // Full player
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
