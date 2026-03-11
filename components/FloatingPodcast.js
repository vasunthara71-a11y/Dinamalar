// // FloatingPodcast.js
// // In-app podcast player using expo-av
// // Drop this file into your components/ folder and import it in HomeScreen.js

// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   StyleSheet,
//   Image,
//   ActivityIndicator,
//   Animated,
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { Audio } from 'expo-av';
// import { COLORS } from '../utils/constants';
// import { s, vs, ms, scaledSizes } from '../utils/scaling';

// export default function FloatingPodcast({ data }) {
//   const [expanded, setExpanded] = useState(false);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [positionMs, setPositionMs] = useState(0);
//   const [durationMs, setDurationMs] = useState(0);
//   const [error, setError] = useState(null);

//   const soundRef = useRef(null);
//   const expandAnim = useRef(new Animated.Value(0)).current;

//   // ── Cleanup on unmount ──────────────────────────────────────────────────────
//   useEffect(() => {
//     return () => {
//       if (soundRef.current) {
//         soundRef.current.unloadAsync();
//       }
//     };
//   }, []);

//   // ── Configure audio session once ───────────────────────────────────────────
//   useEffect(() => {
//     if (!data || data.length === 0) return; // guard inside hook, not before it
//     Audio.setAudioModeAsync({
//       allowsRecordingIOS: false,
//       staysActiveInBackground: true,
//       playsInSilentModeIOS: true,
//       shouldDuckAndroid: true,
//       playThroughEarpieceAndroid: false,
//     });
//   }, [data]);

//   // ── Expand/collapse animation ───────────────────────────────────────────────
//   const toggleExpand = () => {
//     const toValue = expanded ? 0 : 1;
//     Animated.spring(expandAnim, {
//       toValue,
//       useNativeDriver: false,
//       tension: 60,
//       friction: 10,
//     }).start();
//     setExpanded(!expanded);
//   };

//   const panelWidth = expandAnim.interpolate({
//     inputRange: [0, 1],
//     outputRange: [s(56), s(280)],
//   });

//   // ── Early return AFTER all hooks ────────────────────────────────────────────
//   // IMPORTANT: This must come AFTER all hooks to avoid "Rendered more hooks" error
//   if (!data || data.length === 0) return null;

//   // ── Current podcast item ────────────────────────────────────────────────────
//   const currentPodcast = data[currentIndex];

//   // ── Load and play audio ─────────────────────────────────────────────────────
//   const loadAndPlay = useCallback(async (index) => {
//     try {
//       setIsLoading(true);
//       setError(null);

//       // Unload previous sound
//       if (soundRef.current) {
//         await soundRef.current.unloadAsync();
//         soundRef.current = null;
//       }

//       const podcast = data[index];
//       const audioUrl = podcast.audio || podcast.audiourl || podcast.mp3 || null;

//       if (!audioUrl) {
//         setError('ஆடியோ இணைப்பு இல்லை');
//         setIsLoading(false);
//         return;
//       }

//       console.log('Loading podcast audio:', audioUrl);

//       const { sound } = await Audio.Sound.createAsync(
//         { uri: audioUrl },
//         { shouldPlay: true, progressUpdateIntervalMillis: 500 },
//         onPlaybackStatusUpdate
//       );

//       soundRef.current = sound;
//       setIsPlaying(true);
//       setIsLoading(false);
//     } catch (err) {
//       console.error('Podcast load error:', err);
//       setError('ஆடியோ ஏற்ற முடியவில்லை');
//       setIsLoading(false);
//       setIsPlaying(false);
//     }
//   }, [data]);

//   // ── Playback status callback ────────────────────────────────────────────────
//   const onPlaybackStatusUpdate = (status) => {
//     if (!status.isLoaded) return;

//     setPositionMs(status.positionMillis ?? 0);
//     setDurationMs(status.durationMillis ?? 0);
//     setIsPlaying(status.isPlaying);

//     // Auto-advance to next episode
//     if (status.didJustFinish) {
//       const nextIndex = currentIndex + 1;
//       if (nextIndex < data.length) {
//         setCurrentIndex(nextIndex);
//         loadAndPlay(nextIndex);
//       } else {
//         setIsPlaying(false);
//         setCurrentIndex(0);
//       }
//     }
//   };

