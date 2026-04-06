import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mainApi, API_ENDPOINTS } from '../config/api';
import { COLORS, FONTS } from '../utils/constants';
import { vs } from 'react-native-size-matters';
import { useFontSize } from '../context/FontSizeContext';

const BLUE   = '#1565c0';
const RED    = '#cc0000';
const YELLOW = '#f9e44b';
const GREEN  = '#06960d';
const ORANGE = '#e65100';
const BORDER = '#e0e0e0';
const TEXT1  = '#111111';
const TEXT2  = '#444444';
const TEXT3  = '#777777';

function extractCalendarData(resData) {
  const dc = resData?.dayCalendar;
  if (!dc) return { calInfo: null, upcoming: [], history: [] };

  const candidates = [
    dc?.original?.data,
    dc?.original?.data?.[0],
    dc?.original,
    dc?.data,
    dc?.data?.[0],
    dc,
  ];

  let calInfo = null;
  for (const c of candidates) {
    if (c && (c.engdate || c.tamilmonth || c.nallaneram)) {
      calInfo = c;
      break;
    }
  }

  const upcomingSources = [
    dc?.original?.varavirukumData,
    dc?.original?.data?.varavirukumData,
    dc?.varavirukumData,
    calInfo?.varavirukumData,
  ];
  const historySources = [
    dc?.original?.varalatrilindru,
    dc?.original?.data?.varalatrilindru,
    dc?.varalatrilindru,
    calInfo?.varalatrilindru,
  ];

  const upcoming = upcomingSources.find(Array.isArray) ?? [];
  const history  = historySources.find(Array.isArray) ?? [];

  return { calInfo, upcoming, history };
}

