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
import { SvgXml } from 'react-native-svg';

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
  white: '#FFFFFF',
};

const BASE_URL = 'https://www.dinamalar.com';

/** Always resolves to a full https URL */
const toFullUrl = (link) => {
  if (!link) return null;
  if (link.startsWith('http://') || link.startsWith('https://')) return link;
  return `${BASE_URL}${link.startsWith('/') ? '' : '/'}${link}`;
};

function FooterMenu() {
  const navigation = useNavigation();
  const [footerData, setFooterData] = useState([]);
  const [ourApps, setOurApps] = useState([]);
  const [followUs, setFollowUs] = useState([]);
  const [footerText, setFooterText] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(null);
  const bigApps = ourApps.slice(0, 2);
  const smallApps = ourApps.slice(2);
  useEffect(() => {
    (async () => {
      try {
        const res = await mainApi.get(API_ENDPOINTS.MENU);
        const d = res.data;
        console.log('FooterMenu: Full menu data:', JSON.stringify(d, null, 2)); // Debug log full menu
        if (d?.footermenu?.footerdata) {
          setFooterData(d.footermenu.footerdata);
          console.log('FooterMenu: Footer data:', d.footermenu.footerdata); // Debug log footer data
        }
        if (d?.footermenu?.footerourapps) {
          const apps = d.footermenu.footerourapps;
          // Add Dinamalar Calendar app manually if not in API response
          if (apps.length === 0) {
            apps.push({
              Title: 'Dinamalar Calendar',
              Link: 'https://play.google.com/store/apps/details?id=com.daily.dinamalar',
              icon: 'https://play.google.com/store/images/dinamalar-calendar-icon.png'
            });
          }
          setOurApps(apps);
        }
        if (d?.follow) setFollowUs(d.follow);
        if (d?.footermenu?.footertext) setFooterText(d.footermenu.footertext);

      } catch (e) {
        console.error('FooterMenu fetch error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Main footer menu links (can navigate inside app or open browser) ────────
  const handleLinkPress = (item, index) => {
    setActiveIdx(index);
    const url = toFullUrl(item.Link || item.slug);
    if (!url) return;
    
    console.log('FooterMenu: Pressed item:', JSON.stringify(item.Title)); // Debug log with JSON.stringify
    console.log('FooterMenu: Title length:', item.Title?.length); // Debug log
    console.log('FooterMenu: Title char codes:', item.Title?.split('').map(c => c.charCodeAt(0))); // Debug log
    
    // Special handling for Varthagam - navigate to Varthagam screen
    if (item.Title === 'வர்த்தகம்' || item.Title === 'வர்தகம்' || item.Title === 'Varthagam') {
      console.log('FooterMenu: Navigating to VarthagamScreen'); // Debug log
      navigation.navigate('VarthagamScreen');
      return;
    }
    
    // Special handling for Sports - navigate to Sports screen
    if (item.Title === 'விளையாட்டு' || item.Title === 'Sports') {
      console.log('FooterMenu: Navigating to SportsScreen'); // Debug log
      navigation.navigate('SportsScreen');
      return;
    }
    
    // Special handling for Ulagha Tamil - navigate to CommonSectionScreen
    if (item.Title === 'உலக தமிழர்' || item.Title === 'Ulagha Tamil' || item.Title === 'ulaga thamilar') {
      console.log('FooterMenu: Navigating to CommonSectionScreen - Ulagha Tamil'); // Debug log
      navigation.navigate('CommonSectionScreen', { 
        screenTitle: 'உலக தமிழர்',
        apiEndpoint: 'https://api-st-cdn.dinamalar.com/nrimain',
        allTabLink: 'https://api-st-cdn.dinamalar.com/nrimain'
      });
      return;
    }
    
    // Try more flexible matching for Varthagam
    if (item.Title?.includes('வர்த') || item.Title?.includes('Varthag') || item.Title?.includes('varthag')) {
      console.log('FooterMenu: Flexible match for Varthagam - Navigating to VarthagamScreen'); // Debug log
      navigation.navigate('VarthagamScreen');
      return;
    }
    
    console.log('FooterMenu: Opening URL in browser:', url); // Debug log
    Linking.openURL(url);
  };


  // ── Footer text links → ALWAYS open in the device browser ─────────────────
  // These are static pages (Contact Us, Terms, Privacy, Copyright etc.)
  // We never navigate to an in-app screen for these.
  const handleFooterTextPress = (item) => {
    const url = toFullUrl(item.Link || item.slug);
    if (!url) return;
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={st.loader}>
        <ActivityIndicator size="small" color={P.primary} />
      </View>
    );
  }

  const half = Math.ceil(footerData.length / 2);
  const leftCol = footerData.slice(0, half);
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

          <View style={st.colSep} />

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

          {/* 🔹 Small icons (TOP) */}
          <View style={st.smallAppsRow}>
            {smallApps.map((app, i) => (
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

          {/* 🔹 Big icons (BOTTOM) */}
          <View style={st.bigAppsRow}>
            {bigApps.map((app, i) => (
              <TouchableOpacity
                key={i}
                style={st.bigAppItem}
                onPress={() => app.Link && Linking.openURL(app.Link)}
                activeOpacity={0.7}
              >
                <Image source={{ uri: app.icon }} style={st.bigAppIcon} resizeMode="contain" />
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
                {item.Icon?.includes('<svg') ? (
                  <SvgXml xml={item.Icon} width={22} height={22} />
                ) : (
                  <Image
                    source={{ uri: item.Icon }}
                    style={st.followIcon}
                    resizeMode="contain"
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={st.divider} />

      {/* ── Footer Text Links — open in browser, never in-app ────────────── */}
      {footerText.length > 0 && (
        <View style={st.footerTextWrap}>
          {footerText.slice(0, 3).map((item, i) => (<View key={i} style={st.footerTextItem}>
            <TouchableOpacity
              onPress={() => handleFooterTextPress(item)}
              activeOpacity={0.7}
            >
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
      {/* <View style={st.copyright}>
        <Text style={st.copyrightText}>
          © {new Date().getFullYear()} Dinamalar. All Rights Reserved.
        </Text>
      </View> */}

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
  smallAppsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: s(10),
    marginBottom: vs(14),
  },

  bigAppsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: s(16),
  },

  bigAppItem: {
    width: s(60),
    height: s(60),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: P.grey300,
    backgroundColor: P.grey100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bigAppIcon: {
    width: s(60),
    height: s(60),
  },

  container: {
    backgroundColor: P.white,
    paddingBottom: vs(10),
  },

  accentBar: {
    height: vs(4),
    backgroundColor: P.primary,
  },

  logoWrap: {
    alignItems: 'center',
    paddingVertical: vs(18),
  },
  logo: {
    width: s(150),
    height: vs(38),
  },

  divider: {
    height: 1,
    backgroundColor: P.grey200,
    marginHorizontal: s(16),
    marginVertical: vs(4),
  },

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
    color: P.grey700,
    lineHeight: ms(20),
  },
  menuTextActive: {
    fontFamily: FONTS.muktaMalar.bold,
    color: P.primary,
  },

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
    color: P.grey800,
    marginBottom: vs(12),
    letterSpacing: 0.5,
  },

  appsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(10),
  },
  appItem: {
    width: s(36),
    height: s(36),
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: P.grey300,
    backgroundColor: P.grey100,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  appIcon: {
    width: s(40),
    height: s(40),
  },

  followRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: s(10),
  },
  followItem: {
    width: s(40),
    height: s(40),
    borderRadius: s(20),
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
    color: P.grey600,
  },
  footerTextSep: {
    fontFamily: FONTS.muktaMalar.regular,
    fontSize: ms(11),
    color: P.grey400,
    marginHorizontal: s(6),
  },

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
    color: P.grey500,
    textAlign: 'center',
  },
});