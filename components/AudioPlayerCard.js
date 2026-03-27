import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';
import { s, vs } from '../utils/scaling';

export default function AudioPlayerCard({ audioUrl = '', data = {} }) {
  const [height, setHeight] = useState(150);
  const [fontBase64, setFontBase64] = useState('');

  const spotifyLink = data?.spotify || 'https://open.spotify.com/show/6mBamN8dXBsAIuhAh4N1sd';
  const alexaLink   = data?.alexa || data?.amazon || 'https://www.amazon.in/DINAMALAR-Dinamalar/dp/B079T3FMWV';

  useEffect(() => {
    (async () => {
      try {
        const asset = Asset.fromModule(require('../assets/fonts/MuktaMalar-Bold.ttf'));
        await asset.downloadAsync();
        const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setFontBase64(base64);
      } catch (e) {
        console.warn('Font load error:', e);
      }
    })();
  }, []);

  const fontFaceStyle = fontBase64
    ? `@font-face {
        font-family: 'MuktaMalar';
        src: url('data:font/truetype;base64,${fontBase64}') format('truetype');
        font-weight: 700;
        font-style: normal;
      }`
    : '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    ${fontFaceStyle}

    body {
      background: linear-gradient(147deg, #f7f7f7 0%, #dee4ea 74%);
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      padding: 12px 14px 14px;
    }

    /* ── Title ── */
    .title-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding-bottom: 8px;
      margin-bottom: 10px;
      border-bottom: 0.2px solid #9e9e9e;
      text-align: center;
    }
    .title-text {
      font-size: 15px;
      font-weight: 700;
      font-family: 'MuktaMalar', -apple-system, sans-serif;
      color: #212B36;
      line-height: 1.6;
      text-align: center;
      flex: 1;
    }

    /* ── Audio row ── */
    .audio-row {
      display: flex;
      align-items: center;
      width: 100%;
      gap: 6px;
      margin-bottom: 4px;
    }
    audio {
      flex: 1;
      min-width: 0;
      height: 36px;
      // opacity: 0.8;
      border-radius: 0px;
    }
    .speed-select {
      font-size: 13px;
      color: #000;
      border: 0;
      background: transparent;
      background-image: url("data:image/svg+xml;utf8,<svg fill='%23454f5b' height='20' viewBox='0 0 24 24' width='20' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>");
      background-repeat: no-repeat;
      background-position: right 0px center;
      padding: 2px 20px 2px 4px;
      cursor: pointer;
      flex-shrink: 0;
      -webkit-appearance: none;
      appearance: none;
    }

    /* ── LISTEN ON ── */
    .listen-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      flex-wrap: wrap;
    }
    .listen-label {
      font-size: 11px;
      color: #637381;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 3px;
      white-space: nowrap;
      letter-spacing: 0.4px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 25px;
      border: 1px solid #e7e7e7;
      background: #eeeeee;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.2s;
    }
    .badge:active { background: #ddd; }
    .badge-spotify { color: #00d44a; }
    .badge-alexa   { color: #05A0D1; }

    .icon-spotify {
      width: 15px; height: 15px;
      fill: #1ED760; flex-shrink: 0;
    }
    .icon-alexa {
      width: 15px; height: 15px;
      fill: #05A0D1; flex-shrink: 0;
    }
  </style>
</head>
<body>

  <!-- Title -->
  <div class="title-row">
    <span class="title-text">
      வாசிக்க நேரம் இல்லையா? செய்தியைக் கேளுங்கள்
      <!-- FaHeadphones exact SVG from web source -->
      <svg stroke="currentColor" fill="currentColor" stroke-width="0"
        viewBox="0 0 512 512" height="1em" width="1em"
        xmlns="http://www.w3.org/2000/svg"
        style="color:black; margin:0px 0px -3px 6px; width:20px; height:20px;">
        <path d="M256 32C114.52 32 0 146.496 0 288v48a32 32 0 0 0 17.689 28.622l14.383 7.191C34.083 431.903 83.421 480 144 480h24c13.255 0 24-10.745 24-24V280c0-13.255-10.745-24-24-24h-24c-31.342 0-59.671 12.879-80 33.627V288c0-105.869 86.131-192 192-192s192 86.131 192 192v1.627C427.671 268.879 399.342 256 368 256h-24c-13.255 0-24 10.745-24 24v176c0 13.255 10.745 24 24 24h24c60.579 0 109.917-48.098 111.928-108.187l14.382-7.191A32 32 0 0 0 512 336v-48c0-141.479-114.496-256-256-256z"></path>
      </svg>
    </span>
  </div>

  <!-- Audio + Speed -->
  <div class="audio-row">
    <audio
      id="audio"
      src="${audioUrl || ''}"
      controls
      controlsList="nodownload noplaybackrate nomoreoptions"
      preload="metadata"
    ></audio>
    <select class="speed-select" id="speedSel" onchange="changeSpeed(this.value)">
      <option value="0.75">0.75x</option>
      <option value="1" selected>1x</option>
      <option value="1.25">1.25x</option>
      <option value="1.5">1.5x</option>
    </select>
  </div>

  <!-- LISTEN ON -->
  <div class="listen-row">
    <span class="listen-label">
      <!-- PiDotsThreeOutlineVerticalLight exact SVG -->
      <svg stroke="currentColor" fill="currentColor" stroke-width="0"
        viewBox="0 0 256 256" height="12" width="12"
        xmlns="http://www.w3.org/2000/svg">
        <path d="M128,98a30,30,0,1,0,30,30A30,30,0,0,0,128,98Zm0,48a18,18,0,1,1,18-18A18,18,0,0,1,128,146Zm0-68A30,30,0,1,0,98,48,30,30,0,0,0,128,78Zm0-48a18,18,0,1,1-18,18A18,18,0,0,1,128,30Zm0,148a30,30,0,1,0,30,30A30,30,0,0,0,128,178Zm0,48a18,18,0,1,1,18-18A18,18,0,0,1,128,226Z"/>
      </svg>
      LISTEN ON
    </span>

    <!-- Spotify — exact FaSpotify SVG from web source -->
    <a class="badge badge-spotify" href="${spotifyLink}" target="_blank">
      <svg class="icon-spotify" viewBox="0 0 496 512"
        fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8zm100.7 364.9c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4zm26.9-65.6c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm31-76.2c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3z"/>
      </svg>
      Spotify
    </a>

    <!-- Alexa — exact BsAlexa SVG from web source -->
    <a class="badge badge-alexa" href="${alexaLink}" target="_blank">
      <svg class="icon-alexa" viewBox="0 0 16 16"
        fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.996 0A7.998 7.998 0 0 0 0 8a8 8 0 0 0 6.93 7.93v-1.613a1.06 1.06 0 0 0-.717-1.008A5.602 5.602 0 0 1 2.4 7.865 5.579 5.579 0 0 1 8.054 2.4a5.599 5.599 0 0 1 5.535 5.81l-.002.046a6.116 6.116 0 0 1-.012.192l-.005.061a4.85 4.85 0 0 1-.033.284l-.01.068c-.685 4.516-6.564 7.054-6.596 7.068A7.998 7.998 0 0 0 15.992 8 7.998 7.998 0 0 0 7.996.001Z"/>
      </svg>
      Amazon Alexa
    </a>
  </div>

  <script>
    var audio = document.getElementById('audio');
    function changeSpeed(v) {
      if (audio) audio.playbackRate = parseFloat(v);
    }
    function sendHeight() {
      var h = document.body.scrollHeight;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', value: h }));
    }
    audio.addEventListener('loadedmetadata', sendHeight);
    setTimeout(sendHeight, 400);
  </script>
</body>
</html>`;

  return (
    <View style={styles.outerCard}>
      <View style={{ height, width: '100%' }}>
        <WebView
          source={{ html }}
          style={{ backgroundColor: 'transparent', height }}
          scrollEnabled={false}
          javaScriptEnabled
          originWhitelist={['*']}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          onMessage={(e) => {
            try {
              const msg = JSON.parse(e.nativeEvent.data);
              if (msg.type === 'height' && msg.value > 0) {
                setHeight(Math.max(msg.value + 12, 120));
              }
            } catch {}
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerCard: {
    marginHorizontal: s(12),
    marginVertical: vs(10),
    borderRadius: s(10),
    overflow: 'hidden',
    backgroundColor: '#dee4ea',
  },
});