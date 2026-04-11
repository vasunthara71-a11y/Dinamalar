import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Linking,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { s, vs } from '../utils/scaling';
import { ms } from 'react-native-size-matters';
import { COLORS, FONTS } from '../utils/constants';

import UniversalHeaderComponent from '../components/UniversalHeaderComponent';
import AppHeaderComponent from '../components/AppHeaderComponent';

const API_URL = 'https://api-st.dinamalar.com/todayspecial';

const CATEGORIES = [
  { label: 'All',          key: 'all',          match: null },
  { label: 'Spirituality', key: 'spirituality',  match: ['anmegam-spirituality', 'hindu-kathikal', 'anmeegam', 'temple.dinamalar', 'astrology'] },
  { label: 'Science',      key: 'science',       match: ['ariviyal-malar', 'ariviyal', 'technology', 'startup'] },
  { label: 'Agriculture',  key: 'agriculture',   match: ['vivasaya-malar', 'vivasaya_malar', 'agriculture'] },
  { label: 'News',         key: 'news',          match: ['news', 'kalvimalar', 'business', 'dinam-dinam'] },
  { label: 'Culture',      key: 'culture',       match: ['weekly', 'malarkal', 'special', 'lifestyle', 'photos', 'cinema'] },
];

const matchesCategory = (url = '', matchList) => {
  if (!matchList) return true;
  return matchList.some((pattern) => url.includes(pattern));
};

// ─────────────────────────────────────────────────────────────────────────────
// Actual URLs from the API (observed):
//
// ARTICLE (has numeric ID at end)  →  NewsDetailsScreen
//   https://www.dinamalar.com/anmegam-spirituality/hindu-kathikal/anmeegamalar-xxx/25175
//   https://www.dinamalar.com/anmegam-spirituality/sathguruvin-anantha-alai/xxx/3854536
//   https://www.dinamalar.com/malarkal/vara-malar-weekly-magazine/varamalar-xxx/69131
//   https://www.dinamalar.com/malarkal/vara-malar-weekly-magazine/varamalar-xxx/68820
//   https://www.dinamalar.com/malarkal/vara-malar-weekly-magazine/varamalar-xxx/68629
//
// SECTION (no numeric ID)  →  CommonSectionScreen
//   https://www.dinamalar.com/malarkal/vara-malar-weekly-magazine
//   https://www.dinamalar.com/malarkal/vivasaya-malar-agriculture-news-tamil-nadu
//   https://www.dinamalar.com/malarkal/ariviyal-malar-science-articles
//   https://www.dinamalar.com/malarkal/siruvar-malar-childrens-magazine
//   https://www.dinamalar.com/weekly/pokkisham
//   https://www.dinamalar.com/astrology/weeklyrasi
//   https://www.dinamalar.com/astrology/monthlyrasipplan
//   https://www.dinamalar.com/special/lifestyle/health
//   https://www.dinamalar.com/special/lifestyle/fashion
//   https://www.dinamalar.com/special/lifestyle/tours
//   https://www.dinamalar.com/special/lifestyle/beauty
//   https://www.dinamalar.com/special/technology
//   https://www.dinamalar.com/special/technology/startup
//   https://www.dinamalar.com/special/useful-information
//   https://www.dinamalar.com/news/kalvimalar
//   https://www.dinamalar.com/news/business-gst-doubts
//   https://www.dinamalar.com/news/business-thousand-doubts
//   https://www.dinamalar.com/dinam-dinam/on-the-same-day
//   https://www.dinamalar.com/photos/web-stories/lifestyle
//   https://cinema.dinamalar.com/movie-review/3490/The-Greatest-Of-All-Time/
//   https://www.dinamalar.com/search/xxx
//   https://temple.dinamalar.com/news_detail.php?id=146215
// ─────────────────────────────────────────────────────────────────────────────

