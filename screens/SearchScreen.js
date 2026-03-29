import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  Platform,
  Image,
  Keyboard,
} from 'react-native';
import { SpeakerIcon } from '../assets/svg/Icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { s, vs } from '../utils/scaling';
import { ms } from 'react-native-size-matters';
import { FONTS, getFontFamily } from '../utils/fonts';
import { COLORS, NewsCard as NewsCardStyles } from '../utils/constants';
import { useFontSize } from '../context/FontSizeContext';
import UniversalHeaderComponent from '../components/UniversalHeaderComponent';
import AppHeaderComponent from '../components/AppHeaderComponent';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const SEARCH_API_BASE = 'https://api-st-cdn.dinamalar.com/searchfilter?search=';


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
// News Card (same as CommonSectionScreen)
// ─────────────────────────────────────────────────────────────────────────────
function NewsCard({ item, onPress, sectionTitle = '' }) {
  const { sf } = useFontSize();

  const imageUri =
    item.largeimages || item.images || item.image || item.thumbnail || item.thumb ||
    'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400';

  const title = item.newstitle || item.title || item.videotitle || item.name || '';
  const category = item.maincat || item.categrorytitle || item.ctitle || item.maincategory || sectionTitle || '';
  const ago = item.ago || item.time_ago || item.standarddate || item.date || '';
  const newscomment = item.newscomment || item.commentcount || item.nmcomment || item.comments?.total || '';
  const hasAudio = item.audio === 1 || item.audio === '1' || item.audio === true ||
    (typeof item.audio === 'string' && item.audio.length > 1 && item.audio !== '0');

  return (
    <View style={[NewsCardStyles.wrap,]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
        <View style={[NewsCardStyles.imageWrap,{marginHorizontal:ms(0)}]}>
          <Image
            source={{ uri: imageUri }}
            style={NewsCardStyles.image}
            resizeMode="contain"
          />
        </View>

        <View style={[NewsCardStyles.contentContainer,{paddingHorizontal:ms(0)}]}>
          {!!title && (
            <Text style={[NewsCardStyles.title, { fontSize: sf(13), lineHeight: sf(22) }]} numberOfLines={3}>{title}</Text>
          )}

          {!!category && (
            <View style={NewsCardStyles.catPill}>
              <Text style={[NewsCardStyles.catText, { fontSize: sf(12) }]}>{category}</Text>
            </View>
          )}

          <View style={NewsCardStyles.metaRow}>
            <Text style={[NewsCardStyles.timeText, { fontSize: sf(13) }]}>{ago}</Text>
            <View style={NewsCardStyles.metaRight}>
              {hasAudio && (
                <View style={NewsCardStyles.audioIcon}>
                  <SpeakerIcon size={s(14)} color={COLORS.text} />
                </View>
              )}

              {!!newscomment && newscomment !== '0' && (
                <View style={NewsCardStyles.commentRow}>
                  <Ionicons name="chatbox" size={s(16)} color={COLORS.subtext} />
                  <Text style={[NewsCardStyles.commentText, { fontSize: sf(14) }]}> {newscomment}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <View style={NewsCardStyles.divider} />
    </View>
  );
}

// Section Title (same as CommonSectionScreen)
// ─────────────────────────────────────────────────────────────────────────────
function SectionTitle({ title }) {
  const { sf } = useFontSize();

  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { fontSize: sf(16) }]}>{title || ''}</Text>
      <View style={styles.sectionUnderline} />
    </View>
  );
}

