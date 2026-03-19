// ProfileScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useFontSize } from '../context/FontSizeContext';
import { useTheme } from '../context/ThemeContext';
import { COLORS, FONTS } from '../utils/constants';

// ─── Font Size Row ────────────────────────────────────────────────────────────
const SIZE_KEYS = ['small', 'normal', 'large', 'extraLarge'];

function FontSizeRow() {
  const { currentSize, changeFontSize, FONT_SCALES } = useFontSize();

  const currentIndex = SIZE_KEYS.indexOf(currentSize);
  const safeIndex = currentIndex === -1 ? 1 : currentIndex;

  const previewSize = Math.round(22 * (FONT_SCALES[currentSize] || 1.0));

  const handleDotPress = (idx) => {
    changeFontSize(SIZE_KEYS[idx]);
  };

  return (
    <View style={fsr.card}>
      {/* ── Top: small A — dot track — big A ── */}
      <View style={fsr.trackSection}>
        {/* Small A */}
        <Text style={fsr.smallA}>A</Text>

        {/* Dot + line track */}
        <View style={fsr.dotTrackWrap}>
          {/* Background line */}
          <View style={fsr.lineBackground} />

          {/* Active fill line */}
          <View
            style={[
              fsr.lineFill,
              { width: `${(safeIndex / (SIZE_KEYS.length - 1)) * 100}%` },
            ]}
          />

          {/* Dots */}
          <View style={fsr.dotsAbsolute}>
            {SIZE_KEYS.map((key, idx) => {
              const isActive  = idx <= safeIndex;
              const isCurrent = idx === safeIndex;

              return (
                <TouchableOpacity
                  key={key}
                  style={fsr.dotTouchable}
                  onPress={() => handleDotPress(idx)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      fsr.dot,
                      isActive && fsr.dotActive,
                      isCurrent && fsr.dotCurrent,
                    ]}
                  >
                    {isCurrent && <View style={fsr.dotInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Big A */}
        <Text style={fsr.bigA}>A</Text>
      </View>

      {/* ── Labels below dots ── */}
      <View style={fsr.labelsSection}>
        {/* offset for small A width */}
        <View style={{ width: 28 }} />
        <View style={fsr.labelsInner}>
          {SIZE_KEYS.map((key, idx) => {
            const isCurrent = idx === safeIndex;
            const labels = ['சிறு', 'சாதா', 'பெரிய', 'மிகப்\nபெரிய',  ];
            return (
              <TouchableOpacity
                key={key}
                style={fsr.labelSlot}
                onPress={() => handleDotPress(idx)}
                activeOpacity={0.7}
              >
                <Text style={[fsr.stepLabel, isCurrent && fsr.stepLabelActive]}>
                  {labels[idx]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {/* offset for big A width */}
        <View style={{ width: 32 }} />
      </View>

      {/* ── Divider ── */}
      <View style={fsr.divider} />

      {/* ── Bottom: AA + label + preview ── */}
      <View style={fsr.bottomRow}>
        <View style={fsr.aaCircle}>
          <Text style={fsr.aaCircleText}>AA</Text>
        </View>
        <Text style={fsr.aaLabel}>எழுத்துரு அளவு</Text>
        <View style={fsr.previewBadge}>
          <Text style={[fsr.preview, { fontSize: previewSize }]}>தமிழ்</Text>
        </View>
      </View>
    </View>
  );
}

const ACTIVE_COLOR  = '#1a1a1a';
const INACTIVE_COLOR = '#d0d0d0';
const ACCENT_COLOR  = '#d32f2f';

const fsr = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
  },

  // ── Track section ──
  trackSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  smallA: {
    fontSize: 13,
    fontWeight: '800',
    color: '#888',
    width: 18,
    textAlign: 'center',
    marginRight: 10,
  },
  bigA: {
    fontSize: 24,
    fontWeight: '800',
    color: ACTIVE_COLOR,
    width: 26,
    textAlign: 'center',
    marginLeft: 10,
  },

  // ── Dot track ──
  dotTrackWrap: {
    flex: 1,
    height: 28,
    justifyContent: 'center',
    position: 'relative',
  },
  lineBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: INACTIVE_COLOR,
    borderRadius: 2,
    top: '50%',
    marginTop: -1.5,
  },
  lineFill: {
    position: 'absolute',
    left: 0,
    height: 3,
    backgroundColor: ACTIVE_COLOR,
    borderRadius: 2,
    top: '50%',
    marginTop: -1.5,
  },
  dotsAbsolute: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotTouchable: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: INACTIVE_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotActive: {
    backgroundColor: ACTIVE_COLOR,
  },
  dotCurrent: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: ACTIVE_COLOR,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  dotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },

  // ── Labels ──
  labelsSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    marginTop: 2,
  },
  labelsInner: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labelSlot: {
    flex: 1,
    alignItems: 'center',
  },
  stepLabel: {
    fontSize: 9,
    color: '#bbb',
    textAlign: 'center',
    lineHeight: 12,
    fontWeight: '500',
  },
  stepLabelActive: {
    color: ACTIVE_COLOR,
    fontWeight: '800',
    fontSize: 10,
  },

  // ── Divider ──
  divider: {
    height: 1,
    backgroundColor: '#f2f2f2',
    marginBottom: 12,
  },

  // ── Bottom row ──
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aaCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aaCircleText: {
    fontSize: 11,
    fontWeight: '900',
    color: ACTIVE_COLOR,
    letterSpacing: -0.5,
  },
  aaLabel: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  previewBadge: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#ececec',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  preview: {
    fontWeight: '800',
    color: ACTIVE_COLOR,
  },
});

// ─── Notifications Row ────────────────────────────────────────────────────────
function NotificationsRow({ value, onChange }) {
  const { colors } = useTheme();
  return (
    <View style={nr.row}>
      <View style={nr.iconWrap}>
        <Text style={nr.bellIcon}>🔔</Text>
      </View>
      <Text style={[nr.label, { color: colors.text }]}>அறிவிப்புகள்</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#ddd', true: COLORS.primary }}
        thumbColor="#fff"
      />
    </View>
  );
}

const nr = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconWrap: {
    width: 32,
    alignItems: 'center',
    marginRight: 10,
  },
  bellIcon: {
    fontSize: 18,
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: '#111',
    fontWeight: '500',
  },
});

