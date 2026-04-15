import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  PermissionsAndroid,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Pulse Ring ───────────────────────────────────────────────────────────────
function PulseRing({ color, delay, size }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] });
  const opacity = anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.6, 0.2, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 2,
        borderColor: color,
        transform: [{ scale }],
        opacity,
      }}
    />
  );
}

// ─── Waveform Bar ─────────────────────────────────────────────────────────────
function WaveBar({ isRecording, delay }) {
  const anim = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    let loop;
    if (isRecording) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 0.4 + Math.random() * 0.6,
            duration: 180 + Math.random() * 280,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.15 + Math.random() * 0.35,
            duration: 180 + Math.random() * 280,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    } else {
      Animated.timing(anim, {
        toValue: 0.25,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    return () => loop && loop.stop();
  }, [isRecording]);

  return (
    <Animated.View
      style={{
        width: 5,
        height: 36,
        borderRadius: 3,
        marginHorizontal: 3,
        backgroundColor: isRecording ? '#1565C0' : '#C5D5F5',
        transform: [{ scaleY: anim }],
      }}
    />
  );
}

function Waveform({ isRecording }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height: 48, justifyContent: 'center' }}>
      {[0, 60, 120, 0, 90, 30, 150].map((delay, i) => (
        <WaveBar key={i} isRecording={isRecording} delay={delay} />
      ))}
    </View>
  );
}

// ─── VoiceSearchModal ─────────────────────────────────────────────────────────
/**
 * Props:
 *   visible   boolean
 *   onClose   () => void
 *   onResult  (text: string) => void
 */