export default function DinamalarCalendarScreen() {
  const { sf } = useFontSize();
  const [calInfo,  setCalInfo]  = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => { fetchCalendarData(); }, []);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await mainApi.get(API_ENDPOINTS.HOME);
      const { calInfo, upcoming, history } = extractCalendarData(res.data);
      if (calInfo) {
        setCalInfo(calInfo);
        setUpcoming(upcoming);
        setHistory(history);
      } else {
        setError('காலண்டர் தரவு கிடைக்கவில்லை');
      }
    } catch (e) {
      setError(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getPanchangamRows = (d) => [
    { label: 'நல்ல நேரம்',    value: d.nallaneram },
    { label: 'எமகண்டம்',      value: d.yema },
    { label: 'ராகு',          value: d.raagu },
    { label: 'குளிகை',        value: d.kuli },
    { label: 'திதி',          value: d.thithi },
    {
      label: 'திதி நேரம்',
      value: (d.thithi1 && d.thithi1 !== 'select')
        ? `${d.thithi1} கா ${d.thithitime}`.trim()
        : d.thithitime,
    },
    { label: 'நட்சத்திரம்',   value: d.natchathiram },
    { label: 'யோகம்',         value: d.yogam },
    { label: 'சந்திராஷ்டமம்', value: d.santhirashtramam },
    { label: 'சூலம்',         value: d.solam },
    { label: 'பரிகாரம்',      value: d.parik },
  ].filter((r) => r.value && r.value !== 'select' && String(r.value).trim() !== '');

  if (loading) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.center}>
          <ActivityIndicator size="large" color={BLUE} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !calInfo) {
    return (
      <SafeAreaView style={st.safe}>
        <View style={st.center}>
          <Text style={[st.errorText, { fontSize: sf(15) }]}>{error || 'தரவு கிடைக்கவில்லை'}</Text>
          <TouchableOpacity style={st.retryBtn} onPress={fetchCalendarData}>
            <Text style={[st.retryText, { fontSize: sf(14) }]}>மீண்டும் முயற்சி</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const panchangamRows = getPanchangamRows(calInfo);
  const specialDay = (calInfo.dayspl && calInfo.dayspl !== 'select')
    ? calInfo.dayspl
    : (calInfo.dayspl1 && calInfo.dayspl1 !== 'select') ? calInfo.dayspl1 : null;

  return (
    <SafeAreaView style={st.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <ScrollView
        style={st.scroll}
        contentContainerStyle={st.scrollInner}
        showsVerticalScrollIndicator={false}
      >
        {/* Page title */}
        <TouchableOpacity 
          style={st.pageTitleRow}
          onPress={() => {
            console.log('📅 CALENDAR TITLE CLICKED - Opening Play Store');
            const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.daily.dinamalar&hl=en_IN';
            Linking.openURL(playStoreUrl).catch(() => console.log('Failed to open Play Store'));
          }}
          activeOpacity={0.8}
        >
          <Text style={[st.pageTitle, { fontSize: sf(18) }]}>காலண்டர்</Text>
          <View style={st.titleUnderline} />
        </TouchableOpacity>

        {/* Date card */}
        <View style={st.card}>
          <View style={st.cardLeft}>
            <Text style={[st.cardNum, { fontSize: sf(32) }]}>{calInfo.engdate}</Text>
            <Text style={[st.cardMonth, { fontSize: sf(13) }]}>{calInfo.engmonth}</Text>
            <Text style={[st.cardDay, { fontSize: sf(12) }]}>{calInfo.daytamil}</Text>
          </View>
          <View style={st.cardRight}>
            <View style={st.cardTopRow}>
              <View style={st.cardTopLeft}>
                <Text style={[st.tamilMonth, { fontSize: sf(17) }]}>{calInfo.tamilmonth}</Text>
                <Text style={[st.tamilYear, { fontSize: sf(11) }]}>{calInfo.tamilyear}</Text>
              </View>
              <Text style={[st.tamilDateNum, { fontSize: sf(24) }]}>{calInfo.tamildate}</Text>
            </View>
            <View style={st.cardSep} />
            <View style={st.ramzanRow}>
              <Text style={[st.ramzanLabel, { fontSize: sf(16) }]}>{calInfo.muslimmonth}</Text>
              <Text style={[st.ramzanNum, { fontSize: sf(20) }]}>{calInfo.muslimdate}</Text>
            </View>
          </View>
        </View>

        {/* Special day badge — centered */}
        {!!specialDay && (
          <View style={st.badgeWrap}>
            <View style={st.badge}>
              <Text style={[st.badgeText, { fontSize: sf(13) }]}>{specialDay}</Text>
            </View>
          </View>
        )}

        {/* Panchangam */}
        <View style={st.panchangam}>
          {panchangamRows.map((row, i) => (
            <View key={i} style={st.pRow}>
              <Text style={[st.pLabel, { fontSize: sf(12) }]}>{row.label} :</Text>
              <Text style={[st.pValue, { fontSize: sf(12) }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View style={st.blockDivider} />

        {/* Upcoming */}
        {upcoming.length > 0 && (
          <>
            <Text style={[st.sectionHead, { fontSize: sf(16) }]}>வரவிருக்கும் விசேஷங்கள்</Text>
            {upcoming.map((item, i) => (
              <View key={i} style={st.bulletRow}>
                <View style={st.bullet} />
                <View style={st.bulletContent}>
                  <Text style={[st.bulletTitle, { fontSize: sf(13.5) }]}>{item.news_head}</Text>
                  <Text style={[st.bulletDate, { fontSize: sf(12) }]}>{item.standarddate}</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {history.length > 0 && <View style={st.blockDivider} />}

        {/* History */}
        {history.length > 0 && (
          <>
            <Text style={[st.sectionHead, { fontSize: sf(16) }]}>வரலாற்றில் இன்று</Text>
            {history.map((item, i) => (
              <View key={i} style={st.bulletRow}>
                <View style={st.bullet} />
                <Text style={[st.histText, { fontSize: sf(13) }]}>{item.news_head}</Text>
              </View>
            ))}
          </>
        )}

        {/* More button */}
        {/* <TouchableOpacity style={st.moreBtn} activeOpacity={0.8}>
          <Text style={st.moreBtnText}>மேலும் காலண்டர்</Text>
        </TouchableOpacity> */}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#fff' },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 15, color: RED, textAlign: 'center', marginBottom: 12, fontFamily: FONTS.muktaMalar.regular },
  retryBtn:  { paddingHorizontal: 24, paddingVertical: 10, backgroundColor: BLUE, borderRadius: 6 },
  retryText: { color: '#fff', fontWeight: '600', fontSize: 14, fontFamily: FONTS.muktaMalar.semibold },

  // Scroll
  scroll:      { flex: 1 },
  scrollInner: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },

  // Page title
  pageTitleRow:   { marginBottom: 10 },
  pageTitle:      { fontSize: 20, fontWeight: '700', color: TEXT1, fontFamily: FONTS.anek.bold },
  titleUnderline: { height: 3, width: 52, backgroundColor: COLORS.primary, },

  // Date card
  card: {
    flexDirection: 'row',
    borderWidth:   0.5,
    borderColor:   BORDER,
    borderRadius:  6,
    overflow:      'hidden',
  },
  cardLeft: {
    backgroundColor: BLUE,
    width:           82,
    paddingVertical: 12,
    alignItems:      'center',
    justifyContent:  'center',
  },
  cardNum:    { fontSize: 38, fontWeight: '800', color: '#fff', lineHeight: 42 ,fontFamily:FONTS.muktaMalar.bold},
  cardMonth:  { fontSize: 13, fontWeight: '600', color: '#fff', marginTop: 2 ,fontFamily:FONTS.muktaMalar.bold},
  cardDay:    { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 3 ,fontFamily:FONTS.muktaMalar.semibold},
  cardRight:  { flex: 1 },
  cardTopRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 12,
    paddingVertical:   10,
  },
  cardTopLeft:   { flex: 1 },
  tamilMonth:    { fontSize: 17, fontWeight: '600', color: BLUE, fontFamily: FONTS.muktaMalar.bold },
  tamilYear:     { fontSize: 11, color: TEXT3, marginTop: 2, fontFamily: FONTS.muktaMalar.regular },
  tamilDateNum:  { fontSize: 24, fontWeight: '600', color: BLUE, fontFamily: FONTS.muktaMalar.bold },
  cardSep:       { height: 0.5, backgroundColor: BORDER },
  ramzanRow: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 12,
    paddingVertical:   10,
  },
  ramzanLabel: { fontSize: vs(16),  color: GREEN,fontFamily:FONTS.muktaMalar.bold },
  ramzanNum:   { fontSize: vs(20),  color: GREEN,fontFamily:FONTS.muktaMalar.bold },

  // Special badge — centered
  badgeWrap: {
    alignItems:    'center',    // ← centers the badge horizontally
    marginTop:     10,
    marginBottom:  6,
  },
  badge: {
    backgroundColor:   YELLOW,
    // borderRadius:      20,
    paddingHorizontal: 20,
    paddingVertical:   6,
  },
  badgeText: { fontSize: 13, fontWeight: '600', color: '#3e2c00', fontFamily: FONTS.muktaMalar.semibold },

  // Panchangam
  panchangam: { marginTop: 8 ,justifyContent:"center",alignItems:"center"},
  pRow: {
    flexDirection:     'row',
    paddingVertical:   7,
    // borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
    alignItems:        'flex-start',
    alignItems: 'center'
  },
  pLabel: { width: 136, fontSize: vs(12), color: TEXT1,fontFamily:FONTS.muktaMalar.regular },
  pValue: { flex: 1, fontSize: vs(12), color: TEXT1,fontFamily:FONTS.muktaMalar.regular,    },

  // Divider
  blockDivider: {
    height:           8,
    backgroundColor:  '#f5f5f5',
    marginHorizontal: -16,
    marginVertical:   16,
  },

  // Section heading
  sectionHead: { fontSize: 16, fontWeight: '700', color: TEXT1, marginBottom: 12, fontFamily: FONTS.muktaMalar.bold },

  // Bullet rows
  bulletRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    marginBottom:  12,
    gap:           10,
  },
  bullet: {
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: BLUE,
    marginTop:       4,
    flexShrink:      0,
  },
  bulletContent: { flex: 1 },
  bulletTitle:   { fontSize: 13.5, color: TEXT1, fontWeight: '500', lineHeight: 19, fontFamily: FONTS.muktaMalar.regular },
  bulletDate:    { fontSize: 12,   color: TEXT3, marginTop: 2, fontFamily: FONTS.muktaMalar.regular },
  histText:      { flex: 1, fontSize: 13.5, color: TEXT1, lineHeight: 22, fontFamily: FONTS.muktaMalar.regular },

  // More button
  moreBtn: {
    marginTop:       10,
    borderWidth:     1,
    borderColor:     BORDER,
    borderRadius:    6,
    paddingVertical: 11,
    alignItems:      'center',
  },
  moreBtnText: { fontSize: 14, color: RED, fontWeight: '600', fontFamily: FONTS.muktaMalar.semibold },
});