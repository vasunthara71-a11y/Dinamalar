import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, FlatList, Dimensions, Linking } from 'react-native';
import { ms, s, vs } from '../utils/scaling';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Banner Item Component ─────────────────────────────────────────────────────
function BannerItem({ item, index }) {
  const [imageError, setImageError] = useState(false);

  const handlePress = (bannerItem) => {
    let url = bannerItem.url || '';
    if (url && !url.startsWith('http')) {
      url = `https://www.dinamalar.com${url}`;
    }
    if (url) {
      Linking.openURL(url).catch(() => console.log('Failed to open banner URL'));
    }
  };

  return (
    <View style={styles.bannerWrapper} aria-label="promo-banner">
      <TouchableOpacity
        onPress={() => handlePress(item)}
        activeOpacity={0.92}
        style={styles.bannerLink}
        accessibilityLabel="promo-banner"
      >
        {imageError || !item.image ? (
          <View style={[styles.bannerImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }]}>
            <Image
              source={{ uri: 'https://stat.dinamalar.com/new/2025/images/dinamalar-pavala-vizha-logo-day.png' }}
              style={{ width: s(120), height: s(40), resizeMode: 'contain' }}
            />
          </View>
        ) : (
          <Image
            source={{ uri: item.image }}
            style={styles.bannerImage}
            resizeMode="cover"
            accessibilityLabel={item.altname || 'promo-banner'}
            onError={() => setImageError(true)}
          />
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Main PromoBanners Component ─────────────────────────────────────────────
function PromoBanners({ banners }) {
  if (!banners || banners.length === 0) return null;

  const renderItem = ({ item, index }) => (
    <BannerItem item={item} index={index} />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={banners}
        renderItem={renderItem}
        keyExtractor={(item, i) => `promo-${i}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    // marginBottom: vs(8),
  },
  listContainer: {
    // paddingVertical: vs(8),
  },
  bannerWrapper: {
    marginBottom: vs(5),
    paddingHorizontal:s(12)
  },
  bannerLink: {
    width: '100%',
    // borderRadius: s(8),
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: vs(80),
    // borderRadius: s(8),
  },
});

export default PromoBanners;
