import { StyleSheet, Text, View } from "react-native";
import { ms, s, vs } from "react-native-size-matters";
import { FONTS } from "../utils/constants";
import { useFontSize } from "../context/FontSizeContext";
import { TouchableOpacity } from "react-native";
import { Image } from "react-native";
import { useNavigation } from '@react-navigation/native';

// Helper function to decode HTML entities
const decodeHtml = (str) => {
  if (!str) return '';
  return str
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x60;/g, '`')
    .replace(/&#x3D;/g, '=')
    .replace(/&nbsp;/g, ' ');
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

export default function ShortNewsSection({ title, data, onPress, onSeeMore }) {
  const { sf } = useFontSize();
  const navigation = useNavigation();
  
  if (!data || data.length === 0) return null;

  const item = data[0];
  const imageUri =
    item.largeimages || item.images || item.image || item.thumbnail ||
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';
  const title2 = decodeHtml(item.newstitle || item.title || item.videotitle || '');
  const category = item.maincat || item.ctitle || item.categrorytitle || '';
  const ago = item.ago || item.time_ago || '';
  const description = item.newsdescription || item.description || item.shortdescription || item.body || '';

  const handleSeeMore = () => {
    if (onSeeMore) {
      onSeeMore();
    } else {
      // Default navigation to ShortNewsSwiperScreen
      navigation.navigate('ShortNewsSwiperScreen');
    }
  };

  return (
    <View style={shortNewsSt.wrapper}>
      <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.88}>

        {/* Outer container — holds image + overlapping title card */}
        <View style={shortNewsSt.imageSection}>

          {/* Image with side margins */}
          <Image
            source={{ uri: imageUri }}
            style={shortNewsSt.image}
            resizeMode="cover"
          />

          {/* White title card — absolutely positioned, overlaps bottom of image */}
          {!!title2 && (
            <View style={shortNewsSt.titleCard}>
              <Text
                style={[shortNewsSt.titleText, { fontSize: sf(15), lineHeight: sf(22) }]}
                numberOfLines={3}
              >
                {title2}
              </Text>

              {/* Category pill + time */}
              <View style={shortNewsSt.metaRow}>
                {!!category && (
                  <View style={shortNewsSt.catPill}>
                    <Text style={[shortNewsSt.catText, { fontSize: sf(12) }]}>{category}</Text>
                  </View>
                )}
                {!!ago && (
                  <Text style={[shortNewsSt.agoText, { fontSize: sf(12) }]}>{ago}</Text>
                )}
              </View>

              {/* Description */}
              {!!description && (
                <Text
                  style={[shortNewsSt.description, { fontSize: sf(13), lineHeight: sf(22) }]}
                  numberOfLines={6}
                >
                  {description}
                </Text>
              )}

              {/* See more button */}
              <TouchableOpacity style={shortNewsSt.seeMoreBtn} onPress={handleSeeMore} activeOpacity={0.85}>
                <Text style={[shortNewsSt.seeMoreText, { fontSize: sf(14) }]}>
                  மேலும் {title} &gt;&gt;
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const shortNewsSt = StyleSheet.create({
  wrapper: {
    backgroundColor: PALETTE.white,
    marginBottom: vs(8),
    // NO paddingHorizontal, NO borderRadius
  },

  imageSection: {
    // This container holds both image and the overlapping title card
    // paddingBottom makes room for the title card that hangs below
    paddingBottom: vs(0),
    paddingHorizontal: ms(20)
  },

  image: {
    width: '100%',
    height: vs(220),
    // NO borderRadius — full width flush image
  },

  // White card that overlaps the bottom of the image
  titleCard: {
    marginHorizontal: s(14),         // side margins so it doesn't touch screen edges
    marginTop: vs(-20),              // negative margin pulls it UP over the image
    backgroundColor: PALETTE.white,
    paddingHorizontal: s(14),
    paddingVertical: vs(12),
    // Subtle shadow to lift it above the image
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: vs(2) },
    shadowOpacity: 0.12,
    shadowRadius: s(4),
  },

  titleText: {
    fontFamily: FONTS.muktaMalar.bold,
    color: PALETTE.grey800,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: vs(10),
    paddingBottom: vs(4),
    gap: s(10),
  },

  catPill: {
    borderWidth: 1,
    borderColor: PALETTE.grey300,
    borderRadius: s(4),
    paddingHorizontal: s(10),
    paddingVertical: vs(4),
  },

  catText: {
    fontFamily: FONTS.muktaMalar.regular,
    color: PALETTE.grey600,
  },

  agoText: {
    fontFamily: FONTS.muktaMalar.regular,
    color: PALETTE.grey500,
  },

  description: {
    fontFamily: FONTS.muktaMalar.regular,
    color: PALETTE.grey800,
    paddingTop: vs(4),
    paddingBottom: vs(8),
  },

  seeMoreBtn: {
    backgroundColor: PALETTE.primary,
    paddingVertical: vs(4),
    alignItems: 'center',
    borderRadius: s(6),
  },

  seeMoreText: {
    fontFamily: FONTS.muktaMalar.bold,
    color: '#fff',
  },
});
