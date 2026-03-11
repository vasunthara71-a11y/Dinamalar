// components/AdsComponent.js
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { s, vs } from '../utils/scaling';
import { ms } from 'react-native-size-matters';

// ─── Expo Ads Banner ─────────────────────────────────────────────────────
import { AdMobBanner, AdMobBannerAdSize } from 'expo-ads-admob';

// ─── Simple BannerAd Component (Fallback) ───────────────────────────
function SimpleBannerAd({ unitId, size, requestOptions }) {
  return (
    <View style={[adStyles.wrapper, { width: 300, height: 250 }]}>
      <Text style={adStyles.label}>விளம்பரம்</Text>
      <View style={[adStyles.slot, { width: 300, height: 250 }]}>
        <Text style={adStyles.slotText}>Ad</Text>
        <Text style={adStyles.slotUnit} numberOfLines={1}>{unitId}</Text>
        <Text style={adStyles.slotSize}>300 × 250</Text>
      </View>
    </View>
  );
}

// ─── AdBanner ─────────────────────────────────────────────────────────
export function AdBanner({ adData, style }) {
  if (!adData || !adData.slotId) return null;

  const adW   = adData.ad_size  || 300;
  const adH   = adData.ad_size1 || 250;
  const scale = Math.min(1, (SCREEN_W - s(24)) / adW);
  const dispW = Math.round(adW * scale);
  const dispH = Math.round(adH * scale);

  return (
    <View style={[adStyles.wrapper, style]}>
      <Text style={adStyles.label}>விளம்பரம்</Text>
      
      {/* Expo Ads Banner - Primary Option */}
      <AdMobBanner
        unitId={adData.ad_unit}
        size={AdMobBannerAdSize.MEDIUM_RECTANGLE}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
          tagForChildDirectedTreatment: false
        }}
      />
      
      {/* Fallback to SimpleBannerAd if Expo ads fail */}
      <SimpleBannerAd 
        unitId={adData.ad_unit}
        size={BannerAdSize.MEDIUM_RECTANGLE}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
          tagForChildDirectedTreatment: false
        }}
        androidAppId="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXXXXXXXX"
        iosAppId="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXXXXXXXX"
      />
      
      {/* WebView AdSense fallback - if both fail */}
      <WebView
        source={{ html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta name="viewport" content="width=device-width,initial-scale=1.0">
            <style>
              * { margin:0; padding:0; box-sizing:border-box; }
              body { background:#f8f8f8; display:flex; justify-content:center;
                     align-items:center; min-height:${adH}px; }
            </style>
          </head>
          <body>
            <script async
              src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}"
              crossorigin="anonymous"></script>
            <ins class="adsbygoogle"
               style="display:inline-block;width:${adW}px;height:${adH}px"
               data-ad-client="${AD_CLIENT}"
               data-ad-slot="${adData.ad_unit}"></ins>
            <script>(adsbygoogle=window.adsbygoogle||[]).push({});</script>
          </body>
          </html>
        `}}
        style={{ width: adW, height: adH }}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
      />
      
      <View style={[adStyles.slot, { width: dispW, height: dispH }]}>
        <Text style={adStyles.slotText}>Ad</Text>
        <Text style={adStyles.slotUnit} numberOfLines={1}>{adData.slotId}</Text>
        <Text style={adStyles.slotSize}>{adW} × {adH}</Text>
      </View>
    </View>
  );
}

// ─── AdSection ────────────────────────────────────────────────────────────────
// position = 'top' | 'mid' | 'bottom'
export function AdSection({ mobileads, position = 'top' }) {
  if (!mobileads) return null;

  const slot = {
    top:    mobileads.top_300X250,
    mid:    mobileads.mid_300x250,
    bottom: mobileads.bottom_300x250,
  }[position];

  if (!slot) return null;
  return <AdBanner adData={slot} />;
}

const adStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e0e0e0',
    marginVertical: vs(8),
    paddingVertical: vs(6),
  },
  label:    { fontSize: ms(9), color: '#bbb', letterSpacing: 1, textTransform: 'uppercase', marginBottom: vs(4) },
  slot:     { backgroundColor: '#efefef', borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed', borderRadius: s(6), justifyContent: 'center', alignItems: 'center', gap: vs(4) },
  slotText: { fontSize: ms(16), fontWeight: '800', color: '#ccc', letterSpacing: 2 },
  slotUnit: { fontSize: ms(9), color: '#bbb', paddingHorizontal: s(8), textAlign: 'center' },
  slotSize: { fontSize: ms(9), color: '#ccc' },
});