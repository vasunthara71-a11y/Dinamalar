/**
 * VideoPlayerModal.js
 * 
 * Plays video inline using an iframe HTML string.
 * WebView is imported ONLY here — remove it from all other files.
 * 
 * Usage:  <VideoPlayerModal url={videoUrl} />
 * Place inside a View with desired height — fills 100% of parent.
 */

import React from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function VideoPlayerModal({ url }) {
  if (!url) return null;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100%; height: 100%; background: #000; }
          iframe {
            width: 100%;
            height: 100%;
            border: none;
          }
        </style>
      </head>
      <body>
        <iframe
          src="${url}"
          allowfullscreen
          allow="autoplay; fullscreen"
        ></iframe>
      </body>
    </html>
  `;

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <WebView
        source={{ html }}
        style={{ flex: 1 }}
        allowsFullscreenVideo
        javaScriptEnabled
        domStorageEnabled
        mediaPlaybackRequiresUserAction={false}
        scrollEnabled={false}
        originWhitelist={['*']}
      />
    </View>
  );
}