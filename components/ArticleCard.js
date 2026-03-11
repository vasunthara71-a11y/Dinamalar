import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../utils/constants';
import { scaledSizes, s, vs } from '../utils/scaling';

const ArticleCard = ({ item, variant = 'compact', onPress }) => {
  const imageUri = item.largeimages || 
                   item.images || 
                   item.image || 
                   item.thumbnail || 
                   'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=300';

  const title = item.newstitle || 
                item.title || 
                item.footnote || 
                'No Title';

  const category = item.maincat || 
                   item.categrorytitle || 
                   item.categrorytitle || 
                   item.ctitle || 
                   'News';

  const date = item.standarddate || 
               item.cdate || 
               item.date || 
               '';

  if (variant === 'hero') {
    return (
      <TouchableOpacity style={styles.heroCard} onPress={onPress} activeOpacity={0.8}>
        <Image source={{ uri: imageUri }} style={styles.heroImage} resizeMode="cover" />
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle} numberOfLines={3}>{title}</Text>
          <View style={styles.heroMeta}>
            <Text style={styles.heroCategory}>{category}</Text>
            <Text style={styles.heroDate}>{date}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.compactCard} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: imageUri }} style={styles.compactImage} resizeMode="cover" />
      <View style={styles.compactContent}>
        <Text style={styles.compactTitle} numberOfLines={2}>{title}</Text>
        <View style={styles.compactMeta}>
          <Text style={styles.compactCategory}>{category}</Text>
          <Text style={styles.compactDate}>{date}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: scaledSizes.radius.lg,
    marginBottom: vs(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: s(2) },
    shadowOpacity: 0.1,
    shadowRadius: s(4),
    elevation: 3,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: vs(200),
  },
  heroContent: {
    padding: s(12),
  },
  heroTitle: {
    fontSize: scaledSizes.font.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: s(8),
    lineHeight: scaledSizes.lineHeight.lg,
  },
  heroMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroCategory: {
    fontSize: scaledSizes.font.sm,
    color: COLORS.primary,
    fontWeight: '700',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: s(8),
    paddingVertical: s(4),
    borderRadius: s(4),
    overflow: 'hidden',
  },
  heroDate: {
    fontSize: scaledSizes.font.sm,
    color: COLORS.subtext,
    fontWeight: '500',
    fontFamily: FONTS.muktaMalar.bold,
  },
  compactCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: scaledSizes.radius.md,
    marginBottom: vs(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: s(2) },
    shadowOpacity: 0.1,
    shadowRadius: s(4),
    elevation: 3,
    overflow: 'hidden',
  },
  compactImage: {
    width: s(100),
    height: s(80),
  },
  compactContent: {
    flex: 1,
    padding: s(10),
  },
  compactTitle: {
    fontSize: scaledSizes.font.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: s(6),
    lineHeight: scaledSizes.lineHeight.md,
    fontFamily: FONTS.muktaMalar.bold,
  },
  compactMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactCategory: {
    fontSize: scaledSizes.font.xs,
    color: COLORS.primary,
    fontWeight: '700',
    backgroundColor: '#f0f4ff',
    paddingHorizontal: s(6),
    paddingVertical: s(2),
    borderRadius: s(4),
    overflow: 'hidden',
  },
  compactDate: {
    fontSize: scaledSizes.font.xs,
    color: COLORS.subtext,
    fontWeight: '500',
    fontFamily: FONTS.muktaMalar.bold,
  },
});

export default ArticleCard;