// ─── Main ProfileScreen ───────────────────────────────────────────────────────
const ProfileScreen = () => {
  const [notifications, setNotifications] = React.useState(true);
  const { isDarkMode, toggleTheme, colors } = useTheme();
  const { sf } = useFontSize();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={[styles.userName, { fontSize: sf(20) }]}>பயனர்</Text>
        <Text style={[styles.userEmail, { fontSize: sf(14) }]}>user@dinamalar.com</Text>
      </View>

      {/* ── Font Size + Notifications block (matches screenshot) ── */}
      <View style={[styles.settingsBlock, { backgroundColor: colors.cardBackground }]}>
        <FontSizeRow />
        <View style={[styles.blockDivider, { backgroundColor: colors.border }]} />
        <NotificationsRow value={notifications} onChange={setNotifications} />
      </View>

      {/* ── Saved News ── */}
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { fontSize: sf(16), color: colors.text }]}>சேமித்த செய்திகள்</Text>
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}>
          <Text style={[styles.menuText, { fontSize: sf(16), color: colors.text }]}>புக்மார்க் செய்தவை</Text>
          <Text style={[styles.arrow, { fontSize: sf(20), color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}>
          <Text style={[styles.menuText, { fontSize: sf(16), color: colors.text }]}>வாசித்த செய்திகள்</Text>
          <Text style={[styles.arrow, { fontSize: sf(20), color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* ── Settings ── */}
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.sectionTitle, { fontSize: sf(16), color: colors.text }]}>அமைப்புகள்</Text>
        <View style={[styles.menuItem, { borderBottomColor: colors.border }]}>
          <Text style={[styles.menuText, { fontSize: sf(16), color: colors.text }]}>இருண்ட பயன்முறை</Text>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: '#ddd', true: colors.primary }}
            thumbColor="#fff"
          />
        </View>
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}>
          <Text style={[styles.menuText, { fontSize: sf(16), color: colors.text }]}>மொழி</Text>
          <Text style={[styles.menuValue, { fontSize: sf(16), color: colors.textSecondary }]}>தமிழ்</Text>
        </TouchableOpacity>
      </View>

      {/* ── About ── */}
      <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}>
          <Text style={[styles.menuText, { fontSize: sf(16), color: colors.text }]}>எங்களைப் பற்றி</Text>
          <Text style={[styles.arrow, { fontSize: sf(20), color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}>
          <Text style={[styles.menuText, { fontSize: sf(16), color: colors.text }]}>தனியுரிமைக் கொள்கை</Text>
          <Text style={[styles.arrow, { fontSize: sf(20), color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]}>
          <Text style={[styles.menuText, { fontSize: sf(16), color: colors.text }]}>நிபந்தனைகள்</Text>
          <Text style={[styles.arrow, { fontSize: sf(20), color: colors.textSecondary }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* ── Logout ── */}
      <TouchableOpacity style={styles.logoutButton}>
        <Text style={[styles.logoutText, { fontSize: sf(16) }]}>வெளியேறு</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ── Header ──
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 30,
    alignItems: 'center',
  },
  userName: {
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  userEmail: {
    color: 'rgba(255,255,255,0.8)',
  },

  // ── Font + Notif block ──
  settingsBlock: {
    borderRadius: 12,
    marginHorizontal: 12,
    marginTop: 20,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  blockDivider: {
    height: 1,
    marginHorizontal: 16,
  },

  // ── Sections ──
  section: {
    marginTop: 20,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontWeight: 'bold',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  menuText: {
  },
  menuValue: {
  },
  arrow: {
  },

  // ── Logout ──
  logoutButton: {
    backgroundColor: COLORS.primary,
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontFamily:FONTS.muktaMalar.bold
  },
});

export default ProfileScreen;
