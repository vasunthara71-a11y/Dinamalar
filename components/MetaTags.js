import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { s, vs } from '../utils/scaling';
import { COLORS, FONTS } from '../utils/constants';
import { ms } from 'react-native-size-matters';

const MetaTags = ({ mdescription }) => {
  const navigation = useNavigation();

  // Parse the comma-separated mdescription string into individual tags
  const parseTags = (mdescription) => {
    if (!mdescription || typeof mdescription !== 'string') return [];

    return mdescription
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  };

  const tags = parseTags(mdescription);

  // Don't render if no tags
  if (tags.length === 0) {
    return null;
  }

  const handleTagPress = (tag) => {
    console.log('🏷️ MetaTag pressed:', tag);
    // Navigate to SearchScreen with the tag as search term
    navigation.navigate('SearchScreen', {
      searchTerm: tag,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Tags:</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {tags.map((tag, index) => (
          <TouchableOpacity
            key={`tag-${index}-${tag}`}
            style={styles.tagButton}
            onPress={() => handleTagPress(tag)}
            activeOpacity={0.8}
          >
            <Text style={styles.tagText} numberOfLines={1}>
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default MetaTags;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: s(16),
    paddingVertical: vs(8),
    backgroundColor: '#ffffff',
    flexDirection: "row",
    alignItems: "center"
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight:s(8)
  },
  title: {
    fontSize: s(16),
    fontWeight: '600',
    color: COLORS.grey600,
    fontFamily: FONTS?.muktaMalar?.bold || 'System',
  },
  scrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(8),
    paddingRight: s(16), // Extra padding for last item
  },
  tagButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: s(16),
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    minHeight: vs(32),
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagText: {
    fontSize: s(12),
    color: COLORS.grey600,
    fontFamily: FONTS?.muktaMalar?.regular || 'System',
    textAlign: 'center',
    maxWidth: s(120), // Prevent overly long tags
  },
});
