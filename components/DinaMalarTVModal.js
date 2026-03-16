import React, { useRef } from 'react';
import {
  Dimensions,
  StyleSheet,
  View,
  TouchableOpacity,
  PanResponder,
  Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { ms, s, vs } from '../utils/scaling';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PLAYER_WIDTH  = SCREEN_WIDTH - s(24);
const PLAYER_HEIGHT = ms(185);

// Boundary limits so player never goes off screen
const MIN_X = 0;
const MAX_X = SCREEN_WIDTH - PLAYER_WIDTH;
const MIN_Y = 0;
const MAX_Y = SCREEN_HEIGHT - PLAYER_HEIGHT - vs(60);

// ─── YouTube ID Extractor ─────────────────────────────────────────────────────
function getYouTubeId(url = '') {
  const patterns = [
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

// ─── HTML Builder ─────────────────────────────────────────────────────────────
function buildEmbedHtml(url = '') {
  const ytId = getYouTubeId(url);

  if (ytId) {
    return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
      #player { width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <div id="player"></div>
    <script>
      var tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      var player;

      function onYouTubeIframeAPIReady() {
        player = new YT.Player('player', {
          videoId: '${ytId}',
          playerVars: {
            autoplay: 1,
            playsinline: 1,
            rel: 0,
            start: 0,
            controls: 1,
            modestbranding: 0,
            iv_load_policy: 3,
            enablejsapi: 1,
            origin: 'https://www.youtube.com',
          },
          events: {
            onReady: function(event) {
              event.target.seekTo(0, true);
              event.target.unMute();
              event.target.playVideo();
            },
            onError: function(event) {
              console.log('YouTube player error:', event.data);
            }
          }
        });
      }
    </script>
  </body>
</html>`;
  }

  const isDirectVideo = /\.(mp4|webm|ogg|m3u8)(\?|$)/i.test(url);
  if (isDirectVideo) {
    return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
      video { width: 100%; height: 100%; object-fit: contain; }
    </style>
  </head>
  <body>
    <video src="${url}" autoplay controls playsinline preload="auto"></video>
  </body>
</html>`;
  }

  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
      iframe { width: 100%; height: 100%; border: none; }
    </style>
  </head>
  <body>
    <iframe src="${url}" allowfullscreen allow="autoplay; fullscreen"></iframe>
  </body>
</html>`;
}

// ─── DinaMalarTVModal ─────────────────────────────────────────────────────────
export default function DinaMalarTVModal({ visible = false, url = '', onClose }) {

  const startX = (SCREEN_WIDTH - PLAYER_WIDTH) / 2;
  const startY = (SCREEN_HEIGHT - PLAYER_HEIGHT) / 2;

  const pan = useRef(new Animated.ValueXY({ x: startX, y: startY })).current;
  const currentPos = useRef({ x: startX, y: startY });

  const panResponder = useRef(
    PanResponder.create({
      // Activate drag anywhere on the player EXCEPT close button area
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3,

      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3,

      onPanResponderGrant: () => {
        pan.setOffset({ x: currentPos.current.x, y: currentPos.current.y });
        pan.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: (_, gestureState) => {
        const newX = Math.min(MAX_X, Math.max(MIN_X, currentPos.current.x + gestureState.dx));
        const newY = Math.min(MAX_Y, Math.max(MIN_Y, currentPos.current.y + gestureState.dy));
        pan.setValue({
          x: newX - currentPos.current.x,
          y: newY - currentPos.current.y,
        });
      },

      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();
        const newX = Math.min(MAX_X, Math.max(MIN_X, currentPos.current.x + gestureState.dx));
        const newY = Math.min(MAX_Y, Math.max(MIN_Y, currentPos.current.y + gestureState.dy));
        currentPos.current = { x: newX, y: newY };
        pan.setValue({ x: newX, y: newY });
      },
    })
  ).current;

  if (!visible || !url) return null;

  const html = buildEmbedHtml(url);

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.playerBox,
          { position: 'absolute', top: 0, left: 0 },
          { transform: pan.getTranslateTransform() },
        ]}
        pointerEvents="auto"
        {...panResponder.panHandlers}
      >
        {/* ── WebView fills the full playerBox — no drag bar ──────────────── */}
        <WebView
          source={{ html }}
          style={styles.webview}
          allowsFullscreenVideo={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback={true}
          scrollEnabled={false}
          originWhitelist={['*']}
          backgroundColor="#000000"
          mixedContentMode="always"
          startInLoadingState={true}
          allowsProtectedMedia={true}
        />

        {/* ── Close button — floats over top-left of video ─────────────────
            pointerEvents="none" on WebView is NOT needed — TouchableOpacity
            sits in a sibling View layer above WebView via zIndex             */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          activeOpacity={0.8}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.closeBtnInner}>
            <Ionicons name="close" size={s(16)} color="#fff" />
          </View>
        </TouchableOpacity>

      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    elevation: 999,
  },

  playerBox: {
    width: PLAYER_WIDTH-26,
    height: PLAYER_HEIGHT,       // exact card image height — no extra bar
    backgroundColor: '#000',
    // borderRadius: s(8),
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },

  // ── WebView fills full player height ────────────────────────────────────────
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },

  // ── Close button floats over video top-left ──────────────────────────────────
  closeBtn: {
    position: 'absolute',
    top: vs(8),
    left: s(8),
    zIndex: 10,        // above WebView
    elevation: 10,
  },
  closeBtnInner: {
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});