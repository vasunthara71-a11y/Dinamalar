// screens/NotificationScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS } from '../utils/constants';
import { s, vs } from '../utils/scaling';
import { ms } from 'react-native-size-matters';
import {  CDNApi } from '../config/api';
import { resetBadgeCount } from '../services/notificationService';

const PALETTE = {
  primary: '#096dd2',
  white:   '#FFFFFF',
  grey100: '#F9FAFB',
  grey200: '#F4F6F8',
  grey300: '#DFE3E8',
  grey500: '#919EAB',
  grey600: '#637381',
  grey800: '#212B36',
  flash:   '#ff6b35',
};

// ── Individual Flash Notification Card (Amazon style) ─────────────────────────
function FlashNotifCard({ item, index, onPress }) {
  const isNew = index < 3; // top 3 are "new"

  return (
    <TouchableOpacity
      style={[cardSt.wrap, isNew && cardSt.wrapNew]}
      onPress={() => onPress(item)}
      activeOpacity={0.75}
    >
      {/* Left: Flash icon container */}
      <View style={[cardSt.iconWrap, isNew && cardSt.iconWrapNew]}>
        <Ionicons name="flash" size={s(20)} color={isNew ? PALETTE.white : PALETTE.flash} />
      </View>

      {/* Right: Content */}
      <View style={cardSt.content}>
        {/* New badge + time row */}
        <View style={cardSt.topRow}>
          {isNew && (
            <View style={cardSt.newBadge}>
              <Text style={cardSt.newBadgeText}>புதியது</Text>
            </View>
          )}
          <View style={cardSt.timeBadge}>
            <Ionicons name="time-outline" size={s(11)} color={PALETTE.grey500} />
            <Text style={cardSt.timeText}>
              {item.clsdt ? new Date(item.clsdt).toLocaleDateString('ta-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : item.standarddate}{item.time ? `  ${item.time}` : ''}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[cardSt.title, !isNew && cardSt.titleRead]} numberOfLines={3}>
          {item.title || item.newstitle}
        </Text>

        {/* Bottom: Flash label */}
        <View style={cardSt.bottomRow}>
          <View style={cardSt.flashPill}>
            <Ionicons name="flash" size={s(10)} color={PALETTE.flash} />
            <Text style={cardSt.flashPillText}>ஃபிளாஷ் செய்தி</Text>
          </View>
          <Ionicons name="chevron-forward" size={s(14)} color={PALETTE.grey500} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const cardSt = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    backgroundColor: PALETTE.white,
    marginHorizontal: s(12),
    marginVertical: vs(4),
    borderRadius: s(8),
    padding: s(12),
    borderWidth: 1,
    borderColor: PALETTE.grey300,
    gap: s(12),
    alignItems: 'flex-start',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  wrapNew: {
    borderColor: '#FFD8C8',
    backgroundColor: '#FFFAF8',
    borderLeftWidth: 3,
    borderLeftColor: PALETTE.flash,
  },
  iconWrap: {
    width: s(40), height: s(40),
    borderRadius: s(20),
    backgroundColor: '#FFF3EE',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  iconWrapNew: {
    backgroundColor: PALETTE.flash,
  },
  content: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    marginBottom: vs(4),
  },
  newBadge: {
    backgroundColor: PALETTE.flash,
    borderRadius: s(4),
    paddingHorizontal: s(7),
    paddingVertical: vs(1),
  },
  newBadgeText: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(10),
    color: PALETTE.white,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(3),
  },
  timeText: {
    fontFamily: FONTS.muktaMalar.regular,
    fontSize: ms(11),
    color: PALETTE.grey500,
  },
  title: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(14),
    color: PALETTE.grey800,
    lineHeight: ms(22),
    marginBottom: vs(8),
  },
  titleRead: {
    color: PALETTE.grey600,
    fontFamily: FONTS.muktaMalar.regular,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flashPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    backgroundColor: '#FFF3EE',
    borderWidth: 1,
    borderColor: '#FFD8C8',
    borderRadius: s(4),
    paddingHorizontal: s(8),
    paddingVertical: vs(2),
  },
  flashPillText: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(11),
    color: PALETTE.flash,
  },
});

// ── Header ────────────────────────────────────────────────────────────────────
function NotifHeader({ count, onViewAll }) {
  return (
    <View style={hdrSt.wrap}>
      <View style={hdrSt.titleRow}>
        <Text style={hdrSt.title}>அறிவிப்புகள்</Text>
        {count > 0 && (
          <View style={hdrSt.countBubble}>
            <Text style={hdrSt.countText}>{count}</Text>
          </View>
        )}
      </View>
      <Text style={hdrSt.subtitle}>ஃபிளாஷ் செய்திகள் உடனடி அறிவிப்பு</Text>
      <TouchableOpacity style={hdrSt.viewAllBtn} onPress={onViewAll} activeOpacity={0.8}>
        <Ionicons name="newspaper-outline" size={s(15)} color={PALETTE.primary} />
        <Text style={hdrSt.viewAllText}>நேரடி செய்திகள் பார்க்க</Text>
        <Ionicons name="chevron-forward" size={s(14)} color={PALETTE.primary} />
      </TouchableOpacity>
    </View>
  );
}

