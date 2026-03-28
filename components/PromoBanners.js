import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, FlatList, Dimensions, Linking } from 'react-native';
import { ms, s, vs } from '../utils/scaling';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function PromoBanners({ banners }) {
  if (!banners || banners.length === 0) return null;

  const handlePress = (item) => {
    let url = item.url || '';
    if (url && !url.startsWith('http')) {
      url = `https://www.dinamalar.com${url}`;
    }
    if (url) {
      Linking.openURL(url).catch(() => console.log('Failed to open banner URL'));
    }
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.bannerWrapper} aria-label="promo-banner">
      <TouchableOpacity
        onPress={() => handlePress(item)}
        activeOpacity={0.92}
        style={styles.bannerLink}
        accessibilityLabel="promo-banner"
      >
        <Image
          source={{ uri: item.image }}
          style={styles.bannerImage}
          resizeMode="cover"
          accessibilityLabel={item.altname || 'promo-banner'}
        />
      </TouchableOpacity>
    </View>
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
