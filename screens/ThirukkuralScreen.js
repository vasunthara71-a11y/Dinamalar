import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Platform,
  Modal,
  Dimensions,
  Pressable,
  TextInput,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RenderHtml from 'react-native-render-html';
import { useNavigation } from '@react-navigation/native';
import { s, vs } from '../utils/scaling';
import { ms } from 'react-native-size-matters';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../utils/constants';

const API_FILTER  = 'https://u38.dinamalar.com/filter';
const API_listing = 'https://u38.dinamalar.com/kurallisting';

const C = {
  bg: '#ffffff',
  headerBox: '#2d3748',
  headerText: '#ffffff',
  dropdown: '#4a5568',
  dropdownText: '#ffffff',
  breadcrumb: '#888888',
  breadcrumbLink: '#1a56db',
  sectionTitle: '#111111',
  underline: '#1a56db',
  rowBg: '#ffffff',
  separator: '#e8e8e8',
  numCircleBg: '#e2e8f0',
  numCircleText: '#555555',
  kuralText: '#111111',
  pagBox: '#2d3748',
  pagNumText: '#ffffff',
  pagActive: '#1a56db',
  pagActiveTxt: '#ffffff',
  pillBg: '#3d4a5c',
  pillText: '#e2e8f0',
};

const contentWidth = Dimensions.get('window').width - s(64);
const detailWidth  = Dimensions.get('window').width - s(32);
const TOTAL_ATHIKARAMS = 133;

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ currentPage, totalPages, onPageChange }) {
  if (!totalPages || totalPages < 1) return null;

  const getPages = () => {
    if (totalPages <= 6) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 5) return [1, 2, 3, 4, 5, '...', totalPages];
    const around = [];
    for (let i = Math.max(1, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      around.push(i);
    }
    const all = [...new Set([1, ...around, totalPages])].sort((a, b) => a - b);
    const result = [];
    for (let i = 0; i < all.length; i++) {
      if (i > 0 && all[i] - all[i - 1] > 1) result.push('...');
      result.push(all[i]);
    }
    return result;
  };

  const pages = getPages();

  return (
    <View style={pg.box}>
      <View style={pg.row}>
        <TouchableOpacity
          onPress={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          activeOpacity={0.6}
          style={pg.arrowBtn}
        >
          <Text style={[pg.arrowTxt, currentPage === 1 && pg.arrowDisabled]}>‹</Text>
        </TouchableOpacity>

        {pages.map((p, i) =>
          p === '...' ? (
            <View key={`d${i}`} style={pg.dotsWrap}>
              <Text style={pg.dotsTxt}>...</Text>
            </View>
          ) : (
            <TouchableOpacity
              key={p}
              style={[pg.numBtn, currentPage === p && pg.numBtnActive]}
              onPress={() => currentPage !== p && onPageChange(p)}
              activeOpacity={0.7}
            >
              <Text style={[pg.numTxt, currentPage === p && pg.numTxtActive]}>{p}</Text>
            </TouchableOpacity>
          )
        )}

        <TouchableOpacity
          onPress={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          activeOpacity={0.6}
          style={pg.arrowBtn}
        >
          <Text style={[pg.arrowTxt, currentPage === totalPages && pg.arrowDisabled]}>›</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Inline Kural Detail (expands below the kural row) ───────────────────────
// Matches screenshot: kural text in blue, குறள் விளக்கம் card,
// முந்தைய ‹ [12] and [14] › அடுத்தது at bottom
function KuralDetail({ item, prevKural, nextKural, onNavigate }) {
  const tamilHtml   = item.kural_vilakkam_muuva || '';
  const englishHtml = item.kural_en_vilakkam || '';

  return (
    <View style={det.root}>
      {/* Kural text in blue */}
      {/* <View style={det.kuralBlock}>
        <RenderHtml
          contentWidth={detailWidth}
          source={{ html: item.kural_txt || '' }}
          baseStyle={det.kuralTxt}
          tagsStyles={{ body: { margin: 0, padding: 0 } }}
        />
      </View> */}

      <View style={det.divider} />

      {/* Tamil explanation card */}
      {!!tamilHtml && (
        <View style={det.card}>
          <Text style={det.cardLabel}>குறள் விளக்கம் :</Text>
          <RenderHtml
            contentWidth={detailWidth - s(28)}
            source={{ html: tamilHtml }}
            baseStyle={det.cardTxt}
            tagsStyles={{ body: { margin: 0, padding: 0 } }}
          />
        </View>
      )}

      {/* English explanation card */}
      {!!englishHtml && (
        <View style={[det.card, { marginTop: vs(8) }]}>
          <Text style={[det.cardLabel, { color: '#2d7a2d' }]}>English :</Text>
          <RenderHtml
            contentWidth={detailWidth - s(28)}
            source={{ html: englishHtml }}
            baseStyle={{ ...det.cardTxt, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}
            tagsStyles={{ body: { margin: 0, padding: 0 } }}
          />
        </View>
      )}

      {/* முந்தைய / அடுத்தது — exactly like screenshot */}
      <View style={det.navRow}>
        {prevKural ? (
          <TouchableOpacity style={det.navLeft} onPress={() => onNavigate(prevKural)} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={s(16)} color={C.breadcrumbLink} />
            <View style={det.navContent}>
              <Text style={det.navLabel}>முந்தைய</Text>
              <View style={det.navCircle}>
                <Text style={det.navNum}>{prevKural.kural_No}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : <View style={{ flex: 1 }} />}

        {nextKural ? (
          <TouchableOpacity style={det.navRight} onPress={() => onNavigate(nextKural)} activeOpacity={0.7}>
            <View style={[det.navContent, { alignItems: 'flex-end' }]}>
              <Text style={det.navLabel}>அடுத்தது</Text>
              <View style={det.navCircle}>
                <Text style={det.navNum}>{nextKural.kural_No}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={s(16)} color={C.breadcrumbLink} />
          </TouchableOpacity>
        ) : <View style={{ flex: 1 }} />}
      </View>
    </View>
  );
}

// ─── Kural Row + inline expandable detail ─────────────────────────────────────
function KuralRow({ item, isExpanded, allKurals, onPress, onNavigate, highlighted }) {
  const idx      = allKurals.findIndex(k => k.kural_id === item.kural_id);
  const prevKural = idx > 0 ? allKurals[idx - 1] : null;
  const nextKural = idx < allKurals.length - 1 ? allKurals[idx + 1] : null;

  // If expanded and we have only one kural (search result), show navigation buttons
  const showNavButtons = isExpanded && allKurals.length === 1;

  return (
    <View>
      <TouchableOpacity
        style={[styles.kuralRow, isExpanded && styles.kuralRowActive]}
        onPress={() => onPress(item)}
        activeOpacity={0.75}
      >
        <View style={[styles.numCircle, isExpanded && styles.numCircleActive]}>
          <Text style={[styles.numCircleText, isExpanded && styles.numCircleTextActive]}>
            {item.kural_No}
          </Text>
        </View>
        <View style={styles.kuralTextWrap}>
          <RenderHtml
            contentWidth={contentWidth}
            source={{ html: item.kural_txt || '' }}
            baseStyle={
              highlighted
                ? { ...styles.kuralLine, ...styles.kuralLineHighlighted }
                : styles.kuralLine
            }
            tagsStyles={{ body: { margin: 0, padding: 0 } }}
          />
        </View>
      </TouchableOpacity>

      {/* Inline detail expands below the row */}
      {isExpanded && (
        <KuralDetail
          item={item}
          prevKural={prevKural}
          nextKural={nextKural}
          onNavigate={onNavigate}
        />
      )}

      {/* Show navigation buttons for single kural search results */}
      {showNavButtons && (
        <View style={det.navRow}>
          <TouchableOpacity 
            style={det.navLeft} 
            onPress={() => Number(item.kural_No) > 1 && onNavigate({...item, kural_No: String(Number(item.kural_No) - 1)})} 
            activeOpacity={0.7}
            disabled={Number(item.kural_No) <= 1}
          >
            <Ionicons name="chevron-back" size={s(16)} color={Number(item.kural_No) <= 1 ? '#ccc' : C.breadcrumbLink} />
            <View style={det.navContent}>
              <Text style={[det.navLabel, { color: Number(item.kural_No) <= 1 ? '#ccc' : C.breadcrumbLink }]}>முந்தைய</Text>
              <View style={[det.navCircle, { backgroundColor: Number(item.kural_No) <= 1 ? '#f0f0f0' : C.numCircleBg }]}>
                <Text style={[det.navNum, { color: Number(item.kural_No) <= 1 ? '#999' : '#444' }]}>{Number(item.kural_No) - 1}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={det.navRight} 
            onPress={() => Number(item.kural_No) < 1330 && onNavigate({...item, kural_No: String(Number(item.kural_No) + 1)})} 
            activeOpacity={0.7}
            disabled={Number(item.kural_No) >= 1330}
          >
            <View style={[det.navContent, { alignItems: 'flex-end' }]}>
              <Text style={[det.navLabel, { color: Number(item.kural_No) >= 1330 ? '#ccc' : C.breadcrumbLink }]}>அடுத்தது</Text>
              <View style={[det.navCircle, { backgroundColor: Number(item.kural_No) >= 1330 ? '#f0f0f0' : C.numCircleBg }]}>
                <Text style={[det.navNum, { color: Number(item.kural_No) >= 1330 ? '#999' : '#444' }]}>{Number(item.kural_No) + 1}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={s(16)} color={Number(item.kural_No) >= 1330 ? '#ccc' : C.breadcrumbLink} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Athikaram Dropdown ───────────────────────────────────────────────────────
function AthikaramDropdown({ filterData, selectedAthikaram, onSelect }) {
  const [open, setOpen] = useState(false);
  const allAthikarams = filterData?.kuralathigaram || [];
  const selected = allAthikarams.find(a => a.id === selectedAthikaram);

  return (
    <>
      <TouchableOpacity style={styles.dropdownBtn} onPress={() => setOpen(true)} activeOpacity={0.85}>
        <Text style={styles.dropdownBtnText} numberOfLines={1}>
          {selected?.kural_adi_ta || ''}
        </Text>
        <Ionicons name="chevron-down" size={s(18)} color="#fff" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={ddm.overlay} onPress={() => setOpen(false)} activeOpacity={1}>
          <View style={ddm.dropdownContainer}>
            <View style={ddm.dropdownHeader}>
              <Text style={ddm.dropdownTitle}>அதிகாரம் தேர்ந்தெடுக்கவும்</Text>
              <TouchableOpacity onPress={() => setOpen(false)} style={ddm.closeBtn}>
                <Ionicons name="close" size={s(18)} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={ddm.dropdownScroll} showsVerticalScrollIndicator={false}>
              {(filterData?.kural?.data || []).map(paal => {
                const iyals = (filterData?.kuraliyal || []).filter(i => String(i.kural_pal) === String(paal.id));
                return (
                  <View key={paal.id}>
                    {iyals.map(iyal => {
                      const athikarams = allAthikarams.filter(a => a.kural_iyal === iyal.id);
                      return (
                        <View key={iyal.id}>
                          {athikarams.map(athi => (
                            <TouchableOpacity
                              key={athi.id}
                              style={[ddm.option, selectedAthikaram === athi.id && ddm.optionActive]}
                              onPress={() => { onSelect(athi); setOpen(false); }}
                              activeOpacity={0.7}
                            >
                              <Text style={[ddm.optionText, selectedAthikaram === athi.id && ddm.optionTextActive]}>
                                {athi.kural_adi_ta}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      );
                    })}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ─── Number Search Modal ──────────────────────────────────────────────────────
function NumSearchModal({ visible, onClose, onSearch }) {
  const [val, setVal] = useState('');
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={nsm.overlay} onPress={onClose} activeOpacity={1}>
        <View style={nsm.box}>
          <Text style={nsm.title}>திருக்குறள்</Text>
          <Text style={nsm.subtitle}>குறள் எண்ணை டைப் செய்யுங்கள்</Text>
          <TextInput
            style={nsm.input}
            value={val}
            onChangeText={setVal}
            placeholder=" "
            placeholderTextColor="#ccc"
            keyboardType="number-pad"
            returnKeyType="search"
            onSubmitEditing={() => { onSearch(val); setVal(''); }}
            autoFocus
          />
          <View style={nsm.buttonRow}>
            <Pressable style={({ pressed }) => [nsm.textBtn, pressed && nsm.cancelBtn]} onPress={onClose}>
              <Text style={nsm.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [nsm.searchTextBtn, pressed && nsm.searchTextBtnPressed]}
              onPress={() => { onSearch(val); setVal(''); }}
            >
              <Text style={nsm.searchTextBtnText}>Search</Text>
            </Pressable>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ThirukkuralScreen() {
  const navigation = useNavigation();

  const [filterData,        setFilterData]       = useState(null);
  const [loadingFilter,     setLoadingFilter]    = useState(true);
  const [selectedAthikaram, setSelectedAthikaram] = useState(null);
  const [athikaramName,     setAthikaramName]    = useState('கடவுள் வாழ்த்து');
  const [paalName,          setPaalName]         = useState('');

  const [kurals,        setKurals]       = useState([]);
  const [loadingKurals, setLoadingKurals] = useState(false);
  const [currentPage,   setCurrentPage]  = useState(1);
  const [highlightedNum, setHighlightedNum] = useState(null);

  // which kural_id is currently expanded inline
  const [expandedId, setExpandedId] = useState(null);

  const [numSearchVisible, setNumSearchVisible] = useState(false);

  const flatRef = useRef(null);

  // ── Fetch filter ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(API_FILTER)
      .then(r => r.json())
      .then(d => {
        setFilterData(d);
        const firstPaal = d.kural?.data?.[0];
        const firstIyal = d.kuraliyal?.find(i => String(i.kural_pal) === String(firstPaal?.id));
        const firstAthi = d.kuralathigaram?.find(a => a.kural_iyal === firstIyal?.id);
        if (firstAthi) {
          setSelectedAthikaram(firstAthi.id);
          setAthikaramName(firstAthi.kural_adi_ta || '');
          setPaalName(firstPaal?.title || '');
          setCurrentPage(firstAthi.id);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingFilter(false));
  }, []);

  // ── Fetch kurals ──────────────────────────────────────────────────────────────
  const fetchKurals = useCallback(async (athiId) => {
    if (!athiId) return;
    setLoadingKurals(true);
    setHighlightedNum(null);
    setExpandedId(null);
    try {
      const res  = await fetch(`${API_listing}?id=${athiId}&page=1`);
      const data = await res.json();
      setKurals(data.kurallist?.data || []);
    } catch (e) {
      setKurals([]);
    } finally {
      setLoadingKurals(false);
    }
  }, []);

  useEffect(() => {
    if (selectedAthikaram && !highlightedNum) fetchKurals(selectedAthikaram);
  }, [selectedAthikaram, highlightedNum]);

  // ── Athikaram select ──────────────────────────────────────────────────────────
  const handleAthikaramSelect = (athi) => {
    setSelectedAthikaram(athi.id);
    setAthikaramName(athi.kural_adi_ta || '');
    setCurrentPage(athi.id);
    const iyal = filterData?.kuraliyal?.find(i => i.id === athi.kural_iyal);
    const paal = filterData?.kural?.data?.find(p => String(p.id) === String(iyal?.kural_pal));
    setPaalName(paal?.title || '');
  };

  // ── Pagination ────────────────────────────────────────────────────────────────
  const handlePageChange = (page) => {
    const athi = filterData?.kuralathigaram?.find(a => a.id === page);
    if (athi) {
      setSelectedAthikaram(athi.id);
      setAthikaramName(athi.kural_adi_ta || '');
      setCurrentPage(athi.id);
      const iyal = filterData?.kuraliyal?.find(i => i.id === athi.kural_iyal);
      const paal = filterData?.kural?.data?.find(p => String(p.id) === String(iyal?.kural_pal));
      setPaalName(paal?.title || '');
    }
    flatRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  // ── Tap kural row — toggle inline detail ─────────────────────────────────────
  const handleKuralPress = (item) => {
    setExpandedId(prev => prev === item.kural_id ? null : item.kural_id);
  };

  // ── Prev/Next inside detail ───────────────────────────────────────────────────
  const handleNavigate = async (item) => {
    const targetNum = Number(item.kural_No);
    setHighlightedNum(targetNum);
    setExpandedId(item.kural_id);
    
    // Fetch the full athikaram to enable proper navigation
    const athiId = Math.ceil(targetNum / 10);
    try {
      const res = await fetch(`${API_listing}?id=${athiId}&page=1`);
      const data = await res.json();
      setKurals(data.kurallist?.data || []);
      
      const athi = filterData?.kuralathigaram?.find(a => a.id === athiId);
      if (athi) {
        setSelectedAthikaram(athi.id);
        setAthikaramName(athi.kural_adi_ta || '');
        setCurrentPage(athi.id);
      }
    } catch (e) {
      console.error('Failed to fetch for navigation:', e);
    }
  };

  // ── Kural number search ───────────────────────────────────────────────────────
  const handleNumSearch = async (input) => {
    const num = parseInt(input, 10);
    if (!num || num < 1 || num > 1330) return;
    setNumSearchVisible(false);
    setLoadingKurals(true);
    setHighlightedNum(num);
    setExpandedId(null);
    try {
      const athiId = Math.ceil(num / 10);
      const res    = await fetch(`${API_listing}?id=${athiId}&page=1`);
      const data   = await res.json();
      const exact  = (data.kurallist?.data || []).find(k => Number(k.kural_No) === num);
      setKurals(exact ? [exact] : []);
      
      // Auto-expand the searched kural
      if (exact) {
        setExpandedId(exact.kural_id);
      }
      
      const athi = filterData?.kuralathigaram?.find(a => a.id === athiId);
      if (athi) {
        setSelectedAthikaram(athi.id);
        setAthikaramName(athi.kural_adi_ta || '');
        setCurrentPage(athi.id);
      }
      flatRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (e) {
      setKurals([]);
    } finally {
      setLoadingKurals(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={s(22)} color="#222" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatRef}
        data={kurals}
        keyExtractor={item => String(item.kural_id)}
        renderItem={({ item }) => (
          <KuralRow
            item={item}
            isExpanded={expandedId === item.kural_id}
            allKurals={kurals}
            onPress={handleKuralPress}
            onNavigate={handleNavigate}
            highlighted={highlightedNum === item.kural_No}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: vs(40) }}

        ListHeaderComponent={
          <View>
            <View style={styles.headerBox}>
              <Text style={styles.headerBoxTitle}>திருக்குறள்</Text>
              <TouchableOpacity
                style={styles.numPill}
                onPress={() => setNumSearchVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.numPillText}>குறள் எண்  </Text>
                <Ionicons name="search" size={s(13)} color={C.pillText} />
              </TouchableOpacity>
            </View>

            {loadingFilter ? (
              <View style={styles.filterLoader}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : (
              <AthikaramDropdown
                filterData={filterData}
                selectedAthikaram={selectedAthikaram}
                onSelect={handleAthikaramSelect}
              />
            )}

            <View style={styles.sectionTitleWrap}>
              <View>
                <Text style={styles.sectionTitle}>{athikaramName} அதிகாரம்</Text>
                <View style={styles.sectionUnderline} />
              </View>
            </View>

            {loadingKurals && (
              <View style={styles.loaderWrap}>
                <ActivityIndicator size="large" color="#1a56db" />
              </View>
            )}
          </View>
        }

        ListEmptyComponent={
          !loadingKurals ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>குறள்கள் கிடைக்கவில்லை</Text>
            </View>
          ) : null
        }

        ListFooterComponent={
          !loadingKurals && kurals.length > 0 && !highlightedNum ? (
            <Pagination
              currentPage={currentPage}
              totalPages={TOTAL_ATHIKARAMS}
              onPageChange={handlePageChange}
            />
          ) : null
        }
      />

      <NumSearchModal
        visible={numSearchVisible}
        onClose={() => setNumSearchVisible(false)}
        onSearch={handleNumSearch}
      />
    </View>
  );
}

// ─── Inline Detail Styles ─────────────────────────────────────────────────────
const det = StyleSheet.create({
  root: {
    backgroundColor: '#fff',
    paddingHorizontal: s(16),
    paddingBottom: vs(16),
    borderBottomWidth: 1,
    borderBottomColor: C.separator,
  },
  kuralBlock: {
    alignItems: 'center',
    paddingVertical: vs(12),
    paddingHorizontal: s(8),
  },
  // Kural text in blue — matches screenshot
  kuralTxt: {
    fontSize: s(14),
    fontWeight: '700',
    color: C.breadcrumbLink,
    textAlign: 'center',
    lineHeight: vs(24),
    fontFamily: Platform.OS === 'ios' ? 'Tamil Sangam MN' : 'sans-serif-medium',
  },
  divider: {
    height: 1,
    backgroundColor: C.separator,
    marginBottom: vs(10),
  },
  // Grey card — matches screenshot
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: s(6),
    padding: s(14),
    marginBottom: vs(4),
  },
  cardLabel: {
    fontSize: s(13),
    fontWeight: '800',
    color: '#111',
    marginBottom: vs(8),
  },
  cardTxt: {
    fontSize: s(13),
    color: '#333',
    lineHeight: vs(22),
  },
  // முந்தைய / அடுத்தது row — matches screenshot exactly
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: vs(16),
    paddingTop: vs(12),
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: s(4),
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    gap: s(4),
  },
  navContent: {
    alignItems: 'flex-start',
  },
  navLabel: {
    fontSize: s(11),
    color: C.breadcrumbLink,
    fontWeight: '600',
    marginBottom: vs(4),
  },
  navCircle: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    backgroundColor: C.numCircleBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navNum: {
    fontSize: s(12),
    fontWeight: '800',
    color: '#444',
  },
  // Swipe navigation styles
  swipeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: vs(16),
    paddingTop: vs(12),
    borderTopWidth: 1,
    borderTopColor: C.separator,
  },
  swipeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    flex: 1,
  },
  swipeText: {
    fontSize: s(11),
    color: C.breadcrumbLink,
    fontWeight: '600',
  },
  swipeHint: {
    fontSize: s(10),
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    flex: 1,
  },
});

// ─── Pagination Styles ────────────────────────────────────────────────────────
const pg = StyleSheet.create({
  box: {
    marginHorizontal: s(12),
    marginBottom: vs(8),
    borderRadius: s(6),
    paddingVertical: vs(12),
    // paddingHorizontal: s(12),
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    rowGap: vs(4),
    columnGap: s(2),
  },
  arrowBtn: {
    width: s(36), height: s(36),
    alignItems: 'center', justifyContent: 'center',
  },
  arrowTxt:      { fontSize: s(24), color: COLORS.text, fontWeight: '300', lineHeight: s(28) },
  arrowDisabled: { color: '#cccccc' },
  numBtn: {
    width: s(36), height: s(36),
    borderRadius: s(18),
    alignItems: 'center', justifyContent: 'center',
  },
  numBtnActive:  { backgroundColor: '#1a56db' },
  numTxt:        { fontSize: s(13), color: COLORS.text },
  numTxtActive:  { fontWeight: '800', color: '#ffffff' },
  dotsWrap:      { width: s(20), height: s(36), alignItems: 'center', justifyContent: 'center' },
  dotsTxt:       { fontSize: s(14), color: '#aaaaaa' },
});

// ─── Dropdown Modal Styles ────────────────────────────────────────────────────
const ddm = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start', paddingTop: vs(200),
  },
  dropdownContainer: {
    backgroundColor: '#fff', marginHorizontal: s(12),
    borderRadius: s(8), maxHeight: vs(400),
    shadowColor: '#000', shadowOffset: { width: 0, height: vs(4) },
    shadowOpacity: 0.15, shadowRadius: s(8), elevation: 8,
  },
  dropdownHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: s(16), paddingVertical: vs(12),
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  dropdownTitle:    { fontSize: s(14), fontWeight: '700', color: '#111' },
  closeBtn:         { padding: s(4) },
  dropdownScroll:   { maxHeight: vs(350) },
  option: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: s(16), paddingVertical: vs(10),
  },
  optionActive:     { backgroundColor: COLORS.primary },
  optionText:       { flex: 1, fontSize: s(12), color: '#222' },
  optionTextActive: { color: '#ffffff', fontWeight: '700' },
});

// ─── Number Search Modal Styles ───────────────────────────────────────────────
const nsm = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: s(24),
  },
  box: {
    backgroundColor: C.headerBox, borderRadius: s(12),
    padding: s(20), width: '100%', alignItems: 'center',
  },
  title:    { fontSize: s(16), fontWeight: '700', color: '#fff', marginBottom: vs(16), textAlign: 'center' },
  subtitle: { fontSize: s(14), color: '#fff', marginTop: vs(8), marginBottom: vs(12), textAlign: 'center' },
  input: {
    width: '100%', borderBottomWidth: 1, borderBottomColor: C.pagActive,
    paddingVertical: vs(8), paddingHorizontal: s(12),
    fontSize: s(15), color: '#fff', marginBottom: vs(16),
    fontFamily: Platform.OS === 'ios' ? 'Tamil Sangam MN' : 'sans-serif',
  },
  buttonRow: { flexDirection: 'row', gap: s(12), width: '100%' },
  textBtn:   { flex: 1, alignItems: 'center', paddingVertical: vs(8) },
  cancelBtn: {
    flex: 1, marginRight: s(8), paddingVertical: vs(8),
    borderRadius: s(6), backgroundColor: C.dropdown, alignItems: 'center',
  },
  cancelBtnText:        { fontSize: s(12), color: '#fff', fontWeight: '600' },
  searchTextBtn: {
    paddingVertical: vs(6), paddingHorizontal: s(18), borderRadius: s(6),
    backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.white,
  },
  searchTextBtnPressed: { backgroundColor: '#005bb5' },
  searchTextBtnText:    { fontSize: s(12), color: '#fff', fontWeight: '600' },
});

// ─── Main Styles ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1, backgroundColor: C.bg,
    paddingTop: Platform.OS === 'android' ? vs(30) : 0,
  },
  navBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: s(12),
    paddingTop: Platform.OS === 'ios' ? vs(52) : vs(10),
    paddingBottom: vs(6), backgroundColor: '#fff',
  },
  backBtn: { padding: s(4) },
  headerBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: s(14), paddingVertical: vs(14),
    marginHorizontal: s(12), borderRadius: s(6), marginBottom: vs(10),
  },
  headerBoxTitle: {
    fontSize: s(24), fontWeight: '800', color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'Tamil Sangam MN' : 'sans-serif-medium',
  },
  numPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.pillBg, paddingHorizontal: s(12), paddingVertical: vs(7),
    borderRadius: s(20), borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  numPillText: { fontSize: s(12), color: C.pillText, fontWeight: '600', marginRight: s(2) },
  dropdownBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.dropdown, marginHorizontal: s(12), borderRadius: s(4),
    paddingHorizontal: s(16), paddingVertical: vs(14), marginBottom: vs(16),
  },
  dropdownBtnText: {
    flex: 1, fontSize: s(14), color: '#fff', fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Tamil Sangam MN' : 'sans-serif', marginRight: s(8),
  },
  filterLoader: {
    backgroundColor: C.dropdown, marginHorizontal: s(12), borderRadius: s(4),
    paddingVertical: vs(16), alignItems: 'center', marginBottom: vs(16),
  },
  sectionTitleWrap: { paddingHorizontal: s(14), paddingTop: vs(4), paddingBottom: vs(4) },
  sectionTitle: {
    fontSize: s(18), fontWeight: '800', color: C.sectionTitle,
    fontFamily: Platform.OS === 'ios' ? 'Tamil Sangam MN' : 'sans-serif-medium',
  },
  sectionUnderline: {
    height: vs(3), backgroundColor: C.underline,
    alignSelf: 'flex-start', width: '60%', marginTop: vs(3), borderRadius: s(2),
  },
  kuralRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: s(14), paddingVertical: vs(16), backgroundColor: C.rowBg,
  },
  kuralRowActive: {
    backgroundColor: '#f0f5ff',
  },
  numCircle: {
    width: s(24), height: s(24), borderRadius: s(12),
    backgroundColor: C.numCircleBg, alignItems: 'center', justifyContent: 'center',
    marginRight: s(14), flexShrink: 0,
  },
  numCircleActive: {
    backgroundColor: C.breadcrumbLink,
  },
  numCircleText:       { fontSize: s(10), fontWeight: '700', color: C.numCircleText },
  numCircleTextActive: { color: '#ffffff' },
  kuralTextWrap:       { flex: 1 },
  kuralLine:           { fontSize: s(9), color: C.kuralText, lineHeight: vs(15), fontWeight: '500', fontFamily: Platform.OS === 'ios' ? 'Tamil Sangam MN' : 'sans-serif' },
  kuralLineHighlighted:{ color: '#1a56db', fontWeight: '700' },
  separator:           { height: 1, backgroundColor: C.separator, marginLeft: s(64) },
  loaderWrap:          { paddingVertical: vs(40), alignItems: 'center' },
  emptyWrap:           { paddingVertical: vs(40), alignItems: 'center' },
  emptyText:           { fontSize: s(14), color: '#aaa' },
});