//   // ── Play / Pause ────────────────────────────────────────────────────────────
//   const handlePlayPause = async () => {
//     if (isLoading) return;

//     if (!soundRef.current) {
//       // First play
//       await loadAndPlay(currentIndex);
//       return;
//     }

//     try {
//       const status = await soundRef.current.getStatusAsync();
//       if (status.isLoaded) {
//         if (status.isPlaying) {
//           await soundRef.current.pauseAsync();
//           setIsPlaying(false);
//         } else {
//           await soundRef.current.playAsync();
//           setIsPlaying(true);
//         }
//       }
//     } catch (err) {
//       console.error('Play/pause error:', err);
//     }
//   };

//   // ── Skip forward 15s ────────────────────────────────────────────────────────
//   const handleSkipForward = async () => {
//     if (!soundRef.current) return;
//     try {
//       const status = await soundRef.current.getStatusAsync();
//       if (status.isLoaded) {
//         const newPos = Math.min(positionMs + 15000, durationMs);
//         await soundRef.current.setPositionAsync(newPos);
//       }
//     } catch (err) { console.error(err); }
//   };

//   // ── Skip backward 15s ──────────────────────────────────────────────────────
//   const handleSkipBack = async () => {
//     if (!soundRef.current) return;
//     try {
//       const newPos = Math.max(positionMs - 15000, 0);
//       await soundRef.current.setPositionAsync(newPos);
//     } catch (err) { console.error(err); }
//   };

//   // ── Next / Prev episode ─────────────────────────────────────────────────────
//   const handleNext = async () => {
//     const next = Math.min(currentIndex + 1, data.length - 1);
//     setCurrentIndex(next);
//     if (isPlaying) await loadAndPlay(next);
//   };

//   const handlePrev = async () => {
//     const prev = Math.max(currentIndex - 1, 0);
//     setCurrentIndex(prev);
//     if (isPlaying) await loadAndPlay(prev);
//   };

//   // ── Format time mm:ss ───────────────────────────────────────────────────────
//   const formatTime = (ms) => {
//     if (!ms || isNaN(ms)) return '00:00';
//     const totalSec = Math.floor(ms / 1000);
//     const min = Math.floor(totalSec / 60);
//     const sec = totalSec % 60;
//     return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
//   };

//   const progress = durationMs > 0 ? positionMs / durationMs : 0;

//   const thumbUrl =
//     currentPodcast?.images ||
//     currentPodcast?.thumbnail ||
//     currentPodcast?.largeimages ||
//     null;

//   // ── Render ──────────────────────────────────────────────────────────────────
//   return (
//     <Animated.View style={[podStyles.container, { width: panelWidth }]}>

//       {/* ── Collapsed: just the play button ── */}
//       {!expanded && (
//         <TouchableOpacity style={podStyles.collapsedBtn} onPress={toggleExpand} activeOpacity={0.85}>
//           <Ionicons name="musical-notes" size={18} color="#fff" />
//           <Text style={podStyles.collapsedLabel}>Podcast</Text>
//           {isPlaying && (
//             <View style={podStyles.playingDot} />
//           )}
//         </TouchableOpacity>
//       )}

//       {/* ── Expanded: full mini-player ── */}
//       {expanded && (
//         <View style={podStyles.expanded}>
//           {/* Header row */}
//           <View style={podStyles.headerRow}>
//             <Ionicons name="musical-notes" size={14} color="#fff" />
//             <Text style={podStyles.headerTitle} numberOfLines={1}>பாட்காஸ்ட்</Text>
//             <TouchableOpacity onPress={toggleExpand} style={podStyles.closeBtn}>
//               <Ionicons name="chevron-forward" size={18} color="#fff" />
//             </TouchableOpacity>
//           </View>

