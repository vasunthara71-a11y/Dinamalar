import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CDNApi } from '../config/api';
import { useFontSize } from '../context/FontSizeContext';
import { ms, s, vs } from '../utils/scaling';
import { FONTS } from '../utils/constants';

// Palette
const PALETTE = {
  primary: '#096dd2',
  grey100: '#F9FAFB',
  grey200: '#F4F6F8',
  grey300: '#DFE3E8',
  grey400: '#C4CDD5',
  grey500: '#919EAB',
  grey600: '#637381',
  grey700: '#4B5563',
  grey800: '#374151',
  white: '#FFFFFF',
};

// ─── Clean HTML → readable lines ─────────────────────────────────────────────
const cleanHtml = (html = '') =>
  html
    .replace(/<br\s*\/?>/gi, '\n')   // <br> / \u003Cbr\u003E → newline FIRST
    .replace(/<[^>]+>/g, '')         // strip remaining tags
    .replace(/\u00a0|&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/ n /g, '\n')           // " n " bullet separator → newline
    .replace(/ n$/gm, '\n')
    .replace(/[ \t]{2,}/g, ' ')      // collapse spaces, NOT newlines
    .replace(/\n{3,}/g, '\n\n')
    .trim();

// ─── Split cleaned text into non-empty lines ──────────────────────────────────
const toLines = (text = '') =>
  text.split('\n').map(l => l.trim()).filter(Boolean);

