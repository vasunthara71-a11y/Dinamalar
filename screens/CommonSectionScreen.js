import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { CDNApi, mainApi } from '../config/api';
import { ms, s, vs } from '../utils/scaling';
import { COLORS, FONTS, NewsCard as NewsCardStyles } from '../utils/constants';
import TEXT_STYLES from '../utils/textStyles';
import { useFontSize } from '../context/FontSizeContext';
import { WebView } from 'react-native-webview';
import DateTimePicker from '@react-native-community/datetimepicker';
import VideoPlayerModal from '../components/VideoPlayerModal';

// ── Taboola publisher ID for mobile (from your website TaboolaScript.js) ──────
const TABOOLA_PUBLISHER_ID = 'mdinamalarcom';

// ─── Taboola Widget ───────────────────────────────────────────────────────────
function TaboolaWidget({ pageUrl, mode, container, placement, pageType = 'homepage', targetType = 'mix' }) {
  const [height, setHeight] = useState(1);
  if (!mode || !container || !placement || !pageUrl) return null;
  const safe = (str) => String(str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      #${safe(container)} { width: 100%; }
      img { max-width: 100%; height: auto; }
    </style>
  </head>
  <body>
    <div id="${safe(container)}"></div>
    <script type="text/javascript">
      window._taboola = window._taboola || [];
      _taboola.push({ article: 'auto' });
      _taboola.push({
        mode:        '${safe(mode)}',
        container:   '${safe(container)}',
        placement:   '${safe(placement)}',
        target_type: '${safe(targetType)}'
      });
      (function() {
        var script   = document.createElement('script');
        script.type  = 'text/javascript';
        script.async = true;
        script.src   = 'https://cdn.taboola.com/libtrc/${TABOOLA_PUBLISHER_ID}/loader.js';
        script.id    = 'tb_loader_script';
        script.onload = function() {
          _taboola.push({ flush: true });
        };
        if (!document.getElementById('tb_loader_script')) {
          document.head.appendChild(script);
        } else {
          _taboola.push({ flush: true });
        }
      })();
    </script>
    <script type="text/javascript">
      window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'taboola_height') {
          var height = parseInt(event.data.height, 10);
          if (height && height > 50) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ height: height }));
          }
        }
      });
      setTimeout(function() {
        var container = document.getElementById('${safe(container)}');
        if (container) {
          var height = container.offsetHeight || 0;
          if (height > 50) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ height: height }));
          }
        }
      }, 2000);
    </script>
  </body>
