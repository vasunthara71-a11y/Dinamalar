import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { ms, s, vs } from '../utils/scaling';

// Your actual GAM network code - get from GAM dashboard URL
// admanager.google.com/[THIS_NUMBER]/...
const GAM_NETWORK_CODE = '21692507765'; // replace with yours

function GoogleAdBanner({ 
  width = 300, 
  height = 250, 
  showLabel = true, 
  adUnitId,   // e.g. "Dinamalar_MobileSite_Non_AMP_ROS_ATF_300x250"
  slotId,     // e.g. "ROS_ATF_300x250"
  style 
}) {
  const [status, setStatus] = useState('loading');

  if (!adUnitId && !slotId) {
    return <AdPlaceholder width={width} height={height} showLabel={showLabel} style={style} />;
  }

  if (status === 'failed') {
    return <AdPlaceholder width={width} height={height} showLabel={showLabel} style={style} />;
  }

  // Build a single-ad page that mimics Dinamalar mobile site
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body {
          width: ${width}px;
          height: ${height}px;
          overflow: hidden;
          background: transparent;
        }
        #${slotId} {
          width: ${width}px;
          height: ${height}px;
        }
      </style>
      <script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script>
      <script>
        window.googletag = window.googletag || { cmd: [] };

        googletag.cmd.push(function() {
          try {
            var slot = googletag.defineSlot(
              '/${GAM_NETWORK_CODE}/${adUnitId}',
              [${width}, ${height}],
              '${slotId}'
            );

            if (!slot) {
              window.ReactNativeWebView.postMessage('{"type":"failed","reason":"defineSlot returned null"}');
              return;
            }

            slot.addService(googletag.pubads());
            
            googletag.pubads().collapseEmptyDivs(true);
            googletag.pubads().enableSingleRequest();

            googletag.pubads().addEventListener('slotRenderEnded', function(event) {
              if (event.slot.getSlotElementId() === '${slotId}') {
                if (event.isEmpty) {
                  window.ReactNativeWebView.postMessage('{"type":"empty"}');
                } else {
                  window.ReactNativeWebView.postMessage('{"type":"loaded"}');
                }
              }
            });

            googletag.pubads().addEventListener('slotRequested', function(event) {
              window.ReactNativeWebView.postMessage('{"type":"requested"}');
            });

            googletag.enableServices();
            googletag.display('${slotId}');

          } catch(err) {
            window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'error', msg: err.message })
            );
          }
        });

        // Timeout after 10s
        setTimeout(function() {
          window.ReactNativeWebView.postMessage('{"type":"timeout"}');
        }, 10000);

        window.onerror = function(msg, src, line) {
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: 'jserror', msg: msg, src: src, line: line })
          );
        };
      </script>
    </head>
    <body>
      <div id="${slotId}"></div>
    </body>
    </html>
  `;

  return (
    <View style={[styles.wrapper, style]}>
      {showLabel && <Text style={styles.label}>Advertisement</Text>}

      <View style={{ width: s(width), height: vs(height) }}>
        {/* Shimmer while loading */}
        {status === 'loading' && (
          <View style={[StyleSheet.absoluteFill, styles.shimmer]}>
            <Text style={styles.shimmerText}>Loading...</Text>
          </View>
        )}

        <WebView
          source={{
            html,
            baseUrl: 'https://www.dinamalar.com', // ← must match your verified GAM domain
          }}
          style={{ width: s(width), height: vs(height) }}
          scrollEnabled={false}
          nestedScrollEnabled={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          originWhitelist={['*']}
          mixedContentMode="always"
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              console.log(`[Ad ${slotId}]`, data);

              switch (data.type) {
                case 'loaded':
                  setStatus('loaded');
                  break;
                case 'empty':
                case 'timeout':
                case 'failed':
                case 'error':
                case 'jserror':
                  console.warn(`[Ad ${slotId}] Failed:`, data);
                  setStatus('failed');
                  break;
                case 'requested':
                  console.log(`[Ad ${slotId}] Request sent to GAM`);
                  break;
              }
            } catch (e) {
              console.warn('[Ad] Message parse error:', e);
            }
          }}
          onError={(e) => {
            console.warn('[Ad] WebView error:', e.nativeEvent);
            setStatus('failed');
          }}
          onHttpError={(e) => {
            console.warn('[Ad] HTTP error:', e.nativeEvent.statusCode);
            setStatus('failed');
          }}
        />
      </View>
    </View>
  );
}

function AdPlaceholder({ width, height, showLabel, style }) {
  return (
    <View style={[styles.wrapper, style]}>
      {showLabel && <Text style={styles.label}>Advertisement</Text>}
      <View style={[styles.placeholder, { width: s(width), height: vs(height) }]}>
        <Text style={styles.placeholderText}>Advertisement</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingVertical: vs(6),
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: ms(9),
    color: '#aaa',
    marginBottom: vs(2),
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  shimmer: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    zIndex: 1,
  },
  shimmerText: {
    fontSize: ms(11),
    color: '#ccc',
  },
  placeholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e8e8e8',
    borderRadius: 4,
  },
  placeholderText: {
    fontSize: ms(11),
    color: '#bbb',
  },
});

export default GoogleAdBanner;