const resolveNavigation = (url = '', navigation) => {
  if (!url) return;
  
  // Debug: Log all URLs to see patterns
  console.log('🌐 Processing URL:', url);

  // ── STEP 1: Spirituality / Anmegam ───────────────────────────────────────────
  // Handle Vinayagar Vadivangal (most specific)
  if (url.includes('vinayagarin-vadivangal') || url.includes('vinayagarperumanin') || url.includes('vadivangal')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'ஆன்மீகம்',
      apiEndpoint: '/anmegammain?cat=1',
      allTabLink: '/anmegammain?cat=1',
      initialTabId: '65', // Hindu stories (kathikal) subcategory ID
    });
    return;
  }

  // Handle Hindu subcategories first (more specific)
  if (url.includes('anmegam-spirituality/hindu-kathikal')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'ஆன்மீகம்',
      apiEndpoint: '/anmegammain?cat=1',
      allTabLink: '/anmegammain?cat=1',
      initialTabId: '65', // Hindu stories (kathikal) subcategory ID
    });
    return;
  }

  if (url.includes('anmegam-spirituality/hindu-tamil-news')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'ஆன்மீகம்',
      apiEndpoint: '/anmegammain?cat=1',
      allTabLink: '/anmegammain?cat=1',
      initialTabId: '64', // Hindu news subcategory ID
    });
    return;
  }

  if (url.includes('anmegam-spirituality/hindu-information')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'ஆன்மீகம்',
      apiEndpoint: '/anmegammain?cat=1',
      allTabLink: '/anmegammain?cat=1',
      initialTabId: '54', // Hindu information subcategory ID
    });
    return;
  }

  if (url.includes('anmegam-spirituality/hindu-katturaikal')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'ஆன்மீகம்',
      apiEndpoint: '/anmegammain?cat=1',
      allTabLink: '/anmegammain?cat=1',
      initialTabId: '52', // Hindu articles subcategory ID
    });
    return;
  }

  // Handle main religion sections
  if (url.includes('anmegam-spirituality/hindu')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'ஆன்மீகம்',
      apiEndpoint: '/anmegam',
      allTabLink: '/anmegam',
      initialTabId: 'hindu', // Hindu main tab ID
    });
    return;
  }

  if (url.includes('anmegam-spirituality/muslim')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'ஆன்மீகம்',
      apiEndpoint: '/anmegam',
      allTabLink: '/anmegam',
      initialTabId: 'islam', // Islam tab ID
    });
    return;
  }

  if (url.includes('anmegam-spirituality/christians')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'ஆன்மீகம்',
      apiEndpoint: '/anmegam',
      allTabLink: '/anmegam',
      initialTabId: 'christian', // Christian tab ID
    });
    return;
  }

  // Handle other specific spirituality sections
  if (url.includes('anmegam-spirituality/sathguruvin-anantha-alai')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'ஆன்மீகம்',
      apiEndpoint: '/anmegam',
      allTabLink: '/anmegam',
      initialTabId: '1226', // Sathguruvin Anantha Alai tab ID
    });
    return;
  }

  if (url.includes('anmegam-spirituality/hindu-tamil-spiritual-thoughts')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'ஆன்மீகம்',
      apiEndpoint: '/anmegam',
      allTabLink: '/anmegam',
      initialTabId: 'aanmegasinthanai', // Spiritual thoughts tab ID
    });
    return;
  }

  if (url.includes('anmegam-spirituality')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'ஆன்மீகம்',
      apiEndpoint: '/anmegam',
      allTabLink: '/anmegam',
      initialTabId: 'hindu', // Default to Hindu
    });
    return;
  }
  
  // Only check general hindu-kathikal if not already handled above
  if (url.includes('hindu-kathikal')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'ஆன்மீகம்',
      apiEndpoint: '/anmegammain?cat=1',
      allTabLink: '/anmegammain?cat=1',
      initialTabId: '65', // Hindu stories (kathikal) subcategory ID
    });
    return;
  }

  // ── STEP 2: Anbudan Andharangam (handle before numeric ID check)
  if (url.includes('anbudan-andharangam') || url.includes('anbudan_andharangam')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'அன்புடன் அந்தரங்கம்',
      apiEndpoint: '/special',
      allTabLink: '/special',
    });
    return;
  }

  // ── STEP 3: If URL has a numeric news ID → go directly to NewsDetailsScreen
  // Pattern: ends with /12345 or /12345/ (but NOT cinema.dinamalar which has /3490/ in middle)
  const isCinema = url.includes('cinema.dinamalar');
  const newsIdMatch = !isCinema && url.match(/\/(\d{4,})(?:\/[^/]*)?$/);
  if (newsIdMatch) {
    const newsId = newsIdMatch[1];
    const slugMatch = url.match(/dinamalar\.com(\/[^?#]*)/);
    const slug = slugMatch ? slugMatch[1] : '';
    navigation.navigate('NewsDetailsScreen', {
      newsId,
      newsItem: { id: newsId, newsid: newsId },
      slug,
    });
    return;
  }

  // ── STEP 3: temple.dinamalar external link ────────────────────────────────
  if (url.includes('temple.dinamalar')) {
    // temple is a subdomain — open in browser as it's a separate site
    Linking.openURL(url);
    return;
  }

  // ── STEP 3: cinema.dinamalar ──────────────────────────────────────────────
  if (isCinema || url.includes('movie-review')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'சினிமா',
      apiEndpoint: '/cinema',
      allTabLink:  '/cinema',
    });
    return;
  }

  // ── STEP 4: Search URLs ───────────────────────────────────────────────────
  if (url.includes('/search/') || url.includes('search')) {
    console.log('🔍 Search URL detected:', url);
    
    let query = '';
    
    // Handle different search URL patterns
    if (url.includes('/search/')) {
      query = url.split('/search/')[1] || '';
      console.log('🔍 Extracted from /search/ pattern:', query);
    } else if (url.includes('?q=')) {
      // Handle ?q=query parameter
      const queryParams = url.split('?')[1];
      const qParam = queryParams?.split('&').find(param => param.startsWith('q='));
      query = qParam ? qParam.substring(2) : '';
      console.log('🔍 Extracted from ?q= pattern:', query);
    } else if (url.includes('search/')) {
      // Handle search/ pattern without leading slash
      const parts = url.split('search/');
      query = parts[parts.length - 1] || '';
      console.log('🔍 Extracted from search/ pattern:', query);
    }
    
    // Clean up the query
    query = decodeURIComponent(query).replace(/[?#/].*$/, '').replace(/_/g, ' ');
    console.log('🔍 Cleaned query:', query);
    
    if (query.trim()) {
      console.log('🔍 Navigating to SearchScreen with searchTerm:', query);
      navigation.navigate('SearchScreen', { 
        searchTerm: query, // Use searchTerm to match SearchScreen expectation
        searchUrl: url // Pass the original URL as well
      });
    } else {
      console.log('🔍 No valid query found, not navigating');
    }
    return;
  }

  // ── STEP 5: Astrology ─────────────────────────────────────────────────────
  if (url.includes('/astrology/weeklyrasi')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'ஜோசியம்',
      apiEndpoint: '/joshiyam',
      allTabLink:  '/joshiyam',
      initialTabId: 'weeklyrasi',
    });
    return;
  }
  if (url.includes('/astrology/monthlyrasipplan')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'ஜோசியம்',
      apiEndpoint: '/joshiyam',
      allTabLink:  '/joshiyam',
      initialTabId: 'monthlyrasipplan',
    });
    return;
  }
  if (url.includes('/astrology/')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'ஜோசியம்',
      apiEndpoint: '/joshiyam',
      allTabLink:  '/joshiyam',
    });
    return;
  }

  // ── STEP 6: Weekly magazines ──────────────────────────────────────────────
  if (url.includes('/weekly/')) {
    const weeklySlug = url.split('/weekly/')[1]?.split('/')[0] || '';
    const weeklyTitleMap = {
      pokkisham:                   { id: '650', title: 'பொக்கிஷம்' },
      nalam:                       { id: '11', title: 'நலம்' },
      chellame:                    { id: '1666', title: 'செல்லமே' },
      'kanavu-illam':              { id: 'kanavuillam', title: 'கனவு இல்லம்' },
      aviyal:                      { id: '1719', title: 'அவியல்' },
      kadayani:                    { id: '1607', title: 'கடையாணி' },
      pattam:                      { id: '1360', title: 'பட்டம்' },
      nijakathai:                  { id: '644', title: 'நிஜக்கதை' },
      'virunthinar-paguthi':       { id: '629', title: 'விருந்தினர் பகுதி' },
      'chithra-mithra-tirupur':    { id: '1115', title: 'சித்ரா...மித்ரா (திருப்பூர்)' },
      'chithra-mithra-coimbatore': { id: '1113', title: 'சித்ரா... மித்ரா ( கோவை)' },
      'sinthanai-kalam':           { id: '1363', title: 'சிந்தனைக் களம்' },
      'thalaiyangam':              { id: '1408', title: 'தலையங்கம்' },
      'uraththa-kural':            { id: '1568', title: 'உரத்த குரல்' },
      'sinthipoma':                { id: '1645', title: 'சிந்திப்போமா' },
      'tech-dairy':                { id: '1493', title: 'டெக் டைரி' },
    };
    
    const magazineInfo = weeklyTitleMap[weeklySlug];
    if (magazineInfo) {
      navigation.navigate('CommonSectionScreen', {
        screenTitle: magazineInfo.title,
        apiEndpoint: '/varavaram',
        allTabLink:  '/varavaram',
        initialTabId: magazineInfo.id,
      });
    } else {
      // Default to All tab for unknown weekly magazines
      navigation.navigate('CommonSectionScreen', {
        screenTitle: 'வாராந்திர இதழ்கள்',
        apiEndpoint: '/varavaram',
        allTabLink:  '/varavaram',
      });
    }
    return;
  }

  // ── STEP 7: Malarkal (section pages without numeric ID) ──────────────────
  if (url.includes('/malarkal/vara-malar')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'வாரமலர்',
      apiEndpoint: '/malargal',
      allTabLink:  '/malargal',
      initialTabId: '6035', // Weekly magazine tab ID
    });
    return;
  }
  if (url.includes('/malarkal/vivasaya-malar') || url.includes('vivasaya-malar')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'விவசாய மலர்',
      apiEndpoint: '/malargal',
      allTabLink:  '/malargal',
      initialTabId: '7', // Agriculture magazine tab ID
    });
    return;
  }
  if (url.includes('/malarkal/ariviyal-malar') || url.includes('ariviyal-malar-science')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'அறிவியல் மலர்',
      apiEndpoint: '/malargal',
      allTabLink:  '/malargal',
      initialTabId: '1294', // Science magazine tab ID
    });
    return;
  }
  if (url.includes('/malarkal/siruvar-malar') || url.includes('siruvar-malar')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'சிறுவர் மலர்',
      apiEndpoint: '/malargal',
      allTabLink:  '/malargal',
      initialTabId: '3', // Children's magazine tab ID
    });
    return;
  }
  if (url.includes('/malarkal/velai-vaippu') || url.includes('velai-vaippu')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'வேலை வாய்ப்பு மலர்',
      apiEndpoint: '/malargal',
      allTabLink:  '/malargal',
      initialTabId: '6', // Employment magazine tab ID
    });
    return;
  }
  if (url.includes('/malarkal/')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'வாரமலர்',
      apiEndpoint: '/malargal',
      allTabLink:  '/malargal',
      initialTabId: '6035', // Default to weekly magazine
    });
    return;
  }

  // ── STEP 8: Special / Lifestyle ───────────────────────────────────────────
  if (url.includes('/special/lifestyle/health')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'ஆரோக்கியம்',
      apiEndpoint: '/special',
      allTabLink:  '/special',
    });
    return;
  }
  if (url.includes('/special/lifestyle/fashion')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'பேஷன்',
      apiEndpoint: '/special',
      allTabLink:  '/special',
    });
    return;
  }
  if (url.includes('/special/lifestyle/tours')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'சுற்றுலா',
      apiEndpoint: '/special',
      allTabLink:  '/special',
    });
    return;
  }
  if (url.includes('/special/lifestyle/beauty')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'அழகு குறிப்புகள்',
      apiEndpoint: '/special',
      allTabLink:  '/special',
    });
    return;
  }
  if (url.includes('/special/technology/startup') || url.includes('/special/technology')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'தொழில்நுட்பம்',
      apiEndpoint: '/special',
      allTabLink:  '/special',
    });
    return;
  }
  if (url.includes('/special/useful-information')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'அறிந்துகொள்வோம்',
      apiEndpoint: '/special',
      allTabLink:  '/special',
    });
    return;
  }
  if (url.includes('/special/lifestyle')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'லைஃப்ஸ்டைல்',
      apiEndpoint: '/special',
      allTabLink:  '/special',
    });
    return;
  }
  if (url.includes('/special/')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'ஸ்பெஷல்',
      apiEndpoint: '/special',
      allTabLink:  '/special',
    });
    return;
  }

  // ── STEP 9: Photos / Web stories ─────────────────────────────────────────
  if (url.includes('/photos/web-stories') || url.includes('web-stories')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'போட்டோ',
      apiEndpoint: '/photodata',
      allTabLink:  '/photodata',
    });
    return;
  }
  if (url.includes('/photos/')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'போட்டோ',
      apiEndpoint: '/photodata',
      allTabLink:  '/photodata',
    });
    return;
  }

  // ── STEP 10: News sections ────────────────────────────────────────────────
  if (url.includes('/news/kalvimalar') || url.includes('kalvimalar')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'கல்விமலர்',
      apiEndpoint: '/kalvimalar',
      allTabLink:  '/kalvimalar',
    });
    return;
  }
  if (url.includes('/news/business') || url.includes('business-gst-doubts') || url.includes('business-thousand-doubts') || url.includes('business-gst') || url.includes('business-thousand')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'வர்த்தகம்',
      apiEndpoint: '/varthagam',
      allTabLink:  '/varthagam',
      initialTabId: url.includes('business-gst-doubts') || url.includes('business-gst') ? '1718' : url.includes('business-thousand-doubts') || url.includes('business-thousand') ? '1714' : '1605',
    });
    return;
  }
  if (url.includes('/news/')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'செய்திகள்',
      apiEndpoint: '/news',
      allTabLink:  '/news',
    });
    return;
  }

  // ── STEP 11: Dinam Dinam ──────────────────────────────────────────────────
  if (url.includes('/dinam-dinam/') || url.includes('on-the-same-day')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'தினம் தினம்',
      apiEndpoint: '/dinamdinam',
      allTabLink:  '/dinamdinam',
    });
    return;
  }

  // ── STEP 12: NRI / World Tamil ────────────────────────────────────────────
  if (url.includes('nri') || url.includes('world-tamil')) {
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'உலக தமிழர்',
      apiEndpoint: '/nrimain',
      allTabLink:  '/nrimain',
    });
    return;
  }

  // ── FALLBACK: extract path and navigate ───────────────────────────────────
  const pathMatch = url.match(/dinamalar\.com(\/[^?#]*)/);
  if (pathMatch) {
    const path = pathMatch[1];
    console.log('🔧 Fallback: Using path navigation for:', path);
    navigation.navigate('CommonSectionScreen', {
      screenTitle: 'செய்திகள்',
      apiEndpoint: path,
      allTabLink: path,
    });
    return;
  }

  // Last resort — debug and open in browser
  console.log('🚨 No navigation match found for URL:', url);
  Linking.openURL(url);
};

// ─────────────────────────────────────────────────────────────────────────────
const SpecialTodayScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { screenTitle = 'சிறப்பு இன்று' } = route.params || {};

  const [allData, setAllData]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  // Header state variables
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isLocationDrawerVisible, setIsLocationDrawerVisible] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('உள்ளூர்');

  // Header functions
  const goToSearch = () => navigation.navigate('SearchScreen');

  const handleMenuPress = () => {
    setIsDrawerVisible(true);
  };

  const handleSearchPress = () => {
    navigation.navigate('SearchScreen');
  };

  const handleLocationPress = () => {
    setIsLocationDrawerVisible(true);
  };

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

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(API_URL);
      const json     = await response.json();
      setAllData(json?.newslist ?? []);
    } catch (err) {
      console.error('SpecialTodayScreen fetch error:', err);
      setError('தரவு ஏற்றுவதில் பிழை ஏற்பட்டது.');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useCallback(() => {
    const cat = CATEGORIES.find((c) => c.key === activeCategory);
    if (!cat || cat.key === 'all') return allData;
    return allData
      .map((group) => ({
        ...group,
        data: (group.data || []).filter((item) =>
          matchesCategory(item.url, cat.match)
        ),
      }))
      .filter((group) => group.data.length > 0);
  }, [allData, activeCategory]);

  const renderGroup = ({ item: group }) => {
    const items = group.data || [];
    return (
      <View style={styles.groupContainer}>
        <Text style={styles.dateText}>{group.name}</Text>
        <View style={styles.dateLine} />
        {items.map((item, idx) => (
          <TouchableOpacity
            key={`${group.name}-${idx}`}
            style={styles.itemRow}
            onPress={() => resolveNavigation(item.url, navigation)}
            activeOpacity={0.7}
          >
            <View style={styles.bullet} />
            <Text style={styles.itemText}>{item.key}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryText}>மீண்டும் முயற்சி</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayData = filteredData();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <UniversalHeaderComponent
        statusBarStyle="dark-content"
        statusBarBackgroundColor="#fff"
        onMenuPress={handleMenuPress}
        onNotification={() => {}}
        notifCount={0}
        isDrawerVisible={isDrawerVisible}
        setIsDrawerVisible={setIsDrawerVisible}
        navigation={navigation}
        isLocationDrawerVisible={isLocationDrawerVisible}
        setIsLocationDrawerVisible={setIsLocationDrawerVisible}
        onSelectDistrict={handleSelectDistrict}
      >
        <AppHeaderComponent
          onMenu={handleMenuPress}
          onSearch={handleSearchPress}
          onLocation={handleLocationPress}
          selectedDistrict={selectedDistrict}
        />
      </UniversalHeaderComponent>

      {/* ── Category Tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsWrapper}
        contentContainerStyle={styles.tabsContent}
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => setActiveCategory(cat.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Content ── */}
      {displayData.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>தரவு இல்லை</Text>
        </View>
      ) : (
        <FlatList
          data={displayData}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderGroup}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default SpecialTodayScreen;

const styles = StyleSheet.create({
 container: {
    flex: 1,
    backgroundColor: COLORS.background || '#f2f2f2',
    paddingTop: Platform.OS === 'android' ? vs(0) : 20,
  },  centered:   { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' },

  tabsWrapper:   { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
  tabsContent:   { paddingHorizontal: s(10),gap: s(8),  alignItems: 'center' },
  tabBtn:        { paddingHorizontal: s(18), paddingVertical: vs(7), borderRadius: s(25), borderWidth: 1.5, borderColor: COLORS.primary, backgroundColor: '#ffffff' },
  tabBtnActive:  { backgroundColor: COLORS.primary },
  tabText:       { fontSize: ms(14), color: COLORS.primary,  fontFamily: FONTS.muktaMalar.semibold },
  tabTextActive: { fontSize: ms(14), color: '#ffffff',        fontFamily: FONTS.muktaMalar.bold },

  listContent: { paddingBottom: vs(30) },

  groupContainer: { paddingHorizontal: s(16), paddingTop: vs(22), paddingBottom: vs(2) },
  dateText:       { fontSize: ms(16), fontFamily: FONTS.muktaMalar.bold, color: COLORS.primary, marginBottom: vs(6) },
  dateLine:       { height: vs(2.5), width: s(72), backgroundColor: COLORS.primary, marginBottom: vs(8) },

  itemRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: vs(13), borderBottomWidth: 0.8, borderBottomColor: '#e0e0e0' },
  bullet:   { width: s(8), height: s(8), borderRadius: s(4), backgroundColor: COLORS.primary, marginRight: s(12), marginLeft: s(2) },
  itemText: { flex: 1, fontSize: ms(15), color: '#1a1a1a', fontFamily: FONTS.muktaMalar.regular, lineHeight: ms(23) },

  errorText:  { fontSize: ms(14), color: '#e74c3c', fontFamily: FONTS.muktaMalar.regular, marginBottom: vs(12), textAlign: 'center' },
  retryBtn:   { backgroundColor: COLORS.primary, paddingHorizontal: s(20), paddingVertical: vs(8), borderRadius: s(8) },
  retryText:  { color: '#fff', fontSize: ms(14), fontFamily: FONTS.muktaMalar.semibold },
  emptyText:  { fontSize: ms(14), color: '#888', fontFamily: FONTS.muktaMalar.regular },
});