// ─────────────────────────────────────────────────────────────────────────────
// useDynamicStyles.js
//
// WHY THIS EXISTS:
//   StyleSheet.create() is computed once at module load time.
//   If you write:  title: { fontSize: scaleFont(16) }  inside StyleSheet.create()
//   that value is locked in forever — changing fontSizeScale does nothing.
//
// HOW TO USE:
//   Replace your StyleSheet.create() fontSize values with this hook.
//   The hook re-runs whenever fontSizeScale changes, so every component
//   that calls it automatically re-renders with the new size.
//
//   import useDynamicStyles from '../hooks/useDynamicStyles';
//
//   const MyComponent = () => {
//     const dynStyles = useDynamicStyles();
//     return <Text style={dynStyles.title}>செய்தி</Text>;
//   };
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import { useFontSize } from '../context/FontSizeContext';
import { ms } from 'react-native-size-matters';
import { s, vs } from '../utils/scaling';
import { FONTS, COLORS } from '../utils/constants';

const useDynamicStyles = () => {
  const { fontSizeScale } = useFontSize();
  // sf = scaled font — applies ms() for screen density, then user's scale
  const sf = (size) => Math.round(ms(size) * fontSizeScale);

  return useMemo(() => ({

    // ── News Card ────────────────────────────────────────────────────────────
    cardTitle: {
      fontFamily: FONTS.muktaMalar.bold,
      fontSize:   sf(15),
      color:      '#212B36',
      lineHeight: sf(22),
      marginBottom: vs(6),
    },
    cardCategory: {
      fontFamily: FONTS.muktaMalar.regular,
      fontSize:   sf(11),
      color:      '#454F5B',
    },
    cardTime: {
      fontFamily: FONTS.muktaMalar.regular,
      fontSize:   sf(11),
      color:      '#637381',
    },
    cardComment: {
      fontFamily: FONTS.muktaMalar.regular,
      fontSize:   sf(11),
      color:      '#637381',
    },

    // ── Section Header ───────────────────────────────────────────────────────
    sectionTitle: {
      fontFamily: FONTS.muktaMalar.bold,
      fontSize:   sf(18),
      color:      '#212B36',
      marginBottom: vs(2),
    },

    // ── Top Menu Strip ───────────────────────────────────────────────────────
    menuLabel: {
      fontFamily: FONTS.muktaMalar.regular,
      fontSize:   sf(12),
      color:      '#637381',
    },
    menuLabelActive: {
      fontFamily: FONTS.muktaMalar.bold,
      fontSize:   sf(12),
      color:      '#096dd2',
    },

    // ── App Header ────────────────────────────────────────────────────────────
    locationText: {
      fontSize:   sf(13),
      color:      '#096dd2',
      fontFamily: FONTS.muktaMalar.bold,
    },

    // ── Shorts Card ───────────────────────────────────────────────────────────
    shortsTitle: {
      fontFamily: FONTS.muktaMalar.bold,
      fontSize:   sf(12),
      color:      '#FFFFFF',
      lineHeight: sf(16),
    },
    shortsCardTitle: {
      fontFamily: FONTS.muktaMalar.regular,
      fontSize:   sf(12),
      color:      '#212B36',
      lineHeight: sf(16),
    },

    // ── District News ─────────────────────────────────────────────────────────
    districtName: {
      fontFamily: FONTS.muktaMalar.bold,
      fontSize:   sf(12),
      color:      '#212B36',
      lineHeight: sf(15),
    },
    newsItemTitle: {
      fontFamily: FONTS.muktaMalar.regular,
      fontSize:   sf(11),
      color:      '#212B36',
      lineHeight: sf(15),
      marginBottom: vs(3),
    },
    newsItemTime: {
      fontFamily: FONTS.muktaMalar.regular,
      fontSize:   sf(10),
      color:      '#919EAB',
    },

    // ── Notification badge ────────────────────────────────────────────────────
    notifBadgeText: {
      color:      '#fff',
      fontSize:   sf(9),
      fontFamily: FONTS.muktaMalar.bold,
    },

    // ── Ad banner ────────────────────────────────────────────────────────────
    adLabel: {
      fontSize:   sf(14),
      color:      '#C4CDD5',
      fontFamily: FONTS.muktaMalar.regular,
      letterSpacing: 0.5,
    },

    // ── FontSizeControl ───────────────────────────────────────────────────────
    fontControlLabel: {
      fontSize:   sf(12),
      color:      '#555',
      fontWeight: '400',
    },
    fontBtnSmall: {
      fontSize:   sf(13),
      fontWeight: '600',
      color:      '#333',
      lineHeight: sf(17),
    },
    fontBtnLarge: {
      fontSize:   sf(11),
      fontWeight: '700',
      color:      '#333',
      lineHeight: sf(14),
    },

    // ── Search Screen ─────────────────────────────────────────────────────────
    searchInput: {
      fontSize: sf(14),
      color:    '#111',
    },
    searchBtnText: {
      fontSize:   sf(15),
      fontWeight: '700',
      color:      '#fff',
    },
    resultTitle: {
      fontSize:   sf(14.5),
      fontWeight: '700',
      color:      '#111',
      lineHeight: sf(21),
    },
    resultBody: {
      fontSize:   sf(12.5),
      color:      '#555',
      lineHeight: sf(18),
    },
    resultTime: {
      fontSize: sf(11.5),
      color:    '#888',
    },
    badgeText: {
      fontSize:   sf(11.5),
      fontWeight: '500',
      color:      '#444',
    },
    catTabText: {
      fontSize:   sf(13),
      color:      '#555',
      fontWeight: '400',
    },
    catTabTextActive: {
      fontSize:   sf(13),
      color:      '#1565C0',
      fontWeight: '700',
    },
    categoryLabelText: {
      fontSize:   sf(12),
      fontWeight: '700',
      color:      '#333',
    },

    // ── Comments ──────────────────────────────────────────────────────────────
    commentAuthor: {
      fontSize:   sf(13),
      fontWeight: '700',
      color:      '#222',
    },
    commentBody: {
      fontSize:   sf(12.5),
      color:      '#444',
      lineHeight: sf(18),
    },
    commentTime: {
      fontSize: sf(11),
      color:    '#999',
    },

  }), [fontSizeScale]); // ← re-computes whenever fontSizeScale changes
};

export default useDynamicStyles;