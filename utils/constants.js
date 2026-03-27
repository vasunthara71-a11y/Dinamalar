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
  black: '#0000',
  catText: '#454F5B'
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
  
  primary: '#096dd2',
  grey100: '#F9FAFB',
  grey200: '#F4F6F8',
  grey300: '#DFE3E8',
  grey400: '#C4CDD5',
  grey500: '#919EAB',
  grey600: '#637381',
  grey700: '#637381',
  grey800: '#212B36',

  white: '#ffffff',
  bg: '#f5f5f5',
  border: '#ececec',
  error: '#f44336',
  success: '#4caf50',
  warning: '#ff9800',
  catText: "#454F5B",
  catborder: "#DFE3E8",
  black: "#000000",
  podcast: '#9c27b0', // Purple color for podcast
};

// ─── Font Configuration ───────────────────────────────────────────────────────────────
export const FONTS = {
  anek: {
    family: 'AnekTamil',
    thin: 'AnekTamil-Thin',
    extraLight: 'AnekTamil-ExtraLight',
    light: 'AnekTamil-Light',
    regular: 'AnekTamil-Regular',
    medium: 'AnekTamil-Medium',
    semiBold: 'AnekTamil-SemiBold',
    bold: 'AnekTamil-Bold',
    extraBold: 'AnekTamil-ExtraBold',
    // Condensed variants
    condensed: {
      thin: 'AnekTamil_Condensed-Thin',
      extraLight: 'AnekTamil_Condensed-ExtraLight',
      light: 'AnekTamil_Condensed-Light',
      regular: 'AnekTamil_Condensed-Regular',
      medium: 'AnekTamil_Condensed-Medium',
      semiBold: 'AnekTamil_Condensed-SemiBold',
      bold: 'AnekTamil_Condensed-Bold',
      extraBold: 'AnekTamil_Condensed-ExtraBold',
    },
    // Expanded variants
    expanded: {
      thin: 'AnekTamil_Expanded-Thin',
      extraLight: 'AnekTamil_Expanded-ExtraLight',
      light: 'AnekTamil_Expanded-Light',
      regular: 'AnekTamil_Expanded-Regular',
      medium: 'AnekTamil_Expanded-Medium',
      semiBold: 'AnekTamil_Expanded-SemiBold',
      bold: 'AnekTamil_Expanded-Bold',
      extraBold: 'AnekTamil_Expanded-ExtraBold',
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
  socialMediaWrap: {
    width: '100%',
    // backgroundColor: PALETTE.white,
    position: 'relative',
    // marginVertical: vs(2),
    // borderRadius: s(8),
  },
  wrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
    overflow: 'hidden',
    width: 100,
    height: 100,
  },

  ribbonContainer: {
    position: 'absolute',
    top: 20,
    right: -30,
    transform: [{ rotate: '45deg' }],
    backgroundColor: '#E53935', // ribbon color
    paddingVertical: 5,
    width: 140,
    alignItems: 'center',
  },

  ribbonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  imageWrap: {
    marginHorizontal: s(12),
    marginTop: vs(5),
    overflow: 'hidden',
    // backgroundColor: PALETTE.grey200,     
  },
  image: {
    width: '100%',
    height: vs(200),
  },
  imageErrorContainer: {
    width: '100%',
    height: vs(200),
    backgroundColor: PALETTE.grey200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumTag: {
     position: 'absolute',
    top: 20,
    right: -30,
    transform: [{ rotate: '45deg' }],
    backgroundColor: '#E53935', // ribbon color
    paddingVertical: 5,
    width: 140,
    alignItems: 'center',
  },
  premiumTagText: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(11),
    color: PALETTE.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  degree360Tag: {
    position: 'absolute',
    right: s(0),
    backgroundColor: PALETTE.primary,
    paddingHorizontal: s(10),
    paddingVertical: s(6),
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  degree360TagText: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(12),
    color: PALETTE.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contentContainer: {
    paddingHorizontal: s(12),
    paddingTop: vs(10),
    paddingBottom: vs(15),
  },
  title: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(14),
    color: PALETTE.grey800,
    lineHeight: ms(23),
    marginBottom: vs(8),
    // fontWeight:"600"
  },
  description: {
    fontFamily: FONTS.muktaMalar.regular,
    fontSize: ms(12),
    color: PALETTE.grey600,
    lineHeight: ms(18),
    marginBottom: vs(8),
  },
  catPill: {
    alignSelf: 'flex-start',
    // backgroundColor: PALETTE.grey200,
    borderWidth: 1,
    borderColor: PALETTE.grey300,
    paddingHorizontal: s(8),
    // paddingVertical: s(3),
    marginBottom: vs(10),
  },
  catText: {
    fontFamily: FONTS.muktaMalar.semibold,
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
    color: PALETTE.grey600,
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
  divider: {
    height: 1,
    backgroundColor: PALETTE.grey200,
    marginHorizontal: s(12),
  },
  sectionTitleContainer: {
    backgroundColor: PALETTE.primary,
    paddingHorizontal: s(8),
    paddingVertical: s(4),
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  sectionTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    color: '#FFFFFF',
    fontSize: ms(12),
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(12),
    marginBottom: vs(8),
  },
  bannerTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(16),
    color: PALETTE.grey800,
    textAlign: 'center',
    marginBottom: vs(4),
  },
  bannerDate: {
    fontFamily: FONTS.muktaMalar.regular,
    fontSize: ms(12),
    color: PALETTE.grey600,
    textAlign: 'center',
  },
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
      fontFamily: 'AnekTamil-Thin',
      fontSize: 14,
      color: COLORS.text,
    },
    light: {
      fontFamily: 'AnekTamil-Light',
      fontSize: 14,
      color: COLORS.text,
    },
    regular: {
      fontFamily: 'AnekTamil-Regular',
      fontSize: 14,
      color: COLORS.text,
    },
    medium: {
      fontFamily: 'AnekTamil-Medium',
      fontSize: 14,
      color: COLORS.text,
    },
    bold: {
      fontFamily: 'AnekTamil-Bold',
      fontSize: 14,
      color: COLORS.text,
    },
    extraBold: {
      fontFamily: 'AnekTamil-ExtraBold',
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
  anekThin: { fontFamily: 'AnekTamil-Thin' },
  anekLight: { fontFamily: 'AnekTamil-Light' },
  anekRegular: { fontFamily: 'AnekTamil-Regular' },
  anekMedium: { fontFamily: 'AnekTamil-Medium' },
  anekBold: { fontFamily: 'AnekTamil-Bold' },
  anekExtraBold: { fontFamily: 'AnekTamil-ExtraBold' },

  // Condensed variants shortcuts
  anekCondensedThin: { fontFamily: 'AnekTamil_Condensed-Thin' },
  anekCondensedRegular: { fontFamily: 'AnekTamil_Condensed-Regular' },
  anekCondensedMedium: { fontFamily: 'AnekTamil_Condensed-Medium' },
  anekCondensedBold: { fontFamily: 'AnekTamil_Condensed-Bold' },

  // Expanded variants shortcuts
  anekExpandedThin: { fontFamily: 'AnekTamil_Expanded-Thin' },
  anekExpandedRegular: { fontFamily: 'AnekTamil_Expanded-Regular' },
  anekExpandedMedium: { fontFamily: 'AnekTamil_Expanded-Medium' },
  anekExpandedBold: { fontFamily: 'AnekTamil_Expanded-Bold' },

  // Mixed font combinations (Tamil + English)
  heading: {
    fontFamily: 'AnekTamil-Bold', // English headings
    fontSize: 20,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  subheading: {
    fontFamily: 'AnekTamil-Medium', // English subheadings
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
    fontFamily: 'AnekTamil-Regular', // English captions
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