export default function VoiceSearchModal({ visible, onClose, onResult }) {
  const [status, setStatus] = useState('idle'); // idle | listening | processing | error
  const [transcript, setTranscript] = useState('');
  const [selectedLang, setSelectedLang] = useState('ta-IN');

  const slideAnim = useRef(new Animated.Value(400)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;
  const VoiceRef = useRef(null);

  // Try to load Speech Recognition library
  useEffect(() => {
    try {
      VoiceRef.current = require('expo-speech-recognition');
    } catch (e) {
      console.warn('[VoiceSearch] expo-speech-recognition not found. Using simulation mode.');
    }
  }, []);

  // Animate modal in/out
  useEffect(() => {
    if (visible) {
      setStatus('idle');
      setTranscript('');
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 180,
        }),
        Animated.timing(bgOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 400,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(bgOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
      stopListening();
    }
  }, [visible]);

  // Wire Voice callbacks
  useEffect(() => {
    const V = VoiceRef.current;
    if (!V) return;

    const setupListeners = () => {
      V.addEventListener('start', () => setStatus('listening'));
      V.addEventListener('end', () => setStatus('processing'));
      V.addEventListener('result', (e) => {
        const text = e.results?.[0]?.transcript || '';
        setTranscript(text);
        setStatus('idle');
        if (text) {
          setTimeout(() => {
            onResult && onResult(text);
            handleClose();
          }, 700);
        }
      });
      V.addEventListener('error', (e) => {
        console.log('Voice error:', e);
        setStatus('error');
      });
    };

    setupListeners();

    return () => {
      V.stop?.().catch(() => {});
    };
  }, []);

  const requestMicPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'Voice search needs microphone access',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch {
        return false;
      }
    }
    return true; // iOS handles via Info.plist
  };

  const startListening = async () => {
    const hasPermission = await requestMicPermission();
    if (!hasPermission) {
      setStatus('error');
      return;
    }

    setTranscript('');
    setStatus('listening');

    const V = VoiceRef.current;
    if (!V) {
      // Simulation fallback
      setTimeout(() => {
        setStatus('processing');
        setTimeout(() => {
          const demoText = selectedLang === 'ta-IN' ? 'politics' : 'politics';
          setTranscript(demoText);
          setStatus('idle');
          setTimeout(() => {
            onResult && onResult(demoText);
            handleClose();
          }, 700);
        }, 1200);
      }, 2200);
      return;
    }

    try {
      // expo-speech-recognition uses different API
      const isAvailable = await V.isAvailableAsync();
      if (!isAvailable) {
        setStatus('error');
        return;
      }
      
      await V.requestPermissionsAsync();
      await V.startAsync({
        lang: selectedLang,
        interimResults: true,
        maxResults: 1,
      });
    } catch (e) {
      console.log('Speech recognition error:', e);
      setStatus('error');
    }
  };

  const stopListening = async () => {
    const V = VoiceRef.current;
    if (V) {
      try { await V.stopAsync(); } catch (_) {}
      try { await V.stop(); } catch (_) {}
    }
    if (status === 'listening') setStatus('idle');
  };

  const handleClose = () => {
    stopListening();
    onClose && onClose();
  };

  const isListening = status === 'listening';

  const statusMessages = {
    idle: transcript || (selectedLang === 'ta-IN' ? 'மைக்கை அழுத்தி பேசவும்' : 'Tap mic and speak'),
    listening: selectedLang === 'ta-IN' ? 'கேட்கிறது...' : 'Listening...',
    processing: selectedLang === 'ta-IN' ? 'செயலாக்கம்...' : 'Processing...',
    error: selectedLang === 'ta-IN' ? 'மீண்டும் முயற்சிக்கவும்' : 'Try again',
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: bgOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <View style={styles.sheetContainer} pointerEvents="box-none">
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Voice Search</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={22} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Language selector */}
          <View style={styles.langRow}>
            <TouchableOpacity
              style={[styles.langPill, selectedLang === 'ta-IN' && styles.langPillActive]}
              onPress={() => setSelectedLang('ta-IN')}
            >
              <Text style={[styles.langPillText, selectedLang === 'ta-IN' && styles.langPillTextActive]}>
                தமிழ்
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langPill, selectedLang === 'en-IN' && styles.langPillActive]}
              onPress={() => setSelectedLang('en-IN')}
            >
              <Text style={[styles.langPillText, selectedLang === 'en-IN' && styles.langPillTextActive]}>
                English
              </Text>
            </TouchableOpacity>
          </View>

          {/* Waveform */}
          <Waveform isRecording={isListening} />

          {/* Mic button */}
          <View style={styles.micArea}>
            {isListening && (
              <>
                <PulseRing color="#1565C0" delay={0} size={84} />
                <PulseRing color="#1565C0" delay={350} size={84} />
                <PulseRing color="#1565C0" delay={700} size={84} />
              </>
            )}
            <TouchableOpacity
              style={[
                styles.micBtn,
                { backgroundColor: isListening ? '#1565C0' : '#E8F0FE' },
              ]}
              onPress={isListening ? stopListening : startListening}
              activeOpacity={0.82}
            >
              <Ionicons
                name={isListening ? 'mic' : 'mic-outline'}
                size={34}
                color={isListening ? '#fff' : '#1565C0'}
              />
            </TouchableOpacity>
          </View>

          {/* Status text */}
          <Text
            style={[
              styles.statusText,
              isListening && { color: '#1565C0', fontWeight: '700' },
              status === 'error' && { color: '#c62828' },
            ]}
          >
            {statusMessages[status]}
          </Text>

          {/* Hint */}
          <Text style={styles.hintText}>
            {isListening
              ? (selectedLang === 'ta-IN' ? 'நிறுத்த மீண்டும் அழுத்தவும்' : 'Tap again to stop')
              : (selectedLang === 'ta-IN' ? 'மைக் பொத்தானை அழுத்தி பேசவும்' : 'Press mic button and speak')}
          </Text>

          {/* Dinamalar branding strip */}
          <View style={styles.brandStrip}>
            <Text style={styles.brandText}>தினமலர் | Voice Search</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 24,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
    marginBottom: 20,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  closeBtn: {
    padding: 4,
  },

  // Language
  langRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  langPill: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#C5D5F5',
    backgroundColor: '#F0F4FF',
  },
  langPillActive: {
    backgroundColor: '#1565C0',
    borderColor: '#1565C0',
  },
  langPillText: {
    fontSize: 13,
    color: '#1565C0',
    fontWeight: '600',
  },
  langPillTextActive: {
    color: '#fff',
  },

  // Mic
  micArea: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
  },
  micBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1565C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },

  // Text
  statusText: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },

  // Brand
  brandStrip: {
    marginTop: 24,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    width: '100%',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 12,
    color: '#BBB',
    letterSpacing: 0.5,
  },
});