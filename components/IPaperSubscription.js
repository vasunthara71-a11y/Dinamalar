import React, { useState } from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Linking, Text } from 'react-native';
import { s, vs } from '../utils/scaling';

const IPaperSubscription = () => {
  const [imageError, setImageError] = useState(false);

  const handlePress = () => {
    Linking.openURL('https://subscription.dinamalar.com/?device=nativeweb-db');
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={handlePress}
        activeOpacity={0.8}
        style={styles.touchableContainer}
      >
        {!imageError ? (
          <Image
            source={{ uri: 'https://stat.dinamalar.com/new/2022/images/ipaper/ipaper-combo-web-detail-new.gif' }}
            style={styles.ipaperImage}
            resizeMode="contain"
            onError={handleImageError}
          />
        ) : (
          <View style={styles.fallbackContainer}>
            <Text style={styles.fallbackText}>தினமலர் iPaper சப்ஸ்கிரிப்ஷன்</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default IPaperSubscription;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: vs(10),
    paddingHorizontal: s(16),
    // backgroundColor: '#f5f5f5', // Temporary background for debugging
    minHeight: vs(50), // Ensure minimum height
  },
  touchableContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ipaperImage: {
    width: '100%',
    height: vs(50),
    minHeight: vs(60), // Minimum height for the image
    maxWidth: s(568),
    // backgroundColor: '#e0e0e0', // Temporary background for debugging
  },
  fallbackContainer: {
    width: '100%',
    height: vs(50),
    minHeight: vs(60),
    maxWidth: s(568),
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: s(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontSize: s(14),
    color: '#333',
    textAlign: 'center',
    fontFamily: 'System',
  },
});
