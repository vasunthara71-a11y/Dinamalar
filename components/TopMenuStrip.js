import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SvgUri, SvgXml } from 'react-native-svg';
import { COLORS } from '../utils/constants';
import { scaledSizes } from '../utils/scaling';
import { useFontSize } from '../context/FontSizeContext';
import { ms } from 'react-native-size-matters';
import axios from 'axios';

const MENU_API_URL = 'https://api-st-cdn.dinamalar.com/menuindex1';

// ─── Module-level cache — persists across screen mounts/remounts ──────────────
let _cachedMenuItems = null;
let _isFetching      = false;
const _listeners     = [];

function subscribeToCacheUpdate(cb) {
  _listeners.push(cb);
  return () => {
    const idx = _listeners.indexOf(cb);
    if (idx > -1) _listeners.splice(idx, 1);
  };
}

async function fetchMenuOnce() {
  if (_cachedMenuItems !== null) return _cachedMenuItems;
  if (_isFetching) {
    return new Promise((resolve) => {
      const unsub = subscribeToCacheUpdate((items) => { unsub(); resolve(items); });
    });
  }
  _isFetching = true;
  try {
    const res  = await axios.get(MENU_API_URL);
    // API: { headermenu: [ { Title, Link, Icon, ... } ] }
    const data = res?.data?.headermenu || [];
    _cachedMenuItems = data;
    _listeners.forEach(cb => cb(data));
    return data;
  } catch (err) {
    console.error('TopMenuStrip: Failed to load menu:', err);
    _cachedMenuItems = [];
    _listeners.forEach(cb => cb([]));
    return [];
  } finally {
    _isFetching = false;
  }
}

// ─── Menu Icon ────────────────────────────────────────────────────────────────
function MenuIcon({ uri }) {
  if (!uri) {
    return <Ionicons name="radio-outline" size={scaledSizes.icon.md} color={COLORS.primary} />;
  }
  if (uri.includes('<svg') && uri.includes('</svg>')) {
    return <SvgXml xml={uri} width={scaledSizes.icon.md} height={scaledSizes.icon.md} />;
  }
  if (uri.endsWith('.svg') || uri.includes('.svg?')) {
    return <SvgUri uri={uri} width={scaledSizes.icon.md} height={scaledSizes.icon.md} />;
  }
  if (uri.startsWith('http')) {
    return (
      <Image
        source={{ uri }}
        style={{ width: scaledSizes.icon.md, height: scaledSizes.icon.md }}
        resizeMode="contain"
        fadeDuration={0}
      />
    );
  }
  return <Ionicons name="radio-outline" size={scaledSizes.icon.md} color={COLORS.text} />;
}

// ─── Top Menu Strip ───────────────────────────────────────────────────────────
export default function TopMenuStrip({ onMenuPress, onNotification, notifCount = 0, navigation }) {
  const { sf } = useFontSize();

  const [menuItems,  setMenuItems]  = useState(_cachedMenuItems || []);
  const [loading,    setLoading]    = useState(_cachedMenuItems === null);
  const [activeMenu, setActiveMenu] = useState(null);

  useEffect(() => {
    if (_cachedMenuItems !== null) {
      setMenuItems(_cachedMenuItems);
      setLoading(false);
      return;
    }
    const unsub = subscribeToCacheUpdate((items) => {
      setMenuItems(items);
      setLoading(false);
    });
    fetchMenuOnce().then((items) => {
      setMenuItems(items);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handlePress = (item) => {
    const title = item.Title || item.title || '';
    const link  = item.Link  || item.link  || '';
    const lower = link.toLowerCase();

    setActiveMenu(title);

    // ── Only dinamalartv / videos navigates in-app ────────────────────────
    const isDinamalartv =
      lower.includes('dinamalartv') ||
      lower.includes('videodata')   ||
      lower.includes('/videos');

    if (isDinamalartv) {
      if (onMenuPress) {
        // HomeScreen handles its own navigation via onMenuPress
        onMenuPress(item);
      } else if (navigation) {
        navigation.navigate('VideoScreen', { catName: title });
      }
      return;
    }

    // ── Everything else → open in device browser (Chrome on Android) ──────
    let url = link;

    // Relative path → prepend base domain
    if (url && !url.startsWith('http')) {
      url = `https://www.dinamalar.com${url.startsWith('/') ? '' : '/'}${url}`;
    }

    if (url) {
      Linking.openURL(url).catch(err =>
        console.warn('TopMenuStrip: Could not open URL:', url, err)
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonRow}>
          {[1, 2, 3, 4, 5].map(i => (
            <View key={i} style={styles.skeletonChip} />
          ))}
        </View>
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
          const title   = item.Title || item.title || '';
          const iconUri = item.Icon  || item.icon  || '';
          const isActive = activeMenu === title;

          return (
            <TouchableOpacity
              key={`menu_${index}`}
              style={[styles.menuItem, isActive && styles.menuItemActive]}
              onPress={() => handlePress(item)}
              activeOpacity={0.7}
            >
              <MenuIcon uri={iconUri} />
              <Text style={[
                styles.menuLabel,
                { fontSize: ms(10) },
                isActive && styles.menuLabelActive,
              ]}>
                {title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.notifButton} onPress={onNotification} activeOpacity={0.7}>
        <Ionicons name="notifications-outline" size={scaledSizes.icon.lg} color={COLORS.text} />
        {notifCount > 0 && (
          <View style={styles.notifBadge}>
            <Text style={styles.notifBadgeText}>{notifCount > 99 ? '99+' : notifCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
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
    borderColor: 'transparent',
  },
  menuItemActive: {
    borderColor: COLORS.primary + '40',
    backgroundColor: COLORS.primary + '10',
  },
  menuLabel: {
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
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  skeletonChip: {
    width: 80,
    height: 30,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
});