// ─── Short Card (Dinamalar mobile website style - landscape like video cards) ──
const ShortCard = ({ video, onPress }) => {
  const title = video.newstitle || video.title || video.videotitle || '';
  const imageUri = video.images || video.largeimages || video.image || '';
  const duration = video.duration || '';
  const catLabel = video.maincat || video.CatName || '';
  const pubDate = video.ago || video.standarddate || '';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress?.(video)}
      style={styles.shortCard}
    >
      {/* Landscape thumbnail with 16:9 ratio */}
      <View style={styles.shortCardThumb}>
        <Image
          source={{
            uri: imageUri ||
              'https://images.dinamalar.com/data/large_2025/Tamil_News_lrg_default.jpg?im=Resize,width=400',
          }}
          style={styles.shortCardImage}
          resizeMode="cover"
        />

        {/* Centered play button */}
        <View style={styles.shortCardPlayWrap}>
          <View style={styles.shortCardPlayBtn}>
            <Ionicons name="play" size={s(20)} color="#fff" />
          </View>
        </View>

        {/* Duration badge bottom-right */}
        {!!duration && (
          <View style={styles.shortCardDuration}>
            <Text style={styles.shortCardDurationText}>{duration}</Text>
          </View>
        )}

        {/* Title overlay at bottom */}
        {!!title && (
          <View style={styles.shortCardTitleOverlay}>
            <Text style={styles.shortCardTitle} numberOfLines={2}>{title}</Text>
          </View>
        )}
      </View>

      {/* Text below image - only show category and date */}
      {/* <View style={styles.shortCardBody}>
        {!!catLabel && (
          <View style={styles.shortCardPill}>
            <Text style={styles.shortCardPillText}>{catLabel}</Text>
          </View>
        )}
        {!!pubDate && (
          <Text style={styles.shortCardDate}>{pubDate}</Text>
        )}
      </View> */}
    </TouchableOpacity>
  );
};

// ─── Shorts Section Row (horizontal scroll strip) ───────────────────────
const ShortsSectionRow = ({ items, onPress }) => {
  if (!items || items.length === 0) return null;

  return (
    <View style={styles.shortsSectionContainer}>
      <View style={styles.shortsSectionHeader}>
        <View style={styles.shortsSectionTitleWrap}>
          <Text style={styles.sectionTitle}>Shorts</Text>
          <View style={styles.shortsSectionUnderline} />
        </View>
      </View>
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        contentContainerStyle={styles.shortsSectionScroll}
        style={styles.shortsSectionScrollView}
      >
        {items.map((video, index) => (
          <ShortCard
            key={`short-${index}-${video.videoid || video.id || index}`}
            video={video}
            onPress={onPress}
          />
        ))}
      </ScrollView>
    </View>
  );
};

