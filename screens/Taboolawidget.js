// TaboolaWidget.js
// Separated into its own file to keep NewsDetailsScreen clean.
// Usage:
//   import TaboolaWidget from './TaboolaWidget';
//   <TaboolaWidget pageUrl={url} mode={...} container={...} placement={...} />
//
// Install: npx expo install react-native-webview

import React, { useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

const PUBLISHER_ID = 'mdinamalarcom';

export default function TaboolaWidget({ pageUrl, mode, container, placement }) {
  const [height, setHeight] = useState(1);
  const webViewRef = useRef(null);

  // All props must be present — build HTML only once (useMemo equivalent via const outside return)
  const hasProps = mode && container && placement && pageUrl;

  const safe = (str) => String(str || '').replace(/'/g, "\\'");

  const html = !hasProps ? '' : `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { background: #fff; overflow-x: hidden; width: 100%; }
    #${safe(container)} { width: 100%; }
    img {
      max-width: 100% !important;
      height: auto !important;
      display: block !important;
      object-fit: cover !important;
      object-position: center center !important;
    }
  </style>
</head>
<body>
  <div id="${safe(container)}"></div>
  <script>
    window._taboola = window._taboola || [];
    _taboola.push({ article: 'auto' });
    _taboola.push({
      mode:        '${safe(mode)}',
      container:   '${safe(container)}',
      placement:   '${safe(placement)}',
      target_type: 'mix'
    });
    (function() {
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://cdn.taboola.com/libtrc/${PUBLISHER_ID}/loader.js';
      s.id  = 'tb_loader_script';
      s.onload = function() { _taboola.push({ flush: true }); };
      if (!document.getElementById('tb_loader_script')) document.head.appendChild(s);
      else _taboola.push({ flush: true });
    })();
  </script>
  <script>
    var lastH = 0;
    var stableCount = 0;
    var obs;

    function getH() {
      return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) + 16;
    }

    function report() {
      var h = getH();
      if (h > 50 && h !== lastH) {
        lastH = h;
        stableCount = 0;
        window.ReactNativeWebView.postMessage(String(h));
      } else {
        stableCount++;
        if (stableCount >= 3 && obs) obs.disconnect();
      }
    }

    function waitImagesAndReport() {
      var imgs = Array.prototype.slice.call(document.querySelectorAll('img'));
      var pending = imgs.filter(function(img) { return !img.complete; });
      if (pending.length === 0) { setTimeout(report, 100); return; }
      var done = 0;
      pending.forEach(function(img) {
        function onDone() { if (++done === pending.length) setTimeout(report, 100); }
        img.addEventListener('load',  onDone, { once: true });
        img.addEventListener('error', onDone, { once: true });
      });
    }

    setTimeout(waitImagesAndReport, 600);

    obs = new MutationObserver(function() { waitImagesAndReport(); });
    obs.observe(document.body, { childList: true, subtree: true });
  </script>
</body>
</html>`;

  if (!hasProps) return null;

  return (
    <View style={[styles.wrap, { height }]}>
      <WebView
        ref={webViewRef}
        source={{ html, baseUrl: 'https://www.dinamalar.com' }}
        style={{ width: '100%', height }}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        mixedContentMode="always"
        originWhitelist={['*']}
        onMessage={(e) => {
          const h = parseInt(e.nativeEvent.data, 10);
          if (!isNaN(h) && h > 50) {
            setHeight(prev => (h > prev ? h : prev));
          }
        }}
        onError={(e) => console.warn('[Taboola]', e.nativeEvent.description)}
        nestedScrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 8,
  },
});