//           {/* Thumbnail + info */}
//           <View style={podStyles.infoRow}>
//             {thumbUrl ? (
//               <Image source={{ uri: thumbUrl }} style={podStyles.thumb} resizeMode="cover" />
//             ) : (
//               <View style={[podStyles.thumb, podStyles.thumbPlaceholder]}>
//                 <Ionicons name="headset" size={20} color="rgba(255,255,255,0.6)" />
//               </View>
//             )}
//             <View style={podStyles.textBlock}>
//               <Text style={podStyles.podTitle} numberOfLines={2}>
//                 {currentPodcast?.title ||
//                   currentPodcast?.newstitle ||
//                   currentPodcast?.name ||
//                   'பாட்காஸ்ட்'}
//               </Text>
//               <Text style={podStyles.podMeta}>
//                 {currentIndex + 1}/{data.length} · {currentPodcast?.standarddate || ''}
//               </Text>
//               {error && <Text style={podStyles.errorText}>{error}</Text>}
//             </View>
//           </View>

//           {/* Progress bar */}
//           <View style={podStyles.progressRow}>
//             <Text style={podStyles.timeText}>{formatTime(positionMs)}</Text>
//             <View style={podStyles.progressBg}>
//               <View style={[podStyles.progressFill, { width: `${progress * 100}%` }]} />
//             </View>
//             <Text style={podStyles.timeText}>{formatTime(durationMs)}</Text>
//           </View>

//           {/* Controls */}
//           <View style={podStyles.controls}>
//             <TouchableOpacity onPress={handlePrev} disabled={currentIndex === 0} style={podStyles.ctrlBtn}>
//               <Ionicons name="play-skip-back" size={18} color={currentIndex === 0 ? 'rgba(255,255,255,0.3)' : '#fff'} />
//             </TouchableOpacity>

//             <TouchableOpacity onPress={handleSkipBack} style={podStyles.ctrlBtn}>
//               <Ionicons name="play-back" size={18} color="#fff" />
//               <Text style={podStyles.skipLabel}>15</Text>
//             </TouchableOpacity>

//             {/* Main play/pause */}
//             <TouchableOpacity onPress={handlePlayPause} style={podStyles.playBtn} activeOpacity={0.8}>
//               {isLoading ? (
//                 <ActivityIndicator size="small" color={COLORS.primary} />
//               ) : (
//                 <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color={COLORS.primary} />
//               )}
//             </TouchableOpacity>

//             <TouchableOpacity onPress={handleSkipForward} style={podStyles.ctrlBtn}>
//               <Ionicons name="play-forward" size={18} color="#fff" />
//               <Text style={podStyles.skipLabel}>15</Text>
//             </TouchableOpacity>

//             <TouchableOpacity onPress={handleNext} disabled={currentIndex === data.length - 1} style={podStyles.ctrlBtn}>
//               <Ionicons name="play-skip-forward" size={18} color={currentIndex === data.length - 1 ? 'rgba(255,255,255,0.3)' : '#fff'} />
//             </TouchableOpacity>
//           </View>
//         </View>
//       )}
//     </Animated.View>
//   );
// }

