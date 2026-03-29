import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Linking,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import VideoPlayerModal from './VideoPlayerModal';
 import { s, vs, ms } from '../utils/scaling';
import { COLORS, FONTS } from '../utils/constants';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const RASI_TAB_IDS = [
  'todayrasi', 'weeklyrasi', 'monthlyrasipplan',
  'guru_pairchi_palangal', 'sani_pairchi_palangal',
  'ragu_guru_pairchi_palangal', 'new_year', 'englishnewyear',
];

const RASI_DETAIL_ENDPOINT = {
  todayrasi: '/todayrasidata',
  weeklyrasi: '/weeklyrasiupdate',
  monthlyrasipplan: '/monthlyrasi',
  guru_pairchi_palangal: '/gurupeyerchi',
  sani_pairchi_palangal: '/sanipeyerchi',
  ragu_guru_pairchi_palangal: '/rahukethupeyerchi',
  new_year: '/tamilnewyear',
  englishnewyear: '/englishnewyear',
};

const RASI_LIST = [
  { etitle: 'mesham', title: 'மேஷம்' },
  { etitle: 'rishabam', title: 'ரிஷபம்' },
  { etitle: 'mithunam', title: 'மிதுனம்' },
  { etitle: 'kadakam', title: 'கடகம்' },
  { etitle: 'simmam', title: 'சிம்மம்' },
  { etitle: 'kanni', title: 'கன்னி' },
  { etitle: 'thulam', title: 'துலாம்' },
  { etitle: 'viruchigam', title: 'விருச்சிகம்' },
  { etitle: 'thanusu', title: 'தனுசு' },
  { etitle: 'makaram', title: 'மகரம்' },
  { etitle: 'kumbam', title: 'கும்பம்' },
  { etitle: 'meenam', title: 'மீனம்' },
];

// ─────────────────────────────────────────────────────────────────────────────
// HTML helpers
// ─────────────────────────────────────────────────────────────────────────────
function stripHtml(html = '') {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Simple HTML parser function
const parseHtmlContent = (html) => {
  if (!html) return '';

  // Replace HTML tags with formatting
  let cleanText = html
    .replace(/<div[^>]*>/gi, '\n\n')
    .replace(/<\/div>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<b[^>]*>/gi, '**')
    .replace(/<\/b>/gi, '**')
    .replace(/<strong[^>]*>/gi, '**')
    .replace(/<\/strong>/gi, '**')
    .replace(/<p[^>]*>/gi, '\n\n')
    .replace(/<\/p>/gi, '')
    .replace(/<span[^>]*>/gi, '')
    .replace(/<\/span>/gi, '')
    .replace(/<[^>]*>/gi, '') // Remove any remaining HTML tags
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n\s*\n\s*\n/gi, '\n\n') // Remove extra newlines
    .trim();

  return cleanText;
};

