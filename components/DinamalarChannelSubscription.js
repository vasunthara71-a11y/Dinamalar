import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Linking } from 'react-native';
import { s, vs } from '../utils/scaling';
import { COLORS, FONTS } from '../utils/constants';
import { ms } from 'react-native-size-matters';
import { Svg, Path } from 'react-native-svg';

// ─── SVG Icons (each with its own brand color) ───────────────────────────────

const FacebookIcon = ({ size }) => (
  <Svg viewBox="0 0 512 512" height={size} width={size} fill="#1877F2">
    <Path d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z" />
  </Svg>
);

const WhatsAppIcon = ({ size }) => (
  <Svg viewBox="0 0 448 512" height={size} width={size} fill="#25D366">
    <Path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
  </Svg>
);

const TwitterIcon = ({ size }) => (
  <Svg viewBox="0 0 512 512" height={size} width={size} fill="#229ED9">
    <Path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
  </Svg>
);

const YouTubeIcon = ({ size }) => (
  <Svg viewBox="0 0 576 512" height={size} width={size} fill="#FF0000">
    <Path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" />
  </Svg>
);

const ThreadsIcon = ({ size }) => (
  <Svg viewBox="0 0 448 512" height={size} width={size} fill="#000000">
    <Path d="M331.5 235.7c2.2 .9 4.2 1.9 6.3 2.8c29.2 14.1 50.6 35.2 61.8 61.4c15.7 36.5 17.2 95.8-30.3 143.2c-36.2 36.2-80.3 52.5-142.6 53h-.3c-70.2-.5-124.1-24.1-160.4-70.2c-32.3-41-48.9-98.1-49.5-169.6V256v-.2C17 184.3 33.6 127.2 65.9 86.2C102.2 40.1 156.2 16.5 226.4 16h.3c70.3 .5 124.9 24 162.3 69.9c18.4 22.7 32 50 40.6 81.7l-40.4 10.8c-7.1-25.8-17.8-47.8-32.2-65.4c-29.2-35.8-73-54.2-130.5-54.6c-57 .5-100.1 18.8-128.2 54.4C72.1 146.1 58.5 194.3 58 256c.5 61.7 14.1 109.9 40.3 143.3c28 35.6 71.2 53.9 128.2 54.4c51.4-.4 85.4-12.6 113.7-40.9c32.3-32.2 31.7-71.8 21.4-95.9c-6.1-14.2-17.1-26-31.9-34.9c-3.7 26.9-11.8 48.3-24.7 64.8c-17.1 21.8-41.4 33.6-72.7 35.3c-23.6 1.3-46.3-4.4-63.9-16c-20.8-13.8-33-34.8-34.3-59.3c-2.5-48.3 35.7-83 95.2-86.4c21.1-1.2 40.9-.3 59.2 2.8c-2.4-14.8-7.3-26.6-14.6-35.2c-10-11.7-25.6-17.7-46.2-17.8H227c-16.6 0-39 4.6-53.3 26.3l-34.4-23.6c19.2-29.1 50.3-45.1 87.8-45.1h.8c62.6 .4 99.9 39.5 103.7 107.7l-.2 .2zm-156 68.8c1.3 25.1 28.4 36.8 54.6 35.3c25.6-1.4 54.6-11.4 59.5-73.2c-13.2-2.9-27.8-4.4-43.4-4.4c-4.8 0-9.6 .1-14.4 .4c-42.9 2.4-57.2 23.2-56.2 41.8l-.1 .1z" />
  </Svg>
);

const InstagramIcon = ({ size }) => (
  <Svg viewBox="0 0 448 512" height={size} width={size} fill="#E1306C">
    <Path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" />
  </Svg>
);

const TelegramIcon = ({ size }) => (
  <Svg viewBox="0 0 496 512" height={size} width={size} fill="#229ED9">
    <Path d="M248,8C111.033,8,0,119.033,0,256S111.033,504,248,504,496,392.967,496,256,384.967,8,248,8ZM362.952,176.66c-3.732,39.215-19.881,134.378-28.1,178.3-3.476,18.584-10.322,24.816-16.948,25.425-14.4,1.326-25.338-9.517-39.287-18.661-21.827-14.308-34.158-23.215-55.346-37.177-24.485-16.135-8.612-25,5.342-39.5,3.652-3.793,67.107-61.51,68.335-66.746.153-.655.3-3.1-1.154-4.384s-3.59-.849-5.135-.5q-3.283.746-104.608,69.142-14.845,10.194-26.894,9.934c-8.855-.191-25.888-5.006-38.551-9.123-15.531-5.048-27.875-7.717-26.8-16.291q.84-6.7,18.45-13.7,108.446-47.248,144.628-62.3c68.872-28.647,83.183-33.623,92.511-33.789,2.052-.034,6.639.474,9.61,2.885a10.452,10.452,0,0,1,3.53,6.716A43.765,43.765,0,0,1,362.952,176.66Z" />
  </Svg>
);