const hdrSt = StyleSheet.create({
  wrap: {
    backgroundColor: PALETTE.white,
    paddingHorizontal: s(16),
    paddingTop: vs(16),
    paddingBottom: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.grey200,
    marginBottom: vs(8),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(10),
    marginBottom: vs(4),
  },
  title: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(20),
    color: PALETTE.grey800,
  },
  countBubble: {
    backgroundColor: PALETTE.flash,
    borderRadius: s(12),
    minWidth: s(24),
    height: s(24),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s(7),
  },
  countText: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(12),
    color: PALETTE.white,
  },
  subtitle: {
    fontFamily: FONTS.muktaMalar.regular,
    fontSize: ms(13),
    color: PALETTE.grey500,
    marginBottom: vs(10),
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    backgroundColor: '#EEF4FF',
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
    borderRadius: s(8),
    alignSelf: 'flex-start',
  },
  viewAllText: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(13),
    color: PALETTE.primary,
  },
});

// ── Empty State ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <View style={emptySt.wrap}>
      <View style={emptySt.iconCircle}>
        <Ionicons name="notifications-off-outline" size={s(36)} color={PALETTE.grey500} />
      </View>
      <Text style={emptySt.title}>அறிவிப்புகள் எதுவும் இல்லை</Text>
      <Text style={emptySt.sub}>புதிய ஃபிளாஷ் செய்திகள் வரும்போது இங்கே காட்டப்படும்</Text>
    </View>
  );
}

const emptySt = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s(32),
    paddingTop: vs(60),
    gap: vs(12),
  },
  iconCircle: {
    width: s(80), height: s(80),
    borderRadius: s(40),
    backgroundColor: PALETTE.grey200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: vs(8),
  },
  title: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(16),
    color: PALETTE.grey800,
    textAlign: 'center',
  },
  sub: {
    fontFamily: FONTS.muktaMalar.regular,
    fontSize: ms(13),
    color: PALETTE.grey500,
    textAlign: 'center',
    lineHeight: ms(20),
  },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function NotificationScreen() {
  const navigation              = useNavigation();
  const [flashItems, setFlash]  = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefresh] = useState(false);

  const loadFlash = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefresh(true) : setLoading(true);
    try {
      const res    = await  CDNApi.get('/latestmain', { params: { page: 1 } });
      const detail = res?.data?.detail || [];
      const flash  = detail.filter(i => i.maincat === 'flash');
      setFlash(flash);
    } catch {
      setFlash([]);
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  }, []);

  useEffect(() => {
    resetBadgeCount();   // clear badge the moment screen opens
    loadFlash();
  }, [loadFlash]);

  const goToTimeline = useCallback(() => {
    navigation.navigate('TimelineScreen');
  }, [navigation]);

  const handleItemPress = useCallback(() => {
    navigation.navigate('TimelineScreen');
  }, [navigation]);

  return (
    <SafeAreaView style={scrSt.container} edges={['top', 'left', 'right']}>

      {/* Top bar */}
      <View style={scrSt.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={scrSt.backBtn}>
          <Ionicons name="arrow-back" size={s(22)} color={PALETTE.grey800} />
        </TouchableOpacity>
        <Text style={scrSt.topBarTitle}>அறிவிப்புகள்</Text>
        <View style={{ width: s(30) }} />
      </View>

      {loading ? (
        <View style={scrSt.loader}>
          <ActivityIndicator size="large" color={PALETTE.primary} />
        </View>
      ) : (
        <FlatList
          data={flashItems}
          keyExtractor={(item, i) => `flash-${item.id}-${i}`}
          ListHeaderComponent={
            <NotifHeader
              count={flashItems.length}
              onViewAll={goToTimeline}
            />
          }
          renderItem={({ item, index }) => (
            <FlashNotifCard
              item={item}
              index={index}
              onPress={handleItemPress}
            />
          )}
          ListEmptyComponent={<EmptyState />}
          ListFooterComponent={<View style={{ height: vs(40) }} />}
          contentContainerStyle={{ paddingBottom: vs(20) }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadFlash(true)}
              colors={[PALETTE.primary]}
              tintColor={PALETTE.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const scrSt = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.grey100,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PALETTE.white,
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.grey200,
  },
  backBtn: { padding: s(4) },
  topBarTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(17),
    color: PALETTE.grey800,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
