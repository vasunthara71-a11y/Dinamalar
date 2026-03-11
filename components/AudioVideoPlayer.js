// components/AudioVideoPlayer.js
// Dinamalar website mobile UI — audio player + video player
// Usage: <AudioVideoPlayer newsItem={item} />
//
// Install required packages:
//   npx expo install expo-av
//   npx expo install expo-video  (optional, expo-av handles both)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Try to import expo-av, fallback gracefully
let Audio, Video, ResizeMode;
try {
  const expoAv = require('expo-av');
  Audio = expoAv.Audio;
  Video = expoAv.Video;
  ResizeMode = expoAv.ResizeMode;
} catch (error) {
  console.log('expo-av not available:', error.message);
}

import { s, vs, ms } from '../utils/scaling';
import { COLORS } from '../utils/constants';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(ms) {
  if (!ms || isNaN(ms)) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ position, duration, onSeek }) {
  const progress = duration > 0 ? position / duration : 0;

  return (
    <TouchableOpacity
      style={bar.track}
      activeOpacity={1}
      onPress={(e) => {
        const { locationX, nativeEvent } = e;
        const ratio = locationX / nativeEvent.target;
        // fallback — use layout width via state in parent if needed
        onSeek && onSeek(ratio * duration);
      }}
    >
      <View style={[bar.fill, { width: `${progress * 100}%` }]} />
      <View style={[bar.thumb, { left: `${progress * 100}%` }]} />
    </TouchableOpacity>
  );
}

const bar = StyleSheet.create({
  track: {
    height: vs(4),
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: s(2),
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  fill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: s(2),
  },
  thumb: {
    position: 'absolute',
    width: s(12),
    height: s(12),
    borderRadius: s(6),
    backgroundColor: '#fff',
    top: -vs(4),
    marginLeft: -s(6),
    elevation: 2,
  },
});

