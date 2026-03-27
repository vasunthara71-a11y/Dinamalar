// src/components/NewsCard.js
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { SpeakerIcon } from '../assets/svg/Icons';
import { Comment } from '../assets/svg/Icons';
import { s, vs, ms } from '../utils/scaling';
import { FONTS } from '../utils/constants';
import useAppStyles from '../hooks/useAppStyles';
import { useFontSize } from '../context/FontSizeContext';
import {NewsCard as NewsCardStyles} from '../utils/constants';
 
// HTML decode function
const decodeHtml = (html) => {
  if (!html) return '';
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
};

const NewsCard = ({ item, onPress, onCommentPress, isSocialMedia = false, isPremium = false, hideCategory = false, isCartoon = false, sectionTitle = '', is360Degree = false, hideImage = false, hideDescription = false, isIPaper = false }) => {
  const { styles: appSt } = useAppStyles(); // ← font styles, always fresh
  const { sf } = useFontSize(); // ← scaling function
  const [imageError, setImageError] = React.useState(false);

  // Debug premium detection
  if (isPremium) {
    console.log(' PREMIUM CARD DETECTED:', item.newstitle || item.title);
  }

  // Debug hideCategory
  if (hideCategory) {
    console.log(' HIDE CATEGORY ENABLED FOR:', item.newstitle || item.title);
  }

  const imageUri =
    item.largeimages || item.images || item.image || item.thumbnail || item.thumb ||
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';

  const handleImageError = () => {
    setImageError(true);
  };

  const title = decodeHtml(item.newstitle || item.title || item.videotitle || item.name || '');
  const category = item.maincat || item.categrorytitle || item.ctitle || item.maincategory || '';
  const ago = item.ago || item.time_ago || '';
  const newscomment =
    item.newscomment ||
    item.newscomments ||
    item.commentcount ||
    item.nmcomment ||
    item.nmcomments ||
    item.comments?.total ||
    (typeof item.comments === 'number' ? item.comments : null) ||
    '';
  const newsdescription = item.newsdescription || item.description || '';

  // // Debug description data
  // console.log('NEWS CARD - Description for:', title);
  // console.log('- newsdescription:', item.newsdescription);
  // console.log('- description:', item.description);
  // console.log('- final newsdescription:', newsdescription);
  // console.log('- hideCategory:', hideCategory);

  // // Debug comment data
  // console.log('COMMENT DEBUG for:', title);
  // console.log('- newscomment:', item.newscomment);
  // console.log('- commentcount:', item.commentcount);
  // console.log('- comments:', item.comments);
  // console.log('- final newscomment:', newscomment);

  const hasAudio = item.audio === 1 || item.audio === '1' || item.audio === true ||
    (typeof item.audio === 'string' && item.audio.length > 1 && item.audio !== '0');

  return (
    <View style={NewsCardStyles.wrap}>
      
      <TouchableOpacity onPress={onPress} activeOpacity={0.88}>

        {/* Image Container - Only show if hideImage is false */}
        {!hideImage && (
          <View style={NewsCardStyles.imageWrap}>
            {imageError ? (
              <View style={[NewsCardStyles.image, NewsCardStyles.imageErrorContainer]}>
                <Ionicons name="image-outline" size={ms(40)} color="#9CA3AF" />
                <Text style={[NewsCardStyles.imageErrorText, appSt.cardCategory]}>Image Not Available</Text>
              </View>
            ) : (
              <Image
                source={{ uri: imageUri }}
                style={NewsCardStyles.image}
                resizeMode="contain"
                onError={handleImageError}
              />
            )}

            {/* Premium Tag */}
            {isPremium && (
              <View style={NewsCardStyles.premiumTag}>
                <Text style={NewsCardStyles.premiumTagText}>பிரீமியம்</Text>
              </View>
            )}

            {/* 360° Tag */}
            {is360Degree && (
              <View style={NewsCardStyles.degree360Tag}>
                <Text style={NewsCardStyles.degree360TagText}>360° கோயில்கள் (தமிழ்)</Text>
              </View>
            )}

            {/* Section Title */}
            {sectionTitle && (
              <View style={NewsCardStyles.sectionTitleContainer}>
                <Text style={NewsCardStyles.sectionTitle}>{sectionTitle}</Text>
              </View>
            )}
          </View>
        )}

        {/* Tags for cards without images */}
        {hideImage && (
          <View style={{ position: 'relative', paddingHorizontal: s(12), paddingTop: vs(10) }}>
            {/* Premium Tag */}
            {isPremium && (
              <View style={[NewsCardStyles.premiumTag, { position: 'absolute', right: s(12), top: vs(10) }]}>
                <Text style={NewsCardStyles.premiumTagText}>பிரீமியம்</Text>
              </View>
            )}

            {/* 360° Tag */}
            {is360Degree && (
              <View style={[NewsCardStyles.degree360Tag, { position: 'absolute', right: s(12), top: vs(10) }]}>
                <Text style={NewsCardStyles.degree360TagText}>360° கோயில்கள் (தமிழ்)</Text>
              </View>
            )}
          </View>
        )}

        <View style={NewsCardStyles.contentContainer}>
          {/* Banner Title and Date - Show below image for banner items */}
          {item.isBanner && item.showCenteredTitle && (
            <View style={NewsCardStyles.bannerContentContainer}>
              {!!title && (
                <Text style={NewsCardStyles.bannerTitle}>{title}</Text>
              )}
              {!!item.standarddate && (
                <Text style={NewsCardStyles.bannerDate}>{item.standarddate}</Text>
              )}
            </View>
          )}

          {/* Regular title for non-banner items */}
          {!!title && !isSocialMedia && !item.isBanner && (
            <Text style={[NewsCardStyles.title, { fontSize: sf(13), lineHeight: sf(22) }]} numberOfLines={3}>
              {title}
            </Text>
          )}

          {/* Show description for temple items and Dinam Dinam */}
          {/* {!!newsdescription && !isSocialMedia && !hideDescription && (
            <View>
              <Text style={[NewsCardStyles.descriptionText, appSt.cardDescription]} numberOfLines={2}>
                {newsdescription}
              </Text>
            </View>
          )} */}

          {!!category && !isSocialMedia && !hideCategory && !isPremium && (
            <View style={NewsCardStyles.catPill}>
              <Text style={[NewsCardStyles.catText, appSt.cardCategory]}>{category}</Text>
            </View>
          )}

          <View style={NewsCardStyles.metaRow}>
            <Text style={appSt.cardTime}>{ago}</Text>
            <View style={NewsCardStyles.metaRight}>
              {hasAudio && (
                <View style={NewsCardStyles.audioIcon}>
                  <SpeakerIcon size={s(14)} color="#637381" />
                </View>
              )}
              {!!newscomment && newscomment !== '0' && (
                <TouchableOpacity 
                  style={NewsCardStyles.commentRow}
                  onPress={onCommentPress}
                  activeOpacity={0.8}
                >
                  <Comment size={s(15)} color="#637381" style={{ marginRight: 2 }} />
                  <Text style={appSt.cardComment}> {newscomment}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

      </TouchableOpacity>
      <View style={NewsCardStyles.divider} />
    </View>
  );
};

 

export default NewsCard;