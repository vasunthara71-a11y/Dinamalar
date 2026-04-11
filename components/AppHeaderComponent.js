import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../utils/constants';
import { s, vs } from '../utils/scaling';
import { ms } from 'react-native-size-matters';
import { useFontSize } from '../context/FontSizeContext';
import { useNavigation } from '@react-navigation/native';

// ─── Palette ──────────────────────────────────────────────────────────────────
const PRIMARY = '#096dd2';
const TEXT = '#212B36';

// ─── App Header Component ─────────────────────────────────────────────────────
// Matches screenshot exactly:
//   Left  → hamburger (dark) + logo
//   Right → search (filled, dark) + location pin (filled, blue) + text (blue) + chevron (blue)
//   Location has NO border box — just inline icon+text+chevron
export default function AppHeaderComponent({
  onSearch,
  onMenu,
  onLocation,
  selectedDistrict = 'உள்ளூர்',
}) {
  const { sf } = useFontSize();
  const navigation = useNavigation();
  return (
    <View style={styles.appHeader}>

      {/* ── Left: Menu icon only ─────────────────────────────────────── */}
      <TouchableOpacity style={styles.menuIcon} onPress={onMenu} activeOpacity={0.7}>
        <Ionicons name="menu" size={s(24)} color={TEXT} />
      </TouchableOpacity>

      {/* ── Center: Logo ─────────────────────────────────────── */}
      <TouchableOpacity style={styles.logoContainer} onPress={()=>navigation.navigate("MainTabs", { screen: 'Home' })}>
        <Image
          source={{ uri: 'https://stat.dinamalar.com/new/2025/images/dinamalar-pavala-vizha-logo-day.png' }}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* ── Right: search + location ──────────────────────────────────── */}
      <View style={styles.appHeaderRight}>

        {/* Search — filled icon, dark gray, NO border */}
        <TouchableOpacity style={styles.iconBtn} onPress={onSearch} activeOpacity={0.7}>
          <Ionicons name="search" size={s(18)} color={PRIMARY} />
        </TouchableOpacity>

        {/* Location — filled pin + text + chevron, all blue, NO border box */}
        <TouchableOpacity style={styles.locationBtn} onPress={onLocation} activeOpacity={0.7}>
          <Ionicons name="location" size={s(15)} color={PRIMARY} />
          <Text style={styles.locationText}>{selectedDistrict}</Text>
          {/* <Ionicons name="chevron-down" size={s(13)} color={PRIMARY} /> */}
        </TouchableOpacity>

      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',   // push left group and right group apart
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? vs(10) : vs(52),
    paddingBottom: vs(10),
    paddingHorizontal: s(12),
    // borderBottomWidth: 1,
    // borderBottomColor: '#F4F6F8',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },

  // Menu icon - positioned at absolute left
  menuIcon: {
    padding: s(0),
  },

  // Logo container - centered
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },

  // Logo
  logoImage: {
    width: s(130),
    height: vs(30),
  },

  // Right group: search + location
  appHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(14),
  },

  // Plain icon touch target — no border, no background
  iconBtn: {
    padding: s(2),
  },

  // Location row — NO border box, just row of: pin icon + text + chevron
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(3),
  },

  // Location text — blue, MuktaMalar-Bold
  locationText: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(14),
    color: PRIMARY,
  },
});