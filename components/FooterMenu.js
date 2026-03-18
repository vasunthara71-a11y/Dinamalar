import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FONTS } from '../utils/constants';
import { s, vs } from '../utils/scaling';
import { ms } from 'react-native-size-matters';
import { mainApi, API_ENDPOINTS } from '../config/api';

// ─── Palette ──────────────────────────────────────────────────────────────────
const P = {
  primary: '#096dd2',
  grey100: '#F9FAFB',
  grey200: '#F4F6F8',
  grey300: '#DFE3E8',
  grey400: '#C4CDD5',
  grey500: '#919EAB',
  grey600: '#637381',
  grey700: '#454F5B',
  grey800: '#212B36',
  white:   '#FFFFFF',
};

function FooterMenu() {
  const navigation   = useNavigation();
  const [footerData, setFooterData] = useState([]);
  const [ourApps,    setOurApps]    = useState([]);
  const [followUs,   setFollowUs]   = useState([]);
  const [footerText, setFooterText] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [activeIdx,  setActiveIdx]  = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await mainApi.get(API_ENDPOINTS.MENU);
        const d   = res.data;
        if (d?.footermenu?.footerdata)    setFooterData(d.footermenu.footerdata);
        if (d?.footermenu?.footerourapps) setOurApps(d.footermenu.footerourapps);
        if (d?.follow)                    setFollowUs(d.follow);
        if (d?.footermenu?.footertext)    setFooterText(d.footermenu.footertext);
      } catch (e) {
        console.error('FooterMenu fetch error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleLinkPress = (item, index) => {
    setActiveIdx(index);
    if (!item.Link) return;
    if (item.Targetlink === '_blank' || item.Targetlink === 'targetblank' || item.Link.startsWith('http')) {
      Linking.openURL(item.Link);
    } else if (item.id) {
      navigation.navigate('CategoryNewsScreen', { catId: item.id, catName: item.Title });
    } else if (item.slug) {
      navigation.navigate('CategoryNewsScreen', { catId: item.slug.replace('/', ''), catName: item.Title });
    }
  };

  const handleFooterTextPress = (item) => {
    if (!item.Link) return;
    if (item.Targetlink === '_blank' || item.Targetlink === 'targetblank' || item.Link.startsWith('http')) {
      Linking.openURL(item.Link);
    } else if (item.id) {
      navigation.navigate('CategoryNewsScreen', { catId: item.id, catName: item.Title });
    } else if (item.slug) {
      navigation.navigate('CategoryNewsScreen', { catId: item.slug.replace('/', ''), catName: item.Title });
    }
  };

  if (loading) {
    return (
      <View style={st.loader}>
        <ActivityIndicator size="small" color={P.primary} />
      </View>
    );
  }

  const half     = Math.ceil(footerData.length / 2);
  const leftCol  = footerData.slice(0, half);
  const rightCol = footerData.slice(half);

  return (
    <View style={st.container}>

      {/* ── Primary blue top accent bar ──────────────────────────────────── */}
      <View style={st.accentBar} />

      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <View style={st.logoWrap}>
        <Image
          source={{ uri: 'https://stat.dinamalar.com/new/2025/images/dinamalar-pavala-vizha-logo-day.png' }}
          style={st.logo}
          resizeMode="contain"
        />
      </View>

      <View style={st.divider} />

      {/* ── Footer Menu — two columns ─────────────────────────────────────── */}
      {footerData.length > 0 && (
        <View style={st.menuRow}>
          {/* Left column */}
          <View style={st.col}>
            {leftCol.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={st.menuItem}
                onPress={() => handleLinkPress(item, i)}
                activeOpacity={0.7}
              >
                <Text style={[st.menuText, activeIdx === i && st.menuTextActive]}>
                  {item.Title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Column separator */}
          <View style={st.colSep} />

          {/* Right column */}
          <View style={st.col}>
            {rightCol.map((item, i) => {
              const realIdx = i + half;
              return (
                <TouchableOpacity
                  key={realIdx}
                  style={st.menuItem}
                  onPress={() => handleLinkPress(item, realIdx)}
                  activeOpacity={0.7}
                >
                  <Text style={[st.menuText, activeIdx === realIdx && st.menuTextActive]}>
                    {item.Title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <View style={st.divider} />

      {/* ── Our Apps Available On ─────────────────────────────────────────── */}
      {ourApps.length > 0 && (
        <View style={st.section}>
          <Text style={st.sectionTitle}>Our Apps Available On</Text>
          <View style={st.appsRow}>
            {ourApps.map((app, i) => (
              <TouchableOpacity
                key={i}
                style={st.appItem}
                onPress={() => app.Link && Linking.openURL(app.Link)}
                activeOpacity={0.7}
              >
                <Image source={{ uri: app.icon }} style={st.appIcon} resizeMode="contain" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={st.divider} />

      {/* ── Follow Us ────────────────────────────────────────────────────── */}
      {followUs.length > 0 && (
        <View style={[st.section, st.centerSection]}>
          <Text style={st.sectionTitle}>Follow Us</Text>
          <View style={st.followRow}>
            {followUs.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={st.followItem}
                onPress={() => item.Link && Linking.openURL(item.Link)}
                activeOpacity={0.7}
              >
                <Image source={{ uri: item.Icon }} style={st.followIcon} resizeMode="contain" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={st.divider} />

      {/* ── Footer Text Links ────────────────────────────────────────────── */}
      {footerText.length > 0 && (
        <View style={st.footerTextWrap}>
          {footerText.map((item, i) => (
            <View key={i} style={st.footerTextItem}>
              <TouchableOpacity onPress={() => handleFooterTextPress(item)} activeOpacity={0.7}>
                <Text style={st.footerTextLink}>{item.Title}</Text>
              </TouchableOpacity>
              {i < footerText.length - 1 && (
                <Text style={st.footerTextSep}>|</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* ── Copyright ────────────────────────────────────────────────────── */}
      <View style={st.copyright}>
        <Text style={st.copyrightText}>
          © {new Date().getFullYear()} Dinamalar. All Rights Reserved.
        </Text>
      </View>

    </View>
  );
}

export default FooterMenu;

// ─── Styles ───────────────────────────────────────────────────────────────────
const st = StyleSheet.create({

  loader: {
    paddingVertical: vs(30),
    alignItems: 'center',
    backgroundColor: P.white,
  },

  container: {
    backgroundColor: P.white,
    paddingBottom: vs(10),
  },

  // Blue top accent bar
  accentBar: {
    height: vs(4),
    backgroundColor: P.primary,
  },

  // Logo
  logoWrap: {
    alignItems: 'center',
    paddingVertical: vs(18),
  },
  logo: {
    width: s(150),
    height: vs(38),
  },

  // Thin gray divider
  divider: {
    height: 1,
    backgroundColor: P.grey200,
    marginHorizontal: s(16),
    marginVertical: vs(4),
  },

  // ── Menu columns ────────────────────────────────────────────────────────────
  menuRow: {
    flexDirection: 'row',
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
  },
  col: {
    flex: 1,
  },
  colSep: {
    width: 1,
    backgroundColor: P.grey200,
    marginHorizontal: s(10),
  },
  menuItem: {
    paddingVertical: vs(7),
  },
  menuText: {
    fontFamily: FONTS.muktaMalar.regular,
    fontSize: ms(13),
    color: P.grey700,             // #454F5B dark gray
    lineHeight: ms(20),
  },
  menuTextActive: {
    fontFamily: FONTS.muktaMalar.bold,
    color: P.primary,             // blue when active
  },

  // ── Generic section wrapper ──────────────────────────────────────────────────
  section: {
    paddingHorizontal: s(12),
    paddingVertical: vs(14),
  },
  centerSection: {
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(16),
    color: P.grey800,             // #212B36 near-black
    marginBottom: vs(12),
    // textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Our Apps ────────────────────────────────────────────────────────────────
  appsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(10),
  },
  appItem: {
    width: s(46),
    height: s(46),
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: P.grey300,       // #DFE3E8
    backgroundColor: P.grey100,   // #F9FAFB
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  appIcon: {
    width: s(40),
    height: s(40),
  },

  // ── Follow Us ───────────────────────────────────────────────────────────────
  followRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: s(10),
  },
  followItem: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),          // full circle
    borderWidth: 1,
    borderColor: P.grey300,
    backgroundColor: P.grey100,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  followIcon: {
    width: s(22),
    height: s(22),
  },

  // ── Footer Text Links ────────────────────────────────────────────────────────
  footerTextWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: s(12),
    paddingVertical: vs(12),
    gap: s(2),
  },
  footerTextItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerTextLink: {
    fontFamily: FONTS.muktaMalar.regular,
    fontSize: ms(11),
    color: P.grey600,             // #637381
  },
  footerTextSep: {
    fontFamily: FONTS.muktaMalar.regular,
    fontSize: ms(11),
    color: P.grey400,             // #C4CDD5
    marginHorizontal: s(6),
  },

  // ── Copyright ───────────────────────────────────────────────────────────────
  copyright: {
    alignItems: 'center',
    paddingVertical: vs(14),
    paddingHorizontal: s(12),
    backgroundColor: P.grey100,
    marginTop: vs(4),
  },
  copyrightText: {
    fontFamily: FONTS.muktaMalar.regular,
    fontSize: ms(11),
    color: P.grey500,             // #919EAB muted gray
    textAlign: 'center',
  },
});