// screens/TestNotificationScreen.js - Separate test screen for OneSignal API testing
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
  SafeAreaView, Alert, TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS } from '../utils/constants';
import { s, vs } from '../utils/scaling';
import { ms } from 'react-native-size-matters';
import {
  configureNotifications,
  checkNotificationPermissions,
  requestNotificationPermissions,
  getNotificationSettings,
  saveNotificationSettings,
  showFlashNewsNotification,
  playNotificationSound,
} from '../services/mobileNotificationService';

const PALETTE = {
  primary: '#096dd2',
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  white: '#FFFFFF',
  grey100: '#F9FAFB',
  grey200: '#F4F6F8',
  grey300: '#DFE3E8',
  grey500: '#919EAB',
  grey600: '#637381',
  grey800: '#212B36',
  flash: '#ff6b35',
};

// ── Test Notification Card ─────────────────────────────────────────────────────────────
function TestNotifCard({ item, index, onPress }) {
  const isNew = index < 3; // top 3 are "new"

  return (
    <TouchableOpacity
      style={[cardSt.wrap, isNew && cardSt.wrapNew]}
      onPress={() => onPress(item)}
      activeOpacity={0.75}
    >
      {/* Left: Icon container */}
      <View style={[cardSt.iconWrap, isNew && cardSt.iconWrapNew]}>
        <Ionicons 
          name={isNew ? 'notifications' : 'notifications-outline'} 
          size={s(20)} 
          color={isNew ? PALETTE.white : PALETTE.primary} 
        />
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
            <Ionicons name='time-outline' size={s(11)} color={PALETTE.grey500} />
            <Text style={cardSt.timeText}>
              {new Date(item.createdAt).toLocaleDateString('ta-IN', { 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[cardSt.title, !isNew && cardSt.titleRead]} numberOfLines={3}>
          {item.title}
        </Text>

        {/* Description */}
        <Text style={cardSt.description} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Bottom: Test label */}
        <View style={cardSt.bottomRow}>
          <View style={cardSt.testPill}>
            <Ionicons name='test-tube' size={s(10)} color={PALETTE.primary} />
            <Text style={cardSt.testPillText}>டெஸ்ட் அறிவிப்பு</Text>
          </View>
          <Ionicons name='chevron-forward' size={s(14)} color={PALETTE.grey500} />
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
    borderColor: '#D4F4DD',
    backgroundColor: '#F6FFED',
    borderLeftWidth: 3,
    borderLeftColor: PALETTE.success,
  },
  iconWrap: {
    width: s(40), height: s(40),
    borderRadius: s(20),
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  iconWrapNew: {
    backgroundColor: PALETTE.success,
  },
  content: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    marginBottom: vs(4),
  },
  newBadge: {
    backgroundColor: PALETTE.success,
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
    marginBottom: vs(4),
  },
  titleRead: {
    color: PALETTE.grey600,
    fontFamily: FONTS.muktaMalar.regular,
  },
  description: {
    fontFamily: FONTS.muktaMalar.regular,
    fontSize: ms(12),
    color: PALETTE.grey600,
    lineHeight: ms(18),
    marginBottom: vs(8),
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  testPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(4),
    backgroundColor: '#EEF4FF',
    borderWidth: 1,
    borderColor: '#D4E8FC',
    borderRadius: s(4),
    paddingHorizontal: s(8),
    paddingVertical: vs(2),
  },
  testPillText: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(11),
    color: PALETTE.primary,
  },
});

