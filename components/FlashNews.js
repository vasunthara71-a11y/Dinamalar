import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
} from 'react-native';
import { mainApi } from '../config/api';
import { COLORS, FONTS } from '../utils/constants';
import { s, vs, ms } from '../utils/scaling';
import { Ionicons } from '@expo/vector-icons';
 
const FlashNews = ({ onPress }) => {
  const [flashNews, setFlashNews] = useState([]);
  const [advertisements, setAdvertisements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef(null);

  // Fetch flash news data and advertisements
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch flash news
        const flashResponse = await mainApi.get('/flash');
        console.log('Flash News API Response:', flashResponse.data);
        
        // Try different possible data structures
        let newsData = [];
        
        // Try structure 2: data.Yflash (this is the correct structure based on API response)
        if (flashResponse.data?.flash?.Yflash && Array.isArray(flashResponse.data.flash.Yflash)) {
          newsData = flashResponse.data.flash.Yflash;
          console.log('Using flash.Yflash structure:', newsData.length, 'items');
        }
        // Try structure 1: data.flash.Yflash (fallback)
        else if (flashResponse.data?.flash?.Yflash) {
          newsData = flashResponse.data.flash.Yflash;
          console.log('Using flash.Yflash structure:', newsData.length, 'items');
        }
        // Try structure 3: data.flash (if it's an array)
        else if (Array.isArray(flashResponse.data?.flash)) {
          newsData = flashResponse.data.flash;
          console.log('Using flash array structure:', newsData.length, 'items');
        }
        // Try structure 4: data (if it's an array)
        else if (Array.isArray(flashResponse.data)) {
          newsData = flashResponse.data;
          console.log('Using data array structure:', newsData.length, 'items');
        }
        // Try structure 5: data.flash.data
        else if (flashResponse.data?.flash?.data) {
          newsData = flashResponse.data.flash.data;
          console.log('Using flash.data structure:', newsData.length, 'items');
        }
        
        console.log('Processed Flash News Data:', newsData);
        console.log('News data length:', newsData.length);
        
        // Debug: Log first few items to understand structure
        if (newsData.length > 0) {
          console.log('First news item structure:', newsData[0]);
          console.log('First news item keys:', Object.keys(newsData[0]));
          console.log('First news item link:', newsData[0].link);
          console.log('First news item id:', newsData[0].id);
        }
        
        // If no data from API, use mock data for testing
        if (newsData.length === 0) {
          console.log('No flash news data from API, using mock data');
          newsData = [
            {
              newsid: 'mock-1',
              newstitle: 'தமிழகம்: முக்கிய செய்திகள் - உடனடனவே புதுப்பிக்கவும்',
              title: 'தமிழகம்: முக்கிய செய்திகள் - உடனடனவே புதுப்பிக்கவும்',
              slug: 'tamilagam-breaking-news',
              time_ago: '2 நிமிடங்கள் முன்பு',
              ago: '2 நிமிடங்கள் முன்பு',
              category: 'தமிழகம்',
              maincat: 'தமிழகம்',
              images: 'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400',
              largeimages: 'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400',
              newsdescription: 'தமிழகம் மாநிலத்தில் இன்று முக்கிய செய்திகள் பல்வரவுள் வெளியுகின்றனர். இந்த செய்திகள் தொடர்ப்படியாக மக்கள் அனைத்துக்கொள்ள வரும்.',
              standarddate: '2025-03-29',
              date: '2025-03-29'
            },
            {
              newsid: 'mock-2', 
              newstitle: 'இந்தியா: மத்திய அரசு அறிவிப்பு - இன்று முக்கிய தகவல்கள்',
              title: 'இந்தியா: மத்திய அரசு அறிவிப்பு - இன்று முக்கிய தகவல்கள்',
              slug: 'india-government-announcement',
              time_ago: '15 நிமிடங்கள் முன்பு',
              ago: '15 நிமிடங்கள் முன்பு',
              category: 'இந்தியா',
              maincat: 'இந்தியா',
              images: 'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400',
              largeimages: 'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400',
              newsdescription: 'இந்திய மத்திய அரசு இன்று முக்கிய அறிவிப்புகளை வெளியுத்துள்ளது. இந்த அறிவிப்புகள் நாட்டில் பல்வரவுள் வெளியுகின்றனர்.',
              standarddate: '2025-03-29',
              date: '2025-03-29'
            },
            {
              newsid: 'mock-3',
              newstitle: 'உலகம்: சர்வதேச செய்திகள் - உலகளவில் இன்றைய முக்கிய நிகழ்வுகள்',
              title: 'உலகம்: சர்வதேச செய்திகள் - உலகளவில் இன்றைய முக்கிய நிகழ்வுகள்',
              slug: 'world-breaking-news',
              time_ago: '1 மணி நேரம் முன்பு',
              ago: '1 மணி நேரம் முன்பு',
              category: 'உலகம்',
              maincat: 'உலகம்',
              images: 'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400',
              largeimages: 'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400',
              newsdescription: 'உலகளவில் இன்று முக்கிய சர்வதேச நிகழ்வுகள் பல்வரவுள் வெளியுகின்றனர். இந்த நிகழ்வுகள் உலக சந்தையை பாதிக்கின்றனர்.',
              standarddate: '2025-03-29',
              date: '2025-03-29'
            }
          ];
        }
        
        setFlashNews(newsData);

        // Skip advertisements fetching for now - endpoint doesn't exist
        // try {
        //   const adResponse = await mainApi.get('/advertisements');
        //   console.log('Advertisement API Response:', adResponse.data);
        //   const adData = adResponse.data?.advertisements || adResponse.data || [];
        //   console.log('Advertisement Data:', adData);
        //   setAdvertisements(Array.isArray(adData) ? adData : []);
        // } catch (adError) {
        //   console.warn('Advertisement API failed, using empty array:', adError.message);
        //   setAdvertisements([]);
        // }

      } catch (error) {
        console.error('Error fetching flash news:', error);
        console.error('Error details:', error.response?.data || error.message);
        setFlashNews([]);
        setAdvertisements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Refresh data every 5 minutes
    const refreshInterval = setInterval(fetchData, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);

  // Create combined array of news and ads
  const combinedContent = [];
  console.log('Creating combined content. Flash news length:', flashNews.length);
  
  flashNews.forEach((news, index) => {
    console.log(`Processing news item ${index}:`, news.title || news.newstitle);
    combinedContent.push({ type: 'news', data: news });
    // Add advertisement after every 2 news items
    if (index > 0 && (index + 1) % 2 === 0 && advertisements.length > 0) {
      const adIndex = Math.floor(index / 2) % advertisements.length;
      combinedContent.push({ 
        type: 'advertisement', 
        data: advertisements[adIndex] || advertisements[0] 
      });
    }
  });

  console.log('Final combined content length:', combinedContent.length);
  console.log('Current index:', currentIndex, 'Total items:', combinedContent.length);

  // If no ads available, add a placeholder ad
  if (advertisements.length === 0 && flashNews.length > 2) {
    combinedContent.splice(2, 0, { 
      type: 'advertisement', 
      data: { 
        title: 'Advertisement Space',
        type: 'placeholder'
      } 
    });
  }

  // Auto-rotate content every 10 seconds
  useEffect(() => {
    if (combinedContent.length <= 1) return;

    const startRotation = () => {
      intervalRef.current = setInterval(() => {
        // Fade out
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          // Change content
          setCurrentIndex((prev) => (prev + 1) % combinedContent.length);
          
          // Fade in
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        });
      }, 10000); // Change every 10 seconds
    };

    startRotation();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [combinedContent.length, fadeAnim]);

  const currentContent = combinedContent[currentIndex];

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading flash news...</Text>
        </View>
      </View>
    );
  }

  if (!combinedContent.length || !currentContent) {
    return (
      <View style={styles.container}>
        <View style={styles.flashContainer}>
          <View style={styles.headerContainer}>
            <Ionicons name="flash" size={s(16)} color={COLORS.primary} />
            <Text style={styles.flashLabel}>FLASH</Text>
          </View>
          <Text style={styles.newsTitle}>
            {loading ? 'Loading flash news...' : 'No flash news available'}
          </Text>
        </View>
      </View>
    );
  }

  if (currentContent.type === 'news') {
    const currentNews = currentContent.data;
    return (
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.flashContainer}
          onPress={() => {
            console.log('Flash News clicked - Item data:', currentNews);
            console.log('Flash News clicked - Item ID:', currentNews.id || currentNews.newsid);
            console.log('Flash News clicked - Item title:', currentNews.title || currentNews.newstitle);
            console.log('Flash News clicked - Item link:', currentNews.link);
            console.log('Flash News clicked - All keys:', Object.keys(currentNews));
            console.log('Flash News clicked - target field:', currentNews.target);
            // Try to construct a proper news link if link is generic
            const newsLink = currentNews.link;
            if (newsLink && newsLink.includes('latestmain')) {
              console.log('Generic link detected, using ID to construct proper link');
              // Construct a proper news article link using the ID
              const properLink = `https://www.dinamalar.com/news/${currentNews.id}`;
              console.log('Constructed link:', properLink);
              if (onPress) onPress({...currentNews, link: properLink});
            } else {
              if (onPress) onPress(currentNews);
            }
          }}
          activeOpacity={0.8}
        >
          {/* Flash icon and label */}
          {/* <View style={styles.headerContainer}>
            <Ionicons name="flash" size={s(16)} color={COLORS.primary} />
            <Text style={styles.flashLabel}>FLASH</Text>
          </View> */}

          {/* News content */}
          <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
            <Text style={styles.newsTitle} numberOfLines={2}>
              {currentNews.title || currentNews.newstitle || ''}
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    );
  }

  // Fallback for any other content type
  // return (
  //   <View style={styles.flashContainer}>
  //     <View style={styles.headerContainer}>
  //       <Ionicons name="flash" size={s(16)} color={COLORS.primary} />
  //       <Text style={styles.flashLabel}>FLASH</Text>
  //     </View>
  //     <Text style={styles.newsTitle}>
  //       No content available
  //     </Text>
  //   </View>
  // );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: vs(8),
  },
  flashContainer: {
    backgroundColor: '#ffd800', // Yellow background
    borderColor: '#ffd800',
    borderWidth: 1,
    justifyContent: 'center',
  },
  adContainer: {
    backgroundColor: '#f8f9fa', // Light gray background for ads
    borderColor: '#e9ecef',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(4),
    // paddingHorizontal: s(12),
    paddingTop: vs(4),
  },
  flashLabel: {
    fontFamily: FONTS.muktaMalar.bold,
    fontSize: ms(13),
    color: COLORS.primary,
    marginLeft: s(4),
    letterSpacing: 1,
    textAlign: "center"
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: s(12),
  },
  newsTitle: {
    fontFamily: FONTS.muktaMalar.semibold,
    fontSize: ms(13),
    color: '#000000',
    lineHeight: vs(18),
    textAlign: "center",
    paddingVertical: ms(5),
    fontWeight: "600"
  },
  loadingContainer: {
    backgroundColor: '#e2e2e2',
    borderColor: '#e2e2e2',
    borderWidth: 1,
    borderRadius: s(8),
    padding: s(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: FONTS.muktaMalar.regular,
    fontSize: ms(14),
    color: '#666666',
  },
  placeholderAd: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderStyle: 'dashed',
    borderRadius: s(4),
    padding: s(16),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: vs(80),
  },
  placeholderText: {
    fontFamily: FONTS.muktaMalar.medium,
    fontSize: ms(14),
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: vs(4),
  },
  placeholderSubtext: {
    fontFamily: FONTS.muktaMalar.regular,
    fontSize: ms(12),
    color: '#adb5bd',
    textAlign: 'center',
  },
});

export default FlashNews;