// const podStyles = StyleSheet.create({
//   container: {
//     position: 'absolute',
//     right: 0,
//     top: '45%',
//     backgroundColor: COLORS.primary,
//     borderTopLeftRadius: s(20),
//     borderBottomLeftRadius: s(20),
//     elevation: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: -2, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 6,
//     zIndex: 999,
//     overflow: 'hidden',
//   },
//   // Collapsed
//   collapsedBtn: {
//     width: s(56),
//     paddingVertical: vs(14),
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: vs(4),
//   },
//   collapsedLabel: {
//     color: '#fff',
//     fontSize: 9,
//     fontWeight: '700',
//     textAlign: 'center',
//   },
//   playingDot: {
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//     backgroundColor: '#4ade80',
//     marginTop: 2,
//   },
//   // Expanded
//   expanded: {
//     width: s(280),
//     padding: s(12),
//   },
//   headerRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: vs(8),
//     gap: s(6),
//   },
//   headerTitle: {
//     flex: 1,
//     color: '#fff',
//     fontSize: scaledSizes.font.sm,
//     fontWeight: '700',
//   },
//   closeBtn: { padding: s(2) },
//   // Info
//   infoRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: s(8),
//     marginBottom: vs(8),
//   },
//   thumb: {
//     width: s(44),
//     height: s(44),
//     borderRadius: s(6),
//     backgroundColor: 'rgba(255,255,255,0.15)',
//   },
//   thumbPlaceholder: {
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   textBlock: { flex: 1 },
//   podTitle: {
//     color: '#fff',
//     fontSize: scaledSizes.font.sm,
//     fontWeight: '700',
//     lineHeight: vs(16),
//     marginBottom: vs(2),
//   },
//   podMeta: {
//     color: 'rgba(255,255,255,0.65)',
//     fontSize: 10,
//   },
//   errorText: {
//     color: '#fca5a5',
//     fontSize: 10,
//     marginTop: vs(2),
//   },
//   // Progress
//   progressRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: s(6),
//     marginBottom: vs(8),
//   },
//   timeText: {
//     color: 'rgba(255,255,255,0.7)',
//     fontSize: 9,
//     width: s(32),
//     textAlign: 'center',
//   },
//   progressBg: {
//     flex: 1,
//     height: 3,
//     backgroundColor: 'rgba(255,255,255,0.25)',
//     borderRadius: 2,
//     overflow: 'hidden',
//   },
//   progressFill: {
//     height: '100%',
//     backgroundColor: '#fff',
//     borderRadius: 2,
//   },
//   // Controls
//   controls: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//   },
//   ctrlBtn: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: s(6),
//   },
//   skipLabel: {
//     color: '#fff',
//     fontSize: 8,
//     fontWeight: '700',
//     marginTop: -2,
//   },
//   playBtn: {
//     width: s(40),
//     height: s(40),
//     borderRadius: s(20),
//     backgroundColor: '#fff',
//     justifyContent: 'center',
//     alignItems: 'center',
//     elevation: 3,
//   },
// });



// FloatingPodcast.js
// In-app podcast player using expo-av — fixed hooks order & player lifecycle

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    ActivityIndicator,
    Animated,
    Linking,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Try to import expo-av with fallback handling
let Audio;
try {
    const expoAv = require('expo-av');
    Audio = expoAv.Audio;
} catch (error) {
    console.log('expo-av not available:', error.message);
    Audio = null;
}
import { COLORS } from '../utils/constants';
import { s, vs, scaledSizes } from '../utils/scaling';
import Svg, { Path } from 'react-native-svg';
import { mvs } from 'react-native-size-matters';

