import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Share,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { u38Api, API_ENDPOINTS } from '../config/api';
import { COLORS } from '../utils/constants';
import { s, vs, scaledSizes } from '../utils/scaling';
import { ms } from 'react-native-size-matters';
import UniversalHeaderComponent from '../components/UniversalHeaderComponent';
import AppHeaderComponent from '../components/AppHeaderComponent';

// ─── Timeline Details Screen ────────────────────────────────────────────────
export default function TimelineDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { newsItem } = route.params || {};

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedNews, setRelatedNews] = useState([]);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isLocationDrawerVisible, setIsLocationDrawerVisible] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('உள்ளூர்');

  // ─── Navigation Handlers ───────────────────────────────────────────────────────
  const handleMenuPress = (menuItem) => {
    const link  = menuItem?.Link  || menuItem?.link  || '';
    const title = menuItem?.Title || menuItem?.title || '';

    console.log('TimelineDetails: Clicked menu:', title);
    console.log('TimelineDetails: Link value:', link);

    // Handle navigation logic here
    if (link.startsWith('http://') || link.startsWith('https://') || link.startsWith('www.')) {
      Linking.openURL(link);
      return;
    }

    // Add other navigation logic as needed
  };

  const goToSearch = () => navigation?.navigate('SearchScreen');
  const goToNotifs = () => navigation?.navigate('NotificationScreen');

  const handleSelectDistrict = (district) => {
    setSelectedDistrict(district.title);
    setIsLocationDrawerVisible(false);
    if (district.id) {
      navigation?.navigate('DistrictNewsScreen', {
        districtId: district.id,
        districtTitle: district.title,
      });
    }
  };

  useEffect(() => {
    if (newsItem) {
      fetchArticleDetails(newsItem.id || newsItem.newsid);
    }
  }, [newsItem]);

  const fetchArticleDetails = async (newsId) => {
    try {
      setLoading(true);
      
      // Fetch article details using the correct API endpoint
      const detailResponse = await u38Api.get(`${API_ENDPOINTS.DETAIL}?newsid=${newsId}`);
      const articleData = detailResponse.data;
      
      console.log('Article details API response:', articleData);
      console.log('API URL:', `${API_BASE_URLS.DMR_API}${API_ENDPOINTS.DETAIL}?newsid=${newsId}`);
      
      setArticle(articleData);
      
      // Fetch related news (same category)
      if (newsItem.maincat) {
        const relatedResponse = await u38Api.get(`${API_ENDPOINTS.LATEST_MAIN}?page=1`);
        const relatedItems = relatedResponse.data?.detail || [];
        const filtered = relatedItems.filter(item => 
          item.maincat === newsItem.maincat && 
          (item.id || item.newsid) !== newsId
        ).slice(0, 5);
        setRelatedNews(filtered);
      }
      
    } catch (error) {
      console.error('Error fetching article details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      const url = article?.shareurl || `https://www.dinamalar.com/news/${newsItem.id || newsItem.newsid}`;
      const title = article?.newstitle || newsItem.newstitle || 'தினமலர் செய்தி';
      
      await Share.share({
        title: title,
        url: url,
        message: `${title}\n\n${url}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const openInBrowser = () => {
    const url = article?.shareurl || `https://www.dinamalar.com/news/${newsItem.id || newsItem.newsid}`;
    Linking.openURL(url);
  };

  const navigateToRelatedArticle = (item) => {
    navigation.push('TimelineDetailsScreen', { newsItem: item });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>ஏற்றுகிறது...</Text>
      </View>
    );
  }

  if (!article && !newsItem) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Ionicons name="alert-circle" size={60} color={COLORS.primary} />
        <Text style={styles.errorText}>செய்தி கிடைக்கவில்லை</Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>திரும்பு</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayArticle = article || newsItem;
  const hasImage = displayArticle.images || displayArticle.imageurl;
  const isVideo = displayArticle.maincat === 'video' || displayArticle.path?.includes('youtube');

  return (
    <View style={styles.container}>
      <UniversalHeaderComponent
        statusBarStyle="light-content"
        statusBarBackgroundColor={COLORS.primary}
        onMenuPress={handleMenuPress}
        onNotification={goToNotifs}
        notifCount={0}
        isDrawerVisible={isDrawerVisible}
        setIsDrawerVisible={setIsDrawerVisible}
        navigation={navigation}
        isLocationDrawerVisible={isLocationDrawerVisible}
        setIsLocationDrawerVisible={setIsLocationDrawerVisible}
        onSelectDistrict={handleSelectDistrict}
        selectedDistrict={selectedDistrict}
      >
        <AppHeaderComponent
          onSearch={goToSearch}
          onMenu={() => setIsDrawerVisible(true)}
          onLocation={() => setIsLocationDrawerVisible(true)}
          selectedDistrict="உள்ளூர்"
        />
      </UniversalHeaderComponent>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Article Image/Video */}
        {hasImage && !isVideo && (
          <Image 
            source={{ uri: displayArticle.images || displayArticle.imageurl }} 
            style={styles.articleImage}
            resizeMode="cover"
          />
        )}
        
        {isVideo && (
          <View style={styles.videoPlaceholder}>
            <Ionicons name="play-circle" size={60} color="#fff" />
            <Text style={styles.videoText}>வீடியோ</Text>
          </View>
        )}

        {/* Article Content */}
        <View style={styles.contentContainer}>
          {/* Category Badge */}
          <View style={styles.categoryContainer}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {displayArticle.categrorytitle || displayArticle.catengtitle || 'செய்திகள்'}
              </Text>
            </View>
            <Text style={styles.dateText}>
              {displayArticle.standarddate || displayArticle.date || new Date().toLocaleDateString('ta-IN')}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.articleTitle}>
            {displayArticle.newstitle || displayArticle.title || 'தலைப்பு'}
          </Text>

          {/* Subtitle/Summary */}
          {displayArticle.subtitle && (
            <Text style={styles.subtitle}>
              {displayArticle.subtitle}
            </Text>
          )}

          {/* Article Body */}
          {displayArticle.content && (
            <Text style={styles.articleContent}>
              {displayArticle.content}
            </Text>
          )}

          {/* Author Info */}
          {displayArticle.author && (
            <View style={styles.authorContainer}>
              <Text style={styles.authorLabel}>ஆசிரியர்:</Text>
              <Text style={styles.authorName}>{displayArticle.author}</Text>
            </View>
          )}

          {/* Tags */}
          {displayArticle.tags && displayArticle.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              <Text style={styles.tagsLabel}>ஒட்டுகள்:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.tagsList}>
                  {displayArticle.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}
        </View>

        {/* Related News */}
        {relatedNews.length > 0 && (
          <View style={styles.relatedContainer}>
            <Text style={styles.relatedTitle}>தொடர்புடைய செய்திகள்</Text>
            {relatedNews.map((item, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.relatedItem}
                onPress={() => navigateToRelatedArticle(item)}
              >
                {item.images && (
                  <Image 
                    source={{ uri: item.images }} 
                    style={styles.relatedImage}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.relatedContent}>
                  <Text style={styles.relatedItemTitle} numberOfLines={2}>
                    {item.newstitle}
                  </Text>
                  <Text style={styles.relatedItemDate}>
                    {item.standarddate}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? vs(30) : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: vs(10),
    fontSize: scaledSizes.font.md,
    color: COLORS.subtext,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: s(20),
  },
  errorText: {
    marginTop: vs(10),
    fontSize: scaledSizes.font.lg,
    color: COLORS.text,
    textAlign: 'center',
  },
  backButton: {
    marginTop: vs(20),
    paddingHorizontal: s(20),
    paddingVertical: vs(10),
    backgroundColor: COLORS.primary,
    borderRadius: s(8),
  },
  backButtonText: {
    color: '#fff',
    fontSize: scaledSizes.font.md,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  headerActions: {
    flexDirection: 'row',
  },
  scrollView: {
    flex: 1,
  },
  articleImage: {
    width: '100%',
    height: vs(200),
    backgroundColor: '#f0f0f0',
  },
  videoPlaceholder: {
    width: '100%',
    height: vs(200),
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    color: '#fff',
    fontSize: scaledSizes.font.md,
    fontWeight: '600',
    marginTop: vs(8),
  },
  contentContainer: {
    padding: s(16),
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: vs(12),
  },
  categoryBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: s(12),
    paddingVertical: vs(6),
    borderRadius: s(16),
  },
  categoryText: {
    fontSize: scaledSizes.font.sm,
    fontWeight: '600',
    color: COLORS.primary,
  },
  dateText: {
    fontSize: scaledSizes.font.sm,
    color: COLORS.subtext,
  },
  articleTitle: {
    fontSize: scaledSizes.font.xl,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: scaledSizes.lineHeight.lg,
    marginBottom: vs(12),
  },
  subtitle: {
    fontSize: scaledSizes.font.md,
    color: COLORS.subtext,
    lineHeight: scaledSizes.lineHeight.md,
    marginBottom: vs(16),
    fontStyle: 'italic',
  },
  articleContent: {
    fontSize: scaledSizes.font.md,
    color: COLORS.text,
    lineHeight: scaledSizes.lineHeight.lg,
    marginBottom: vs(20),
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(16),
  },
  authorLabel: {
    fontSize: scaledSizes.font.sm,
    color: COLORS.subtext,
    marginRight: s(8),
  },
  authorName: {
    fontSize: scaledSizes.font.sm,
    fontWeight: '600',
    color: COLORS.text,
  },
  tagsContainer: {
    marginBottom: vs(20),
  },
  tagsLabel: {
    fontSize: scaledSizes.font.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: vs(8),
  },
  tagsList: {
    flexDirection: 'row',
  },
  tag: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: s(12),
    paddingVertical: vs(4),
    borderRadius: s(12),
    marginRight: s(8),
  },
  tagText: {
    fontSize: scaledSizes.font.sm,
    color: COLORS.primary,
  },
  relatedContainer: {
    marginTop: vs(20),
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: vs(16),
    paddingHorizontal: s(16),
  },
  relatedTitle: {
    fontSize: scaledSizes.font.lg,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: vs(12),
  },
  relatedItem: {
    flexDirection: 'row',
    marginBottom: vs(12),
    backgroundColor: '#fff',
    borderRadius: s(8),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  relatedImage: {
    width: s(80),
    height: vs(60),
    backgroundColor: '#f0f0f0',
  },
  relatedContent: {
    flex: 1,
    padding: s(12),
  },
  relatedItemTitle: {
    fontSize: scaledSizes.font.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: vs(4),
  },
  relatedItemDate: {
    fontSize: scaledSizes.font.xs,
    color: COLORS.subtext,
  },
  bottomSpacer: {
    height: vs(20),
  },
});
