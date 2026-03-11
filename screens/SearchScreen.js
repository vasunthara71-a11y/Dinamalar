import React, { useState, useCallback, useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { s, vs } from '../utils/scaling';
import { ms } from 'react-native-size-matters';
import UniversalHeaderComponent from '../components/UniversalHeaderComponent';
import AppHeaderComponent from '../components/AppHeaderComponent';
import { mainApi, API_ENDPOINTS } from '../config/api';

// ─── Category Tab Config ──────────────────────────────────────────────────────
var SEARCH_CATEGORIES = [
  { id: 'all',     label: 'All',           filterKey: null },
  { id: 'news',    label: 'செய்திகள்',    filterKey: 'news' },
  { id: 'video',   label: 'வீடியோ',       filterKey: 'video' },
  { id: 'photo',   label: 'போட்டோ',       filterKey: 'photo' },
  { id: 'weblink', label: 'இணைப்பு மலர்', filterKey: 'weblink' },
  { id: 'world',   label: 'உலக தமிழ்',   filterKey: 'world' },
];

// ─── Time Ago Helper ──────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  if (!dateStr) return '';
  var date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  var diffMs  = Date.now() - date.getTime();
  var diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHrs < 1) {
    var diffMins = Math.floor(diffMs / (1000 * 60));
    return diffMins + ' minute(s) ago';
  }
  if (diffHrs < 24) return diffHrs + ' hour(s) ago';
  return Math.floor(diffHrs / 24) + ' day(s) ago';
}

