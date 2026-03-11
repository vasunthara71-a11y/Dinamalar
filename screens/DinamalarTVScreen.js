import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl, StyleSheet,
  StatusBar, Dimensions, ScrollView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ms, mvs } from 'react-native-size-matters';
import { COLORS } from '../utils/constants';

const { width } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (width - 28) / 2;
const GRID_THUMB_HEIGHT = GRID_ITEM_WIDTH * 0.6;

// New API endpoint
const API_BASE = 'https://api-st-cdn.dinamalar.com/videomain';

// ─── Category Color Map ────────────────────────────────
const CAT_COLORS = {
  'அரசியல்': '#6a1b9a',
  'பொது': '#1565c0',
  'செய்திச்சுருக்கம்': COLORS.primary,
  'ஆன்மிகம்': '#e65100',
  'மாவட்ட செய்திகள்': '#2e7d32',
  'சினிமா வீடியோ': '#ad1457',
  'விளையாட்டு': '#00695c',
  'Live': COLORS.primary,
};
const getCatColor = (title) => CAT_COLORS[title] || '#555';

// ─── Featured (Latest) Video Banner ───────────────────
function FeaturedVideo({ item, onPress }) {
  if (!item) return null;
  const title = item.videotitle || '';
  const image = item.images;
  const catTitle = item.ctitle || item.category || '';
  const catColor = getCatColor(catTitle);
  const timeAgo = item.ago || item.standarddate || '';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      {/* ── Image Container ── */}
      <View style={styles.featured}>
        {image ? (
          <Image source={{ uri: image }} style={styles.featuredImage} resizeMode="cover" />
        ) : (
          <View style={[styles.featuredImage, styles.featuredPlaceholder]}>
            <Ionicons name="tv-outline" size={48} color="rgba(255,255,255,0.4)" />
          </View>
        )}

        {/* Play button */}
        <View style={styles.featuredPlayBtn}>
          <Ionicons name="play" size={28} color="#fff" />
        </View>
      </View>

      {/* ── Info Below Image ── */}
      <View style={styles.featuredInfo}>
        {catTitle !== '' && (
          <View style={[styles.featuredCatBadge, { backgroundColor: '#dc2626' }]}>
            <Text style={styles.featuredCatText}>{catTitle}</Text>
          </View>
        )}
        <Text style={styles.featuredTitle} numberOfLines={2}>{title}</Text>
        <View style={styles.featuredMeta}>
          <Ionicons name="time-outline" size={12} color="#888" />
          <Text style={styles.featuredMetaText}> {timeAgo}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Video Grid Card ───────────────────────────────────
function VideoCard({ item, onPress }) {
  const image = item.images;
  const title = item.videotitle || '';
  const duration = item.duration || '';
  const catTitle = item.ctitle || '';
  const catColor = getCatColor(catTitle);
  const timeAgo = item.ago || '';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {/* Thumbnail */}
      <View style={styles.thumbWrapper}>
        {image ? (
          <Image source={{ uri: image }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Ionicons name="play-circle-outline" size={34} color="#bbb" />
          </View>
        )}

        {/* Dim overlay + play icon */}
        <View style={styles.thumbOverlay}>
          <View style={styles.playCircle}>
            <Ionicons name="play" size={13} color="#fff" />
          </View>
        </View>

        {/* Duration bottom-right */}
        {duration !== '' && (
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{duration}</Text>
          </View>
        )}

        {/* Category top-left */}
        {catTitle !== '' && (
          <View style={[styles.cardCatBadge, { backgroundColor: catColor }]}>
            <Text style={styles.cardCatText} numberOfLines={1}>{catTitle}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>
        <View style={styles.cardMeta}>
          <Ionicons name="time-outline" size={10} color="#aaa" />
          <Text style={styles.cardMetaText}> {timeAgo}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Skeleton Card ─────────────────────────────────────
function SkeletonCard() {
  return (
    <View style={[styles.card, { opacity: 0.45 }]}>
      <View style={[styles.thumb, { backgroundColor: '#ddd' }]} />
      <View style={styles.cardInfo}>
        <View style={{ height: 13, backgroundColor: '#ddd', borderRadius: 4, marginBottom: 6 }} />
        <View style={{ height: 13, backgroundColor: '#ddd', borderRadius: 4, width: '70%', marginBottom: 6 }} />
        <View style={{ height: 10, backgroundColor: '#ddd', borderRadius: 4, width: '40%' }} />
      </View>
    </View>
  );
}

// ─── Section Header ────────────────────────────────────
function SectionHeader({ title }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────
export default function DinamalarTVScreen() {
  const navigation = useNavigation();

  const [videos, setVideos] = useState([]);
  const [latestVideo, setLatestVideo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subscriberCount, setSubscriberCount] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState('');

  const fetchVideos = useCallback(async (pageNum = 1, isRefresh = false, catId = '') => {
    try {
      if (pageNum === 1) isRefresh ? setRefreshing(true) : setLoading(true);
      else setLoadingMore(true);

      const endpoint = catId
        ? `${API_BASE}?cat=${catId}&page=${pageNum}`
        : `${API_BASE}?page=${pageNum}`;

      const response = await fetch(endpoint);
      const data = await response.json();

      // Set one-time metadata
      if (pageNum === 1) {
        if (data?.videomix?.data?.[0]) setLatestVideo(data.videomix.data[0]);
        if (data?.subscribercount) setSubscriberCount(data.subscribercount);
        if (data?.category && Array.isArray(data.category)) {
          setCategories(data.category);
        }
      }

      const videoData = data?.videomix?.data || [];

      if (videoData.length === 0) {
        setHasMore(false);
      } else {
        setVideos(prev => pageNum === 1 ? videoData : [...prev, ...videoData]);
        setPage(pageNum);
        setHasMore(!!data?.videomix?.next_page_url);
      }
    } catch (error) {
      console.error('DinamalarTV fetch error:', error.message);
      setVideos([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos(1, false, activeCategory);
  }, [fetchVideos, activeCategory]);

  const onRefresh = () => {
    setHasMore(true);
    fetchVideos(1, true, activeCategory);
  };

  const onEndReached = () => {
    if (!loadingMore && hasMore && !loading) {
      fetchVideos(page + 1, false, activeCategory);
    }
  };

  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    setVideos([]);
    setPage(1);
    setHasMore(true);
  };

  const goToVideo = (item) => {
    navigation.navigate('VideoDetailsScreen', {
      videoId: item.videoid || item.id,
      videoItem: item,
    });
  };

  const goToFeatured = () => {
    if (latestVideo) {
      navigation.navigate('VideoDetailsScreen', {
        videoId: latestVideo.videoid || latestVideo.id,
        videoItem: latestVideo,
      });
    }
  };

const tabs = (categories || []).map(tab =>
  tab.title === 'ALL' ? { ...tab, title: 'All' } : tab
);

  const renderHeader = () => (
    <>
      {/* Featured latest video */}
      <FeaturedVideo item={latestVideo} onPress={goToFeatured} />

      {/* Subscriber count strip */}
      {subscriberCount !== '' && (
        <View style={styles.subCountStrip}>
          <Ionicons name="logo-youtube" size={16} color="#ff0000" />
          <Text style={styles.subCountText}>{subscriberCount} சந்தாதாரர்கள்</Text>
        </View>
      )}

      <SectionHeader title="சமீபத்திய வீடியோக்கள்" />
    </>
  );

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#COLORS.primary" />
          <Text style={styles.footerText}>ஏற்றுகிறது...</Text>
        </View>
      );
    }
    return <View style={{ height: 24 }} />;
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#COLORS.primary" barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={COLORS.text}/>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          {/* TV Icon + Title */}
          <View style={styles.headerTitleRow}>
            {/* <Ionicons name="tv" size={18} color="#fff" style={{ marginRight: 6 }} /> */}
            <Text style={styles.headerTitle}>தினமலர் TV</Text>
          </View>
          {/* <Text style={styles.headerSub}>Dinamalar Television</Text> */}
        </View>

        {/* YouTube subscribe button style */}
        {/* <View style={styles.ytBadge}>
          <Ionicons name="logo-youtube" size={14} color="#ff0000" />
          <Text style={styles.ytBadgeText}>Subscribe</Text>
        </View> */}
      </View>

      {/* ── Category Tab Strip ── */}
      <View style={styles.tabBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContent}
        >
          {tabs.map((tab) => {
            const isActive = activeCategory === tab.value;
            return (
              <TouchableOpacity
                key={`tab_${tab.value || 'all'}`}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => handleCategoryChange(tab.value)}
              >
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Content ── */}
      {loading ? (
        <ScrollView contentContainerStyle={styles.gridContent} scrollEnabled={false}>
          <View style={styles.skeletonFeatured} />
          <View style={styles.gridRow}>
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={`sk_${i}`} />)}
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item, index) => `video_${item.videoid || index}_${index}`}
          numColumns={2}
          renderItem={({ item }) => (
            <VideoCard item={item} onPress={() => goToVideo(item)} />
          )}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="tv-outline" size={60} color="#ddd" />
              <Text style={styles.emptyText}>வீடியோக்கள் இல்லை</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
                <Text style={styles.retryText}>மீண்டும் முயற்சி</Text>
              </TouchableOpacity>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.columnWrapper}
        />
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  // ── Header - Modern Website Style
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? ms(50) : ms(54),
    paddingBottom: ms(14),
    paddingHorizontal: ms(16),
    backgroundColor: '#ffffff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: ms(2) },
    shadowOpacity: 0.1,
    shadowRadius: ms(8),
  },
  headerCenter: { 
    flex: 1,
    marginHorizontal: ms(16),
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { 
    color: '#1a1a1a',
    fontSize: ms(20),
    fontWeight: '700',
    letterSpacing: -0.5,
  },

  // ── Tab Strip - Modern Design
  tabBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    elevation: 2,
  },
  tabContent: { 
    paddingHorizontal: ms(16), 
    paddingVertical: ms(12), 
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    paddingHorizontal: ms(16),
    paddingVertical: ms(8),
    borderRadius: ms(24),
    marginRight: ms(8),
    backgroundColor: '#f8f9fa',
  },
  tabItemActive: { 
    backgroundColor: '#dc2626',
  },
  tabLabel: { 
    fontSize: ms(14), 
    color: '#6c757d', 
    fontWeight: '500',
  },
  tabLabelActive: { 
    color: '#ffffff', 
    fontWeight: '600',
  },

  // ── Featured Banner - Website Style
  featured: {
    width: '100%',
    height: width * 0.5,
    backgroundColor: '#000000',
    borderRadius: ms(12),
    overflow: 'hidden',
    marginBottom: ms(16),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: ms(4) },
    shadowOpacity: 0.15,
    shadowRadius: ms(8),
  },
  featuredImage: { 
    width: '100%', 
    height: '100%' 
  },
  featuredPlaceholder: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredOverlay: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: '100%',
    backgroundColor: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
  },
  featuredPlayBtn: {
    position: 'absolute',
    top: '50%', 
    left: '50%',
    marginTop: ms(-32), 
    marginLeft: ms(-32),
    width: ms(64), 
    height: ms(64), 
    borderRadius: ms(32),
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  featuredInfo: {
    backgroundColor: '#ffffff',
    padding: ms(16),
  },
  featuredCatBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: ms(8),
    paddingVertical: ms(4),
    borderRadius: ms(4),
    marginBottom: ms(8),
    backgroundColor: '#dc2626',
  },
  featuredCatText: {
    color: '#ffffff',
    fontSize: ms(11),
    fontWeight: '600',
  },
  featuredTitle: {
    color: '#1a1a1a',
    fontSize: ms(16),
    fontWeight: '700',
    lineHeight: ms(22),
    marginBottom: ms(8),
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredMetaText: {
    color: '#6c757d',
    fontSize: ms(12),
  },

  // ── Subscriber Strip - Modern
  subCountStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: ms(16),
    paddingVertical: ms(12),
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  subCountText: { 
    fontSize: ms(14), 
    color: '#1a1a1a', 
    fontWeight: '600',
    marginLeft: ms(8),
  },

  // ── Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(16),
    paddingTop: ms(16),
    paddingBottom: ms(8),
    backgroundColor: '#ffffff',
  },
  sectionAccent: {
    width: ms(4), 
    height: ms(20), 
    borderRadius: ms(2),
    backgroundColor: '#dc2626', 
    marginRight: ms(8),
  },
  sectionTitle: {
    fontSize: ms(18),
    fontWeight: '700',
    color: '#1a1a1a',
  },

  // ── Grid
  gridContent: { 
    paddingHorizontal: ms(12), 
    paddingBottom: ms(24),
    backgroundColor: '#f8f9fa',
  },
  columnWrapper: { 
    paddingHorizontal: ms(4), 
    gap: ms(8), 
    marginBottom: ms(8) 
  },

  // ── Video Card - Modern Design
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: ms(12),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: ms(2) },
    shadowOpacity: 0.08,
    shadowRadius: ms(6),
    marginBottom: ms(8),
  },
  thumbWrapper: { 
    position: 'relative' 
  },
  thumb: {
    width: '100%',
    height: GRID_THUMB_HEIGHT,
    backgroundColor: '#f8f9fa',
  },
  thumbPlaceholder: { 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#e9ecef',
  },
  thumbOverlay: {
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0,
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  playCircle: {
    width: ms(40), 
    height: ms(40), 
    borderRadius: ms(20),
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center', 
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute', 
    bottom: ms(8), 
    right: ms(8),
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: ms(6),
    paddingVertical: ms(2),
    borderRadius: ms(4),
  },
  durationText: { 
    color: '#ffffff', 
    fontSize: ms(10), 
    fontWeight: '600',
  },
  cardInfo: { 
    padding: ms(12) 
  },
  cardTitle: {
    fontSize: ms(13),
    fontWeight: '600',
    color: '#1a1a1a', 
    lineHeight: ms(18),
    marginBottom: ms(6),
  },
  cardMeta: { 
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardMetaText: {
    fontSize: ms(11),
    color: '#6c757d',
  },

  // ── Skeleton
  skeletonFeatured: {
    width: '100%', 
    height: width * 0.5,
    backgroundColor: '#e9ecef',
    borderRadius: ms(12),
    marginBottom: ms(16),
  },
  gridRow: {
    flexDirection: 'row', 
    flexWrap: 'wrap',
    paddingHorizontal: ms(12),
    gap: ms(8),
  },

  // ── Footer & Empty
  footerLoader: {
    flexDirection: 'row', 
    justifyContent: 'center',
    alignItems: 'center', 
    paddingVertical: ms(20), 
    gap: ms(8),
  },
  footerText: { 
    fontSize: ms(14), 
    color: '#6c757d',
    fontWeight: '500',
  },
  emptyState: {
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center', 
    paddingVertical: ms(60),
    backgroundColor: '#f8f9fa',
  },
  emptyText: { 
    fontSize: ms(16), 
    color: '#6c757d',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: ms(16),
  },
  retryBtn: {
    backgroundColor: '#dc2626',
    paddingHorizontal: ms(24),
    paddingVertical: ms(12),
    borderRadius: ms(8),
  },
  retryText: { 
    color: '#ffffff', 
    fontSize: ms(14), 
    fontWeight: '600',
  },
});