 const PALETTE = {
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
  black:'#0000',
  catText:'#454F5B'
};

import palette from "../theme/palette";
import { s, vs, ms } from './scaling';

export const API_BASE_URL = 'https://api-st-cdn.dinamalar.com';

// ─── Font Configuration ───────────────────────────────────────────────────────────────
// export const FONTS = {
//   muktaMalar: {
//     family: 'MuktaMalar',
//     regular: 'MuktaMalar',
//     medium: 'MuktaMalar-Medium',
//     semibold: 'MuktaMalar-SemiBold',
//     bold: 'MuktaMalar-Bold',
//   },
// };

// // ─── Font Styles for Tamil Text ───────────────────────────────────────────────────────
// export const FONT_STYLES = {
//   // Tamil API data styles
//   tamil: {
//     fontFamily: 'MuktaMalar',
//     fontSize: 14,
//     color: COLORS.text,
//     lineHeight: 22,
//   },
  
//   // Mixed content (Tamil + English)
//   mixed: {
//     fontFamily: 'MuktaMalar',
//     fontSize: 14,
//     color: COLORS.text,
//     lineHeight: 22,
//   },
  
//   // Headers with Tamil
//   tamilHeader: {
//     fontFamily: 'MuktaMalar',
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: COLORS.text,
//     lineHeight: 26,
//   },
  
//   // Small Tamil text
//   tamilSmall: {
//     fontFamily: 'MuktaMalar',
//     fontSize: 12,
//     color: COLORS.subtext,
//     lineHeight: 18,
//   },
// };

 
export const COLORS = {
  primary: palette.light.main,
  primaryDark: palette.light.dark,
  primaryLight: palette.light.light,

  text: palette.light.text.primary,
  subtext: palette.light.grey[600],

  white: '#ffffff',
  bg: '#f5f5f5',
  border: '#ececec',
  error: '#f44336',
  success: '#4caf50',
  warning: '#ff9800',
  catText: "#454F5B",
  catborder: "#DFE3E8",
  black:"#000000"
};

// ─── Font Configuration ───────────────────────────────────────────────────────────────
export const FONTS = {
  anek: {
    family: 'AnekDevanagari',
    thin: 'AnekDevanagari-Thin',
    extraLight: 'AnekDevanagari-ExtraLight',
    light: 'AnekDevanagari-Light',
    regular: 'AnekDevanagari-Regular',
    medium: 'AnekDevanagari-Medium',
    semiBold: 'AnekDevanagari-SemiBold',
    bold: 'AnekDevanagari-Bold',
    extraBold: 'AnekDevanagari-ExtraBold',
    // Condensed variants
    condensed: {
      thin: 'AnekDevanagari_Condensed-Thin',
      extraLight: 'AnekDevanagari_Condensed-ExtraLight',
      light: 'AnekDevanagari_Condensed-Light',
      regular: 'AnekDevanagari_Condensed-Regular',
      medium: 'AnekDevanagari_Condensed-Medium',
      semiBold: 'AnekDevanagari_Condensed-SemiBold',
      bold: 'AnekDevanagari_Condensed-Bold',
      extraBold: 'AnekDevanagari_Condensed-ExtraBold',
    },
    // Expanded variants
    expanded: {
      thin: 'AnekDevanagari_Expanded-Thin',
      extraLight: 'AnekDevanagari_Expanded-ExtraLight',
      light: 'AnekDevanagari_Expanded-Light',
      regular: 'AnekDevanagari_Expanded-Regular',
      medium: 'AnekDevanagari_Expanded-Medium',
      semiBold: 'AnekDevanagari_Expanded-SemiBold',
      bold: 'AnekDevanagari_Expanded-Bold',
      extraBold: 'AnekDevanagari_Expanded-ExtraBold',
    },
  },
  muktaMalar: {
    family: 'MuktaMalar',
    regular: 'MuktaMalar-Regular',
    medium: 'MuktaMalar-Medium',
    semibold: 'MuktaMalar-SemiBold',
    bold: 'MuktaMalar-Bold',
    extraBold: 'MuktaMalar-ExtraBold',
  },
 
};
 export const NewsCard = {
      wrap: {
        width: '100%',
        backgroundColor: PALETTE.white,
        position: 'relative',
      },
      imageWrap: {
        marginHorizontal: s(12),
        marginTop: vs(8),
        // borderRadius: s(6),
        overflow: 'hidden',
        backgroundColor: PALETTE.grey200,
      },
      image: {
        width: '100%',
        height: vs(200),
      },
      contentContainer: {
        paddingHorizontal: s(12),
        paddingTop: vs(10),
        paddingBottom: vs(14),
      },
      title: {
        fontFamily: FONTS.muktaMalar.bold,
        fontSize: ms(14),
        color: PALETTE.grey800,
        lineHeight: ms(23),
        marginBottom: vs(8),
      },
      catPill: {
        alignSelf: 'flex-start',
        backgroundColor: PALETTE.grey200,
        borderWidth: 1,
        borderColor: PALETTE.grey300,
        borderRadius: s(4),
        paddingHorizontal: s(10),
        paddingVertical: s(3),
        marginBottom: vs(10),
      },
      catText: {
        fontFamily: FONTS.muktaMalar.bold,
        fontSize: ms(12),
        color: PALETTE.catText,
      },
      metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      timeText: {
        fontFamily: FONTS.muktaMalar.regular,
        fontSize: ms(14),
        color: PALETTE.black,
      },
      metaRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: s(8),
      },
      commentRow: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      commentText: {
        fontFamily: FONTS.muktaMalar.regular,
        fontSize: ms(14),
        color: PALETTE.grey700,
      },
      audioIcon: {
        flexDirection: 'row',
        alignItems: 'center',
      },
  
    };

