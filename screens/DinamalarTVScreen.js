import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Replace with your actual API base URL ─────────────────────────────────────
const API_URL = 'https://www.dinamalar.com/videodata';

const DURATION_FILTERS = [
  { title: 'அனைத்தும்', value: 'all' },
  { title: '0–2 நிமிடங்கள்', value: '0' },
  { title: '2–4 நிமிடங்கள்', value: '2' },
  { title: '4–6 நிமிடங்கள்', value: '4' },
  { title: '6+ நிமிடங்கள்', value: '6' },
];

const SORT_OPTIONS = [
  { title: 'புதியவை', value: 'newest' },
  { title: 'பழையவை', value: 'oldest' },
];

const RED = '#E63946';
const DARK = '#1A1A1A';
const GRAY = '#888888';
const LIGHT_GRAY = '#F5F5F5';
const BORDER = '#EEEEEE';

// ─── Play Button ───────────────────────────────────────────────────────────────
const PlayButton = () => (
  <View style={styles.playBtn}>
    <View style={styles.playTriangle} />
  </View>
);

// ─── Video Card ────────────────────────────────────────────────────────────────
const VideoCard = ({ video, onPress }) => (
  <TouchableOpacity activeOpacity={0.92} onPress={() => onPress(video)} style={styles.card}>
    <View style={styles.thumbnailContainer}>
      <Image
        source={{ uri: video.images }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <View style={styles.thumbnailOverlay} />

      {/* Duration */}
      <View style={styles.durationBadge}>
        <Text style={styles.durationText}>{video.duration}</Text>
      </View>

      {/* Play */}
      <View style={styles.playBtnContainer}>
        <PlayButton />
      </View>

      {/* Watermark */}
      <View style={styles.watermark}>
        <Text style={styles.watermarkRed}>தின</Text>
        <Text style={styles.watermarkYellow}>மலர்</Text>
      </View>
    </View>

    <View style={styles.cardBody}>
      <Text style={styles.videoTitle} numberOfLines={2}>
        {video.videotitle}
      </Text>
      <View style={styles.metaRow}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{video.ctitle}</Text>
        </View>
        <Text style={styles.dateText}>{video.standarddate}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

// ─── Filter Bottom Sheet ───────────────────────────────────────────────────────
const FilterSheet = ({ visible, onClose, durationFilter, setDurationFilter, sortFilter, setSortFilter, onApply }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
    <View style={styles.filterSheet}>
      <View style={styles.sheetHandle} />

      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>வடிகட்டு</Text>
        <TouchableOpacity onPress={onClose} style={styles.sheetClose}>
          <Text style={styles.sheetCloseText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Sort */}
      <View style={styles.filterSection}>
        <Text style={styles.filterSectionLabel}>வரிசைப்படுத்து</Text>
        <View style={styles.filterChipRow}>
          {SORT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setSortFilter(opt.value)}
              style={[styles.filterChip, sortFilter === opt.value && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, sortFilter === opt.value && styles.filterChipTextActive]}>
                {opt.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Duration */}
      <View style={styles.filterSection}>
        <Text style={styles.filterSectionLabel}>காலம்</Text>
        <View style={styles.filterChipRow}>
          {DURATION_FILTERS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setDurationFilter(opt.value)}
              style={[styles.filterChip, durationFilter === opt.value && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, durationFilter === opt.value && styles.filterChipTextActive]}>
                {opt.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.applyBtn} onPress={onApply}>
        <Text style={styles.applyBtnText}>பயன்படுத்து</Text>
      </TouchableOpacity>
    </View>
  </Modal>
);

// ─── Main Screen ───────────────────────────────────────────────────────────────
const DinamalarTVScreen = () => {
  const [videos, setVideos] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [durationFilter, setDurationFilter] = useState('all');
  const [sortFilter, setSortFilter] = useState('newest');

  useEffect(() => {
    fetchVideos('');
  }, []);

  const fetchVideos = async (categoryValue) => {
    try {
      setLoading(true);
      const url = categoryValue ? `${API_URL}?cat=${categoryValue}` : API_URL;
      const res = await fetch(url);
      const data = await res.json();

      // Videos come from videomix.data in the API response
      setVideos(data?.videomix?.data || []);

      // Categories come from category array in the API response
      if (data?.category?.length) {
        setCategories(data.category);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (value) => {
    setActiveCategory(value);
    fetchVideos(value);
  };

  const hasActiveFilter = durationFilter !== 'all' || sortFilter !== 'newest';

  // Duration filter
  const filteredVideos = videos.filter(v => {
    if (durationFilter === 'all') return true;
    const parts = (v.duration || '00:00').split(':');
    const totalMin = parseInt(parts[0] || 0) + parseInt(parts[1] || 0) / 60;
    if (durationFilter === '0') return totalMin < 2;
    if (durationFilter === '2') return totalMin >= 2 && totalMin < 4;
    if (durationFilter === '4') return totalMin >= 4 && totalMin < 6;
    if (durationFilter === '6') return totalMin >= 6;
    return true;
  });

  // Sort
  const sortedVideos = [...filteredVideos].sort((a, b) =>
    sortFilter === 'oldest' ? a.videoid - b.videoid : b.videoid - a.videoid
  );

  const handleVideoPress = (video) => {
    // Wire up your navigation here, e.g.:
    // navigation.navigate('VideoDetail', { video });
    console.log('Open video:', video.videoid);
  };

  const ListHeader = () => (
    <>
      {/* Breadcrumb */}
      <View style={styles.breadcrumb}>
        <Text style={styles.breadcrumbGray}>🏠 / </Text>
        <Text style={styles.breadcrumbActive}>தினமலர் டிவி</Text>
      </View>

      {/* Filter + Category Row */}
      <View style={styles.filterCategoryRow}>
        <TouchableOpacity
          style={[styles.filterIconBtn, hasActiveFilter && styles.filterIconBtnActive]}
          onPress={() => setFilterVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterIconText, hasActiveFilter && styles.filterIconTextActive]}>⊟</Text>
          {hasActiveFilter && <View style={styles.filterDot} />}
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryTabsContainer}
          style={styles.categoryTabsScroll}
        >
          {categories.map(cat => {
            const isActive = activeCategory === cat.value;
            return (
              <TouchableOpacity
                key={cat.value}
                onPress={() => handleCategoryChange(cat.value)}
                style={[styles.categoryTab, isActive && styles.categoryTabActive]}
                activeOpacity={0.8}
              >
                {cat.value === '5050' && (
                  <View style={[styles.liveDot, isActive && styles.liveDotActive]} />
                )}
                <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
                  {cat.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Share Bar */}
      <View style={styles.shareBar}>
        {[
          { label: 'f', color: '#1877F2' },
          { label: '𝕏', color: '#000' },
          { label: 'W', color: '#25D366' },
          { label: '✈', color: '#0088CC' },
        ].map((s, i) => (
          <TouchableOpacity key={i} style={[styles.shareBtn, { backgroundColor: s.color }]}>
            <Text style={styles.shareBtnText}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Active filter tags */}
      {hasActiveFilter && (
        <View style={styles.activeFilterRow}>
          <Text style={styles.activeFilterLabel}>வடிகட்டல்: </Text>
          {sortFilter !== 'newest' && (
            <View style={styles.activeFilterTag}>
              <Text style={styles.activeFilterTagText}>
                {SORT_OPTIONS.find(s => s.value === sortFilter)?.title}
              </Text>
            </View>
          )}
          {durationFilter !== 'all' && (
            <View style={styles.activeFilterTag}>
              <Text style={styles.activeFilterTagText}>
                {DURATION_FILTERS.find(d => d.value === durationFilter)?.title}
              </Text>
            </View>
          )}
          <TouchableOpacity onPress={() => { setDurationFilter('all'); setSortFilter('newest'); }}>
            <Text style={styles.clearFilterText}>அழி ✕</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );

  const ListEmpty = () => (
    <View style={styles.emptyState}>
      {loading
        ? <ActivityIndicator size="large" color={RED} />
        : <><Text style={styles.emptyIcon}>🎬</Text><Text style={styles.emptyText}>வீடியோக்கள் இல்லை</Text></>
      }
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuBtn}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Text>
            <Text style={styles.logoRed}>தின</Text>
            <Text style={styles.logoBlue}>மலர்</Text>
            <Text style={styles.logoNum}> 45</Text>
          </Text>
          <Text style={styles.logoTagline}>தேசிய தமிழ் நாளிதழ்</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity><Text style={styles.headerIcon}>🔍</Text></TouchableOpacity>
          <TouchableOpacity style={styles.locationBtn}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>உள்ளூர்</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={sortedVideos}
        keyExtractor={item => String(item.videoid)}
        renderItem={({ item }) => <VideoCard video={item} onPress={handleVideoPress} />}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <FilterSheet
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        durationFilter={durationFilter}
        setDurationFilter={setDurationFilter}
        sortFilter={sortFilter}
        setSortFilter={setSortFilter}
        onApply={() => setFilterVisible(false)}
      />
    </SafeAreaView>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2, borderBottomColor: RED,
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 4,
  },
  menuBtn: { padding: 4, marginRight: 8 },
  menuIcon: { fontSize: 20, color: DARK },
  logoContainer: { flex: 1, alignItems: 'center' },
  logoRed: { fontSize: 18, color: RED, fontWeight: '900' },
  logoBlue: { fontSize: 18, color: '#003580', fontWeight: '900' },
  logoNum: { fontSize: 12, color: RED, fontWeight: '700' },
  logoTagline: { fontSize: 9, color: GRAY, marginTop: -2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: { fontSize: 18 },
  locationBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF5F5', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: '#FFD0D0', gap: 2,
  },
  locationIcon: { fontSize: 12 },
  locationText: { fontSize: 11, color: RED, fontWeight: '700' },

  breadcrumb: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4,
  },
  breadcrumbGray: { fontSize: 12, color: GRAY },
  breadcrumbActive: { fontSize: 12, color: RED, fontWeight: '600' },

  filterCategoryRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: BORDER,
    paddingVertical: 6,
  },
  filterIconBtn: {
    marginLeft: 10, marginRight: 4,
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: LIGHT_GRAY,
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  filterIconBtnActive: { backgroundColor: '#FFF0F0' },
  filterIconText: { fontSize: 18, color: '#555' },
  filterIconTextActive: { color: RED },
  filterDot: {
    position: 'absolute', top: 5, right: 5,
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: RED, borderWidth: 1.5, borderColor: '#FFF',
  },
  categoryTabsScroll: { flex: 1 },
  categoryTabsContainer: {
    flexDirection: 'row', paddingHorizontal: 6, gap: 6, alignItems: 'center',
  },
  categoryTab: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#DDD',
    backgroundColor: '#FFF', gap: 4,
  },
  categoryTabActive: { backgroundColor: RED, borderColor: RED },
  categoryTabText: { fontSize: 12.5, color: '#444', fontWeight: '500' },
  categoryTabTextActive: { color: '#FFF', fontWeight: '700' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: RED },
  liveDotActive: { backgroundColor: '#FFF' },

  shareBar: {
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8,
    gap: 10, backgroundColor: '#FFF',
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  shareBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  shareBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  activeFilterRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 6, flexWrap: 'wrap', gap: 6,
  },
  activeFilterLabel: { fontSize: 12, color: GRAY },
  activeFilterTag: {
    backgroundColor: '#FFF0F0', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: '#FFD0D0',
  },
  activeFilterTagText: { fontSize: 11, color: RED, fontWeight: '700' },
  clearFilterText: { fontSize: 11, color: RED, fontWeight: '700' },

  listContent: { backgroundColor: '#F7F7F8', paddingBottom: 80 },
  separator: { height: 8, backgroundColor: '#F7F7F8' },

  card: { backgroundColor: '#FFF', overflow: 'hidden' },
  thumbnailContainer: {
    width: '100%', aspectRatio: 16 / 9,
    backgroundColor: '#111', position: 'relative',
  },
  thumbnail: { width: '100%', height: '100%' },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  durationBadge: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  durationText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  playBtnContainer: { position: 'absolute', bottom: 8, left: 8 },
  playBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center',
  },
  playTriangle: {
    width: 0, height: 0, borderStyle: 'solid',
    borderTopWidth: 7, borderBottomWidth: 7, borderLeftWidth: 12,
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderLeftColor: '#FFF', marginLeft: 2,
  },
  watermark: {
    position: 'absolute', bottom: 8, left: 48, flexDirection: 'row',
  },
  watermarkRed: { fontSize: 9, color: '#FF4444', fontWeight: '800', opacity: 0.8 },
  watermarkYellow: { fontSize: 9, color: '#FFD700', fontWeight: '800', opacity: 0.8 },

  cardBody: { paddingHorizontal: 12, paddingVertical: 10, paddingBottom: 12 },
  videoTitle: { fontSize: 14, fontWeight: '600', color: DARK, lineHeight: 20, marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryBadge: {
    backgroundColor: '#F5F5F5', borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  categoryBadgeText: { fontSize: 11, color: '#555', fontWeight: '600' },
  dateText: { fontSize: 11, color: GRAY },

  emptyState: { alignItems: 'center', paddingTop: 80, paddingBottom: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: GRAY },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  filterSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    elevation: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15, shadowRadius: 12,
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#DDD', alignSelf: 'center',
    marginTop: 10, marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: DARK },
  sheetClose: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: LIGHT_GRAY,
    justifyContent: 'center', alignItems: 'center',
  },
  sheetCloseText: { fontSize: 14, color: '#333', fontWeight: '700' },
  filterSection: { paddingHorizontal: 20, paddingTop: 16 },
  filterSectionLabel: {
    fontSize: 11, fontWeight: '700', color: GRAY,
    letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 10,
  },
  filterChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: '#DDD', backgroundColor: '#FFF',
  },
  filterChipActive: { borderColor: RED, backgroundColor: '#FFF0F0' },
  filterChipText: { fontSize: 13, color: '#555', fontWeight: '600' },
  filterChipTextActive: { color: RED, fontWeight: '700' },
  applyBtn: {
    marginHorizontal: 20, marginTop: 20,
    backgroundColor: RED, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  applyBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});

export default DinamalarTVScreen;