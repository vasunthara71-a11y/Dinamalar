import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SvgUri, SvgXml } from 'react-native-svg';
import { mainApi, API_ENDPOINTS } from '../config/api';
import { COLORS } from '../utils/constants';
import { scaledSizes } from '../utils/scaling';
import { useFontSize } from '../context/FontSizeContext';

// ─── Menu Icon Component ───────────────────────────────────────────────────────
function MenuIcon({ uri }) {
  if (uri && uri.includes('<svg') && uri.includes('</svg>')) {
    return (
      <SvgXml
        xml={uri}
        width={scaledSizes.icon.md}
        height={scaledSizes.icon.md}
        style={{ tintColor: COLORS.text }}
      />
    );
  }

  if (uri && (uri.endsWith('.svg') || uri.includes('svg'))) {
    return (
      <SvgUri
        uri={uri}
        width={scaledSizes.icon.md}
        height={scaledSizes.icon.md}
        style={{ tintColor: COLORS.text }}
      />
    );
  }

  return (
    <Ionicons
      name="radio-outline"
      size={scaledSizes.icon.md}
      color={COLORS.text}
    />
  );
}

// ─── Top Menu Strip Component ───────────────────────────────────────────────────
export default function TopMenuStrip({ onMenuPress, onNotification, notifCount = 0 }) {
  const { sf } = useFontSize();
  const [menuItems, setMenuItems] = useState([]);
  const [activeMenu, setActiveMenu] = useState(null);
  const [loadingMenu, setLoadingMenu] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      console.log('TopMenuStrip: Fetching menu...');
      try {
        const res = await mainApi.get(API_ENDPOINTS.MENU);
        const menuData = res?.data?.headermenu || [];
        console.log('TopMenuStrip: Menu data received:', menuData.length, 'items');
        setMenuItems(menuData);
        
        // Don't set any active menu initially - let user click to highlight
        setActiveMenu(null);
        console.log('TopMenuStrip: No active menu set initially');
      } catch (err) {
        console.error('TopMenuStrip: Failed to load top menu:', err);
      } finally {
        setLoadingMenu(false);
      }
    };
    fetchMenu();
  }, []);

  // ─── Handle Menu Press ───────────────────────────────────────────────────────
  const handlePress = (item) => {
    console.log('TopMenuStrip: Menu item pressed:', item);
    console.log('TopMenuStrip: Item title:', item.Title);
    console.log('TopMenuStrip: Item link:', item.Link || item.link);
    setActiveMenu(item.Title || item.title);
    onMenuPress && onMenuPress(item);
  };

  if (loadingMenu) {
    return (
      <View style={styles.container}>
        <ActivityIndicator
          size="small"
          color={COLORS.primary}
          style={{ marginVertical: 10 }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ flex: 1 }}
      >
        {menuItems.map((item, index) => {
          const isActive = activeMenu === item.Title;
          return (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, isActive && styles.menuItemActive]}
              onPress={() => handlePress(item)}
              activeOpacity={0.7}
            >
              <MenuIcon uri={item.Icon} />
              <Text
                style={[
                  styles.menuLabel,
                  isActive && styles.menuLabelActive,
                ]}
              >
                {item.Title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        style={styles.notifButton}
        onPress={onNotification}
        activeOpacity={0.7}
      >
        <Ionicons
          name="notifications-outline"
          size={scaledSizes.icon.lg}
          color={COLORS.text}
        />
        {notifCount > 0 && (
          <View style={styles.notifBadge}>
            <Text style={styles.notifBadgeText}>
              {notifCount > 99 ? '99+' : notifCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  scrollContent: {
    alignItems: 'center',
    paddingRight: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginHorizontal: 4,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  menuItemActive: {
    // Remove background color, keep default
  },
  menuLabel: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
    marginLeft: 6,
  },
  menuLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  notifButton: {
    padding: 8,
    borderRadius: 8,
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#e53935',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});

