/**
 * RasiDetailScreen.js
 *
 * UI matches the Dinamalar website rasi detail page exactly.
 * Shows: title, date, prev-date badge, rasi:palan label,
 *        large image with play button, share row,
 *        rasi title (underlined), nakshatra-wise footnote paragraphs,
 *        left/right prev-next arrows, "மேலும்" footer strip.
 *
 * Route params:
 *   detailEndpoint  — e.g. '/todayrasidata'
 *   tabId           — e.g. 'todayrasi'
 *   jcat            — e.g. 'mesham'
 *   rasiItem        — full card object (for instant display before API loads)
 *   tabTitle        — e.g. 'இன்றைய ராசி'
 *   rasiTitle       — e.g. 'மேஷம்'
 *   rasiIcon        — icon image URL
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CDNApi } from '../config/api';
import { ms, s, vs } from '../utils/scaling';
import { COLORS, FONTS } from '../utils/constants';

const { width: SW } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────────────────────
// Zoom configuration (same as NewsDetailsScreen)
// ─────────────────────────────────────────────────────────────────────────────
const FONT_STEPS = [
  { key: 'very-small', label: 'மிகச்சம்',  size: ms(12) },
  { key: 'small',      label: 'சிறியது', size: ms(14) },
  { key: 'medium',     label: 'இடைத்தி', size: ms(16) },
  { key: 'large',      label: 'பெரியது', size: ms(18) },
  { key: 'very-large', label: 'மிகப்பெரியது', size: ms(20) },
];

const DEFAULT_STEP = 2; // Large (index 2)
const LINE_HEIGHT_RATIO = 1.6;

const TEXT_COLORS = [
  { key: 'default', color: '#333333', border: '#333333', textColor: '#333333' },
  { key: 'sepia',   color: '#5B4636', border: '#5B4636', textColor: '#5B4636' },
  { key: 'blue',    color: '#1E40AF', border: '#1E40AF', textColor: '#1E40AF' },
  { key: 'green',   color: '#059669', border: '#059669', textColor: '#059669' },
  { key: 'red',     color: '#B71C1C', border: '#B71C1C', textColor: '#B71C1C'     },
];

// ─────────────────────────────────────────────────────────────────────────────
// Endpoint map
// ─────────────────────────────────────────────────────────────────────────────
const ENDPOINT_MAP = {
  todayrasi:                  '/todayrasidata',
  weeklyrasi:                 '/weeklyrasiupdate',
  monthlyrasipplan:           '/monthlyrasi',
  guru_pairchi_palangal:      '/gurupeyerchi',
  sani_pairchi_palangal:      '/sanipeyerchi',
  ragu_guru_pairchi_palangal: '/rahukethupeyerchi',
  new_year:                   '/tamilnewyear',
  englishnewyear:             '/englishnewyear',
};

// ─────────────────────────────────────────────────────────────────────────────
// 12 Rasi list
// ─────────────────────────────────────────────────────────────────────────────
const RASI_LIST = [
  { etitle: 'mesham',     title: 'மேஷம்' },
  { etitle: 'rishabam',   title: 'ரிஷபம்' },
  { etitle: 'mithunam',   title: 'மிதுனம்' },
  { etitle: 'kadakam',    title: 'கடகம்' },
  { etitle: 'simmam',     title: 'சிம்மம்' },
  { etitle: 'kanni',      title: 'கன்னி' },
  { etitle: 'thulam',     title: 'துலாம்' },
  { etitle: 'viruchigam', title: 'விருச்சிகம்' },
  { etitle: 'thanusu',    title: 'தனுசு' },
  { etitle: 'makaram',    title: 'மகரம்' },
  { etitle: 'kumbam',     title: 'கும்பம்' },
  { etitle: 'meenam',     title: 'மீனம்' },
];

// ─────────────────────────────────────────────────────────────────────────────
// HTML helpers
// ─────────────────────────────────────────────────────────────────────────────
function stripHtml(html = '') {
  return html
    .replace(/<[^>]*>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Parses the footnote HTML into an array of paragraphs.
 * Each paragraph is { bold: bool, text: string }
 * Bold = nakshatra/rasi header lines (from <b> tags)
 */