// ─── Result Row Component ─────────────────────────────────────────────────────
var SearchResultItem = function(props) {
  var item    = props.item;
  var onPress = props.onPress;

  var isShorts = item.type === 'shorts' ||
                 (item.CatName && item.CatName.toLowerCase().indexOf('short') !== -1);
  var isVideo  = item.type === 'video' || !!item.VideoUrl || !!item.videourl;

  var title         = item.Title        || item.title        || item.Heading   || '';
  var summary       = item.Summary      || item.summary      || item.Content   || item.content  || '';
  var imageUrl      = item.ImageUrl     || item.imageurl     || item.Img       || item.img      || '';
  var pubDate       = item.PubDate      || item.pubdate      || item.Date      || item.date     || '';
  var catLabel      = item.CatName      || item.catname      || item.Category  || '';
  var hasAudio      = !!item.AudioUrl   || !!item.audiourl;
  var commentsCount = item.CommentCount || item.commentcount || 0;

  return (
    <TouchableOpacity
      style={styles.resultRow}
      onPress={function() { onPress && onPress(item); }}
      activeOpacity={0.8}
    >
      {/* Left: text */}
      <View style={styles.resultLeft}>
        <Text style={styles.resultTitle} numberOfLines={3}>{title}</Text>

        {/* Outlined badge — "ஷார்ட்ஸ்" or "தமிழகம்" */}
        {catLabel ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{catLabel}</Text>
          </View>
        ) : null}

        {summary ? (
          <Text style={styles.resultSummary} numberOfLines={2}>{summary}</Text>
        ) : null}

        {/* Footer: time + audio icon + comment count */}
        <View style={styles.resultFooter}>
          <Text style={styles.resultTime}>{timeAgo(pubDate)}</Text>
          <View style={styles.iconsRow}>
            {hasAudio ? (
              <Ionicons
                name="volume-medium-outline"
                size={ms(14)}
                color="#888"
                style={{ marginRight: s(8) }}
              />
            ) : null}
            {commentsCount > 0 ? (
              <View style={styles.commentWrap}>
                <Ionicons name="chatbubble-outline" size={ms(12)} color="#888" />
                <Text style={styles.commentCount}>{commentsCount}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {/* Right: thumbnail */}
      {imageUrl ? (
        <View style={styles.thumbWrap}>
          <Image source={{ uri: imageUrl }} style={styles.thumb} resizeMode="cover" />
          {isVideo ? (
            <View style={styles.videoIconOverlay}>
              <Ionicons name="videocam" size={ms(13)} color="#fff" />
            </View>
          ) : null}
          {isShorts ? (
            <View style={styles.shortsBar}>
              <Text style={styles.shortsBarText}>ஷார்ட்ஸ்</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
var SearchScreen = function() {
  var navigation = useNavigation();

  var sq = useState('');         var searchQuery = sq[0];      var setSearchQuery = sq[1];
  var sr = useState([]);         var searchResults = sr[0];    var setSearchResults = sr[1];
  var il = useState(false);      var isLoading = il[0];        var setIsLoading = il[1];
  var er = useState(null);       var error = er[0];            var setError = er[1];
  var hs = useState(false);      var hasSearched = hs[0];      var setHasSearched = hs[1];
  var ac = useState('all');      var activeCategory = ac[0];   var setActiveCategory = ac[1];
  var cc = useState({});         var categoryCounts = cc[0];   var setCategoryCounts = cc[1];

  var dv = useState(false);      var isDrawerVisible = dv[0];              var setIsDrawerVisible = dv[1];
  var lv = useState(false);      var isLocationDrawerVisible = lv[0];      var setIsLocationDrawerVisible = lv[1];
  var sd = useState('உள்ளூர்'); var selectedDistrict = sd[0];             var setSelectedDistrict = sd[1];

  var inputRef = useRef(null);

  var handleMenuPress = function(menuItem) {
    var link  = (menuItem && (menuItem.Link  || menuItem.link))  || '';
    var title = (menuItem && (menuItem.Title || menuItem.title)) || '';
    console.log('Menu:', title, link);
  };
  var goToSearch = function() {};
  var goToNotifs = function() { navigation && navigation.navigate('NotificationScreen'); };
  var handleSelectDistrict = function(district) {
    setSelectedDistrict(district.title);
    setIsLocationDrawerVisible(false);
    if (district.id) {
      navigation && navigation.navigate('DistrictNewsScreen', {
        districtId: district.id, districtTitle: district.title,
      });
    }
  };

  // ─── Search API ─────────────────────────────────────────────────────────────
  var performSearch = useCallback(function(query) {
    if (!query || !query.trim()) return;
    Keyboard.dismiss();
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setActiveCategory('all');

    mainApi.get(API_ENDPOINTS.SEARCH + '?search=' + encodeURIComponent(query.trim()))
      .then(function(response) {
        var data = response && response.data;
        var results = [];
        if (Array.isArray(data)) {
          results = data;
        } else if (data && Array.isArray(data.data)) {
          results = data.data;
        } else if (data && Array.isArray(data.results)) {
          results = data.results;
        } else if (data && Array.isArray(data.news)) {
          results = data.news;
        } else if (data && typeof data === 'object') {
          var vals = Object.values(data);
          for (var i = 0; i < vals.length; i++) {
            if (Array.isArray(vals[i])) { results = vals[i]; break; }
          }
        }
        setSearchResults(results);

        var counts = { all: results.length };
        SEARCH_CATEGORIES.slice(1).forEach(function(cat) {
          counts[cat.id] = results.filter(function(item) {
            var t = (item.type || item.Type || item.CatName || item.catname || '').toLowerCase();
            return t.indexOf(cat.filterKey) !== -1;
          }).length;
        });
        setCategoryCounts(counts);
      })
      .catch(function(err) {
        console.error('Search error:', err);
        setError('தேடல் தோல்வியடைந்தது. மீண்டும் முயற்சிக்கவும்.');
        setSearchResults([]);
      })
      .finally(function() { setIsLoading(false); });
  }, []);

  // ─── Filter results by active tab ──────────────────────────────────────────
  var filteredResults = React.useMemo(function() {
    if (activeCategory === 'all') return searchResults;
    var cat = SEARCH_CATEGORIES.find(function(c) { return c.id === activeCategory; });
    if (!cat || !cat.filterKey) return searchResults;
    return searchResults.filter(function(item) {
      var t = (item.type || item.Type || item.CatName || item.catname || '').toLowerCase();
      return t.indexOf(cat.filterKey) !== -1;
    });
  }, [searchResults, activeCategory]);

  var handleItemPress = function(item) {
    var newsId = item.NewsId || item.newsid || item.Id || item.id;
    if (newsId) navigation && navigation.navigate('DetailScreen', { newsId: newsId });
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
          onMenu={function() { setIsDrawerVisible(true); }}
          onLocation={function() { setIsLocationDrawerVisible(true); }}
          selectedDistrict="உள்ளூர்"
        />
      </UniversalHeaderComponent>

      {/* ══ SEARCH BAR: rounded input + mic + red pill button ══ */}
      <View style={styles.searchBarWrap}>
        <View style={styles.inputWrap}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Search..."
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={function() { performSearch(searchQuery); }}
            returnKeyType="search"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.micBtn}>
            <Ionicons name="mic-outline" size={ms(20)} color="#666" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={function() { performSearch(searchQuery); }}
          activeOpacity={0.85}
        >
          <Text style={styles.searchBtnText}>தேடு</Text>
        </TouchableOpacity>
      </View>

      {/* ══ CATEGORY ROW: "CATEGORY : All (488)  செய்திகள் (154) ..." ══ */}
      {hasSearched ? (
        <View style={styles.categoryWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            <View style={styles.categoryLabelWrap}>
              <Text style={styles.categoryLabelText}>CATEGORY :</Text>
            </View>
            {SEARCH_CATEGORIES.map(function(cat) {
              var isActive = activeCategory === cat.id;
              var count    = categoryCounts[cat.id];
              var label    = cat.label + (count !== undefined ? ' (' + count + ')' : '');
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catTab, isActive && styles.catTabActive]}
                  onPress={function() { setActiveCategory(cat.id); }}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.catTabText, isActive && styles.catTabTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      {/* ══ RESULTS ══ */}
      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color="#c62828" />
        </View>
      ) : error ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={function() { performSearch(searchQuery); }}>
            <Text style={styles.retryBtnText}>மீண்டும் முயற்சி</Text>
          </TouchableOpacity>
        </View>
      ) : hasSearched && filteredResults.length === 0 ? (
        <View style={styles.centerState}>
          <Ionicons name="search-outline" size={ms(48)} color="#ccc" />
          <Text style={styles.emptyText}>முடிவுகள் எதுவும் இல்லை</Text>
        </View>
      ) : (
        <FlatList
          data={filteredResults}
          keyExtractor={function(item, index) {
            return String(item.NewsId || item.newsid || item.Id || item.id || index);
          }}
          renderItem={function(info) {
            return <SearchResultItem item={info.item} onPress={handleItemPress} />;
          }}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={function() { return <View style={styles.separator} />; }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'android' ? vs(30) : 0,
  },

  // Search bar
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: s(14),
    paddingVertical: vs(10),
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    gap: s(10),
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: ms(25),
    backgroundColor: '#fff',
    paddingHorizontal: s(14),
    height: vs(44),
  },
  input: {
    flex: 1,
    fontSize: ms(14),
    color: '#111',
    paddingVertical: 0,
  },
  micBtn: {
    paddingLeft: s(6),
  },
  searchBtn: {
    backgroundColor: '#c62828',
    paddingHorizontal: s(22),
    height: vs(44),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: ms(25),
  },
  searchBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: ms(15),
  },

  // Category row
  categoryWrap: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryScroll: {
    paddingHorizontal: s(8),
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  categoryLabelWrap: {
    justifyContent: 'center',
    paddingRight: s(4),
    paddingVertical: vs(10),
  },
  categoryLabelText: {
    fontSize: ms(12),
    fontWeight: '700',
    color: '#333',
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
  },
  catTabTextActive: {
    color: '#1565C0',
    fontWeight: '700',
  },

  // List
  listContent: {
    paddingTop: vs(4),
    paddingBottom: vs(20),
    backgroundColor: '#fff',
  },
  separator: {
    height: 1,
    backgroundColor: '#ececec',
    marginHorizontal: s(14),
  },

  // Result row
  resultRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: s(14),
    paddingVertical: vs(14),
    backgroundColor: '#fff',
  },
  resultLeft: {
    flex: 1,
    paddingRight: s(10),
  },
  resultTitle: {
    fontSize: ms(14.5),
    fontWeight: '700',
    color: '#111',
    lineHeight: ms(21),
    marginBottom: vs(7),
  },

  // Outlined badge ("ஷார்ட்ஸ்", "தமிழகம்")
  badge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#bdbdbd',
    borderRadius: ms(3),
    paddingHorizontal: s(8),
    paddingVertical: vs(2),
    marginBottom: vs(7),
  },
  badgeText: {
    fontSize: ms(11.5),
    color: '#444',
    fontWeight: '500',
  },

  resultSummary: {
    fontSize: ms(12.5),
    color: '#555',
    lineHeight: ms(18),
    marginBottom: vs(6),
  },
  resultFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: vs(2),
  },
  resultTime: {
    fontSize: ms(11.5),
    color: '#888',
  },
  iconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s(3),
  },
  commentCount: {
    fontSize: ms(11),
    color: '#888',
  },

  // Thumbnail
  thumbWrap: {
    width: s(110),
    height: vs(82),
    borderRadius: ms(4),
    overflow: 'hidden',
    backgroundColor: '#e0e0e0',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  videoIconOverlay: {
    position: 'absolute',
    top: vs(4),
    left: s(4),
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: ms(3),
    padding: s(3),
  },
  shortsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.62)',
    paddingVertical: vs(3),
    alignItems: 'center',
  },
  shortsBarText: {
    color: '#fff',
    fontSize: ms(10),
    fontWeight: '700',
  },

  // States
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
  },
  retryBtn: {
    backgroundColor: '#c62828',
    paddingHorizontal: s(20),
    paddingVertical: vs(8),
    borderRadius: ms(20),
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: ms(13),
  },
  emptyText: {
    fontSize: ms(14),
    color: '#999',
    marginTop: vs(8),
  },
});

export default SearchScreen;