// ─── Font Styles for Tamil Text ───────────────────────────────────────────────────────
export const FONT_STYLES = {
  // Tamil API data styles
  tamil: {
    fontFamily: 'MuktaMalar',
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },
  
  // Mixed content (Tamil + English)
  mixed: {
    fontFamily: 'MuktaMalar',
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },

  // Anek font styles for English/Headings
  anek: {
    thin: {
      fontFamily: 'AnekDevanagari-Thin',
      fontSize: 14,
      color: COLORS.text,
    },
    light: {
      fontFamily: 'AnekDevanagari-Light',
      fontSize: 14,
      color: COLORS.text,
    },
    regular: {
      fontFamily: 'AnekDevanagari-Regular',
      fontSize: 14,
      color: COLORS.text,
    },
    medium: {
      fontFamily: 'AnekDevanagari-Medium',
      fontSize: 14,
      color: COLORS.text,
    },
    bold: {
      fontFamily: 'AnekDevanagari-Bold',
      fontSize: 14,
      color: COLORS.text,
    },
    extraBold: {
      fontFamily: 'AnekDevanagari-ExtraBold',
      fontSize: 14,
      color: COLORS.text,
    },
  },
  
  // Headers with Tamil
  tamilHeader: {
    fontFamily: 'MuktaMalar',
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    lineHeight: 26,
  },

  // Quick shortcuts for Anek fonts
  anekThin: { fontFamily: 'AnekDevanagari-Thin' },
  anekLight: { fontFamily: 'AnekDevanagari-Light' },
  anekRegular: { fontFamily: 'AnekDevanagari-Regular' },
  anekMedium: { fontFamily: 'AnekDevanagari-Medium' },
  anekBold: { fontFamily: 'AnekDevanagari-Bold' },
  anekExtraBold: { fontFamily: 'AnekDevanagari-ExtraBold' },

  // Condensed variants shortcuts
  anekCondensedThin: { fontFamily: 'AnekDevanagari_Condensed-Thin' },
  anekCondensedRegular: { fontFamily: 'AnekDevanagari_Condensed-Regular' },
  anekCondensedMedium: { fontFamily: 'AnekDevanagari_Condensed-Medium' },
  anekCondensedBold: { fontFamily: 'AnekDevanagari_Condensed-Bold' },

  // Expanded variants shortcuts
  anekExpandedThin: { fontFamily: 'AnekDevanagari_Expanded-Thin' },
  anekExpandedRegular: { fontFamily: 'AnekDevanagari_Expanded-Regular' },
  anekExpandedMedium: { fontFamily: 'AnekDevanagari_Expanded-Medium' },
  anekExpandedBold: { fontFamily: 'AnekDevanagari_Expanded-Bold' },

  // Mixed font combinations (Tamil + English)
  heading: {
    fontFamily: 'AnekDevanagari-Bold', // English headings
    fontSize: 20,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  subheading: {
    fontFamily: 'AnekDevanagari-Medium', // English subheadings
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  body: {
    fontFamily: 'MuktaMalar', // Tamil body text
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },
  caption: {
    fontFamily: 'AnekDevanagari-Regular', // English captions
    fontSize: 12,
    color: COLORS.subtext,
  },
  
  // Small Tamil text
  tamilSmall: {
    fontFamily: 'MuktaMalar',
    fontSize: 12,
    color: COLORS.subtext,
    lineHeight: 18,
  },

 
};