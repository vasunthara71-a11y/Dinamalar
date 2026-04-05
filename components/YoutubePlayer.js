import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, Image, StyleSheet, Dimensions,
} from 'react-native';
import YoutubeIframe from 'react-native-youtube-iframe';
import { Ionicons } from '@expo/vector-icons';
import { s, ms, vs } from '../utils/scaling';
import WebView from 'react-native-webview';
import { COLORS } from '../utils/constants';

const { width: SCREEN_W } = Dimensions.get('window');
const PLAYER_HEIGHT = (SCREEN_W - s(32)) * (9 / 16); // 16:9 ratio

function YoutubePlayer({ videoPath, ytId, ytThumb }) {
  console.log('YoutubePlayer props:', { videoPath, ytId, ytThumb });
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [tapped, setTapped] = useState(false);

  const onStateChange = useCallback((state) => {
    if (state === 'ended') {
      setPlaying(false);
      setTapped(false);
    }
  }, []);

  const onPress = useCallback(() => {
    setTapped(true);
    setPlaying(true);
  }, []);

  // Handle non-YouTube videos with WebView
  const isNonYouTube = videoPath && !ytId;
  console.log('YoutubePlayer state:', { playing, isNonYouTube, videoPath: !!videoPath, ytId: !!ytId, tapped, ready });

  return (
    <View style={styles.wrap}>
      {/* Show thumbnail until user taps play */}
      {!tapped && (
        <TouchableOpacity
          style={styles.thumbWrap}
          onPress={onPress}
          activeOpacity={0.9}
        >
          {ytThumb ? (
            <Image source={{ uri: ytThumb }} style={styles.thumb} resizeMode="cover" />
          ) : (
            <View style={styles.thumbPlaceholder} />
          )}
          <View style={styles.overlay} />
          <View style={styles.playBtn}>
            <Ionicons name="play" size={s(35)} color="#fff" />
          </View>
        </TouchableOpacity>
      )}

      {/* YouTube IFrame player - only mount after tap */}
      {ytId && tapped && (
        <View style={styles.playerWrap}>
          <YoutubeIframe
            height={PLAYER_HEIGHT}
            width={SCREEN_W - s(32)}
            videoId={ytId}
            play={playing && ready}
            onChangeState={onStateChange}
            onReady={() => setReady(true)}
            webViewProps={{
              allowsInlineMediaPlayback: true,
              mediaPlaybackRequiresUserAction: false,
            }}
            initialPlayerParams={{
              controls: true,
              modestbranding: true,
              rel: false,
              iv_load_policy: 3,
            }}
          />
        </View>
      )}

      {/* WebView for non-YouTube videos */}
      {isNonYouTube && tapped && (
        <View style={styles.webviewWrap}>
          <WebView
            source={{ 
              uri: videoPath.includes('autoplay=') ? videoPath : `${videoPath}&autoplay=1`,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36'
              }
            }}
            style={{ flex: 1 }}
            javaScriptEnabled
            domStorageEnabled
            thirdPartyCookiesEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo
            mixedContentMode="always"
            originWhitelist={['*']}
            scrollEnabled={false}
            bounces={false}
            onLoad={() => console.log('[Vidgyor WebView loaded]')}
            onError={(e) => console.warn('[Vidgyor WebView error]', e.nativeEvent)}
            onHttpError={(e) => console.warn('[Vidgyor HTTP error]', e.nativeEvent)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: s(12),
    height: PLAYER_HEIGHT,
    backgroundColor: '#000',
    // borderRadius: s(10),
    overflow: 'hidden',
    // marginBottom: vs(12),
  },
  thumbWrap: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  thumb: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a2e',
  },
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playBtn: {
    width: s(60),
    height: s(60),
    borderRadius: s(30),
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: s(3),
  },
  playerWrap: {
    width: '100%',
    height: '100%',
  },
  webviewWrap: {
    width: '100%',
    height: '100%',
  },
});

export default YoutubePlayer;