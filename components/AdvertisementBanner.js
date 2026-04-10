import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { ms, s, vs } from '../utils/scaling';

function AdvertisementBanner({ width = 280, height = 200, showLabel = true, htmlContent = null }) {
  // If HTML content is provided, use WebView; otherwise use placeholder
  if (htmlContent) {
    return (
      <View style={styles.container}>
        <WebView
          source={{ html: htmlContent, baseUrl: 'https://www.dinamalar.com' }}
          style={{ width: s(width), height: vs(height) }}
          scrollEnabled={false}
          nestedScrollEnabled={false}
        />
        
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.adBox, { width: s(width), height: vs(height) }]}>
        {showLabel && (
          <Text style={styles.adText}>
            Advertisement
          </Text>
        )}
         <Text style={styles.labelText}>
          Advertisement
        </Text>
      </View>
      
       
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: vs(12),
  },
  adBox: {
    backgroundColor: '#d0cfcf',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
   },
  adText: {
    fontSize: ms(12),
    color: '#666',
    textAlign: 'center',
  },
  dimensionsText: {
    fontSize: ms(10),
    color: '#999',
    textAlign: 'center',
    marginTop: vs(4),
  },
  labelText: {
    fontSize: ms(12),
    color: '#666',
    textAlign: 'center',
    marginTop: vs(8),
  },
});

export default AdvertisementBanner;