// ── Header ────────────────────────────────────────────────────────────────────────────
function TestNotifHeader({ 
  count, 
  onRefresh, 
  onCreateTest,
  notificationSettings,
  toggleNotificationSetting
}) {
  const handleToggleNotifications = () => {
    toggleNotificationSetting('mobileNotifications', !notificationSettings.mobileNotifications);
  };

  return (
    <View style={hdrSt.wrap}>
      <View style={hdrSt.titleRow}>
        <Text style={hdrSt.title}>டெஸ்ட் அறிவிப்புகள்</Text>
        {count > 0 && (
          <View style={hdrSt.countBubble}>
            <Text style={hdrSt.countText}>{count}</Text>
          </View>
        )}
      </View>
      <Text style={hdrSt.subtitle}>Mock API உடன் ரியல்-டைம் டெஸ்டிங் (2 விநாடிகள்)</Text>
      
      <View style={hdrSt.buttonRow}>
        <TouchableOpacity style={hdrSt.createBtn} onPress={onCreateTest} activeOpacity={0.8}>
          <Ionicons name="add-circle" size={s(15)} color={PALETTE.white} />
          <Text style={hdrSt.createBtnText}>டெஸ்ட் உருவாக்கு</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={hdrSt.refreshBtn} onPress={onRefresh} activeOpacity={0.8}>
          <Ionicons name="refresh" size={s(15)} color={PALETTE.primary} />
          <Text style={hdrSt.refreshBtnText}>புதுப்பி</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            hdrSt.settingsBtn, 
            !notificationSettings.mobileNotifications && hdrSt.settingsBtnDisabled
          ]} 
          onPress={handleToggleNotifications}
          activeOpacity={0.8}
        >
          <Ionicons 
            name={notificationSettings.mobileNotifications ? "notifications" : "notifications-off"} 
            size={s(15)} 
            color={notificationSettings.mobileNotifications ? PALETTE.success : PALETTE.grey600} 
          />
          <Text style={[
            hdrSt.settingsBtnText,
            !notificationSettings.mobileNotifications && hdrSt.settingsBtnTextDisabled
          ]}>
            {notificationSettings.mobileNotifications ? 'மொபைல்' : 'மொபைல் இல்லை'}
          </Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: PALETTE.success,
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
  buttonRow: {
    flexDirection: 'row',
    gap: s(8),
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    backgroundColor: PALETTE.success,
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
    borderRadius: s(8),
  },
  createBtnText: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(13),
    color: PALETTE.white,
  },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(6),
    backgroundColor: '#EEF4FF',
    paddingHorizontal: s(14),
    paddingVertical: vs(8),
    borderRadius: s(8),
    borderWidth: 1,
    borderColor: PALETTE.primary,
  },
  settingsBtnDisabled: {
    backgroundColor: PALETTE.grey200,
    borderColor: PALETTE.grey300,
  },
  settingsBtnText: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(13),
    color: PALETTE.primary,
  },
  settingsBtnTextDisabled: {
    color: PALETTE.grey600,
  },
  notificationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(8),
    paddingHorizontal: s(12),
  },
  notificationIconContainer: {
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: -s(8),
    right: -s(8),
    backgroundColor: PALETTE.error,
    borderRadius: s(10),
    minWidth: s(20),
    height: s(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(10),
    color: PALETTE.white,
  },
});

// ── Empty State ───────────────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <View style={emptySt.wrap}>
      <View style={emptySt.iconCircle}>
        <Ionicons name="test-tube-outline" size={s(36)} color={PALETTE.grey500} />
      </View>
      <Text style={emptySt.title}>டெஸ்ட் அறிவிப்புகள் இல்லை</Text>
      <Text style={emptySt.sub}>Mock API இல் புதிய டெஸ்ட் அறிவிப்புகளை உருவாக்கவும்</Text>
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