</html>`;

  return (
    <View style={{ width: '100%', height, backgroundColor: '#fff', overflow: 'hidden' }}>
      <WebView
        source={{ html, baseUrl: 'https://www.dinamalar.com' }}
        style={{ width: '100%', height }}
        scrollEnabled={false}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.height && !isNaN(data.height) && data.height > 50) {
              setHeight(prev => Math.max(prev, data.height));
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }}
        onError={(e) => console.warn('[Taboola WebView error]', e.nativeEvent)}
        nestedScrollEnabled={false}
      />
    </View>
  );
}

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

import UniversalHeaderComponent from '../components/UniversalHeaderComponent';
import AppHeaderComponent from '../components/AppHeaderComponent';

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

function parseFootnoteParagraphs(html = '') {
  if (!html) return [];
  const normalized = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<div[^>]*>/gi, '');

  const parts = [];
  const boldRe = /<b>([\s\S]*?)<\/b>/gi;
  let last = 0, match;

  while ((match = boldRe.exec(normalized)) !== null) {
    if (match.index > last) {
      const before = stripHtml(normalized.slice(last, match.index));
      if (before.trim()) parts.push({ bold: false, text: before });
    }
    const boldText = stripHtml(match[1]);
    if (boldText.trim()) parts.push({ bold: true, text: boldText });
    last = match.index + match[0].length;
  }
  if (last < normalized.length) {
    const after = stripHtml(normalized.slice(last));
    if (after.trim()) parts.push({ bold: false, text: after });
  }

  const final = [];
  for (const p of parts) {
    if (p.bold) {
      final.push(p);
    } else {
      const lines = p.text.split('\n').map(l => l.trim()).filter(Boolean);
      lines.forEach(line => final.push({ bold: false, text: line }));
    }
  }
  return final;
}

// ─────────────────────────────────────────────────────────────────────────────
// Rasi Card Component (list view)
// ─────────────────────────────────────────────────────────────────────────────
const RasiCard = ({ item, onPress }) => {
  const imageUri =
    item.largeimages ||
    item.icon ||
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';

  const title = item.title || item.newstitle || '';
  // ✅ videopath added
  const hasVideo = !!item.videopath || (item.video && item.video !== '0');

  return (
    <TouchableOpacity style={rc.wrap} onPress={onPress} activeOpacity={0.85}>
      <View style={rc.imageWrap}>
        <Image source={{ uri: imageUri }} style={rc.image} resizeMode="cover" />
        {hasVideo && (
          <View style={rc.playOverlay}>
            <View style={rc.playBtn}>
              <Ionicons name="play" size={s(14)} color="#fff" />
            </View>
          </View>
        )}
      </View>
      <View style={rc.content}>
        <Text style={rc.title}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

const rc = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: '#fff', alignItems: 'center', paddingVertical: vs(6), paddingHorizontal: s(10), borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  imageWrap: { width: '30%', height: vs(80), position: 'relative', overflow: 'hidden' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  playOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  playBtn: { width: s(28), height: s(28), borderRadius: s(14), backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', paddingLeft: s(2) },
  content: { flex: 1, paddingHorizontal: s(12) },
  title: { fontSize: ms(14), fontFamily: FONTS.muktaMalar.medium, color: '#1a1a1a', fontWeight: '700' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Inline Rasi Detail View
// ─────────────────────────────────────────────────────────────────────────────
// ✅ Added subTabs + onTabChange props for arrow tab navigation
function RasiDetailView({ tabId, tabTitle, initialJcat, initialItem, onBack, subTabs, onTabChange }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

      // ✅ videodailyrasi shape added first
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
      console.log('[RasiDetailView] item.palan:', item?.palan);
      console.log('[RasiDetailView] item.rasi:', item?.rasi);
      console.log('[RasiDetailView] item.description:', item?.description?.substring?.(0, 50));
      console.log('[RasiDetailView] item.content:', item?.content?.substring?.(0, 50));
      setDetail(item || (d?.footnote ? d : initialItem || null));
    } catch (e) {
      console.error('[RasiDetailView] error:', e?.message);
      setError('தகவல் ஏற்ற முடியவில்லை.');
      if (initialItem) setDetail(initialItem);
    } finally {
      setLoading(false);
    }
  }, [resolvedEndpoint, initialItem, selectedDate]);

  // Fetch whenever activeJcat changes
  React.useEffect(() => { fetchDetail(activeJcat); }, [activeJcat]);

  const goToRasi = (etitle) => {
    setActiveJcat(etitle);
    setVideoPlaying(false);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  // ✅ Arrows navigate between TABS (இன்றைய ராசி → வார ராசி → மாத ராசி...)
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
  const paragraphs = parseFootnoteParagraphs(footnoteHtml);

  console.log('[RasiDetailView] extracted values:', {
    date, prevDate, palan, rasiLabel, footnoteHtml, paragraphsCount: paragraphs.length
  });
  // ✅ videopath added
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
      {/* ── Rasi chip strip (12 rashis) ── */}
      {/* <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={rd.chipStrip}
        contentContainerStyle={rd.chipContent}
      >
        {RASI_LIST.map(r => {
          const active = r.etitle === activeJcat;
          return (
            <TouchableOpacity
              key={r.etitle}
              style={[rd.chip, active && rd.chipActive]}
              onPress={() => goToRasi(r.etitle)}
              activeOpacity={0.75}
            >
              <Text style={[rd.chipText, active && rd.chipTextActive]}>{r.title}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView> */}

      {loading ? (
        <View style={rd.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={rd.loaderText}>ஏற்றுகிறது...</Text>
        </View>
      ) : (
        <>
          {/* ── Page title ── */}
          <Text style={rd.pageTitle}>{pageTitle}</Text>
          <View style={rd.dateRow}>
            {!!date && <Text style={rd.date}>{date}</Text>}

          </View>

          {/* ── Previous date row ── */}
          {!!prevDate && (
            <View style={rd.prevDateRow}>
              <Text style={rd.prevDateLabel}>முந்தய நாட்களின் ராசி</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={rd.datePickerBtn}>

                <View style={rd.prevDateBadge}>
                  <Ionicons name="calendar-outline" size={s(13)} color="#555" />
                  <Text style={rd.prevDateText}>{prevDate}</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}


          {/* ── Rasi : Palan ── */}
          {(!!rasiLabel || !!palan) && (
            <View style={rd.rasiPalanRow}>
              <View style={rd.greyDot} />
              <Text style={rd.rasiPalanText}>{rasiLabel}{palan ? ` : ${palan}` : ''}</Text>
            </View>
          )}


          {/* ── Image + side arrows ── */}
          <View style={rd.imageSection}>
            {/* ✅ left arrow → previous TAB */}
            <TouchableOpacity
              style={[rd.arrowBtn, rd.arrowLeft]}
              onPress={goToPrev}
              disabled={prevDisabled}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={s(24)} color={prevDisabled ? '#ccc' : '#333'} />
            </TouchableOpacity>

            {/* tap thumbnail → plays video in fullscreen Modal */}
            <View style={rd.imageWrap}>
              {/* <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={hasVideo ? 0.85 : 1}
                onPress={() => { if (hasVideo && videoUrl) setVideoPlaying(true); }}
              >
                <Image source={{ uri: imageUri }} style={rd.image} resizeMode="cover" />
                {hasVideo && (
                  <View style={rd.playOverlay}>
                    <View style={rd.playBtn}>
                      <Ionicons name="play" size={s(28)} color="#fff" />
                    </View>
                  </View>
                )}
              </TouchableOpacity> */}
              <VideoPlayerModal
                visible={hasVideo && videoPlaying}
                url={videoUrl}
                onClose={() => setVideoPlaying(false)}
              />
            </View>

            {/* ── Fullscreen video Modal ── */}


            {/* ✅ right arrow → next TAB */}
            <TouchableOpacity
              style={[rd.arrowBtn, rd.arrowRight]}
              onPress={goToNext}
              disabled={nextDisabled}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-forward" size={s(24)} color={nextDisabled ? '#ccc' : '#333'} />
            </TouchableOpacity>
          </View>

          {/* ── Share row ── */}
          <View style={rd.shareRow}>
            {[
              { icon: 'logo-facebook', bg: '#1877F2', onPress: () => Linking.openURL(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`) },
              { icon: 'logo-twitter', bg: '#000', onPress: () => Linking.openURL(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`) },
              { icon: 'logo-whatsapp', bg: '#25D366', onPress: () => Linking.openURL(`whatsapp://send?text=${encodeURIComponent(pageTitle + ' ' + shareUrl)}`) },
              { icon: 'paper-plane-outline', bg: '#2AABEE', onPress: () => Linking.openURL(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}`) },
              { icon: 'share-social-outline', bg: '#888', onPress: doShare },
              { icon: 'bookmark-outline', bg: '#fff', iconColor: '#888', border: true },
            ].map((item, i) => (
              <TouchableOpacity key={i} onPress={item.onPress} activeOpacity={0.7}>
                <View style={[rd.shareCircle, { backgroundColor: item.bg }, item.border && rd.shareCircleBorder]}>
                  <Ionicons name={item.icon} size={s(17)} color={item.iconColor || '#fff'} />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Rasi title underlined ── */}
          <View style={rd.rasiTitleWrap}>
            <Text style={rd.rasiTitleText}>{rasiLabel}</Text>
          </View>

          {/* ── Footnote paragraphs ── */}
          <View style={rd.footnoteWrap}>
            {paragraphs.length > 0 ? (
              paragraphs.map((p, i) =>
                p.bold ? null : (
                  <Text key={i} style={rd.paragraph}>{p.text}</Text>
                )
              )
            ) : (
              <View style={rd.emptyWrap}>
                <Ionicons name="star-outline" size={s(36)} color="#ccc" />
                <Text style={rd.emptyText}>விவரங்கள் இல்லை</Text>
              </View>
            )}
          </View>

          {/* ── Error ── */}
          {!!error && !footnoteHtml && (
            <View style={rd.errorRow}>
              <Text style={rd.errorText}>{error}</Text>
              <TouchableOpacity style={rd.retryBtn} onPress={() => fetchDetail(activeJcat)}>
                <Text style={rd.retryText}>மீண்டும் முயற்சி</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── மேலும் strip ── */}
          {/* <View style={rd.moreStrip}>
            <Text style={rd.moreText}>மேலும் {tabTitle} :</Text>
          </View> */}
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

const rd = StyleSheet.create({
  // Chip strip
  chipStrip: { backgroundColor: '#fff', maxHeight: vs(46), borderBottomWidth: 1, borderBottomColor: '#eee' },
  chipContent: { paddingHorizontal: s(8), alignItems: 'center', paddingVertical: vs(5), gap: s(5) },
  chip: { paddingHorizontal: s(12), paddingVertical: vs(5), borderRadius: s(20), backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: 'transparent' },
  chipActive: { backgroundColor: COLORS.primary + '18', borderColor: COLORS.primary },
  chipText: { fontSize: ms(12), fontFamily: FONTS.muktaMalar.regular, color: '#555' },
  chipTextActive: { color: COLORS.primary, fontWeight: '700' },

  // Loader
  loaderWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: vs(60), gap: vs(12) },
  loaderText: { fontSize: ms(14), color: '#888', fontFamily: FONTS.muktaMalar.regular },

  // Title / date
  pageTitle: { fontSize: ms(18), fontFamily: FONTS.anek.bold, color: '#111', fontWeight: '700', paddingHorizontal: s(12), paddingTop: vs(14), marginBottom: vs(4) },
  date: { fontSize: ms(13), color: '#888', fontFamily: FONTS.muktaMalar.regular },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: s(12), marginBottom: vs(10) },
  datePickerBtn: { padding: s(5) },

  // Prev date
  prevDateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: s(12), paddingVertical: vs(8), backgroundColor: '#f8f8f8', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee', marginBottom: vs(10) },
  prevDateLabel: { fontSize: ms(13), fontFamily: FONTS.muktaMalar.regular, color: '#444' },
  prevDateBadge: { flexDirection: 'row', alignItems: 'center', gap: s(5), backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', paddingHorizontal: s(8), paddingVertical: vs(4), borderRadius: s(4) },
  prevDateText: { fontSize: ms(12), fontFamily: FONTS.muktaMalar.regular, color: '#444' },

  // Rasi : Palan
  rasiPalanRow: { flexDirection: 'row', alignItems: 'center', gap: s(8), paddingHorizontal: s(12), marginBottom: vs(10), justifyContent: 'flex-end' },
  greyDot: { width: s(8), height: s(8), borderRadius: s(4), backgroundColor: '#888' },
  rasiPalanText: { fontSize: ms(13), fontFamily: FONTS.muktaMalar.bold, color: '#444', fontWeight: '600' },

  // Image + arrows
  imageSection: { flexDirection: 'row', alignItems: 'center' },
  arrowBtn: { width: s(32), alignItems: 'center', justifyContent: 'center', paddingVertical: vs(10) },
  arrowLeft: { paddingLeft: s(4) },
  arrowRight: { paddingRight: s(4) },
  imageWrap: { flex: 1, height: vs(140), overflow: 'hidden' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  playOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  playBtn: { width: s(56), height: s(56), borderRadius: s(28), backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', paddingLeft: s(3) },

  // Share
  shareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: vs(14), gap: s(14), borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  shareCircle: { width: s(36), height: s(36), borderRadius: s(18), alignItems: 'center', justifyContent: 'center' },
  shareCircleBorder: { borderWidth: 1, borderColor: '#ddd' },

  // Rasi title underlined
  rasiTitleWrap: { paddingHorizontal: s(12), paddingTop: vs(14), paddingBottom: vs(8) },
  rasiTitleText: { fontSize: ms(16), fontFamily: FONTS.muktaMalar.medium || FONTS.muktaMalar.bold, color: '#111', fontWeight: '700', textDecorationLine: 'underline' },

  // Footnote
  footnoteWrap: { paddingHorizontal: s(12), paddingTop: vs(4) },
  paragraph: { fontSize: ms(15), fontFamily: FONTS.muktaMalar.regular, color: '#333', lineHeight: ms(24), marginBottom: vs(10) },
  emptyWrap: { alignItems: 'center', paddingVertical: vs(40), gap: vs(10) },
  emptyText: { fontSize: ms(14), color: '#aaa', fontFamily: FONTS.muktaMalar.regular },

  // Error
  errorRow: { alignItems: 'center', paddingHorizontal: s(20), paddingVertical: vs(20), gap: vs(10) },
  errorText: { fontSize: ms(14), color: '#888', textAlign: 'center', fontFamily: FONTS.muktaMalar.regular },
  retryBtn: { paddingHorizontal: s(20), paddingVertical: vs(8), backgroundColor: COLORS.primary, borderRadius: s(6) },
  retryText: { color: '#fff', fontSize: ms(13), fontFamily: FONTS.muktaMalar.medium, fontWeight: '700' },

  // மேலும்
  moreStrip: { paddingHorizontal: s(12), paddingVertical: vs(14), borderTopWidth: 1, borderTopColor: '#eee', marginTop: vs(16) },
  moreText: { fontSize: ms(15), fontFamily: FONTS.muktaMalar.medium || FONTS.muktaMalar.bold, color: '#222', fontWeight: '700' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <View style={sk.card}>
      <View style={sk.image} />
      <View style={sk.body}>
        <View style={sk.line} />
        <View style={[sk.line, { width: '70%' }]} />
        <View style={[sk.line, { width: '40%', marginTop: vs(4) }]} />
      </View>
    </View>
  );
}
const sk = StyleSheet.create({
  card: { backgroundColor: '#fff', marginBottom: vs(8) },
  image: { width: '100%', height: vs(190), backgroundColor: '#e8e8e8' },
  body: { padding: s(12) },
  line: { height: vs(12), backgroundColor: '#e8e8e8', marginBottom: vs(6), width: '90%' },
});
// Section Title
// ─────────────────────────────────────────────────────────────────────────────
function SectionTitle({ title }) {
  const { sf } = useFontSize();

  return (
    <View style={st.sectionHeader}>
      <View style={st.titleContainer}>
        <Text style={[st.sectionTitle, { fontSize: sf(16) }]}>{title || ''}</Text>
        <View style={st.sectionUnderline} />
      </View>
    </View>
  );
}
const st = StyleSheet.create({
  sectionHeader: {
    // backgroundColor: PALETTE.white,
    // paddingHorizontal: s(12),
    // paddingTop: vs(14),
    paddingBottom: vs(10),
  },
  titleContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  sectionTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    color: PALETTE.grey800,
    // marginBottom: vs(2),
  },
  sectionUnderline: {
    height: vs(3),
    width: '20%',
    backgroundColor: PALETTE.primary,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Inline Video Component
// ─────────────────────────────────────────────────────────────────────────────
function InlineVideoPlayer({ url, style }) {
  if (!url) return null;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100%; height: 100%; background: #000; }
          iframe {
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 6px;
          }
        </style>
      </head>
      <body>
        <iframe
          src="${url}"
          allowfullscreen
          allow="autoplay; fullscreen"
        ></iframe>
      </body>
    </html>
  `;

  return (
    <WebView
      source={{ html }}
      style={style}
      allowsFullscreenVideo
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
    />
  );
}

// News Card (same as HomeScreen)
// ─────────────────────────────────────────────────────────────────────────────
function NewsCard({ item, onPress, sectionTitle = '' }) {
  const { sf } = useFontSize();

  const imageUri =
    item.largeimages || item.images || item.image || item.thumbnail || item.thumb ||
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';

  const title = item.newstitle || item.title || item.videotitle || item.name || '';
  const category = item.maincat || item.categrorytitle || item.ctitle || item.maincategory || sectionTitle || '';
  const ago = item.ago || item.time_ago || item.standarddate || item.date || '';
  const newscomment = item.newscomment || item.commentcount || item.nmcomment || item.comments?.total || '';
  const hasAudio = item.audio === 1 || item.audio === '1' || item.audio === true ||
    (typeof item.audio === 'string' && item.audio.length > 1 && item.audio !== '0');

  return (
    <View style={NewsCardStyles.wrap}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
        <View style={NewsCardStyles.imageWrap}>
          <Image
            source={{ uri: imageUri }}
            style={NewsCardStyles.image}
            resizeMode="contain"
          />
        </View>

        <View style={NewsCardStyles.contentContainer}>
          {!!title && (
            <Text style={[NewsCardStyles.title, { fontSize: sf(14), lineHeight: sf(22) }]} numberOfLines={3}>{title}</Text>
          )}

          {!!category && (
            <View style={NewsCardStyles.catPill}>
              <Text style={[NewsCardStyles.catText, { fontSize: sf(12) }]}>{category}</Text>
            </View>
          )}

          <View style={NewsCardStyles.metaRow}>
            <Text style={[NewsCardStyles.timeText, { fontSize: sf(12) }]}>{ago}</Text>
            <View style={NewsCardStyles.metaRight}>
              {hasAudio && (
                <View style={NewsCardStyles.audioIcon}>
                  <Ionicons name="volume-high" size={s(14)} color={PALETTE.grey700} />
                </View>
              )}

              {!!newscomment && newscomment !== '0' && (
                <View style={NewsCardStyles.commentRow}>
                  <Ionicons name="chatbox" size={s(14)} color={PALETTE.grey700} />
                  <Text style={[NewsCardStyles.commentText, { fontSize: sf(12) }]}> {newscomment}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <View style={NewsCardStyles.divider} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function extractList(d) {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.newlist)) {
    const fromSections = d.newlist.flatMap(s => (Array.isArray(s?.data) ? s.data : []));
    return fromSections.length ? fromSections : d.newlist;
  }
  if (d?.newlist?.data) return d.newlist.data;
  if (d?.newslist?.data) return d.newslist.data;
  if (d?.newdata?.data) return d.newdata.data;
  if (Array.isArray(d?.nrilist)) return d.nrilist;
  if (Array.isArray(d?.nrinewslist)) return d.nrinewslist;
  if (d?.nrilist?.data) return d.nrilist.data;
  if (Array.isArray(d?.newslist)) return d.newslist;
  if (Array.isArray(d?.speciallist)) return d.speciallist;
  if (d?.speciallist?.data) return d.speciallist.data;
  if (Array.isArray(d?.catlist)) return d.catlist;
  if (Array.isArray(d?.data)) return d.data;
  if (d?.data?.data) return d.data.data;
  if (Array.isArray(d?.list)) return d.list;
  const firstArray = Object.values(d).find(v => Array.isArray(v) && v.length > 0);
  if (firstArray) return firstArray;
  return [];
}

function extractLastPage(d) {
  return d?.newlist?.last_page || d?.newslist?.last_page || d?.newdata?.last_page || d?.data?.last_page || d?.last_page || 1;
}

const tabIsAll = (tab) => !!tab?._isAllTab;

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function CommonSectionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { sf } = useFontSize();

  const {
    screenTitle = 'தினம் தினம்',
    apiEndpoint = '/dinamdinam',
    allTabLink = '/dinamdinam',
    initialTabId,
    initialTabLink,
    useFullUrl = false,
  } = route.params || {};

  const [subTabs, setSubTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [allSections, setAllSections] = useState([]);
  const [htmlContent, setHtmlContent] = useState(null);

  const [tabNews, setTabNews] = useState([]);
  const [tabPage, setTabPage] = useState(1);
  const [tabLastPage, setTabLastPage] = useState(1);
  const [tabLoading, setTabLoading] = useState(false);
  const [tabLoadMore, setTabLoadMore] = useState(false);

  const [initLoading, setInitLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [taboolaAds, setTaboolaAds] = useState(null);

  // ── Inline rasi detail state ──────────────────────────────────────────────
  // When not null: shows RasiDetailView instead of the rasi card list
  const [rasiDetailItem, setRasiDetailItem] = useState(null);
  // { jcat, item } — item is the tapped card for instant display

  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isLocationDrawerVisible, setIsLocationDrawerVisible] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('உள்ளூர்');

  const flatListRef = useRef(null);
  const rasiScrollViewRef = useRef(null);

  const handleScroll = useCallback((e) => {
    setShowScrollTop(e.nativeEvent.contentOffset.y > 300);
  }, []);

  const isAllTab = tabIsAll(activeTab);

  // ── Fetch sub-tab paginated news ──────────────────────────────────────────
  const fetchTabNews = useCallback(async (tab, pg, append = false) => {
    if (!tab?.link || tabIsAll(tab)) return;
    try {
      const isRasiSubTab = RASI_TAB_IDS.includes(String(tab.id));
      let url = isRasiSubTab ? '/joshiyam' : tab.link;
      const sep = url.includes('?') ? '&' : '?';
      const fullUrl = `${url}${sep}page=${pg}`;
      const res = await CDNApi.get(fullUrl);
      const d = res?.data;

      let list = [];
      if (isRasiSubTab && d?.newlist?.[0]?.data) {
        list = d.newlist[0].data;
      } else {
        list = extractList(d).filter(Boolean);
      }
      const lp = extractLastPage(d);
      setTabLastPage(lp);
      setTabNews(prev => append ? [...prev, ...list] : list);
      setTabPage(pg);
    } catch (e) {
      console.error(`[fetchTabNews/${apiEndpoint}] error:`, e?.message);
    } finally {
      setTabLoading(false);
      setTabLoadMore(false);
      setRefreshing(false);
    }
  }, [apiEndpoint]);

  // ── Fetch main endpoint ────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      // Use different API based on useFullUrl flag
      const api = useFullUrl ? mainApi : CDNApi;
      const res = await api.get(apiEndpoint);
      const d = res?.data;

      // Check if response is HTML content (for static pages)
      if (typeof d === 'string' && d.includes('<html')) {
        setHtmlContent(d);
        setAllSections([]);
        setSubTabs([]);
        setActiveTab({ title: 'அனைத்தும்', link: apiEndpoint, _isAllTab: true });
        return;
      }

      // Reset HTML content if not HTML
      setHtmlContent(null);

      const tabs =
        d?.speciallist || d?.subcatlist || d?.catlist ||
        d?.tablist || d?.tabs || d?.categories || d?.catdata || [];
      setSubTabs(tabs);

      const rawSections =
        (Array.isArray(d?.newlist) ? d.newlist : null) ||
        (Array.isArray(d?.speciallist)
          ? d.speciallist.map(item => ({ title: item.title || '', id: item.id || '', data: Array.isArray(item.data) ? item.data : [item] }))
          : null) ||
        (Array.isArray(d?.newslist) ? d.newslist : null) ||
        (Array.isArray(d?.sectionlist) ? d.sectionlist : null) ||
        (Array.isArray(d?.sections) ? d.sections : null) ||
        (Array.isArray(d?.data) ? d.data : null) ||
        [];

      // Special handling for photodata API - if data is directly an array of items
      if (apiEndpoint.includes('photodata') && Array.isArray(d) && d.length > 0) {
        rawSections = [{ title: '', id: 'all', data: d }];
      }

      const sectionsWithData = rawSections.filter(sec => Array.isArray(sec?.data) && sec.data.length > 0);
      let finalSections = sectionsWithData;

      if (!finalSections.length && rawSections.length > 0) {
        const firstItem = rawSections[0];
        const isArticle = firstItem?.newsid || firstItem?.id || firstItem?.nid || firstItem?.newstitle || firstItem?.title || firstItem?.slug;
        if (isArticle) finalSections = [{ title: '', id: 'all', data: rawSections }];
      }

      if (apiEndpoint === '/joshiyam') {
        const RASI_TITLES = ['ராசிகள்', 'மேஷம்', 'ரிஷபம்', 'மிதுனம்', 'கடகம்', 'சிம்மம்', 'கன்னி', 'துலாபம்', 'விருச்சிகம்', 'தனுசு', 'மகரம்', 'கும்பம்', 'மீனம்'];
        finalSections = finalSections.filter(sec => {
          const t = (sec.title || '').toLowerCase().trim();
          return !RASI_TITLES.some(r => t.includes(r.toLowerCase()));
        });
      }

      setAllSections(finalSections);

      // Store mobile Taboola placements from the API
      setTaboolaAds(d?.taboola_ads?.mobile || null);

      if (initialTabId || initialTabLink) {
        const preselected = tabs.find(t =>
          (initialTabId && String(t.id) === String(initialTabId)) ||
          (initialTabLink && t.link === initialTabLink)
        );
        if (preselected) {
          const preIsAll = preselected.link === allTabLink;
          setActiveTab({ ...preselected, _isAllTab: preIsAll });
          if (!preIsAll) { setTabLoading(true); fetchTabNews(preselected, 1, false); }
          return;
        }
      }

      if (tabs.length > 0) {
        setActiveTab({ ...tabs[0], _isAllTab: true });
      } else if (finalSections.length > 0) {
        setActiveTab({ title: 'அனைத்தும்', link: apiEndpoint, _isAllTab: true });
      }
    } catch (e) {
      console.error(`[fetchAll/${apiEndpoint}] error:`, e?.message);
    } finally {
      setInitLoading(false);
      setRefreshing(false);
    }
  }, [apiEndpoint, allTabLink, initialTabId, initialTabLink, useFullUrl, fetchTabNews]);

  useFocusEffect(
    useCallback(() => {
      setInitLoading(true);
      setTabNews([]);
      setTabPage(1);
      setTabLastPage(1);
      setRasiDetailItem(null); // reset detail on focus
      fetchAll();
    }, [fetchAll])
  );

  // ── Tab press ──────────────────────────────────────────────────────────────
  const handleTabPress = (tab) => {
    const alreadyActive = activeTab
      ? (tabIsAll(tab) ? tabIsAll(activeTab) : String(activeTab.id) === String(tab.id))
      : false;
    if (alreadyActive) return;

    // Clear inline rasi detail when switching tabs
    setRasiDetailItem(null);

    const pressedIsAll = !!tab._isAllTab || tab.link === allTabLink;
    const nextTab = { ...tab, _isAllTab: pressedIsAll };

    setActiveTab(nextTab);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });

    if (pressedIsAll) {
      setTabNews([]); setTabPage(1); setTabLastPage(1);
      return;
    }
    setTabLoading(true);
    setTabNews([]); setTabPage(1); setTabLastPage(1);
    fetchTabNews(nextTab, 1, false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setRasiDetailItem(null);
    if (isAllTab) fetchAll();
    else fetchTabNews(activeTab, 1, false);
  };

  const handleLoadMore = () => {
    if (isAllTab) return;
    if (tabLoadMore || tabPage >= tabLastPage) return;
    setTabLoadMore(true);
    fetchTabNews(activeTab, tabPage + 1, true);
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goToArticle = (item) => {
    const isJoshiyamEndpoint = apiEndpoint === '/joshiyam';
    if (isJoshiyamEndpoint && isAllTab) {
      let targetTab = null;
      if (item.maincatid) {
        targetTab = subTabs.find(t => String(t.id) === String(item.maincatid));
        if (targetTab && item.maincat && targetTab.title !== item.maincat) targetTab = null;
      }
      if (!targetTab && item.maaincatid)
        targetTab = subTabs.find(t => String(t.id) === String(item.maaincatid));
      if (!targetTab && item.maincat)
        targetTab = subTabs.find(t => t.title === item.maincat);
      if (!targetTab && item.maincat)
        targetTab = subTabs.find(t => {
          const a = (item.maincat || '').toLowerCase();
          const b = (t.title || '').toLowerCase();
          return b.includes(a) || a.includes(b);
        });
      if (!targetTab && item.link)
        targetTab = subTabs.find(t => t.link === item.link && t.link !== allTabLink && !t._isAllTab);

      if (targetTab && targetTab.link !== allTabLink && !targetTab._isAllTab) {
        handleTabPress(targetTab);
        return;
      }
    }

    navigation.navigate('NewsDetailsScreen', {
      newsId: item.newsid || item.id || item.rasiid || item.nid,
      newsItem: item,
      slug: item.slug || item.reacturl || '',
      disableComments: apiEndpoint?.includes('api-st-cdn.dinamalar.com/varavaram'),
    });
  };

  // ── Rasi card tap → show inline detail ────────────────────────────────────
  const goToRasiDetails = (rasiItem) => {
    const jcat = rasiItem.etitle || rasiItem.jcat || rasiItem.id || rasiItem.slug || '';
    console.log('[goToRasiDetails] inline detail | jcat:', jcat);
    setRasiDetailItem({ jcat, item: rasiItem });
    rasiScrollViewRef.current?.scrollTo({ y: 0, animated: false });
  };

  const goToSearch = () => navigation.navigate('SearchScreen');

  const handleSelectDistrict = (district) => {
    setSelectedDistrict(district.title);
    setIsLocationDrawerVisible(false);
    if (district.id) {
      navigation?.navigate('DistrictNewsScreen', {
        districtId: district.id,
        districtTitle: district.title,
      });
    }
  };

  // ── Build flat list data ───────────────────────────────────────────────────
  const buildFlatData = () => {
    if (isAllTab) {
      const flat = [];
      allSections.forEach(section => {
        if (section.title) flat.push({ type: 'section', title: section.title, id: section.id });
        (section.data || []).forEach(item => flat.push({ type: 'news', item, sectionTitle: section.title }));
      });
      return flat;
    }
    const isRasiData = RASI_TAB_IDS.includes(String(activeTab?.id));
    if (isRasiData) {
      const isIndividualRasi = tabNews.length === 1 && tabNews[0]?.rasi;
      if (isIndividualRasi) return tabNews.map((item, i) => ({ type: 'individualRasi', item, _idx: i }));
      return tabNews.map((item, i) => ({ type: 'rasi', item, _idx: i }));
    }
    return tabNews.map((item, i) => ({ type: 'news', item, sectionTitle: activeTab?.title || '', _idx: i }));
  };

  const flatData = buildFlatData();
  const isLoading = initLoading || tabLoading;
  const isRasiTab = !isAllTab && RASI_TAB_IDS.includes(String(activeTab?.id));

  const isTabActive = (tab) => {
    if (!activeTab) return false;
    if (tabIsAll(tab) || tab.link === allTabLink) return tabIsAll(activeTab);
    return String(activeTab.id) === String(tab.id);
  };

  const renderItem = ({ item: row }) => {
    if (row.type === 'section')
      return <View style={styles.sectionWrap}><SectionTitle title={row.title} /></View>;
    if (row.type === 'rasi' || row.type === 'individualRasi')
      return <RasiCard item={row.item} onPress={() => goToRasiDetails(row.item)} />;
    return <NewsCard
      item={row.item}
      onPress={() => goToArticle(row.item)}
      sectionTitle={row.sectionTitle || ''}
    />;
  };

  const scrollToTop = useCallback(() => {
    rasiScrollViewRef.current?.scrollTo({ y: 0, animated: true });
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <UniversalHeaderComponent
        showMenu showSearch showNotifications showLocation
        onSearch={goToSearch}
        onLocation={() => setIsLocationDrawerVisible(true)}
        selectedDistrict={selectedDistrict}
        navigation={navigation}
        isDrawerVisible={isDrawerVisible}
        setIsDrawerVisible={setIsDrawerVisible}
        isLocationDrawerVisible={isLocationDrawerVisible}
        setIsLocationDrawerVisible={setIsLocationDrawerVisible}
        handleSelectDistrict={handleSelectDistrict}
      >
        <AppHeaderComponent
          onSearch={goToSearch}
          onMenu={() => setIsDrawerVisible(true)}
          onLocation={() => setIsLocationDrawerVisible(true)}
          selectedDistrict={selectedDistrict}
        />
      </UniversalHeaderComponent>

      {/* ── Page Title ── */}
      <View style={styles.pageTitleWrap}>
        <Text style={[styles.pageTitle, { fontSize: sf(16) }]}>{screenTitle}</Text>
      </View>

      {/* ── Tabs ── */}
      {subTabs.length > 0 && (
        <View style={styles.tabsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {subTabs.map((tab, index) => {
              const active = isTabActive(tab);
              return (
                <TouchableOpacity
                  key={`tab-${tab.id != null ? tab.id : 'all-' + index}`}
                  style={[styles.tab, active && styles.tabActive]}
                  onPress={() => handleTabPress(tab)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive, { fontSize: sf(14) }]}>
                    {tab.title || ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <View style={styles.tabsBottomLine} />
        </View>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={i => `sk-${i}`}
          renderItem={() => <SkeletonCard />}
          contentContainerStyle={styles.listContent}
          style={styles.list}
        />
      ) : htmlContent ? (
        // Static page HTML content
        <WebView
          source={{ html: htmlContent, baseUrl: 'https://www.dinamalar.com' }}
          style={styles.webView}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.webViewLoader}>
              <ActivityIndicator size="large" color={PALETTE.primary} />
            </View>
          )}
        />
      ) : isRasiTab && rasiDetailItem ? (
        // ✅ INLINE RASI DETAIL — shown below the tabs, same screen
        // ✅ subTabs + onTabChange passed for arrow tab navigation
        <RasiDetailView
          key={`${activeTab?.id}-${rasiDetailItem.jcat}`}
          tabId={String(activeTab?.id || '')}
          tabTitle={activeTab?.title || screenTitle}
          initialJcat={rasiDetailItem.jcat}
          initialItem={rasiDetailItem.item}
          onBack={() => setRasiDetailItem(null)}
          subTabs={subTabs}
          onTabChange={(tab) => handleTabPress(tab)}
        />
      ) : isRasiTab ? (
        // Rasi card list
        <ScrollView
          ref={rasiScrollViewRef}
          style={styles.list}
          contentContainerStyle={styles.rasiGridContent}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh}
              colors={[COLORS.primary]} tintColor={COLORS.primary} />
          }
        >
          {flatData.map((row, index) => (
            <RasiCard
              key={row.item?.id || index}
              item={row.item}
              onPress={() => goToRasiDetails(row.item)}
            />
          ))}
        </ScrollView>
      ) : (
        <FlatList
          ref={flatListRef}
          data={flatData}
          keyExtractor={(row, i) =>
            row.type === 'section'
              ? `sec-${row.id || i}-${row.title}`
              : `news-${i}-${row.item?.newsid || row.item?.id || row.item?.rasiid || i}`
          }
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          style={styles.list}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh}
              colors={[COLORS.primary]} tintColor={COLORS.primary} />
          }
          ListHeaderComponent={
            taboolaAds?.midmain ? (
              <TaboolaWidget
                pageUrl={`https://www.dinamalar.com${apiEndpoint}`}
                mode={taboolaAds.midmain.mode}
                container={taboolaAds.midmain.container}
                placement={taboolaAds.midmain.placement}
                targetType="mix"
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="newspaper-outline" size={s(48)} color="#ccc" />
              <Text style={[styles.emptyText, { fontSize: sf(15) }]}>செய்திகள் இல்லை</Text>
            </View>
          }
          ListFooterComponent={
            <>
              {taboolaAds?.midmain && (
                <TaboolaWidget
                  pageUrl={`https://www.dinamalar.com${apiEndpoint}`}
                  mode={taboolaAds.midmain.mode}
                  container={`${taboolaAds.midmain.container}_footer`}
                  placement={taboolaAds.midmain.placement}
                  targetType="mix"
                />
              )}
              {tabLoadMore
                ? <View style={styles.footerLoader}><ActivityIndicator size="small" color={COLORS.primary} /></View>
                : <View style={{ height: vs(40) }} />}
            </>
          }
        />
      )}

      {/* ── Scroll To Top ── */}
      {showScrollTop && !rasiDetailItem && (
        <TouchableOpacity style={styles.scrollTopBtn} onPress={scrollToTop} activeOpacity={0.8}>
          <Ionicons name="arrow-up" size={s(20)} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2', paddingTop: Platform.OS === 'android' ? vs(28) : 0 },
  pageTitleWrap: { paddingTop: vs(14), paddingBottom: vs(6), backgroundColor: '#fff' },
  pageTitle: { fontSize: 18, fontFamily: FONTS.anek.bold, color: '#111', fontWeight: '700', paddingHorizontal: s(12), paddingTop: vs(14), marginBottom: vs(4) }, // ← Will be scaled dynamically

  tabsWrap: { backgroundColor: '#fff', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: vs(1) }, shadowOpacity: 0.08, shadowRadius: s(2) },
  tabsContent: { paddingHorizontal: s(4), alignItems: 'center' },
  tab: { paddingHorizontal: s(12), paddingVertical: vs(12), marginHorizontal: s(2), borderBottomWidth: vs(3), borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: TEXT_STYLES.tabs.small,

  tabTextActive: TEXT_STYLES.tabs.smallActive,

  list: { flex: 1 },
  listContent: { paddingTop: vs(6), paddingBottom: vs(30) },
  rasiGridContent: { flexDirection: 'column', paddingBottom: vs(30) },
  webView: { flex: 1 },
  webViewLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  },

  sectionWrap: { paddingHorizontal: s(12), paddingTop: vs(16), paddingBottom: vs(4), backgroundColor: '#f2f2f2' },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: vs(80), gap: vs(12) },
  emptyText: { fontSize: ms(15), fontFamily: FONTS.muktaMalar.medium, color: '#aaa' },
  footerLoader: { paddingVertical: vs(20), alignItems: 'center' },

  scrollTopBtn: {
    position: 'absolute', bottom: vs(20), right: s(16),
    backgroundColor: COLORS.primary, padding: s(10), borderRadius: s(30),
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: vs(2) }, shadowOpacity: 0.2, shadowRadius: s(4),
  },
});