function parseFootnoteParagraphs(html = '') {
  if (!html) return [];

  // Replace <br> with newlines first
  const normalized = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi,    '\n')
    .replace(/<div[^>]*>/gi, '');

  // Split by bold tags to separate headers vs body
  const parts = [];
  const boldRe = /<b>([\s\S]*?)<\/b>/gi;
  let last = 0;
  let match;

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

  // Expand each non-bold part into individual paragraph lines
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
// Share row icons
// ─────────────────────────────────────────────────────────────────────────────
function ShareRow({ url = '', title = '' }) {
  const share = async () => {
    try { await Share.share({ message: `${title} ${url}` }); } catch (_) {}
  };

  const openFb  = () => Linking.openURL(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
  const openTw  = () => Linking.openURL(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`);
  const openWa  = () => Linking.openURL(`whatsapp://send?text=${encodeURIComponent(title + ' ' + url)}`);
  const openTg  = () => Linking.openURL(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`);

  return (
    <View style={sr.row}>
      <TouchableOpacity style={sr.btn} onPress={openFb} activeOpacity={0.7}>
        <View style={[sr.circle, { backgroundColor: '#1877F2' }]}>
          <Ionicons name="logo-facebook" size={s(18)} color="#fff" />
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={sr.btn} onPress={openTw} activeOpacity={0.7}>
        <View style={[sr.circle, { backgroundColor: '#000' }]}>
          <Ionicons name="logo-twitter" size={s(16)} color="#fff" />
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={sr.btn} onPress={openWa} activeOpacity={0.7}>
        <View style={[sr.circle, { backgroundColor: '#25D366' }]}>
          <Ionicons name="logo-whatsapp" size={s(18)} color="#fff" />
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={sr.btn} onPress={openTg} activeOpacity={0.7}>
        <View style={[sr.circle, { backgroundColor: '#2AABEE' }]}>
          <Ionicons name="paper-plane-outline" size={s(16)} color="#fff" />
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={sr.btn} onPress={share} activeOpacity={0.7}>
        <View style={[sr.circle, { backgroundColor: '#888' }]}>
          <Ionicons name="share-social-outline" size={s(16)} color="#fff" />
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={sr.btn} activeOpacity={0.7}>
        <View style={[sr.circle, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' }]}>
          <Ionicons name="bookmark-outline" size={s(16)} color="#888" />
        </View>
      </TouchableOpacity>
    </View>
  );
}
const sr = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: vs(14), gap: s(14), borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  btn:    { alignItems: 'center', justifyContent: 'center' },
  circle: { width: s(36), height: s(36), borderRadius: s(18), alignItems: 'center', justifyContent: 'center' },
});

// ─────────────────────────────────────────────────────────────────────────────
// TextSizePanel component (same as NewsDetailsScreen)
// ─────────────────────────────────────────────────────────────────────────────
function TextSizePanel({ stepIndex, onDecrease, onIncrease, textColorKey, onTextColor }) {
  const canDec = stepIndex > 0;
  const canInc = stepIndex < FONT_STEPS.length - 1;

  return (
    <View style={ts.toolbar}>
      {/* Left label */}
      <Text style={ts.toolbarLabel}>{'நிறம் மற்றும்\nஎழுத்துரு அளவு\nமாற்ற'}</Text>

      {/* Text color swatches */}
      <View style={ts.toolbarSwatches}>
        {TEXT_COLORS.map((item) => (
          <TouchableOpacity
            key={item.key}
            onPress={() => onTextColor(item.key)}
            activeOpacity={0.8}
            style={[
              ts.toolbarSwatch,
              { backgroundColor: item.color, borderColor: item.border },
              textColorKey === item.key && ts.toolbarSwatchActive,
            ]}
          />
        ))}
      </View>

      {/* Zoom OUT — −அ in a circle */}
      <TouchableOpacity
        style={[ts.toolbarZoomBtn, !canDec && ts.toolbarZoomBtnDisabled]}
        onPress={onDecrease}
        disabled={!canDec}
        activeOpacity={0.7}
      >
        <Text style={[ts.toolbarZoomA, ts.toolbarZoomASmall, !canDec && ts.toolbarZoomDisabledTxt]}>
          {'−அ'}
        </Text>
      </TouchableOpacity>

      {/* Zoom IN — +அ in a circle */}
      <TouchableOpacity
        style={[ts.toolbarZoomBtn, !canInc && ts.toolbarZoomBtnDisabled]}
        onPress={onIncrease}
        disabled={!canInc}
        activeOpacity={0.7}
      >
        <Text style={[ts.toolbarZoomA, ts.toolbarZoomALarge, !canInc && ts.toolbarZoomDisabledTxt]}>
          {'+அ'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const ts = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    gap: s(8),
  },
  toolbarLabel: {
    fontSize: ms(11),
    color: '#6c757d',
    fontFamily: FONTS.muktaMalar.bold,
    flex: 1,
    textAlign: 'left',
  },
  toolbarSwatches: {
    flexDirection: 'row',
    gap: s(6),
  },
  toolbarSwatch: {
    width: s(20),
    height: s(20),
    borderRadius: s(10),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  toolbarSwatchActive: {
    borderWidth: 3,
  },
  toolbarZoomBtn: {
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarZoomBtnDisabled: {
    backgroundColor: '#f8f9fa',
    borderColor: '#dee2e6',
  },
  toolbarZoomA: {
    fontSize: ms(14),
    fontFamily: FONTS.muktaMalar.bold,
    color: '#495057',
  },
  toolbarZoomASmall: {
    fontSize: ms(12),
  },
  toolbarZoomALarge: {
    fontSize: ms(16),
  },
  toolbarZoomDisabledTxt: {
    color: '#adb5bd',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function RasiDetailScreen() {
  const navigation = useNavigation();
  const route      = useRoute();

  const {
    detailEndpoint,
    tabId      = '',
    jcat       = 'mesham',
    rasiItem:  initialItem,
    tabTitle   = '',
    rasiTitle  = '',
  } = route.params || {};

  const [detail,     setDetail]     = useState(initialItem || null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [activeJcat, setActiveJcat] = useState(jcat || 'mesham');

  // ── Zoom state ──────────────────────────────────────────────────────
  const [stepIndex, setStepIndex] = useState(2); // Default to Large
  const [textColorKey, setTextColorKey] = useState('default');

  const scrollRef = useRef(null);

  const currentIdx  = RASI_LIST.findIndex(r => r.etitle === activeJcat);
  const currentRasi = RASI_LIST[currentIdx] || RASI_LIST[0];

  // ── Resolve endpoint ───────────────────────────────────────────────────────
  const resolvedEndpoint = detailEndpoint || ENDPOINT_MAP[tabId] || '';

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchDetail = useCallback(async (targetJcat) => {
    if (!resolvedEndpoint || !targetJcat) {
      console.warn('[RasiDetailScreen] missing endpoint or jcat', { resolvedEndpoint, targetJcat });
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const url = `${resolvedEndpoint}?jcat=${targetJcat}`;
      console.log('[RasiDetailScreen] fetching:', url);
      const res = await CDNApi.get(url);
      const d   = res?.data;
      console.log('[RasiDetailScreen] keys:', Object.keys(d || {}));

      // The API returns: { newlist: { title, id, data: [ {...rasidata} ] } }
      // OR flat shapes — handle all
      const item =
        d?.newlist?.data?.[0]   ||   // ✅ PRIMARY: { newlist: { data: [...] } }
        d?.detaildata?.[0]      ||
        d?.rasidetail?.[0]      ||
        d?.rasidata?.[0]        ||
        d?.detail?.[0]          ||
        (Array.isArray(d?.data)    ? d.data[0]    : null) ||
        (Array.isArray(d?.newlist) ? d.newlist[0] : null) ||
        (Array.isArray(d)          ? d[0]         : null) ||
        null;

      if (item) {
        setDetail(item);
      } else {
        // Fallback: use root object if it has footnote
        setDetail(d?.footnote ? d : (initialItem || null));
      }
    } catch (e) {
      console.error('[RasiDetailScreen] error:', e?.message);
      setError('தகவல் ஏற்ற முடியவில்லை.');
      if (initialItem) setDetail(initialItem);
    } finally {
      setLoading(false);
    }
  }, [resolvedEndpoint, initialItem]);

  useEffect(() => {
    fetchDetail(activeJcat);
  }, [activeJcat]);

  // ── Rasi navigation ────────────────────────────────────────────────────────
  const goToRasi = (etitle) => {
    setActiveJcat(etitle);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };
  const goToPrev = () => { if (currentIdx > 0)                     goToRasi(RASI_LIST[currentIdx - 1].etitle); };
  const goToNext = () => { if (currentIdx < RASI_LIST.length - 1)  goToRasi(RASI_LIST[currentIdx + 1].etitle); };

  // ── Zoom functions ──────────────────────────────────────────────────────
  const decreaseStep = () => { if (stepIndex > 0) setStepIndex(p => p - 1); };
  const increaseStep = () => { if (stepIndex < FONT_STEPS.length - 1) setStepIndex(p => p + 1); };
  const canDec = stepIndex > 0;
  const canInc = stepIndex < FONT_STEPS.length - 1;

  // ── Calculate dynamic values before styles ──────────────────────────────────────────────
  const fontSize = FONT_STEPS[stepIndex].size;
  const activeTextClr = TEXT_COLORS.find(c => c.key === textColorKey)?.color || '#333';

  // ── Styles object with fontSize available ──────────────────────────────────────────────
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: s(14),
      paddingVertical: vs(8),
      backgroundColor: '#f8f9fa',
      borderBottomWidth: 1,
      borderBottomColor: '#e9ecef',
    },
    backBtn: {
      padding: s(8),
    },
    headerTitle: {
      fontSize: ms(16),
      fontFamily: FONTS.bold,
      color: '#333',
      flex: 1,
      textAlign: 'center',
    },
    rasiStrip: {
      paddingVertical: vs(8),
    },
    rasiStripContent: {
      paddingHorizontal: s(14),
    },
    rasiChip: {
      paddingVertical: vs(4),
      paddingHorizontal: s(8),
      borderRadius: s(8),
      backgroundColor: '#f8f9fa',
      marginRight: s(8),
    },
    rasiChipActive: {
      backgroundColor: '#fff',
      borderColor: '#333',
      borderWidth: 1,
    },
    rasiChipText: {
      fontSize: ms(12),
      fontFamily: FONTS.regular,
      color: '#333',
    },
    rasiChipTextActive: {
      color: '#333',
      fontWeight: 'bold',
    },
    loaderWrap: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loaderText: {
      fontSize: ms(12),
      fontFamily: FONTS.regular,
      color: '#333',
      marginTop: vs(8),
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingVertical: vs(8),
      paddingHorizontal: s(14),
    },
    pageTitle: {
      fontSize: ms(16),
      fontFamily: FONTS.bold,
      color: '#333',
      marginBottom: vs(4),
    },
    date: {
      fontSize: ms(12),
      fontFamily: FONTS.regular,
      color: '#666',
      marginBottom: vs(8),
    },
    prevDateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: vs(8),
    },
    prevDateLabel: {
      fontSize: ms(12),
      fontFamily: FONTS.regular,
      color: '#666',
      marginRight: s(8),
    },
    prevDateBadge: {
      paddingVertical: vs(2),
      paddingHorizontal: s(8),
      borderRadius: s(8),
      backgroundColor: '#f8f9fa',
      borderColor: '#333',
      borderWidth: 1,
    },
    prevDateText: {
      fontSize: ms(12),
      fontFamily: FONTS.regular,
      color: '#333',
    },
    rasiPalanRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: vs(8),
    },
    greyDot: {
      width: s(4),
      height: s(4),
      borderRadius: s(2),
      backgroundColor: '#ccc',
      marginRight: s(8),
    },
    rasiPalanText: {
      fontSize: ms(12),
      fontFamily: FONTS.regular,
      color: '#666',
    },
    imageSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: vs(8),
    },
    arrowBtn: {
      padding: s(8),
    },
    arrowLeft: {
      marginRight: s(8),
    },
    arrowRight: {
      marginLeft: s(8),
    },
    imageWrap: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: s(8),
      overflow: 'hidden',
    },
    image: {
      flex: 1,
    },
    playOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    playBtn: {
      padding: s(8),
      borderRadius: s(8),
      backgroundColor: '#fff',
    },
    shareRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: vs(8),
    },
    rasiTitleWrap: {
      marginBottom: vs(8),
    },
    rasiTitleText: {
      fontSize: ms(16),
      fontFamily: FONTS.bold,
      color: '#333',
    },
    rasiTitleUnderline: {
      height: 1,
      backgroundColor: '#333',
    },
    footnoteWrap: {
      marginBottom: vs(8),
    },
    paragraph: {
      fontFamily: FONTS.regular,
      marginBottom: vs(8),
    },
    emptyText: {
      fontSize: ms(12),
      fontFamily: FONTS.regular,
      color: '#666',
      marginTop: vs(8),
    },
    errorRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: vs(8),
    },
    errorText: {
      fontSize: ms(12),
      fontFamily: FONTS.regular,
      color: '#666',
    },
    retryBtn: {
      padding: s(8),
      borderRadius: s(8),
      backgroundColor: '#fff',
      borderColor: '#333',
      borderWidth: 1,
    },
    retryText: {
      fontSize: ms(12),
      fontFamily: FONTS.regular,
      color: '#333',
    },
    moreStrip: {
      paddingVertical: vs(8),
      paddingHorizontal: s(14),
      backgroundColor: '#f8f9fa',
      borderColor: '#333',
      borderWidth: 1,
    },
    moreText: {
      fontSize: ms(12),
      fontFamily: FONTS.regular,
      color: '#666',
    },
  });

  // const activeTextClr = TEXT_COLORS.find(c => c.key === textColorKey)?.color || '#333';

  // ── Derived display values ─────────────────────────────────────────────────
  const pageTitle   = `${tabTitle} : ${currentRasi.title}`;
  const date        = detail?.standarddate || detail?.date || '';
  const prevDate    = detail?.previousdate || detail?.prevdate || '';
  const palan       = detail?.palan        || '';     // e.g. "தனம்"
  const rasiLabel   = detail?.rasi         || currentRasi.title;
  const footnoteHtml = detail?.footnote    || '';
  const paragraphs  = parseFootnoteParagraphs(footnoteHtml);
  const hasVideo    = detail?.video && detail.video !== '0';

  const imageUri =
    detail?.largeimages ||
    detail?.images      ||
    detail?.icon        ||
    initialItem?.largeimages ||
    initialItem?.icon   ||
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';

  const shareUrl = detail?.slug
    ? `https://www.dinamalar.com${detail.slug}`
    : `https://www.dinamalar.com/astrology`;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={s(22)} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{tabTitle || 'ராசிபலன்'}</Text>
      </View>

      {/* ── Rasi tab strip ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.rasiStrip}
        contentContainerStyle={styles.rasiStripContent}
      >
        {RASI_LIST.map(r => {
          const active = r.etitle === activeJcat;
          return (
            <TouchableOpacity
              key={r.etitle}
              style={[styles.rasiChip, active && styles.rasiChipActive]}
              onPress={() => goToRasi(r.etitle)}
              activeOpacity={0.75}
            >
              <Text style={[styles.rasiChipText, active && styles.rasiChipTextActive]}>
                {r.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Main content ── */}
      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderText}>ஏற்றுகிறது...</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Page title ── */}
          <Text style={styles.pageTitle}>{pageTitle}</Text>

          {/* ── Date ── */}
          {!!date && <Text style={styles.date}>{date}</Text>}

          {/* ── Previous date badge ── */}
          {!!prevDate && (
            <View style={styles.prevDateRow}>
              <Text style={styles.prevDateLabel}>முந்தய நாட்களின் ராசி</Text>
              <View style={styles.prevDateBadge}>
                <Ionicons name="calendar-outline" size={s(13)} color="#555" />
                <Text style={styles.prevDateText}>{prevDate}</Text>
              </View>
            </View>
          )}

          {/* ── Rasi : Palan label ── */}
          {(!!rasiLabel || !!palan) && (
            <View style={styles.rasiPalanRow}>
              <View style={styles.greyDot} />
              <Text style={styles.rasiPalanText}>
                {rasiLabel}{palan ? ` : ${palan}` : ''}
              </Text>
            </View>
          )}

          {/* ── Image with left/right arrows + play button ── */}
          <View style={styles.imageSection}>
            {/* Left arrow */}
            <TouchableOpacity
              style={[styles.arrowBtn, styles.arrowLeft]}
              onPress={goToPrev}
              disabled={currentIdx === 0}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={s(22)} color={currentIdx === 0 ? '#ccc' : '#333'} />
            </TouchableOpacity>

            {/* Image */}
            <View style={styles.imageWrap}>
              <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
              {hasVideo && (
                <View style={styles.playOverlay}>
                  <View style={styles.playBtn}>
                    <Ionicons name="play" size={s(28)} color="#fff" />
                  </View>
                </View>
              )}
            </View>

            {/* Right arrow */}
            <TouchableOpacity
              style={[styles.arrowBtn, styles.arrowRight]}
              onPress={goToNext}
              disabled={currentIdx === RASI_LIST.length - 1}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-forward" size={s(22)}
                color={currentIdx === RASI_LIST.length - 1 ? '#ccc' : '#333'} />
            </TouchableOpacity>
          </View>

          {/* ── Share row ── */}
          {/* <ShareRow url={shareUrl} title={pageTitle} /> */}

          {/* ── Rasi title with underline ── */}
          <View style={styles.rasiTitleWrap}>
            <Text style={styles.rasiTitleText}>{rasiLabel}</Text>
            <View style={styles.rasiTitleUnderline} />
          </View>

          {/* ── Text Size Panel (zoom in / zoom out) ─────────────────────── */}
          {paragraphs.length > 0 && (
            <TextSizePanel
              stepIndex={stepIndex}
              onDecrease={decreaseStep}
              onIncrease={increaseStep}
              textColorKey={textColorKey}
              onTextColor={setTextColorKey}
            />
          )}

          {/* ── Footnote paragraphs ── */}
          {paragraphs.length > 0 ? (
            <View style={styles.footnoteWrap}>
              {paragraphs.map((p, i) => (
                p.bold ? (
                  // Bold = nakshatra/section header — shown inline before body
                  null
                ) : (
                  <Text key={i} style={[styles.paragraph, {
                    fontSize: fontSize,
                    color: activeTextClr,
                    lineHeight: fontSize * LINE_HEIGHT_RATIO,
                  }]}>{p.text}</Text>
                )
              ))}
            </View>
          ) : !loading && (
            <View style={styles.emptyWrap}>
              <Ionicons name="star-outline" size={s(36)} color="#ccc" />
              <Text style={styles.emptyText}>விவரங்கள் இல்லை</Text>
            </View>
          )}

          {/* ── Error message (non-blocking, shown below content) ── */}
          {!!error && !footnoteHtml && (
            <View style={styles.errorRow}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => fetchDetail(activeJcat)} style={styles.retryBtn}>
                <Text style={styles.retryText}>மீண்டும் முயற்சி</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── "மேலும்" footer strip ── */}
          <View style={styles.moreStrip}>
            <Text style={styles.moreText}>மேலும் {tabTitle} :</Text>
          </View>

          <View style={{ height: vs(40) }} />
        </ScrollView>
      )}
    </View>
  );
}