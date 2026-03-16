import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RenderHtml from 'react-native-render-html';
import AppHeaderComponent from '../components/AppHeaderComponent';
import TopMenuStrip from '../components/TopMenuStrip';
import CommentsModal from '../components/CommentsModal';
import { ms, s, vs } from '../utils/scaling';
import { CDNApi, API_ENDPOINTS } from '../config/api';
import { FONTS } from '../utils/constants';
import { useFontSize } from '../context/FontSizeContext';

// ─── Palette ────────────────────────────────────────────────────────────────────
const PALETTE = {
  grey100: '#F9FAFB',
  grey200: '#F4F6F8',
  grey300: '#DFE3E8',
  grey400: '#C4CDD5',
  grey500: '#919EAB',
  grey600: '#637381',
  grey700: '#637381',
  grey800: '#212B36',
  white: '#FFFFFF',
  red: '#E63946',
  dark: '#1A1A1A',
  blue: '#003580',
  primary: '#096dd2',

};

// ─── Helpers ────────────────────────────────────────────────────────────────────
const getTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) { const m = Math.floor(diff / 60); return `${m} minute${m > 1 ? 's' : ''} ago`; }
  if (diff < 86400) { const h = Math.floor(diff / 3600); return `${h} hour${h > 1 ? 's' : ''} ago`; }
  return dateStr.split(' ')[0];
};

// ─── Play Icon ──────────────────────────────────────────────────────────────────
const PlayIcon = ({ size = 28 }) => (
  <View style={[styles.playCircle, { width: size, height: size, borderRadius: size / 2 }]}>
    <View style={[styles.playTriangle, {
      borderTopWidth: size * 0.22,
      borderBottomWidth: size * 0.22,
      borderLeftWidth: size * 0.36,
      marginLeft: size * 0.07,
    }]} />
  </View>
);