// ─── Audio Player — Dinamalar style ──────────────────────────────────────────
// Red bar, play/pause, seek, duration
function AudioPlayer({ audioUrl }) {
  // Check if Audio is available
  if (!Audio) {
    // Fallback: open in browser
    return (
      <TouchableOpacity style={ap.fallback} onPress={() => Linking.openURL(audioUrl)}>
        <Ionicons name="volume-high" size={s(20)} color="#fff" />
        <Text style={ap.fallbackText}>🎧 கேட்க இங்கே தட்டவும்</Text>
        <Ionicons name="open-outline" size={s(16)} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>
    );
  }

  const soundRef  = useRef(null);
  const [status, setStatus]  = useState('idle');   // idle | loading | playing | paused | ended
  const [pos,     setPos]     = useState(0);
  const [dur,     setDur]     = useState(0);
  const [speed,   setSpeed]   = useState(1.0);
  const speeds    = [1.0, 1.25, 1.5, 2.0];

  // Load audio on mount
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const onPlaybackStatus = useCallback((s) => {
    if (!s.isLoaded) return;
    setPos(s.positionMillis || 0);
    setDur(s.durationMillis || 0);
    if (s.didJustFinish) {
      setStatus('ended');
      setPos(0);
    }
  }, []);

  const loadAndPlay = async () => {
    if (!audioUrl) return;
    setStatus('loading');
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true, progressUpdateIntervalMillis: 500 },
        onPlaybackStatus,
      );
      soundRef.current = sound;
      setStatus('playing');
    } catch (e) {
      console.error('Audio load error:', e);
      setStatus('idle');
    }
  };

  const handlePlayPause = async () => {
    if (status === 'idle' || status === 'ended') {
      if (soundRef.current) await soundRef.current.unloadAsync();
      soundRef.current = null;
      await loadAndPlay();
      return;
    }
    if (!soundRef.current) return;
    if (status === 'playing') {
      await soundRef.current.pauseAsync();
      setStatus('paused');
    } else {
      await soundRef.current.playAsync();
      setStatus('playing');
    }
  };

  const handleSeek = async (ms) => {
    if (!soundRef.current) return;
    await soundRef.current.setPositionAsync(Math.max(0, Math.min(ms, dur)));
  };

  const handleSkip = async (sec) => {
    const newPos = Math.max(0, Math.min(pos + sec * 1000, dur));
    await handleSeek(newPos);
  };

  const handleSpeed = async () => {
    const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
    setSpeed(next);
    await soundRef.current?.setRateAsync(next, true);
  };

  const isPlaying = status === 'playing';
  const isLoading = status === 'loading';

  return (
    <View style={audio.container}>
      {/* ── Header row ── */}
      <View style={audio.header}>
        <Ionicons name="volume-high" size={s(16)} color="#fff" />
        <Text style={audio.headerText}>கேளுங்கள்</Text>
      </View>

      {/* ── Progress ── */}
      <View style={audio.progressRow}>
        <Text style={audio.timeText}>{formatTime(pos)}</Text>
        <View style={{ flex: 1, marginHorizontal: s(10) }}>
          <ProgressBar position={pos} duration={dur} onSeek={handleSeek} />
        </View>
        <Text style={audio.timeText}>{formatTime(dur)}</Text>
      </View>

      {/* ── Controls ── */}
      <View style={audio.controls}>
        {/* Skip back 10s */}
        <TouchableOpacity style={audio.skipBtn} onPress={() => handleSkip(-10)}>
          <Ionicons name="play-back" size={s(20)} color="#fff" />
          <Text style={audio.skipLabel}>10</Text>
        </TouchableOpacity>

        {/* Play / Pause */}
        <TouchableOpacity style={audio.playBtn} onPress={handlePlayPause}>
          {isLoading ? (
            <ActivityIndicator color="#c62828" size="small" />
          ) : (
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={s(24)}
              color={COLORS.primary}
              style={!isPlaying && { marginLeft: s(2) }}
            />
          )}
        </TouchableOpacity>

        {/* Skip forward 10s */}
        <TouchableOpacity style={audio.skipBtn} onPress={() => handleSkip(10)}>
          <Ionicons name="play-forward" size={s(20)} color="#fff" />
          <Text style={audio.skipLabel}>10</Text>
        </TouchableOpacity>

        {/* Speed */}
        <TouchableOpacity style={audio.speedBtn} onPress={handleSpeed}>
          <Text style={audio.speedText}>{speed}x</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const audio = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primary,
    borderRadius: s(8),
    padding: s(14),
    marginVertical: vs(12),
    marginHorizontal: s(12),
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: vs(2) },
    shadowOpacity: 0.35,
    shadowRadius: s(6),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    marginBottom: vs(10),
  },
  headerText: {
    color: '#fff',
    fontSize: ms(13),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(14),
  },
  timeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: ms(11),
    minWidth: s(34),
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s(16),
  },
  skipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: s(6),
  },
  skipLabel: {
    position: 'absolute',
    bottom: -vs(1),
    color: '#fff',
    fontSize: ms(8),
    fontWeight: '700',
  },
  playBtn: {
    width: s(52),
    height: s(52),
    borderRadius: s(26),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: vs(1) },
    shadowOpacity: 0.2,
    shadowRadius: s(3),
  },
  speedBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: s(10),
    paddingVertical: vs(5),
    borderRadius: s(14),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  speedText: {
    color: '#fff',
    fontSize: ms(11),
    fontWeight: '800',
  },
});

