import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  PanResponder,
  Platform,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SpeakerIcon } from '../assets/svg/Icons';
import { Comment } from '../assets/svg/Icons';
import CommentsModal from '../components/CommentsModal';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { mainApi, CDNApi } from '../config/api';
import { ms, s, vs } from '../utils/scaling';
import { COLORS, FONTS, NewsCard as NewsCardStyles } from '../utils/constants';
import TEXT_STYLES from '../utils/textStyles';
import { useFontSize } from '../context/FontSizeContext';
import { WebView } from 'react-native-webview';
import DateTimePicker from '@react-native-community/datetimepicker';
import VideoPlayerModal from '../components/VideoPlayerModal';
import RenderHtml from 'react-native-render-html';

// -- Taboola publisher ID for mobile (from your website TaboolaScript.js) ------
const TABOOLA_PUBLISHER_ID = 'mdinamalarcom';

// --- Taboola Widget -----------------------------------------------------------
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
import { PhotoGallery } from '../assets/svg/Icons';
import { Ionicons } from '@expo/vector-icons';
 
// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
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
  { etitle: 'viruchigam', title: 'விருசிகம்' },
  { etitle: 'thanusu', title: 'தனுசு' },
  { etitle: 'makaram', title: 'மகரம்' },
  { etitle: 'kumbam', title: 'கும்பம்' },
  { etitle: 'meenam', title: 'மீனம்' },
];

// Photo section IDs
const PHOTO_SECTION_IDS = ['81', '5001', '5002', '5003', 'top10', 'mostcommented'];

// Format date to Tamil style: "தமிழ் 27, 2025"
const TAMIL_MONTHS = {
  '01': 'ஜனவரி', '02': 'பிப்ரவரி', '03': 'மார்ச்', '04': 'சித்திர்',
  '05': 'வைகாசி', '06': 'ஆனி', '07': 'ஆடி', '08': 'ஆகஸ்ட்',
  '09': 'பிரதிபை', '10': 'திசம்பர்', '11': ' ார்த்திகர்', '12': 'டிசம்பர்'
};

// Group news items by date for sticky date headers
function groupNewsByDate(items) {
  const groups = [];
  let currentDate = null;

  items.forEach(item => {
    const rawDate = item.standarddate || item.date || item.time_date || '';
    // Normalize date to a comparable key
    const dateKey = rawDate.split(' ')[0] || rawDate; // Take just the date part

    if (dateKey && dateKey !== currentDate) {
      currentDate = dateKey;
      groups.push({ type: 'dateHeader', date: rawDate, dateKey });
    }
    groups.push({ type: 'news', item });
  });

  return groups;
}

function formatTamilDate(dateStr) {
  if (!dateStr) return '';
  // Handle formats: "2025-08-06", "06-Aug-2025", "06/08/2025"
  let day, month, year;

  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    [year, month, day] = dateStr.split('T')[0].split('-');
  } else if (dateStr.match(/^\d{2}-[A-Za-z]{3}-\d{4}/)) {
    const parts = dateStr.split('-');
    day = parts[0];
    const engMonths = {
      Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
      Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
    };
    month = engMonths[parts[1]] || '01';
    year = parts[2];
  } else if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}/)) {
    [day, month, year] = dateStr.split('/');
  } else {
    return dateStr; // Return as-is if unrecognized
  }

  const tamilMonth = TAMIL_MONTHS[month] || month;
  return `${tamilMonth} ${day}, ${year}`;
}

// -----------------------------------------------------------------------------
// HTML helpers
// -----------------------------------------------------------------------------
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

// Add this OUTSIDE the component (top of file)
// Map rasi id ? largeimages from todayrasi section (already on dinamalar CDN)
const RASI_DINAMALAR_IMAGES = {
  mesham: 'https://images.dinamalar.com/data/rasi/rasi_1_L.jpg',
  rishabam: 'https://images.dinamalar.com/data/rasi/rasi_2_L.jpg',
  mithunam: 'https://images.dinamalar.com/data/rasi/rasi_3_L.jpg',
  kadakam: 'https://images.dinamalar.com/data/rasi/rasi_4_L.jpg',
  simmam: 'https://images.dinamalar.com/data/rasi/rasi_5_L.jpg',
  kanni: 'https://images.dinamalar.com/data/rasi/rasi_6_L.jpg',
  thulam: 'https://images.dinamalar.com/data/rasi/rasi_7_L.jpg',
  viruchigam: 'https://images.dinamalar.com/data/rasi/rasi_8_L.jpg',
  thanusu: 'https://images.dinamalar.com/data/rasi/rasi_9_L.jpg',
  makaram: 'https://images.dinamalar.com/data/rasi/rasi_10_L.jpg',
  kumbam: 'https://images.dinamalar.com/data/rasi/rasi_11_L.jpg',
  meenam: 'https://images.dinamalar.com/data/rasi/rasi_12_L.jpg',
};

// -----------------------------------------------------------------------------
// Rasi Card Component (list view)
// -----------------------------------------------------------------------------
const RasiCard = ({ item, onPress }) => {
  const [imageError, setImageError] = useState(false);

  // Use dinamalar CDN image by rasi id (1-12 mapping)
  // Fallback chain: dinamalar CDN ? item.largeimages ? item.icon
  const dinamalarImage = RASI_DINAMALAR_IMAGES[item.id];
  const fallbackUri = (item.largeimages || item.icon || '').replace('http://', 'https://');
  const imageUri = dinamalarImage || fallbackUri;

  const title = item.title || item.newstitle || '';

  return (
    <TouchableOpacity style={rc.wrap} onPress={onPress} activeOpacity={0.85}>
      <View style={rc.imageWrap}>
        {imageError || !imageUri ? (
          <View style={rc.imagePlaceholder}>
            <Text style={{ fontSize: s(32) }}>
              {['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'][
                ['mesham', 'rishabam', 'mithunam', 'kadakam', 'simmam', 'kanni',
                  'thulam', 'viruchigam', 'thanusu', 'makaram', 'kumbam', 'meenam']
                  .indexOf(item.id)
              ] || '⭐'}
            </Text>
          </View>
        ) : (
          <Image
            source={{ uri: imageUri }}
            style={rc.image}
            resizeMode="contain"
            onError={() => setImageError(true)}
          />
        )}
      </View>
      <View style={rc.content}>
        <Text style={rc.title}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};
const rc = StyleSheet.create({
  wrap: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    alignItems: 'center',
    // borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: vs(4),
  },
  imageWrap: { 
    width: s(200),        // fixed width like image 2
    height: vs(90), 
    position: 'relative', 
    overflow: 'hidden',
    marginLeft: s(8),
  },
  image: { width: '100%', height: '100%', resizeMode: 'contain' },
  imagePlaceholder: { 
    width: '100%', height: '100%', 
    backgroundColor: '#f8f8f8', 
    justifyContent: 'center', alignItems: 'center' 
  },
  content: { flex: 1, paddingHorizontal: s(12) },
  title: { 
    fontSize: ms(15), 
    fontFamily: FONTS.muktaMalar.bold, 
    color: '#1a1a1a', 
    fontWeight: '700' 
  },
});

// -----------------------------------------------------------------------------
// Inline Rasi Detail View
// -----------------------------------------------------------------------------
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

// function InlineVideoPlayer({ url, style }) {
//   if (!url) return null;

//   // -- Handle different video URL formats --
//   // Dinamalar uses iframe embed URLs like:
//   // https://www.dinamalar.com/video_embed.asp?id=XXXXX
//   // or YouTube: https://www.youtube.com/embed/XXXXX
//   // or direct MP4

//   const isDirectVideo = url.endsWith('.mp4') || url.includes('.mp4?');

//   if (isDirectVideo) {
//     // Use HTML5 video tag for direct MP4
//     const html = `<!DOCTYPE html>
// <html>
//   <head>
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <style>
//       * { margin: 0; padding: 0; box-sizing: border-box; }
//       html, body { width: 100%; height: 100%; background: #000; }
//       video { width: 100%; height: 100%; object-fit: contain; }
//     </style>
//   </head>
//   <body>
//     <video controls autoplay playsinline>
//       <source src="${url}" type="video/mp4">
//     </video>
//   </body>
// </html>`;
//     return (
//       <WebView
//         source={{ html }}
//         style={style}
//         allowsFullscreenVideo
//         javaScriptEnabled
//         mediaPlaybackRequiresUserAction={false}
//         allowsInlineMediaPlayback={true}
//         scrollEnabled={false}
//       />
//     );
//   }

//   // -- iframe embed for YouTube / Dinamalar embed URLs --
//   const html = `<!DOCTYPE html>
// <html>
//   <head>
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <style>
//       * { margin: 0; padding: 0; box-sizing: border-box; }
//       html, body { width: 100%; height: 100%; background: #000; }
//       iframe { width: 100%; height: 100%; border: none; }
//     </style>
//   </head>
//   <body>
//     <iframe 
//       src="${url}" 
//       allowfullscreen 
//       allow="autoplay; fullscreen; encrypted-media"
//       frameborder="0"
//     ></iframe>
//   </body>
// </html>`;

//   return (
//     <WebView
//       source={{ html, baseUrl: 'https://www.dinamalar.com' }}
//       style={style}
//       allowsFullscreenVideo
//       javaScriptEnabled
//       domStorageEnabled
//       mediaPlaybackRequiresUserAction={false}
//       allowsInlineMediaPlayback={true}
//       scrollEnabled={false}
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

      // ? Debug logs INSIDE the function where d exists
      console.log('[VIDEO DEBUG] All keys:', Object.keys(d || {}));
      console.log('[VIDEO DEBUG] newlist data[0] videopath:', d?.newlist?.data?.[0]?.videopath);

      const textItem =
        d?.newlist?.data?.[0] ||
        d?.detaildata?.[0] ||
        d?.rasidetail?.[0] ||
        d?.rasidata?.[0] ||
        d?.detail?.[0] ||
        d?.rasi?.[0] ||
        (Array.isArray(d?.data) ? d.data[0] : null) ||
        (Array.isArray(d) ? d[0] : null) ||
        null;

      // ? If this is todayrasi, also fetch video separately
      let videoPath = '';
      let videoThumb = '';
      if (tabId === 'todayrasi') {
        try {
          const videoRes = await CDNApi.get(
            `/todayrasivideo?jcat=${targetJcat}&date=${dateStr}`
          );
          const vd = videoRes?.data;
          console.log('[VIDEO DEBUG] video keys:', Object.keys(vd || {}));
          const videoItem =
            vd?.videodailyrasi?.data?.[0] ||
            vd?.newlist?.data?.[0] ||
            (Array.isArray(vd?.data) ? vd.data[0] : null) ||
            null;
          videoPath = videoItem?.videopath || videoItem?.videolink || '';
          videoThumb = videoItem?.largeimages || videoItem?.images || '';
          console.log('[VIDEO DEBUG] videoPath:', videoPath);
        } catch (ve) {
          console.warn('[RasiDetailView] video fetch failed:', ve?.message);
        }
      }

      const merged = textItem
        ? {
          ...textItem,
          videopath: videoPath || textItem?.videopath || '',
          videothumbnail: videoThumb || textItem?.largeimages || '',
        }
        : null;

      setDetail(merged || (d?.footnote ? d : initialItem || null));
    } catch (e) {
      console.error('[RasiDetailView] error:', e?.message);
      setError('தகவல் ஏதேனும் தரவும்.');
      if (initialItem) setDetail(initialItem);
    } finally {
      setLoading(false);
    }
  }, [resolvedEndpoint, initialItem, selectedDate, tabId]);

  // Fetch whenever activeJcat changes
  React.useEffect(() => { fetchDetail(activeJcat); }, [activeJcat]);

  const goToRasi = (etitle) => {
    setActiveJcat(etitle);
    setVideoPlaying(false);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  // ? Arrows navigate between TABS
 // REPLACE with:
const prevDisabled = currentIdx <= 0;
const nextDisabled = currentIdx >= RASI_LIST.length - 1;
const goToPrev = () => { if (!prevDisabled) goToRasi(RASI_LIST[currentIdx - 1].etitle); };
const goToNext = () => { if (!nextDisabled) goToRasi(RASI_LIST[currentIdx + 1].etitle); };
  const pageTitle = `${tabTitle} : ${currentRasi.title}`;
  const date = detail?.standarddate || detail?.date || detail?.created_date || '';
  const prevDate = detail?.previousdate || detail?.prevdate || detail?.previous_date ||
    new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000).toLocaleDateString('ta-IN');
  const palan = detail?.palan || detail?.prediction || detail?.description || detail?.content || '';
  const rasiLabel = detail?.rasi || detail?.zodiac || detail?.sign || currentRasi.title;
  const footnoteHtml = detail?.footnote || detail?.content || detail?.description || '';
  const cleanText = parseHtmlContent(footnoteHtml);
  const paragraphs = renderFormattedText(cleanText);

  // ? Use _hasVideo flag set during fetch
  const videopath = detail?.videopath || '';
  const hasVideo = detail?._hasVideo || videopath.length > 4;

  let videoUrl = videopath;
  if (videoUrl && !videoUrl.startsWith('http')) {
    videoUrl = `https://www.dinamalar.com${videoUrl}`;
  }

  // ? Image URI with reliable CDN fallback
