// components/TaboolaComponent.js
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { s, vs, ms } from '../utils/scaling';

// ─── Taboola publisher ID for mobile ──────────────────────────────────────
const TABOOLA_PUBLISHER_ID = 'mdinamalarcom';

// ─── Taboola Widget Component ────────────────────────────────────────────────
export function TaboolaWidget({ 
  pageUrl, 
  mode, 
  container, 
  placement, 
  pageType = 'article', 
  targetType = 'mix',
  style 
}) {
  const [height, setHeight] = useState(1);
  
  if (!mode || !container || !placement || !pageUrl) return null;
  
  const safe = (str) => String(str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { background: #fff; overflow-x: hidden; width: 100%; }
    #${safe(container)} { width: 100%; min-height: 1px; }
    img { max-width: 100% !important; width: 100% !important; height: auto !important; display: block !important; object-fit: cover !important; object-position: center center !important; }
  </style>
</head>
<body>
  <div id="${safe(container)}"></div>
  <script>
    window._taboola = window._taboola || [];
    _taboola.push({${safe(pageType)}:'auto'});
    _taboola.push({
      mode:'${safe(mode)}',
      container:'${safe(container)}',
      placement:'${safe(placement)}',
      target_type:'${safe(targetType)}'
    });
  </script>
  <script>
    (function() {
      var s = document.createElement('script');
      s.type = 'text/javascript';
      s.async = true;
      s.src = 'https://cdn.taboola.com/libtrc/${TABOOLA_PUBLISHER_ID}/loader.js';
      s.id = 'tb_loader_script';
      s.onload = function() { _taboola.push({flush: true}); };
      if (!document.getElementById('tb_loader_script')) {
        document.head.appendChild(s);
      } else {
        _taboola.push({flush: true});
      }
    })();
  </script>
  <script>
    var lH = 0;
    function gH() {
      return Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.scrollHeight
      );
    }
    function sH() {
      setTimeout(function() {
        var h = gH();
        if (h > 50 && h > lH) {
          lH = h;
          window.ReactNativeWebView.postMessage(JSON.stringify({type:'height',value:h}));
        }
      }, 200);
    }
    function wI() {
      var imgs = document.querySelectorAll('img');
      if (!imgs.length) { sH(); return; }
      var p = 0;
      imgs.forEach(function(img) {
        if (!img.complete) {
          p++;
          img.addEventListener('load', function() { if (!--p) sH(); });
          img.addEventListener('error', function() { if (!--p) sH(); });
        }
      });
      if (!p) sH();
    }
    var pc = 0;
    function poll() {
      wI();
      if (pc++ < 75) setTimeout(poll, 400);
    }
    setTimeout(poll, 500);
    if (typeof MutationObserver !== 'undefined') {
      new MutationObserver(function() { wI(); }).observe(document.body, {
        childList: true, subtree: true, attributes: false
      });
    }
  </script>
</body>
</html>`;
  
  return (
    <View style={[styles.container, style]}>
      <WebView
        source={{ html, baseUrl: 'https://www.dinamalar.com' }}
        style={{ width: '100%', height }}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        mixedContentMode="always"
        originWhitelist={['*']}
        allowsInlineMediaPlayback
        onMessage={(e) => {
          try {
            const m = JSON.parse(e.nativeEvent.data);
            if (m.type === 'height' && m.value > 50) {
              setHeight(p => Math.max(p, m.value));
            }
          } catch {
            const h = parseInt(e.nativeEvent.data, 10);
            if (!isNaN(h) && h > 50) {
              setHeight(p => Math.max(p, h));
            }
          }
        }}
        nestedScrollEnabled={false}
      />
    </View>
  );
}

// ─── Taboola Ad Section Component ────────────────────────────────────────────
export function TaboolaAdSection({ 
  taboolaAds, 
  position = 'midmain', 
  pageUrl, 
  pageType = 'article' 
}) {
  if (!taboolaAds || !taboolaAds[position]) return null;
  
  const adConfig = taboolaAds[position];
  
  return (
    <View style={styles.adSection}>
      <Text style={styles.adLabel}>ADVERTISEMENT</Text>
      <TaboolaWidget
        pageUrl={pageUrl}
        mode={adConfig.mode}
        container={adConfig.container}
        placement={adConfig.placement}
        targetType={adConfig.target_type}
        pageType={pageType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#fff',
    overflow: 'hidden',
    marginVertical: vs(8),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F4F6F8',
  },
  adSection: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    marginVertical: vs(6),
    paddingVertical: vs(8),
  },
  adLabel: {
    fontSize: ms(9),
    color: '#999',
    marginBottom: vs(4),
    letterSpacing: 0.5,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