// Function to render formatted text with bold handling
const renderFormattedText = (text) => {
  if (!text) return null;

  const parts = text.split('**');
  return parts.map((part, index) => {
    if (index % 2 === 0) {
      // Regular text
      return part ? (
        <Text key={index} style={{ fontSize: ms(15), fontFamily: FONTS.muktaMalar.regular, color: '#333', lineHeight: ms(24), marginBottom: vs(5) }}>
          {part}
        </Text>
      ) : null;
    } else {
      // Bold text
      return part ? (
        <Text key={index} style={{ fontSize: ms(15), fontFamily: FONTS.muktaMalar.bold, color: '#333', lineHeight: ms(24), marginBottom: vs(5), fontWeight: '700' }}>
          {part}
        </Text>
      ) : null;
    }
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Rasi Detail View Component
// ─────────────────────────────────────────────────────────────────────────────
function RasiDetailView({ 
  tabId, 
  tabTitle, 
  initialJcat, 
  initialItem, 
  onBack, 
  subTabs, 
  onTabChange,
  CDNApi 
}) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [activeJcat, setActiveJcat] = useState(initialJcat || 'mesham');
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const scrollRef = useRef(null);
  const resolvedEndpoint = RASI_DETAIL_ENDPOINT[tabId] || '';
  const currentIdx = RASI_LIST.findIndex(r => r.etitle === activeJcat);
  const currentRasi = RASI_LIST[currentIdx] || RASI_LIST[0];

  const fetchDetail = useCallback(async (targetJcat, date = selectedDate) => {
    if (!resolvedEndpoint || !targetJcat) { setLoading(false); return; }
    try {
      setLoading(true);
      setError(null);
      const dateStr = date.toISOString().split('T')[0];
      const url = `${resolvedEndpoint}?jcat=${targetJcat}&date=${dateStr}`;
      console.log('[RasiDetailView] fetch:', url);
      const res = await CDNApi.get(url);
      const d = res?.data;
      console.log('[RasiDetailView] full response:', JSON.stringify(d, null, 2));
      console.log('[RasiDetailView] keys:', Object.keys(d || {}));

      const item =
        d?.videodailyrasi?.data?.[0] ||
        d?.newlist?.data?.[0] ||
        d?.detaildata?.[0] ||
        d?.rasidetail?.[0] ||
        d?.rasidata?.[0] ||
        d?.detail?.[0] ||
        d?.rasi?.[0] ||
        d?.astrology?.[0] ||
        d?.horoscope?.[0] ||
        (Array.isArray(d?.data) ? d.data[0] : null) ||
        (Array.isArray(d?.newlist) ? d.newlist[0] : null) ||
        (Array.isArray(d?.rasi) ? d.rasi[0] : null) ||
        (Array.isArray(d?.astrology) ? d.astrology[0] : null) ||
        (Array.isArray(d?.horoscope) ? d.horoscope[0] : null) ||
        (Array.isArray(d) ? d[0] : null) ||
        null;

      console.log('[RasiDetailView] extracted item:', JSON.stringify(item, null, 2));

      // Check all possible content fields
      console.log('[RasiDetailView] content fields:');
      console.log('  footnote:', item?.footnote?.substring(0, 100));
      console.log('  content:', item?.content?.substring(0, 100));
      console.log('  description:', item?.description?.substring(0, 100));
      console.log('  prediction:', item?.prediction?.substring(0, 100));
      console.log('  palan:', item?.palan?.substring(0, 100));

      setDetail(item || (d?.footnote ? d : initialItem || null));
    } catch (e) {
      console.error('[RasiDetailView] error:', e?.message);
      setError('தகவல் ஏற்ற முடியவில்லை.');
      if (initialItem) setDetail(initialItem);
    } finally {
      setLoading(false);
    }
  }, [resolvedEndpoint, initialItem, selectedDate, CDNApi]);

  React.useEffect(() => { 
    setImageError(false); // Reset image error when changing rasi
    fetchDetail(activeJcat); 
  }, [activeJcat, fetchDetail]);

  const goToRasi = (etitle) => {
    setActiveJcat(etitle);
    setVideoPlaying(false);
    setImageError(false); // Reset image error when changing rasi
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const rasiTabList = (subTabs || []).filter(t => RASI_TAB_IDS.includes(String(t.id)));
  const currentTabIdx = rasiTabList.findIndex(t => String(t.id) === String(tabId));
  const prevDisabled = currentTabIdx <= 0;
  const nextDisabled = currentTabIdx >= rasiTabList.length - 1;
  const goToPrev = () => { if (!prevDisabled) onTabChange?.(rasiTabList[currentTabIdx - 1]); };
  const goToNext = () => { if (!nextDisabled) onTabChange?.(rasiTabList[currentTabIdx + 1]); };

  const pageTitle = `${tabTitle} : ${currentRasi.title}`;
  const date = detail?.standarddate || detail?.date || detail?.created_date || '';
  const prevDate = detail?.previousdate || detail?.prevdate || detail?.previous_date || new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000).toLocaleDateString('ta-IN');
  const palan = detail?.palan || detail?.prediction || detail?.description || detail?.content || '';
  const rasiLabel = detail?.rasi || detail?.zodiac || detail?.sign || currentRasi.title;
  const footnoteHtml = detail?.footnote || detail?.content || detail?.description || '';
  const parsedContent = parseHtmlContent(footnoteHtml);

  const hasVideo = !!detail?.videopath || (detail?.video && detail.video !== '0');
  const videoUrl = detail?.videopath || detail?.videolink || detail?.videourl || '';
  const imageUri =
    detail?.largeimages || detail?.images || detail?.icon ||
    initialItem?.largeimages || initialItem?.icon ||
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';
  const shareUrl = detail?.slug
    ? `https://www.dinamalar.com${detail.slug}`
    : 'https://www.dinamalar.com/astrology';

  const doShare = async () => {
    try { await Share.share({ message: `${pageTitle} ${shareUrl}` }); } catch (_) { }
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1, backgroundColor: '#fff' }}
      contentContainerStyle={{ paddingBottom: vs(40) }}
      showsVerticalScrollIndicator={false}
    >
      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>ஏற்றுகிறது...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.pageTitle}>{pageTitle}</Text>
          <View style={styles.dateRow}>
            {!!date && <Text style={styles.date}>{date}</Text>}
          </View>

          {!!prevDate && (
            <View style={styles.prevDateRow}>
              <Text style={styles.prevDateLabel}>முந்தய நாட்களின் ராசி</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerBtn}>
                <View style={styles.prevDateBadge}>
                  <Ionicons name="calendar-outline" size={s(13)} color="#555" />
                  <Text style={styles.prevDateText}>{prevDate}</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {(!!rasiLabel || !!palan) && (
            <View style={styles.rasiPalanRow}>
              <View style={styles.greyDot} />
              <Text style={styles.rasiPalanText}>{rasiLabel}{palan ? ` : ${palan}` : ''}</Text>
            </View>
          )}

          <View style={styles.imageSection}>
            <TouchableOpacity
              style={[styles.arrowBtn, styles.arrowLeft]}
              onPress={goToPrev}
              disabled={prevDisabled}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={s(24)} color={prevDisabled ? '#ccc' : '#333'} />
            </TouchableOpacity>

            <View style={styles.imageWrap}>
              {imageError || !imageUri ? (
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
                  onError={() => setImageError(true)}
                />
              )}
              <VideoPlayerModal
                visible={hasVideo && videoPlaying}
                url={videoUrl}
                onClose={() => setVideoPlaying(false)}
              />
            </View>

            <TouchableOpacity
              style={[styles.arrowBtn, styles.arrowRight]}
              onPress={goToNext}
              disabled={nextDisabled}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-forward" size={s(24)} color={nextDisabled ? '#ccc' : '#333'} />
            </TouchableOpacity>
          </View>

          <View style={styles.shareRow}>
            {[
              { icon: 'logo-facebook', bg: '#1877F2', onPress: () => Linking.openURL(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`) },
              { icon: 'logo-twitter', bg: '#000', onPress: () => Linking.openURL(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`) },
              { icon: 'logo-whatsapp', bg: '#25D366', onPress: () => Linking.openURL(`whatsapp://send?text=${encodeURIComponent(pageTitle + ' ' + shareUrl)}`) },
              { icon: 'paper-plane-outline', bg: '#2AABEE', onPress: () => Linking.openURL(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}`) },
              { icon: 'share-social-outline', bg: '#888', onPress: doShare },
              { icon: 'bookmark-outline', bg: '#fff', iconColor: '#888', border: true },
            ].map((item, i) => (
              <TouchableOpacity key={i} onPress={item.onPress} activeOpacity={0.7}>
                <View style={[styles.shareCircle, { backgroundColor: item.bg }, item.border && styles.shareCircleBorder]}>
                  <Ionicons name={item.icon} size={s(17)} color={item.iconColor || '#fff'} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.rasiTitleWrap}>
            <Text style={styles.rasiTitleText}>{rasiLabel}</Text>
          </View>

          <View style={styles.footnoteWrap}>
            {parsedContent ? (
              <>
                <Text style={{ fontSize: ms(12), color: '#666', marginBottom: vs(10) }}>
                  ராசி விவரங்கள்:
                </Text>
                {renderFormattedText(parsedContent)}
              </>
            ) : (
              <View style={styles.emptyWrap}>
                <Ionicons name="star-outline" size={s(36)} color="#ccc" />
                <Text style={styles.emptyText}>விவரங்கள் இல்லை</Text>
              </View>
            )}
          </View>

          {!!error && !footnoteHtml && (
            <View style={styles.errorRow}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => fetchDetail(activeJcat)}>
                <Text style={styles.retryText}>மீண்டும் முயற்சி</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) {
              setSelectedDate(date);
              fetchDetail(activeJcat, date);
            }
          }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chipStrip: { backgroundColor: '#fff', maxHeight: vs(46), borderBottomWidth: 1, borderBottomColor: '#eee' },
  chipContent: { paddingHorizontal: s(8), alignItems: 'center', paddingVertical: vs(5), gap: s(5) },
  chip: { paddingHorizontal: s(12), paddingVertical: vs(5), borderRadius: s(20), backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: 'transparent' },
  chipActive: { backgroundColor: COLORS.primary + '18', borderColor: COLORS.primary },
  chipText: { fontSize: ms(12), fontFamily: FONTS.muktaMalar.regular, color: '#555' },
  chipTextActive: { color: COLORS.primary, fontWeight: '700' },
  loaderWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: vs(60), gap: vs(12) },
  loaderText: { fontSize: ms(14), color: '#888', fontFamily: FONTS.muktaMalar.regular },
  pageTitle: { fontSize: ms(18), fontFamily: FONTS.anek.bold, color: '#111', fontWeight: '700', paddingHorizontal: s(12), paddingTop: vs(14), marginBottom: vs(4) },
  date: { fontSize: ms(13), color: '#888', fontFamily: FONTS.muktaMalar.regular },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: s(12), marginBottom: vs(10) },
  datePickerBtn: { padding: s(5) },
  prevDateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: s(12), paddingVertical: vs(8), backgroundColor: '#f8f8f8', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee', marginBottom: vs(10) },
  prevDateLabel: { fontSize: ms(13), fontFamily: FONTS.muktaMalar.regular, color: '#444' },
  prevDateBadge: { flexDirection: 'row', alignItems: 'center', gap: s(5), backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', paddingHorizontal: s(8), paddingVertical: vs(4), borderRadius: s(4) },
  prevDateText: { fontSize: ms(12), fontFamily: FONTS.muktaMalar.regular, color: '#444' },
  rasiPalanRow: { flexDirection: 'row', alignItems: 'center', gap: s(8), paddingHorizontal: s(12), marginBottom: vs(10), justifyContent: 'flex-end' },
  greyDot: { width: s(8), height: s(8), borderRadius: s(4), backgroundColor: '#888' },
  rasiPalanText: { fontSize: ms(13), fontFamily: FONTS.muktaMalar.bold, color: '#444', fontWeight: '600' },
  imageSection: { flexDirection: 'row', alignItems: 'center' },
  arrowBtn: { width: s(32), alignItems: 'center', justifyContent: 'center', paddingVertical: vs(10) },
  arrowLeft: { paddingLeft: s(4) },
  arrowRight: { paddingRight: s(4) },
  imageWrap: { flex: 1, height: vs(140), overflow: 'hidden' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { width: '100%', height: '100%', backgroundColor: '#f8f8f8', justifyContent: 'center', alignItems: 'center' },
  placeholderLogo: { width: '60%', height: '60%', resizeMode: 'contain' },
  playOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  playBtn: { width: s(36), height: s(36), borderRadius: s(28), backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', paddingLeft: s(3) },
  shareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: vs(14), gap: s(14), borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  shareCircle: { width: s(36), height: s(36), borderRadius: s(18), alignItems: 'center', justifyContent: 'center' },
  shareCircleBorder: { borderWidth: 1, borderColor: '#ddd' },
  rasiTitleWrap: { paddingHorizontal: s(12), paddingTop: vs(14), paddingBottom: vs(8) },
  rasiTitleText: { fontSize: ms(16), fontFamily: FONTS.muktaMalar.medium || FONTS.muktaMalar.bold, color: '#111', fontWeight: '700', textDecorationLine: 'underline' },
  footnoteWrap: { paddingHorizontal: s(12), paddingTop: vs(4) },
  paragraph: { fontSize: ms(15), fontFamily: FONTS.muktaMalar.regular, color: '#333', lineHeight: ms(24), marginBottom: vs(10) },
  emptyWrap: { alignItems: 'center', paddingVertical: vs(40), gap: vs(10) },
  emptyText: { fontSize: ms(14), color: '#aaa', fontFamily: FONTS.muktaMalar.regular },
  errorRow: { alignItems: 'center', paddingHorizontal: s(20), paddingVertical: vs(20), gap: vs(10) },
  errorText: { fontSize: ms(14), color: '#888', textAlign: 'center', fontFamily: FONTS.muktaMalar.regular },
  retryBtn: { paddingHorizontal: s(20), paddingVertical: vs(8), backgroundColor: COLORS.primary, borderRadius: s(6) },
  retryText: { color: '#fff', fontSize: ms(13), fontFamily: FONTS.muktaMalar.medium, fontWeight: '700' },
  moreStrip: { paddingHorizontal: s(12), paddingVertical: vs(14), borderTopWidth: 1, borderTopColor: '#eee', marginTop: vs(16) },
  moreText: { fontSize: ms(15), fontFamily: FONTS.muktaMalar.medium || FONTS.muktaMalar.bold, color: '#222', fontWeight: '700' },
});

export default RasiDetailView;
