import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS } from '../utils/constants';
import { s, vs, scaledSizes } from '../utils/scaling';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── District Drawer Component ──────────────────────────────────────
function DistrictDrawer({ isVisible, onClose, districts }) {
  const navigation = useNavigation();
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  const handleDistrictPress = (district) => {
    setSelectedDistrict(district.title);
    onClose();

    // Navigate to DistrictNewsScreen with district pre-selected
    // Works with both districts.sub and districts.subcatlist formats
    navigation.navigate('DistrictNewsScreen', {
      districtId:    district.id    || null,
      districtTitle: district.title || '',
      districtLink:  district.link  || '',
    });
  };

  if (!isVisible) return null;

  // ── Support both possible data shapes from API ──────────────────────────
  // DrawerMenu passes `districts` which could be:
  //   { sub: [...] }         — from menu API district.sub
  //   { subcatlist: [...] }  — from district API
  //   an array directly
  const districtList =
    districts?.sub        ||
    districts?.subcatlist ||
    (Array.isArray(districts) ? districts : []);

  return (
    <View style={drawerStyles.overlay}>
      <TouchableOpacity style={drawerStyles.backdrop} onPress={onClose} activeOpacity={1} />
      <View style={drawerStyles.drawerContainer}>
        {/* Header */}
        <View style={drawerStyles.header}>
          <Text style={drawerStyles.headerTitle}>தமிழக மாவட்டம்</Text>
          <TouchableOpacity style={drawerStyles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={scaledSizes.icon.md} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {/* District List */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={drawerStyles.scrollContent}
        >
          {districtList.map((district, index) => {
            // Skip the "All" item (no id) in drawer
            if (!district.id) return null;
            const isSelected = selectedDistrict === district.title;
            return (
              <TouchableOpacity
                key={district.id || index}
                style={[
                  drawerStyles.districtItem,
                  isSelected && drawerStyles.districtItemActive,
                ]}
                onPress={() => handleDistrictPress(district)}
                activeOpacity={0.7}
              >
                <Text style={[
                  drawerStyles.districtText,
                  isSelected && drawerStyles.districtTextActive,
                ]}>
                  {district?.title ?? ''}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark" size={s(16)} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

export default DistrictDrawer;

// ─── Styles ───────────────────────────────────────────────────────
const drawerStyles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
  },
  backdrop: { flex: 1 },
  drawerContainer: {
    position: 'absolute',
    top: 0, right: 0,
    width: SCREEN_WIDTH * 0.75,
    height: '100%',
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: s(2) },
    shadowOpacity: 0.15,
    shadowRadius: s(8),
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: s(15),
    paddingVertical: vs(15),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: scaledSizes.font.lg,
    fontFamily: FONTS.bold,
    color: COLORS.text,
  },
  closeButton: { padding: s(5) },
  scrollContent: {
    paddingHorizontal: s(10),
    paddingVertical: vs(10),
  },
  districtItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vs(12),
    paddingHorizontal: s(15),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  districtItemActive: { backgroundColor: COLORS.primary + '20' },
  districtText: {
    fontSize: scaledSizes.font.md,
    fontFamily: FONTS.medium,
    color: COLORS.text,
  },
  districtTextActive: {
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
});