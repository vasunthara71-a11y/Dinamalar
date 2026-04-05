import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StatusBar,
  RefreshControl,
  Image,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { ms, s, vs } from '../utils/scaling';
import { COLORS, FONTS, NewsCard as NewsCardStyles } from '../utils/constants';
import { useFontSize } from '../context/FontSizeContext';
import NewsCard from '../components/NewsCard';
import UniversalHeaderComponent from '../components/UniversalHeaderComponent';
import AppHeaderComponent from '../components/AppHeaderComponent';
import DrawerMenu from '../components/DrawerMenu';
import LocationDrawer from '../components/LocationDrawer';
import { useFocusEffect } from '@react-navigation/native';
import { EditorChoice } from '../assets/svg/Icons';

// --- Main Screen ---------------------------------------------------------------
export default function EditorChoiceScreen({ navigation }) {
    const PALETTE = {
    primary: '#096dd2',
    grey100: '#F9FAFB',
    grey200: '#F4F6F8',
    grey300: '#DFE3E8',
    grey400: '#C4CDD5',
    grey500: '#919EAB',
    grey600: '#637381',
    grey700: '#637381',
    grey800: '#212B36',
    white: '#FFFFFF',
  };
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isLocationDrawerVisible, setIsLocationDrawerVisible] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('உள்ளூர்');
  const { sf } = useFontSize();
  
  // Use ref to preserve lastPage value across re-renders
  const lastPageRef = useRef(1);

  const handleMenuPress = useCallback(() => {
    setIsDrawerVisible(true);
  }, [setIsDrawerVisible]);

  const goToSearch = useCallback(() => {
    navigation?.navigate('SearchScreen');
  }, [navigation]);

  const handleLocationPress = useCallback(() => {
    console.log('📍 EditorChoiceScreen: handleLocationPress called');
    setIsLocationDrawerVisible(true);
  }, [setIsLocationDrawerVisible]);

  const handleSelectDistrict = useCallback((district) => {
    console.log('📍 EditorChoiceScreen: handleSelectDistrict called with:', district);
    // Handle both string and object formats
    const districtTitle = typeof district === 'string' ? district : district.title || district;
    const districtId = typeof district === 'string' ? district : district.id || district;
    console.log('📍 EditorChoiceScreen: Extracted district title:', districtTitle);
    console.log('📍 EditorChoiceScreen: Navigating to DistrictNewsScreen with district:', districtTitle);
    
    setSelectedDistrict(districtTitle);
    setIsLocationDrawerVisible(false);
    
    // Navigate to DistrictNewsScreen
    navigation?.navigate('DistrictNewsScreen', { 
      selectedDistrict: districtTitle,
      districtId: districtId 
    });
  }, [navigation]);

  const handleCategoryPress = useCallback((category, item) => {
    console.log('🏷️ EditorChoiceScreen: Category pressed:', category, 'Item:', item);
    
    // Category mapping to screens and tabs
    const categoryMap = {
      'தமிழகம்': { screen: 'TharpothaiyaSeithigalScreen', tabId: 'tamilagam' },
      'tamilagam': { screen: 'TharpothaiyaSeithigalScreen', tabId: 'tamilagam' },
      'இந்தியா': { screen: 'TharpothaiyaSeithigalScreen', tabId: 'india' },
      'india': { screen: 'TharpothaiyaSeithigalScreen', tabId: 'india' },
      'உலகம்': { screen: 'TharpothaiyaSeithigalScreen', tabId: 'world' },
      'world': { screen: 'TharpothaiyaSeithigalScreen', tabId: 'world' },
      'விளையாட்டு': { screen: 'SportsScreen', tabId: null },
      'வணிகம்': { screen: 'VarthagamScreen', tabId: null },
      'சினிமா': { screen: 'CinemaScreen', tabId: null },
      'ஆன்மிகம்': { screen: 'CommonSectionScreen', params: { screenTitle: 'ஆன்மிகம்', apiEndpoint: '/anmegam', allTabLink: '/anmegam' } },
      'கல்வி': { screen: 'CommonSectionScreen', params: { screenTitle: 'கல்வி', apiEndpoint: '/education', allTabLink: '/education' } },
    };
    
    const normalizedCategory = category.toLowerCase().trim();
    const categoryConfig = categoryMap[normalizedCategory] || categoryMap[category];
    
    if (categoryConfig) {
      console.log('🏷️ Navigating to:', categoryConfig.screen, 'with tabId:', categoryConfig.tabId);
      
      if (categoryConfig.params) {
        navigation?.navigate(categoryConfig.screen, categoryConfig.params);
      } else if (categoryConfig.tabId) {
        navigation?.navigate(categoryConfig.screen, { tabId: categoryConfig.tabId });
      } else {
        navigation?.navigate(categoryConfig.screen);
      }
    } else {
      console.log('🏷️ No navigation mapping found for category:', category);
      // Fallback to CommonSectionScreen with category as parameter
      navigation?.navigate('CommonSectionScreen', {
        screenTitle: category,
        apiEndpoint: `/category/${normalizedCategory}`,
        allTabLink: `/category/${normalizedCategory}`
      });
    }
  }, [navigation]);

  const fetchEditorChoice = useCallback(async (page = 1, append = false) => {
    console.log('🚀 fetchEditorChoice called with page:', page, 'append:', append);
    
    try {
      if (!append) {
        setLoading(true);
        setCurrentPage(1);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const response = await axios.get(`https://api-st-cdn.dinamalar.com/editorchoice?page=${page}`);
      
      console.log('📄 EditorChoice API Response:', response.data);
      console.log('📄 Response status:', response.data?.status);
      console.log('📄 Full response structure:', JSON.stringify(response.data, null, 2));
      console.log('📄 Pagination data:', response.data?.newlist?.pagination);
      console.log('📄 newlist exists:', !!response.data?.newlist);
      console.log('📄 newlist keys:', response.data?.newlist ? Object.keys(response.data.newlist) : 'none');

      // Check for success status - some API responses might not have status field
      const isSuccess = response.data?.status === 'success' || response.data?.newlist?.data;
      
      if (isSuccess) {
        const newData = response.data.newlist?.data || [];
        console.log('📄 New data length:', newData.length);
        console.log('📄 Current data length before update:', data.length);

        if (append) {
          setData(prev => [...prev, ...newData]);
          console.log('📄 Appended data. New total length:', data.length + newData.length);
        } else {
          setData(newData);
          console.log('📄 Set new data. Length:', newData.length);
        }

        // Handle pagination - preserve pagination from page 1 for subsequent pages
      if (page === 1) {
  const paginationData = response.data.newlist?.pagination || {};

  const totalLastPage = paginationData.last_page || 1;

  setCurrentPage(1);
  setLastPage(totalLastPage);
  lastPageRef.current = totalLastPage; // Store in ref
  setHasMore(1 < totalLastPage);

  console.log('✅ Page 1 pagination:', {
    currentPage: 1,
    lastPage: totalLastPage,
    hasMore: 1 < totalLastPage,
  });

} else {
  setCurrentPage(page);

  const newHasMore = page < lastPageRef.current; // Use ref value
  setHasMore(newHasMore);

  console.log('✅ Next page:', {
    currentPage: page,
    lastPage: lastPageRef.current,
    hasMore: newHasMore,
  });
}

      } else {
        console.log('📄 API response not successful, status:', response.data?.status);
        if (append) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error('Error fetching editor choice:', error);
      if (append) {
        setHasMore(false);
      }
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
      setRefreshing(false);
    }
  }, []); // Remove dependencies to prevent constant recreation

  useEffect(() => {
    fetchEditorChoice();
  }, []); // Remove fetchEditorChoice dependency to prevent infinite resets

  // Reset selected district when screen gains focus (coming back from DistrictNewsScreen)
  useFocusEffect(
    useCallback(() => {
      setSelectedDistrict('உள்ளூர்');
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEditorChoice(1, false);
  }, [fetchEditorChoice]);

  const handleLoadMore = useCallback(() => {
    console.log('📄 handleLoadMore called');
    console.log('📄 Current state:', { 
      loading, 
      loadingMore, 
      hasMore, 
      currentPage, 
      lastPage,
      dataLength: data.length 
    });
    
    if (loadingMore || loading || !hasMore) {
      console.log('📄 Cannot load more - conditions not met:', { 
        loadingMore, 
        loading, 
        hasMore,
        reason: loadingMore ? 'loadingMore is true' : 
                loading ? 'loading is true' : 
                !hasMore ? 'hasMore is false' : 'unknown'
      });
      return;
    }
    
    const nextPage = currentPage + 1;
    console.log('📄 Loading page:', nextPage, 'Current page:', currentPage, 'Last page:', lastPage);
    fetchEditorChoice(nextPage, true);
  }, [loading, loadingMore, hasMore, currentPage, fetchEditorChoice, lastPage, data.length]);

  const renderNewsItem = useCallback(({ item }) => {
    const handlePress = () => {
      if (item.slug) {
        navigation?.navigate('NewsDetailsScreen', {
          newsId: item.newsid || item.id,
          newsItem: item,
          slug: item.slug,
          videopath: item.videopath || item.video_url || item.videourl || '',
        });
      }
    };

    return (
      <NewsCard
        item={item}
        onPress={handlePress}
        onCategoryPress={handleCategoryPress}
        isPremium={false}
        hideDescription={false}
      />
    );
  }, [navigation, handleCategoryPress]);

  const renderHeader = useCallback(() => (
    <View style={{
      backgroundColor: PALETTE.white,
      paddingHorizontal: s(12),
      paddingVertical: vs(16),
      borderBottomWidth: 1,
      borderBottomColor: PALETTE.grey200,
      flexDirection:"row",
       gap:s(5)
    }}>
            <EditorChoice size={30} color='#454f5b'/>

      <Text style={{
        fontFamily: FONTS.anek.bold,
        fontSize: sf(20),
        color:"#454f5b",
        textAlign: 'center',
      }}>
        எடிட்டர் லைக்ஸ்
      </Text>
    </View>
  ), [sf]);

  const renderFooter = useCallback(() => {
    if (loadingMore) {
      return (
        <View style={{ paddingVertical: vs(20) }}>
          <ActivityIndicator size="small" color={PALETTE.primary} />
          <Text style={{
            textAlign: 'center',
            marginTop: vs(8),
            fontFamily: FONTS.muktaMalar.regular,
            fontSize: sf(12),
            color: PALETTE.grey600,
          }}>
            ஏற்றுகிறது...
          </Text>
        </View>
      );
    }
    return null;
  }, [loadingMore, sf]);

  if (loading && data.length === 0) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: PALETTE.grey100,
      }}>
        <StatusBar barStyle="dark-content" />

        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: s(20),
        }}>
          <ActivityIndicator size="large" color={PALETTE.primary} />
          <Text style={{
            fontFamily: FONTS.muktaMalar.regular,
            fontSize: sf(16),
            color: PALETTE.grey800,
            marginTop: vs(16),
          }}>
            ஏற்றுகிறது...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={{
      flex: 1,
      backgroundColor: COLORS.grey100,
    }}>
      <StatusBar barStyle="dark-content" />

      <UniversalHeaderComponent
        showMenu={true}
        showSearch={true}
        showNotifications={true}
        showLocation={true}
        onMenuPress={handleMenuPress}
        onSearch={goToSearch}
        onLocation={handleLocationPress}
        selectedDistrict={selectedDistrict}
        onSelectDistrict={handleSelectDistrict}
        navigation={navigation}
        isDrawerVisible={isDrawerVisible}
        setIsDrawerVisible={setIsDrawerVisible}
        isLocationDrawerVisible={isLocationDrawerVisible}
        setIsLocationDrawerVisible={setIsLocationDrawerVisible}
      >
        <AppHeaderComponent
          onSearch={goToSearch}
          onMenu={handleMenuPress}
          onLocation={handleLocationPress}
          selectedDistrict={selectedDistrict}
        />
      </UniversalHeaderComponent>

      {/* News List */}
      <FlatList
        data={data}
        renderItem={renderNewsItem}
        keyExtractor={(item, index) => {
        const newsId = item.newsid || item.id;
        // Use combination of newsId and index to ensure uniqueness
        return newsId ? `${newsId}-${index}` : `editorchoice-${index}`;
      }}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PALETTE.primary]}
            tintColor={PALETTE.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: vs(20) }}
        onContentSizeChange={() => console.log('📄 FlatList content size changed, data length:', data.length)}
        ListEmptyComponent={() => !loading && data.length === 0 && (
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: vs(40),
          }}>
            <Text style={{
              fontFamily: FONTS.muktaMalar.regular,
              fontSize: sf(14),
              color: PALETTE.grey600,
              textAlign: 'center',
              marginTop: vs(8),
            }}>
              தற்போது காட்ட செய்திகள் இல்லை
            </Text>
          </View>
        )}
      />

      {/* Empty State */}
      {data.length === 0 && !loading && (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: s(20),
        }}>
          <Ionicons name="newspaper-outline" size={s(64)} color={PALETTE.grey400} />
          <Text style={{
            fontFamily: FONTS.muktaMalar.regular,
            fontSize: sf(16),
            color: PALETTE.grey800,
            textAlign: 'center',
            marginTop: vs(16),
          }}>
            செய்திகள் இல்லை
          </Text>
          <Text style={{
            fontFamily: FONTS.muktaMalar.regular,
            fontSize: sf(14),
            color: PALETTE.grey600,
            textAlign: 'center',
            marginTop: vs(8),
          }}>
            தற்போது காட்ட செய்திகள் இல்லை
          </Text>
        </View>
      )}

      {/* Drawer Components */}
      <DrawerMenu
        isVisible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
        navigation={navigation}
      />
      <LocationDrawer
        isVisible={isLocationDrawerVisible}
        onClose={() => setIsLocationDrawerVisible(false)}
        onSelectDistrict={handleSelectDistrict}
        selectedDistrict={selectedDistrict}
      />
    </SafeAreaView>
  );
}