// ─── Video Card ─────────────────────────────────────────────────────────────────
const VideoCard = ({ video, onPress, onCommentsPress }) => {
  const { sf } = useFontSize();
  
  // Skip reels and ads mixed into videomix.data
  if (video.type === 'reels' || video.type === 'googlead') return null;

  const timeAgo = getTimeAgo(video.videodate);
  const commentCount = parseInt(video.nmcomment || 0);

  return (
    <TouchableOpacity activeOpacity={0.88} onPress={() => onPress?.(video)} style={styles.card}>
      <View style={styles.thumbWrap}>
        {video.images ? (
          <Image source={{ uri: video.images }} style={[styles.thumbnail,]} resizeMode="cover" />
        ) : (
          <View style={[styles.thumbnail, styles.thumbPlaceholder]}>
            <Text style={styles.thumbPlaceholderIcon}>🎬</Text>
          </View>
        )}
        <View style={styles.thumbOverlay} />
        <View style={styles.thumbPlayBtn}><PlayIcon size={28} /></View>
        {!!video.duration && (
          <View style={styles.durationBadge}>
            <Text style={[styles.durationText, { fontSize: sf(11) }]}>{video.duration}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <Text style={[styles.videoTitle, { fontSize: sf(16), lineHeight: sf(20) }]} numberOfLines={2}>{video.videotitle}</Text>
        <Text style={[styles.metaDate, { fontSize: sf(14) }]}>{timeAgo || video.standarddate}</Text>
        <View style={styles.cardMeta}>
          <View style={styles.cardMetaLeft}>
            {!!video.ctitle && (
              <View style={styles.categoryPill}>
                <Text style={[styles.categoryPillText, { fontSize: sf(12) }]}>{video.ctitle}</Text>
              </View>
            )}
          </View>
          <View style={styles.cardMetaRight}>
            <TouchableOpacity style={styles.commentBtn} onPress={() => onCommentsPress?.(video)} activeOpacity={0.8}>
              <Ionicons name="chatbox" size={ms(20)} color={PALETTE.grey600} />
              {commentCount > 0 && (
                <Text style={[styles.commentCount, { fontSize: sf(10) }]}>{commentCount}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Chip ────────────────────────────────────────────────────────────────────────
const Chip = ({ label, active, onPress }) => {
  const { sf } = useFontSize();
  
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      activeOpacity={0.8}
    >
      {active && <Ionicons name="checkmark" size={13} color={PALETTE.white} style={{ marginRight: 4 }} />}
      <Text style={[styles.chipText, active && styles.chipTextActive, { fontSize: sf(13) }]}>{label}</Text>
    </TouchableOpacity>
  );
};

// ─── Filter Sheet ────────────────────────────────────────────────────────────────
// பதிவேற்றம் → api.filter   (name, ename: weekly/monthly/yearly)
// மாவட்டம்   → api.districtlist.data (id, title)
const FilterSheet = ({
  visible, onClose,
  filterOptions, selectedFilter, onSelectFilter,      // api.filter
  districtOptions, selectedDistrict, onSelectDistrict, // api.districtlist.data
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalContainer}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.filterSheet}>
        <View style={styles.sheetHandle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Video Filters</Text>
          <TouchableOpacity onPress={onClose} style={styles.sheetCloseBtn}>
            <Ionicons name="close" size={20} color={PALETTE.grey700} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

          {/* பதிவேற்றம் — from api.filter */}
          {filterOptions.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionLabel}>பதிவேற்றம் :</Text>
              <View style={styles.chipRow}>
                {filterOptions.map((item) => (
                  <Chip
                    key={`filter_${item.id}`}
                    label={item.name}
                    active={selectedFilter === item.ename}
                    onPress={() => onSelectFilter(item.ename)}
                  />
                ))}
              </View>
            </View>
          )}

          {/* மாவட்ட வீடியோக்கள் — from api.districtlist.data */}
          {districtOptions.length > 0 && (
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionLabel}>மாவட்ட வீடியோக்கள் :</Text>
              <View style={styles.chipRow}>
                {districtOptions
                  .filter((d) => !!d.id)
                  .map((item) => (
                    <Chip
                      key={`district_${item.id}`}
                      label={item.title}
                      active={selectedDistrict === String(item.id)}
                      onPress={() => onSelectDistrict(String(item.id))}
                    />
                  ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────────
const VideosScreen = ({ navigation }) => {
  const { sf } = useFontSize();
  
  // ── API data ──────────────────────────────────────────────────────────────────
  const [allVideos, setAllVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterOptions, setFilterOptions] = useState([]);   // api.filter
  const [districtOptions, setDistrictOptions] = useState([]);   // api.districtlist.data

  // ── Pagination state ────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // ── UI state ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('');   // ename: weekly/monthly/yearly
  const [selectedDistrict, setSelectedDistrict] = useState('');   // district id string
  const [selectedDistrictLabel, setSelectedDistrictLabel] = useState('உள்ளூர்');
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isLocationDrawerVisible, setIsLocationDrawerVisible] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // ── Fetch: CDNApi + API_ENDPOINTS.VIDEO_MAIN (/videomain) ────────────────────
  const fetchVideos = useCallback(async ({ cat = '', date = '', district = '', page = 1, append = false } = {}) => {
    if (!append) {
      setLoading(true);
      setCurrentPage(1);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    
    try {
      // Build query params
      const params = new URLSearchParams();
      if (cat) params.append('cat', cat);
      if (date) params.append('date', date);
      if (district) params.append('district', district);
      if (page > 1) params.append('page', page.toString());

      const query = params.toString();
      const endpoint = query
        ? `${API_ENDPOINTS.VIDEO_MAIN}?${query}`
        : API_ENDPOINTS.VIDEO_MAIN;

      const response = await CDNApi.get(endpoint);
      const data = response.data;

      // ── Videos — filter out reels / ads ──────────────────────────────────────
      const raw = data?.videomix?.data ?? [];
      const filteredVideos = raw.filter((v) => v.type === 'news');
      
      if (append) {
        setAllVideos(prev => [...prev, ...filteredVideos]);
      } else {
        setAllVideos(filteredVideos);
      }

      // ── Pagination info ───────────────────────────────────────────────────────
      const pagination = data?.videomix || {};
      setCurrentPage(pagination.current_page || page);
      setLastPage(pagination.last_page || 1);
      setHasMore((pagination.current_page || page) < (pagination.last_page || 1));

      // ── Category tabs (first load only) ──────────────────────────────────────
      if (data?.category?.length && categories.length === 0) {
        const seen = new Set();
        setCategories(
          data.category.filter((c) => {
            const k = String(c.value ?? '');
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          })
        );
      }

      // ── api.filter — பதிவேற்றம் (week/month/year) ────────────────────────────
      if (data?.filter?.length && filterOptions.length === 0) {
        setFilterOptions(data.filter); // [{name, id, ename, slug, reacturl}]
      }

      // ── api.districtlist.data — district chips ────────────────────────────────
      if (data?.districtlist?.data?.length && districtOptions.length === 0) {
        setDistrictOptions(data.districtlist.data); // [{id, title, slug, reacturl}]
      }
    } catch (err) {
      console.error('VideosScreen fetch error:', err?.message);
      setError(err?.message || 'பிழை ஏற்பட்டது');
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchVideos();
    }, [fetchVideos])
  );

  // ── Category tab press ────────────────────────────────────────────────────────
  const handleCategoryPress = (value) => {
    setActiveCategory(value);
    setSelectedFilter('');
    setSelectedDistrict('');
    fetchVideos({ cat: value });
  };

  // ── Immediate redirect on filter chip press ───────────────────────────────────
  const handleSelectFilter = (ename) => {
    const nextFilter = selectedFilter === ename ? '' : ename;
    setSelectedFilter(nextFilter);
    if (nextFilter && selectedDistrict) {
      fetchVideos({ cat: '1585', date: nextFilter, district: selectedDistrict });
      setFilterVisible(false);
    }
  };

  const handleSelectDistrict = (id) => {
    const nextDistrict = selectedDistrict === id ? '' : id;
    setSelectedDistrict(nextDistrict);
    if (selectedFilter && nextDistrict) {
      fetchVideos({ cat: '1585', date: selectedFilter, district: nextDistrict });
      setFilterVisible(false);
    }
  };

  // ── Nav ───────────────────────────────────────────────────────────────────────
  const handleMenuPress = () => navigation?.openDrawer?.();
  const handleSearch = () => navigation?.navigate?.('Search');
  const handleNotification = () => console.log('Notifications');

  // ── Comment press handler ─────────────────────────────────────────────────────
  const handleCommentsPress = (video) => {
    setSelectedVideo(video);
    setCommentsVisible(true);
  };

  const hasActiveFilter = !!selectedFilter || !!selectedDistrict;

  const activeFilterLabel =
    filterOptions.find((f) => f.ename === selectedFilter)?.name;
  const activeDistrictLabel =
    districtOptions.find((d) => String(d.id) === selectedDistrict)?.title;

  // ── List header ───────────────────────────────────────────────────────────────
  const ListHeader = () => (
    <View>
      {/* Category tabs + Filter icon */}
      <View style={styles.catRow}>
        <TouchableOpacity
          style={[styles.filterIconBtn]}
          onPress={() => setFilterVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="filter"
            size={20}
            color={hasActiveFilter ? PALETTE.grey600 : PALETTE.grey600}
          />
          {/* {hasActiveFilter && <View style={styles.filterDot} />} */}
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catTabsContent}
          style={{ flex: 1 }}
        >
          {categories.map((cat, idx) => {
            const isActive = activeCategory === String(cat.value ?? '');
            return (
              <TouchableOpacity
                key={`cat_${cat.value ?? idx}`}
                onPress={() => handleCategoryPress(String(cat.value ?? ''))}
                style={[styles.catTab, isActive && styles.catTabActive]}
                activeOpacity={0.8}
              >
                {String(cat.value) === '5050' && (
                  <View style={[styles.liveDot, isActive && { backgroundColor: PALETTE.white }]} />
                )}
                <Text style={[styles.catTabText, isActive && styles.catTabTextActive, { fontSize: sf(14) }]}>
                  {cat.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>


    </View>
  );

  // ── Load more handler ───────────────────────────────────────────────────────────
  const handleLoadMore = () => {
    if (!hasMore || loadingMore || loading) return;
    
    const nextPage = currentPage + 1;
    const params = { page: nextPage, append: true };
    
    if (activeCategory) params.cat = activeCategory;
    if (selectedFilter) params.date = selectedFilter;
    if (selectedDistrict) params.district = selectedDistrict;
    
    fetchVideos(params);
  };

  // ── Footer component ───────────────────────────────────────────────────────────
  const ListFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={PALETTE.primary} />
        <Text style={[styles.loadingText, { fontSize: sf(12) }]}>மேலும் ஏற்றுகிறது...</Text>
      </View>
    );
  };

  // ── Empty / error / loading ───────────────────────────────────────────────────
  const ListEmpty = () => {
    if (loading) return (
      <View style={styles.centeredState}>
        <ActivityIndicator size="large" color={PALETTE.red} />
        <Text style={[styles.stateText, { fontSize: sf(14) }]}>ஏற்றுகிறது...</Text>
        <Text style={styles.stateIcon}>🎬</Text>
        <Text style={styles.stateText}>வீடியோக்கள் இல்லை</Text>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.white} />

      <TopMenuStrip
        onMenuPress={handleMenuPress}
        onNotification={handleNotification}
        notifCount={3}
      />

      <AppHeaderComponent
        onSearch={handleSearch}
        onMenu={() => setIsDrawerVisible(true)}
        onLocation={() => setIsLocationDrawerVisible(true)}
        selectedDistrict={selectedDistrictLabel}
      />

      <FlatList
        data={loading ? [] : allVideos}
        keyExtractor={(item, idx) =>
          item?.videoid != null ? `video_${item.videoid}` : `item_${idx}`
        }
        renderItem={({ item }) => (
          <VideoCard
            video={item}
            onPress={(v) => navigation?.navigate?.('VideoDetailScreen', { video: v })}
            onCommentsPress={handleCommentsPress}
          />
        )}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={ListEmpty}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
      />

      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        filterOptions={filterOptions}
        selectedFilter={selectedFilter}
        onSelectFilter={handleSelectFilter}
        districtOptions={districtOptions}
        selectedDistrict={selectedDistrict}
        onSelectDistrict={handleSelectDistrict}
      />

      {/* Comments Modal */}
      <CommentsModal
        visible={commentsVisible}
        onClose={() => setCommentsVisible(false)}
        newsId={selectedVideo?.videoid}
        newsTitle={selectedVideo?.videotitle}
        commentCount={parseInt(selectedVideo?.nmcomment || 0)}
      />
    </SafeAreaView>
  );
};

// ─── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PALETTE.grey100,
    paddingTop: Platform.OS === 'android' ? vs(30) : 0,
  },

  // Category row
  catRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: PALETTE.white,
    borderBottomWidth: 1, borderBottomColor: PALETTE.grey300,
    paddingVertical: vs(8),
  },
  filterIconBtn: {
    marginHorizontal: s(10),
    width: s(36), height: s(36), borderRadius: s(8),
    backgroundColor: PALETTE.grey300,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  filterIconBtnActive: { backgroundColor: '#FFF0F0' },
  filterDot: {
    position: 'absolute', top: s(5), right: s(5),
    width: s(7), height: s(7), borderRadius: s(4),
    backgroundColor: PALETTE.red,
    borderWidth: 1.5, borderColor: PALETTE.white,
  },
  catTabsContent: {
    paddingHorizontal: s(4), paddingRight: s(12),
    flexDirection: 'row', alignItems: 'center', gap: s(6),
  },
  catTab: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: s(14), paddingVertical: vs(7),
    borderRadius: s(20), borderWidth: 1.5,
    borderColor: PALETTE.grey300, backgroundColor: PALETTE.grey100, gap: s(4),
  },
  catTabActive: { backgroundColor: PALETTE.primary, },
  catTabText: { fontSize: ms(16), color: PALETTE.grey700, fontWeight: '500', fontFamily: FONTS.muktaMalar.semibold },
  catTabTextActive: { color: PALETTE.white, fontWeight: '700', fontFamily: FONTS.muktaMalar.bold },
  liveDot: { width: s(6), height: s(6), borderRadius: s(3), backgroundColor: PALETTE.red },

  // Active filter bar
  activeFilters: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: s(12), paddingVertical: vs(6),
    flexWrap: 'wrap', gap: s(6),
    backgroundColor: PALETTE.grey100,
    borderBottomWidth: 1, borderBottomColor: PALETTE.grey300,
  },
  activeFiltersLabel: { fontSize: 11, color: PALETTE.grey600 },
  activeTag: {
    backgroundColor: '#FFF0F0', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: '#FFD0D0',
  },
  activeTagText: { fontSize: ms(11), color: PALETTE.red, fontWeight: '700' },
  clearFilter: { fontSize: ms(11), color: PALETTE.red, fontWeight: '700' },

  // List
  listContent: { backgroundColor: PALETTE.grey200, paddingBottom: vs(80) },
  divider: { height: vs(6), backgroundColor: PALETTE.grey200 },

  // Card
  card: { backgroundColor: PALETTE.white, paddingHorizontal: ms(14) },
  thumbWrap: { width: '100%', aspectRatio: 16 / 9, backgroundColor: PALETTE.dark, position: 'relative' },
  thumbnail: { width: '100%', height: '100%' },
  thumbPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#2A2A2A' },
  thumbPlaceholderIcon: { fontSize: ms(40) },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbPlayBtn: { position: 'absolute', bottom: vs(8), left: s(10) },
  playCircle: {
    width: s(48),
    height: s(48),
    borderRadius: s(24),
    backgroundColor: 'rgba(9, 109, 210, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: s(3),
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  playTriangle: {
    width: 0, height: 0, borderStyle: 'solid',
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderLeftColor: PALETTE.white,
  },
  durationBadge: {
    position: 'absolute', bottom: 0, right: s(5),
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: s(7), paddingVertical: vs(2),
  },
  durationText: { color: PALETTE.white, fontSize: ms(15), fontWeight: '700' },
  commentIndicator: {
    position: 'absolute', top: s(8), right: s(8),
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderRadius: s(12),
    paddingHorizontal: s(6),
    paddingVertical: vs(3),
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(3),
  },
  commentCount: {
    color: PALETTE.white,
    fontWeight: '700',
    fontFamily: FONTS.muktaMalar.bold,
  },
  watermarkWrap: { position: 'absolute', bottom: vs(10), left: s(46), flexDirection: 'row' },
  watermarkRed: { fontSize: ms(9), color: '#FF4444', fontWeight: '800', opacity: 0.85 },
  watermarkYellow: { fontSize: ms(9), color: '#FFD700', fontWeight: '800', opacity: 0.85 },
  cardBody: { gap:ms(5),marginVertical:ms(10) },
  videoTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    color: PALETTE.grey800,
    marginTop: vs(10)
  }
  ,
  cardMeta: {
    flexDirection: 'row',
    // alignItems: 'center',
    // marginBottom: vs(10),
    // gap: s(10),
    justifyContent: "space-between"
  },
  cardMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    flex: 1,
  },
  cardMetaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
  },
  commentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(3),
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
    borderRadius: s(4),
    backgroundColor: PALETTE.grey200,
  },
  commentCount: {
    color: PALETTE.grey600,
    fontWeight: '600',
    fontSize: ms(10),
  },
  categoryPill: {
    // borderRadius: s(4),
    paddingHorizontal: s(10),
    paddingVertical: vs(2),
    borderWidth: 1,
    borderColor: PALETTE.grey400
  },
  categoryPillText: { fontSize: ms(11), color: PALETTE.grey600, fontWeight: '600', fontFamily: FONTS.muktaMalar.semibold },
  metaDate: {
    fontFamily: FONTS.muktaMalar.regular,
    color: PALETTE.grey600,
   },

  // Empty / error
  centeredState: { alignItems: 'center', paddingTop: vs(80), paddingBottom: vs(40), backgroundColor: PALETTE.grey200 },
  stateIcon: { fontSize: ms(48), marginBottom: vs(12) },
  stateText: { fontSize: ms(14), color: PALETTE.grey500, marginTop: vs(8), fontFamily: FONTS.muktaMalar.regular },
  retryBtn: { marginTop: vs(16), backgroundColor: PALETTE.red, borderRadius: s(8), paddingHorizontal: s(20), paddingVertical: vs(10) },
  retryBtnText: { color: PALETTE.white, fontWeight: '700', fontSize: ms(14), fontFamily: FONTS.muktaMalar.bold },

  // Filter sheet
  modalContainer: { flex: 1, position: 'relative' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  filterSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: PALETTE.white,
    borderTopLeftRadius: s(22), borderTopRightRadius: s(22),
    paddingBottom: Platform.OS === 'ios' ? vs(36) : vs(24),
    maxHeight: '85%',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15, shadowRadius: 12,
  },
  sheetHandle: {
    width: s(36), height: vs(4), borderRadius: s(2),
    backgroundColor: PALETTE.grey300,
    alignSelf: 'center', marginTop: vs(10), marginBottom: vs(4),
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: s(20), paddingVertical: vs(14),
    borderBottomWidth: 1, borderBottomColor: PALETTE.grey300,
  },
  sheetTitle: { fontSize: ms(17), fontWeight: '700', color: PALETTE.grey800, fontFamily: FONTS.muktaMalar.bold },
  sheetCloseBtn: {
    width: s(32), height: s(32), borderRadius: s(16),
    backgroundColor: PALETTE.grey200,
    justifyContent: 'center', alignItems: 'center',
  },

  // Filter sections
  filterSection: { paddingHorizontal: s(20), paddingTop: vs(18), paddingBottom: vs(4) },
  filterSectionLabel: {
    fontSize: ms(14), fontWeight: '700', color: PALETTE.grey800, marginBottom: vs(12), fontFamily: FONTS.muktaMalar.bold,
  },

  // Chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: s(10) },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: s(16), paddingVertical: vs(9),
    borderRadius: s(22), borderWidth: 1.5,
    borderColor: PALETTE.grey300, backgroundColor: PALETTE.white,
  },
  chipActive: { borderColor: PALETTE.primary, backgroundColor: PALETTE.primary },
  chipText: { fontSize: ms(13), color: PALETTE.grey700, fontWeight: '500', fontFamily: FONTS.muktaMalar.semibold },
  chipTextActive: { color: PALETTE.white, fontWeight: '700', fontFamily: FONTS.muktaMalar.bold },

  // Loading footer
  loadingFooter: {
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: vs(20),
    backgroundColor: PALETTE.grey200,
  },
  loadingText: {
    marginLeft: s(8),
    color: PALETTE.grey600,
    fontFamily: FONTS.muktaMalar.regular,
  },
});

export default VideosScreen;