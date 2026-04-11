import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
 import { s, vs, ms } from '../utils/scaling';
import { FONTS } from '../utils/constants';

// ─────────────────────────────────────────────────────────────────────────────
// Rasi Card Component (list view)
// ─────────────────────────────────────────────────────────────────────────────
const RasiCard = ({ item, onPress }) => {
  const [imageError, setImageError] = useState(false);

  const imageUri =
    item.largeimages ||
    item.icon;
  const title = item.title || item.newstitle || '';
  const hasVideo = !!item.videopath || (item.video && item.video !== '0');

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <TouchableOpacity style={styles.wrap} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageWrap}>
        {imageError ? (
          <View style={styles.imagePlaceholder}>
            <Image
              source={{ uri: 'https://stat.dinamalar.com/new/2025/images/dinamalar-pavala-vizha-logo-day.png' }}
              style={styles.placeholderLogo}
              resizeMode="contain"
            />
          </View>
        ) : (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
            onError={handleImageError}
          />
        )}
        {hasVideo && (
          <View style={styles.playOverlay}>
            <View style={styles.playBtn}>
              <Ionicons name="play" size={s(14)} color="#fff" />
            </View>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: '#fff', alignItems: 'center', paddingVertical: vs(6), paddingHorizontal: s(10), borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  imageWrap: { width: '30%', height: vs(80), position: 'relative', overflow: 'hidden' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#f8f8f8', justifyContent: 'center', alignItems: 'center' },
  placeholderLogo: { width: '80%', height: '80%', resizeMode: 'contain' },
  playOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  playBtn: { width: s(28), height: s(28), borderRadius: s(14), backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', paddingLeft: s(2) },
  content: { flex: 1, paddingHorizontal: s(12) },
  title: { fontSize: ms(14), fontFamily: FONTS.muktaMalar.medium, color: '#1a1a1a', fontWeight: '700' },
});

export default RasiCard;
