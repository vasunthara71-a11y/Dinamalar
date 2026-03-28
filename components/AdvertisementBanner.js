import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ms, s, vs } from '../utils/scaling';

function AdvertisementBanner({ width = 200, height = 250, showLabel = true }) {
  return (
    <View style={styles.container}>
      <View style={[styles.adBox, { width: s(width), height: vs(height) }]}>
        {showLabel && (
          <Text style={styles.adText}>
            Advertisement
          </Text>
        )}
        {/* <Text style={styles.dimensionsText}>
          {width}x{height}
        </Text> */}
      </View>
      {/* {showLabel && (
        <Text style={styles.labelText}>
          Advertisement
        </Text>
      )} */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: vs(12),
  },
  adBox: {
    backgroundColor: '#f0f0f0',
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
