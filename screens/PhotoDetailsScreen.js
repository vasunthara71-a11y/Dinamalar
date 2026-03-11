import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Linking,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { u38Api } from '../config/api';
import { COLORS, FONTS } from '../utils/constants';
import { s, vs, ms } from '../utils/scaling';
import TEXT_STYLES from '../utils/textStyles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PhotoDetailsScreen({ route, navigation }) {
  const { screenTitle = 'போட்டோ' } = route.params || {};
  
  const [photoData, setPhotoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPhotoData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await u38Api.get('/photodata');
      const data = response?.data || [];
      
      // Handle different data structures
      let photos = [];
      if (Array.isArray(data)) {
        photos = data;
      } else if (data?.data && Array.isArray(data.data)) {
        photos = data.data;
      } else if (data?.photodata && Array.isArray(data.photodata)) {
        photos = data.photodata;
      } else if (data?.photos && Array.isArray(data.photos)) {
        photos = data.photos;
      }
      
      setPhotoData(photos);
      console.log('[PhotoDetailsScreen] fetched photos:', photos.length);
    } catch (err) {
      console.error('[PhotoDetailsScreen] fetch error:', err?.message);
      setError('புகைப்படங்களை ஏற்ற முடியவில்லை');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotoData();
  }, [fetchPhotoData]);

  const handlePhotoPress = (photo) => {
    if (photo?.image || photo?.images || photo?.largeimages) {
      // Navigate to full screen image viewer or open in browser
      const imageUrl = photo.image || photo.images || photo.largeimages;
      if (imageUrl.startsWith('http')) {
        Linking.openURL(imageUrl);
      }
    }
  };

  const handleShare = async (photo) => {
    try {
      const title = photo?.title || photo?.caption || photo?.newstitle || 'புகைப்படம்';
      const imageUrl = photo?.image || photo?.images || photo?.largeimages || '';
      const message = `${title}\n${imageUrl}`;
      await Share.share({ message });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const getImageUrl = (photo) => {
    return photo?.image || photo?.images || photo?.largeimages || photo?.thumbnail || 
           'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';
  };

  const getPhotoTitle = (photo) => {
    return photo?.title || photo?.caption || photo?.newstitle || photo?.heading || 'புகைப்படம்';
  };

  const getPhotoDate = (photo) => {
    return photo?.date || photo?.standarddate || photo?.created_at || photo?.time || '';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={s(24)} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{screenTitle}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>ஏற்றுகிறது...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={s(24)} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{screenTitle}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={s(48)} color={COLORS.error || '#ff6b6b'} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchPhotoData}>
            <Text style={styles.retryText}>மீண்டும் முயற்சி</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={s(24)} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{screenTitle}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Photos Grid */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {photoData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={s(48)} color={COLORS.subtext} />
            <Text style={styles.emptyText}>புகைப்படங்கள் இல்லை</Text>
          </View>
        ) : (
          <View style={styles.photosGrid}>
            {photoData.map((photo, index) => (
              <View key={index} style={styles.photoCard}>
                <TouchableOpacity
                  style={styles.imageContainer}
                  onPress={() => handlePhotoPress(photo)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: getImageUrl(photo) }}
                    style={styles.photoImage}
                    resizeMode="cover"
                  />
                  <View style={styles.imageOverlay}>
                    <Ionicons name="expand-outline" size={s(20)} color="#fff" />
                  </View>
                </TouchableOpacity>
                
                <View style={styles.photoInfo}>
                  <Text style={styles.photoTitle} numberOfLines={2}>
                    {getPhotoTitle(photo)}
                  </Text>
                  
                  {getPhotoDate(photo) && (
                    <Text style={styles.photoDate}>
                      {getPhotoDate(photo)}
                    </Text>
                  )}
                  
                  <View style={styles.photoActions}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleShare(photo)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="share-outline" size={s(16)} color={COLORS.primary} />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handlePhotoPress(photo)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="eye-outline" size={s(16)} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(16),
    paddingVertical: vs(12),
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingTop: vs(16),
  },
  backBtn: {
    padding: s(8),
    borderRadius: s(20),
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    flex: 1,
    fontSize: ms(18),
    fontFamily: FONTS.semiBold || FONTS.bold,
    color: COLORS.text,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: s(16),
  },
  headerSpacer: {
    width: s(40),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: s(16),
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: vs(16),
  },
  loaderText: {
    fontSize: ms(14),
    color: COLORS.subtext,
    fontFamily: FONTS.regular,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: s(32),
    gap: vs(16),
  },
  errorText: {
    fontSize: ms(16),
    color: COLORS.error || '#ff6b6b',
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: s(20),
    paddingVertical: vs(10),
    backgroundColor: COLORS.primary,
    borderRadius: s(8),
  },
  retryText: {
    color: '#fff',
    fontSize: ms(14),
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: vs(60),
    gap: vs(16),
  },
  emptyText: {
    fontSize: ms(16),
    color: COLORS.subtext,
    fontFamily: FONTS.regular,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: s(12),
  },
  photoCard: {
    width: (SCREEN_WIDTH - s(48)) / 2, // 2 columns with spacing
    backgroundColor: '#fff',
    borderRadius: s(12),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: s(12),
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: vs(150),
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: s(8),
    right: s(8),
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: s(16),
    width: s(32),
    height: s(32),
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoInfo: {
    padding: s(12),
  },
  photoTitle: {
    fontSize: ms(14),
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: vs(4),
    lineHeight: ms(20),
  },
  photoDate: {
    fontSize: ms(12),
    color: COLORS.subtext,
    fontFamily: FONTS.regular,
    marginBottom: vs(8),
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: s(8),
  },
  actionBtn: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
