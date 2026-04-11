// CommodityScreen.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  StyleSheet, RefreshControl, StatusBar, Dimensions, Modal, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import Svg, { Polyline, Line, Text as SvgText, Circle, Rect } from 'react-native-svg';
import { ms, s, vs } from '../utils/scaling';
import { FONTS } from '../utils/constants';

const { width: SCREEN_W } = Dimensions.get('window');

const PAL = {
  primary: '#096dd2',
  bg: '#f1f3f4',
  white: '#ffffff',
  border: '#e7e7e7',
  text: '#333333',
  subtext: '#9d9d9d',
  headerBg: '#f7f7f7',
  green: 'green',
  red: 'red',
};

const API_URL = 'https://api-st.dinamalar.com/bussinessbox?duration=';

// ─── Dropdown ─────────────────────────────────────────────────────────────────
function Dropdown({ options, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const current = options?.find(o => o.values === selected);
  return (
    <View>
      <TouchableOpacity style={dd.btn} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={dd.btnText} numberOfLines={1}>{current?.name || ''}</Text>
        <Ionicons name="chevron-down" size={s(13)} color={PAL.text} />
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={dd.backdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={dd.menu}>
            {options?.map((o, i) => (
              <TouchableOpacity
                key={i}
                style={[dd.menuItem, selected === o.values && dd.menuItemActive]}
                onPress={() => { onSelect(o.values); setOpen(false); }}
              >
                <Text style={[dd.menuText, selected === o.values && dd.menuTextActive]}>
                  {o.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
const dd = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f0f1f0', paddingHorizontal: s(10),
    paddingVertical: vs(8), borderRadius: s(2), minWidth: s(190),
  },
  btnText: {
    fontFamily: FONTS.muktaMalar.bold, fontSize: ms(14),
    color: PAL.text, flex: 1, marginRight: s(4),
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  menu: {
    backgroundColor: PAL.white, width: s(230),
    borderWidth: 1, borderColor: 'rgba(145,158,171,0.24)', maxHeight: vs(320),
  },
  menuItem: { paddingHorizontal: s(10), paddingVertical: vs(9) },
  menuItemActive: { backgroundColor: PAL.primary },
  menuText: { fontFamily: FONTS.muktaMalar.regular, fontSize: ms(14), color: PAL.text },
  menuTextActive: { color: PAL.white, fontFamily: FONTS.muktaMalar.bold },
});

// ─── SVG Line Chart ───────────────────────────────────────────────────────────
function LineChartView({ data, dataKey }) {
  if (!data || data.length < 2) {
    return (
      <View style={{ height: vs(220), justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: PAL.subtext, fontFamily: FONTS.muktaMalar.regular, fontSize: ms(13) }}>
          தகவல் இல்லை
        </Text>
      </View>
    );
  }

  const chartW = SCREEN_W - s(32);
  const PAD = { top: vs(30), bottom: vs(40), left: s(56), right: s(16) };
  const plotW = chartW - PAD.left - PAD.right;
  const plotH = vs(200);
  const totalH = plotH + PAD.top + PAD.bottom;

  // Parse values
  const values = data.map(d => parseFloat(d[dataKey]) || 0).filter(v => v > 0);
  if (values.length < 2) return null;

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  // Generate ~5 Y-axis ticks from actual data
  const step = Math.ceil((maxVal - minVal) / 4 / 10) * 10;
  const tickStart = Math.floor(minVal / step) * step;
  const yTicks = [];
  for (let t = tickStart; t <= maxVal + step; t += step) {
    yTicks.push(t);
  }

  const toX = (i) => PAD.left + (i / (data.length - 1)) * plotW;
  const toY = (v) => PAD.top + plotH - ((v - minVal) / range) * plotH;

  // Polyline points
  const points = data.map((d, i) => {
    const v = parseFloat(d[dataKey]) || 0;
    return `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`;
  }).join(' ');

  // Last point
  const lastVal = values[values.length - 1];
  const lastX = toX(data.length - 1);
  const lastY = toY(lastVal);
  const lastDate = data[data.length - 1]?.standarddate || '';
  const firstGraphDate = data[0]?.graphdate || '';
  const lastGraphDate = data[data.length - 1]?.graphdate || '';

  const tooltipW = s(70);
  const tooltipH = vs(22);
  const tooltipX = Math.min(lastX - tooltipW / 2, chartW - tooltipW - PAD.right);
  const tooltipY = lastY - tooltipH - vs(6);

  return (
    <Svg width={chartW} height={totalH}>
      {/* Grid lines + Y ticks */}
      {yTicks.map((t, i) => {
        const y = toY(t);
        if (y < PAD.top - vs(5) || y > PAD.top + plotH + vs(5)) return null;
        return (
          <React.Fragment key={`y-${i}`}>
            <Line
              x1={PAD.left} y1={y}
              x2={PAD.left + plotW} y2={y}
              stroke="#ddd" strokeWidth={1} strokeDasharray="3,3"
            />
            <SvgText
              x={PAD.left - s(4)} y={y + vs(4)}
              textAnchor="end" fontSize={ms(10)}
              fill={PAL.subtext}
            >
              {t.toLocaleString('en-IN')}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* Line */}
      <Polyline points={points} fill="none" stroke={PAL.primary} strokeWidth={s(1.8)} />

      {/* Last dot */}
      <Circle cx={lastX} cy={lastY} r={s(5)} fill={PAL.primary} />

      {/* Tooltip box */}
      <Rect x={tooltipX} y={tooltipY} width={tooltipW} height={tooltipH}
        fill={PAL.primary} rx={s(2)} />
      <SvgText
        x={tooltipX + tooltipW / 2} y={tooltipY + tooltipH - vs(7)}
        textAnchor="middle" fontSize={ms(11)} fill="#fff" fontWeight="bold"
      >
        {lastVal.toLocaleString('en-IN')}
      </SvgText>
      {/* Date below tooltip */}
      <SvgText
        x={tooltipX + tooltipW / 2} y={tooltipY + tooltipH + vs(10)}
        textAnchor="middle" fontSize={ms(9)} fill={PAL.primary}
      >
        {lastDate}
      </SvgText>

      {/* X-axis line */}
      <Line
        x1={PAD.left} y1={PAD.top + plotH}
        x2={PAD.left + plotW} y2={PAD.top + plotH}
        stroke="#ccc" strokeWidth={1}
      />

      {/* X labels */}
      <SvgText x={PAD.left} y={totalH - vs(4)}
        textAnchor="start" fontSize={ms(9)} fill={PAL.subtext}>
        {firstGraphDate}
      </SvgText>
      <SvgText x={PAD.left + plotW} y={totalH - vs(4)}
        textAnchor="end" fontSize={ms(9)} fill={PAL.subtext}>
        {lastGraphDate}
      </SvgText>
    </Svg>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CommodityScreen() {
  const navigation = useNavigation();

  const [baseData, setBaseData] = useState(null);   // rates + fuel + sharemarket
  const [goldHistory, setGoldHistory] = useState([]);
  const [silverHistory, setSilverHistory] = useState([]);
  const [filters, setFilters] = useState([]);

  const [goldDuration, setGoldDuration] = useState('1y');
  const [silverDuration, setSilverDuration] = useState('1y');

  const [loadingBase, setLoadingBase] = useState(true);
  const [loadingGold, setLoadingGold] = useState(false);
  const [loadingSilver, setLoadingSilver] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Fetch base data (rates, fuel, sharemarket) ─────────────────────────────
  const fetchBase = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}`);
      const d = res.data;
      setBaseData(d);
      setFilters(d?.goldfilter || []);
    } catch (e) {
      console.error('Base fetch error', e);
    } finally {
      setLoadingBase(false);
      setRefreshing(false);
    }
  }, []);

  // ── Fetch gold history ─────────────────────────────────────────────────────
  const fetchGoldHistory = useCallback(async (duration) => {
    setLoadingGold(true);
    try {
      const res = await axios.get(`${API_URL}${duration}`);
      const history = res.data?.newlist?.goldhistory || [];
      setGoldHistory(history);
    } catch (e) {
      console.error('Gold history fetch error', e);
    } finally {
      setLoadingGold(false);
    }
  }, []);

  // ── Fetch silver history ───────────────────────────────────────────────────
  const fetchSilverHistory = useCallback(async (duration) => {
    setLoadingSilver(true);
    try {
      const res = await axios.get(`${API_URL}${duration}`);
      // website uses goldhistory_pm if exists, else goldhistory
      const history =
        res.data?.newlist?.goldhistory_pm?.length > 0
          ? res.data.newlist.goldhistory_pm
          : res.data?.newlist?.goldhistory || [];
      setSilverHistory(history);
    } catch (e) {
      console.error('Silver history fetch error', e);
    } finally {
      setLoadingSilver(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchBase();
    fetchGoldHistory('1y');
    fetchSilverHistory('1y');
  }, []);

  // Gold duration changed
  const goldInit = useRef(true);
  useEffect(() => {
    if (goldInit.current) { goldInit.current = false; return; }
    fetchGoldHistory(goldDuration);
  }, [goldDuration]);

  // Silver duration changed
  const silverInit = useRef(true);
  useEffect(() => {
    if (silverInit.current) { silverInit.current = false; return; }
    fetchSilverHistory(silverDuration);
  }, [silverDuration]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBase();
    fetchGoldHistory(goldDuration);
    fetchSilverHistory(silverDuration);
  };

  // ── Parse ──────────────────────────────────────────────────────────────────
  const newlist     = baseData?.newlist || {};
  const meta        = newlist?.data?.[0] || {};
  const gold        = newlist?.gold || [];
  const silver      = newlist?.silver || [];
  const fuel        = newlist?.fuel || [];
  const sharemarket = newlist?.sharemarket || [];
  const fuelItem    = fuel[0] || {};

  if (loadingBase) {
    return (
      <SafeAreaView style={cSt.container} edges={['top', 'left', 'right']}>
        <View style={cSt.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={cSt.backBtn}>
            <Ionicons name="arrow-back" size={s(22)} color={PAL.text} />
          </TouchableOpacity>
          <Text style={cSt.headerTitle}>கமாடிட்டி சந்தை</Text>
          <View style={{ width: s(40) }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={PAL.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={cSt.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={cSt.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={cSt.backBtn}>
          <Ionicons name="arrow-back" size={s(22)} color={PAL.text} />
        </TouchableOpacity>
        <Text style={cSt.headerTitle}>கமாடிட்டி சந்தை</Text>
        <TouchableOpacity onPress={onRefresh} style={{ width: s(40), alignItems: 'flex-end', padding: s(4) }}>
          <Ionicons name="refresh" size={s(20)} color={PAL.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[PAL.primary]} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={cSt.scrollContent}
      >
        {/* ── Gold + Silver rate cards side by side ── */}
        <View style={cSt.sideRow}>
          {/* Gold */}
          <View style={[cSt.rateCard, { flex: 1, marginRight: s(6) }]}>
            <View style={cSt.cardHeader}>
              <Image source={{ uri: 'https://images.dinamalar.com/2024/images/goldCoin.png' }}
                style={cSt.coinIcon} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={cSt.cardTitle} numberOfLines={1}>{meta.goldtitle || 'தங்கம் விலை நிலவரம் ( ₹ )'}</Text>
                <Text style={cSt.cardDate}>{meta.golddate || ''}</Text>
              </View>
            </View>
            <View style={cSt.divH} />
            <View style={{ flexDirection: 'row' }}>
              {gold.map((ele, i) => {
                const isUp = ele.change === 'increase';
                const isDown = ele.change === 'decrease';
                const clr = isUp ? PAL.green : isDown ? PAL.red : ele.color || PAL.subtext;
                return (
                  <React.Fragment key={i}>
                    {i > 0 && <View style={cSt.divV} />}
                    <View style={cSt.valCol}>
                      <Text style={cSt.valLabel}>{ele.gtype === 'G18k' ? '18 காரட் 1கி' : '22 காரட் 1கி'}</Text>
                      <Text style={cSt.valAmt}>{ele.rate}</Text>
                      <View style={cSt.diffRow}>
                        {ele.diff != 0 && <Text style={[cSt.diffTxt, { color: clr }]}>{ele.diff} </Text>}
                        {isUp && <Ionicons name="caret-up" size={s(13)} color={PAL.green} />}
                        {isDown && <Ionicons name="caret-down" size={s(13)} color={PAL.red} />}
                      </View>
                    </View>
                  </React.Fragment>
                );
              })}
            </View>
          </View>

          {/* Silver */}
          <View style={[cSt.rateCard, { flex: 1 }]}>
            <View style={cSt.cardHeader}>
              <Image source={{ uri: 'https://images.dinamalar.com/2024/images/silver-coin.png' }}
                style={cSt.coinIcon} resizeMode="contain" />
              <View style={{ flex: 1 }}>
                <Text style={cSt.cardTitle} numberOfLines={2}>{meta.silvertitle || 'வெள்ளி விலை நிலவரம் ( ₹ )'}</Text>
                <Text style={cSt.cardDate}>{meta.golddate || ''}</Text>
              </View>
            </View>
            <View style={cSt.divH} />
            {silver.slice(0, 1).map((ele, i) => {
              const isUp = ele.change === 'increase';
              const isDown = ele.change === 'decrease';
              const clr = isUp ? PAL.green : isDown ? PAL.red : ele.color || PAL.subtext;
              return (
                <View key={i} style={cSt.valCol}>
                  <Text style={cSt.valLabel}>1 கிராம்</Text>
                  <Text style={cSt.valAmt}>{ele.rate}</Text>
                  <View style={cSt.diffRow}>
                    {ele.diff != 0 && <Text style={[cSt.diffTxt, { color: clr }]}>{ele.diff} </Text>}
                    {isUp && <Ionicons name="caret-up" size={s(13)} color={PAL.green} />}
                    {isDown && <Ionicons name="caret-down" size={s(13)} color={PAL.red} />}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Gold Graph ── */}
        <View style={cSt.graphCard}>
          <View style={cSt.graphHeaderRow}>
            <Text style={cSt.graphLabel}>தங்கம்</Text>
            <Dropdown options={filters} selected={goldDuration} onSelect={setGoldDuration} />
          </View>
          {loadingGold ? (
            <View style={cSt.chartLoader}>
              <ActivityIndicator color={PAL.primary} />
            </View>
          ) : (
            <LineChartView data={goldHistory} dataKey="gold" />
          )}
        </View>

        {/* ── Silver Graph ── */}
        <View style={cSt.graphCard}>
          <View style={cSt.graphHeaderRow}>
            <Text style={cSt.graphLabel}>வெள்ளி</Text>
            <Dropdown options={filters} selected={silverDuration} onSelect={setSilverDuration} />
          </View>
          {loadingSilver ? (
            <View style={cSt.chartLoader}>
              <ActivityIndicator color={PAL.primary} />
            </View>
          ) : (
            <LineChartView data={silverHistory} dataKey="silver" />
          )}
        </View>

        {/* ── Petrol ── */}
        <View style={[cSt.rateCard, { marginBottom: s(8) }]}>
          <View style={cSt.cardHeader}>
            <Image source={{ uri: 'https://images.dinamalar.com/2024/images/Petrol.png' }}
              style={cSt.coinIcon} resizeMode="contain" />
            <View>
              <Text style={cSt.cardTitle}>பெட்ரோல் விலை நிலவரம் ( ₹ )</Text>
              <Text style={cSt.cardDate}>{fuelItem.date || ''}</Text>
            </View>
          </View>
          <View style={cSt.divH} />
          <View style={cSt.fuelValueRow}>
            <Text style={cSt.fuelAmt}>{fuelItem.petrol}</Text>
            {fuelItem.petroldiff != 0 ? (
              <Text style={[cSt.diffTxt, { color: fuelItem.colorpetrol || PAL.subtext, marginLeft: s(6) }]}>
                {fuelItem.petroldiff}
              </Text>
            ) : (
              <Text style={[cSt.diffTxt, { color: PAL.subtext, marginLeft: s(6) }]}>
                {fuelItem.changepetrol || ''}
              </Text>
            )}
          </View>
        </View>

        {/* ── Diesel ── */}
        <View style={[cSt.rateCard, { marginBottom: s(8) }]}>
          <View style={cSt.cardHeader}>
            <Image source={{ uri: 'https://images.dinamalar.com/2024/images/Petrol.png' }}
              style={cSt.coinIcon} resizeMode="contain" />
            <View>
              <Text style={cSt.cardTitle}>டீசல் விலை நிலவரம் ( ₹ )</Text>
              <Text style={cSt.cardDate}>{fuelItem.date || ''}</Text>
            </View>
          </View>
          <View style={cSt.divH} />
          <View style={cSt.fuelValueRow}>
            <Text style={cSt.fuelAmt}>{fuelItem.diesel}</Text>
            {fuelItem.desieldiff != 0 ? (
              <Text style={[cSt.diffTxt, { color: fuelItem.colordesiel || PAL.subtext, marginLeft: s(6) }]}>
                {fuelItem.desieldiff}
              </Text>
            ) : (
              <Text style={[cSt.diffTxt, { color: PAL.subtext, marginLeft: s(6) }]}>
                {fuelItem.changedesiel || ''}
              </Text>
            )}
          </View>
        </View>

        {/* ── Share Market (BSE + NSE stacked) ── */}
        {sharemarket.map((ele, i) => {
          const isUp = ele.change !== 'down';
          const clr = isUp ? PAL.green : PAL.red;
          const label = ele.stype === 'bse' ? 'பி.எஸ்.இ :' : 'என்.எஸ்.இ :';
          return (
            <View key={i} style={[cSt.rateCard, { marginBottom: s(8) }]}>
              <View style={cSt.cardHeader}>
                <Image source={{ uri: 'https://images.dinamalar.com/2024/images/stock1.png' }}
                  style={{ width: s(20), height: s(20), marginRight: s(8) }} resizeMode="contain" />
                <View>
                  <Text style={cSt.cardTitle}>{label}</Text>
                  <Text style={cSt.cardDate}>{ele.date || ''}</Text>
                </View>
              </View>
              <View style={cSt.divH} />
              {[
                { label: 'Current', value: ele.value, main: true, diff: ele.diff, color: clr, isUp },
                { label: 'High', value: ele.high },
                { label: 'Low', value: ele.low },
                { label: 'Prev. Close', value: ele.prev },
              ].map((row, ri) => (
                <View key={ri} style={cSt.tableRow}>
                  <Text style={cSt.tableLabel}>{row.label}</Text>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[cSt.tableVal, row.main && cSt.tableValMain]}>{row.value}</Text>
                    {row.main && (
                      <View style={cSt.diffRow}>
                        <Text style={[cSt.diffTxt, { color: row.color }]}>{row.diff} </Text>
                        <Ionicons
                          name={row.isUp ? 'caret-up' : 'caret-down'}
                          size={s(14)} color={row.color}
                        />
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          );
        })}

        <View style={{ height: vs(20) }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const cSt = StyleSheet.create({
  container: { flex: 1, backgroundColor: PAL.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: PAL.white, paddingHorizontal: s(12), paddingVertical: vs(12),
    borderBottomWidth: 1, borderBottomColor: PAL.border, elevation: 2,
  },
  backBtn: { padding: s(4), width: s(40) },
  headerTitle: {
    fontSize: ms(17), fontFamily: FONTS.muktaMalar.bold,
    color: PAL.text, flex: 1, textAlign: 'center',
  },

  scrollContent: { padding: s(8), paddingBottom: vs(30) },

  sideRow: { flexDirection: 'row', marginBottom: s(8) },

  rateCard: {
    backgroundColor: PAL.white,
    borderWidth: 1, borderColor: PAL.border,
    marginBottom: 0,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: PAL.headerBg,
    paddingHorizontal: s(8), paddingVertical: vs(6),
  },
  coinIcon: { width: s(28), height: s(28), marginRight: s(6) },
  cardTitle: {
    fontFamily: FONTS.muktaMalar.bold, fontSize: ms(12), color: PAL.text,
  },
  cardDate: {
    fontFamily: FONTS.muktaMalar.regular, fontSize: ms(11), color: PAL.subtext, marginTop: vs(1),
  },

  divH: { height: 1, backgroundColor: PAL.border },
  divV: { width: 1, backgroundColor: PAL.border },

  valCol: { flex: 1, alignItems: 'center', paddingVertical: vs(10), paddingHorizontal: s(4) },
  valLabel: {
    fontFamily: FONTS.muktaMalar.regular, fontSize: ms(11),
    color: PAL.subtext, marginBottom: vs(2), textAlign: 'center',
  },
  valAmt: { fontFamily: FONTS.muktaMalar.bold, fontSize: ms(16), color: PAL.text },
  diffRow: { flexDirection: 'row', alignItems: 'center', marginTop: vs(2) },
  diffTxt: { fontFamily: FONTS.muktaMalar.bold, fontSize: ms(13) },

  // Graph
  graphCard: {
    backgroundColor: PAL.bg, marginBottom: s(8), paddingVertical: s(8),
  },
  graphHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(4), marginBottom: vs(6),
  },
  graphLabel: {
    fontFamily: FONTS.muktaMalar.regular, fontSize: ms(16), color: PAL.subtext,
    paddingLeft: s(4),
  },
  chartLoader: {
    height: vs(200), justifyContent: 'center', alignItems: 'center',
    backgroundColor: PAL.bg,
  },

  // Fuel
  fuelValueRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: vs(14),
  },
  fuelAmt: { fontFamily: FONTS.muktaMalar.bold, fontSize: ms(22), color: PAL.text },

  // Share market table
  tableRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: s(10), paddingVertical: vs(6),
    borderBottomWidth: 1, borderBottomColor: PAL.border,
  },
  tableLabel: { fontFamily: FONTS.muktaMalar.regular, fontSize: ms(13), color: '#666' },
  tableVal: { fontFamily: FONTS.muktaMalar.regular, fontSize: ms(13), color: '#666' },
  tableValMain: { fontFamily: FONTS.muktaMalar.bold, fontSize: ms(16), color: PAL.text },
});