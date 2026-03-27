import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../utils/constants';
import { scaledSizes } from '../utils/scaling';
import { s } from 'react-native-size-matters';

// ─── AppHeader Component ───────────────────────────────────────────────────────
export default function AppHeader({ 
  onSearch, 
  onMenu, 
  onLocation, 
  selectedDistrict = 'உள்ளூர்',
  showLocation = true,
  backgroundColor = '#fff'
}) {
  return (
    <View style={[styles.appHeader, { backgroundColor }]}>
      <View style={styles.appHeaderLeft}>
        <TouchableOpacity style={styles.headerIcon} onPress={onMenu}>
          <Ionicons
            name="menu-outline"
            size={scaledSizes.icon.xl}
            color={COLORS.text}
          />
        </TouchableOpacity>
        <Image
          source={{
            uri: 'https://stat.dinamalar.com/new/2025/images/dinamalar-pavala-vizha-logo-day.png',
          }}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
      
      <View style={styles.appHeaderRight}>
        <TouchableOpacity style={styles.headerIcon} onPress={onSearch}>
          <Ionicons
            name="search-outline"
            size={scaledSizes.icon.md}
            color={COLORS.text}
          />
        </TouchableOpacity>

        {/* Location button → opens right drawer */}
        {showLocation && (
          <TouchableOpacity
            style={styles.locationContainer}
            onPress={onLocation}
            activeOpacity={0.7}
          >
            <Ionicons
              name="location-outline"
              size={scaledSizes.icon.sm}
              color={COLORS.primary}
            />
            <Text
              style={[
                styles.locationText,
                { color: COLORS.primary, fontWeight: '700' },
              ]}
            >
              {selectedDistrict}
            </Text>
            <Ionicons
              name="chevron-down"
              size={12}
              color={COLORS.primary}
              style={{ marginLeft: 2 }}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  appHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    padding: 8,
    borderRadius: 8,
  },
  logoImage: {
    width: 140,
    height: 35,
    marginLeft: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(198, 40, 40, 0.05)',
  },
  locationText: {
     marginLeft: s(4),
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: scaledSizes.font.xs,
  },
});
