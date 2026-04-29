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
import { COLORS, FONTS } from '../utils/constants';
import { scaledSizes, s, vs, ms } from '../utils/scaling';
import { useFontSize } from '../context/FontSizeContext';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';

const MENU_API_URL = 'https://api-st.dinamalar.com/menuindex1';

// ─── Module-level cache — persists across screen mounts/remounts ──────────────
let _cachedMenuItems = null;
let _isFetching = false;
const _listeners = [];

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
    const res = await axios.get(MENU_API_URL);
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
    return <Ionicons name="radio-outline" size={20} color={COLORS.primary} />;
  }
  if (uri.includes('<svg') && uri.includes('</svg>')) {
    return <SvgXml xml={uri} width={20} height={20} />;
  }
  if (uri.endsWith('.svg') || uri.includes('.svg?')) {
    return <SvgUri uri={uri} width={20} height={20} />;
  }
  if (uri.startsWith('http')) {
    return (
      <Image
        source={{ uri }}
        style={{ width: 20, height: 20 }}
        resizeMode="contain"
        fadeDuration={0}
      />
    );
  }
  return <Ionicons name="radio-outline" size={20} color={COLORS.text} />;
}

// ─── Top Menu Strip ───────────────────────────────────────────────────────────
export default function TopMenuStrip({ onMenuPress, onNotification, notifCount = 0, navigation, hideNotification = false }) {
  const { sf } = useFontSize();

  console.log('🔔 TopMenuStrip RENDERING - notifCount prop:', notifCount);
  console.log('🔔 TopMenuStrip menuItems length:', menuItems?.length);
  console.log('🔔 TopMenuStrip loading state:', loading);

  const [menuItems, setMenuItems] = useState(_cachedMenuItems || []);
  const [loading, setLoading] = useState(_cachedMenuItems === null);
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
    const link = item.Link || item.link || '';
    const lower = link.toLowerCase();

    setActiveMenu(title);

    // ── Only dinamalartv / videos navigates in-app ────────────────────────
    const isDinamalartv =
      lower.includes('dinamalartv') ||
      lower.includes('videodata') ||
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

    // ── podcast navigates to PodcastPlayer ───────────────────────
    const isPodcast =
      lower.includes('podcast') ||
      lower.includes('audio') ||
      lower.includes('/podcast');

    if (isPodcast) {
      if (onMenuPress) {
        // Let the screen handle podcast navigation via onMenuPress
        onMenuPress(item);
      } else if (navigation) {
        navigation.navigate('PodcastPlayer', { catName: title });
      }
      return;
    }

    // ── Everything else → open in WebView ─────────────────────────────────────
    let url = link;

    // Relative path → prepend base domain
    if (url && !url.startsWith('http')) {
      url = `https://www.dinamalar.com${url.startsWith('/') ? '' : '/'}${url}`;
    }

    if (url && navigation) {
      navigation.navigate('CommodityWebViewScreen', { url });
    } else if (url) {
      // Fallback to external browser if navigation is not available
      Linking.openURL(url).catch(err =>
        console.warn('TopMenuStrip: Could not open URL:', url, err)
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={{ backgroundColor: 'yellow', height: 30, justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <Text style={{ color: 'black', fontSize: 12 }}>Loading menu...</Text>
        </View>
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
          const title = item.Title || item.title || '';
          const iconUri = item.Icon || item.icon || '';
          const isActive = activeMenu === title;

          return (
            <React.Fragment key={`menu_${index}`}>
              <TouchableOpacity
                style={[styles.menuItem, isActive && styles.menuItemActive]}
                onPress={() => handlePress(item)}
                activeOpacity={0.7}
              >
                <MenuIcon uri={iconUri} />
                <Text style={[
                  styles.menuLabel,
                  { fontSize: ms(14) },
                  isActive && styles.menuLabelActive,
                ]}>
                  {title}
                </Text>
              </TouchableOpacity>
              {index < menuItems.length - 1 && (
                <LinearGradient
                  colors={['transparent', COLORS.primary, 'transparent']}
                  style={styles.separator}
                />
              )}
            </React.Fragment>
          );
        })}
      </ScrollView>

      {!hideNotification && (
        <TouchableOpacity style={styles.notifButton} onPress={() => navigation.navigate('TimelineScreen')} activeOpacity={0.7}>
          <Ionicons name="notifications" size={s(18)} color={COLORS.primary} style={{right:ms(3)}} />
          {console.log('🔔 Badge condition check:', notifCount, notifCount > 0)}
          {notifCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{notifCount > 99 ? '99+' : notifCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: s(0),
    paddingVertical: vs(5),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  scrollContent: {
    alignItems: 'center',
    paddingRight: s(12),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(8),
    // paddingVertical: vs(6),
    borderRadius: s(20),
    marginHorizontal: s(5),
    borderColor: 'transparent',
  },
  menuItemActive: {
    // borderColor: COLORS.primary + '40',
    // backgroundColor: COLORS.primary + '10',
  },
  menuLabel: {
    color: COLORS.text,
    // fontWeight: '500',
    marginLeft: s(6),
    fontFamily:FONTS.muktaMalar.regular,
    fontSize: ms(14),
  },
  menuLabelActive: {
    // color: COLORS.primary,
    // fontWeight: '700',
  },
  notifButton: {
    padding: ms(5),
    borderRadius: s(8),
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: s(4),
    left:14,
    backgroundColor: '#e53935',
    borderRadius: s(7.5),
    minWidth: s(15),
    height: s(15),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s(4),
  },
  notifBadgeText: {
    color: '#fff',
    fontSize: ms(12),
    fontWeight: '700',
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: s(8),
  },
  skeletonChip: {
    width: s(80),
    height: s(30),
    borderRadius: s(20),
    backgroundColor: '#f0f0f0',
  },
 separator: {
  width: 1.5,
  height: vs(15),
  alignSelf: 'center',
  borderRadius: 1,
  opacity: 0.7,
},
});