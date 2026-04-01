import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Share,
  FlatList,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CDNApi } from '../config/api';
import { COLORS, FONTS, NewsCard } from '../utils/constants';
import { s, vs, ms } from '../utils/scaling';
import { Comment } from '../assets/svg/Icons';
import CommentsModal from '../components/CommentsModal';

// --- Palette ------------------------------------------------------------------
const PALETTE = {
  primary: '#096dd2',
  grey100: '#F9FAFB',
  grey200: '#F4F6F8',
  grey300: '#E5E7EB',
  grey400: '#D1D5DB',
  grey500: '#9CA3AF',
  grey600: '#6B7280',
  grey700: '#4B5563',
  grey800: '#374151',
  white: '#FFFFFF',
  textDark: '#111111',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const AUTO_SLIDE_INTERVAL = 4000;

export default function PhotoDetailsScreen({ route, navigation }) {
  const {
    screenTitle = 'போட்டோ',
    photoItem,
    apiEndpoint,
    isFromAllTab = false,
    // ↓ These come from deep link: /photo/81/481602
    catid,
    eventid,
  } = route.params || {};

  // Map catid → correct API endpoint
  const resolvedEndpoint = apiEndpoint || (catid ? `/photoitem?cat=${catid}` : '/photodata');

  // Build photoItem from deep link if not passed directly
  const resolvedPhotoItem = photoItem || (eventid ? { eventid: Number(eventid) } : null);

  const [photoData, setPhotoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCommentsModalVisible, setIsCommentsModalVisible] = useState(false);

  const flatListRef = useRef(null);
  const autoSlideTimer = useRef(null);
  const currentIndexRef = useRef(0);
  const totalRef = useRef(0);

// ─── Fetch ────────────────────────────────────────────────────────
const fetchPhotoData = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);

    const endpoint = resolvedEndpoint || '/photodetails?cat=81';
    const response = await CDNApi.get(endpoint);
    const data = response?.data || [];

    let photos = [];

    // ✅ PRIMARY: /photodetails?cat=5001 → newlist.data (filter out ad objects)
    if (Array.isArray(data?.newlist?.data) && data.newlist.data.length > 0) {
      photos = data.newlist.data.filter(item => !item.type);
    }

    // ✅ FALLBACK: pugaippada album — newlist.data is EMPTY but morephotos.data has the data
    if (!photos.length && Array.isArray(data?.morephotos?.data) && data.morephotos.data.length > 0) {
      photos = data.morephotos.data.filter(item => !item.type);
    }

    // /photodata nested keys
    if (!photos.length && data?.indraiyephoto?.data?.length > 0)
      photos = data.indraiyephoto.data;
    else if (!photos.length && data?.pogaimadam?.data?.length > 0)
      photos = data.pogaimadam.data;
    else if (!photos.length && data?.cartoons?.data?.length > 0)
      photos = data.cartoons.data;
    else if (!photos.length && data?.nri?.data?.length > 0)
      photos = data.nri.data;
    else if (!photos.length && Array.isArray(data?.data) && data.data.length > 0)
      photos = data.data.filter(item => !item.type);
    else if (!photos.length && Array.isArray(data))
      photos = data;

    totalRef.current = photos.length;
    setPhotoData(photos);

    if (resolvedPhotoItem && photos.length > 0) {
      const idx = photos.findIndex(p =>
        (p.eventid && p.eventid === resolvedPhotoItem.eventid) ||
        (p.id && p.id === resolvedPhotoItem.id)
      );
      const targetIdx = idx !== -1 ? idx : 0;
      currentIndexRef.current = targetIdx;
      setCurrentIndex(targetIdx);
      if (targetIdx > 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index: targetIdx, animated: false });
        }, 300);
      }
    }
  } catch (err) {
    console.error('[PhotoDetailsScreen] fetch error:', err?.message);
    setError('புகைப்படங்களை ஏற்ற முடியவில்லை');
  } finally {
    setLoading(false);
  }
}, [resolvedPhotoItem, resolvedEndpoint]);

  useEffect(() => {
    fetchPhotoData();
  }, [fetchPhotoData]);

  // ─── Auto-slide ───────────────────────────────────────────────────
  const startAutoSlide = useCallback(() => {
    if (autoSlideTimer.current) clearInterval(autoSlideTimer.current);
    autoSlideTimer.current = setInterval(() => {
      const total = totalRef.current;
      if (total < 2) return;
      const next = (currentIndexRef.current + 1) % total;
      currentIndexRef.current = next;
      setCurrentIndex(next);
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
    }, AUTO_SLIDE_INTERVAL);
  }, []);

  useEffect(() => {
    if (photoData.length > 1) {
      startAutoSlide();
    }
    return () => {
      if (autoSlideTimer.current) clearInterval(autoSlideTimer.current);
    };
  }, [photoData.length, startAutoSlide]);

  // ─── Navigation helpers ───────────────────────────────────────────────────
  const goToIndex = (index) => {
    currentIndexRef.current = index;
    setCurrentIndex(index);
    flatListRef.current?.scrollToIndex({ index, animated: true });
    startAutoSlide();
  };

  const handleManualNext = () => {
    const next = (currentIndexRef.current + 1) % totalRef.current;
    goToIndex(next);
  };

  const handleManualPrev = () => {
    const prev = (currentIndexRef.current - 1 + totalRef.current) % totalRef.current;
    goToIndex(prev);
  };

  const handleMomentumScrollEnd = (e) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (index !== currentIndexRef.current) {
      currentIndexRef.current = index;
      setCurrentIndex(index);
      startAutoSlide();
    }
  };

 

  // ─── Data helpers ─────────────────────────────────────────────────────────
  const getImageUrl = (photo) =>
    photo?.largeimages ||
    photo?.image ||
    photo?.images ||
    photo?.thumbnail ||
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg';

  const getPhotoDate = (photo) =>
    photo?.standarddate || photo?.date || '';

  const getFootnote = (photo) => photo?.footnote || '';

  const getCategory = (photo) => photo?.maincat || '';

  // Generate deep links from your share buttons using reacturl