export default function TodayEventsCard({ section, navigation }) {
  const { sf } = useFontSize();

  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [allLines, setAllLines] = useState([]);
  const [eventTitle, setEventTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [newsId, setNewsId] = useState(null);
  const [newsItem, setNewsItem] = useState(null);

  const item = section.data?.[0];
  const districts = item?.districts || [];

  // ── Initial content from section data ────────────────────────────────────
  useEffect(() => {
    if (!item) return;
    const raw = item.newsdescription || item.description || '';
    console.log('[TodayEvents] Raw content:', raw);
    const cleaned = cleanHtml(raw);
    console.log('[TodayEvents] Cleaned content:', cleaned);
    const lines = toLines(cleaned);
    console.log('[TodayEvents] Split lines:', lines);
    setAllLines(lines);
    setEventTitle(cleanHtml(item.newstitle || '').trim());
    setSlug(item.slug || item.link || '');
    setNewsId(item.newsid || item.id);
    setNewsItem(item);
  }, []);

  // ── Fetch events when district changes ────────────────────────────────────
  const fetchDistrictEvents = async (district) => {
    try {
      const res = await CDNApi.get(`/todayevent?district=${district.id}`);
      const d = res?.data;

      const raw =
        d?.data?.[0]?.newsdescription ||
        d?.newsdescription ||
        d?.data?.[0]?.description ||
        d?.description || '';

      if (raw) {
        setAllLines(toLines(cleanHtml(raw)));
        const title = d?.data?.[0]?.newstitle || d?.newstitle || '';
        if (title) setEventTitle(cleanHtml(title).trim());
        const s2 = d?.data?.[0]?.slug || d?.slug || '';
        if (s2) setSlug(s2);
        const id = d?.data?.[0]?.newsid || d?.newsid || null;
        if (id) setNewsId(id);
        setNewsItem(d?.data?.[0] || null);
      }
    } catch (e) {
      console.error('[TodayEvents] fetch error:', e?.message);
    }
  };

  if (!item) return null;

  const PREVIEW_COUNT = 4;  // ← only change this one number
  const previewLines = allLines.slice(0, PREVIEW_COUNT);
  const hasMore = allLines.length > PREVIEW_COUNT;
  const lastPreview = hasMore
    ? (allLines[PREVIEW_COUNT] || '').substring(0, 28) + ' ...'
    : '';

  const goToDetail = () => {
    navigation?.navigate('NewsDetailsScreen', {
      newsId: newsId,
      newsItem: newsItem || item,
      slug: slug,
    });
  };

  return (
    <View style={st.outerWrap}>

      {/* ── Section Title ── */}
      <Text style={[st.sectionTitle, { fontSize: sf(17) }]}>
        இன்றைய நிகழ்ச்சிகள்
      </Text>

      {/* ── White Card ── */}
      <View style={st.card}>

        {/* ── District Dropdown ── */}
        {districts.length > 0 && (
          <View style={st.dropdownWrap}>
            <TouchableOpacity
              style={st.dropdownBtn}
              onPress={() => setIsDropdownOpen(v => !v)}
              activeOpacity={0.8}
            >
              <Text style={[st.dropdownText, { fontSize: sf(14) }]}>
                {selectedDistrict
                  ? (selectedDistrict.TName || selectedDistrict.title)
                  : (districts[0]?.TName || 'சென்னை')}
              </Text>
              <Ionicons
                name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={s(18)}
                color="#555"
              />
            </TouchableOpacity>

            {isDropdownOpen && (
              <View style={st.dropdownList}>
                <ScrollView
                   nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  {districts.map((d, i) => (
                    <TouchableOpacity
                      key={d.id || i}
                      style={st.dropdownItem}
                      onPress={() => {
                        setSelectedDistrict(d);
                        setIsDropdownOpen(false);
                        fetchDistrictEvents(d);
                      }}
                      activeOpacity={0.75}
                    >
                      <Text style={[st.dropdownItemText, { fontSize: sf(14) }]}>
                        {d.TName || d.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* ── Truncated Content ── */}
        {allLines.length > 0 && (
          <View style={st.contentWrap}>

            {/* Preview lines */}
            {previewLines.map((line, i) => (
              <Text
                key={i}
                style={[st.contentLine, { fontSize: sf(14), lineHeight: sf(24) }]}
              >
                {line}
              </Text>
            ))}

            {/* 4th partial line + blue arrow — exactly like the screenshot */}
            {hasMore && (
              <TouchableOpacity
                style={st.readMoreRow}
                onPress={goToDetail}
                activeOpacity={0.8}
              >
                <Text
                  style={[st.readMoreText, { fontSize: sf(14), lineHeight: sf(24) }]}
                  numberOfLines={1}
                >
                  {lastPreview}
                </Text>
                <Ionicons name="arrow-forward" size={s(18)} color={PALETTE.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Footer ── */}
        <TouchableOpacity
          style={st.footerBtn}
          onPress={() => navigation?.navigate('CommonSectionScreen', {
            screenTitle: 'கோயில்கள்',
            apiEndpoint: '/kovilgal',
            allTabLink: '/kovilgal',
          })}
          activeOpacity={0.8}
        >
          <Text style={[st.footerText, { fontSize: sf(14) }]}>
            மேலும் கோயில்கள் &gt;
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  outerWrap: {
    backgroundColor: PALETTE.white,
    marginBottom: vs(8),
  },

  sectionTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    color: PALETTE.grey800,
    paddingHorizontal: s(12),
    paddingTop: vs(14),
    paddingBottom: vs(4),
    textAlign: 'center',
  },

  titleUnderline: {
    height: vs(3),
    width: s(60),
    backgroundColor: PALETTE.primary,
    alignSelf: 'center',
    marginBottom: vs(8),
  },

  card: {
    marginHorizontal: s(12),
    marginBottom: vs(12),
    borderWidth: 1,
    borderColor: PALETTE.grey300,
    backgroundColor: PALETTE.white,
  },

  // ── Dropdown ──
  dropdownWrap: {
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.grey300,
    position: 'relative',
    zIndex: 10,
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(14),
    paddingVertical: vs(10),
    backgroundColor: PALETTE.white,
  },
  dropdownText: {
    fontFamily: FONTS.muktaMalar.regular,
    color: PALETTE.grey800,
    flex: 1,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: PALETTE.white,
    borderWidth: 1,
    borderColor: PALETTE.grey300,
    borderTopWidth: 0,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 999,
  },
  dropdownItem: {
    paddingHorizontal: s(14),
    paddingVertical: vs(10),
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.grey200,
  },
  dropdownItemText: {
    fontFamily: FONTS.muktaMalar.regular,
    color: PALETTE.grey800,
  },

  // ── Content ──
  contentWrap: {
    paddingHorizontal: s(14),
    paddingTop: vs(12),
    paddingBottom: vs(8),
  },
  contentLine: {
    fontFamily: FONTS.muktaMalar.regular,
    color: PALETTE.grey800,
    marginBottom: vs(2),
  },

  // Partial 4th line + arrow (matches screenshot)
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(2),
    gap: s(4),
  },
  readMoreText: {
    fontFamily: FONTS.muktaMalar.regular,
    color: PALETTE.grey800,
    flex: 1,
  },

  // ── Footer ──
  footerBtn: {
    borderTopWidth: 1,
    borderTopColor: PALETTE.grey200,
    paddingHorizontal: s(14),
    paddingVertical: vs(10),
    alignItems: 'flex-end',
  },
  footerText: {
    fontFamily: FONTS.muktaMalar.bold,
    color: PALETTE.primary,
    textDecorationLine: 'underline',
  },
});