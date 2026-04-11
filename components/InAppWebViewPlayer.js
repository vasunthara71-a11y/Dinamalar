import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { s, vs } from '../utils/scaling';

const { width, height } = Dimensions.get('window');

export default function InAppWebViewPlayer({ data }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState(null);
  const webViewRef = useRef(null);

  if (!data || data.length === 0) return null;

  const currentPodcast = data[0] || {};
  const audioUrl = currentPodcast.audio || currentPodcast.audiourl || currentPodcast.mp3;

  const handlePlayPause = () => {
    if (!audioUrl) return;

    if (isVisible) {
      // Close modal if currently open
      setIsVisible(false);
      setIsPlaying(false);
      setCurrentAudioUrl(null);
    } else {
      // Open modal with audio player
      setCurrentAudioUrl(audioUrl);
      setIsVisible(true);
      setIsPlaying(true);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setIsPlaying(false);
    setCurrentAudioUrl(null);
  };

  // Simple HTML5 audio player that stays in WebView
  const getAudioHTML = (url) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; media-src *;">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                padding: 20px;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
            }
            .player-container {
                background: rgba(255,255,255,0.95);
                border-radius: 20px;
                padding: 30px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                backdrop-filter: blur(10px);
            }
            .header {
                text-align: center;
                margin-bottom: 20px;
            }
            .title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
                color: #333;
            }
            .audio-player {
                margin: 20px 0;
            }
            audio {
                width: 100%;
                height: 60px;
                border-radius: 10px;
                outline: none;
                pointer-events: none;
            }
            .controls {
                display: flex;
                justify-content: center;
                gap: 15px;
                margin-top: 20px;
            }
            .btn {
                background: #667eea;
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 25px;
                font-size: 16px;
                cursor: pointer;
                transition: all 0.3s ease;
                pointer-events: auto;
            }
            .btn:hover {
                background: #5a67d8;
                transform: scale(1.05);
            }
            .close-btn {
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(255,255,255,0.9);
                border: none;
                padding: 8px 12px;
                border-radius: 50%;
                font-size: 18px;
                cursor: pointer;
                color: #333;
            }
            .status {
                text-align: center;
                color: #666;
                font-size: 14px;
                margin-top: 15px;
                font-style: italic;
            }
        </style>
    </head>
    <body>
        <div class="player-container">
            <button class="close-btn" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: 'close'}))">×</button>
            
            <div class="header">
                <div class="title">🎵 தினமலர் பாட்காஸ்ட்</div>
            </div>
            
            <div class="audio-player">
                <audio controls autoplay id="audioPlayer" preload="auto">
                    <source src="${url}" type="audio/mpeg">
                    <source src="${url}" type="audio/mp3">
                    Your browser does not support the audio element.
                </audio>
            </div>
            
            <div class="controls">
                <button class="btn" onclick="togglePlay()">⏸️ நிறுத்து</button>
                <button class="btn" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type: 'close'}))">மூடு</button>
            </div>
            
            <div class="status" id="status">🎧 ஆடியோ ஏற்றப்படுகிறது...</div>
        </div>
        
        <script>
            // Prevent any external navigation
            document.addEventListener('click', function(e) {
                if (e.target.tagName === 'A' && e.target.href) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Prevented external navigation:', e.target.href);
                }
            });
            
            function togglePlay() {
                const audio = document.getElementById('audioPlayer');
                const status = document.getElementById('status');
                
                if (audio.paused) {
                    audio.play().then(function() {
                        status.textContent = '🎵 இயக்கப்படுகிறது...';
                        window.ReactNativeWebView.postMessage(JSON.stringify({type: 'playing'}));
                    }).catch(function(error) {
                        console.log('Play error:', error);
                        status.textContent = '❌ பிழை: ' + error.message;
                        window.ReactNativeWebView.postMessage(JSON.stringify({type: 'error', error: error.message}));
                    });
                } else {
                    audio.pause();
                    status.textContent = '⏸️ இடைநிறுத்து';
                    window.ReactNativeWebView.postMessage(JSON.stringify({type: 'paused'}));
                }
            }
            
            // Auto-play when loaded
            document.addEventListener('DOMContentLoaded', function() {
                const audio = document.getElementById('audioPlayer');
                const status = document.getElementById('status');
                
                audio.play().then(function() {
                    status.textContent = '🎵 இயக்கப்படுகிறது...';
                    window.ReactNativeWebView.postMessage(JSON.stringify({type: 'playing'}));
                }).catch(function(error) {
                    console.log('Auto-play failed:', error);
                    status.textContent = '⚠️ ஆட்டோ பிளேயர்கம் - பிளேயர்கம் கிளிக்க';
                    window.ReactNativeWebView.postMessage(JSON.stringify({type: 'autoplay_failed', error: error.message}));
                });
            });
            
            // Audio events
            const audio = document.getElementById('audioPlayer');
            audio.addEventListener('play', function() {
                const status = document.getElementById('status');
                status.textContent = '🎵 இயக்கப்படுகிறது...';
                window.ReactNativeWebView.postMessage(JSON.stringify({type: 'playing'}));
            });
            
            audio.addEventListener('pause', function() {
                const status = document.getElementById('status');
                status.textContent = '⏸️ இடைநிறுத்து';
                window.ReactNativeWebView.postMessage(JSON.stringify({type: 'paused'}));
            });
            
            audio.addEventListener('ended', function() {
                const status = document.getElementById('status');
                status.textContent = '🏁 முடிந்தது';
                window.ReactNativeWebView.postMessage(JSON.stringify({type: 'ended'}));
            });
            
            audio.addEventListener('error', function(e) {
                const status = document.getElementById('status');
                status.textContent = '❌ பிழை: ' + (e.target.error || e.message || 'Unknown error');
                window.ReactNativeWebView.postMessage(JSON.stringify({type: 'error', error: e.target.error || e.message || 'Unknown error'}));
            });
        </script>
    </body>
    </html>
    `;
  };

  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('WebView message:', data);
      
      switch (data.type) {
        case 'playing':
          setIsPlaying(true);
          break;
        case 'paused':
          setIsPlaying(false);
          break;
        case 'ended':
          setIsPlaying(false);
          setIsVisible(false);
          break;
        case 'close':
          setIsVisible(false);
          setIsPlaying(false);
          break;
        case 'error':
          console.error('Audio error:', data.error);
          setIsPlaying(false);
          break;
        case 'autoplay_failed':
          console.error('Auto-play failed:', data.error);
          break;
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const handleOpenPlayer = () => {
    if (audioUrl) {
      setCurrentAudioUrl(audioUrl);
      setIsVisible(true);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleOpenPlayer}
        activeOpacity={0.9}
      >
        <Ionicons name="musical-notes" size={s(20)} color="#fff" />
        <Text style={styles.buttonText}>Podcast</Text>
        {isPlaying && <View style={styles.playingDot} />}
      </TouchableOpacity>

      {/* Modal with WebView audio player */}
      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleClose}
      >
        <View style={styles.modalContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: getAudioHTML(audioUrl) }}
            style={styles.webView}
            onMessage={handleWebViewMessage}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            mediaPlaybackRequiresUserAction={false}
            allowsInlineMediaPlayback={true}
            startInLoadingState={true}
          />
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
  buttonText: {
    color: '#fff',
    fontSize: s(10),
    fontWeight: 'bold',
    marginTop: vs(4),
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  webView: {
    flex: 1,
  },
});
