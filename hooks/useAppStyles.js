// src/hooks/useAppStyles.js
//
// This is the ONLY hook you need in every component.
// It returns text styles that automatically update when user changes font size.
//
// Usage in any component:
//   const { styles: appSt } = useAppStyles();
//   <Text style={appSt.title}>...</Text>
//   <Text style={appSt.body}>...</Text>

import { useMemo } from 'react';
import { useFontSize } from '../context/FontSizeContext';

const useAppStyles = () => {
  const { sf, fontSizeScale, themeColor } = useFontSize();

  // useMemo with [fontSizeScale] means this re-runs ONLY when font size changes
  // That triggers a re-render in every component using this hook
  const styles = useMemo(() => ({

    // ── Headlines & Titles ───────────────────────────────────────────────────
    heading: {
      fontSize:   sf(20),
      fontWeight: '800',
      color:      '#111',
      lineHeight: sf(28),
    },
    title: {
      fontSize:   sf(15),
      fontWeight: '700',
      color:      '#212B36',
      lineHeight: sf(22),
    },
    subtitle: {
      fontSize:   sf(13.5),
      fontWeight: '600',
      color:      '#212B36',
      lineHeight: sf(20),
    },

    // ── Body Text ────────────────────────────────────────────────────────────
    body: {
      fontSize:   sf(13),
      fontWeight: '400',
      color:      '#444',
      lineHeight: sf(19),
    },
    bodySmall: {
      fontSize:   sf(12),
      fontWeight: '400',
      color:      '#555',
      lineHeight: sf(17),
    },

    // ── Meta / Timestamps ────────────────────────────────────────────────────
    time: {
      fontSize:   sf(11),
      fontWeight: '400',
      color:      '#637381',
    },
    caption: {
      fontSize:   sf(10),
      fontWeight: '400',
      color:      '#919EAB',
    },

    // ── Category / Badge ─────────────────────────────────────────────────────
    badge: {
      fontSize:   sf(11),
      fontWeight: '500',
      color:      '#454F5B',
    },

    // ── Navigation / Tabs ────────────────────────────────────────────────────
    menuLabel: {
      fontSize:   sf(12),
      fontWeight: '400',
      color:      '#637381',
    },
    menuLabelActive: {
      fontSize:   sf(12),
      fontWeight: '700',
      color:      themeColor,
    },
    tabText: {
      fontSize:   sf(13),
      fontWeight: '400',
      color:      '#555',
    },
    tabTextActive: {
      fontSize:   sf(13),
      fontWeight: '700',
      color:      themeColor,
    },
    drawerItem: {
      fontSize:   sf(14),
      fontWeight: '500',
      color:      '#222',
    },

    // ── Buttons ──────────────────────────────────────────────────────────────
    btnText: {
      fontSize:   sf(14),
      fontWeight: '700',
      color:      '#fff',
    },
    btnTextOutline: {
      fontSize:   sf(13.5),
      fontWeight: '600',
      color:      themeColor,
    },

    // ── Section Header ───────────────────────────────────────────────────────
    sectionTitle: {
      fontSize:   sf(18),
      fontWeight: '800',
      color:      '#212B36',
    },

    // ── Comments ─────────────────────────────────────────────────────────────
    commentAuthor: {
      fontSize:   sf(13),
      fontWeight: '700',
      color:      '#222',
    },
    commentBody: {
      fontSize:   sf(12.5),
      fontWeight: '400',
      color:      '#444',
      lineHeight: sf(18),
    },
    commentTime: {
      fontSize:   sf(11),
      fontWeight: '400',
      color:      '#999',
    },

    // ── Notification ─────────────────────────────────────────────────────────
    notifTitle: {
      fontSize:   sf(13.5),
      fontWeight: '700',
      color:      '#111',
    },
    notifBody: {
      fontSize:   sf(12.5),
      fontWeight: '400',
      color:      '#555',
      lineHeight: sf(18),
    },
    notifBadge: {
      fontSize:   sf(9),
      fontWeight: '700',
      color:      '#fff',
    },

    // ── Search ───────────────────────────────────────────────────────────────
    searchInput: {
      fontSize:   sf(14),
      color:      '#111',
    },
    searchBtn: {
      fontSize:   sf(15),
      fontWeight: '700',
      color:      '#fff',
    },
    searchResultTitle: {
      fontSize:   sf(14.5),
      fontWeight: '700',
      color:      '#111',
      lineHeight: sf(21),
    },
    searchResultBody: {
      fontSize:   sf(12.5),
      color:      '#555',
      lineHeight: sf(18),
    },
    searchResultTime: {
      fontSize:   sf(11.5),
      color:      '#888',
    },

    // ── News Card ─────────────────────────────────────────────────────────────
    cardTitle: {
      fontSize:   sf(15),
      fontWeight: '700',
      color:      '#212B36',
      lineHeight: sf(22),
    },
    cardCategory: {
      fontSize:   sf(11),
      color:      '#454F5B',
    },
    cardTime: {
      fontSize:   sf(11),
      color:      '#637381',
    },
    cardComment: {
      fontSize:   sf(11),
      color:      '#637381',
    },

    // ── Shorts / District ────────────────────────────────────────────────────
    shortsTitle: {
      fontSize:   sf(12),
      fontWeight: '700',
      color:      '#fff',
      lineHeight: sf(16),
    },
    districtName: {
      fontSize:   sf(12),
      fontWeight: '700',
      color:      '#212B36',
      lineHeight: sf(15),
    },
    newsItemTitle: {
      fontSize:   sf(11),
      color:      '#212B36',
      lineHeight: sf(15),
    },
    newsItemTime: {
      fontSize:   sf(10),
      color:      '#919EAB',
    },

    // ── Font Control Widget ───────────────────────────────────────────────────
    fontControlLabel: {
      fontSize:   sf(12),
      color:      '#555',
    },
    fontControlCurrent: {
      fontSize:   sf(12),
      color:      '#096dd2',
      fontWeight: '700',
    },
    fontBtnDecrease: {
      fontSize:   sf(14),
      fontWeight: '600',
      color:      '#333',
      lineHeight: sf(17),
    },
    fontBtnIncrease: {
      fontSize:   sf(14),
      fontWeight: '700',
      color:      '#333',
      lineHeight: sf(19),
    },

    // ── Location ─────────────────────────────────────────────────────────────
    locationText: {
      fontSize:   sf(13),
      fontWeight: '700',
      color:      themeColor,
    },

    // ── Ad Banner ────────────────────────────────────────────────────────────
    adLabel: {
      fontSize:   sf(14),
      color:      '#C4CDD5',
      letterSpacing: 0.5,
    },

  }), [fontSizeScale, themeColor]); // re-computes when either changes

  return { styles };
};

export default useAppStyles;