import { scaledSizes } from './scaling';
import { FONTS, COLORS } from './constants';
import { ms, vs, s, mvs } from 'react-native-size-matters';

// Helper to get base font size from scaledSizes
const getBaseFontSize = (scaledSize) => {
  // Extract the base size from scaledSizes
  const sizeMap = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    huge: 28,
  };
  return sizeMap[scaledSize.replace('scaledSizes.font.', '')] || scaledSize;
};
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
};

// ─── Common Text Styles ───────────────────────────────────────────────────────
export const TEXT_STYLES = {


  // ─── Title Styles ───────────────────────────────────────────────────────
  titles: {
    large: {
      fontSize: ms(18),
      fontFamily: FONTS.muktaMalar.bold,
      color: COLORS.text,
      lineHeight: ms(26),
    },
    medium: {
      fontSize: ms(16),
      fontFamily: FONTS.muktaMalar.bold,
      color: COLORS.text,
      lineHeight: ms(24),
    },
    small: {
      fontSize: ms(14),
      fontFamily: FONTS.muktaMalar.bold,
      color: COLORS.text,
      lineHeight: ms(22),
      marginBottom: vs(8),
    },
    card: {
      fontSize: ms(14),
      fontFamily: FONTS.muktaMalar.bold,
      color: COLORS.text,
      lineHeight: ms(22),
      marginBottom: vs(8),
    },
    sectionTitles: {
      fontSize: ms(18),
      color: COLORS.text,
      fontFamily: FONTS.muktaMalar.bold,
    },
    drawerTitles: {
      fontSize: ms(14),
      color: COLORS.text,
      fontFamily: FONTS.muktaMalar.bold,
    }
  },

  // ─── Body Text Styles ─────────────────────────────────────────────────────
  body: {
    large: {
      fontSize: ms(14),
      fontFamily: FONTS.muktaMalar.medium,
      color: COLORS.text,
      lineHeight: ms(22),
    },
    medium: {
      fontSize: ms(12),
      fontFamily: FONTS.muktaMalar.regular,
      color: COLORS.text,
      lineHeight: ms(20),
    },
    small: {
      fontSize: ms(10),
      fontFamily: FONTS.muktaMalar.regular,
      color: COLORS.text,
      lineHeight: ms(18),
    },
  },

  // ─── Category Badge Styles ───────────────────────────────────────────────
  category: {
    primary: {
      fontSize: ms(12),
      fontFamily: FONTS.muktaMalar.bold,
      color: COLORS.catText,
      paddingHorizontal: ms(6),
      paddingVertical: ms(2),
      borderWidth: mvs(1),
      borderColor: COLORS.catborder,
    },
    secondary: {
      fontSize: ms(10),
      fontFamily: FONTS.muktaMalar.medium,
      color: COLORS.primary,
      paddingHorizontal: ms(6),
      paddingVertical: ms(2),
      borderWidth: mvs(1),
      borderColor: COLORS.primary,
    },
  },

  // ─── Meta Text Styles ─────────────────────────────────────────────────────
  meta: {
    large: {
      fontSize: ms(14),
      fontFamily: FONTS.muktaMalar.regular,
      color: COLORS.subtext,
    },
    medium: {
      fontSize: ms(12),
      fontFamily: FONTS.muktaMalar.regular,
      color: COLORS.subtext,
    },
    small: {
      fontSize: ms(10),
      fontFamily: FONTS.muktaMalar.regular,
      color: '#888',
    },
    time: {
      fontSize: ms(10),
      fontFamily: FONTS.muktaMalar.regular,
      color: '#888',
    },
  },

  // ─── Button Text Styles ────────────────────────────────────────────────────
  buttons: {
    primary: {
      fontSize: ms(12),
      fontFamily: FONTS.muktaMalar.bold,
      color: COLORS.white,
    },
    secondary: {
      fontSize: ms(12),
      fontFamily: FONTS.muktaMalar.medium,
      color: COLORS.primary,
    },
    small: {
      fontSize: ms(10),
      fontFamily: FONTS.muktaMalar.medium,
      color: COLORS.primary,
    },
  },

  // ─── Header Styles ────────────────────────────────────────────────────────
  headers: {
    page: {
      fontSize: ms(16),
      fontFamily: FONTS.muktaMalar.bold,
      color: COLORS.text,
      marginBottom: vs(3),
    },
    section: {
      fontSize: ms(14),
      fontFamily: FONTS.muktaMalar.bold,
      color: COLORS.text,
      marginBottom: vs(4),
    },
    card: {
      fontSize: ms(12),
      fontFamily: FONTS.muktaMalar.bold,
      color: COLORS.text,
    },
  },

  // ─── Tab Text Styles ───────────────────────────────────────────────────────
  tabs: {
    active: {
      fontSize: ms(13),
      fontFamily: FONTS.muktaMalar.bold,
      color: COLORS.primary,
    },
    inactive: {
      fontSize: ms(13),
      fontFamily: FONTS.muktaMalar.medium,
      color: '#555',
    },
    small: {
      fontSize: ms(14),
      fontFamily: FONTS.muktaMalar.medium,
      color: '#555',
    },
    smallActive: {
      fontSize: ms(14),
      fontFamily: FONTS.muktaMalar.bold,
      color: COLORS.primary,
    },
  },

  // ─── News Card Styles ───────────────────────────────────────────────────────
  newsCard: {
    title: {
      fontSize: ms(14),
      color: COLORS.text,
      lineHeight: ms(22),
      marginBottom: vs(8),
      fontFamily: FONTS.muktaMalar.bold,
    },
    category: {
      fontSize: ms(12),
      fontFamily: FONTS.muktaMalar.bold,
      color: COLORS.catText,
      paddingHorizontal: ms(6),
      paddingVertical: ms(2),
      borderWidth: mvs(1),
      borderColor: COLORS.catborder,
    },
    meta: {
      fontSize: ms(14),
      fontFamily: FONTS.muktaMalar.regular,
      color: COLORS.subtext,
    },
    rightIconsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 'auto',
      gap: ms(8),
    },
    commentWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: ms(4),
      justifyContent: "center"
    },
    volumeIcon: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center'
    },
    content: {
      paddingTop: vs(8),
      paddingBottom: vs(12),

    },
    catWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      // marginBottom: vs(6),
    }
  },

  // ─── Error & Status Styles ───────────────────────────────────────────────
  status: {
    error: {
      fontSize: ms(14),
      fontFamily: FONTS.muktaMalar.medium,
      color: '#f44336',
    },
    success: {
      fontSize: ms(14),
      fontFamily: FONTS.muktaMalar.medium,
      color: '#4caf50',
    },
    warning: {
      fontSize: ms(14),
      fontFamily: FONTS.muktaMalar.medium,
      color: '#ff9800',
    },
    empty: {
      fontSize: ms(15),
      fontFamily: FONTS.muktaMalar.medium,
      color: '#aaa',
    },
  },
  drawerTitles: {
    fontSize: ms(16),
    color: COLORS.text,
    fontFamily: FONTS.muktaMalar.regular
  },

  CommentDateContainer: {

    flexDirection: 'row',
    alignItems: 'center',
    // marginBottom: vs(6),

  },
  NewsCard: {
    wrap: {
      width: '100%',
      backgroundColor: PALETTE.white,
      position: 'relative',
    },
    imageWrap: {
      paddingHorizontal: ms(12),
      paddingTop: vs(8),
      backgroundColor: PALETTE.white,
    },
    image: {
      width: '100%',
      height: vs(200),
    },
    content: {
      paddingHorizontal: ms(12),
      paddingTop: vs(10),
      paddingBottom: vs(14),
    },
    title: {
      fontFamily: FONTS.muktaMalar.bold,
      fontSize: ms(15),
      color: PALETTE.grey800,
      lineHeight: ms(23),
      marginBottom: vs(8),
    },
    catPill: {
      alignSelf: 'flex-start',
      backgroundColor: PALETTE.grey200,
      borderWidth: 1,
      borderColor: PALETTE.grey300,
      borderRadius: ms(4),
      paddingHorizontal: ms(10),
      paddingVertical: ms(3),
      marginBottom: vs(10),
    },
    catText: {
      fontFamily: FONTS.muktaMalar.bold,
      fontSize: ms(11),
      color: PALETTE.grey700,
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
      gap: ms(8),
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

  }

};

// ─── Export Individual Style Groups for Easy Import ───────────────────────────
export const {
  titles,
  body,
  category,
  meta,
  buttons,
  headers,
  tabs,
  status,
} = TEXT_STYLES;

// ─── Default Export ───────────────────────────────────────────────────────
export default TEXT_STYLES;
