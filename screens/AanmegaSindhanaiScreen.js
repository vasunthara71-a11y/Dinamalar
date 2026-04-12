import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');
const BASE_URL = 'https://api-st-cdn.dinamalar.com';

const AanmegaSindhanaiScreen = ({ route, navigation }) => {
  const id = route?.params?.id ?? 2;

  const [headerInfo, setHeaderInfo] = useState(null);
  const [articles, setArticles] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(
    async (pageNum, reset) => {
      try {
        if (pageNum === 1) {
          if (reset) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }
        } else {
          setLoadingMore(true);
        }

        const response = await fetch(
          BASE_URL + '/aanmegasinthanaimainlist?id=' + id + '&page=' + pageNum
        );

        if (!response.ok) {
          throw new Error('HTTP Error: ' + response.status);
        }

        const json = await response.json();

        const newList = (json && json.newlist && json.newlist.data) ? json.newlist.data : [];
        const pagination = (json && json.newlist && json.newlist.pagination) ? json.newlist.pagination : {};
        const mainImage =
          (json && json.data && json.data[0] && json.data[0].images)
            ? json.data[0].images
            : null;

        setHeaderInfo({
          title: (json && json.newlist && json.newlist.title) ? json.newlist.title : '',
          image: mainImage,
        });

        setTotalPages(pagination.last_page ? pagination.last_page : 1);

        if (pageNum === 1) {
          setArticles(newList);
        } else {
          setArticles(function (prev) { return prev.concat(newList); });
        }

        setPage(pageNum);
        setError(null);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(function () {
    fetchData(1, false);
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData(1, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && page < totalPages) {
      fetchData(page + 1, false);
    }
  };

  const handleArticlePress = (item) => {
    if (navigation && navigation.navigate) {
      navigation.navigate('NewsDetailsScreen', {
        newsId: item.newsid,
        title: item.newstitle,
        reacturl: item.reacturl,
        slug: item.slug,
      });
    }
  };

  const cleanDescription = (text) => {
    if (!text) return '';
    return text
      .replace(/\*\s*/g, '')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  };

  const renderArticleItem = (info) => {
    const item = info.item;
    const index = info.index;
    return (
      <TouchableOpacity
        style={styles.articleCard}
        onPress={() => handleArticlePress(item)}
        activeOpacity={0.75}
      >
        {index === 0 && headerInfo && headerInfo.image ? (
          <Image
            source={{ uri: headerInfo.image }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        ) : null}

        <View style={styles.articleContent}>
          <Text style={styles.articleTitle}>{item.newstitle}</Text>
          <Text style={styles.articleDesc} numberOfLines={3}>
            {cleanDescription(item.newsdescription)}
          </Text>
          {item.standarddate ? (
            <Text style={styles.articleDate}>{item.standarddate}</Text>
          ) : null}
        </View>
        <View style={styles.divider} />
      </TouchableOpacity>
    );
  }

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#B8860B" />
      </View>
    );
  };

  const renderListHeader = () => {
    return (
      <View style={styles.listHeader}>
        {headerInfo && headerInfo.title ? (
          <Text style={styles.sectionTitle}>{headerInfo.title}</Text>
        ) : null}
      </View>
    );
  };

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFDF5" />
        <AppHeader
          onBack={() => navigation && navigation.goBack && navigation.goBack()}
        />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#B8860B" />
          <Text style={styles.loadingText}>ஏற்றுகிறது...</Text>
        </View>
      </SafeAreaView>
    );
  }

  /* ─── Error State ─── */
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFDF5" />
        <AppHeader
          onBack={() => navigation && navigation.goBack && navigation.goBack()}
        />
        <View style={styles.centerBox}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>தகவல் கிடைக்கவில்லை</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => fetchData(1, false)}
          >
            <Text style={styles.retryText}>மீண்டும் முயற்சி செய்</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* ─── Main Screen ─── */
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFDF5" />
      <AppHeader
        onBack={() => navigation && navigation.goBack && navigation.goBack()}
        title={headerInfo && headerInfo.title ? headerInfo.title : 'ஆன்மிக சிந்தனைகள்'}
      />

      <FlatList
        data={articles}
        keyExtractor={(item) => String(item.newsid)}
        renderItem={renderArticleItem}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#B8860B"
            colors={['#B8860B']}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

/* ─── Header Component ─── */
const AppHeader = (props) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={props.onBack}
        style={styles.backBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.backIcon}>{'<'}</Text>
      </TouchableOpacity>

      <View style={styles.logoBox}>
        <Text style={styles.logoText}>தினமலர்</Text>
        <Text style={styles.logoSubText}>தேசிய தமிழ் நாளிதழ்</Text>
      </View>

      <TouchableOpacity
        style={styles.searchBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.searchIcon}>🔍</Text>
      </TouchableOpacity>
    </View>
  );
};

/* ─── Styles ─── */
var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF5',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFFDF5',
    borderBottomWidth: 1,
    borderBottomColor: '#E8DFC0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  logoBox: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  logoSubText: {
    fontSize: 9,
    color: '#888',
    letterSpacing: 0.3,
    marginTop: -2,
  },
  searchBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIcon: {
    fontSize: 18,
  },

  /* List */
  listContent: {
    paddingBottom: 40,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 0.3,
    borderLeftWidth: 4,
    borderLeftColor: '#B8860B',
    paddingLeft: 10,
  },

  /* Article Card */
  articleCard: {
    backgroundColor: '#FFFDF5',
    paddingHorizontal: 16,
  },
  heroImage: {
    width: width - 32,
    height: (width - 32) * 0.6,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 12,
    backgroundColor: '#E8DFC0',
  },
  articleContent: {
    paddingTop: 14,
    paddingBottom: 4,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    lineHeight: 24,
    marginBottom: 6,
  },
  articleDesc: {
    fontSize: 13.5,
    color: '#555',
    lineHeight: 21,
    marginBottom: 6,
  },
  articleDate: {
    fontSize: 11,
    color: '#B8860B',
    marginBottom: 4,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#EDE8D8',
    marginTop: 10,
  },

  /* Footer */
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  /* Center States */
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#888',
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#B8860B',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default AanmegaSindhanaiScreen;
