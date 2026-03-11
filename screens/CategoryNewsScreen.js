// CategoryNewsScreen.js

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { mainApi, API_ENDPOINTS } from '../config/api';
import { COLORS } from '../utils/constants';
import { s, vs, scaledSizes } from '../utils/scaling'; // change path if needed
import { ms } from 'react-native-size-matters';

const CategoryNewsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();

  const { endpoint, catId, catName } = route.params || {};

  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('Route params:', route.params);

    if (endpoint || catId) {
      fetchCategoryNews();
    } else {
      console.log('No endpoint or catId provided');
    }
  }, [endpoint, catId]);

  const fetchCategoryNews = async () => {
    try {
      setLoading(true);

      let url = '';

      // Use correct API endpoints from api.js
      if (endpoint) {
        url = endpoint;
      } else if (catId === '5010') {
        url = `${API_ENDPOINTS.NEWS_DATA}?cat=5010`; // தற்போதைய செய்தி
      } else if (catId === '651') {
        url = `${API_ENDPOINTS.NEWS_DATA}?cat=651`; // ப்ரீமியம்
      } else if (catId === '89') {
        url = `${API_ENDPOINTS.NEWS_DATA}?cat=89`; // தமிழகம்
      } else if (catId === '100') {
        url = `${API_ENDPOINTS.NEWS_DATA}?cat=100`; // இந்தியா
      } else if (catId === '34') {
        url = `${API_ENDPOINTS.NEWS_DATA}?cat=34`; // உலகம்
      } else if (catId === 'varthagam') {
        url = API_ENDPOINTS.VARTHAGAM; // வர்த்தகம்
      } else if (catId === 'sports') {
        url = API_ENDPOINTS.VIDEO_DATA; // விளையாட்டு
      } else if (catId === 'kalvimalar') {
        url = API_ENDPOINTS.KALVIMALAR; // கல்விமலர்
      } else if (catId === '91') {
        url = `${API_ENDPOINTS.NEWS_DATA}?cat=39&scat=91`; // டீ கடை பெஞ்ச்
      } else if (catId === 'archive') {
        url = '/archive'; // முந்தய பதிப்புகள்
      } else if (catId) {
        url = `${API_ENDPOINTS.NEWS_DATA}?cat=${catId}`;
      } else {
        url = '/latestmain'; // fallback
      }

      console.log('Calling API:', url);

      const res = await mainApi.get(url);
      const data = res.data;

      console.log('API Response:', data);
      console.log('Response structure:', Object.keys(data || {}));

      // Try multiple possible data structures
      let newsData = [];
      
      if (data?.detail && Array.isArray(data.detail)) {
        newsData = data.detail;
        console.log('Using data.detail array');
      } else if (data?.data && Array.isArray(data.data)) {
        newsData = data.data;
        console.log('Using data.data array');
      } else if (data?.latestmain && Array.isArray(data.latestmain)) {
        newsData = data.latestmain;
        console.log('Using data.latestmain array');
      } else if (data?.newsdata && Array.isArray(data.newsdata)) {
        newsData = data.newsdata;
        console.log('Using data.newsdata array');
      } else if (data?.categorydata && Array.isArray(data.categorydata)) {
        newsData = data.categorydata;
        console.log('Using data.categorydata array');
      } else if (Array.isArray(data)) {
        newsData = data;
        console.log('Using data as direct array');
      } else {
        console.log('No array data found, checking for nested structures');
        // Try to find any array in the response
        const findArray = (obj) => {
          for (let key in obj) {
            if (Array.isArray(obj[key])) {
              return obj[key];
            }
            if (typeof obj[key] === 'object' && obj[key] !== null) {
              const result = findArray(obj[key]);
              if (result) return result;
            }
          }
          return null;
        };
        
        newsData = findArray(data) || [];
        console.log('Found array in nested structure:', newsData.length);
      }

      console.log('Final news data count:', newsData.length);
      console.log('Sample news item:', newsData[0]);

      setNewsList(newsData);
    } catch (error) {
      console.error('Fetch error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: url
      });

      if (error.response?.status === 404) {
        console.log('❌ Endpoint not found. Check URL:', url);
      } else if (error.response?.status === 500) {
        console.log('❌ Server error. Try again later.');
      } else {
        console.log('❌ Network or other error:', error.message);
      }
      
      // Set empty array on error to prevent infinite loading
      setNewsList([]);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    // Handle different image field names
    const imageUrl = item.images || item.image || item.imageurl || item.largeimages || item.photo;
    // Handle different title field names
    const title = item.newstitle || item.title || item.headline || item.name || 'செய்தி தலைப்பு';
    // Handle different ID field names
    const itemId = item.id || item.newsid || item.news_id;
    
    console.log('Rendering item:', { title, hasImage: !!imageUrl, id: itemId });
    
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('NewsDetailsScreen', {
            newsId: itemId,
            newsItem: item,
          })
        }
      >
        {imageUrl ? (
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.image} 
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
            <Ionicons name="image-outline" size={s(40)} color={COLORS.subtext} />
          </View>
        )}

        <Text style={styles.title} numberOfLines={3}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={s(24)} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle} numberOfLines={1}>
            {catName || 'செய்திகள்'}
          </Text>
          
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="search-outline" size={s(22)} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>ஏற்றுகிறது...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={s(24)} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle} numberOfLines={1}>
          {catName || 'செய்திகள்'}
        </Text>
        
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="search-outline" size={s(22)} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.categoryHeader}>
        {catName || 'News'}
      </Text>

      <FlatList
        data={newsList}
        keyExtractor={(item, index) =>
          (item.id || item.newsid || index).toString()
        }
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>செய்திகள் இல்லை</Text>
          </View>
        }
      />
    </View>
  );
};

export default CategoryNewsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: s(16),
    paddingTop: vs(50), // Status bar space
    paddingBottom: vs(12),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: vs(2) },
    shadowOpacity: 0.2,
    shadowRadius: s(4),
  },
  headerButton: {
    padding: s(8),
  },
  headerTitle: {
    flex: 1,
    fontSize: scaledSizes.font.lg,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: s(16),
  },
  headerRight: {
    flexDirection: 'row',
  },

  // Category Header
  categoryHeader: {
    fontSize: scaledSizes.font.md,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: s(16),
    paddingVertical: vs(12),
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  // List
  listContainer: {
    padding: s(12),
  },

  // News Item
  card: {
    backgroundColor: COLORS.white,
    borderRadius: s(12),
    marginBottom: vs(12),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: s(1) },
    shadowOpacity: 0.1,
    shadowRadius: s(3),
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: vs(180),
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: scaledSizes.font.md,
    fontWeight: '600',
    color: COLORS.text,
    padding: s(12),
    lineHeight: scaledSizes.lineHeight.md,
  },

  // Loading
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: vs(10),
    fontSize: scaledSizes.font.md,
    color: COLORS.subtext,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: vs(60),
  },
  emptyStateText: {
    fontSize: scaledSizes.font.md,
    color: COLORS.subtext,
    textAlign: 'center',
  },
});