const imageUri = (() => {
  // For todayrasi, use the CDN rasi zodiac image
  if (tabId === 'todayrasi') {
    return RASI_DINAMALAR_IMAGES[activeJcat] ||
      detail?.videothumbnail ||
      detail?.largeimages ||
      detail?.images ||
      initialItem?.largeimages ||
      'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg';
  }
  // For all other tabs (maatha rasi, guru peyarchi, sani peyarchi, etc.)
  // use the actual article's largeimages from API
  return detail?.largeimages ||
    detail?.videothumbnail ||
    detail?.images ||
    initialItem?.largeimages ||
    RASI_DINAMALAR_IMAGES[activeJcat] ||
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg';
})();

  // ? Share URL
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
        <View style={rd.loaderWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={rd.loaderText}>ஏற்றுகிறதுகிறது...</Text>
        </View>
      ) : (
        <>
          {/* -- Page title -- */}
          <Text style={rd.pageTitle}>{pageTitle}</Text>
          <View style={rd.dateRow}>
            {!!date && <Text style={rd.date}>{date}</Text>}
          </View>

          {/* -- Previous date row -- */}
          {!!prevDate && (
            <View style={rd.prevDateRow}>
              <Text style={rd.prevDateLabel}>முந்தைய தேதி</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={rd.datePickerBtn}>
                <View style={rd.prevDateBadge}>
                  <Ionicons name="calendar-outline" size={s(13)} color="#555" />
                  <Text style={rd.prevDateText}>{prevDate}</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* -- Rasi : Palan -- */}
          {(!!rasiLabel || !!palan) && (
            <View style={rd.rasiPalanRow}>
              <View style={rd.greyDot} />
              <Text style={rd.rasiPalanText}>{rasiLabel}{palan ? ` : ${palan}` : ''}</Text>
            </View>
          )}

          {/* -- Image + side arrows -- */}
          <View style={rd.imageSection}>
            {/* ? Left arrow ? previous TAB */}
            <TouchableOpacity
              style={[rd.arrowBtn, rd.arrowLeft]}
              onPress={goToPrev}
              disabled={prevDisabled}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-back" size={s(24)} color={prevDisabled ? '#ccc' : '#333'} />
            </TouchableOpacity>

            {/* ? Image with play button overlay */}
            <View style={rd.imageWrap}>
              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={hasVideo ? 0.85 : 1}
                onPress={() => { if (hasVideo && videoUrl) setVideoPlaying(true); }}
              >
                <Image
                  source={{ uri: imageUri }}
                  style={rd.image}
                  resizeMode="contain"
                />
                {hasVideo && (
                  <View style={rd.playOverlay}>
                    <View style={rd.playBtn}>
                      <Ionicons name="play" size={s(28)} color="#fff" />
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* ? Right arrow ? next TAB */}
            <TouchableOpacity
              style={[rd.arrowBtn, rd.arrowRight]}
              onPress={goToNext}
              disabled={nextDisabled}
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-forward" size={s(24)} color={nextDisabled ? '#ccc' : '#333'} />
            </TouchableOpacity>
          </View>

          {/* ? Single VideoPlayerModal OUTSIDE imageSection */}
          <VideoPlayerModal
            visible={hasVideo && videoPlaying}
            url={videoUrl}
            onClose={() => setVideoPlaying(false)}
          />

          {/* -- Share row -- */}
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

          {/* -- Rasi title underlined -- */}
          <View style={rd.rasiTitleWrap}>
            <Text style={rd.rasiTitleText}>{rasiLabel}</Text>
          </View>

          {/* -- Footnote paragraphs -- */}
          <View style={rd.footnoteWrap}>
            {cleanText ? (
              renderFormattedText(cleanText)
            ) : (
              <View style={rd.emptyWrap}>
                <Ionicons name="star-outline" size={s(36)} color="#ccc" />
                <Text style={rd.emptyText}>விவரங்கள் இல்லை</Text>
              </View>
            )}
          </View>

          {/* -- Error -- */}
          {!!error && !footnoteHtml && (
            <View style={rd.errorRow}>
              <Text style={rd.errorText}>{error}</Text>
              <TouchableOpacity style={rd.retryBtn} onPress={() => fetchDetail(activeJcat)}>
                <Text style={rd.retryText}>மீண்டும் முயற்சி</Text>
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

const rd = StyleSheet.create({
  // Chip strip
  chipStrip: { backgroundColor: '#fff', maxHeight: vs(46), borderBottomWidth: 1, borderBottomColor: '#eee' },
  chipContent: { paddingHorizontal: s(8), alignItems: 'center', paddingVertical: vs(5), gap: s(5) },
  chip: { paddingHorizontal: s(12), paddingVertical: vs(5), borderRadius: s(20), backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: 'transparent' },
  chipActive: { backgroundColor: COLORS.primary + '18', borderColor: COLORS.primary },
  chipText: { fontSize: ms(12), fontFamily: FONTS.muktaMalar.regular, color: '#555' },
  chipTextActive: { color: COLORS.primary, fontWeight: '700' },

  // Play icon styles from VideosScreen
  playButtonOverlay: {
    position: 'absolute',
    bottom: s(5),
    left: s(5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircle: {
    width: s(48),
    height: s(48),
    borderRadius: s(24),
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#fff',
  },

  // Loader
  loaderWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: vs(60), gap: vs(12) },
  loaderText: { fontSize: ms(14), color: '#888', fontFamily: FONTS.muktaMalar.regular },

  // Title / date
  pageTitle: { fontSize: ms(18), fontFamily: FONTS.muktaMalar.medium || FONTS.muktaMalar.bold, color: '#111', fontWeight: '700', paddingHorizontal: s(14), paddingTop: vs(14), marginBottom: vs(4) },
  date: { fontSize: ms(13), color: '#888', fontFamily: FONTS.muktaMalar.regular },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: s(14), marginBottom: vs(10) },
  datePickerBtn: { padding: s(5) },

  // Prev date
  prevDateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: s(14), paddingVertical: vs(8), backgroundColor: '#f8f8f8', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee', marginBottom: vs(10) },
  prevDateLabel: { fontSize: ms(13), fontFamily: FONTS.muktaMalar.regular, color: '#444' },
  prevDateBadge: { flexDirection: 'row', alignItems: 'center', gap: s(5), backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', paddingHorizontal: s(8), paddingVertical: vs(4), borderRadius: s(4) },
  prevDateText: { fontSize: ms(12), fontFamily: FONTS.muktaMalar.regular, color: '#444' },

  // Rasi : Palan
  rasiPalanRow: { flexDirection: 'row', alignItems: 'center', gap: s(8), paddingHorizontal: s(14), marginBottom: vs(10), justifyContent: 'flex-end' },
  greyDot: { width: s(8), height: s(8), borderRadius: s(4), backgroundColor: '#888' },
  rasiPalanText: { fontSize: ms(13), fontFamily: FONTS.muktaMalar.bold, color: '#444', fontWeight: '600' },

  // Image + arrows
  imageSection: { flexDirection: 'row', alignItems: 'center' },
  arrowBtn: { width: s(32), alignItems: 'center', justifyContent: 'center', paddingVertical: vs(10) },
  arrowLeft: { paddingLeft: s(4) },
  arrowRight: { paddingRight: s(4) },
  imageWrap: { flex: 1, height: vs(180), overflow: 'hidden' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  playOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  playBtn: { width: s(28), height: s(28), borderRadius: s(14), backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', paddingLeft: s(2) },
  playButtonOverlay: {
    position: 'absolute',
    bottom: s(5),
    left: s(5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  playCircle: {
    width: s(48),
    height: s(48),
    borderRadius: s(24),
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderStyle: 'solid',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#fff',
  },

  // Share
  shareRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: vs(14), gap: s(14), borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  shareCircle: { width: s(36), height: s(36), borderRadius: s(18), alignItems: 'center', justifyContent: 'center' },
  shareCircleBorder: { borderWidth: 1, borderColor: '#ddd' },

  // Rasi title underlined
  rasiTitleWrap: { paddingHorizontal: s(14), paddingTop: vs(14), paddingBottom: vs(8) },
  rasiTitleText: { fontSize: ms(16), fontFamily: FONTS.muktaMalar.medium || FONTS.muktaMalar.bold, color: '#111', fontWeight: '700', textDecorationLine: 'underline' },

  // Footnote
  footnoteWrap: { paddingHorizontal: s(14), paddingTop: vs(4) },
  paragraph: { fontSize: ms(15), fontFamily: FONTS.muktaMalar.regular, color: '#333', lineHeight: ms(24), marginBottom: vs(10) },
  emptyWrap: { alignItems: 'center', paddingVertical: vs(40), gap: vs(10) },
  emptyText: { fontSize: ms(14), color: '#aaa', fontFamily: FONTS.muktaMalar.regular },

  // Error
  errorRow: { alignItems: 'center', paddingHorizontal: s(20), paddingVertical: vs(20), gap: vs(10) },
  errorText: { fontSize: ms(14), color: '#888', textAlign: 'center', fontFamily: FONTS.muktaMalar.regular },
  retryBtn: { paddingHorizontal: s(20), paddingVertical: vs(8), backgroundColor: COLORS.primary, borderRadius: s(6) },
  retryText: { color: '#fff', fontSize: ms(13), fontFamily: FONTS.muktaMalar.medium, fontWeight: '700' },

  // More section
  moreStrip: { paddingHorizontal: s(14), paddingVertical: vs(14), borderTopWidth: 1, borderTopColor: '#eee', marginTop: vs(16) },
  moreText: { fontSize: ms(15), fontFamily: FONTS.muktaMalar.medium || FONTS.muktaMalar.bold, color: '#222', fontWeight: '700' },
});

// -----------------------------------------------------------------------------
// Skeleton
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// Section Title
// -----------------------------------------------------------------------------
function SectionTitle({ title, showArrow = false }) {
  const { sf } = useFontSize();
  return (
    <View style={st.sectionHeader}>
      <View style={[st.titleContainer, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
        <View>
          <Text style={[st.sectionTitle, { fontSize: sf(16) }]}>{title || ''}</Text>
          <View style={st.sectionUnderline} />
        </View>
        {showArrow && (
          <Ionicons name="chevron-forward" size={s(18)} color={PALETTE.primary} />
        )}
      </View>
    </View>
  );
}
const st = StyleSheet.create({
  sectionHeader: { paddingBottom: vs(10) },
  titleContainer: { flexDirection: 'column', alignItems: 'flex-start' },
  sectionTitle: { fontFamily: FONTS.muktaMalar.bold, color: PALETTE.grey800 },
  sectionUnderline: { height: vs(3), width: '20%', backgroundColor: PALETTE.primary },
});

// -----------------------------------------------------------------------------
// Date Header for NRI tabs
// -----------------------------------------------------------------------------
function DateHeader({ date }) {
  return (
    <View style={dh.wrap}>
      <View style={{ borderWidth: 1, flexDirection: "row", borderRadius: s(10), paddingVertical: ms(3), paddingHorizontal: ms(8), alignItems: "center", borderColor: PALETTE.grey500 }}>
        <Ionicons name="calendar-outline" size={s(15)} color="#555" style={dh.icon} />
        <Text style={dh.text}>{formatTamilDate(date)}</Text>
      </View>

    </View>
  );
}

const dh = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: vs(4),
    gap: s(6),
    paddingHorizontal: ms(12)
  },
  icon: {
    marginRight: s(3),
    color: '#6c757d'
  },
  text: {
    fontSize: ms(16),
    fontFamily: FONTS.muktaMalar.medium,
    color: PALETTE.grey500,
    fontWeight: '600',
  },
});

// -----------------------------------------------------------------------------
// Inline Video Component
// -----------------------------------------------------------------------------
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
          iframe { width: 100%; height: 100%; border: none; border-radius: 6px; }
        </style>
      </head>
      <body>
        <iframe src="${url}" allowfullscreen allow="autoplay; fullscreen"></iframe>
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

// --- Photo Card   full-width image + title below (matches dinamalar website) --
function PhotoCard({ item, onPress, sf, isAllTab, isSocialCard = false }) {
  const [imageError, setImageError] = useState(false);
  const [isCommentsModalVisible, setIsCommentsModalVisible] = useState(false);

  const imageUri =
    (item.largeimages || item.images || item.image || item.thumbnail || '').trim() ||
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';

  const title =
    item.newstitle || item.title || item.footnote || item.name || '';
  const date =
    item.date || item.standarddate || item.date || item.time_date || '';
  const cat =
    item.maincat || item.categrorytitle || item.ctitle || '';
  const commentCount =
    parseInt(item.newscomment || item.nmcomment || item.commentcount || 0);

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        style={pc.card}
      >
        {/* Title above image - only for card data (not Today Photo, NRI Album, etc.) */}
        {/* {!!title && !isAllTab && (
          <Text
            style={[NewsCardStyles.title, { fontSize: sf(13), lineHeight: sf(22), paddingHorizontal: ms(12), paddingBottom: vs(8) }]}
            numberOfLines={3}
          >
            {title}
          </Text>
        )} */}

        {/* Full-width image */}
        <View style={[pc.imageWrap, isSocialCard && pc.imageWrapSocial]}>
          {imageError || !imageUri ? (
            <View style={pc.imagePlaceholder}>
              <Image
                source={{ uri: 'https://stat.dinamalar.com/new/2025/images/dinamalar-pavala-vizha-logo-day.png' }}
                style={pc.placeholderLogo}
                resizeMode="contain"
              />
            </View>
          ) : (
            <Image
              source={{ uri: imageUri }}
              style={pc.image}
              resizeMode="contain"
              onError={() => setImageError(true)}
            />
          )}

          {(isAllTab || !isSocialCard) && (isAllTab ? (
            // Gallery icon for All tab
            <TouchableOpacity
              style={pc.photoGalleryIcon}
              onPress={onPress}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <PhotoGallery width={s(22)} height={s(22)} />
            </TouchableOpacity>
          ) : (
            // Expand icon for sub tabs
            <TouchableOpacity
              style={pc.expandBtn}
              onPress={onPress}
              activeOpacity={0.8}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="expand-outline" size={s(18)} color="#fff" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Content below image */}
        <View style={pc.content}>
          {!!title && (
            <Text
              style={[NewsCardStyles.title, { fontSize: sf(13), lineHeight: sf(22), paddingHorizontal: ms(12), paddingBottom: vs(8) }]}
              numberOfLines={3}
            >
              {title}
            </Text>
          )}

          {/* Meta row: date + comments */}
          <View style={pc.metaRow}>
            {!!date && (
              <View style={pc.dateRow}>
                <Ionicons name="calendar-outline" size={s(15)} color={PALETTE.grey500} />
                <Text style={[NewsCardStyles.timeText, { fontSize: sf(13), color: PALETTE.grey600 }]}> {date}</Text>
              </View>
            )}
            {!isAllTab && (
              <TouchableOpacity
                style={pc.commentBtn}
                onPress={() => {
                  setIsCommentsModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Comment size={s(15)} color={PALETTE.grey500} />
                {/* <Text style={[pc.commentText, { fontSize: sf(11) }]}> {commentCount}</Text> */}
              </TouchableOpacity>
            )}
          </View>

          {/* Share buttons row - only show for non-photo tabs */}
          {!isAllTab && (
            <View style={pc.shareRow}>
              {[
                {
                  icon: 'logo-facebook',
                  bg: '#1877F2',
                  onPress: () => Linking.openURL(
                    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                      item.slug ? `https://www.dinamalar.com${item.slug}` : 'https://www.dinamalar.com'
                    )}`
                  ),
                },
                {
                  icon: 'logo-twitter',
                  bg: '#000000',
                  onPress: () => Linking.openURL(
                    `https://twitter.com/intent/tweet?url=${encodeURIComponent(
                      item.slug ? `https://www.dinamalar.com${item.slug}` : 'https://www.dinamalar.com'
                    )}`
                  ),
                },
                {
                  icon: 'logo-whatsapp',
                  bg: '#25D366',
                  onPress: () => Linking.openURL(
                    `whatsapp://send?text=${encodeURIComponent(
                      `${title} ${item.slug ? `https://www.dinamalar.com${item.slug}` : ''}`
                    )}`
                  ),
                },
                {
                  icon: 'paper-plane-outline',
                  bg: '#2AABEE',
                  onPress: () => Linking.openURL(
                    `https://t.me/share/url?url=${encodeURIComponent(
                      item.slug ? `https://www.dinamalar.com${item.slug}` : 'https://www.dinamalar.com'
                    )}`
                  ),
                },
                {
                  icon: 'copy-outline',
                  bg: PALETTE.grey400,
                  onPress: async () => {
                    try {
                      const url = item.slug
                        ? `https://www.dinamalar.com${item.slug}`
                        : 'https://www.dinamalar.com';
                      await Share.share({ message: `${title}\n${url}` });
                    } catch (_) { }
                  },
                },
              ].map((btn, i) => (
                <TouchableOpacity
                  key={i}
                  style={[pc.shareCircle, { backgroundColor: btn.bg }]}
                  onPress={btn.onPress}
                  activeOpacity={0.8}
                >
                  <Ionicons name={btn.icon} size={s(15)} color="#fff" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={pc.divider} />
      </TouchableOpacity>
      <CommentsModal
        visible={isCommentsModalVisible}
        onClose={() => setIsCommentsModalVisible(false)}
        photoId={item?.eventid || item?.id}
        photoTitle={title || item?.footnote || ''}
      />
    </>
  )
}

const pc = StyleSheet.create({
  imageWrap: {
    width: '100%',
    height: vs(220),
    backgroundColor: PALETTE.grey200,
    position: 'relative',
    overflow: 'hidden',
  },
  imageWrapSocial: {
    height: vs(300),
  },
  card: {
    paddingHorizontal: ms(12),
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderLogo: { width: s(180), height: vs(60), opacity: 0.25 },
  expandBtn: {
    position: 'absolute',
    bottom: vs(15),
    right: s(10),
    width: s(32),
    height: s(32),
    borderRadius: s(16),
    backgroundColor: 'rgba(0,0,0,0.70)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoGalleryIcon: {
    position: 'absolute',
    bottom: vs(10),
    right: s(10),
    backgroundColor: '#fff',
    padding: s(4),
    borderRadius: s(3),
    opacity: 0.8,
    zIndex: 999,
  },
  content: {
    paddingHorizontal: s(6),
    paddingTop: vs(10),
    paddingBottom: vs(4),
    gap: vs(6),
  },
  title: {
    fontFamily: FONTS.muktaMalar.semibold,
    color: PALETTE.grey800,
    fontWeight: '700',
  },
  catPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: PALETTE.grey400,
    paddingHorizontal: s(8),
    paddingVertical: vs(2),
  },
  catText: {
    color: PALETTE.grey600,
    fontWeight: '600',
    fontFamily: FONTS.muktaMalar.regular,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    color: PALETTE.grey500,
    fontFamily: FONTS.muktaMalar.medium,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    paddingVertical: vs(4),
    // paddingHorizontal: s(10),
    backgroundColor: 'transparent',
  },
  commentText: {
    color: PALETTE.grey500,
    fontFamily: FONTS.muktaMalar.regular,
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    paddingTop: vs(4),
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
});

// --- Image with Fallback -----------------------------------------------------
function ImageWithFallback({ source, style, resizeMode = 'cover', iconSize = 40 }) {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setLoading(false);
  };

  const handleImageLoad = () => {
    setImageError(false);
    setLoading(false);
  };

  if (imageError || !source?.uri) {
    return (
      <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }]}>
        <Image
          source={{ uri: 'https://stat.dinamalar.com/new/2025/images/dinamalar-pavala-vizha-logo-day.png' }}
          style={{ width: s(iconSize * 2), height: s(iconSize), resizeMode: 'contain' }}
        />
      </View>
    );
  }

  return (
    <View style={style}>
      <Image
        source={source}
        style={[style, { position: 'absolute' }]}
        resizeMode={resizeMode}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
      {loading && (
        <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }]}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      )}
    </View>
  );
}

// -----------------------------------------------------------------------------
// News Card (same as HomeScreen)
// -----------------------------------------------------------------------------
// --- Play Icon Styles (from VideosScreen) -----------------------------
// const rd = StyleSheet.create({
//   wrap: { backgroundColor: '#fff', paddingHorizontal: s(12), paddingTop: vs(10) },
//   imageWrap: {
//     width: '100%',
//     height: vs(140),
//     position: 'relative',
//     overflow: 'hidden',
//   },
//   image: { width: '100%', height: '100%', resizeMode: 'cover' },
//   playOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
//   playBtn: { width: s(28), height: s(28), borderRadius: s(14), backgroundColor: 'rgba(9, 109, 210, 0.85)', justifyContent: 'center', alignItems: 'center', paddingLeft: s(2), borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)' },
//   // Play icon styles from VideosScreen
//   playButtonOverlay: {
//     position: 'absolute',
//     bottom: s(5), 
//     left: s(5),
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   playCircle: {
//     width: s(48),
//     height: s(48),
//     borderRadius: s(24),
//     backgroundColor: 'rgba(9, 109, 210, 0.85)',
//     borderWidth: 2,
//     borderColor: 'rgba(255,255,255,0.6)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   playTriangle: {
//     width: 0, 
//     height: 0, 
//     borderStyle: 'solid',
//     borderTopColor: 'transparent', 
//     borderBottomColor: 'transparent',
//     borderLeftColor: '#fff',
//   },
//   content: { flex: 1, paddingHorizontal: s(12) },
//   title: { fontSize: ms(14), fontFamily: FONTS.muktaMalar.medium, color: '#1a1a1a', fontWeight: '700' },
//   arrowRight: { paddingRight: s(4) },
// });

// --- Play Icon (from VideosScreen) ---------------------------------------------
const PlayIcon = ({ size = 52 }) => (
  <View style={[rd.playCircle, { width: size, height: size, borderRadius: size / 2 }]}>

    <View style={[rd.playTriangle, {
      borderTopWidth: size * 0.22,
      borderBottomWidth: size * 0.22,
      borderLeftWidth: size * 0.36,
      marginLeft: size * 0.07
    }]} />
  </View>
);

function NewsCard({ item, onPress, sectionTitle = '', isHighlighted = false }) {
  const { sf } = useFontSize();
  const [imageError, setImageError] = useState(false);

  const imageUri =
    (item.largeimages || item.images || item.image || item.thumbnail || item.thumb || '').trim() ||
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';

  const title = item.newstitle || item.title || item.videotitle ||
    item.footnote || item.name || '';
  const category = item.maincat || item.categrorytitle || item.ctitle || item.maincategory || sectionTitle || '';
  const date = item.date || item.time_date || item.standarddate || item.date || '';
  const newscomment = item.newscomment || item.commentcount || item.nmcomment || item.comments?.total || '';
  const hasAudio = item.audio === 1 || item.audio === '1' || item.audio === true ||
    (typeof item.audio === 'string' && item.audio.length > 1 && item.audio !== '0');
  const hasVideo = (item.video === '1' || item.video === 1 ||
    (typeof item.video === 'string' && item.video.length > 0) ||
    item.video === true);

  return (
    <View style={[
      NewsCardStyles.wrap,
      isHighlighted && {
        backgroundColor: '#e3f2fd',
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
      }
    ]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
        <View style={NewsCardStyles.imageWrap}>
          {imageError ? (
            <View style={[NewsCardStyles.image, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }]}>
              <Image
                source={{ uri: 'https://stat.dinamalar.com/new/2025/images/dinamalar-pavala-vizha-logo-day.png' }}
                style={{ width: s(80), height: s(40), resizeMode: 'contain' }}
              />
            </View>
          ) : (
            <>
              <Image
                source={{ uri: normalizePhotoEndpoint(imageUri) }}
                style={NewsCardStyles.image}
                resizeMode="contain"
                onError={() => setImageError(true)}
              />
              {/* Video play button overlay */}
              {hasVideo && (
                <View style={rd.playButtonOverlay}>
                  <PlayIcon size={36} />
                </View>
              )}
            </>
          )}
        </View>

        <View style={NewsCardStyles.contentContainer}>
          {!!title && (
            <Text style={[NewsCardStyles.title, { fontSize: sf(13), lineHeight: sf(22) }]} numberOfLines={3}>{title}</Text>
          )}

          {/* {!!category && (
            <View style={NewsCardStyles.catPill}>
              <Text style={[NewsCardStyles.catText, { fontSize: sf(12) }]}>{category}</Text>
            </View>
          )} */}

          <View style={NewsCardStyles.metaRow}>
            <Text style={[NewsCardStyles.timeText, { fontSize: sf(13) }]}>{date}</Text>
            <View style={NewsCardStyles.metaRight}>
              {hasAudio && (
                <View style={NewsCardStyles.audioIcon}>
                  <SpeakerIcon size={s(14)} color={PALETTE.grey700} />
                </View>
              )}

              {!!newscomment && newscomment !== '0' && (
                <View style={NewsCardStyles.commentRow}>
                  <Ionicons name="chatbox" size={s(15)} color={PALETTE.grey700} />
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

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
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
  return d?.newlist?.pagination?.last_page || d?.newlist?.last_page || d?.newslist?.pagination?.last_page || d?.newslist?.last_page || d?.newdata?.pagination?.last_page || d?.newdata?.last_page || d?.data?.pagination?.last_page || d?.data?.last_page || d?.last_page || 1;
}

const tabIsAll = (tab) => !!tab?._isAllTab;

const isPhotoScreen = (endpoint) =>
  endpoint?.includes('photodata') ||
  endpoint?.includes('photoitem') ||
  endpoint?.includes('photodetails') ||   // ? ADD
  endpoint?.includes('photo') ||
  PHOTO_SECTION_IDS.some(id => endpoint?.includes(id));

const isWebstoriesScreen = (endpoint) =>
  endpoint?.includes('webstories');

// Add this helper near the top of CommonSectionScreen:
const normalizePhotoEndpoint = (link = '') => {
  return link
    .replace('/photoitem?', '/photodetails?')
    .replace('/photoitem ', '/photodetails ');
};

// --- Webstories Dropdown -----------------
const WebstoriesDropdown = ({ subTabs, activeTab, isAllTab, allTabLink, handleTabPress }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const activeTabTitle = (isAllTab || activeTab?.id === 'webstories')
    ? 'All'
    : (activeTab?.title || 'All');

  return (
    <View style={{ backgroundColor: '#fff', zIndex: 999, elevation: 999 }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingHorizontal: s(12),
        paddingVertical: vs(6),
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
      }}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#ddd',
            paddingHorizontal: s(12),
            paddingVertical: vs(6),
            gap: s(8),
            backgroundColor: '#fff',
            minWidth: s(130),
          }}
          onPress={() => setDropdownOpen(prev => !prev)}
          activeOpacity={0.8}
        >
          <Text style={{
            fontSize: ms(14),
            fontFamily: FONTS.muktaMalar.medium,
            color: '#111',
            flex: 1,
          }}>
            {activeTabTitle}
          </Text>
          <Ionicons
            name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
            size={s(16)}
            color="#555"
          />
        </TouchableOpacity>
      </View>

      {dropdownOpen && (
        <View style={{
          position: 'absolute',
          top: vs(44),
          right: s(12),
          backgroundColor: '#fff',
          borderWidth: 1,
          borderColor: '#ddd',
          minWidth: s(180),
          zIndex: 1000,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: vs(2) },
          shadowOpacity: 0.15,
          shadowRadius: s(4),
        }}>
          {/* All option */}
          <TouchableOpacity
            style={{
              paddingHorizontal: s(16),
              paddingVertical: vs(12),
              borderBottomWidth: 1,
              borderBottomColor: '#f0f0f0',
              backgroundColor: (isAllTab || activeTab?.id === 'webstories') ? '#f0f6ff' : '#fff',
            }}
            onPress={() => {
              setDropdownOpen(false);
              const allTab = subTabs.find(t => t.id === 'webstories' || t._isAllTab);
              if (allTab) handleTabPress({ ...allTab, _isAllTab: true });
            }}
          >
            <Text style={{
              fontSize: ms(15),
              fontFamily: FONTS.muktaMalar.medium,
              color: (isAllTab || activeTab?.id === 'webstories') ? COLORS.primary : '#111',
            }}>
              All
            </Text>
          </TouchableOpacity>

          {/* Category options   skip All tab itself */}
          {subTabs
            .filter(t => t.id !== 'webstories' && !t._isAllTab)
            .map((tab, index, arr) => {
              const isActive = !isAllTab &&
                activeTab?.id !== 'webstories' &&
                String(activeTab?.id) === String(tab.id);
              return (
                <TouchableOpacity
                  key={`wdd-${tab.id ?? index}`}
                  style={{
                    paddingHorizontal: s(16),
                    paddingVertical: vs(12),
                    borderBottomWidth: index < arr.length - 1 ? 1 : 0,
                    borderBottomColor: '#f0f0f0',
                    backgroundColor: isActive ? '#f0f6ff' : '#fff',
                  }}
                  onPress={() => {
                    setDropdownOpen(false);
                    handleTabPress(tab);
                  }}
                >
                  <Text style={{
                    fontSize: ms(15),
                    fontFamily: FONTS.muktaMalar.medium,
                    color: isActive ? COLORS.primary : '#111',
                  }}>
                    {tab.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </View>
      )}
    </View>
  );
};

// -----------------------------------------------------------------------------
// Main Screen
// -----------------------------------------------------------------------------
export default function CommonSectionScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { sf } = useFontSize();

  const {
    screenTitle = 'வரவரம்',
    apiEndpoint = '/dinamdinam',
    allTabLink = '/dinamdinam',
    initialTabId,
    initialTabLink,
    selectedNewsId,
    selectedNewsItem,
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

  const [rasiDetailItem, setRasiDetailItem] = useState(null);

  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isLocationDrawerVisible, setIsLocationDrawerVisible] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('உள்ளூர்');

  const flatListRef = useRef(null);
  const rasiScrollViewRef = useRef(null);
  const tabScrollRef = useRef(null);   // ref for horizontal tab ScrollView
  const tabLayoutsRef = useRef({});   // stores {[tabKey]: {x, width}} after layout

  // ── Refs to keep latest values accessible inside PanResponder ────────────
  const subTabsRef = useRef([]);
  const activeTabRef = useRef(null);

  const [originalNriTabs, setOriginalNriTabs] = useState([]);
  const [nriCondition, setNriCondition] = useState([]);
  const [nriSubCatTabs, setNriSubCatTabs] = useState([]);

  const handleScroll = useCallback((e) => {
    setShowScrollTop(e.nativeEvent.contentOffset.y > 300);
  }, []);

  // Keep refs in sync with state
  useEffect(() => { subTabsRef.current = subTabs; }, [subTabs]);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  // Auto-scroll tab bar so active tab is always fully visible
  useEffect(() => {
    if (!activeTab || !tabScrollRef.current) return;
    const key = activeTab.title === 'All' ? 'All' : String(activeTab.id);
    const layout = tabLayoutsRef.current[key];
    if (!layout) return;
    
    // Use requestAnimationFrame to prevent conflicts
    requestAnimationFrame(() => {
      if (tabScrollRef.current) {
        // Centre the active tab: scroll so tab sits in middle of scroll view
        const scrollX = Math.max(0, layout.x - layout.width);
        tabScrollRef.current.scrollTo({ x: scrollX, animated: true });
      }
    });
  }, [activeTab]);

  const fetchTabNews = useCallback(async (tab, pg, append = false, nriConditionOverride = null) => {
    console.log('[DEBUG] fetchTabNews called with:', {
      tabId: tab.id,
      tabLink: tab.link,
      tabTitle: tab.title,
      hasNriRegionFetch: tab._isNriRegionFetch,
      isAllTab: tabIsAll(tab),
      apiEndpoint
    });

    const isNriRegionTab = ((apiEndpoint === '/nri' || apiEndpoint === '/nrimain')
      && tab._isNriRegionFetch)
      && !tabIsAll(tab) && tab.id !== 'all';

    console.log('[DEBUG] isNriRegionTab check:', {
      apiEndpoint,
      hasNriRegionFetch: tab._isNriRegionFetch,
      isNotAllTab: !tabIsAll(tab),
      isNotAllId: tab.id !== 'all',
      result: isNriRegionTab,
      tabId: tab.id,
      tabLink: tab.link
    });

    if (isNriRegionTab) {
      try {
        let url = tab.link?.startsWith('//') ? tab.link.slice(1) : tab.link;
        const sep = url.includes('?') ? '&' : '?';
        const fullUrl = `${url}${sep}page=${pg}`;
        console.log('?? NRI Region - Fetching URL:', fullUrl);
        const res = await mainApi.get(fullUrl);
        const d = res?.data;

        // ? Check if response is valid
        if (!d || res.status !== 200) {
          console.error('?? NRI Region - Invalid response:', res.status, res.statusText);
          throw new Error(`API returned status ${res.status}: ${res.statusText}`);
        }

        const apiSubTabs = d?.subcatlist || [];
        const allArticles = d?.newlist?.data || [];

        console.log('?? NRI Region API - apiSubTabs:', apiSubTabs);
        console.log('?? NRI Region API - allArticles count:', allArticles.length);

        const isEnglishMode = tab.link?.includes('lang=en') || tab._isEnglishVersion;

        const subCatMap = {};
        if (apiSubTabs.length > 0) {
          apiSubTabs.forEach(t => {
            if (t.id) subCatMap[t.id] = t.title; // "News", "Temple", "Tamil Association" etc from API
          });
        }
        // Fallback - Use language-appropriate titles for subcategories
        if (Object.keys(subCatMap).length === 0) {
          Object.assign(subCatMap, isEnglishMode ? {
            'new': 'News', 'koi': 'Temple', 'san': 'Tamil Association',
            'rdo': 'Tamil Radio', 'eve': 'Events', 'iho': 'Indian Restaurants',
            'tsi': 'Tamil news websites', 'uni': 'University', 'job': 'Jobs',
          } : {
            'new': 'செய்திகள்', 'koi': 'கோயில்கள்', 'san': 'தமிழ் சங்கங்கள்',
            'rdo': 'தமிழ் வானொலி', 'eve': 'நிகழ்வுகள்', 'iho': 'இந்திய உணவகங்கள்',
            'tsi': 'தமிழ் செய்தி வலைதளங்கள்', 'uni': 'பல்கலைக்கழகம்', 'job': 'வேலைவாய்ப்பு',
          });
        }

        const subCatArticleMap = new Map();
        console.log('?? DEBUG: Analyzing', allArticles.length, 'articles for subcategories');

        allArticles.forEach((article, index) => {
          const reacturl = article.reacturl || '';
          const parts = reacturl.split('/');
          console.log('[SubCat Parse]', index, reacturl, '? parts:', parts, '? subCat:', parts[3]);

          // More robust subcategory extraction
          let subCat = 'new';
          if (parts.length >= 4) {
            // Handle URLs like /nrinews/america/san/-bharathi-kalai-mandram-2025/2651
            // parts[3] should be "san", parts[4] might be "-bharathi..."
            subCat = parts[3];
            // Clean up subcategory if it has leading dashes
            if (subCat && subCat.startsWith('-')) {
              subCat = subCat.replace(/^-+/, '');
            }
          }

          console.log('?? Article', index, 'assigned to subCat:', subCat);
          if (!subCatArticleMap.has(subCat)) subCatArticleMap.set(subCat, []);
          subCatArticleMap.get(subCat).push(article);
        });

        console.log('?? NRI Region - subCatArticleMap keys:', Array.from(subCatArticleMap.keys()));
        console.log('?? NRI Region - subCatArticleMap articles count:',
          Array.from(subCatArticleMap.entries()).map(([cat, articles]) => `${cat}: ${articles.length}`));

        // Get available subcategories from API response OR from the articles we found
        let availableSubCats = [];
        if (apiSubTabs.length > 0) {
          // Filter out the "All" tab to avoid duplication
          availableSubCats = apiSubTabs
            .filter(t => t.title?.toLowerCase() !== 'all' && t.id !== tab._nriRegionId)
            .map(t => t.id)
            .filter(id => id);
          console.log('?? NRI Region - Using filtered API subtabs (excluding "All"):', availableSubCats);
        } else {
          // Fallback: use subcategories found in articles
          availableSubCats = Array.from(subCatArticleMap.keys());
          console.log('?? NRI Region - Using article subcategories:', availableSubCats);
        }

        // Create subcategory tabs with filtered articles
        const newSubTabs = [
          {
            title: isEnglishMode ? 'All' : 'அனைத்தும்',
            link: tab.link,
            _isAllTab: true,
            _isNriRegionAllTab: true,
            _regionTabId: tab._nriRegionId,
            _isEnglishVersion: isEnglishMode,
          }
        ];

        // Add subcategory tabs with their filtered articles using API data
        availableSubCats.forEach(subCat => {
          const subCatArticles = subCatArticleMap.get(subCat) || [];
          const apiSubTab = apiSubTabs.find(t => t.id === subCat);

          const subCatLink = isEnglishMode
            ? (apiSubTab?.englishlink || `${tab.link}&scat=${subCat}&lang=en`)
            : (apiSubTab?.tamillink || `${tab.link}&scat=${subCat}&lang=ta`);

          newSubTabs.push({
            title: subCatMap[subCat] || subCat,
            id: subCat,
            link: subCatLink,
            _isNriSubCatTab: true,
            _isEnglishVersion: isEnglishMode,
            _nriCountryTab: tab._nriCountryTab,
            _regionTabId: tab._nriRegionId,
            _regionLink: tab.link,
            _subCatArticles: subCatArticles,
          });

          // console.log('?? NRI Region - Created subtab:', subCatMap[subCat] || subCat, 'with', subCatArticles.length, 'articles');
        });

        // ? SPECIAL FIX: If "new" subcategory has 0 articles, add some fallback articles
        const newSubTab = newSubTabs.find(t => t.id === 'new');
        if (newSubTab && newSubTab._subCatArticles.length === 0) {
          // console.log('?? NRI Region - "new" subcategory has 0 articles, adding fallback articles');
          // Add some general articles as fallback
          const fallbackArticles = allArticles.slice(0, 3);
          newSubTab._subCatArticles = fallbackArticles;
          // console.log('?? NRI Region - Added', fallbackArticles.length, 'fallback articles to "new" subcategory');
        }

        // Handle pagination - if append is true, merge with existing sections
        const sections = [];
        subCatArticleMap.forEach((articles, subCat) => {
          if (articles.length > 0) {
            sections.push({
              title: subCatMap[subCat] || subCat,
              id: subCat,
              data: articles.slice(0, 3),
              _isNriSection: true,
            });
          }
        });

        // ? ADD: Most Commented section for all NRI subcategory tabs
        if (d?.mostcommented?.data && Array.isArray(d.mostcommented.data) && d.mostcommented.data.length > 0) {
          sections.push({
            title: d.mostcommented.title || 'அதிகம் கருத்துரைக்கப்பட்டவை',
            id: 'most_commented',
            data: d.mostcommented.data.map(item => ({
              ...item,
              _isMostCommented: true,
              _isSpecialSection: true,
              _sectionType: 'most_commented'
            })),
            _isNriSection: true,
            _isMostCommented: true,
          });
        }

        if (append && allSections.length > 0) {
          // Append new data to existing sections
          const updatedSections = allSections.map(existingSection => {
            const newSectionData = sections.find(s => s.id === existingSection.id);
            if (newSectionData && newSectionData.data.length > 0) {
              return {
                ...existingSection,
                data: [...existingSection.data, ...newSectionData.data]
              };
            }
            return existingSection;
          });

          // Add any new sections that didn't exist before
          const existingSectionIds = new Set(allSections.map(s => s.id));
          const newSections = sections.filter(s => !existingSectionIds.has(s.id));

          setAllSections([...updatedSections, ...newSections]);
        } else {
          // Initial load - replace all sections
          setSubTabs(newSubTabs);
          setNriSubCatTabs(newSubTabs);
          setAllSections(sections);
          setTabNews([]);
        }
        setTabPage(pg);
        setTabLastPage(d?.newlist?.pagination?.last_page || 1);
        setActiveTab({
          ...tab,
          _isAllTab: true,
          _isNriRegionTab: true,
          _nriCountryTab: tab._nriCountryTab, // Preserve country tab flag
          _nriRegionId: tab.id,
          _nriRegionTitle: tab.title,
          _nriTabTitle: tab.title,
          // Don't set _activeSubCat initially so "All" tab is highlighted
        });
      } catch (e) {
        console.error('[NRI Region fetchTabNews] error:', e?.message);
      } finally {
        setTabLoading(false);
        setTabLoadMore(false);
        setRefreshing(false);
      }
      return;
    }

    const isNriSubTab = apiEndpoint === '/nrimain' && !tabIsAll(tab) && !tab._isNriRegionFetch;
    if (isNriSubTab) {
      try {
        let url = tab.link?.startsWith('//') ? tab.link.slice(1) : tab.link;
        const sep = url.includes('?') ? '&' : '?';
        const fullUrl = `${url}${sep}page=${pg}`;
        const res = await mainApi.get(fullUrl);
        const d = res?.data;

        const allArticles = extractList(d).filter(Boolean);

        // ? ADD: Log what fields are available
        // console.log('[NRI SubTab] Sample article keys:', Object.keys(allArticles[0] || {}));
        // console.log('[NRI SubTab] Sample maincat:', allArticles[0]?.maincat);
        // console.log('[NRI SubTab] Sample country:', allArticles[0]?.country);
        const countryMap = new Map();
        allArticles.forEach(article => {
          // ? FIX: try multiple fields for country grouping
          const country = article.maincat || article.country ||
            article.categrorytitle || article.ctitle || '';
          if (country) {
            if (!countryMap.has(country)) countryMap.set(country, []);
            countryMap.get(country).push(article);
          }
        });
        if (countryMap.size === 0 && allArticles.length > 0) {
          setTabNews(allArticles);
          setTabPage(pg);
          setTabLastPage(extractLastPage(d) || 1);
          setActiveTab(prev => ({
            ...prev,
            _isAllTab: false,
            _isNriSubTab: true,
            _nriTabId: tab.id,
            _nriTabLink: tab.link,
            _nriTabTitle: tab.title,
          }));
          return;
        }

        const sections = [];
        countryMap.forEach((articles, country) => {
          sections.push({
            title: country,
            id: country,
            data: articles,
            _isNriSection: true,
          });
        });

        // ? ADD: Most Commented section for main NRI subcategories (News, Temple, etc.)
        if (d?.mostcommented?.data && Array.isArray(d.mostcommented.data) && d.mostcommented.data.length > 0) {
          sections.push({
            title: d.mostcommented.title || 'அதிகம் விமர்ச்சிக்கப்பட்டவை',
            id: 'most_commented',
            data: d.mostcommented.data.map(item => ({
              ...item,
              _isMostCommented: true,
              _isSpecialSection: true,
              _sectionType: 'most_commented'
            })),
            _isNriSection: true,
            _isMostCommented: true,
          });
        }

        const countrySubTabs = [
          { title: 'All', link: '/nrimain', _isAllTab: true },
          ...Array.from(countryMap.keys()).map(country => ({
            title: country,
            id: country,
            link: `/nrimain/country/${country}`,
            _isNriCountryTab: true,
            _isEnglishVersion: tab._isEnglishVersion, // Inherit language from current tab
            _countryArticles: countryMap.get(country),
          })),
        ];

        setSubTabs(countrySubTabs);
        setAllSections(sections);
        setActiveTab(prev => ({
          ...prev,
          _isAllTab: true,
          _isNriSubTab: true,
          _nriTabId: tab.id,
          _nriTabLink: tab.link,
          _nriTabTitle: tab.title,
        }));
        setTabNews([]);
        setTabPage(pg);
        setTabLastPage(extractLastPage(d) || 1);
      } catch (e) {
        console.error('[NRI fetchTabNews] error:', e?.message);
      } finally {
        setTabLoading(false);
        setTabLoadMore(false);
        setRefreshing(false);
      }
      return;
    }

    if (!tab?.link || tabIsAll(tab)) return;
    try {
      const isRasiSubTab = RASI_TAB_IDS.includes(String(tab.id));

      const isPhotoSubTab = tab.link?.includes('photoitem') ||
        tab.link?.includes('photodetails') ||   // ? ADD THIS
        tab.link?.includes('getsocialmedia') ||
        tab.link?.includes('webstories');

      const isAnmegamSubTab = tab.link?.includes('anmegammain') ||
        tab.link?.includes('anmegam');

      const isWeeklySubTab = tab.link?.includes('weekly?cat=') ||
        (apiEndpoint?.includes('malargal') && tab.link?.includes('?cat='));

      let url = isRasiSubTab ? '/joshiyam' : tab.link;
      if (url?.startsWith('//')) {
        url = url.slice(1);
      }
      const sep = url.includes('?') ? '&' : '?';
      const fullUrl = `${url}${sep}page=${pg}`;
      const res = await mainApi.get(fullUrl);
      const d = res?.data;

      let list = [];

      // -- Handle webstorieslisting sub-tab ----------------------------------
      if (tab.link?.includes('webstorieslisting')) {
        list = Array.isArray(d?.newlist?.data) ? d.newlist.data : extractList(d).filter(Boolean);
        const lp = d?.newlist?.pagination?.last_page || extractLastPage(d) || 1;
        setTabLastPage(lp);
        setTabNews(prev => append ? [...prev, ...list] : list);
        setTabPage(pg);
        setTabLoading(false);
        setTabLoadMore(false);
        setRefreshing(false);
        return;
      }

      if (isRasiSubTab && d?.newlist?.[0]?.data) {
        list = d.newlist[0].data;

      } else if (isAnmegamSubTab) {
        // -- /anmegammainlist: newlist is an OBJECT with data array + pagination
        if (tab.link?.includes('anmegammainlist')) {
          list = Array.isArray(d?.newlist?.data) ? d.newlist.data : extractList(d).filter(Boolean);
          const lp = d?.newlist?.pagination?.last_page || extractLastPage(d) || 1;
          setTabLastPage(lp);
          setTabNews(prev => append ? [...prev, ...list] : list);
          setTabPage(pg);
          return;
        }

        // -- /anmegammain: newlist is an ARRAY of sections
        if (Array.isArray(d?.newlist)) {
          const sections = d.newlist.filter(s => Array.isArray(s?.data) && s.data.length > 0);
          if (sections.length > 0) {
            setAllSections(sections);
            setSubTabs(d?.subcatlist || []);
            setTabNews([]);
            setTabPage(pg);
            setTabLastPage(extractLastPage(d) || 1);
            setActiveTab(prev => ({ ...prev, _isAnmegamChild: true, _isAllTab: true }));
            return;
          }
        }
        list = extractList(d).filter(Boolean);

      } else if (isWeeklySubTab) {
        // -- Handle weekly subcategories (malargal) with top10 and mostcommented
        list = extractList(d).filter(Boolean);

        // Create sections for weekly subcategories
        const sections = [];

        // Add main category data
        if (list.length > 0) {
          sections.push({
            title: tab.title || '',
            id: tab.id || '',
            data: list,
            _isWeeklySubTab: true,
          });
        }

        // Add top10 section if available
        if (d?.top10?.data && Array.isArray(d.top10.data) && d.top10.data.length > 0) {
          sections.push({
            title: d.top10.title || 'அதிகம் பார்த்தவை',
            id: 'most_viewed',
            data: d.top10.data.map(item => ({
              ...item,
              _isMostViewed: true,
              _isSpecialSection: true,
              _sectionType: 'most_viewed'
            })),
            _isWeeklySubTab: true,
            _isMostViewed: true,
          });
        }

        // Add mostcommented section if available
        if (d?.mostcommented?.data && Array.isArray(d.mostcommented.data) && d.mostcommented.data.length > 0) {
          sections.push({
            title: d.mostcommented.title || 'அதிகம் கருத்துகள்',
            id: 'most_commented',
            data: d.mostcommented.data.map(item => ({
              ...item,
              _isMostCommented: true,
              _isSpecialSection: true,
              _sectionType: 'most_commented'
            })),
            _isWeeklySubTab: true,
            _isMostCommented: true,
          });
        }

        if (sections.length > 0) {
          setAllSections(sections);
          setSubTabs(d?.subcatlist || []);
          setTabNews([]);
          setTabPage(pg);
          setTabLastPage(extractLastPage(d) || 1);
          setActiveTab(prev => ({ ...prev, _isWeeklySubTab: true, _isAllTab: true }));
          setTabLoading(false);
          setTabLoadMore(false);
          setRefreshing(false);
          return;
        }

      } else if (isPhotoSubTab || tab._isPhotoTab) {
        console.log('📸 Fetching photo sub-tab data for:', tab.title, tab.id);
        list =
          (Array.isArray(d?.newlist?.data) && d.newlist.data.length > 0
            ? d.newlist.data.filter(i => !i.type)
            : null) ||
          (Array.isArray(d?.morephotos?.data) && d.morephotos.data.length > 0
            ? d.morephotos.data.filter(i => !i.type)
            : null) ||
          d?.indraiyephoto?.data ||
          d?.pogaimadam?.data ||
          d?.cartoons?.data ||
          d?.nri?.data ||
          // Handle new photo API structure
          (d?.photo?.data && Array.isArray(d.photo.data) 
            ? d.photo.data.find(section => String(section.maincatid || section.id) === String(tab.id))?.data
            : null) ||
          extractList(d);
        
        console.log('📸 Photo data found:', list?.length || 0, 'items');
      } else {
        list = extractList(d).filter(Boolean);
      }

      // -- Handle varavaram tab data - limit to 3 items -----------------------
      if (tab.link?.includes('varavaram') || apiEndpoint?.includes('varavaram')) {
        list = Array.isArray(list) ? list.slice(0, 3) : list;
      }

      // -- Handle varamalar tab data - limit to 3 items -----------------------
      if (tab.link?.includes('varamalar') || tab.link?.includes('varavaram') || apiEndpoint?.includes('varamalar')) {
        list = Array.isArray(list) ? list.slice(0, 3) : list;
      }

      // -- Handle special tab data - limit to 3 items -----------------------
      if (tab.link?.includes('special') || apiEndpoint?.includes('special')) {
        list = Array.isArray(list) ? list.slice(0, 3) : list;
      }

      const lp = d?.newlist?.pagination?.last_page ||
        extractLastPage(d) ||
        d?.indraiyephoto?.last_page ||
        d?.pogaimadam?.last_page ||
        d?.cartoons?.last_page || 1;
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
  }, [apiEndpoint, tabIsAll]);




  // -- Fetch main endpoint ----------------------------------------------------
  const fetchAll = useCallback(async () => {
    try {
      const api = mainApi; // Always use mainApi

      // Handle special case for cartoons - redirect to photodata API
      let actualEndpoint = apiEndpoint;
      if (apiEndpoint === '/cartoons' || apiEndpoint === 'https://api-st.dinamalar.com/cartoons') {
        actualEndpoint = 'https://api-st.dinamalar.com/photodata';
      } else if (apiEndpoint === '/cards' || apiEndpoint === 'https://api-st.dinamalar.com/cards') {
        actualEndpoint = 'https://api-st.dinamalar.com/photodata';
      }

      // Add timeout to prevent hanging requests
      const res = await Promise.race([
        api.get(actualEndpoint),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000)
        )
      ]);
      const d = res?.data;

      if (typeof d === 'string' && d.includes('<html')) {
        setHtmlContent(d);
        setAllSections([]);
        setSubTabs([]);
        setActiveTab({ title: 'All', link: apiEndpoint, _isAllTab: true });
        return;
      }
      setHtmlContent(null);
      // Replace the existing /nrimain block with this:
      if (apiEndpoint === '/nrimain') {
        // console.log('[DEBUG /nrimain] === NRI HANDLER REACHED ===');
        // console.log('[DEBUG /nrimain] API Response:', d);

        const rawTabs = d?.subcatlist || [];
        // console.log('[DEBUG /nrimain] Raw tabs:', rawTabs);

        const tabs = rawTabs.map(t => ({
          ...t,
          link: t.link?.startsWith('//') ? t.link.slice(1) : (t.link || ''),
          // The "All" tab from API has no id   give it one
          id: t.id || 'all',
          _isAllTab: !t.id, // tabs without id are the All tab
          _isEnglishVersion: t.link?.includes('lang=en') || false, // Detect English from link
        }));

        const sections = [];
        if (Array.isArray(d?.newlist)) {
          // console.log('[DEBUG /nrimain] newlist sections:', d.newlist);
          d.newlist.forEach(nriSection => {
            if (Array.isArray(nriSection?.data) && nriSection.data.length > 0) {
              sections.push({
                title: nriSection.title || '',
                id: nriSection.id || '',
                data: nriSection.data.slice(0, 3),
                _isNriSection: true,
              });
            }
          });
        } else {
          // console.log('[DEBUG /nrimain] newlist is not an array:', d?.newlist);

          // Try alternative data structures
          const altData = d?.data || d?.list || d?.newslist || d?.newdata;
          // console.log('[DEBUG /nrimain] Trying alternative data:', altData);

          if (Array.isArray(altData)) {
            // If it's a direct array, create sections by category
            const categoryMap = new Map();
            altData.forEach(item => {
              const category = item.maincat || item.category || '';
              if (!categoryMap.has(category)) categoryMap.set(category, []);
              categoryMap.get(category).push(item);
            });

            categoryMap.forEach((items, category) => {
              if (items.length > 0) {
                sections.push({
                  title: category,
                  id: category.replace(/\s+/g, '_'),
                  data: items.slice(0, 3),
                  _isNriSection: true,
                });
              }
            });
          } else if (altData?.data && Array.isArray(altData.data)) {
            // If data is nested in a data property
            sections.push({
              title: '',
              id: 'news',
              data: altData.data.slice(0, 3),
              _isNriSection: true,
            });
          }
        }

        // ? ADD: Most Commented and Most Viewed sections for Ulaga Tamilar All tab
        if (d?.mostcommented?.data && Array.isArray(d.mostcommented.data) && d.mostcommented.data.length > 0) {
          sections.push({
            title: d.mostcommented.title || 'அதிகம் கருத்துரைக்கப்பட்டவை',
            id: 'most_commented',
            data: d.mostcommented.data.map(item => ({
              ...item,
              _isMostCommented: true,
              _isSpecialSection: true,
              _sectionType: 'most_commented'
            })),
            _isNriSection: true,
            _isMostCommented: true,
          });
        }

        if (d?.top10?.data && Array.isArray(d.top10.data) && d.top10.data.length > 0) {
          sections.push({
            title: d.top10.title || 'அதிகம் பார்வையிடப்பட்டவை',
            id: 'most_viewed',
            data: d.top10.data.map(item => ({
              ...item,
              _isMostViewed: true,
              _isSpecialSection: true,
              _sectionType: 'most_viewed'
            })),
            _isNriSection: true,
            _isMostViewed: true,
          });
        }

        // console.log('[DEBUG /nrimain] Final sections:', sections);
        // console.log('[DEBUG /nrimain] Final tabs:', tabs);

        setSubTabs(tabs);
        setOriginalNriTabs(tabs);
        setAllSections(sections);
        setTaboolaAds(d?.taboola_ads?.mobile || null);
        if (d?.nricondition) setNriCondition(d.nricondition);

        if (initialTabId && initialTabId !== 'all') {
          const preselected = tabs.find(t => String(t.id) === String(initialTabId));
          if (preselected && !preselected._isAllTab) {
            setTabLoading(true);
            fetchTabNews({ ...preselected, _isAllTab: false }, 1, false, d.nricondition || []);
            return; // ? returns early, never sets allSections
          }
        }

        // Default: show All view with first tab (All) active
        const allTab = tabs.find(t => t._isAllTab) || tabs[0];
        setActiveTab({ ...allTab, _isAllTab: true });
        // ? FIX: Set allSections before returning
        if (sections.length > 0) {
          setAllSections(sections);
        }
        return;
      }

      // -- Handle /webstoriesupdate ----------------------------------------------
      if (apiEndpoint.includes('webstoriesupdate') || apiEndpoint.includes('webstorieslisting')) {
        const rawTabs = d?.subcatlist || [];
        const normalizedTabs = rawTabs.map(t => ({
          ...t,
          link: t.link?.startsWith('//') ? t.link.slice(1) : (t.link || ''),
          id: t.id || 'all',
          _isAllTab: !t.id,
        }));
        setSubTabs(normalizedTabs);
        setActiveTab(normalizedTabs.length > 0
          ? { ...normalizedTabs[0], _isAllTab: true }
          : { title: 'All', id: 'webstories', link: '/webstoriesupdate', _isAllTab: true }
        );
        const listData = Array.isArray(d?.newlist?.data) ? d.newlist.data : [];
        const lp = d?.newlist?.pagination?.last_page || 1;
        setAllSections([{ title: '', id: 'webstories', data: listData }]);
        setTabLastPage(lp);
        setTaboolaAds(d?.taboola_ads?.mobile || null);
        setActiveTab(normalizedTabs.length > 0
          ? { ...normalizedTabs[0], _isAllTab: true }
          : { title: 'All', id: 'webstories', link: '/webstoriesupdate', _isAllTab: true }
        );
        return;
      }

      // -- Handle photodata API shape ----------------------------------------
      if (apiEndpoint.includes('photodata') || d?.indraiyephoto || d?.pogaimadam || d?.cartoons) {
        const photoSections = [];

        // FAST LOADING: Load first page immediately, fetch additional pages in background
        const loadPhotoSectionFast = (sectionKey, sectionTitle, sectionId, initialData) => {
          if (!initialData || initialData.length === 0) return;
          
          const lastPage = d?.[sectionKey]?.pagination?.last_page || 
                          d?.[sectionKey]?.last_page || 1;
          
          console.log(`Fast loading ${sectionTitle}: showing page 1 of ${lastPage}`);
          
          // Add first page data immediately for fast response
          photoSections.push({ title: sectionTitle, id: sectionId, data: initialData });
          
          // Fetch remaining pages in background if more than 1 page
          if (lastPage > 1) {
            console.log(`Will fetch ${lastPage - 1} more pages for ${sectionTitle} in background`);
            
            // Background loading with batch requests to reduce API overload
            setTimeout(async () => {
              try {
                const api = mainApi;
                let allData = [...initialData];
                
                // Batch requests in chunks of 3 to avoid overwhelming API
                const batchSize = 3;
                for (let startPage = 2; startPage <= lastPage; startPage += batchSize) {
                  const endPage = Math.min(startPage + batchSize - 1, lastPage);
                  const batchPromises = [];
                  
                  // Create batch requests
                  for (let page = startPage; page <= endPage; page++) {
                    batchPromises.push(
                      api.get(`${apiEndpoint}?page=${page}`)
                        .then(res => res.data?.[sectionKey]?.data || [])
                        .catch(error => {
                          console.error(`Error fetching page ${page} for ${sectionTitle}:`, error);
                          return [];
                        })
                    );
                  }
                  
                  // Wait for batch to complete before next batch
                  const batchResults = await Promise.all(batchPromises);
                  
                  // Combine batch results
                  batchResults.forEach(pageData => {
                    if (Array.isArray(pageData) && pageData.length > 0) {
                      allData = [...allData, ...pageData];
                    }
                  });
                  
                  // Update UI after each batch for progressive loading
                  setAllSections(prev => prev.map(section => 
                    section.id === sectionId 
                      ? { ...section, data: allData }
                      : section
                  ));
                }
                
                // Update the section with complete data
                setAllSections(prev => prev.map(section => 
                  section.id === sectionId 
                    ? { ...section, data: allData }
                    : section
                ));
                
                console.log(`Background loading complete for ${sectionTitle}: ${allData.length} total items from ${lastPage} pages`);
              } catch (error) {
                console.error(`Background loading failed for ${sectionTitle}:`, error);
              }
            }, 100); // Small delay to ensure UI renders first
          }
        };

        // Load sections with fast approach
        if (d?.indraiyephoto?.data?.length > 0) {
          loadPhotoSectionFast('indraiyephoto', 'Today Photo', '81', d.indraiyephoto.data);
        }

        if (d?.pogaimadam?.data?.length > 0) {
          loadPhotoSectionFast('pogaimadam', 'Photo Album', '5001', d.pogaimadam.data);
        }

        if (d?.cartoons?.data?.length > 0) {
          loadPhotoSectionFast('cartoons', 'Cartoons', '5002', d.cartoons.data);
        }

        if (d?.nri?.data?.length > 0) {
          loadPhotoSectionFast('nri', 'NRI Photos', '5003', d.nri.data);
        }

        // Handle sections that don't need pagination (top10, mostcommented)
        if (d?.top10?.data?.length > 0)
          photoSections.push({ title: 'Most Viewed', id: 'top10', data: d.top10.data });

        if (d?.mostcommented?.data?.length > 0)
          photoSections.push({ title: 'Most Commented', id: 'mostcommented', data: d.mostcommented.data });

        // Handle new photo API structure where data is nested under photo.data
        if (d?.photo?.data && Array.isArray(d.photo.data)) {
          for (const section of d.photo.data) {
            if (section.data && Array.isArray(section.data) && section.data.length > 0) {
              // Extract ID from multiple possible sources
              const sectionId = section.maincatid || 
                               section.id || 
                               section.maincatid?.toString() || 
                               section.id?.toString() ||
                               section.slug?.split('/').pop() || 
                               'unknown';
              const sectionTitle = section.title || section.etitle || 'Photos';
              
              // Check if this section has pagination
              const lastPage = section.pagination?.last_page || 1;
              
              console.log(`Fast loading ${sectionTitle}: showing page 1 of ${lastPage}`);
              
              // Add first page data immediately
              photoSections.push({
                title: sectionTitle,
                id: String(sectionId),
                data: section.data
              });
              
              // Fetch remaining pages in background if more than 1 page
              if (lastPage > 1) {
                console.log(`Will fetch ${lastPage - 1} more pages for ${sectionTitle} in background`);
                
                setTimeout(async () => {
                  try {
                    const api = mainApi;
                    let allData = [...section.data];
                    const pagePromises = [];
                    
                    // Create parallel requests for remaining pages
                    for (let page = 2; page <= lastPage; page++) {
                      pagePromises.push(
                        api.get(`${apiEndpoint}?catid=${sectionId}&page=${page}`)
                          .then(res => {
                            const pageData = res.data?.photo?.data?.find(s => 
                              String(s.maincatid || s.id) === String(sectionId)
                            )?.data || [];
                            return pageData;
                          })
                          .catch(error => {
                            console.error(`Error fetching page ${page} for ${sectionTitle}:`, error);
                            return [];
                          })
                      );
                    }
                    
                    // Wait for all pages in parallel
                    const pageResults = await Promise.all(pagePromises);
                    
                    // Combine all data
                    pageResults.forEach(pageData => {
                      if (Array.isArray(pageData) && pageData.length > 0) {
                        allData = [...allData, ...pageData];
                      }
                    });
                    
                    // Update the section with complete data
                    setAllSections(prev => prev.map(section => 
                      section.id === String(sectionId) 
                        ? { ...section, data: allData }
                        : section
                    ));
                    
                    console.log(`Background loading complete for ${sectionTitle}: ${allData.length} total items from ${lastPage} pages`);
                  } catch (error) {
                    console.error(`Background loading failed for ${sectionTitle}:`, error);
                  }
                }, 100);
              }
              
              console.log(`Created photo section: ${sectionTitle} with ID: ${sectionId}`);
            }
          }
        }

        let tabs = d?.subcatlisting || [];
        
        // If no tabs from subcatlisting, create them from photoSections
        if (tabs.length === 0 && photoSections.length > 0) {
          tabs = photoSections.map(section => ({
            id: section.id,
            title: section.title,
            link: `/photodetails?cat=${section.id}`,
            _isPhotoTab: true
          }));
        }
        
        console.log('📸 Photo sections:', photoSections);
        console.log('📸 Tabs:', tabs);
        console.log('📸 Initial tab ID:', initialTabId);
        
        setSubTabs(tabs);
        setAllSections(photoSections);
        setTaboolaAds(d?.taboola_ads?.mobile || null);

        // Handle initial tab selection for photodata
        if (initialTabId && initialTabId !== 'all') {
          // First look in tabs (subcatlisting)
          const preselected = tabs.find(t => String(t.id) === String(initialTabId));
          if (preselected) {
            setActiveTab({ ...preselected, _isAllTab: false });
            setTabLoading(true);
            fetchTabNews(preselected, 1, false);
            return;
          }
          
          // If not found in tabs, look in photoSections
          const photoSection = photoSections.find(s => String(s.id) === String(initialTabId));
          if (photoSection) {
            setActiveTab({ ...photoSection, _isAllTab: false });
            setTabLoading(true);
            fetchTabNews(photoSection, 1, false);
            return;
          }
        }

        // Special case: if original endpoint was /cartoons, select cartoons tab
        if (apiEndpoint === '/cartoons' || apiEndpoint === 'https://api-st.dinamalar.com/cartoons') {
          const cartoonsTab = tabs.find(t => String(t.id) === '5002');
          if (cartoonsTab) {
            setActiveTab({ ...cartoonsTab, _isAllTab: false });
            setTabLoading(true);
            fetchTabNews(cartoonsTab, 1, false);
            return;
          }
        }

        // Special case: if original endpoint was /cards, select cards tab
        if (apiEndpoint === '/cards' || apiEndpoint === 'https://api-st.dinamalar.com/cards') {
          const cardsTab = tabs.find(t => String(t.id) === 'socialcards');
          if (cardsTab) {
            setActiveTab({ ...cardsTab, _isAllTab: false });
            setTabLoading(true);
            fetchTabNews(cardsTab, 1, false);
            return;
          }
        }

        // Special case: if original endpoint was /nri, select nri album tab
        // This line catches /nri because apiEndpoint.includes('nri') is true!
        if (apiEndpoint.includes('5003') || (apiEndpoint.includes('nri') && !apiEndpoint.startsWith('/nri'))) {
          const nriTab = tabs.find(t => String(t.id) === '5003');
          if (nriTab) {
            setActiveTab({ ...nriTab, _isAllTab: false });
            setTabLoading(true);
            fetchTabNews(nriTab, 1, false);
            return;
          }
        }

        setActiveTab({ title: 'Photo', link: apiEndpoint, _isAllTab: true });
        return;
      }

      // -- ORDER MATTERS: most specific first -------------------------------

      // -- Handle /anmegammainlist?cat=X&subcat=Y ----------------------------
      if (apiEndpoint.includes('anmegammainlist')) {
        const tabs = d?.subcatlist || [];
        setSubTabs(tabs);
        const listData = Array.isArray(d?.newlist?.data) ? d.newlist.data : [];
        const lp = d?.newlist?.pagination?.last_page || 1;
        setAllSections([{
          title: '',  // ? FIX: empty string so SectionTitle doesn't render
          id: d?.newlist?.id || '',
          data: listData,
          _isAnmegamSection: true,
        }]);
        setTabLastPage(lp);
        setTaboolaAds(d?.taboola_ads?.mobile || null);
        if (initialTabId && initialTabId !== 'all') {
          const preselected = tabs.find(t => String(t.id) === String(initialTabId));
          if (preselected) {
            setActiveTab({ ...preselected, _isAllTab: false });
            setTabLoading(true);
            fetchTabNews(preselected, 1, false);
            return;
          }
        }
        setActiveTab({ title: 'Photo', link: apiEndpoint, _isAllTab: true });
        return;
      }

      // -- Handle /anmegammain?cat=HIN ---------------------------------------
      if (apiEndpoint.includes('anmegammain')) {
        const sections = [];
        if (Array.isArray(d?.newlist)) {
          d.newlist.forEach(item => {
            if (Array.isArray(item?.data) && item.data.length > 0) {
              sections.push({
                title: item.title || '',
                id: item.id || '',
                data: item.data.slice(0, 3),
                link: item.link,
                slug: item.slug,
                _isAnmegamSection: true,
              });
            }
          });
        }
        const tabs = d?.subcatlist || [];
        setSubTabs(tabs);
        setAllSections(sections);
        setTaboolaAds(d?.taboola_ads?.mobile || null);
        setActiveTab({ title: 'Photo', link: apiEndpoint, _isAllTab: true });
        return;
      }

      // -- Handle /anmegam (parent) ------------------------------------------
      // -- Handle /anmegam (parent) ------------------------------------------
      if (apiEndpoint.includes('anmegam')) {
        const anmegamSections = [];
        if (d?.newlist?.length > 0) {
          d.newlist.forEach(item => {
            if (item.data?.length > 0) {
              anmegamSections.push({
                title: item.title,
                id: item.id,
                data: [{
                  _isCategoryCard: true,
                  images: item.images,
                  largeimages: item.images,
                  title: item.title,
                  engtitle: item.engtitle,
                  link: item.link,
                  slug: item.slug,
                  maincat: item.maincat,
                  maincategory: item.maincategory,
                  maincatid: item.maincatid,
                  id: item.id,
                }],
                link: item.link,
                slug: item.slug,
                maincat: item.maincat,
                maincatid: item.maincatid,
              });
            }
          });
        }

        const tabs = d?.subcatlist || [];
        setSubTabs(tabs);
        setAllSections(anmegamSections);
        setTaboolaAds(d?.taboola_ads?.mobile || null);
        setActiveTab({ title: 'Photo', link: apiEndpoint, _isAllTab: true });

        // ? FIX: if initialTabLink is set (e.g. Islam from drawer), push directly to that child screen
        if (initialTabLink && initialTabLink !== '/anmegam' && initialTabLink !== allTabLink) {
          const preselected = tabs.find(t =>
            t.link === initialTabLink ||
            (initialTabId && String(t.id) === String(initialTabId))
          );
          if (preselected && preselected.link?.includes('anmegammain')) {
            navigation.push('CommonSectionScreen', {
              screenTitle: preselected.title,
              apiEndpoint: preselected.link,
              allTabLink: preselected.link,
              useFullUrl: false,
            });
          }
        }

        return;
      }
      // -- existing logic ----------------------------------------------------

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

      const sectionsWithData = rawSections.filter(sec => Array.isArray(sec?.data) && sec.data.length > 0);
      let finalSections = sectionsWithData;

      if (!finalSections.length && rawSections.length > 0) {
        const firstItem = rawSections[0];
        const isArticle = firstItem?.newsid || firstItem?.id || firstItem?.nid || firstItem?.newstitle || firstItem?.title || firstItem?.slug;
        if (isArticle) finalSections = [{ title: '', id: 'all', data: rawSections }];
      }

   if (apiEndpoint === '/joshiyam') {
  const RASI_TITLES = ['மேஷம்', 'ரிஷபம்', 'மிதுனம்', 'கடகம்', 'சிம்மம்', 'கன்னி',
    'துலாம்', 'விருச்சிகம்', 'தனுசு', 'மகரம்', 'கும்பம்', 'மீனம்'];
  finalSections = finalSections.filter(sec => {
    const t = (sec.title || '').toLowerCase().trim();
    return !RASI_TITLES.some(r => t.includes(r.toLowerCase()));
  });

  // ✅ Auto-select todayrasi tab instead of showing All view
  setSubTabs(tabs);
  setAllSections(finalSections);
  setTaboolaAds(d?.taboola_ads?.mobile || null);

  // Check if there's an initialTabId to preselect
  if (initialTabId && initialTabId !== 'all') {
    const preselected = tabs.find(t => String(t.id) === String(initialTabId));
    if (preselected) {
      setActiveTab({ ...preselected, _isAllTab: false });
      setTabLoading(true);
      fetchTabNews(preselected, 1, false);
      return;
    }
  }

  // Default: auto-select todayrasi
  const todayRasiTab = tabs.find(t => String(t.id) === 'todayrasi');
  if (todayRasiTab) {
    setActiveTab({ ...todayRasiTab, _isAllTab: false });
    setTabLoading(true);
    fetchTabNews(todayRasiTab, 1, false);
    return; // ✅ MUST return to skip the generic tab logic below
  }
}

      // -- Handle varavaram data - limit each category to 3 items -----------------
      if (apiEndpoint?.includes('varavaram') || apiEndpoint?.includes('api-st.dinamalar.com/varavaram')) {
        // console.log('[Varavaram] API Endpoint:', apiEndpoint);
        // console.log('[Varavaram] Raw data structure:', Object.keys(d || {}));
        // console.log('[Varavaram] Raw sections:', rawSections.length);
        // console.log('[Varavaram] Raw sections data:', rawSections.map(s => ({ title: s.title, dataCount: Array.isArray(s.data) ? s.data.length : 'not array' })));
        // console.log('[Varavaram] Final sections before limiting:', finalSections.length);

        // Apply limiting to both rawSections and finalSections
        const limitedRawSections = rawSections.map(section => ({
          ...section,
          data: Array.isArray(section.data) ? section.data.slice(0, 3) : section.data
        }));

        finalSections = finalSections.map(section => {
          const limitedData = Array.isArray(section.data) ? section.data.slice(0, 3) : section.data;
          // console.log(`[Varavaram] Section "${section.title}": ${Array.isArray(section.data) ? section.data.length : 0} -> ${Array.isArray(limitedData) ? limitedData.length : 0} items`);

          return {
            ...section,
            data: limitedData,
          };
        });

        // If finalSections is empty, use limited rawSections
        if (finalSections.length === 0 && limitedRawSections.length > 0) {
          finalSections = limitedRawSections;
          console.log('[Varavaram] Using limited raw sections instead');
        }

        // console.log('[Varavaram] Final sections after limiting:', finalSections.length);
        // console.log('[Varavaram] Final sections data:', finalSections.map(s => ({ title: s.title, dataCount: Array.isArray(s.data) ? s.data.length : 'not array' })));
      }

      // -- Handle varamalar data - limit each category to 3 items -----------------
      if (apiEndpoint?.includes('varamalar') || apiEndpoint?.includes('varavaram') || apiEndpoint?.includes('api-st.dinamalar.com/varamalar')) {
        // console.log('[Varamalar] API Endpoint:', apiEndpoint);
        // console.log('[Varamalar] Raw data structure:', Object.keys(d || {}));
        // console.log('[Varamalar] Raw sections:', rawSections.length);
        // console.log('[Varamalar] Raw sections data:', rawSections.map(s => ({ title: s.title, dataCount: Array.isArray(s.data) ? s.data.length : 'not array' })));
        // console.log('[Varamalar] Final sections before limiting:', finalSections.length);

        // Apply limiting to both rawSections and finalSections
        const limitedRawSections = rawSections.map(section => ({
          ...section,
          data: Array.isArray(section.data) ? section.data.slice(0, 3) : section.data
        }));

        finalSections = finalSections.map(section => {
          const limitedData = Array.isArray(section.data) ? section.data.slice(0, 3) : section.data;
          // console.log(`[Varamalar] Section "${section.title}": ${Array.isArray(section.data) ? section.data.length : 0} -> ${Array.isArray(limitedData) ? limitedData.length : 0} items`);

          // Don't limit special sections like top10 and mostcommented
          if (section._isMostViewed || section._isMostCommented) {
            return {
              ...section,
              data: section.data // Keep full data for special sections
            };
          }

          return {
            ...section,
            data: limitedData
          };
        });

        // If finalSections is empty, use limited rawSections
        if (finalSections.length === 0 && limitedRawSections.length > 0) {
          finalSections = limitedRawSections;
          console.log('[Varamalar] Using limited raw sections instead');
        }

        // Add top10 section if available (for varamalar)
        if (d?.top10?.data && Array.isArray(d.top10.data) && d.top10.data.length > 0) {
          finalSections.push({
            title: d.top10.title || 'அதிகம் பார்த்தவை',
            id: 'most_viewed',
            data: d.top10.data.map(item => ({
              ...item,
              _isMostViewed: true,
              _isSpecialSection: true,
              _sectionType: 'most_viewed'
            })),
            _isVaramalarSection: true,
            _isMostViewed: true,
          });
        }

        // Add mostcommented section if available (for varamalar)
        if (d?.mostcommented?.data && Array.isArray(d.mostcommented.data) && d.mostcommented.data.length > 0) {
          finalSections.push({
            title: d.mostcommented.title || 'அதிகம் கருத்துகள்',
            id: 'most_commented',
            data: d.mostcommented.data.map(item => ({
              ...item,
              _isMostCommented: true,
              _isSpecialSection: true,
              _sectionType: 'most_commented'
            })),
            _isVaramalarSection: true,
            _isMostCommented: true,
          });
        }

        // console.log('[Varamalar] Final sections after limiting:', finalSections.length);
        // console.log('[Varamalar] Final sections data:', finalSections.map(s => ({ title: s.title, dataCount: Array.isArray(s.data) ? s.data.length : 'not array' })));
      }

      // -- Handle special data - limit each category to 3 items -----------------
      if (apiEndpoint?.includes('special') || apiEndpoint?.includes('api-st.dinamalar.com/special')) {
        // console.log('[Special] API Endpoint:', apiEndpoint);
        // console.log('[Special] Raw data structure:', Object.keys(d || {}));
        // console.log('[Special] Raw sections:', rawSections.length);
        // console.log('[Special] Raw sections data:', rawSections.map(s => ({ title: s.title, dataCount: Array.isArray(s.data) ? s.data.length : 'not array' })));
        // console.log('[Special] Final sections before limiting:', finalSections.length);

        // Apply limiting to both rawSections and finalSections
        const limitedRawSections = rawSections.map(section => ({
          ...section,
          data: Array.isArray(section.data) ? section.data.slice(0, 3) : section.data
        }));

        finalSections = finalSections.map(section => {
          const limitedData = Array.isArray(section.data) ? section.data.slice(0, 3) : section.data;
          // console.log(`[Special] Section "${section.title}": ${Array.isArray(section.data) ? section.data.length : 0} -> ${Array.isArray(limitedData) ? limitedData.length : 0} items`);

          return {
            ...section,
            data: limitedData
          };
        });

        // If finalSections is empty, use limited rawSections
        if (finalSections.length === 0 && limitedRawSections.length > 0) {
          finalSections = limitedRawSections;
          console.log('[Special] Using limited raw sections instead');
        }

        // console.log('[Special] Final sections after limiting:', finalSections.length);
        // console.log('[Special] Final sections data:', finalSections.map(s => ({ title: s.title, dataCount: Array.isArray(s.data) ? s.data.length : 'not array' })));
      }

      // -- Handle malargal data - add top10 and mostcommented sections -----------------
      if (apiEndpoint?.includes('malargal') || apiEndpoint?.includes('malarkal') || apiEndpoint?.includes('weekly')) {
        // Add top10 section if available
        if (d?.top10?.data && Array.isArray(d.top10.data) && d.top10.data.length > 0) {
          finalSections.push({
            title: d.top10.title || 'அதிகம் பார்த்தவை',
            id: 'most_viewed',
            data: d.top10.data.map(item => ({
              ...item,
              _isMostViewed: true,
              _isSpecialSection: true,
              _sectionType: 'most_viewed'
            })),
            _isMalargalSection: true,
            _isMostViewed: true,
          });
        }

        // Add mostcommented section if available
        if (d?.mostcommented?.data && Array.isArray(d.mostcommented.data) && d.mostcommented.data.length > 0) {
          finalSections.push({
            title: d.mostcommented.title || 'அதிகம் கருத்துகள்',
            id: 'most_commented',
            data: d.mostcommented.data.map(item => ({
              ...item,
              _isMostCommented: true,
              _isSpecialSection: true,
              _sectionType: 'most_commented'
            })),
            _isMalargalSection: true,
            _isMostCommented: true,
          });
        }
      }

      setAllSections(finalSections);
      setTaboolaAds(d?.taboola_ads?.mobile || null);

      if (initialTabId || initialTabLink) {
        // console.log('?? DEBUG: Looking for initial tab - initialTabId:', initialTabId, 'initialTabLink:', initialTabLink);
        // console.log('?? DEBUG: Available tabs:', tabs.map(t => ({ id: t.id, title: t.title, link: t.link })));

        const preselected = tabs.find(t =>
          (initialTabId && String(t.id) === String(initialTabId)) ||
          (initialTabLink && t.link === initialTabLink)
        );

        // console.log('?? DEBUG: Preselected tab found:', !!preselected, preselected ? preselected.title : 'Not found');

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
        setActiveTab({ title: 'All', link: apiEndpoint, _isAllTab: true });
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
      setRasiDetailItem(null);
      fetchAll();
    }, [fetchAll])
  );

  // -- Tab press --------------------------------------------------------------
  const handleTabPress = (tab) => {
    // console.log('?? Tab Press Debug - Tab pressed:', tab);
    // console.log('?? Tab Press Debug - Current activeTab:', activeTab);
    // console.log('?? Tab Press Debug - API endpoint:', apiEndpoint);
    // console.log('?? Tab Press Debug - All subTabs:', subTabs);

    setRasiDetailItem(null);

  if (apiEndpoint === '/joshiyam' && (tab._isAllTab || tab.link === allTabLink)) {
    const todayRasiTab = subTabs.find(t => String(t.id) === 'todayrasi');
    if (todayRasiTab) {
      setActiveTab({ ...todayRasiTab, _isAllTab: false });
      setTabLoading(true);
      setTabNews([]); setTabPage(1); setTabLastPage(1);
      fetchTabNews(todayRasiTab, 1, false);
      return;
    }
  }

    const pressedIsAll = !!tab._isAllTab || tab.link === allTabLink || (tab.id === 'webstories' && (apiEndpoint?.includes('webstoriesupdate') || apiEndpoint?.includes('webstorieslisting')));
    // ? 1. NRI country sub-tab clicked ? filter articles for that country
    // Replace _isNriCountryTab handler:
    if (tab._isNriCountryTab) {
      // Build dynamic mapping from nricondition data
      const tamilToEnglishMap = {};
      nriCondition.forEach(region => {
        // Map English region IDs to Tamil titles based on available data
        const regionTitles = {
          'america': 'அமெரிக்கா',
          'europe': 'ஐரோப்பா',
          'africa': 'ஆப்ரிக்கா',
          'gulf': 'வளைகுடா',
          'asia': 'ஆசியா',
          'australia': 'ஆஸ்திரேலியா',
          'singapore': 'சிங்கப்பூர்',
        };
        const tamilTitle = regionTitles[region.id] || region.id;
        tamilToEnglishMap[tamilTitle] = region.id;
      });

      // Fallback to hardcoded mapping if nricondition is empty
      if (Object.keys(tamilToEnglishMap).length === 0) {
        Object.assign(tamilToEnglishMap, {
          'வளைகுடா': 'gulf',
          'அமெரிக்கா': 'america',
          'ஐரோப்பா': 'europe',
          'ஆப்ரிக்கா': 'africa',
          'ஆஸ்திரேலியா': 'australia',
          'சிங்கப்பூர்': 'singapore',
          'ஆசியா': 'asia'
        });
      }

      // Debug: Log exact tab.title for debugging
      // console.log('?? DEBUG - Tab title for mapping:', JSON.stringify(tab.title));
      // console.log('?? DEBUG - Available mappings:', Object.keys(tamilToEnglishMap));

      const regionId = tamilToEnglishMap[tab.title] || tab.id?.toLowerCase();

      // ? FIX: Detect language from the current activeTab first, then from the tab itself
      const isEnglishVersion = activeTab?._isEnglishVersion || tab._isEnglishVersion || tab.link?.includes('lang=en');

      // ? FIX: Use clean region ID without language suffixes
      const cleanRegionId = regionId.replace(/_en$/, '').replace(/_en_en$/, '');
      const regionLink = isEnglishVersion
        ? `/nricategory?cat=${cleanRegionId}&lang=en`
        : `/nricategory?cat=${cleanRegionId}&lang=ta`;

      // console.log('?? Country Tab Click - Title:', tab.title, '? Region ID:', cleanRegionId, '? API:', regionLink);
      // console.log('?? Country Tab Click - Language:', isEnglishVersion ? 'English' : 'Tamil');
      // console.log('?? Country Tab Click - ActiveTab language:', activeTab?._isEnglishVersion ? 'English' : 'Tamil');

      // ? Check if language changed
      const languageChanged = activeTab?._isEnglishVersion !== isEnglishVersion;
      // console.log('?? Country Tab Click - Language changed:', languageChanged);

      // Set activeTab with correct flags for country tabs
      const newActiveTab = {
        ...tab,
        _isAllTab: false,        // ? FIX: Should be false for country-specific view
        _isNriSubTab: true,
        _nriTabId: 'nri',
        _nriCountryTab: true,
        _isNriRegionTab: true,
        _isEnglishVersion: isEnglishVersion,
        _nriRegionId: cleanRegionId, // ? FIX: Use clean region ID
        _nriRegionTitle: tab.title,
      };

      // console.log('?? Country Tab - Setting activeTab to:', newActiveTab);
      setActiveTab(newActiveTab);

      setTabLoading(true);
      setTabNews([]); setTabPage(1); setTabLastPage(1);
      // Treat it like a /nri region tab fetch
      fetchTabNews({
        ...tab,
        id: regionId,
        link: regionLink,
        _isAllTab: false,
        _isNriRegionFetch: true
      }, 1, false, nriCondition);
    }

    // ? 5. NRI subcategory tab (News, Temple, Tamil Association, etc.) ? always fetch fresh data
    if (tab._isNriSubCatTab) {
      console.log('?? NRI SubCat Tab Pressed - Tab:', tab);
      console.log('?? NRI SubCat Tab - Tab link:', tab.link);
      console.log('?? NRI SubCat Tab - Tab ID:', tab.id);
      console.log('?? NRI SubCat Tab - Tab language:', tab._isEnglishVersion ? 'English' : 'Tamil');
      console.log('?? NRI SubCat Tab - Full API endpoint that will be called:', tab.link);

      // Always fetch fresh data for subcategories to ensure correct language and avoid "item doesn't exist" errors
      console.log('?? NRI SubCat Tab - Fetching fresh data for:', tab.id);
      setTabLoading(true);
      setTabNews([]);

      setActiveTab(prev => ({
        ...prev,
        _isAllTab: false,
        _isNriRegionTab: true,
        _isEnglishVersion: tab._isEnglishVersion,  // ? carry language forward
        _activeSubCat: tab.id,
        _activeSubCatTitle: tab.title,
      }));

      // Fetch data directly for this subcategory with correct language
      fetchTabNews({
        ...tab,
        _isNriSubCatTab: false,
        _isNriRegionFetch: false,
        // tab.link already has the correct englishlink/tamillink with lang parameter
      }, 1, false);
      return;
    }

    // ? 4. NRI sub-tab (செய்திகள், Nri news etc) ? fetch and group by country
    if (apiEndpoint === '/nrimain' && !pressedIsAll && !tab._isNriSubCatTab && !tab._isNriRegionAllTab) {
      // console.log('?? NRI Main Tab Pressed - Tab:', tab);
      // console.log('?? NRI Main Tab - Setting activeTab to main NRI tab');
      // console.log('?? NRI Main Tab - Tab language:', tab._isEnglishVersion ? 'English' : 'Tamil');
      // console.log('?? NRI Main Tab - ActiveTab language:', activeTab?._isEnglishVersion ? 'English' : 'Tamil');
      // console.log('?? Fetching NRI tab URL:', tab.link);

      // Check if language changed
      const languageChanged = activeTab?._isEnglishVersion !== tab._isEnglishVersion;

      // Set activeTab immediately before fetchTabNews
      setActiveTab({
        ...tab,
        _isAllTab: false,
        _isEnglishVersion: tab._isEnglishVersion // Preserve language flag
      });

      // console.log('?? NRI Main Tab - Language changed:', languageChanged);
      // console.log('?? NRI Main Tab - Calling fetchTabNews');
      setTabLoading(true);
      setTabNews([]); setTabPage(1); setTabLastPage(1);
      fetchTabNews({
        ...tab,
        _isAllTab: false,
        _isEnglishVersion: tab._isEnglishVersion // Pass language flag to fetch
      }, 1, false);
      return;
    }

    // -- /anmegam parent ? clicking கோயில்கள்/ஆன்மிகம் etc ? push /anmegammain screen
    if (
      apiEndpoint.includes('anmegam') &&
      !apiEndpoint.includes('anmegammain') &&
      !pressedIsAll &&
      tab.link?.includes('anmegammain')
    ) {
      navigation.push('CommonSectionScreen', {
        screenTitle: tab.title,
        apiEndpoint: tab.link,
        allTabLink: tab.link,
        useFullUrl: false,
      });
      return;
    }

    // -- /anmegammain ? clicking ஆன்மிகம்/ஜோசியம் etc ? push /anmegammainlist screen
    if (
      apiEndpoint.includes('anmegammainlist') &&
      !pressedIsAll &&
      tab.link?.includes('anmegammainlist') &&
      tab.link !== apiEndpoint  // ? not the same tab
    ) {
      navigation.push('CommonSectionScreen', {
        screenTitle: tab.title,
        apiEndpoint: tab.link,
        allTabLink: allTabLink,
        useFullUrl: false,
      });
      return;
    }

    // -- Webstories tab from photo section ? navigate to webstories screen --
    if (apiEndpoint.includes('photodata') && tab.id === 'webstories') {
      navigation.push('CommonSectionScreen', {
        screenTitle: 'வெப்ஸ்டோரிகள்',
        apiEndpoint: '/webstoriesupdate',
        allTabLink: '/webstoriesupdate',
        useFullUrl: false,
      });
      return;
    }

 

    // -- Webstories sub-tab ? pressing All goes back to webstoriesupdate --
    if (apiEndpoint.includes('webstorieslisting') && pressedIsAll) {
      navigation.push('CommonSectionScreen', {
        screenTitle: screenTitle,
        apiEndpoint: '/webstoriesupdate',
        allTabLink: '/webstoriesupdate',
        useFullUrl: false,
      });
      return;
    }

    // -- /anmegammainlist ? clicking "All" tab ? push /anmegammain screen
    // ? MUST be before alreadyActive check   otherwise blocked when activeTab._isAllTab=true
    if (
      apiEndpoint.includes('anmegammainlist') &&
      pressedIsAll &&
      tab.link?.includes('anmegammain')
    ) {
      navigation.push('CommonSectionScreen', {
        screenTitle: tab.title || screenTitle,
        apiEndpoint: tab.link,
        allTabLink: tab.link,
        useFullUrl: false,
      });
      return;
    }

    // ? alreadyActive check AFTER navigation.push cases above
    const alreadyActive = activeTab
      ? (tabIsAll(tab) ? tabIsAll(activeTab) : String(activeTab.id) === String(tab.id))
      : false;

    // For photo endpoints, always refresh All tab data to ensure sections are restored
    if (pressedIsAll && (apiEndpoint.includes('photodata') || apiEndpoint.includes('photoitem'))) {
      setTabNews([]); setTabPage(1); setTabLastPage(1);
      fetchAll();
      return;
    }

    // -- PugarPetti tab from dinamdinam ? navigate to PugarPettiScreen --
    if (apiEndpoint?.includes('dinamdinam') && tab.link === '/pugarpetti') {
      console.log('?? PugarPetti tab pressed - navigating to PugarPettiScreen');
      navigation.navigate('PugarPettiScreen', {
        screenTitle: 'புகார் பெட்டி',
        initialDistrictId: null,
      });
      return;
    }

    if (alreadyActive) return;

    const nextTab = { ...tab, _isAllTab: pressedIsAll };
    setActiveTab(nextTab);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });

    if (pressedIsAll) {
      setTabNews([]); setTabPage(1); setTabLastPage(1);
      // For photo endpoints, we need to fetch all to restore photo sections
      if (apiEndpoint.includes('photodata') || apiEndpoint.includes('photoitem')) {
        fetchAll();
      } else {
        fetchAll();
      }
      return;
    }
    setTabLoading(true);
    setTabNews([]); setTabPage(1); setTabLastPage(1);
    fetchTabNews(nextTab, 1, false);
  };

  // ── Swipe to next / previous tab ─────────────────────────────────────────
  //
  //  Swipe LEFT  → go to NEXT tab  (e.g. All → Cricket → Tennis →…)
  //  Swipe RIGHT → go to PREV tab  (e.g. Tennis → Cricket → All)
  //
  //  Thresholds:
  //    dx >  50 px  AND velocity > 0.3  → right-swipe  (go prev)
  //    dx < -50 px  AND velocity > 0.3  → left-swipe   (go next)
  //
  const SWIPE_THRESHOLD = 50;   // minimum horizontal distance (px)
  const SWIPE_VELOCITY  = 0.3;  // minimum velocity

  const panResponder = useRef(
    PanResponder.create({
      // Only claim the gesture when horizontal movement clearly dominates
      onMoveShouldSetPanResponder: (_, gs) => {
        return (
          Math.abs(gs.dx) > Math.abs(gs.dy) &&   // horizontal dominates
          Math.abs(gs.dx) > 10                     // at least 10 px moved
        );
      },
      onPanResponderRelease: (_, gs) => {
        const tabs     = subTabsRef.current;
        const curTab   = activeTabRef.current;
        if (!tabs.length) return;

        // Find the index of the current tab
        const curIndex = curTab
          ? tabs.findIndex(t =>
              curTab.title === 'All'
                ? t.title === 'All'
                : String(t.id) === String(curTab.id)
            )
          : 0;

        const isRightSwipe = gs.dx > SWIPE_THRESHOLD && Math.abs(gs.vx) > SWIPE_VELOCITY;
        const isLeftSwipe  = gs.dx < -SWIPE_THRESHOLD && Math.abs(gs.vx) > SWIPE_VELOCITY;

        if (isRightSwipe && curIndex > 0) {
          // Go to previous tab
          const prevTab = tabs[curIndex - 1];
          // Use setActiveTab + fetchTabNews directly (avoid stale closure in handleTabPress)
          setActiveTab(prevTab);
          if (prevTab.title === 'All') {
            setTabNews([]);
          } else {
            setTabLoading(true);
            setTabNews([]);
            setTabPage(1);
            setTabLastPage(1);
          }
        } else if (isLeftSwipe && curIndex < tabs.length - 1) {
          // Go to next tab
          const nextTab = tabs[curIndex + 1];
          setActiveTab(nextTab);
          if (nextTab.title === 'All') {
            setTabNews([]);
          } else {
            setTabLoading(true);
            setTabNews([]);
            setTabPage(1);
            setTabLastPage(1);
          }
        }
      },
    })
  ).current;

  // Whenever activeTab changes via swipe, fetch news for the new tab
  // (We can't call fetchTabNews inside PanResponder due to stale closures,
  //  so we watch activeTab here instead.)
  const prevActiveTabRef = useRef(null);
  useEffect(() => {
    if (!activeTab) return;
    const prev = prevActiveTabRef.current;
    // Skip on first mount (fetchAll already handles it)
    if (!prev) { prevActiveTabRef.current = activeTab; return; }
    // Check if tab actually changed
    const changed = prev.title !== activeTab.title || String(prev.id) !== String(activeTab.id);
    if (changed && activeTab.title !== 'All') {
      setTabLoading(true);
      setTabNews([]); setTabPage(1); setTabLastPage(1);
      fetchTabNews(activeTab, 1, false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!selectedNewsId || !flatListRef.current) return;

    console.log('CommonSectionScreen - Looking for selectedNewsId:', selectedNewsId);
    console.log('CommonSectionScreen - Available tabNews:', tabNews.length);
    console.log('CommonSectionScreen - Available allSections:', allSections.length);
    console.log('CommonSectionScreen - Active tab:', activeTab?.id);

    // For photo tabs with specific tabId (not All tab), search in tabNews
    if (selectedNewsId && tabNews.length > 0 && !tabIsAll(activeTab)) {
      const selectedIndex = tabNews.findIndex(item => 
        String(item.newsid || item.id) === String(selectedNewsId)
      );
      
      if (selectedIndex !== -1) {
        console.log('CommonSectionScreen - Found selected item in tabNews at index:', selectedIndex);
        setTimeout(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToIndex({
              index: selectedIndex,
              animated: true,
              viewPosition: 0.5
            });
            console.log('CommonSectionScreen - Scrolled to selected item in tabNews');
          }
        }, 500);
        return;
      }
    }

    // Search in allSections too (for photo All tab view)
    const searchInAllSections = () => {
      for (const section of allSections) {
        const idx = (section.data || []).findIndex(item =>
          String(item.newsid || item.id || item.eventid) === String(selectedNewsId)
        );
        if (idx !== -1) return { section, item: section.data[idx], sectionIndex: allSections.indexOf(section) };
      }
      return null;
    };

    const found = searchInAllSections();
    if (!found) {
      console.log('CommonSectionScreen - Selected item not found in allSections');
      console.log('CommonSectionScreen - Available section IDs:', allSections.slice(0, 3).map(s => ({
        id: s.id,
        title: s.title,
        itemCount: s.data?.length || 0
      })));
      return;
    }

    console.log('CommonSectionScreen - Found selected item in allSections:', {
      sectionTitle: found.section.title,
      sectionIndex: found.sectionIndex,
      itemTitle: found.item.newstitle || found.item.title
    });

    // Rebuild flatData with selected item first
    const reorderSections = () => {
      const reordered = allSections.map(section => {
        const idx = (section.data || []).findIndex(item =>
          String(item.newsid || item.id || item.eventid) === String(selectedNewsId)
        );
        if (idx === -1) return section;
        // Move matched item to front of this section
        const reorderedData = [
          section.data[idx],
          ...section.data.slice(0, idx),
          ...section.data.slice(idx + 1),
        ];
        return { ...section, data: reorderedData };
      });

      // Move the section containing the item to front
      const targetSectionIdx = reordered.findIndex(s =>
        (s.data || []).some(item =>
          String(item.newsid || item.id || item.eventid) === String(selectedNewsId)
        )
      );
      if (targetSectionIdx > 0) {
        const [targetSection] = reordered.splice(targetSectionIdx, 1);
        reordered.unshift(targetSection);
      }
      return reordered;
    };

    setAllSections(reorderSections());

    // Scroll to top after reorder (selected item is now first)
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      console.log('CommonSectionScreen - Scrolled to top after reordering');
    }, 300);

  }, [selectedNewsId, tabNews, allSections.length, activeTab]);

  const handleLoadMore = () => {
    // Allow load more for NRI region tabs even when _isAllTab is true
    if (isAllTab && !activeTab?._isNriRegionTab) return;
    if (tabLoadMore || tabPage >= tabLastPage) return;
    setTabLoadMore(true);
    fetchTabNews(activeTab, tabPage + 1, true);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    if (tabIsAll(activeTab)) {
      fetchAll();
    } else {
      fetchTabNews(activeTab, 1, false);
    }
  };

  const goToArticle = (item) => {
    if (!item) {
      console.warn('goToArticle called with null/undefined item');
      return;
    }

    // -- Check if item has video --------------------------------------------------
    const hasVideo = (item.video === '1' || item.video === 1 ||
      (typeof item.video === 'string' && item.video.length > 0) ||
      item.video === true);

    if (hasVideo) {
      console.log('?? Video item detected - navigating to NewsDetailsScreen');
      navigation.navigate('NewsDetailsScreen', {
        newsId: item.newsid || item.id,
        video: item,
        slug: item.slug || item.reacturl || '',
        videoUrl: item.video,
      });
      return;
    }
    // -- 1. NRI -------------------------------------------------------------------------
    // -- 1. NRI -----------------------------------------------------------------
    if (apiEndpoint === '/nrimain' || apiEndpoint.includes('/nri') || apiEndpoint.includes('otherstatenews')) {
      // Detect NRI English mode
      const isEnglish = activeTab?._isEnglishVersion ||
        item.link?.includes('lang=en') ||
        item.com_cat === 'nrienglish' ||
        item.com_cat === 'en' ||
        item.reacturl?.includes('world-news-nri-en') ||
        item.slug?.includes('world-news-nri-en');

      // Handle special case for Most Commented and Most Viewed items using flags
      const isSpecialSection = item._isSpecialSection || item._isMostCommented || item._isMostViewed;

      console.log(' NRI Item Debug:', {
        newsId: item.newsid,
        id: item.id,
        slug: item.slug,
        reacturl: item.reacturl,
        link: item.link,
        maincategory: item.maincategory,
        isEnglish: isEnglish,
        _isSpecialSection: item._isSpecialSection,
        _isMostCommented: item._isMostCommented,
        _isMostViewed: item._isMostViewed,
        _sectionType: item._sectionType
      });

      // For Most Commented/Viewed items, use a different navigation approach
      if (isSpecialSection) {
        // Use the slug or reacturl to construct the proper URL
        const itemSlug = item.slug || item.reacturl || item.catslug || '';
        const itemLink = item.link || '';

        console.log('?? Navigating to Special Section item with slug:', itemSlug, 'link:', itemLink);
        navigation.navigate('NewsDetailsScreen', {
          newsId: item.id,
          video: item,
          slug: itemSlug,
          nriDetailLink: itemLink.startsWith('/') ? itemLink : `/${itemLink}`, // ? pass the full link with lang
          isNriEnglish: isEnglish,
          disableComments: false,
          _isSpecialSection: true,
          _sectionType: item._sectionType
        });
        return;
      }

      // ? For regular NRI items, pass the nriDetailLink
      const nriSlug = item.slug || item.reacturl || '';

      // item.link is like "nridetail?cat=53&lang=en"   needs leading slash
      let nriDetailLink = item.link || '';
      if (nriDetailLink && !nriDetailLink.startsWith('/')) {
        nriDetailLink = `/${nriDetailLink}`;
      }
      // If no link, build it
      if (!nriDetailLink) {
        const lang = isEnglish ? 'en' : 'ta';
        nriDetailLink = `/nridetail?cat=${item.newsid || item.id}&lang=${lang}`;
      }

      console.log('?? NRI goToArticle - nriDetailLink:', nriDetailLink);
      navigation.navigate('NewsDetailsScreen', {
        newsId: item.newsid || item.id,
        video: item,
        slug: nriSlug,
        nriDetailLink,
        isNriEnglish: isEnglish,
        disableComments: false,
      });
      return;
    }

    if (apiEndpoint.includes('anmegammain') && !apiEndpoint.includes('anmegammainlist')) {
      const targetTab = subTabs.find(t =>
        String(t.id) === String(item.maincatid) ||
        t.title === item.categrorytitle ||
        t.title === item.maincat
      );
      if (targetTab?.link?.includes('anmegammainlist')) {
        navigation.push('CommonSectionScreen', {
          screenTitle: targetTab.title,
          apiEndpoint: targetTab.link,
          allTabLink: apiEndpoint,
          useFullUrl: false,
        });
        return;
      }
    }

    if (item._isCategoryCard && apiEndpoint.includes('anmegam')) {
      const targetTab = subTabs.find(t =>
        String(t.id) === String(item.maincatid) ||
        t.link === item.link ||
        t.title === item.title
      );
      if (targetTab) { handleTabPress(targetTab); return; }
    }

    // -- 3. Varavaram ---------------------------------------------------------------
    if (apiEndpoint?.includes('varavaram')) {
      if (isAllTab) {
        // When in All tab of varavaram, navigate to specific sub-tab based on item data
        const targetTab = subTabs.find(t =>
          String(t.id) === String(item.maincatid) ||
          String(t.id) === String(item.scatid) ||
          String(t.id) === String(item.subcatid) ||
          t.title === item.categrorytitle ||
          t.title === item.maincat ||
          t.title === item.subcat
        );

        if (targetTab) {
          console.log('?? Varavaram item clicked - navigating to tab:', targetTab.title, 'ID:', targetTab.id);
          handleTabPress(targetTab);
          return;
        }
      } else {
        // When in a specific varavaram sub-tab, navigate to CommonSectionScreen with that tab
        // This handles cases where user clicks on items that should open in the same tab structure
        if (item.maincatid || item.scatid || item.subcatid) {
          const tabId = String(item.maincatid || item.scatid || item.subcatid);
          const targetTab = subTabs.find(t => String(t.id) === tabId);

          if (targetTab && targetTab.title === 'நிஜக்கதி') {
            console.log('?? Nijakkathi item clicked - opening in CommonSectionScreen with nijakkathi tab');
            navigation.push('CommonSectionScreen', {
              screenTitle: 'நிஜக்கதி',
              apiEndpoint: 'https://api-st.dinamalar.com/varavaram',
              initialTabId: '644',
              allTabLink: 'https://api-st.dinamalar.com/varavaram'
            });
            return;
          }
        }
      }
    }

    // -- 4. Photo ----------------------------------------------------------------
    const isPhotoEndpoint =
      apiEndpoint.includes('photodata') ||
      apiEndpoint.includes('photodetails') ||
      apiEndpoint.includes('photoitem') ||
      allSections.some(s => PHOTO_SECTION_IDS.includes(String(s.id)));

    if (isPhotoEndpoint) {
      // top10 / mostcommented items are news articles   send to NewsDetailsScreen
      const isNewsItem =
        item.maincategory === 'seithigal' ||
        !!item.newstitle ||
        String(item.maincatid) === '100' ||
        String(item.maincatid) === '89';

      // if (isNewsItem) {
      //   navigation.navigate('NewsDetailsScreen', {
      //     newsId: item.newsid || item.id,
      //     video: item,
      //     slug: item.slug || item.reacturl || '',
      //     disableComments: false,
      //   });
      //   return;
      // }

      const matchedSection = allSections.find(s =>
        (s.data || []).some(d =>
          d === item ||
          (d.eventid && d.eventid === item.eventid) ||
          (d.id && d.id === item.id)
        )
      );
      // Sub-tab already active   use its link directly
      if (!isAllTab && activeTab?.link) {
        navigation.navigate('PhotoDetailsScreen', {
          screenTitle: activeTab?.title || 'புகைப்படங்கள்',
          photoItem: item,
          apiEndpoint: normalizePhotoEndpoint(activeTab.link),
          isFromAllTab: false,
        });
        return;
      }

      // All tab   check if this is a "today" section item, if so navigate to today tab instead
      if (isAllTab) {
        const todaySectionId = '81';
        const itemSectionId = matchedSection?.id || String(item.maincatid || item.category || '');
        if (itemSectionId === todaySectionId) {
          const todayTab = subTabs.find(t => String(t.id) === todaySectionId);
          if (todayTab) { handleTabPress(todayTab); return; }
        }
      }

      // All tab   map section ID ? correct /photodetails endpoint
      const photoEndpointMap = {
        '81': '/photodetails?cat=81',
        '5001': '/photodetails?cat=5001',
        '5002': '/photodetails?cat=5002',
        '5003': '/photodetails?cat=5003',
      };

      // Find which section this item belongs to
      // const matchedSection = allSections.find(s =>
      //   (s.data || []).some(d =>
      //     d === item ||
      //     (d.eventid && d.eventid === item.eventid) ||
      //     (d.id && d.id === item.id)
      //   )
      // );

      const sectionId = matchedSection?.id || String(item.maincatid || item.category || '');
      const photoEndpoint = photoEndpointMap[sectionId];

      // Fallback by maincat title
      const titleToId = {
        'இன்றைய புகைப்படம்': '81',
        'பொகை மடம் புகைப்படம்': '5001',
        'கார்ட்டூன்ஸ்': '5002',
        'NRI புகைப்படம்': '5003',
      };
      const fallbackId = titleToId[item.maincat || ''];
      if (fallbackId) {
        navigation.navigate('PhotoDetailsScreen', {
          screenTitle: item.maincat || 'புகைப்படங்கள்',
          photoItem: item,
          apiEndpoint: `/photodetails?cat=${fallbackId}`,
          isFromAllTab: isAllTab,
          selectedNewsId,
          selectedNewsItem
        });
        return;
      }

      // Last resort   match sub-tab by section id
      const targetTab = subTabs.find(t => String(t.id) === String(sectionId));
      if (targetTab) { handleTabPress(targetTab); return; }
    }

    // -- 4. Joshiyam ------------------------------------------------------------
    if (apiEndpoint === '/joshiyam' && isAllTab) {
      let targetTab = null;
      if (item.maincatid)
        targetTab = subTabs.find(t => String(t.id) === String(item.maincatid));
      if (targetTab && item.maincat && targetTab.title !== item.maincat) targetTab = null;
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

    // -- PugarPetti (DinamDinam) Navigation ------------------------------------
    if (apiEndpoint?.includes('dinamdinam') || apiEndpoint === '/dinamdinam') {
      // Check if this item belongs to pugarpetti section by maincatid or category
      const pugarpettiCatIds = ['1724', 1724]; // pugarpetti category id from API
      if (
        pugarpettiCatIds.includes(item.category) ||
        pugarpettiCatIds.includes(String(item.category)) ||
        item.catengtitle === 'Pugar petti' ||
        item.categrorytitle === 'புகார் பெட்டி'
      ) {
        navigation.navigate('PugarPettiScreen', {
          screenTitle: 'புகார் பெட்டி',
          initialDistrictId: item.maincatid || null,
        });
        return;
      }
    }

    // -- Aanemga Sindhanigal Navigation ----------------------------------------
    // Debug logging to understand the data structure
    console.log('?? DEBUG - Item clicked:', {
      apiEndpoint,
      maincat: item.maincat,
      categrorytitle: item.categrorytitle,
      categorytitle: item.categorytitle,
      maincatid: item.maincatid,
      id: item.id,
      title: item.title,
      newstitle: item.newstitle
    });

    // Check if item is from aanemga sindhanigal section and navigate to AanmegaSindhanaiScreen
    const isAanemgaSindhanigal = 
      apiEndpoint?.includes('anmegammain') ||
      apiEndpoint?.includes('anmegammainlist') ||
      item.maincat?.toLowerCase().includes(' Tamil') ||
      item.maincat?.toLowerCase().includes('aanmega') ||
      item.categrorytitle?.toLowerCase().includes(' Tamil') ||
      item.categrorytitle?.toLowerCase().includes('aanmega') ||
      item.categorytitle?.toLowerCase().includes(' Tamil') ||
      item.categorytitle?.toLowerCase().includes('aanmega') ||
      item.maincat?.toLowerCase().includes('spiritual') ||
      item.categrorytitle?.toLowerCase().includes('spiritual') ||
      item.title?.toLowerCase().includes(' Tamil') ||
      item.title?.toLowerCase().includes('aanmega') ||
      item.newstitle?.toLowerCase().includes(' Tamil') ||
      item.newstitle?.toLowerCase().includes('aanmega');

    console.log('?? DEBUG - isAanemgaSindhanigal:', isAanemgaSindhanigal);

    if (isAanemgaSindhanigal) {
      console.log('?? Aanemga Sindhanigal item clicked - navigating to AanmegaSindhanaiScreen');
      navigation.navigate('AanmegaSindhanaiScreen', {
        id: item.maincatid || item.id || 2, // Default to 2 if no ID found
        title: item.categrorytitle || item.maincat || ' Tamil'
      });
      return;
    }

    // -- 5. Default -------------------------------------------------------------
    // Check if item is a video and navigate to NewsDetailsScreen
    if (hasVideo) {
      navigation.navigate('NewsDetailsScreen', {
        videoId: item.newsid || item.id,
        video: item,
        slug: item.slug || item.reacturl || '',
      });
      return;
    }

    navigation.navigate('NewsDetailsScreen', {
      newsId: item.newsid || item.id || item.eventid || item.rasiid || item.nid,
      video: item,
      slug: item.slug || item.reacturl || '',
      disableComments: apiEndpoint?.includes('varavaram'),
    });

  };

  // -- Rasi card tap ? show inline detail ------------------------------------
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
        _isAnmegamSection: section._isAnmegamSection,
      });
      return tabNews.map((item, i) => ({ type: 'rasi', item, _idx: i }));
    }
    return tabNews.map((item, i) => ({ type: 'news', item, sectionTitle: activeTab?.title || '', _idx: i }));
  };

  // -- Build Flat Data for FlatList -------------------------------------------
  const buildFlatData = () => {
    console.log('[DEBUG buildFlatData] isAllTab:', isAllTab);
    console.log('[DEBUG buildFlatData] allSections:', allSections.length);
    console.log('[DEBUG buildFlatData] activeTab:', activeTab);
    console.log('[DEBUG buildFlatData] tabNews:', tabNews.length);
    console.log('[DEBUG buildFlatData] allSections data:', allSections.map(s => ({ title: s.title, dataCount: Array.isArray(s.data) ? s.data.length : 0 })));
    if (!isAllTab) {
      console.log('[DEBUG buildFlatData] tabNews data:', tabNews.slice(0, 3).map(t => ({ title: t.newstitle || t.title, id: t.newsid || t.id })));
    }

    if (isAllTab) {
      const flat = [];
      allSections.forEach(section => {
        console.log('[DEBUG buildFlatData] Processing section:', section.title, 'data length:', Array.isArray(section.data) ? section.data.length : 0);
        // Only add section title if title exists and is not empty string AND we're in main All tab (not country view)
        // Allow section headers for ulagatamilar content (varavaram) even in country views
        const allowSectionHeaders = apiEndpoint?.includes('varavaram') || !activeTab?._nriCountryTab;
        if (section.title && section.title.trim() !== '' && allowSectionHeaders) {
          console.log('[DEBUG buildFlatData] Adding section header:', section.title);
          flat.push({
            type: 'section',
            title: section.title,
            id: section.id,
            sectionLink: section.link,
            _isAnmegamSection: section._isAnmegamSection,
            _isVaramalarSection: section._isVaramalarSection,
          });
        }
        (section.data || []).forEach(item => flat.push({
          type: 'news',
          item,
          sectionTitle: section.title,
          _isAnmegamSection: section._isAnmegamSection,
          _isVaramalarSection: section._isVaramalarSection,
        }));
      });
      console.log('[DEBUG buildFlatData] Final flat data length:', flat.length);
      return flat;
    }
    // Handle NRI subcategories - use _subCatArticles if available
    if (activeTab?._isNriSubCatTab && activeTab?._subCatArticles) {
      console.log('[DEBUG buildFlatData] Using NRI subCatArticles:', activeTab._subCatArticles.length);
      return activeTab._subCatArticles.map((item, i) => ({
        type: 'news',
        item,
        sectionTitle: activeTab?.title || '',
        _idx: i
      }));
    }

    const isRasiData = RASI_TAB_IDS.includes(String(activeTab?.id));
    if (isRasiData) {
      const isIndividualRasi = tabNews.length === 1 && tabNews[0]?.rasi;
      if (isIndividualRasi) return tabNews.map((item, i) => ({ type: 'individualRasi', item, _idx: i }));
      return tabNews.map((item, i) => ({ type: 'rasi', item, _idx: i }));
    }

    // ? NEW: For NRI tabs, group tabNews by date
    const isNriTab = apiEndpoint === '/nrimain' || apiEndpoint.includes('/nri');
    if (isNriTab && tabNews.length > 0) {
      return groupNewsByDate(tabNews);
    }

    // ? NEW: For varavaram and varamalar tabs, group tabNews by date
    const isVaravaramOrVaramalar = apiEndpoint?.includes('varavaram') || apiEndpoint?.includes('varamalar');
    if (isVaravaramOrVaramalar && tabNews.length > 0) {
      return groupNewsByDate(tabNews);
    }

    // ? NEW: For malargal tabs, group tabNews by date
    const isMalargal = apiEndpoint?.includes('malargal') || apiEndpoint?.includes('malarkal');
    if (isMalargal && tabNews.length > 0) {
      return groupNewsByDate(tabNews);
    }

    // ? NEW: For weekly subtabs, group tabNews by date
    const isWeeklySubTab = activeTab?._isWeeklySubTab;
    if (isWeeklySubTab && tabNews.length > 0) {
      return groupNewsByDate(tabNews);
    }

    console.log('[DEBUG buildFlatData] Using tabNews as fallback:', tabNews.length);
    return tabNews.map((item, i) => ({ type: 'news', item, sectionTitle: activeTab?.title || '', _idx: i }));
  };

  const isLoading = initLoading || tabLoading;
  const isAllTab = tabIsAll(activeTab);
  const flatData = buildFlatData();
  const isRasiTab = !isAllTab && RASI_TAB_IDS.includes(String(activeTab?.id));

  const isTabActive = (tab) => {
    console.log('?? isTabActive Debug - Tab:', tab);
    console.log('?? isTabActive Debug - ActiveTab:', activeTab);
    console.log('?? isTabActive Debug - API endpoint:', apiEndpoint);

    if (!activeTab) return false;

     if (apiEndpoint === '/joshiyam') {
    if (tab._isAllTab || tab.link === allTabLink) return false;
    return String(activeTab.id) === String(tab.id);
  }

    // -- Webstories --------------------------------------------------------
    if (apiEndpoint.includes('webstoriesupdate')) {
      const tabIsWebAll = tab.id === 'webstories' || tab.link === '/webstoriesupdate';
      const activeIsAll = tabIsAll(activeTab) || activeTab?.id === 'webstories';
      if (tabIsWebAll) return activeIsAll;
      return !activeIsAll && String(activeTab.id) === String(tab.id);
    }

    // ? NRI screen
    if (apiEndpoint === '/nrimain') {
      console.log('?? NRI isTabActive - Checking NRI logic');
      console.log('?? NRI isTabActive - activeTab._isNriRegionTab:', activeTab._isNriRegionTab);
      console.log('?? NRI isTabActive - activeTab._activeSubCat:', activeTab._activeSubCat);
      console.log('?? NRI isTabActive - tab._isNriSubCatTab:', tab._isNriSubCatTab);
      console.log('?? NRI isTabActive - tab.id:', tab.id);

      // ? Handle NRI subcategory tabs (செய்திகள், கோயில்கள், etc.)
      if ((activeTab._isNriRegionTab || activeTab._nriCountryTab) && activeTab._activeSubCat) {
        console.log('?? NRI isTabActive - In region/country view with active subcategory');
        console.log('?? NRI isTabActive - Checking tab:', tab.id, tab.title, 'isSubCatTab:', tab._isNriSubCatTab);
        console.log('?? NRI isTabActive - Active subCat:', activeTab._activeSubCat, 'Type:', typeof activeTab._activeSubCat);
        console.log('?? NRI isTabActive - Tab ID:', tab.id, 'Type:', typeof tab.id);
        console.log('?? NRI isTabActive - Comparing:', String(tab.id), '===', String(activeTab._activeSubCat), '?');

        // We're in a region/country view with an active subcategory
        if (tab._isNriSubCatTab && String(tab.id) === String(activeTab._activeSubCat)) {
          console.log('?? NRI isTabActive - MATCH: Subcategory tab should be active');
          return true; // Highlight the active subcategory tab
        }
        if (tab._isNriRegionAllTab) {
          console.log('?? NRI isTabActive - NO MATCH: All tab should not be active');
          return false; // Don't highlight "All" when a subcategory is active
        }
        console.log('?? NRI isTabActive - NO MATCH: Other subcategory tab');
        return false;
      }

      // ? Handle NRI region "All" tab and subcategory tabs
      if ((activeTab._isNriRegionTab || activeTab._nriCountryTab) && !activeTab._activeSubCat) {
        console.log('?? NRI isTabActive - In region/country view, no active subcategory');

        // Check if we're in a subcategory (identified by _nriTabId)
        if (activeTab._nriTabId) {
          console.log('?? NRI isTabActive - Checking subcategory tab:', activeTab._nriTabId);
          // Highlight the matching subcategory tab
          if (tab._isNriSubCatTab && String(tab.id) === String(activeTab._nriTabId)) {
            console.log('?? NRI isTabActive - MATCH: Subcategory tab should be active');
            return true;
          }
          // Don't highlight "All" tab when a subcategory is active
          if (tab._isNriRegionAllTab) {
            console.log('?? NRI isTabActive - NO MATCH: All tab should not be active');
            return false;
          }
          console.log('?? NRI isTabActive - NO MATCH: Other subcategory tab');
          return false;
        }

        // If no subcategory is selected, highlight the "All" tab
        return tab._isNriRegionAllTab; // Highlight "All" tab when no subcategory is active
      }

      if (activeTab._isNriSubTab) {
        console.log('?? NRI isTabActive - In NRI subTab view');
        // ? Country sub-tabs showing   highlight the original parent tab (not All)
        if (activeTab._nriCountryTab) {
          // A specific country is selected   highlight the original NRI sub-tab
          // e.g. if we're in otherstatenews > செய்திகள், highlight otherstatenews tab
          if (tab._isAllTab || tab.link === '/nrimain') return false; // ? All tab NOT active
          return String(tab.id) === String(activeTab._nriTabId); // ? highlight the correct sub-tab
        }
        // Just entered sub-tab view (no country selected yet) ? highlight All
        if (tab._isAllTab || tab.link === '/nrimain') return true;
        return false;
      }
      // Main All tab active   match by link
      console.log('?? NRI isTabActive - Main All tab check');
      return tab.link === '/nrimain' || tab.link === allTabLink;
    }

    if (apiEndpoint.includes('anmegammainlist')) {
      if (tab.link === allTabLink || (tab.link?.includes('anmegammain') && !tab.link?.includes('anmegammainlist'))) {
        return false;
      }
      return tab.link === apiEndpoint;
    }

    if (tabIsAll(tab) || tab.link === allTabLink) return tabIsAll(activeTab);
    return String(activeTab.id) === String(tab.id);
  };

  // --- Anmegam News Card --------------------------------------------------------
  function AnmegamNewsCard({ item, onPress }) {
    const { sf } = useFontSize();
    const imageUri =
      item.largeimages || item.images || item.image ||
      'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';
    const title = item.newstitle || item.title || '';
    const date = item.date || item.time_date || item.standarddate || '';

    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={anc.wrap}>
        <ImageWithFallback
          source={{ uri: imageUri }}
          style={anc.image}
          resizeMode="cover"
          iconSize={40}
        />
        <View style={NewsCardStyles.contentContainer}>

          {!!title && (
            <Text style={[NewsCardStyles.title, { fontSize: sf(13), lineHeight: sf(22) }]} numberOfLines={3}>{title}</Text>
          )}
          {!!date && (
            <Text style={[NewsCardStyles.timeText, { fontSize: sf(14) }]}>{date}</Text>
          )}
          <View style={anc.divider} />
        </View>
      </TouchableOpacity>
    );
  }

  const anc = StyleSheet.create({
    wrap: { backgroundColor: '#fff', paddingHorizontal: s(12), paddingTop: vs(10) },
    image: { width: '100%', height: vs(190), borderRadius: s(4) },
    title: {
      fontSize: ms(15),
      fontFamily: FONTS.muktaMalar.bold,
      color: '#111',
      fontWeight: '700',
      marginTop: vs(8),
    },
    date: {
      fontSize: ms(12),
      fontFamily: FONTS.muktaMalar.regular,
      color: '#888',
      marginTop: vs(4),
      // marginBottom: vs(10),
    },
    divider: { height: 1, backgroundColor: '#f0f0f0', },
  });

  // --- Anmigam Category Card (All tab) -----------------------------------------
  function AnmigamCategoryCard({ item, onPress }) {
    const imageUri = item.images || item.largeimages ||
      'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';

    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={acc.wrap}>
        <ImageWithFallback
          source={{ uri: imageUri }}
          style={acc.image}
          resizeMode="cover"
          iconSize={40}
        />
      </TouchableOpacity>
    );
  }

  const acc = StyleSheet.create({
    wrap: { backgroundColor: '#fff', marginBottom: vs(4), paddingHorizontal: ms(12) },
    image: { width: '100%', height: vs(200) },
    moreRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
      paddingHorizontal: s(12), paddingVertical: vs(10),
      borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
    },
    moreText: { fontSize: ms(14), fontFamily: FONTS.muktaMalar.medium, color: COLORS.primary, marginRight: s(2) },
  });

  const renderItem = ({ item: row }) => {
    // ? ADD: Render sticky date header
    if (row.type === 'dateHeader') {
      return <DateHeader date={row.date} />;
    }

    if (row.type === 'section') {
      const isPugar = row.title === 'புகார் பெட்டி';
      return (
        <TouchableOpacity
          style={styles.sectionWrap}
          activeOpacity={isPugar ? 0.7 : 1}
          onPress={() => {
            if (isPugar) {
              navigation.navigate('PugarPettiScreen', {
                screenTitle: 'புகார் பெட்டி',
                initialDistrictId: null,
              });
            }
          }}
        >
          <SectionTitle title={row.title} showArrow={isPugar} />
        </TouchableOpacity>
      );
    }

    if (row.type === 'news' && row.item?._isCategoryCard)
      return (
        <AnmigamCategoryCard
          item={row.item}
          onPress={() => goToArticle(row.item)}
        />
      );

    if (row.type === 'news' && row._isAnmegamSection)
      return (
        <AnmegamNewsCard
          item={row.item}
          onPress={() => goToArticle(row.item)}
        />
      );
if (row.type === 'rasi' || row.type === 'individualRasi')
  return (
    <RasiCard item={row.item} onPress={() => goToRasiDetails(row.item)} />
  );

    // Compute isPhoto locally inside renderItem   has full access to state
    const isPhoto =
      isPhotoScreen(apiEndpoint) ||
      isPhotoScreen(activeTab?.link) ||
      allSections.some(s => PHOTO_SECTION_IDS.includes(String(s.id)));

    // Check if this is webstories
    const isWebstories = apiEndpoint?.includes('webstories') ||
      activeTab?.link?.includes('webstories') ||
      row.item?.category === 'webstories' ||
      row.item?.category === 'webstory';

    if (row.type === 'news' && isWebstories) {
      const imageUri = row.item.images || row.item.largeimages || row.item.image || row.item.thumbnail || row.item.thumb || 'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';
      const title = row.item.newstitle || row.item.title || '';
      const category = row.item.categrorytitle || '';

      return (
        <TouchableOpacity
          key={`webstory-${row.item?.newsid || row.item?.id || row._idx}`}
          style={{
            width: '48%',
            marginHorizontal: '1%',
            marginBottom: s(8),
            backgroundColor: PALETTE.white,
            borderRadius: s(20),
            overflow: 'hidden'
          }}
          onPress={() => {
            // For webstories, use Linkedurl field to open in browser
            const linkedUrl = row.item.Linkedurl || row.item.link || row.item.slug || '';
            if (linkedUrl && (linkedUrl.startsWith('http://') || linkedUrl.startsWith('https://'))) {
              Linking.openURL(linkedUrl).catch(() => console.log('Failed to open Linkedurl'));
            } else if (row.item.reacturl) {
              // Fallback to reacturl if Linkedurl not available
              const fullUrl = row.item.reacturl.startsWith('http')
                ? row.item.reacturl
                : `https://www.dinamalar.com${row.item.reacturl}`;
              Linking.openURL(fullUrl).catch(() => console.log('Failed to open webstory URL'));
            } else {
              goToArticle(row.item);
            }
          }}
          activeOpacity={0.85}
        >
          <View style={{ position: 'relative' }}>
            <Image
              source={{ uri: imageUri }}
              style={{
                width: '100%',
                height: vs(250),
                resizeMode: 'cover',
              }}
            />
            {/* Category tag */}
            {/* {category && (
              <View style={{
                position: 'absolute',
                top: s(0),
                left: s(0),
                backgroundColor: PALETTE.primary,
                paddingHorizontal: s(8),
                paddingVertical: s(8),
              }}>
                <Text style={{
                  fontFamily: FONTS.muktaMalar.semibold,
                  fontSize: ms(12),
                  color: '#FFFFFF',
                  lineHeight: ms(16),
                }}>
                  {category}
                </Text>
              </View>
            )} */}
            {/* Gallery icon */}
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: s(8),
                right: s(8),
                backgroundColor: 'rgba(0,0,0,0.5)',
                padding: s(6),
                borderRadius: s(20),
              }}
              onPress={() => {
                const link = row.item.link || row.item.slug || '';
                if (link && (link.startsWith('http://') || link.startsWith('https://'))) {
                  Linking.openURL(link).catch(() => console.log('Failed to open link'));
                } else if (row.item.reacturl) {
                  // Open webstory detail URL in browser
                  const fullUrl = row.item.reacturl.startsWith('http')
                    ? row.item.reacturl
                    : `https://www.dinamalar.com${row.item.reacturl}`;
                  Linking.openURL(fullUrl).catch(() => console.log('Failed to open webstory URL'));
                } else {
                  goToArticle(row.item);
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="images-outline" size={s(14)} color="#fff" />
            </TouchableOpacity>
            {/* Carousel indicators */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingVertical: vs(10), paddingHorizontal: s(8), backgroundColor: 'rgba(0,0,0,0.4)' }}>
              {/* Carousel dots   rendered first so they appear above the bg but below no other element */}

              <Text style={{ fontFamily: FONTS.muktaMalar.semibold, fontSize: ms(14), color: '#FFFFFF', lineHeight: ms(22) }}>
                {title}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: s(6), paddingTop: ms(8) }}>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                  <View
                    key={`dot-${index}`}
                    style={{
                      width: s(13), height: s(2), borderRadius: (0.5),
                      backgroundColor: 'rgba(255,255,255,0.5)',
                    }}
                  />
                ))}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

  if (row.type === 'news' && isPhoto) {
    const isHighlighted = selectedNewsId &&
      String(row.item?.newsid || row.item?.id || row.item?.eventid) === String(selectedNewsId);

    return (
      <View style={isHighlighted ? styles.highlightedCard : null}>
        <PhotoCard
          item={row.item}
          onPress={() => goToArticle(row.item)}
          sf={sf}
          isAllTab={isAllTab}
          isSocialCard={activeTab?.link?.includes('getsocialmedia') || apiEndpoint?.includes('getsocialmedia')}
        />
      </View>
    );
  }

  const isHighlighted = selectedNewsId && String(row.item?.newsid || row.item?.id) === String(selectedNewsId);

  return (
    <NewsCard
      item={row.item}
      onPress={() => goToArticle(row.item)}
      sectionTitle={row.sectionTitle || ''}
      isHighlighted={isHighlighted}
    />
  );
};

  // Helper function to convert Tamil subcategory IDs to English titles
  const getEnglishSubCatTitle = (subCatId) => {
    const englishTitles = {
      'new': 'News',
      'koi': 'Temple',
      'san': 'Tamil Association',
      'rdo': 'Tamil Radio',
      'iho': 'Indian Restaurants',
      'eve': 'Events',
      'uni': 'University',
      'tsi': 'Tamil news websites',
      'job': 'Jobs'
    };
    return englishTitles[subCatId] || subCatId;
  };

  const scrollToTop = useCallback(() => {
    rasiScrollViewRef.current?.scrollTo({ y: 0, animated: true });
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  // -- Render -----------------------------------------------------------------
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
        onSelectDistrict={handleSelectDistrict}      >
        <AppHeaderComponent
          onSearch={goToSearch}
          onMenu={() => setIsDrawerVisible(true)}
          onLocation={() => setIsLocationDrawerVisible(true)}
          selectedDistrict={selectedDistrict}
        />
      </UniversalHeaderComponent>

      {/* -- Page Title -- */}
      {/* -- Page Title -- */}
      <View style={styles.pageTitleWrap}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: s(12),
          marginBottom: vs(4)
        }}>
          <Text style={[styles.pageTitle, {
            fontSize: sf(16),
            fontFamily: FONTS.anek.bold,
            paddingHorizontal: 0,
            marginBottom: 0
          }]}>
            {(apiEndpoint === '/nrimain' || apiEndpoint === '/nri')
              ? (() => {
                // If in English mode, show English titles
                if (activeTab?._isEnglishVersion) {
                  // For English regions
                  if (activeTab?._nriRegionId) {
                    const englishTitles = {
                      'america': 'America',
                      'gulf': 'Gulf',
                      'europe': 'Europe',
                      'africa': 'Africa',
                      'asia': 'Asia',
                      'australia': 'Australia',
                      'singapore': 'Singapore'
                    };
                    return englishTitles[activeTab._nriRegionId] || activeTab._nriRegionTitle || activeTab.title || screenTitle;
                  }
                  // For English subcategories, use the tab title directly (already in English)
                  return activeTab?.title || activeTab?._nriTabTitle || screenTitle;
                }
                // For Tamil mode, use existing logic
                return activeTab?._nriRegionTitle || activeTab?._nriTabTitle || screenTitle;
              })()
              : (screenTitle === 'வரவரம்' || screenTitle === 'நிஜக்கம்')
                ? (isAllTab ? screenTitle : (activeTab?.title || screenTitle))
                : screenTitle
            }
          </Text>

          {/* -- English Version Button   only for NRI screen -- */}
          {/* English Version button   show on nri tab (Tamil), subcategory tabs, country tabs, and "All" tab in region view */}
          {(() => {
            console.log('?? English Version Debug - apiEndpoint:', apiEndpoint);
            console.log('?? English Version Debug - activeTab:', activeTab);
            console.log('?? English Version Debug - _isNriSubTab:', activeTab?._isNriSubTab);
            console.log('?? English Version Debug - _nriTabId:', activeTab?._nriTabId);
            console.log('?? English Version Debug - _nriCountryTab:', activeTab?._nriCountryTab);
            console.log('?? English Version Debug - _isNriRegionTab:', activeTab?._isNriRegionTab);
            console.log('?? English Version Debug - _isNriRegionAllTab:', activeTab?._isNriRegionAllTab);
            console.log('?? English Version Debug - _activeSubCat:', activeTab?._activeSubCat);

            const shouldShow = apiEndpoint === '/nrimain' && !activeTab?._isEnglishVersion && (
              (activeTab?._isNriSubTab && activeTab?._nriTabId === 'nri') ||
              (activeTab?._isNriRegionTab && !!activeTab?._activeSubCat) || (activeTab?._isNriSubTab && activeTab?._nriCountryTab) ||
              (activeTab?._isNriRegionTab && activeTab?._isNriRegionAllTab) ||
              // ? Show English Version button for Tamil subcategories (செய்திகள், கோயில்கள், ஜோசியம்)
              (activeTab?._isNriRegionTab && !activeTab?._isEnglishVersion && !activeTab?._activeSubCat)
            );

            console.log('?? English Version Debug - shouldShow:', shouldShow);
            if (shouldShow) {
              console.log('?? ENGLISH VERSION CONTAINER IS BEING RENDERED! ??');
              console.log('?? Current tab:', activeTab?.title || 'Unknown');
              console.log('?? Tab flags:', {
                _isNriSubTab: activeTab?._isNriSubTab,
                _nriCountryTab: activeTab?._nriCountryTab,
                _isNriRegionTab: activeTab?._isNriRegionTab,
                _isNriRegionAllTab: activeTab?._isNriRegionAllTab,
                _activeSubCat: activeTab?._activeSubCat
              });
            }
            return shouldShow;
          })() && (
              <>
                {console.log('?? RENDERING English Version Button NOW! ??')}
                <TouchableOpacity
                  style={{
                    borderWidth: 1,
                    borderColor: COLORS.primary,
                    borderRadius: s(4),
                    paddingHorizontal: s(10),
                    paddingVertical: vs(4),
                  }}
                  onPress={() => {
                    console.log('?? English Version Button Clicked - activeTab:', activeTab);

                    // Check if we're in a Tamil subcategory and need to switch to English subcategory
                    if (activeTab?._isNriRegionTab && !activeTab?._isEnglishVersion && !activeTab?._activeSubCat && activeTab?.id) {
                      // We're in a Tamil subcategory (செய்திகள், கோயில்கள், etc.), navigate to English subcategory
                      const subCatId = activeTab.id; // e.g., 'new', 'koi', 'san'
                      const regionId = activeTab._nriRegionId; // e.g., 'america', 'gulf'
                      const englishSubCatLink = `/nricategory?cat=${regionId}&scat=${subCatId}&lang=en`;

                      console.log('?? Navigating to English subcategory:', subCatId, 'in region:', regionId);
                      console.log('?? English subcategory link:', englishSubCatLink);

                      // Find the corresponding English subcategory tab
                      const englishSubCatTab = {
                        ...activeTab,
                        id: subCatId,
                        title: getEnglishSubCatTitle(subCatId), // Convert செய்திகள் → News, கோயில்கள் → Temple
                        link: englishSubCatLink,
                        _isEnglishVersion: true,
                        _isNriRegionTab: true,
                        _nriRegionId: regionId,
                        _nriRegionTitle: activeTab._nriRegionTitle,
                        _originalTab: activeTab, // Keep reference to original Tamil subcategory
                      };

                      // ? IMPORTANT: Set activeTab first, then fetch data to regenerate subtabs
                      setActiveTab(englishSubCatTab);
                      setTabLoading(true);
                      setTabNews([]); setTabPage(1); setTabLastPage(1);

                      // Fetch fresh data for the English subcategory to regenerate subtabs
                      fetchTabNews(englishSubCatTab, 1, false);
                      return;
                    } else if (activeTab?._nriRegionId) {
                      // We're in a specific region tab (Gulf, America, etc.)
                      const regionId = activeTab._nriRegionId;
                      const englishRegionLink = `/nricategory?cat=${regionId}&lang=en`;

                      console.log('?? Navigating to English version of region:', regionId);
                      console.log('?? English region link:', englishRegionLink);

                      // Create a new tab object for the English version of this region
                      const englishRegionTab = {
                        ...activeTab,
                        id: `${regionId}_en`,
                        title: activeTab.title, // ? Remove (English) suffix
                        link: englishRegionLink,
                        _isNriRegionTab: true,
                        _nriRegionId: regionId,
                        _nriRegionTitle: activeTab.title,
                        _isEnglishVersion: true,
                        _originalTab: activeTab, // Keep reference to original Tamil tab
                      };

                      handleTabPress(englishRegionTab);
                    } else if (activeTab?._isNriSubCatTab && activeTab?._nriTabId === 'nri') {
                      // We're in the main NRI Tamil tab, navigate to main NRI English tab
                      const nriNewsTab =
                        originalNriTabs.find(t => t.id === 'nrinews') ||
                        originalNriTabs.find(t => t.title === 'Nri news') ||
                        originalNriTabs.find(t => t.link?.includes('lang=en'));

                      console.log('?? Found NRI News tab:', nriNewsTab);

                      if (nriNewsTab) {
                        console.log('?? Navigating to main NRI English tab');
                        console.log('?? NRI News tab details:', {
                          id: nriNewsTab.id,
                          title: nriNewsTab.title,
                          link: nriNewsTab.link
                        });
                        handleTabPress(nriNewsTab);
                      } else {
                        console.log('?? No NRI News tab found!');
                      }
                    } else {
                      // Fallback: try to find main NRI English tab
                      const nriNewsTab =
                        originalNriTabs.find(t => t.id === 'nrinews') ||
                        originalNriTabs.find(t => t.title === 'Nri news') ||
                        originalNriTabs.find(t => t.link?.includes('lang=en'));

                      if (nriNewsTab) {
                        handleTabPress(nriNewsTab);
                      }
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: ms(13), fontFamily: FONTS.muktaMalar.medium, color: COLORS.primary, fontWeight: '600' }}>
                    English Version
                  </Text>
                </TouchableOpacity>
              </>
            )}

          {/* Tamil Version button   show on nrinews tab (English), English versions of regions, and English subcategory tabs */}
          {apiEndpoint === '/nrimain' && (
            (activeTab?._isNriSubTab && activeTab?._nriTabId === 'nrinews' && !activeTab?._nriCountryTab) ||
            (activeTab?._isEnglishVersion && activeTab?._nriRegionTab) ||
            (activeTab?._isEnglishVersion && activeTab?._activeSubCat && activeTab?._nriRegionTab) ||
            // ? Show Tamil Version button for English subcategories (News, Temple, etc.)
            (activeTab?._isEnglishVersion && activeTab?._isNriRegionTab && !activeTab?._activeSubCat)
          ) && (
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.primary,
                  borderRadius: s(4),
                  paddingHorizontal: s(10),
                  paddingVertical: vs(4),
                }}
                onPress={() => {
                  console.log('?? Tamil Version Button Clicked - activeTab:', activeTab);

                  // Check if we're in an English subcategory and need to switch to Tamil subcategory
                  if (activeTab?._isNriRegionTab && activeTab?._isEnglishVersion && !activeTab?._activeSubCat && activeTab?.id && activeTab?._originalTab) {
                    // We're in an English subcategory (News, Temple, etc.), navigate to Tamil subcategory
                    const subCatId = activeTab.id; // e.g., 'new', 'koi', 'san'
                    const regionId = activeTab._nriRegionId; // e.g., 'america', 'gulf'
                    const tamilSubCatLink = `/nricategory?cat=${regionId}&scat=${subCatId}&lang=ta`;

                    console.log('?? Navigating to Tamil subcategory:', subCatId, 'in region:', regionId);
                    console.log('?? Tamil subcategory link:', tamilSubCatLink);

                    // Use the original Tamil subcategory tab
                    const tamilSubCatTab = activeTab._originalTab;

                    // ? IMPORTANT: Set activeTab first, then fetch data to regenerate subtabs
                    setActiveTab(tamilSubCatTab);
                    setTabLoading(true);
                    setTabNews([]); setTabPage(1); setTabLastPage(1);

                    // Fetch fresh data for the Tamil subcategory to regenerate subtabs
                    fetchTabNews(tamilSubCatTab, 1, false);
                    return;
                  } else if (activeTab?._isEnglishVersion && activeTab?._originalTab) {
                    // We're in English version of a region tab, go back to original Tamil tab
                    console.log('?? Navigating back to Tamil version of region:', activeTab._originalTab.title);
                    handleTabPress(activeTab._originalTab);
                  } else if (activeTab?._nriTabId === 'nrinews') {
                    // We're in main NRI English tab, navigate to main NRI Tamil tab
                    const nriTab =
                      originalNriTabs.find(t => t.id === 'nri') ||
                      originalNriTabs.find(t => t.title === 'என்ஆர்ஐ செய்திகள்') ||
                      originalNriTabs.find(t => t.link?.includes('nri'));
                    if (nriTab) {
                      console.log('?? Navigating to main NRI Tamil tab');
                      handleTabPress(nriTab);
                    }
                  } else {
                    // Fallback: try to find main NRI Tamil tab
                    const nriTab =
                      originalNriTabs.find(t => t.id === 'nri') ||
                      originalNriTabs.find(t => t.title === 'என்ஆர்ஐ செய்திகள்') ||
                      originalNriTabs.find(t => t.link?.includes('nri'));
                    if (nriTab) {
                      handleTabPress(nriTab);
                    }
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: ms(13), fontFamily: FONTS.muktaMalar.medium, color: COLORS.primary, fontWeight: '600' }}>
                  தமிழ் பதிப்பு
                </Text>
              </TouchableOpacity>
            )}
        </View>
      </View>

      {/* -- Tabs -- */}
      {subTabs.length > 0 && (
        (apiEndpoint?.includes('webstoriesupdate') || apiEndpoint?.includes('webstorieslisting')) ? (<WebstoriesDropdown
          subTabs={subTabs}
          activeTab={activeTab}
          isAllTab={isAllTab}
          allTabLink={allTabLink}
          handleTabPress={handleTabPress}
        />
        ) : (
          <View style={styles.tabsWrap}>
            <ScrollView
              ref={tabScrollRef}
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
                    onLayout={(e) => {
                      const tabKey = tab.title === 'All' ? 'All' : String(tab.id);
                      tabLayoutsRef.current[tabKey] = {
                        x: e.nativeEvent.layout.x,
                        width: e.nativeEvent.layout.width,
                      };
                    }}
                  >
                    <Text style={[styles.tabText, active && styles.tabTextActive, { fontSize: ms(16) }]}>
                      {tab.title || ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={styles.tabsBottomLine} />
          </View>
        )
      )}

      {/* -- Content -- */}
      <View style={styles.swipeArea} {...panResponder.panHandlers}>
        {isLoading ? (
          <FlatList
            data={[1, 2, 3, 4]}
            keyExtractor={i => `sk-${i}`}
            renderItem={() => <SkeletonCard />}
            contentContainerStyle={styles.listContent}
            style={styles.list}
          />
        ) : htmlContent ? (
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
            <View style={{ paddingHorizontal: s(12), paddingVertical: vs(10), backgroundColor: '#fff' }}>
              <Text style={{
                fontSize: ms(16),
                fontFamily: FONTS.muktaMalar.bold,
                color: '#111',
                fontWeight: '700'
              }}>
                {`${activeTab?.title || screenTitle} - ( ${new Date().toLocaleDateString('ta-IN', {
                  day: '2-digit', month: 'short', year: 'numeric'
                })} )`}
              </Text>
            </View>
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
            key={isWebstoriesScreen(apiEndpoint) || isWebstoriesScreen(activeTab?.link) ? 'webstories' : 'default'}
            numColumns={isWebstoriesScreen(apiEndpoint) || isWebstoriesScreen(activeTab?.link) ? 2 : 1}
            keyExtractor={(row, i) =>
              row.type === 'dateHeader'
                ? `date-${row.dateKey}-${i}`
                : row.type === 'section'
                  ? `sec-${row.id || i}-${row.title}`
                  : `news-${i}-${row.item?.newsid || row.item?.id || row.item?.eventid || row.item?.rasiid || i}`
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
      </View>

      {/* -- Scroll To Top -- */}
      {showScrollTop && !rasiDetailItem && (
        <TouchableOpacity style={styles.scrollTopBtn} onPress={scrollToTop} activeOpacity={0.8}>
          <Ionicons name="arrow-up" size={s(20)} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2', paddingTop: Platform.OS === 'android' ? vs(0) : 20 },
  pageTitleWrap: { paddingTop: vs(14), paddingBottom: vs(6), backgroundColor: '#fff' },
  pageTitle: { fontSize: 18, fontFamily: FONTS.anek.bold, color: '#111', paddingHorizontal: s(12), marginBottom: vs(4) },

  tabsWrap: { backgroundColor: '#fff', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: vs(1) }, shadowOpacity: 0.08, shadowRadius: s(2) },
  tabsContent: { paddingHorizontal: s(4), alignItems: 'center' },
  tab: { paddingHorizontal: s(12), paddingVertical: vs(12), marginHorizontal: s(2), borderBottomWidth: vs(3), borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: {
    fontSize: ms(16),
    fontFamily: FONTS.muktaMalar.medium,
    color: COLORS.black,
  },
  tabTextActive: {
    fontSize: ms(16),
    fontFamily: FONTS.muktaMalar.medium,
    color: COLORS.black,
  },

  highlightedCard: {
    borderLeftWidth: s(4),
    borderLeftColor: COLORS.primary,
    backgroundColor: '#e8f4fd',
  },

  list: { flex: 1 },
  listContent: { paddingTop: vs(6), paddingBottom: vs(30) },
  rasiGridContent: { flexDirection: 'column', paddingBottom: vs(30) },
  webView: { flex: 1 },
  webViewLoader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },

  // ── Swipe area wraps the entire content below tabs ──
  swipeArea: { flex: 1 },

  sectionWrap: { paddingHorizontal: s(12), paddingTop: vs(16), paddingBottom: vs(4), backgroundColor: '#f2f2f2' },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: vs(80), gap: vs(12) },
  emptyText: { fontSize: ms(15), fontFamily: FONTS.muktaMalar.medium, color: '#aaa' },
  footerLoader: { paddingVertical: vs(20), alignItems: 'center' },

  scrollTopBtn: {
    position: 'absolute', bottom: vs(20), right: s(16),
    backgroundColor: COLORS.primary, padding: s(10), borderRadius: s(30),
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: vs(2) }, shadowOpacity: 0.2, shadowRadius: s(4),
  },

  // Webstories styles
  webstoriesContainer: {
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  webstoryCard: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: s(8),
    backgroundColor: '#FFFFFF',
    borderRadius: s(20),
    overflow: 'hidden',
  },
  webstoryImage: {
    width: '100%',
    height: vs(250),
  },
  webstoryTitleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: vs(8),
    paddingHorizontal: s(6),
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  webstoryTitle: {
    fontFamily: FONTS.muktaMalar.semibold,
    fontSize: ms(12),
    color: '#FFFFFF',
    lineHeight: ms(16),
  },
  webstoryDecorativeLine: {
    position: 'absolute',
    bottom: vs(6),
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});