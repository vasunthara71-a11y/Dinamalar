import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StatusBar,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { ms, s, vs } from '../utils/scaling';
import { COLORS, FONTS, NewsCard as NewsCardStyles } from '../utils/constants';
import { useFontSize } from '../context/FontSizeContext';
import NewsCard from '../components/NewsCard';
import { TouchableOpacity } from 'react-native';
import UniversalHeaderComponent from '../components/UniversalHeaderComponent';
import AppHeaderComponent from '../components/AppHeaderComponent';

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
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isLocationDrawerVisible, setIsLocationDrawerVisible] = useState(false);
  const { sf } = useFontSize();

  const handleMenuPress = useCallback(() => {
    setIsDrawerVisible(true);
  }, []);

  const goToSearch = useCallback(() => {
    navigation?.navigate('SearchScreen');
  }, [navigation]);

  const handleLocationPress = useCallback(() => {
    setIsLocationDrawerVisible(true);
  }, []);

  const fetchEditorChoice = useCallback(async (page = 1, isRefresh = false) => {
    try {
      if (!isRefresh && page === 1) setLoading(true);

      const response = await axios.get(`https://api-st-cdn.dinamalar.com/editorchoice?page=${page}`);

      if (response.data?.status === 'success') {
        const newData = response.data.newlist?.data || [];

        if (page === 1 || isRefresh) {
          setData(newData);
        } else {
          setData(prev => [...prev, ...newData]);
        }

        setPagination(response.data.newlist?.pagination || null);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error fetching editor choice:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEditorChoice();
  }, [fetchEditorChoice]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEditorChoice(1, true);
  }, [fetchEditorChoice]);

  const loadMore = useCallback(() => {
    if (!loading && pagination && currentPage < pagination.last_page) {
      fetchEditorChoice(currentPage + 1);
    }
  }, [loading, pagination, currentPage, fetchEditorChoice]);

  const renderNewsItem = useCallback(({ item }) => {
    const handlePress = () => {
      if (item.slug) {
        navigation?.navigate('NewsDetailsScreen', {
          newsId: item.newsid || item.id,
          newsItem: item,
          slug: item.slug,
        });
      }
    };

    return (
      <NewsCard
        item={item}
        onPress={handlePress}
        isPremium={false}
        hideDescription={false}
      />
    );
  }, [navigation]);

  const renderHeader = useCallback(() => (
    <View style={{
      backgroundColor: PALETTE.white,
      paddingHorizontal: s(12),
      paddingVertical: vs(16),
      borderBottomWidth: 1,
      borderBottomColor: PALETTE.grey200,
    }}>
      <Text style={{
        fontFamily: FONTS.muktaMalar.bold,
        fontSize: sf(20),
        color: PALETTE.grey800,
        textAlign: 'center',
      }}>
        எடிட்டர் லைக்ஸ்
      </Text>
      <Text style={{
        fontFamily: FONTS.muktaMalar.regular,
        fontSize: sf(14),
        color: PALETTE.grey600,
        textAlign: 'center',
        marginTop: vs(4),
      }}>
        Editorial Likes | Editor Choice | Editor's Desk
      </Text>
    </View>
  ), [sf]);

  const renderFooter = useCallback(() => {
    if (loading && currentPage > 1) {
      return (
        <View style={{ paddingVertical: vs(20) }}>
          <ActivityIndicator size="small" color={PALETTE.primary} />
        </View>
      );
    }
    return null;
  }, [loading, currentPage]);

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
        statusBarStyle="dark-content"
        statusBarBackgroundColor={COLORS.white}
        onMenuPress={handleMenuPress}
        showBackButton={true}
        onBackPress={() => navigation?.goBack()}
        title="எடிட்டர் லைக்ஸ்"
      />

      {/* News List */}
      <FlatList
        data={data}
        renderItem={renderNewsItem}
        keyExtractor={(item, index) => `${item.newsid || item.id || index}`}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
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
    </SafeAreaView>
  );
}