export default function FloatingPodcast({ data }) {
    // ── ALL hooks unconditionally at the top ───────────────────────────────────
    const [expanded, setExpanded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [positionMs, setPositionMs] = useState(0);
    const [durationMs, setDurationMs] = useState(0);
    const [error, setError] = useState(null);
    const [isHidden, setIsHidden] = useState(false);

    const soundRef = useRef(null);
    const mountedRef = useRef(true);
    const currentIndexRef = useRef(0);
    const loadAndPlayRef = useRef(null);
    const expandAnim = useRef(new Animated.Value(0)).current;

    // Keep currentIndexRef in sync
    useEffect(() => {
        currentIndexRef.current = currentIndex;
    }, [currentIndex]);

    // Track mount state
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    // Configure audio session
    useEffect(() => {
        if (!Audio) return;
        Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
        }).catch(console.error);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync().catch(() => { });
                soundRef.current = null;
            }
        };
    }, []);

    // ── Safe unload ─────────────────────────────────────────────────────────────
    const safeUnload = useCallback(async () => {
        if (!soundRef.current) return;
        const s = soundRef.current;
        soundRef.current = null;
        try { await s.stopAsync(); } catch (_) { }
        try { await s.unloadAsync(); } catch (_) { }
    }, []);

    // ── Load and play ───────────────────────────────────────────────────────────
    const loadAndPlay = useCallback(async (index) => {
        if (!data || data.length === 0) return;

        if (mountedRef.current) {
            setIsLoading(true);
            setError(null);
            setPositionMs(0);
            setDurationMs(0);
        }

        await safeUnload();

        const podcast = data[index];
        const audioUrl = podcast?.audio || podcast?.audiourl || podcast?.mp3 || null;

        if (!audioUrl) {
            if (mountedRef.current) {
                setError('ஆடியோ இணைப்பு இல்லை');
                setIsLoading(false);
            }
            return;
        }

        console.log('Loading podcast audio:', audioUrl);

        // Check if Audio is available
        if (!Audio) {
            console.log('Audio not available, opening in browser');
            if (mountedRef.current) {
                setError('ஆடியோ பிளேயரில் திறக்கப்படும்');
                setIsLoading(false);
                Alert.alert('தகவல்', 'ஆடியோ பிளேயரில் திறக்கப்படும்', [
                    { text: 'சரி', onPress: () => Linking.openURL(audioUrl) }
                ]);
            }
            return;
        }

        try {
            const { sound } = await Audio.Sound.createAsync(
                { uri: audioUrl },
                { shouldPlay: true, progressUpdateIntervalMillis: 500 },
                (status) => {
                    if (!mountedRef.current) return;
                    if (!status.isLoaded) {
                        if (status.error) console.error('Playback error:', status.error);
                        return;
                    }
                    setPositionMs(status.positionMillis ?? 0);
                    setDurationMs(status.durationMillis ?? 0);
                    setIsPlaying(status.isPlaying);

                    if (status.didJustFinish && data) {
                        const next = currentIndexRef.current + 1;
                        if (next < data.length) {
                            setCurrentIndex(next);
                            // Use ref to avoid stale closure
                            if (loadAndPlayRef.current) loadAndPlayRef.current(next);
                        } else {
                            setIsPlaying(false);
                            setCurrentIndex(0);
                        }
                    }
                }
            );

            if (!mountedRef.current) {
                await sound.unloadAsync().catch(() => { });
                return;
            }

            soundRef.current = sound;
            if (mountedRef.current) {
                setIsPlaying(true);
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Podcast load error:', err);
            soundRef.current = null;
            if (mountedRef.current) {
                setError('ஆடியோ ஏற்ற முடியவில்லை');
                setIsLoading(false);
                setIsPlaying(false);
                Alert.alert('பிழைப்பு', 'ஆடியோ ஏற்ற முடியவில்லை');
            }
        }
    }, [data, safeUnload]);

    // Keep loadAndPlay ref updated
    useEffect(() => {
        loadAndPlayRef.current = loadAndPlay;
    }, [loadAndPlay]);

    // ── Play / Pause ────────────────────────────────────────────────────────────
    const handlePlayPause = useCallback(async () => {
        if (isLoading) return;

        if (!soundRef.current) {
            await loadAndPlay(currentIndexRef.current);
            return;
        }

        try {
            const status = await soundRef.current.getStatusAsync();
            if (!status.isLoaded) {
                soundRef.current = null;
                await loadAndPlay(currentIndexRef.current);
                return;
            }
            if (status.isPlaying) {
                await soundRef.current.pauseAsync();
                if (mountedRef.current) setIsPlaying(false);
            } else {
                await soundRef.current.playAsync();
                if (mountedRef.current) setIsPlaying(true);
            }
        } catch (err) {
            console.error('Play/pause error:', err);
            soundRef.current = null;
            await loadAndPlay(currentIndexRef.current);
        }
    }, [isLoading, loadAndPlay]);

    // ── Skip ±15s ───────────────────────────────────────────────────────────────
    const handleSkipForward = useCallback(async () => {
        if (!soundRef.current) return;
        try {
            const status = await soundRef.current.getStatusAsync();
            if (status.isLoaded) {
                await soundRef.current.setPositionAsync(Math.min(positionMs + 15000, durationMs));
            }
        } catch (_) { }
    }, [positionMs, durationMs]);

    const handleSkipBack = useCallback(async () => {
        if (!soundRef.current) return;
        try {
            const status = await soundRef.current.getStatusAsync();
            if (status.isLoaded) {
                await soundRef.current.setPositionAsync(Math.max(positionMs - 15000, 0));
            }
        } catch (_) { }
    }, [positionMs]);

    // ── Next / Prev ─────────────────────────────────────────────────────────────
    const handleNext = useCallback(async () => {
        if (!data) return;
        const next = Math.min(currentIndexRef.current + 1, data.length - 1);
        setCurrentIndex(next);
        await loadAndPlay(next);
    }, [data, loadAndPlay]);

    const handlePrev = useCallback(async () => {
        const prev = Math.max(currentIndexRef.current - 1, 0);
        setCurrentIndex(prev);
        await loadAndPlay(prev);
    }, [loadAndPlay]);

    // ── Expand / Collapse ───────────────────────────────────────────────────────
    const toggleExpand = useCallback(() => {
        setExpanded((prev) => {
            Animated.spring(expandAnim, {
                toValue: prev ? 0 : 1,
                useNativeDriver: false,
                tension: 60,
                friction: 10,
            }).start();
            return !prev;
        });
    }, [expandAnim]);

    const panelWidth = expandAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [s(70), s(280)],
    });

    // ── Format mm:ss ────────────────────────────────────────────────────────────
    const formatTime = (ms) => {
        if (!ms || isNaN(ms)) return '00:00';
        const total = Math.floor(ms / 1000);
        const m = Math.floor(total / 60);
        const sec = total % 60;
        return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    // ── Early return AFTER all hooks ────────────────────────────────────────────
    if (!data || data.length === 0) return null;

    const currentPodcast = data[currentIndex] ?? data[0];
    const progress = durationMs > 0 ? Math.min(positionMs / durationMs, 1) : 0;
    const thumbUrl = currentPodcast?.images || currentPodcast?.thumbnail || currentPodcast?.largeimages || null;



    function ChevronIcon({ direction = 'left', size = 16, color = '#fff' }) {
        return (
            <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
                {direction === 'left' ? (
                    <>
                        <Path
                            d="M13 17l5-5-5-5"
                            stroke={color}
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <Path
                            d="M6 17l5-5-5-5"
                            stroke={color}
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </>
                ) : (
                    <>
                        <Path
                            d="M11 17l-5-5 5-5"
                            stroke={color}
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <Path
                            d="M18 17l-5-5 5-5"
                            stroke={color}
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </>
                )}
            </Svg>
        );
    }

    return (
        <Animated.View style={[podStyles.container, { width: panelWidth }]}>

            {/* ── Collapsed ── */}
            {!expanded && (
                <TouchableOpacity style={podStyles.collapsedBtn} onPress={toggleExpand} activeOpacity={0.85}>
                    <Text style={podStyles.collapsedLabel}>Podcast</Text>
                    {/* {isPlaying && <View style={podStyles.playingDot} />} */}
                    <TouchableOpacity onPress={handlePlayPause} style={[podStyles.playBtn,{width:s(30),height:s(30),borderRadius:s(15)}]} activeOpacity={0.8}>
                        {isLoading
                            ? <ActivityIndicator size="small" color={COLORS.podcast} />
                            : <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color={COLORS.podcast} />
                        }
                    </TouchableOpacity>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: "center" }}>
                        <Text style={[podStyles.triggerText, { fontSize: mvs(8) }]}>மேலும்</Text>
                        <ChevronIcon size={16} color="#fff" />
                    </View>

                </TouchableOpacity>
            )}

            {/* ── Expanded ── */}
            {expanded && (
                <View style={podStyles.expandedPanel}>
                    {/* Header */}
                    <View style={podStyles.headerRow}>
                        <Ionicons name="musical-notes" size={14} color="#fff" />
                        <Text style={podStyles.headerTitle} numberOfLines={1}>பாட்காஸ்ட்</Text>
                        <TouchableOpacity onPress={toggleExpand} style={podStyles.closeBtn}>
                            {/* <Ionicons name="chevron-forward" size={18} color="#fff" /> */}
                            <ChevronIcon direction="right" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Thumbnail + Info */}
                    <View style={podStyles.infoRow}>
                        {thumbUrl ? (
                            <Image source={{ uri: thumbUrl }} style={podStyles.thumb} resizeMode="cover" />
                        ) : (
                            <View style={[podStyles.thumb, podStyles.thumbPlaceholder]}>
                                <Ionicons name="headset" size={20} color="rgba(255,255,255,0.6)" />
                            </View>
                        )}
                        <View style={podStyles.textBlock}>
                            <Text style={podStyles.podTitle} numberOfLines={2}>
                                {currentPodcast?.title || currentPodcast?.newstitle || currentPodcast?.name || 'பாட்காஸ்ட்'}
                            </Text>
                            <Text style={podStyles.podMeta}>
                                {currentIndex + 1}/{data.length} · {currentPodcast?.standarddate || ''}
                            </Text>
                            {error && <Text style={podStyles.errorText}>{error}</Text>}
                        </View>
                    </View>

                    {/* Progress bar */}
                    <View style={podStyles.progressRow}>
                        <Text style={podStyles.timeText}>{formatTime(positionMs)}</Text>
                        <View style={podStyles.progressBg}>
                            <View style={[podStyles.progressFill, { width: `${progress * 100}%` }]} />
                        </View>
                        <Text style={podStyles.timeText}>{formatTime(durationMs)}</Text>
                    </View>

                    {/* Controls */}
                    <View style={podStyles.controls}>
                        <TouchableOpacity onPress={handlePrev} disabled={currentIndex === 0} style={podStyles.ctrlBtn}>
                            <Ionicons name="play-skip-back" size={18} color={currentIndex === 0 ? 'rgba(255,255,255,0.3)' : '#fff'} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleSkipBack} style={podStyles.ctrlBtn}>
                            <Ionicons name="play-back" size={18} color="#fff" />
                            <Text style={podStyles.skipLabel}>15</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handlePlayPause} style={podStyles.playBtn} activeOpacity={0.8}>
                            {isLoading
                                ? <ActivityIndicator size="small" color={COLORS.primary} />
                                : <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color={COLORS.primary} />
                            }
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleSkipForward} style={podStyles.ctrlBtn}>
                            <Ionicons name="play-forward" size={18} color="#fff" />
                            <Text style={podStyles.skipLabel}>15</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleNext} disabled={currentIndex === data.length - 1} style={podStyles.ctrlBtn}>
                            <Ionicons name="play-skip-forward" size={18} color={currentIndex === data.length - 1 ? 'rgba(255,255,255,0.3)' : '#fff'} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </Animated.View>
    );
}