const GoogleNewsIcon = ({ size }) => (
  <Image
    source={{ uri: 'https://stat.dinamalar.com/new/2024/images/follow-icons/google_news.png' }}
    style={{ width: 120, height: 45 }}
    resizeMode="contain"
  />
);

// ─── Social config ────────────────────────────────────────────────────────────

const SOCIAL_LINKS = [
  { key: 'facebook',   Icon: FacebookIcon,   borderColor: '#1877F2', url: 'https://www.facebook.com/Dinamalardaily' },
  { key: 'whatsapp',   Icon: WhatsAppIcon,   borderColor: '#25D366', url: 'https://whatsapp.com/channel/0029VafOvP54NVih9kT69x3l' },
  { key: 'twitter',    Icon: TwitterIcon,    borderColor: '#229ED9', url: 'https://x.com/dinamalarweb' },
  { key: 'youtube',    Icon: YouTubeIcon,    borderColor: '#FF0000', url: 'https://www.youtube.com/dinamalardaily' },
  { key: 'threads',    Icon: ThreadsIcon,    borderColor: '#000000', url: 'https://www.threads.net/@dinamalardaily' },
  { key: 'instagram',  Icon: InstagramIcon,  borderColor: '#E1306C', url: 'https://www.instagram.com/dinamalardaily/' },
  { key: 'telegram',   Icon: TelegramIcon,   borderColor: '#229ED9', url: 'https://specials.dinamalar.com/telegram/' },
  { key: 'googlenews', Icon: GoogleNewsIcon, borderColor: '#4285F4', url: 'https://news.google.com/publications/CAAqBwgKMJGZjwsw8qOhAw/sections/CAQqEAgAKgcICjCRmY8LMPKjoQMw5-CtBg?nsro=true&hl=en-IN&gl=IN&ceid=IN:en' },
];

// ─── Component ────────────────────────────────────────────────────────────────

const DinamalarChannelSubscription = () => {
  const handlePress = (url) => {
    Linking.openURL(url).catch(() => {});
  };

  const ICON_SIZE = s(20);

  // Row 1: Facebook, WhatsApp, X, YouTube, Threads (5 items)
  const row1 = SOCIAL_LINKS.slice(0, 5);
  // Row 2: Instagram, Telegram, GoogleNews (3 items)
  const row2 = SOCIAL_LINKS.slice(5);

  const renderButton = ({ key, Icon, borderColor, url }) => (
    <TouchableOpacity
      key={key}
      style={[styles.iconButton, { borderColor }]}
      onPress={() => handlePress(url)}
      activeOpacity={0.75}
    >
      <Icon size={ICON_SIZE} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.outerContainer}>
      <View style={styles.innerContainer}>

        {/* Blue title */}
        <Text style={styles.title}>
          தினமலர் சேனல்களுக்கு SUBSCRIBE செய்யுங்கள் !
        </Text>

        {/* Row 1 — 5 icons */}
        <View style={styles.row}>
          {row1.map(renderButton)}
        </View>

        {/* Row 2 — 3 icons */}
        <View style={styles.row}>
          {row2.map(renderButton)}
        </View>

      </View>
    </View>
  );
};

export default DinamalarChannelSubscription;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    backgroundColor: '#f5f5f5',   // Light grey outer background matching screenshot
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
  },
  innerContainer: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: s(4),
    paddingHorizontal: s(12),
    paddingVertical: vs(14),
    alignItems: 'center',
  },
  title: {
    fontSize: ms(16),
    fontWeight: '600',
    color: COLORS.primary,              // Blue — matches screenshot exactly
    fontFamily: FONTS?.muktaMalar?.regular || 'System',
    textAlign: 'center',
    marginBottom: vs(12),
    lineHeight: ms(21),
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: s(12),
    marginBottom: vs(8),
  },
  iconButton: {
    width: s(36),
    height: s(36),
    // borderRadius: s(6),            // Slightly rounded square
    borderWidth: 1,              // Colored border per platform
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});