// ── Main Screen ───────────────────────────────────────────────────────────────────────
export default function TestNotificationScreen() {
  const navigation = useNavigation();
  const [testNotifications, setTestNotifications] = useState([]);
  const [testNotifCount, setTestNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [notificationSettings, setNotificationSettings] = useState({
    sound: true,
    vibrate: true,
    mobileNotifications: true,
  });
  const [permissions, setPermissions] = useState({ granted: false, denied: false });

  // Initial load and polling setup
  useEffect(() => {
    const init = async () => {
      // Configure notifications first
      const configured = await configureNotifications();
      if (!configured) {
        Alert.alert('பிழை', 'அறிவிப்பு அனுமதிகள் தேவையவில்லை');
      }

      // Check permissions
      const perms = await checkNotificationPermissions();
      setPermissions(perms);
      
      // Load notification settings
      const settings = await getNotificationSettings();
      setNotificationSettings(settings);
      
      // Load stored badge count
      const savedCount = await getTestBadgeCount();
      if (savedCount > 0) setTestNotifCount(savedCount);

      // Initial fetch
      await pollTestNotifications(testNotifications, setTestNotifications, setTestNotifCount);
      setLoading(false);
    };

    init();

    // Set up polling every 2 seconds
    const interval = setInterval(async () => {
      await pollTestNotifications(testNotifications, setTestNotifications, setTestNotifCount);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await pollTestNotifications(testNotifications, setTestNotifications, setTestNotifCount);
    setRefreshing(false);
  }, [testNotifications]);

  const handleCreateTest = useCallback(async () => {
    if (!newTitle.trim()) {
      Alert.alert('பிழை', 'தயவு செய்து தலைப்பு உள்ளிடவும்');
      return;
    }

    const newNotif = await createTestNotification(newTitle, newDescription);
    if (newNotif) {
      // This would normally POST to mock API
      console.log('🧪 Test notification created:', newNotif);
      Alert.alert('வெற்றி', 'டெஸ்ட் அறிவிப்பு உருவாக்கப்பட்டது!');
      setNewTitle('');
      setNewDescription('');
      setShowCreateModal(false);
      
      // Refresh after a short delay
      setTimeout(() => {
        handleRefresh();
      }, 1000);
    }
  }, [newTitle, newDescription]);

  const handleItemPress = useCallback((item) => {
    Alert.alert(
      'டெஸ்ட் அறிவிப்பு',
      `தலைப்பு: ${item.title}\n\nவிளக்கப்படு: ${item.description}`,
      [{ text: 'சரி', style: 'default' }]
    );
  }, []);

  const handleResetBadge = useCallback(async () => {
    await resetTestBadgeCount();
    setTestNotifCount(0);
    Alert.alert('வெற்றி', 'பேட்ஜ் எண்ணிக்கை மீட்டம் செய்யப்பட்டது!');
  }, []);

  const handleRequestPermissions = useCallback(async () => {
    const perms = await requestNotificationPermissions();
    setPermissions(perms);
    
    if (perms.granted) {
      Alert.alert('வெற்றி', 'அறிவிப்பு அனுமதிகள் வழங்கும்!');
    } else if (perms.denied) {
      Alert.alert('பிழை', 'அறிவிப்பு அனுமதிகள் மறுக்கப்பட்டது. செட்டிங்ஸில் அனுமதிகளை மாற்றவும்.');
    }
  }, []);

  const toggleNotificationSetting = useCallback(async (key, value) => {
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);
    await saveNotificationSettings(newSettings);
    
    if (key === 'mobileNotifications' && value === false) {
      Alert.alert('தகவல்', 'மொபைல் அறிவிப்புகள் முடக்கப்படம்.');
    }
  }, [notificationSettings]);

  return (
    <SafeAreaView style={scrSt.container} edges={['top', 'left', 'right']}>
      {/* Top bar */}
      <View style={scrSt.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={scrSt.backBtn}>
          <Ionicons name="arrow-back" size={s(22)} color={PALETTE.grey800} />
        </TouchableOpacity>
        <Text style={scrSt.topBarTitle}>டெஸ்ட் அறிவிப்புகள்</Text>
        <TouchableOpacity onPress={() => navigation.navigate('TestNotificationScreen')} style={scrSt.notificationBtn}>
          <View style={scrSt.notificationIconContainer}>
            <Ionicons name="notifications" size={s(20)} color={PALETTE.primary} />
            {testNotifCount > 0 && (
              <View style={scrSt.badgeContainer}>
                <Text style={scrSt.badgeText}>{testNotifCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRequestPermissions} style={scrSt.resetBtn}>
          <Ionicons name="settings" size={s(20)} color={permissions.granted ? PALETTE.success : PALETTE.warning} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={scrSt.loader}>
          <ActivityIndicator size="large" color={PALETTE.primary} />
          <Text style={scrSt.loadingText}>டெஸ்ட் அறிவிப்புகளை ஏற்றுகிறது...</Text>
        </View>
      ) : (
        <FlatList
          data={testNotifications}
          keyExtractor={(item, i) => `test-${item.id}-${i}`}
          ListHeaderComponent={
            <TestNotifHeader
              count={testNotifCount}
              onRefresh={handleRefresh}
              onCreateTest={() => setShowCreateModal(true)}
              notificationSettings={notificationSettings}
              toggleNotificationSetting={toggleNotificationSetting}
            />
          }
          renderItem={({ item, index }) => (
            <TestNotifCard
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
              onRefresh={handleRefresh}
              colors={[PALETTE.primary]}
              tintColor={PALETTE.primary}
            />
          }
        />
      )}

      {/* Create Test Modal */}
      {showCreateModal && (
        <View style={scrSt.modalOverlay}>
          <View style={scrSt.modalContent}>
            <View style={scrSt.modalHeader}>
              <Text style={scrSt.modalTitle}>புதிய டெஸ்ட் அறிவிப்பு</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={s(24)} color={PALETTE.grey600} />
              </TouchableOpacity>
            </View>
            
            <View style={scrSt.modalBody}>
              <Text style={scrSt.inputLabel}>தலைப்பு</Text>
              <TextInput
                style={scrSt.textInput}
                value={newTitle}
                onChangeText={setNewTitle}
                placeholder="டெஸ்ட் தலைப்பு உள்ளிடவும்"
                placeholderTextColor={PALETTE.grey500}
              />
              
              <Text style={scrSt.inputLabel}>விளக்கப்படு</Text>
              <TextInput
                style={[scrSt.textInput, scrSt.textArea]}
                value={newDescription}
                onChangeText={setNewDescription}
                placeholder="டெஸ்ட் விளக்கப்படு உள்ளிடவும்"
                placeholderTextColor={PALETTE.grey500}
                multiline
                numberOfLines={3}
              />
            </View>
            
            <View style={scrSt.modalFooter}>
              <TouchableOpacity 
                style={[scrSt.modalBtn, scrSt.cancelBtn]} 
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={scrSt.cancelBtnText}>ரத்து செய்</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[scrSt.modalBtn, scrSt.createModalBtn]} 
                onPress={handleCreateTest}
              >
                <Text style={scrSt.createModalBtnText}>உருவாக்கு</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
  resetBtn: { padding: s(4) },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: FONTS.muktaMalar.regular,
    fontSize: ms(14),
    color: PALETTE.grey600,
    marginTop: vs(8),
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: PALETTE.white,
    borderRadius: s(12),
    width: '90%',
    maxWidth: s(350),
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: s(16),
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.grey200,
  },
  modalTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(16),
    color: PALETTE.grey800,
  },
  modalBody: {
    padding: s(16),
  },
  inputLabel: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(14),
    color: PALETTE.grey800,
    marginBottom: vs(6),
  },
  textInput: {
    backgroundColor: PALETTE.grey100,
    borderWidth: 1,
    borderColor: PALETTE.grey300,
    borderRadius: s(8),
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
    fontFamily: FONTS.muktaMalar.regular,
    fontSize: ms(14),
    color: PALETTE.grey800,
    marginBottom: vs(16),
  },
  textArea: {
    height: vs(80),
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: s(16),
    borderTopWidth: 1,
    borderTopColor: PALETTE.grey200,
    gap: s(8),
  },
  modalBtn: {
    flex: 1,
    paddingVertical: vs(12),
    borderRadius: s(8),
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: PALETTE.grey200,
  },
  createModalBtn: {
    backgroundColor: PALETTE.success,
  },
  cancelBtnText: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(14),
    color: PALETTE.grey600,
  },
  createModalBtnText: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(14),
    color: PALETTE.white,
  },
});