const podStyles = StyleSheet.create({
    container: {
        position: 'absolute',
        right: 0,
        top: '45%',
        backgroundColor: COLORS.podcast,
        borderTopLeftRadius: s(20),
        borderBottomLeftRadius: s(20),
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: -2, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        zIndex: 999,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgb(255, 255, 255)',
    },
    collapsedBtn: {
        width: s(56),
        paddingVertical: vs(25),
        alignItems: 'center',
        justifyContent: 'center',
        gap: vs(4),
    },
    collapsedLabel: { color: '#fff', fontSize: mvs(10), fontWeight: '700', textAlign: 'center' },
    triggerText: {
        color: '#fff',
        fontSize: mvs(10),
        fontWeight: 'bold',
        // marginTop: vs(2),
        textAlign: 'center',
    },
    playingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80', marginTop: 2 },
    expandedPanel: { width: s(280), padding: s(12) },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: vs(8), gap: s(6) },
    headerTitle: { flex: 1, color: '#fff', fontSize: mvs(12), fontWeight: '700' },
    closeBtn: { padding: s(2) },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: s(8), marginBottom: vs(8) },
    thumb: { width: s(44), height: s(44), borderRadius: s(6), backgroundColor: 'rgba(255,255,255,0.15)' },
    thumbPlaceholder: { justifyContent: 'center', alignItems: 'center' },
    textBlock: { flex: 1 },
    podTitle: { color: '#fff', fontSize: scaledSizes.font.sm, fontWeight: '700', lineHeight: vs(16), marginBottom: vs(2) },
    podMeta: { color: 'rgba(255,255,255,0.65)', fontSize: 10 },
    errorText: { color: '#fca5a5', fontSize: 10, marginTop: vs(2) },
    progressRow: { flexDirection: 'row', alignItems: 'center', gap: s(6), marginBottom: vs(8) },
    timeText: { color: 'rgba(255,255,255,0.7)', fontSize: 9, width: s(32), textAlign: 'center' },
    progressBg: { flex: 1, height: 3, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 2, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
    controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    ctrlBtn: { alignItems: 'center', justifyContent: 'center', padding: s(6) },
    skipLabel: { color: '#fff', fontSize: 8, fontWeight: '700', marginTop: -2 },
    playBtn: {
        width: s(40), height: s(40), borderRadius: s(20),
        backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 3,
    },
});