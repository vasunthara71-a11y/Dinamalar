// src/components/NewsCard.js
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Comment } from '../assets/svg/Icons';
import { s, vs, ms } from '../utils/scaling';
import { FONTS } from '../utils/constants';
import useAppStyles from '../hooks/useAppStyles';

const NewsCard = ({ item, onPress, isPremium = false }) => {
  const { styles: appSt } = useAppStyles(); // ← font styles, always fresh

  // Debug premium detection
  if (isPremium) {
    console.log(' PREMIUM CARD DETECTED:', item.newstitle || item.title);
  }

  const imageUri =
    item.largeimages || item.images || item.image || item.thumbnail || item.thumb ||
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';

  const title       = item.newstitle || item.title || item.videotitle || item.name || '';
  const category    = item.maincat || item.categrorytitle || item.ctitle || item.maincategory || '';
  const ago         = item.ago || item.time_ago || '';
  const newscomment = item.newscomment || item.commentcount || '';
  const hasAudio    = item.audio === 1 || item.audio === '1' || item.audio === true ||
    (typeof item.audio === 'string' && item.audio.length > 1 && item.audio !== '0');

  return (
    <View style={st.wrap}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.88}>

        <View style={st.imageWrap}>
          <Image source={{ uri: imageUri }} style={st.image} resizeMode="contain" />
        </View>

        <View style={st.content}>
          {!!title && (
            <Text style={[st.titleBase, appSt.cardTitle]} numberOfLines={3}>
              {title}
            </Text>
          )}

          <View style={st.categoryRow}>
            {!!category && (
              <View style={st.catPill}>
                <Text style={[st.catBase, appSt.cardCategory]}>{category}</Text>
              </View>
            )}
            {isPremium && (
              <View style={st.premiumPill}>
                <Text style={[st.premiumBase, appSt.cardCategory]}>பிரீமியம்</Text>
              </View>
            )}
          </View>

          <View style={st.metaRow}>
            <Text style={appSt.cardTime}>{ago}</Text>
            <View style={st.metaRight}>
              {hasAudio && (
                <Ionicons name="volume-high" size={ms(14)} color="#637381" style={{ marginRight: s(6) }} />
              )}
              {!!newscomment && newscomment !== '0' && (
                <View style={st.commentRow}>
                  <Comment size={ms(14)} color="#637381" style={{ marginRight: 2 }} />
                  <Text style={appSt.cardComment}> {newscomment}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

      </TouchableOpacity>
      <View style={st.divider} />
    </View>
  );
};

// Only layout/shape/color — NO fontSize anywhere in here
const st = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
  },
  imageWrap: {
    paddingHorizontal: ms(12),
    paddingTop:        vs(8),
  },
  image: {
    width:  '100%',
    height: vs(200),
    backgroundColor: '#F4F6F8',
  },
  content: {
    padding: ms(12),
  },
  titleBase: {
    fontFamily:   FONTS.muktaMalar.bold,
    marginBottom: vs(6),
  },
  catPill: {
    alignSelf:         'flex-start',
    backgroundColor:   '#F4F6F8',
    borderWidth:       1,
    borderColor:       '#DFE3E8',
    borderRadius:      ms(4),
    paddingHorizontal: ms(8),
    paddingVertical:   vs(3),
    marginBottom:      vs(8),
  },
  catBase: {
    fontFamily: FONTS.muktaMalar.regular,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(8),
    flexWrap: 'wrap',
  },
  premiumPill: {
    backgroundColor: '#FFD700',
    borderWidth: 1,
    borderColor: '#FFB300',
    borderRadius: ms(4),
    paddingHorizontal: ms(8),
    paddingVertical: vs(3),
    marginLeft: ms(6),
  },
  premiumBase: {
    fontFamily: FONTS.muktaMalar.bold,
    color: '#8B4513',
  },
  metaRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginTop:      vs(4),
  },
  metaRight: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  commentRow: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  divider: {
    height:          vs(6),
    backgroundColor: '#F4F6F8',
  },
});

export default NewsCard;