const getShareUrl = (photo) => {
  const path = photo?.reacturl || photo?.slug || '';
  return path
    ? `https://www.dinamalar.com${path}`
    : 'https://www.dinamalar.com';
};

  // ─── Render carousel item ─────────────────────────────────────────────────
  const renderItem = ({ item: photo }) => (
    <View style={styles.slideContainer}>
      <Image
        source={{ uri: getImageUrl(photo) }}
        style={styles.slideImage}
        resizeMode="cover"
      />

      {/* Dark overlay at bottom */}
      <View style={styles.imageOverlay} />

      {/* Counter  e.g. 3 / 10 */}
      <View style={styles.counterBadge}>
        <Text style={styles.counterText}>
          {currentIndex + 1} / {totalRef.current}
        </Text>
      </View>

      {/* Prev arrow */}
      {totalRef.current > 1 && (
        <TouchableOpacity style={styles.arrowLeft} onPress={handleManualPrev} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={s(22)} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Next arrow */}
      {totalRef.current > 1 && (
        <TouchableOpacity style={styles.arrowRight} onPress={handleManualNext} activeOpacity={0.8}>
          <Ionicons name="chevron-forward" size={s(22)} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );

  // ─── Loading ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.container}>
        <Header navigation={navigation} title={screenTitle} />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>ஏற்றுகிறது...</Text>
        </View>
      </View>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.container}>
        <Header navigation={navigation} title={screenTitle} />
        <View style={styles.centerBox}>
          <Ionicons name="alert-circle-outline" size={s(48)} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchPhotoData}>
            <Text style={styles.retryText}>மீண்டும் முயற்சி</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentPhoto = photoData[currentIndex] || {};

  // ─── Main render ──────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Header navigation={navigation} title={screenTitle} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Carousel ── */}
        {photoData.length > 0 && (
          <View style={styles.carouselWrapper}>
            <FlatList
              ref={flatListRef}
              data={photoData}
              keyExtractor={(item, idx) => String(item?.eventid || item?.id || idx)}
              renderItem={renderItem}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleMomentumScrollEnd}
              scrollEventThrottle={16}
              decelerationRate="fast"
              getItemLayout={(_, index) => ({
                length: SCREEN_WIDTH,
                offset: SCREEN_WIDTH * index,
                index,
              })}
            />

            {/* Dot indicators */}
            {photoData.length > 1 && (
              <View style={styles.dotsRow}>
                {photoData.slice(0, 20).map((_, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => goToIndex(i)}
                    style={[styles.dot, i === currentIndex ? styles.dotActive : styles.dotInactive]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Info card ── */}
        <View style={styles.infoCard}>


          {/* Caption / Footnote */}
          {getFootnote(currentPhoto) ? (
            <Text style={styles.footnoteText}>{getFootnote(currentPhoto)}</Text>
          ) : null}


          {/* Date + Comment + Share */}
          <View style={styles.metaRow}>
            <View style={styles.metaLeft}>
              <Ionicons name="calendar-outline" size={s(15)} color={PALETTE.grey500} />
              <Text style={styles.dateText}>{getPhotoDate(currentPhoto)}</Text>
            </View>

            <View style={styles.metaRight}>
              {/* Show Comment icon only if NOT from All tab */}
              {!isFromAllTab && (
                <TouchableOpacity 
                  style={styles.metaBtn}
                  onPress={() => setIsCommentsModalVisible(true)}
                >
                  <Comment size={s(16)} color={PALETTE.grey500} />
                </TouchableOpacity>
              )}
            </View>

          </View>
          {/* Category pill */}
          {getCategory(currentPhoto) ? (
            <View style={NewsCard.catPill}>
              <Text style={NewsCard.catText}>{getCategory(currentPhoto)}</Text>
            </View>
          ) : null}
          {/* Share buttons row */}
          <View style={styles.shareRow}>
            {[
              {
                icon: 'logo-facebook',
                bg: '#1877F2',
                onPress: () => Linking.openURL(
                  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl(currentPhoto))}`
                ),
              },
              {
                icon: 'logo-twitter',
                bg: '#000000',
                onPress: () => Linking.openURL(
                  `https://twitter.com/intent/tweet?url=${encodeURIComponent(getShareUrl(currentPhoto))}`
                ),
              },
              {
                icon: 'logo-whatsapp',
                bg: '#25D366',
                onPress: () => Linking.openURL(
                  `whatsapp://send?text=${encodeURIComponent(`${getFootnote(currentPhoto)}\n${getShareUrl(currentPhoto)}`)}`
                ),
              },
              {
                icon: 'paper-plane-outline',
                bg: '#2AABEE',
                onPress: () => Linking.openURL(
                  `https://t.me/share/url?url=${encodeURIComponent(getShareUrl(currentPhoto))}`
                ),
              },
              {
                icon: 'copy-outline',
                bg: PALETTE.grey400,
                onPress: async () => {
                  try {
                    await Share.share({ message: `${getFootnote(currentPhoto)}\n${getShareUrl(currentPhoto)}` });
                  } catch (_) { }
                },
              },
            ].map((btn, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.shareCircle, { backgroundColor: btn.bg }]}
                onPress={btn.onPress}
                activeOpacity={0.8}
              >
                <Ionicons name={btn.icon} size={s(15)} color="#fff" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Thumbnail strip ── */}
        {/* {photoData.length > 1 && (
          <View style={styles.thumbSection}>
            <Text style={styles.thumbSectionTitle}>அனைத்து படங்கள்</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.thumbRow}>
                {photoData.map((photo, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => goToIndex(idx)}
                    activeOpacity={0.8}
                    style={[styles.thumb, idx === currentIndex && styles.thumbActive]}
                  >
                    <Image
                      source={{ uri: getImageUrl(photo) }}
                      style={styles.thumbImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )} */}

        {/* Comments Modal */}
        <CommentsModal
          visible={isCommentsModalVisible}
          onClose={() => setIsCommentsModalVisible(false)}
          photoId={currentPhoto?.eventid || currentPhoto?.id}
          photoTitle={getFootnote(currentPhoto) || currentPhoto?.title || ''}
        />
      </ScrollView>
    </View>
  );
}

// ─── Header ───────────────────────────────────────────────────────────
function Header({ navigation, title }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={s(24)} color={PALETTE.grey800} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      {/* <View style={styles.headerSpacer} /> */}
      <TouchableOpacity onPress={() =>navigation.goBack()} style={styles.commentsBtn}>
        <Ionicons name="close" size={s(24)} color={PALETTE.grey800} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    paddingTop: vs(8),
    paddingBottom: vs(8),
    borderTopWidth: 1,
    borderTopColor: PALETTE.grey200,
    marginTop: vs(4),
    justifyContent: "center"
  },
  shareCircle: {
    width: s(34),
    height: s(34),
    // borderRadius: s(17),
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: { height: vs(8), backgroundColor: PALETTE.grey200 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
     backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingTop:Platform.OS === 'ios' ? vs(50) : vs(30),
  },
  backBtn: {
    padding: s(8),
    // borderRadius: s(20),
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    flex: 1,
    fontSize: ms(18),
    fontFamily: FONTS.muktaMalar?.semibold || FONTS.bold,
    color: PALETTE.grey800,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: s(16),
  },
  headerSpacer: {
    width: s(40),
  },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: vs(30) },

  // Center (loader/error)
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: vs(16),
    padding: s(32),
  },
  loaderText: {
    fontSize: ms(14),
    color: PALETTE.grey500,
    fontFamily: FONTS.muktaMalar.regular,
  },
  errorText: {
    fontSize: ms(16),
    color: '#ff6b6b',
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
    fontWeight: '600',
    fontFamily: FONTS.muktaMalar.medium,
  },

  // Carousel
  carouselWrapper: {
    width: SCREEN_WIDTH,
    backgroundColor: '#000',
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    height: vs(260),
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: vs(70),
    // backgroundColor: 'rgba(0,0,0,0.3)',
  },
  counterBadge: {
    position: 'absolute',
    top: s(10),
    right: s(10),
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: s(12),
    paddingHorizontal: s(10),
    paddingVertical: vs(3),
  },
  counterText: {
    color: '#fff',
    fontSize: ms(20),
    fontFamily: FONTS.muktaMalar.regular,
  },
  arrowLeft: {
    position: 'absolute',
    left: s(8),
    top: vs(120),
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowRight: {
    position: 'absolute',
    right: s(8),
    top: vs(120),
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: vs(8),
    backgroundColor: '#111',
    flexWrap: 'wrap',
    gap: s(4),
  },
  dot: {
    marginHorizontal: s(2),
    borderRadius: s(4),
  },
  dotActive: {
    width: s(18),
    height: s(6),
    backgroundColor: PALETTE.primary,
    borderRadius: s(3),
  },
  dotInactive: {
    width: s(18),
    height: s(6),
    backgroundColor: PALETTE.grey400,
    borderRadius: s(3),
  },

  // Info card
  infoCard: {
    backgroundColor: '#fff',
    marginHorizontal: s(12),
    padding: s(12),
    borderRadius: s(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: vs(2) },
    shadowOpacity: 0.1,
    shadowRadius: s(4),
    marginTop: vs(-4),
  },
  footnoteText: {
    fontSize: ms(14),
    color: PALETTE.textDark,
    fontFamily: FONTS.muktaMalar.regular,
    lineHeight: vs(20),
    marginBottom: vs(8),
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: vs(4),
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
  },
  dateText: {
    fontSize: ms(12),
    color: PALETTE.grey500,
    fontFamily: FONTS.muktaMalar.regular,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  metaBtn: {
    padding: s(6),
    borderRadius: s(12),
    backgroundColor: PALETTE.grey100,
  },

  // Thumbnail strip (commented out)
  thumbSection: {
    marginTop: vs(12),
  },
  thumbSectionTitle: {
    fontSize: ms(14),
    fontFamily: FONTS.muktaMalar.medium,
    color: PALETTE.textDark,
    marginBottom: vs(8),
    paddingHorizontal: s(12),
  },
  thumbRow: {
    flexDirection: 'row',
    gap: s(8),
  },
  thumb: {
    width: s(60),
    height: s(60),
    borderRadius: s(4),
    backgroundColor: PALETTE.grey200,
  },
  thumbActive: {
    borderWidth: 2,
    borderColor: PALETTE.primary,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
    borderRadius: s(4),
  },
});