// ─── Video Player — Dinamalar style ──────────────────────────────────────────
function VideoPlayer({ videoUrl }) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});
  const [fullscreen, setFullscreen] = useState(false);

  const isPlaying = status.isPlaying;
  const pos       = status.positionMillis || 0;
  const dur       = status.durationMillis || 0;

  const handlePlayPause = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  const handleSeek = async (ms) => {
    await videoRef.current?.setPositionAsync(Math.max(0, Math.min(ms, dur)));
  };

  const handleSkip = async (sec) => {
    await handleSeek(pos + sec * 1000);
  };

  const progress = dur > 0 ? pos / dur : 0;

  return (
    <View style={video.container}>
      {/* ── Video frame ── */}
      <View style={video.frame}>
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={video.video}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls={false}
          onPlaybackStatusUpdate={setStatus}
        />

        {/* Custom overlay controls */}
        <TouchableOpacity style={video.overlay} onPress={handlePlayPause} activeOpacity={0.9}>
          {!isPlaying && (
            <View style={video.centerPlay}>
              <Ionicons name="play" size={s(32)} color="#fff" style={{ marginLeft: s(4) }} />
            </View>
          )}
        </TouchableOpacity>

        {/* Top-right fullscreen */}
        <TouchableOpacity
          style={video.fullscreenBtn}
          onPress={() => videoRef.current?.presentFullscreenPlayer()}
        >
          <Ionicons name="expand" size={s(18)} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Bottom controls ── */}
      <View style={video.controls}>
        {/* Play/Pause */}
        <TouchableOpacity onPress={handlePlayPause} style={video.ctrlBtn}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={s(18)} color="#fff" />
        </TouchableOpacity>

        {/* Time */}
        <Text style={video.timeText}>{formatTime(pos)}</Text>

        {/* Progress bar */}
        <TouchableOpacity
          style={video.progressTrack}
          activeOpacity={1}
          onPress={(e) => {
            // approximate seek from touch
          }}
        >
          <View style={[video.progressFill, { width: `${progress * 100}%` }]} />
        </TouchableOpacity>

        <Text style={video.timeText}>{formatTime(dur)}</Text>

        {/* Skip +10 */}
        <TouchableOpacity onPress={() => handleSkip(10)} style={video.ctrlBtn}>
          <Ionicons name="play-forward" size={s(16)} color="#fff" />
        </TouchableOpacity>

        {/* Fullscreen */}
        <TouchableOpacity
          onPress={() => videoRef.current?.presentFullscreenPlayer()}
          style={video.ctrlBtn}
        >
          <Ionicons name="expand" size={s(16)} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const video = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    marginVertical: vs(12),
    borderRadius: s(6),
    overflow: 'hidden',
    elevation: 3,
  },
  frame: {
    width: '100%',
    height: (SCREEN_W * 9) / 16,
    backgroundColor: '#000',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPlay: {
    width: s(60),
    height: s(60),
    borderRadius: s(30),
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenBtn: {
    position: 'absolute',
    top: s(8),
    right: s(8),
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: s(5),
    borderRadius: s(4),
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: s(10),
    paddingVertical: vs(8),
    gap: s(8),
  },
  ctrlBtn: { padding: s(3) },
  timeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: ms(10),
    minWidth: s(32),
  },
  progressTrack: {
    flex: 1,
    height: vs(3),
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: s(2),
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: s(2),
  },
});

// ─── Main exported component ──────────────────────────────────────────────────
// Drop this anywhere in your NewsDetailsScreen right below the hero image.
// It auto-detects audio vs video from the newsItem.
//
// API field mapping (from /detaildata response):
//   audio     : 0 | 1        — has audio
//   audiofile : "https://..."  — audio URL
//   audiourl  : "https://..."  — alternate key
//   video     : 0 | 1        — has video
//   videofile : "https://..."  — video URL
//   videourl  : "https://..."  — alternate key
//   youtube   : "youtube_id"  — YouTube embed id

export default function AudioVideoPlayer({ newsItem }) {
  if (!newsItem) return null;

  const hasAudio = newsItem.audio && newsItem.audio !== '0' && newsItem.audio !== 0;
  const hasVideo = newsItem.video && newsItem.video !== '0' && newsItem.video !== 0;

  // Audio URL — try multiple possible field names
  const audioUrl =
    newsItem.audiofile ||
    newsItem.audiourl  ||
    newsItem.audio_url ||
    newsItem.audio_file||
    (typeof newsItem.audio === 'string' && newsItem.audio.startsWith('http') ? newsItem.audio : null);

  // Video URL — try multiple possible field names
  const videoUrl =
    newsItem.videofile ||
    newsItem.videourl  ||
    newsItem.video_url ||
    newsItem.video_file||
    (newsItem.youtube ? `https://www.youtube.com/watch?v=${newsItem.youtube}` : null) ||
    (typeof newsItem.video === 'string' && newsItem.video.startsWith('http') ? newsItem.video : null);

  if (!hasAudio && !hasVideo) return null;

  return (
    <View>
      {/* ── Video first (if exists) ── */}
      {hasVideo && videoUrl && (
        <VideoPlayer videoUrl={videoUrl} />
      )}

      {/* ── Audio player (if exists) ── */}
      {hasAudio && audioUrl && (
        <AudioPlayer audioUrl={audioUrl} />
      )}
    </View>
  );
}