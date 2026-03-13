/**
 * VideoPlayerModal.js
 * 
 * Simple video player modal like CommonSectionScreen.
 * WebView is imported ONLY here — remove it from all other files.
 * 
 * Usage:  <VideoPlayerModal visible={true} url={videoUrl} onClose={() => {}} />
 * Place inside a View with desired height — fills 100% of parent.
 */

import React from 'react';
import { View, Modal, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

export default function VideoPlayerModal({ visible = false, url = '', onClose }) {
  if (!visible || !url) return null;

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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {/* Close button */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            top: 50,
            right: 20,
            zIndex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            borderRadius: 20,
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={onClose}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        
        {/* WebView for video */}
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
    </Modal>
  );
}