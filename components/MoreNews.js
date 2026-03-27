import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Linking,
} from 'react-native';
import { s, vs, ms } from '../utils/scaling';
import { COLORS, FONTS } from '../utils/constants';
import { useFontSize } from '../context/FontSizeContext';
import { mainApi } from '../config/api';

const MoreNews = ({ morenewsLink, onNewsPress }) => {
  const { sf } = useFontSize();
  const [morenewsData, setMorenewsData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debug logging
  console.log('MoreNews component - morenewsLink prop:', morenewsLink);
  console.log('MoreNews component - morenewsLink type:', typeof morenewsLink);
  console.log('MoreNews component - morenewsLink length:', morenewsLink?.length);

  // Fetch morenews data
  const fetchMorenews = useCallback(async () => {
    if (!morenewsLink || loading) return;
    
    try {
      setLoading(true);
      const res = await mainApi.get(morenewsLink);
      if (res.data && Array.isArray(res.data)) {
        setMorenewsData(res.data);
      } else {
        setMorenewsData([]);
      }
    } catch (error) {
      console.error('Error fetching morenews:', error);
      setMorenewsData([]);
    } finally {
      setLoading(false);
    }
  }, [morenewsLink, loading]);

  // Fetch data when component mounts or link changes
  React.useEffect(() => {
    fetchMorenews();
  }, [fetchMorenews]);

  // Handle news item press
  const handleNewsPress = (item) => {
    if (onNewsPress) {
      onNewsPress(item);
    } else {
      // Try multiple URL fields and construct proper URL
      let url = item.link;
      
      if (!url && item.slug) {
        url = `https://www.dinamalar.com${item.slug}`;
      } else if (!url && item.reacturl) {
        url = item.reacturl.startsWith('http') 
          ? item.reacturl 
          : `https://www.dinamalar.com${item.reacturl}`;
      }
      
      if (url) {
        Linking.openURL(url).catch(() => console.log('Failed to open URL:', url));
      } else {
        console.log('No valid URL found for news item:', item);
      }
    }
  };

  // Render individual news item
  const renderNewsItem = ({ item }) => (
    <TouchableOpacity
      style={styles.newsItem}
      onPress={() => handleNewsPress(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.images || item.largeimages || item.image || 'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400' }}
        style={styles.newsImage}
        resizeMode="cover"
      />
      <View style={styles.newsContent}>
        <Text style={[styles.newsTitle, { fontSize: sf(14) }]} numberOfLines={3}>
          {item.newstitle || item.title || ''}
        </Text>
        <Text style={[styles.newsMeta, { fontSize: sf(11) }]}>
          {item.standarddate || item.date || ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Don't render anything if no morenewsLink or no data
  if (!morenewsLink || (morenewsData.length === 0 && !loading)) {
    console.log('MoreNews component - not rendering container, morenewsLink:', morenewsLink, 'dataLength:', morenewsData.length, 'loading:', loading);
    return null;
  }

  console.log('MoreNews component - rendering container with data:', morenewsData.length, 'items');

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { fontSize: sf(18) }]}>மேலும் செய்திகள்</Text>
        <View style={styles.sectionUnderline} />
        <TouchableOpacity 
          style={styles.seeMoreBtn}
          onPress={() => console.log('See More pressed')}
        >
          <Text style={styles.seeMoreBtnText}>See More</Text>
        </TouchableOpacity>
      </View>
      
      {/* News List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { fontSize: sf(14) }]}>Loading...</Text>
        </View>
      ) : morenewsData.length > 0 ? (
        <FlatList
          data={morenewsData}
          renderItem={renderNewsItem}
          keyExtractor={(item, index) => `morenews-${item.newsid || item.id || index}`}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { fontSize: sf(14) }]}>மேலும் செய்திகள் இல்லை</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: vs(12),
    backgroundColor: '#ffffff',
  },
  // Section Header styles (matching HomeScreen)
  sectionHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: s(12),
    paddingVertical: ms(10),
  },
  sectionTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    color: '#4a4a4a', // PALETTE.grey800 equivalent
  },
  sectionUnderline: {
    height: vs(3),
    width: s(40),
    backgroundColor: COLORS.primary,
  },
  seeMoreBtn: {
    backgroundColor: 'transparent',
    paddingVertical: vs(6),
    paddingHorizontal: s(12),
    alignSelf: 'flex-end',
  },
  seeMoreBtnText: {
    color: COLORS.primary,
    fontFamily: FONTS.muktaMalar.semibold,
    fontSize: ms(13),
  },
  // News items
  listContainer: {
    paddingHorizontal: s(12),
    paddingBottom: vs(12),
  },
  newsItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: vs(8),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  newsImage: {
    width: s(80),
    height: s(60),
    borderRadius: s(8),
    backgroundColor: '#f0f0f0',
  },
  newsContent: {
    flex: 1,
    marginLeft: s(12),
    justifyContent: 'space-between',
  },
  newsTitle: {
    fontFamily: FONTS.muktaMalar.semibold,
    color: '#1a1a1a',
    lineHeight: ms(18),
    flex: 1,
  },
  newsMeta: {
    fontFamily: FONTS.muktaMalar.regular,
    color: '#666',
    marginTop: vs(4),
  },
  // Loading and empty states
  loadingContainer: {
    padding: vs(20),
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontFamily: FONTS.muktaMalar.regular,
  },
  emptyContainer: {
    padding: vs(20),
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontFamily: FONTS.muktaMalar.regular,
  },
});

export default MoreNews;