// ─── Result Card (full-width image, title, category, meta) ───────────────────
var SearchResultItem = function (props) {
  var item = props.item;
  var onPress = props.onPress;

  var isReels = item.type === 'reels';
  var isVideo = item.type === 'video' || item.video === '1' || item.video === 1;
  var isPhoto = item.type === 'photo';
  var hasAudio = item.audio === '1' || item.audio === 1;

  // For reels, render as portrait short card
  if (isReels) {
    return (
      <View style={styles.shortCardWrapper}>
        <ShortCard video={item} onPress={onPress} />
      </View>
    );
  }

  var title = item.newstitle || item.Title || item.title || '';
  var imageUrl = item.images || item.ImageUrl || item.imageurl || '';
  var pubDate = item.ago || item.standarddate || item.newsdate || '';
  var catLabel = item.maincat || item.CatName || item.catname || '';
  var commentsCount = parseInt(item.newscomment || item.CommentCount || 0);

  return (
    <TouchableOpacity
      style={styles.resultCard}
      onPress={function () { onPress && onPress(item); }}
      activeOpacity={0.88}
    >
      {/* Full width image */}
      {imageUrl ? (
        <View style={styles.resultImageWrap}>
          <Image source={{ uri: imageUrl }} style={styles.resultImage} resizeMode="cover" />
          {(isVideo || isReels) && (
            <View style={styles.playOverlay}>
              <View style={styles.playCircle}>
                <Ionicons name="play" size={ms(18)} color="#fff" />
              </View>
            </View>
          )}
          {isPhoto && (
            <View style={styles.imageOverlay}>
              <View style={styles.imageCircle}>
                <Ionicons name="image" size={ms(18)} color="#fff" />
              </View>
            </View>
          )}
          {isReels && (
            <View style={styles.reelsBadge}>
              <Text style={styles.reelsBadgeText}>ஷார்ட்ஸ்</Text>
            </View>
          )}
        </View>
      ) : null}

      {/* Text content */}
      <View style={styles.resultBody}>
        <Text style={styles.resultTitle}  >{title}</Text>

        {catLabel ? (
          <View style={styles.catPill}>
            <Text style={styles.catPillText}>{catLabel}</Text>
          </View>
        ) : null}

        {/* Meta row: date + audio + comments */}
        <View style={styles.metaRow}>
          <Text style={styles.metaDate}>{pubDate}</Text>
          <View style={styles.metaIcons}>
            {hasAudio ? (
              <SpeakerIcon
                size={ms(16)}
                color="#555"
                style={{ marginRight: s(10) }}
              />
            ) : null}
            {commentsCount > 0 ? (
              <View style={styles.commentWrap}>
                <Ionicons name="chatbox" size={ms(18)} color="#555" />
                <Text style={styles.commentCount}>{commentsCount}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.resultDivider} />
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
var SearchScreen = function () {
  var navigation = useNavigation();
  var route = useRoute();
  
  var sq = useState(''); var searchQuery = sq[0]; var setSearchQuery = sq[1];
  var sr = useState([]); var searchResults = sr[0]; var setSearchResults = sr[1];
  var il = useState(false); var isLoading = il[0]; var setIsLoading = il[1];
  var lm = useState(false); var isLoadingMore = lm[0]; var setIsLoadingMore = lm[1];
  var er = useState(null); var error = er[0]; var setError = er[1];
  var hs = useState(false); var hasSearched = hs[0]; var setHasSearched = hs[1];
  var ac = useState('all'); var activeCategory = ac[0]; var setActiveCategory = ac[1];
  var cf = useState([]); var categoryFilter = cf[0]; var setCategoryFilter = cf[1];
  var tk = useState([]); var trendingTopics = tk[0]; var setTrendingTopics = tk[1];
  var mc = useState([]); var mostCommented = mc[0]; var setMostCommented = mc[1];
  var ml = useState(false); var mostCommentedLoading = ml[0]; var setMostCommentedLoading = ml[1];
  var cp = useState(1); var currentPage = cp[0]; var setCurrentPage = cp[1];
  var lp = useState(1); var lastPage = lp[0]; var setLastPage = lp[1];
  var cq = useRef('');           // track current query for load more
  var fs = useState(false); var showScrollTop = fs[0]; var setShowScrollTop = fs[1];
  var flatListRef = useRef(null);

  var dv = useState(false); var isDrawerVisible = dv[0]; var setIsDrawerVisible = dv[1];
  var lv = useState(false); var isLocationDrawerVisible = lv[0]; var setIsLocationDrawerVisible = lv[1];
  var sd = useState('உள்ளூர்'); var selectedDistrict = sd[0]; var setSelectedDistrict = sd[1];

  var inputRef = useRef(null);

  // Set initial search query from route params
  useEffect(function () {
    var initialSearchTerm = route.params?.searchTerm;
    if (initialSearchTerm) {
      setSearchQuery(initialSearchTerm);
      cq.current = initialSearchTerm;
      // Trigger search automatically
      performSearch(initialSearchTerm);
    }
  }, [route.params?.searchTerm]);

  // Fetch trending topics on mount
  useEffect(function () {
    axios.get(SEARCH_API_BASE + 'gold')
      .then(function (response) {
        var data = response && response.data;
        if (data && Array.isArray(data.trendingkeywords) && data.trendingkeywords.length > 0) {
          setTrendingTopics(data.trendingkeywords[0]?.data || []);
        }
      })
      .catch(function () { });

    // Fetch most commented data
    setMostCommentedLoading(true);
    axios.get('https://api-st-cdn.dinamalar.com/photodata')
      .then(function (response) {
        var data = response && response.data;
        console.log('[SearchScreen] Most commented API response:', data);
        if (data && data.mostcommented && Array.isArray(data.mostcommented.data)) {
          console.log('[SearchScreen] Found most commented data:', data.mostcommented.data.length, 'items');
          setMostCommented(data.mostcommented.data.slice(0, 10)); // Limit to 10 items
        } else {
          console.log('[SearchScreen] No most commented data found');
        }
      })
      .catch(function (err) {
        console.error('Most commented fetch error:', err);
      })
      .finally(function () {
        setMostCommentedLoading(false);
      });
  }, []);

  var handleMenuPress = function (menuItem) { };
  var goToSearch = function () { };
  var goToNotifs = function () { navigation && navigation.navigate('NotificationScreen'); };
  var handleSelectDistrict = function (district) {
    setSelectedDistrict(district.title);
    setIsLocationDrawerVisible(false);
    if (district.id) {
      navigation && navigation.navigate('DistrictNewsScreen', {
        districtId: district.id, districtTitle: district.title,
      });
    }
  };

  // ─── Search ────────────────────────────────────────────────────────────────
  var performSearch = useCallback(function (query) {
    if (!query || !query.trim()) return;
    Keyboard.dismiss();
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setActiveCategory('all');
    setCurrentPage(1);
    cq.current = query.trim();

    axios.get(SEARCH_API_BASE + encodeURIComponent(query.trim()) + '&page=1')
      .then(function (response) {
        var data = response && response.data;
        var results = [];

        if (data && Array.isArray(data.detail)) {
          results = data.detail;
        } else if (Array.isArray(data)) {
          results = data;
        }

        setSearchResults(results);

        // Save pagination info
        if (data && data.pagination) {
          setCurrentPage(data.pagination.current_page || 1);
          setLastPage(data.pagination.last_page || 1);
        }

        // Use categoryfilter from API for tab counts
        if (data && Array.isArray(data.categoryfilter)) {
          setCategoryFilter(data.categoryfilter);
        }

        // Update trending topics
        if (data && Array.isArray(data.trendingkeywords) && data.trendingkeywords.length > 0) {
          setTrendingTopics(data.trendingkeywords[0]?.data || []);
        }
      })
      .catch(function (err) {
        console.error('Search error:', err);
        setError('தேடல் தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.');
        setSearchResults([]);
      })
      .finally(function () { setIsLoading(false); });
  }, []);

  // ─── Load more (pagination) ────────────────────────────────────────────────
  var loadMore = useCallback(function () {
    if (isLoadingMore || isLoading || currentPage >= lastPage || !cq.current) return;

    var nextPage = currentPage + 1;
    setIsLoadingMore(true);

    var typeParam = activeCategory !== 'all' ? '&type=' + activeCategory : '';
    axios.get(SEARCH_API_BASE + encodeURIComponent(cq.current) + '&page=' + nextPage + typeParam)
      .then(function (response) {
        var data = response && response.data;
        var results = [];

        if (data && Array.isArray(data.detail)) {
          results = data.detail;
        } else if (Array.isArray(data)) {
          results = data;
        }

        // Append to existing results
        setSearchResults(function (prev) { return prev.concat(results); });

        if (data && data.pagination) {
          setCurrentPage(data.pagination.current_page || nextPage);
          setLastPage(data.pagination.last_page || 1);
        }
      })
      .catch(function (err) {
        console.error('Load more error:', err);
      })
      .finally(function () { setIsLoadingMore(false); });
  }, [isLoadingMore, isLoading, currentPage, lastPage, activeCategory]);

  // ─── Filter results by active tab ─────────────────────────────────────────
  var filteredResults = React.useMemo(function () {
    if (activeCategory === 'all') return searchResults;
    return searchResults.filter(function (item) {
      var itemType = (item.type || '').toLowerCase();
      var itemMaincat = (item.maincat || '').toLowerCase();
      var itemCatId = String(item.maincatid || '').toLowerCase();

      if (activeCategory === 'news') {
        return itemType === 'news' &&
          itemMaincat !== 'ஷார்ட்ஸ்' &&
          itemCatId !== 'shorts';
      }
      if (activeCategory === 'video') {
        return itemType === 'video' || itemType === 'reels' ||
          itemMaincat === 'ஷார்ட்ஸ்' || itemCatId === 'shorts';
      }
      if (activeCategory === 'photo') {
        return itemType === 'photo' || itemMaincat.includes('photo') ||
          itemCatId.includes('photo') || itemMaincat.includes('படம்') ||
          itemMaincat.includes('புகைப்படம்');
      }
      if (activeCategory === 'kalvimalar') {
        return itemMaincat.includes('கல்வி') || itemCatId.includes('kalvi') ||
          itemMaincat.includes('kalvi');
      }
      if (activeCategory === 'nri') {
        return itemMaincat.includes('உலக') || itemCatId.includes('nri') ||
          itemMaincat.includes('nri');
      }
      return itemType.indexOf(activeCategory) !== -1 ||
        itemMaincat.indexOf(activeCategory) !== -1 ||
        itemCatId.indexOf(activeCategory) !== -1;
    });
  }, [searchResults, activeCategory]);

  var handleItemPress = function (item) {
    var newsId = item.id || item.Id || item.NewsId || item.newsid;
    var itemType = (item.type || '').toLowerCase();
    if (itemType === 'reels' || itemType === 'video') {
      // Map search result fields to VideoDetailScreen expected fields based on actual API structure
      var mappedVideo = {
        videoid: item.id || item.Id || item.NewsId || item.newsid,
        videotitle: item.newstitle || item.Title || item.title || '',
        images: item.images || item.ImageUrl || item.imageurl || '',
        videodescription: item.newsdescription || item.description || item.content || '',
        videodate: item.newsdate || item.date || '',
        standarddate: item.ago || item.standarddate || '',
        maincat: item.maincat || item.CatName || item.catname || '',
        ctitle: item.maincat || item.CatName || item.catname || '',
        duration: item.duration || '',
        nmcomment: item.newscomment || item.CommentCount || 0,
        type: item.type || 'video',
        slug: item.slug || '',
        videopath: item.path || item.videopath || item.y_path || item.vidg_path || ''
      };
      navigation && navigation.navigate('VideoDetailScreen', { video: mappedVideo });
    } else {
      if (newsId) {
        navigation && navigation.navigate('NewsDetailsScreen', { newsId: newsId, newsItem: item });
      }
    }
  };

  // When a category tab is clicked, fetch filtered results from API using type param
  var handleCategoryPress = useCallback(function (ename) {
    setActiveCategory(ename);
    if (!cq.current) return;

    if (ename === 'all') return;

    setIsLoading(true);
    setCurrentPage(1);

    var url = SEARCH_API_BASE + encodeURIComponent(cq.current) + '&page=1&type=' + ename;
    axios.get(url)
      .then(function (response) {
        var data = response && response.data;
        var results = [];
        if (data && Array.isArray(data.detail)) {
          results = data.detail;
        } else if (Array.isArray(data)) {
          results = data;
        }
        setSearchResults(function (prev) {
          return results;
        });
        if (data && data.pagination) {
          setCurrentPage(data.pagination.current_page || 1);
          setLastPage(data.pagination.last_page || 1);
        }
      })
      .catch(function () { })
      .finally(function () { setIsLoading(false); });
  }, []);

  // Build category tabs from API categoryfilter
  var categoryTabs = React.useMemo(function () {
    if (categoryFilter.length === 0) return [];
    return categoryFilter.map(function (cf) {
      return { id: cf.ename, label: cf.name, count: cf.count };
    });
  }, [categoryFilter]);

  // ─── Scroll to top handler ─────────────────────────────────────────────────────
  var handleScroll = function (event) {
    var offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollTop(offsetY > 300);
  };

  var scrollToTop = function () {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <UniversalHeaderComponent
        statusBarStyle="dark-content"
        statusBarBackgroundColor="#fff"
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
          onMenu={function () { setIsDrawerVisible(true); }}
          onLocation={function () { setIsLocationDrawerVisible(true); }}
          selectedDistrict="உள்ளூர்"
        />
      </UniversalHeaderComponent>

      {/* ══ SEARCH BAR ══ */}
      <View style={styles.searchBarWrap}>
        <View style={styles.inputWrap}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Search..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={function () { performSearch(searchQuery); }}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={function () {
                setSearchQuery('');
                setSearchResults([]);
                setHasSearched(false);
                setActiveCategory('all');
                setCategoryFilter([]);
                setError(null);
                setIsLoading(false);
                cq.current = '';
              }}
              style={styles.clearBtn}
            >
              <Ionicons name="close-outline" size={ms(18)} color="#696969" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={function () { performSearch(searchQuery); }}
          activeOpacity={0.85}
        >
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* ══ PRE-SEARCH: English hint + Trending Topics ══ */}
      {!hasSearched ? (
        <ScrollView style={styles.preSearchWrap} showsVerticalScrollIndicator={false}>
          {/* English hint */}
          <View style={styles.englishHint}>
            <Text style={styles.englishHintText}>
              To <Text style={styles.boldText}>type / voice search</Text> in English{' '}
            </Text>
            <TouchableOpacity style={styles.clickHereBtn} activeOpacity={0.8}>
              <Text style={styles.clickHereText}>Click Here</Text>
            </TouchableOpacity>
          </View>

          {/* Trending topics */}
          {trendingTopics.length > 0 && (
            <View style={styles.trendingSection}>
              <View style={styles.trendingTitleRow}>
                <Ionicons name="trending-up" size={ms(15)} color="#222" />
                <Text style={styles.trendingTitle}> TRENDING TOPICS</Text>
              </View>
              <View style={styles.trendingChips}>
                {trendingTopics.map(function (topic, idx) {
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={styles.trendingChip}
                      onPress={function () {
                        setSearchQuery(topic.key);
                        performSearch(topic.key);
                      }}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.trendingChipText}>{topic.key}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Most Commented */}
          {mostCommented.length > 0 && (
            <SectionTitle title="அதிகம் விமர்ச்சிக்கப்பட்டவை" />
          )}
          {mostCommented.length > 0 && (
            <View style={styles.mostCommentedList}>
              {mostCommented.map(function (item, idx) {
                return (
                  <NewsCard
                    key={`most-commented-${idx}`}
                    item={item}
                    onPress={handleItemPress}
                    sectionTitle="Most Commented"
                  />
                );
              })}
            </View>
          )}
        </ScrollView>
      ) : null}

      {/* ══ CATEGORY TABS — shown after search ══ */}
      {hasSearched && categoryTabs.length > 0 ? (
        <View style={styles.categoryWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categoryTabs.map(function (tab) {
              var isActive = activeCategory === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.catTab, isActive && styles.catTabActive]}
                  onPress={function () { handleCategoryPress(tab.id); }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.catTabText, isActive && styles.catTabTextActive]}>
                    {tab.label}{tab.count !== undefined ? ' (' + tab.count + ')' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {/* ══ RESULTS ══ */}
      {hasSearched ? (
        isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#1565C0" />
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={function () { performSearch(searchQuery); }}
            >
              <Text style={styles.retryBtnText}>மீண்டும் முயற்சி</Text>
            </TouchableOpacity>
          </View>
        ) : filteredResults.length === 0 ? (
          <View style={styles.centerState}>
            <Ionicons name="search-outline" size={ms(48)} color="#ccc" />
            <Text style={styles.emptyText}>முடிவுகள் எதுவும் இல்லை</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredResults}
            keyExtractor={function (item, index) {
              return String(item.id || item.Id || item.NewsId || item.newsid || '') + '_' + index;
            }}
            renderItem={function (info) {
              return <SearchResultItem item={info.item} onPress={handleItemPress} />;
            }}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={function () {
              if (!isLoadingMore) return null;
              return (
                <View style={styles.loadMoreFooter}>
                  <ActivityIndicator size="small" color="#1565C0" />
                </View>
              );
            }}
          />
        )
      ) : null}

      {/* Scroll to top button */}
      {showScrollTop && (
        <TouchableOpacity
          style={styles.scrollTopBtn}
          onPress={scrollToTop}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-up" size={s(20)} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? vs(30) : 0,
  },

  // ── Search bar ──────────────────────────────────────────────────────────────
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    gap: s(8),
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: ms(6),
    backgroundColor: '#fff',
    paddingHorizontal: s(12),
    height: vs(30),
  },
  input: {
    flex: 1,
    fontSize: ms(15),
    color: '#111',
    paddingVertical: 0,
    fontFamily: getFontFamily(400),
  },
  clearBtn: {
    paddingLeft: s(6),
  },
  searchBtn: {
    backgroundColor: '#1565C0',
    paddingHorizontal: s(20),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: ms(6),
    height: vs(30)
  },
  searchBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: ms(14),
    fontFamily: 'MuktaMalar',
  },

  // ── Pre-search ──────────────────────────────────────────────────────────────
  preSearchWrap: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: s(14),
  },
  englishHint: {
    paddingVertical: vs(15),
    justifyContent: "center",
    alignItems: "center"
  },
  englishHintText: {
    fontSize: ms(13),
    color: '#333',
    fontFamily: 'MuktaMalar',
  },
  boldText: {
    fontWeight: '700',
    color: '#111',
    fontFamily: 'MuktaMalar',
  },
  clickHereBtn: {
    backgroundColor: '#1565C0',
    paddingHorizontal: s(14),
    paddingVertical: vs(5),
    borderRadius: ms(4),
    marginLeft: s(6),
  },
  clickHereText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: ms(13),
    fontFamily: 'MuktaMalar',
  },
  trendingSection: {
    paddingTop: vs(4),
  },
  trendingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: vs(14),
  },
  trendingTitle: {
    fontSize: ms(13),
    fontWeight: '700',
    color: '#222',
    letterSpacing: 0.5,
    fontFamily: 'MuktaMalar',
  },
  trendingChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: s(10),
  },
  trendingChip: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: ms(20),
    paddingHorizontal: s(14),
    paddingVertical: vs(6),
    backgroundColor: '#fff',
  },
  trendingChipText: {
    fontSize: ms(13),
    color: '#333',
    fontFamily: 'MuktaMalar',
  },

  // ── Section Title (same as CommonSectionScreen) ───────────────────────────────
  sectionHeader: {
    backgroundColor: PALETTE.white,
    // paddingHorizontal: s(12),
    paddingTop: vs(14),
    paddingBottom: vs(10),
  },
  titleContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  sectionTitle: {
    fontFamily: FONTS.muktaMalar.bold,
    color: PALETTE.grey800,
  },
  sectionUnderline: {
    height: vs(3),
    width: '30%',
    backgroundColor: '#1565C0',
  },

  // ── Most Commented ───────────────────────────────────────────────────────────
  mostCommentedList: {
    backgroundColor: '#f2f2f2',
  },

  // ── Category tabs ────────────────────────────────────────────────────────────
  categoryWrap: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryScroll: {
    paddingHorizontal: s(8),
    alignItems: 'center',
  },
  catTab: {
    paddingHorizontal: s(10),
    paddingVertical: vs(10),
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
    marginRight: s(2),
  },
  catTabActive: {
    borderBottomColor: '#1565C0',
  },
  catTabText: {
    fontSize: ms(13),
    color: '#555',
    fontWeight: '400',
    fontFamily: 'MuktaMalar',
  },
  catTabTextActive: {
    color: '#1565C0',
    fontWeight: '700',
    fontFamily: 'MuktaMalar',
  },

  // ── Result card ──────────────────────────────────────────────────────────────
  listContent: {
    paddingBottom: vs(30),
    backgroundColor: '#f2f2f2',
    paddingTop: vs(8),
  },
  resultCard: {
    backgroundColor: '#fff',
    marginHorizontal: s(12),
    marginBottom: vs(10),
  },

  // ── FIX: use aspectRatio instead of fixed height so image never gets cut ──
  resultImageWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#e8e8e8',
    position: 'relative',
    overflow: 'hidden',
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },

  // ── FIX: play button at bottom-left matching screenshot ──
  playOverlay: {
    position: 'absolute',
    bottom: vs(8),
    left: s(8),
  },
  playCircle: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    backgroundColor: '#096dd2',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: s(2),
  },
  imageOverlay: {
    position: 'absolute',
    bottom: vs(5),
    left: s(5),
  },
  imageCircle: {
    width: s(30),
    height: s(30),
    borderRadius: s(15),
    backgroundColor: '#096dd2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reelsBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: vs(4),
    alignItems: 'center',
  },
  reelsBadgeText: {
    color: '#fff',
    fontSize: ms(11),
    fontWeight: '700',
    fontFamily: getFontFamily(700),
  },
  resultBody: {
    paddingHorizontal: s(14),
    paddingTop: vs(10),
    paddingBottom: vs(12),
  },
  resultTitle: {
    fontSize: ms(15),
    fontWeight: '700',
    color: '#111',
    lineHeight: ms(22),
    marginBottom: vs(8),
    fontFamily: getFontFamily(700),
  },
  catPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#bbb',
    paddingHorizontal: s(10),
    paddingVertical: vs(2),
    marginBottom: vs(8),
  },
  catPillText: {
    fontSize: ms(12),
    color: '#444',
    fontWeight: '500',
    fontFamily: getFontFamily(500),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaDate: {
    fontSize: ms(12),
    color: '#666',
    fontFamily: getFontFamily(400),
  },
  metaIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(3),
  },
  commentCount: {
    fontSize: ms(12),
    color: '#555',
    fontFamily: getFontFamily(400),
  },
  resultDivider: {
    height: 0,
  },

  // ── States ───────────────────────────────────────────────────────────────────
  loadMoreFooter: {
    paddingVertical: vs(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: s(24),
    gap: vs(12),
  },
  errorText: {
    fontSize: ms(14),
    color: '#c62828',
    textAlign: 'center',
    fontFamily: getFontFamily(400),
  },
  retryBtn: {
    backgroundColor: '#1565C0',
    paddingHorizontal: s(20),
    paddingVertical: vs(8),
    borderRadius: ms(20),
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: ms(13),
    fontFamily: getFontFamily(700),
  },
  emptyText: {
    fontSize: ms(14),
    color: '#999',
    marginTop: vs(8),
    fontFamily: getFontFamily(400),
  },

  // ── Scroll to top button ───────────────────────────────────────────────────────
  scrollTopBtn: {
    position: 'absolute',
    bottom: vs(50),
    right: s(16),
    width: s(42),
    height: s(42),
    borderRadius: s(21),
    backgroundColor: '#096dd2',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: vs(2) },
    shadowOpacity: 0.22,
    shadowRadius: s(4),
  },

  // ── Short Card Styles (Dinamalar mobile website style) ─────────────────────
  shortCardWrapper: {
    marginHorizontal: s(12),
    marginBottom: vs(10),
  },
  shortCard: {
    borderRadius: ms(20),
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  shortCardThumb: {
    width: '100%',
    aspectRatio: 9 / 16,
    position: 'relative',
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
  },
  shortCardImage: {
    width: '100%',
    height: '100%',
  },
  shortCardGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(0,0,0,0)',
    // simulated gradient with a dark bottom overlay
  },
  shortCardPlayWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shortCardPlayBtn: {
    width: s(52),
    height: s(52),
    borderRadius: s(26),
    backgroundColor: 'rgba(9,109,210,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: s(3),
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  shortCardDuration: {
    position: 'absolute',
    top: vs(8),
    right: s(8),
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
    borderRadius: ms(3),
  },
  shortCardDurationText: {
    color: '#fff',
    fontSize: ms(11),
    fontWeight: '600',
    fontFamily: getFontFamily(600),
  },
  shortCardTitleWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
  },
  shortCardTitle: {
    color: '#fff',
    fontSize: ms(13),
    fontWeight: '700',
    lineHeight: ms(19),
    fontFamily: getFontFamily(700),
  },
  shortCardTitleOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
  },
  shortCardBody: {
    paddingHorizontal: s(12),
    paddingVertical: vs(8),
    backgroundColor: '#fff',
  },
  shortCardPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#bbb',
    paddingHorizontal: s(8),
    paddingVertical: vs(2),
    marginBottom: vs(4),
  },
  shortCardPillText: {
    fontSize: ms(11),
    color: '#444',
    fontWeight: '500',
    fontFamily: getFontFamily(500),
  },
  shortCardDate: {
    fontSize: ms(11),
    color: '#666',
    fontFamily: getFontFamily(400),
  },
});

export default SearchScreen;